import { DE_DONDE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { faltaColumna } from "@/lib/supabase/compat";

/* EL VIGILANTE.
 *
 * Un Co-Work que no trabaja para ti: trabaja para Kairo. Cada día mira
 * que todo lo de debajo siga en pie y, si algo se ha caído, te lo deja
 * escrito con el botón exacto que hay que pulsar.
 *
 * Nace de tres días perdidos. La pantalla decía "usuario o contraseña
 * incorrecta" y el fallo estaba en una variable de entorno; nadie
 * miraba, porque nadie sabía que había que mirar. Un proyecto de
 * Supabase gratis además se pausa solo a la semana sin usarlo, y cuando
 * se pausa la web entera deja de dejar entrar sin decir por qué.
 *
 * Dos reglas:
 *
 *  1. SI TODO ESTÁ BIEN, SE CALLA. Un aviso diario que casi siempre dice
 *     "todo correcto" se deja de leer a la semana, y el día que dice
 *     otra cosa tampoco se lee. Cuando todo va, se apunta y ya está;
 *     solo cuando algo va mal te escribe.
 *  2. NO ARREGLA LO QUE NO DEBE. Puede reintentar un trabajo fallido y
 *     limpiar uno atascado, porque eso es suyo. No toca variables de
 *     entorno ni ejecuta SQL por su cuenta: un agente con permiso para
 *     cambiar la configuración sin que nadie mire es exactamente cómo se
 *     pierde una base de datos un domingo por la noche.
 */

export type Gravedad = "bien" | "aviso" | "roto";

export type Punto = {
  /** Qué se ha mirado. */
  que: string;
  gravedad: Gravedad;
  /** Qué se ha encontrado. */
  detalle: string;
  /** Qué hay que hacer, si hay que hacer algo. En una línea. */
  arreglo?: string;
};

export type Revision = {
  gravedad: Gravedad;
  puntos: Punto[];
  /** El informe en markdown, listo para enseñar. */
  texto: string;
  /** Lo que ha arreglado por su cuenta. */
  arreglado: string[];
};

/* Lo que tiene que existir en la base de datos, y qué se rompe si falta.
   Es la misma lista que /api/estado, pero aquí sirve para avisar sin que
   nadie abra nada. */
const MIGRACIONES: { archivo: string; tabla: string; columna: string; si_falta: string }[] = [
  {
    archivo: "0003_mentes.sql",
    tabla: "mentes",
    columna: "id",
    si_falta: "no se pueden crear Mentes",
  },
  {
    archivo: "0005_historial.sql",
    tabla: "conversaciones",
    columna: "actualizada_el",
    si_falta: "la barra lateral sale vacía y las respuestas no se guardan",
  },
  {
    archivo: "0006_pagos.sql",
    tabla: "suscripciones",
    columna: "id",
    si_falta: "los pagos no cambian el plan de nadie",
  },
  {
    archivo: "0007_fuentes.sql",
    tabla: "mensajes",
    columna: "fuentes",
    si_falta: "las fuentes desaparecen al reabrir la conversación",
  },
  {
    archivo: "0008_gist_y_paperwork.sql",
    tabla: "fichas",
    columna: "id",
    si_falta: "Gist y Paperwork no guardan nada",
  },
  {
    archivo: "0009_coworks.sql",
    tabla: "coworks",
    columna: "hora",
    si_falta: "no hay Co-Works: nada se ejecuta solo",
  },
];

/** Una consulta a medio construir. Se puede filtrar, ordenar y cortar, y
 *  en cualquier momento se puede esperar: es lo que hace el cliente de
 *  Supabase, escrito aquí a mano para poder pasar uno de mentira en las
 *  pruebas. */
type Consulta = PromiseLike<{ data?: unknown; error?: unknown }> & {
  eq: (columna: string, valor: unknown) => Consulta;
  order: (columna: string, opciones: { ascending: boolean }) => Consulta;
  limit: (n: number) => Consulta;
};

/** Un cliente con permisos de servidor. Se pasa para poder probarlo. */
type Admin = {
  from: (tabla: string) => { select: (columnas: string) => Consulta };
  rpc: (nombre: string, args?: unknown) => PromiseLike<{ data?: unknown; error?: unknown }>;
};

export type Entorno = {
  /** Para poder probar sin salir a internet. */
  buscar?: typeof fetch;
  /** El "ahora", para poder fijarlo en las pruebas. */
  ahora?: Date;
  /** Las claves, por si se quieren fingir. */
  claves?: Record<string, string | undefined>;
  /* El Co-Work que está ejecutando ESTA revisión. No se le mira si lleva
     mucho sin ejecutarse, porque se está ejecutando ahora mismo: su
     `ultima_vez` todavía no se ha escrito y sin esto la propia revisión
     que demuestra que el reloj funciona diría que el reloj está muerto. */
  yo?: string;
};

const peor = (a: Gravedad, b: Gravedad): Gravedad => {
  const orden: Gravedad[] = ["bien", "aviso", "roto"];
  return orden[Math.max(orden.indexOf(a), orden.indexOf(b))];
};

/* --------------------------------------------------------------
   1. ¿Está Supabase ahí?
   -------------------------------------------------------------- */

async function miraSupabase(env: Entorno): Promise<Punto> {
  const buscar = env.buscar ?? fetch;

  if (!SUPABASE_URL) {
    return {
      que: "Supabase",
      gravedad: "roto",
      detalle: "No hay dirección configurada: la web está en modo demo.",
      arreglo: "Pon NEXT_PUBLIC_SUPABASE_URL en Vercel y vuelve a desplegar.",
    };
  }

  try {
    const r = await buscar(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (r.ok) {
      return { que: "Supabase", gravedad: "bien", detalle: "Responde con normalidad." };
    }

    if (r.status === 401) {
      return {
        que: "Supabase",
        gravedad: "roto",
        detalle: "El proyecto responde pero rechaza la clave.",
        arreglo:
          "La clave anon es de OTRO proyecto. Cópiala otra vez de Supabase → Settings → API.",
      };
    }

    /* 503 y compañía: lo que devuelve un proyecto gratuito pausado. Se
       pausan solos a los siete días sin usarlos, y es la causa número
       uno de "la web ha dejado de funcionar sola". */
    return {
      que: "Supabase",
      gravedad: "roto",
      detalle: `El proyecto contesta ${r.status}. Lo más normal: está PAUSADO.`,
      arreglo: "Entra en supabase.com/dashboard y pulsa «Restore project».",
    };
  } catch {
    return {
      que: "Supabase",
      gravedad: "roto",
      detalle: "No se ha podido conectar con la dirección configurada.",
      arreglo:
        "Comprueba NEXT_PUBLIC_SUPABASE_URL en Vercel: tiene que ser https://<tu-proyecto>.supabase.co, sin espacios ni barra final.",
    };
  }
}

/* --------------------------------------------------------------
   1 bis. ¿Están las variables donde se espera?
   -------------------------------------------------------------- */

/* La app encuentra la dirección y la clave aunque estén cruzadas o con
   otro nombre, así que esto no rompe nada. Pero conviene saberlo: el día
   que alguien mire la configuración va a ver una cosa donde esperaba
   otra, y ahí se pierde una tarde. */
function miraLosNombres(): Punto[] {
  if (!SUPABASE_URL) return [];

  const enSuSitio =
    DE_DONDE.url === "NEXT_PUBLIC_SUPABASE_URL" &&
    DE_DONDE.clave === "NEXT_PUBLIC_SUPABASE_ANON_KEY";

  if (enSuSitio) return [];

  const cruzadas =
    DE_DONDE.url === "NEXT_PUBLIC_SUPABASE_ANON_KEY" ||
    DE_DONDE.clave === "NEXT_PUBLIC_SUPABASE_URL";

  return [
    {
      que: "Los nombres de las variables",
      gravedad: "aviso",
      detalle: cruzadas
        ? `Están CRUZADAS: la dirección está en ${DE_DONDE.url} y la clave en ${DE_DONDE.clave}. Kairo las ha descruzado él solo y funciona.`
        : `La dirección está en ${DE_DONDE.url || "ninguna de las conocidas"} y la clave en ${DE_DONDE.clave || "ninguna de las conocidas"}. Funciona, pero no son los nombres de siempre.`,
      arreglo:
        "En Vercel → Settings → Environment Variables: la dirección en NEXT_PUBLIC_SUPABASE_URL y la clave en NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    },
  ];
}

/* --------------------------------------------------------------
   2. ¿Está la base de datos al día?
   -------------------------------------------------------------- */

async function miraMigraciones(admin: Admin): Promise<Punto[]> {
  const puntos: Punto[] = [];

  /* Las seis preguntas no dependen unas de otras, así que van a la vez:
     en fila eran seis viajes a Supabase seguidos dentro del minuto que
     tiene la función para hacer el Co-Work entero. */
  const respuestas = await Promise.all(
    MIGRACIONES.map((m) => admin.from(m.tabla).select(m.columna).limit(1)),
  );

  for (const [i, m] of MIGRACIONES.entries()) {
    const { error } = respuestas[i];

    if (!error) continue;

    if (faltaColumna(error as never)) {
      puntos.push({
        que: `Migración ${m.archivo}`,
        gravedad: "roto",
        detalle: `Sin pegar: ${m.si_falta}.`,
        arreglo: `Supabase → SQL Editor → pega supabase/migrations/${m.archivo} → Run.`,
      });
    } else {
      puntos.push({
        que: `Migración ${m.archivo}`,
        gravedad: "aviso",
        detalle: `No se ha podido comprobar: ${String((error as { message?: string })?.message ?? "").slice(0, 80)}`,
      });
    }
  }

  if (!puntos.length) {
    puntos.push({
      que: "Base de datos",
      gravedad: "bien",
      /* "las que se comprueban", no "las migraciones": aquí se miran
         seis de las diez, porque las otras no añaden ninguna columna
         por la que se pueda preguntar. Decir "las 6 migraciones están
         puestas" hace creer que no falta ninguna. */
      detalle: `Las ${MIGRACIONES.length} migraciones que se comprueban están puestas.`,
    });
  }

  return puntos;
}

/* --------------------------------------------------------------
   3. ¿Hay con qué contestar?
   -------------------------------------------------------------- */

function miraCerebros(env: Entorno): Punto {
  const claves = env.claves ?? process.env;
  const puestos = [
    ["Gemini", claves.GEMINI_API_KEY],
    ["Claude", claves.ANTHROPIC_API_KEY],
    ["GPT", claves.OPENAI_API_KEY],
    ["el de repuesto", claves.KAIRO_EXTRA_KEY],
  ].filter(([, v]) => (v ?? "").trim().length > 0);

  if (!puestos.length) {
    return {
      que: "Cerebros",
      gravedad: "roto",
      detalle: "No hay ninguna clave de IA puesta: Kairo no puede contestar nada.",
      arreglo: "Pon al menos GEMINI_API_KEY en Vercel y vuelve a desplegar.",
    };
  }

  return {
    que: "Cerebros",
    gravedad: "bien",
    detalle: `Conectados: ${puestos.map(([n]) => n).join(", ")}.`,
  };
}

/* --------------------------------------------------------------
   4. ¿Puede Kairo trabajar solo?
   -------------------------------------------------------------- */

function miraAutomatismo(env: Entorno): Punto[] {
  const claves = env.claves ?? process.env;
  const puntos: Punto[] = [];

  if (!(claves.CRON_SECRET ?? "").trim()) {
    puntos.push({
      que: "El reloj",
      gravedad: "roto",
      detalle: "Falta CRON_SECRET: la puerta del reloj está cerrada para todos.",
      arreglo: "Pon CRON_SECRET en Vercel (una contraseña larga que te inventes).",
    });
  }

  if (!(claves.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()) {
    puntos.push({
      que: "La llave del servidor",
      gravedad: "roto",
      detalle: "Falta SUPABASE_SERVICE_ROLE_KEY: nada se puede ejecutar sin ti delante.",
      arreglo: "Cópiala de Supabase → Settings → API y ponla en Vercel (sin NEXT_PUBLIC_).",
    });
  }

  return puntos;
}

/* --------------------------------------------------------------
   5. ¿Se está quedando algo colgado?
   -------------------------------------------------------------- */

type FilaResultado = {
  id: string;
  cowork_id: string;
  estado: string;
  dia: string;
  creado_el: string;
};

type FilaCowork = {
  id: string;
  nombre: string;
  activo: boolean;
  ultima_vez: string | null;
  creado_el: string;
};

async function miraLosTrabajos(
  admin: Admin,
  perfil: string,
  env: Entorno,
): Promise<{ puntos: Punto[]; arreglado: string[] }> {
  const ahora = env.ahora ?? new Date();
  const puntos: Punto[] = [];
  const arreglado: string[] = [];

  /* Solo TUS trabajos. Esto va con la llave del servidor, que se salta
     la seguridad a nivel de fila, así que el filtro hay que ponerlo
     aquí a mano: sin él el informe se construye con los Co-Works de
     todas las cuentas y acaba nombrando los de otra gente en tu chat.
     Y ordenados por fecha: con `limit` y sin `order`, en cuanto hay más
     de doscientas filas vuelven doscientas cualesquiera —en la práctica
     las más viejas— y lo de anoche no se ve. */
  const { data: filas, error } = await admin
    .from("cowork_resultados")
    .select("id, cowork_id, estado, dia, creado_el")
    .eq("perfil_id", perfil)
    .order("creado_el", { ascending: false })
    .limit(200);

  if (error) return { puntos, arreglado };

  const resultados = (filas ?? []) as FilaResultado[];
  const horas = (iso: string) => (ahora.getTime() - new Date(iso).getTime()) / 3_600_000;

  /* Atascados: alguien empezó y no terminó. A la hora ya no es que vaya
     lento, es que se cayó. Se sueltan para que se vuelvan a intentar:
     esto sí es suyo y sí se arregla solo. */
  const atascados = resultados.filter((r) => r.estado === "ejecutando" && horas(r.creado_el) > 1);
  if (atascados.length) {
    const { error: fallo } = await admin.rpc("soltar_coworks_atascados", { p_horas: 1, p_perfil: perfil });
    if (!fallo) {
      arreglado.push(
        `${atascados.length} trabajo(s) que se habían quedado a medias, sueltos para reintentarse.`,
      );
    } else {
      puntos.push({
        que: "Trabajos atascados",
        gravedad: "aviso",
        detalle: `${atascados.length} llevan más de una hora sin terminar.`,
      });
    }
  }

  // Fallos recientes: no se arreglan solos, pero hay que decirlo.
  const fallidos = resultados.filter((r) => r.estado === "error" && horas(r.creado_el) < 72);
  if (fallidos.length >= 2) {
    puntos.push({
      que: "Co-Works que fallan",
      gravedad: "aviso",
      detalle: `${fallidos.length} intentos fallidos en los últimos tres días.`,
      arreglo: "Ábrelos en Co-Works y pulsa «Probar ahora» para ver el motivo.",
    });
  }

  // Un reloj muerto: encargos encendidos que llevan días sin ejecutarse.
  const { data: lista } = await admin
    .from("coworks")
    .select("id, nombre, activo, ultima_vez, creado_el")
    .eq("perfil_id", perfil)
    .order("creado_el", { ascending: false })
    .limit(100);

  /* Fuera el que está ejecutando esta misma revisión: su `ultima_vez` se
     escribe al terminar, así que ahora mismo sigue diciendo "nunca". */
  const coworks = ((lista ?? []) as FilaCowork[]).filter((c) => c.activo && c.id !== env.yo);
  const dormidos = coworks.filter((c) => {
    const referencia = c.ultima_vez ?? c.creado_el;
    return horas(referencia) > 36;
  });

  if (dormidos.length && dormidos.length === coworks.length) {
    puntos.push({
      que: "El reloj",
      gravedad: "roto",
      detalle: "Ningún Co-Work se ha ejecutado en más de día y medio: el reloj no está sonando.",
      arreglo:
        "Mira GitHub → Actions → «Co-Works de Kairo». Si sale en rojo, revisa los secretos KAIRO_URL y KAIRO_CRON_SECRET.",
    });
  } else if (dormidos.length) {
    puntos.push({
      que: "Co-Works dormidos",
      gravedad: "aviso",
      detalle: `${dormidos.length} llevan más de día y medio sin ejecutarse: ${dormidos
        .map((c) => c.nombre)
        .slice(0, 3)
        .join(", ")}.`,
    });
  }

  return { puntos, arreglado };
}

/* --------------------------------------------------------------
   El informe
   -------------------------------------------------------------- */

const ICONO: Record<Gravedad, string> = { bien: "✅", aviso: "⚠️", roto: "❌" };

function informe(
  puntos: Punto[],
  arreglado: string[],
  gravedad: Gravedad,
  completo: boolean,
): string {
  if (gravedad === "bien" && !arreglado.length) {
    /* Y si no se ha podido mirar todo, no se dice que todo está bien: se
       dice qué se ha mirado. Un "todo en orden" que en realidad
       significa "lo que he podido ver" es peor que no revisar nada. */
    return completo
      ? "Todo en orden. Supabase responde, la base de datos está al día y los encargos se están ejecutando."
      : "De lo que he podido mirar, todo en orden. La base de datos y los encargos no se pueden comprobar sin la sesión iniciada.";
  }

  const roto = puntos.filter((p) => p.gravedad === "roto");
  const aviso = puntos.filter((p) => p.gravedad === "aviso");

  let texto =
    gravedad === "roto"
      ? "**Hay algo roto.** Esto no se arregla solo:\n\n"
      : "**Nada grave, pero conviene mirarlo.**\n\n";

  for (const p of [...roto, ...aviso]) {
    texto += `${ICONO[p.gravedad]} **${p.que}** — ${p.detalle}\n`;
    if (p.arreglo) texto += `   → ${p.arreglo}\n`;
    texto += "\n";
  }

  if (arreglado.length) {
    texto += "**Esto ya lo he arreglado yo:**\n";
    for (const a of arreglado) texto += `- ${a}\n`;
    texto += "\n";
  }

  const bien = puntos.filter((p) => p.gravedad === "bien");
  if (bien.length) {
    texto += `_En orden: ${bien.map((p) => p.que.toLowerCase()).join(", ")}._`;
  }

  return texto.trim();
}

/** Mira que todo siga en pie y cuenta qué ha encontrado.
 *
 *  `perfil` va aparte del cliente a propósito: cuando el que se pasa es
 *  el del reloj, lleva la llave del servidor y se salta la seguridad a
 *  nivel de fila, así que quien llama tiene que decir de quién es la
 *  revisión o el informe saldría con los Co-Works de todo el mundo.
 *
 *  Y los dos admiten nulo, que es el caso que más falta hace: cuando la
 *  web está en modo demo no hay base de datos a la que preguntar, y es
 *  justo entonces cuando uno necesita que algo le diga por qué. Sin
 *  cliente se mira lo que no necesita base de datos —que es dónde está
 *  el fallo cuando no hay base de datos— y se calla el resto. */
export async function revisarSalud(
  admin: Admin | null,
  perfil: string | null,
  env: Entorno = {},
): Promise<Revision> {
  const puntos: Punto[] = [];
  const arreglado: string[] = [];

  puntos.push(await miraSupabase(env));
  puntos.push(...miraLosNombres());
  if (admin) puntos.push(...(await miraMigraciones(admin)));
  puntos.push(miraCerebros(env));
  puntos.push(...miraAutomatismo(env));

  const trabajos =
    admin && perfil
      ? await miraLosTrabajos(admin, perfil, env)
      : { puntos: [], arreglado: [] };
  puntos.push(...trabajos.puntos);
  arreglado.push(...trabajos.arreglado);

  const gravedad = puntos.reduce<Gravedad>((peorHasta, p) => peor(peorHasta, p.gravedad), "bien");

  const completo = Boolean(admin && perfil);

  return { gravedad, puntos, texto: informe(puntos, arreglado, gravedad, completo), arreglado };
}

/** El título de la conversación que deja cuando hay algo que contar. */
export function tituloDeLaRevision(gravedad: Gravedad, hoy: Date, zona: string): string {
  const dia = new Intl.DateTimeFormat("es-ES", {
    timeZone: zona,
    day: "numeric",
    month: "short",
  }).format(hoy);

  return `${gravedad === "roto" ? "⚠️ Algo está roto" : "Revisión"} · ${dia}`;
}
