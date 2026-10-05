import { DE_DONDE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { faltaColumna, faltaFuncion } from "@/lib/supabase/compat";

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
  {
    archivo: "0012_memoria.sql",
    tabla: "recuerdos",
    columna: "texto",
    si_falta: "Kairo no puede acordarse de nada tuyo",
  },
  {
    archivo: "0013_telegram.sql",
    tabla: "perfiles",
    columna: "telegram_chat_id",
    si_falta: "los Co-Works no se pueden mandar al móvil",
  },
  {
    archivo: "0014_plazos.sql",
    tabla: "avisos_papel",
    columna: "hito",
    si_falta: "nadie te avisa de que un papel está a punto de vencer",
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
    /* Decir cuál de las dos ha llegado y cuál no ahorra media tarde: no
       es lo mismo "no has puesto nada" que "has puesto una y falta la
       otra", y desde fuera se ven igual: modo demo. */
    const hayClave = Boolean(SUPABASE_ANON_KEY);

    /* Y el caso que de verdad pasa, y que costó días encontrar: en la
       casilla de la dirección hay una CLAVE. Son dos cajas seguidas y
       las dos se rellenan pegando; pegar la de al lado es de un
       segundo. Desde fuera no se distingue de "no la has puesto", pero
       se arregla distinto, así que hay que decirlo con esas palabras.

       No se puede descruzar sola, ojo: cuando las dos casillas llevan
       una clave, la dirección no está en ninguna parte. No hay nada que
       rescatar, solo que pedirla. */
    const enSuCasilla = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
    const claveEnLaCasillaDeLaUrl = /^(eyj|sb_|sbp_|sbs_)/i.test(enSuCasilla);

    if (claveEnLaCasillaDeLaUrl) {
      return {
        que: "Supabase",
        gravedad: "roto",
        detalle:
          "En NEXT_PUBLIC_SUPABASE_URL hay una CLAVE, no una dirección. Por eso la web está en modo demo: no sabe con qué servidor hablar.",
        arreglo:
          "Coge la dirección en Supabase → Settings → API → «Project URL» (tiene esta forma: https://algo.supabase.co). " +
          "En Vercel → Settings → Environment Variables, abre NEXT_PUBLIC_SUPABASE_URL, borra lo que hay y pega ESA dirección. " +
          "Y después Deployments → los tres puntos → Redeploy.",
      };
    }

    return {
      que: "Supabase",
      gravedad: "roto",
      detalle: hayClave
        ? "La clave sí ha llegado, pero la dirección no. La web está en modo demo."
        : "No han llegado ni la dirección ni la clave. La web está en modo demo.",
      /* Y lo de volver a desplegar no es un detalle: estas dos variables
         se meten DENTRO del código al compilarlo, así que ponerlas y no
         redesplegar no cambia absolutamente nada. Es el motivo número
         uno de "ya la he puesto y sigue igual". */
      arreglo:
        "Vercel → Settings → Environment Variables → NEXT_PUBLIC_SUPABASE_URL" +
        (hayClave ? "" : " y NEXT_PUBLIC_SUPABASE_ANON_KEY") +
        ", con «Production» marcado. Y DESPUÉS vuelve a desplegar (Deployments → los tres puntos → Redeploy): estas dos se meten dentro de la web al compilarla, así que ponerlas sin redesplegar no cambia nada.",
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

  /* La 0011 no añade ninguna columna por la que preguntar: añade
     funciones. Así que se le llama, con un encargo que no existe. Lo
     que devuelva da igual —va a fallar seguro— y lo único que se mira
     es CÓMO falla: si la función no está, el error lo dice; si está, el
     error es otro (que ese encargo no es tuyo) y con eso basta. No toca
     nada: sin encargo que reservar, no hay nada que escribir. */
  {
    const { error } = await admin.rpc("reservar_mi_cowork", {
      p_cowork: "00000000-0000-0000-0000-000000000000",
    });

    if (faltaFuncion(error as never)) {
      puntos.push({
        que: "Migración 0011_coworks_a_mano.sql",
        gravedad: "aviso",
        detalle:
          "Sin pegar: «Probar ahora» necesita la llave del servidor, y los tipos nuevos de Co-Work no se pueden crear.",
        arreglo:
          "Supabase → SQL Editor → pega supabase/migrations/0011_coworks_a_mano.sql → Run.",
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

  /* Cuántas claves de Gemini hay. En la capa gratuita la cuota va por
     clave, así que tener una sola es tener un momento del día en que
     Kairo se queda sin buscar. Decirlo aquí es la única forma de que se
     entere alguien antes de que pase. */
  const deGemini = [
    claves.GEMINI_API_KEY,
    claves.GEMINI_API_KEY_2,
    claves.GEMINI_API_KEY_3,
    ...(claves.GEMINI_API_KEYS ?? "").split(","),
  ].filter((v) => { const t = (v ?? "").trim(); return t.length > 0 && !/\s/.test(t); }).length;

  const puestos = [
    ["Gemini" + (deGemini > 1 ? ` (${deGemini} claves)` : ""), claves.GEMINI_API_KEY],
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
    detalle:
      `Conectados: ${puestos.map(([n]) => n).join(", ")}.` +
      (deGemini === 1 && !(claves.ANTHROPIC_API_KEY ?? "").trim()
        ? " Con una sola clave de Gemini y sin Claude, el día que se agote la cuota gratuita Kairo deja de poder buscar."
        : ""),
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
   4 bis. ¿Puede entrar alguien que no seas tú?
   -------------------------------------------------------------- */

/* EL FALLO QUE NO SE VE DESDE DENTRO.
 *
 * Vercel trae un portero propio (Settings → Deployment Protection) y en
 * los proyectos nuevos viene ENCENDIDO: la web solo deja pasar a quien
 * tenga sesión en esa cuenta de Vercel. Para el dueño es invisible —él
 * siempre la tiene, a él le abre siempre— y para todos los demás la web
 * sencillamente no existe: ni un amigo al que le pasas el enlace, ni el
 * reloj de GitHub, ni nadie.
 *
 * Costó una tarde entera, y encima disfrazado: el reloj respondía 401,
 * que se lee como «la contraseña no coincide». La contraseña estaba
 * bien. La llamada ni siquiera llegaba a Kairo.
 *
 * Comprobarlo es llamar a la propia web desde fuera de la sesión, que es
 * lo que hace cualquiera que no seas tú. */
async function miraLaPuerta(env: Entorno): Promise<Punto[]> {
  const claves = env.claves ?? process.env;
  const buscar = env.buscar ?? fetch;

  /* Esta variable la pone Vercel. En local no existe, y en local no hay
     ningún portero que mirar. */
  const dominio = (claves.VERCEL_PROJECT_PRODUCTION_URL ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  if (!dominio) return [];

  try {
    const r = await buscar(`https://${dominio}/favicon.ico`, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    /* Un 404 vale lo mismo que un 200: significa que la llamada ha
       pasado la calle y ha llegado a la web. Lo único que delata al
       portero es que te pare él. */
    if (r.status !== 401 && r.status !== 403) return [];

    const cuerpo = await r.text().catch(() => "");
    if (!/vercel[_ ]?auth|protected by vercel|protected deployment|_vercel\/sso/i.test(cuerpo)) {
      return [];
    }

    return [
      {
        que: "La puerta de la calle",
        gravedad: "roto",
        detalle:
          "Vercel tiene la web en modo privado: solo entra quien tenga sesión en tu cuenta de Vercel. " +
          "A ti te abre siempre, así que no se nota, pero nadie más puede usar Kairo. " +
          "El reloj de GitHub tampoco: responde 401, que parece un fallo de contraseña y no lo es.",
        arreglo:
          "Vercel → el proyecto → Settings → Deployment Protection → Vercel Authentication: apaga el interruptor «Require Log In» y dale a Save. " +
          "Es inmediato, no hace falta volver a desplegar. Para comprobarlo, abre la web en una ventana de incógnito.",
      },
    ];
  } catch {
    /* Si la llamada no ha salido, callarse. No haber podido mirar no es
       lo mismo que saber que está puesto, y un aviso rojo por una
       llamada fallida hace desconfiar de todo el informe. */
    return [];
  }
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

  /* Las dos llamadas a internet, a la vez. Son independientes y en
     serie se notaban: esta pantalla se abre con prisa. */
  const [supabase, puerta] = await Promise.all([miraSupabase(env), miraLaPuerta(env)]);
  puntos.push(supabase);
  puntos.push(...puerta);
  puntos.push(...miraLosNombres());

  /* Si Supabase no contesta, preguntarle por las migraciones da seis
     líneas de "no se ha podido comprobar: fetch failed" que no dicen
     nada que no diga ya la de arriba. Un diagnóstico con seis líneas
     de ruido no se lee, y la que importa se pierde entre ellas. */
  /* Y sin sesión tampoco se le pregunta a la base de datos.
 
     Esta pantalla se abre a propósito sin haber entrado —el día que
     hace falta es justo el día que no puedes entrar— y `anon` no tiene
     permiso sobre estas tablas. Preguntárselo igual devuelve "permission
     denied", que no es "falta la migración" pero tampoco se distingue de
     ella: salían seis avisos amarillos y un "conviene mirarlo" en una
     instalación perfectamente sana. */
  const miroLaBase = Boolean(admin) && Boolean(perfil) && supabase.gravedad !== "roto";
  if (miroLaBase) {
    puntos.push(...(await miraMigraciones(admin as Admin)));
  } else if (admin && perfil) {
    /* Pero se dice que no se ha mirado. Callarlo sería peor que el
       ruido: un proyecto pausado taparía una migración que falta de
       verdad, y al restaurarlo seguiría sin funcionar sin saber por qué. */
    puntos.push({
      que: "La base de datos",
      gravedad: "aviso",
      detalle: "No se ha podido comprobar: primero hay que arreglar lo de arriba.",
    });
  }

  puntos.push(miraCerebros(env));
  puntos.push(...miraAutomatismo(env));

  const trabajos =
    miroLaBase && perfil
      ? await miraLosTrabajos(admin as Admin, perfil, env)
      : { puntos: [], arreglado: [] };
  puntos.push(...trabajos.puntos);
  arreglado.push(...trabajos.arreglado);

  const gravedad = puntos.reduce<Gravedad>((peorHasta, p) => peor(peorHasta, p.gravedad), "bien");

  const completo = miroLaBase;

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
