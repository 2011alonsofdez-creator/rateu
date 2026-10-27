import { GoogleGenAI } from "@google/genai";
import { clavesDeGemini } from "@/lib/ia/claves";
import { testigoValido } from "@/lib/telegram";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase, pistaDeUrl } from "@/lib/supabase/config";
import { cadenaDe, proveedoresActivos } from "@/lib/ia/config";
import { hayBuscadorPagado, modeloDeBusqueda } from "@/lib/ia/buscar-web";
import { claveExtra, EXTRA_URL, modelosExtra, puedeBuscar } from "@/lib/ia/proveedores";
import { PRODUCTOS, enlaceDe, hayTienda, secretoWebhook } from "@/lib/pagos/config";
import { clienteServidor } from "@/lib/supabase/server";
import { faltaColumna } from "@/lib/supabase/compat";

export const runtime = "nodejs";
export const maxDuration = 30;
/* Nada de guardar esta página en ninguna parte. Es un diagnóstico: si el
   navegador te enseña la de hace diez minutos mientras persigues un fallo,
   te hace perder la tarde buscando algo que ya habías arreglado. */
export const dynamic = "force-dynamic";

/* Diagnóstico. Dice QUÉ variables han llegado, nunca su contenido:
   solo verdadero/falso, la longitud y el dominio, que de todas formas
   va dentro del código que se descarga el navegador.
   Ninguna clave sale de aquí. */

const corto = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

/* A cada proveedor se le pregunta qué modelos acepta ESTA clave, en vez
   de fiarse de una lista escrita a mano que se queda vieja en un mes.
   Es lo que te dice qué poner en KAIRO_MODELO_* si un nombre no existe. */
async function modelosDeGemini(clave: string) {
  const ia = new GoogleGenAI({ apiKey: clave });
  const lista: string[] = [];
  for await (const m of await ia.models.list()) {
    if (m.name) lista.push(m.name.replace(/^models\//, ""));
    if (lista.length >= 80) break;
  }
  return lista.filter((n) => n.includes("gemini")).slice(0, 40);
}

async function modelosDeClaude(clave: string) {
  const cliente = new Anthropic({ apiKey: clave });
  const pagina = await cliente.models.list({ limit: 40 });
  return pagina.data.map((m) => m.id);
}

async function modelosDeGpt(clave: string) {
  const cliente = new OpenAI({ apiKey: clave });
  const pagina = await cliente.models.list();
  return pagina.data
    .map((m) => m.id)
    .filter((id) => /^(gpt|o\d)/i.test(id))
    .sort()
    .slice(0, 40);
}

/* Al proveedor de repuesto también se le pregunta qué ofrece. Es lo que
   te dice qué escribir en KAIRO_EXTRA_MODELOS: copiar un nombre de su
   web es la forma más fácil de equivocarse. */
async function modelosDelExtra(clave: string, url: string) {
  const cliente = new OpenAI({ apiKey: clave, baseURL: url });
  const pagina = await cliente.models.list();
  return pagina.data.map((m) => m.id).sort();
}

/* ¿LA CLAVE SIRVE, O SOLO ESTÁ PUESTA?
 *
 * No es lo mismo, y confundirlo costó una vuelta entera: esta pantalla
 * decía "clave sí" porque la variable tenía letras, y además conseguía
 * listar los modelos del proveedor... pero el catálogo de OpenRouter es
 * PÚBLICO. Se lee sin clave. Así que las dos señales que parecían
 * confirmar que todo estaba bien no probaban nada, y la primera noticia
 * de que la clave no valía fue un 401 en la cara del usuario.
 *
 * Esto llama a un sitio que SÍ exige credencial. Si el proveedor no
 * tiene esa puerta, se dice que no se ha podido comprobar en vez de
 * inventarse un aprobado. */
export function veredictoDeClave(estado: number): "valida" | "rechazada" | "no_comprobable" {
  if (estado === 200) return "valida";
  if (estado === 401 || estado === 403) return "rechazada";
  return "no_comprobable";
}

async function pruebaLaClaveExtra(clave: string, url: string) {
  if (!clave || !url) return null;
  try {
    const r = await fetch(`${url}/key`, {
      headers: { authorization: `Bearer ${clave}`, accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    return veredictoDeClave(r.status);
  } catch {
    return "no_comprobable" as const;
  }
}

/* ¿Y SIGUEN SIENDO GRATIS LOS TUYOS?
 *
 * Hasta hoy la comprobación diaria miraba que los modelos de respaldo
 * EXISTIERAN, y resulta que eso no es lo que hay que vigilar. Se vio
 * midiéndolo a mano el 21-10: de cada modelo gratuito de OpenRouter
 * existe un gemelo de pago con el id casi igual —`inkling:free` a 0 y
 * `inkling` a 1 $/M, `laguna-s-2.1:free` a 0 y `laguna-s-2.1` a
 * 0,09 $/M—. Así que el día que un `:free` salga del catálogo, el
 * nombre sin sufijo sigue ahí y **empieza a cobrar**.
 *
 * Y eso es peor que un fallo: un modelo que falla se ve en la cara del
 * usuario; uno que factura no se ve en ninguna parte hasta que llega la
 * cuenta. Por eso aquí se devuelve el PRECIO y no solo el nombre.
 *
 * El catálogo de OpenRouter es público —se lee sin clave, y ese detalle
 * ya costó una vuelta en esta misma pantalla—, así que esto no gasta
 * cuota de nadie. Se piden solo los TUYOS, y el precio va por millón de
 * tokens, que es como se lee sin contar ceros. */
export type PrecioDeModelo = {
  id: string;
  /** Dólares por millón de tokens de entrada. `null` = no se ha podido leer. */
  entrada: number | null;
  /** Dólares por millón de tokens de salida. */
  salida: number | null;
};

export function porMillon(crudo: unknown): number | null {
  /* OJO CON `Number()` AQUÍ, QUE ES LA TRAMPA DE ESTA FUNCIÓN.
     `Number("")` es 0 y `Number(null)` es 0. Sin estas dos líneas, un
     precio que NO VIENE se lee como "0 $/M", o sea como **gratis**, que
     es justo la mentira que esta comprobación existe para evitar. Un
     precio ausente tiene que salir como `null` —"no se ha podido
     leer"—, nunca como cero. Lo cazó la prueba del 22-10. */
  if (typeof crudo !== "number" && typeof crudo !== "string") return null;
  if (typeof crudo === "string" && crudo.trim() === "") return null;

  const n = Number(crudo);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1_000_000 * 100) / 100;
}

async function preciosDeLosMios(url: string, mios: string[]): Promise<PrecioDeModelo[] | null> {
  if (!url || !mios.length) return null;

  const r = await fetch(`${url}/models`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!r.ok) return null;

  const cuerpo: unknown = await r.json();
  const datos = (cuerpo as { data?: unknown } | null)?.data;
  if (!Array.isArray(datos)) return null;

  const quiero = new Set(mios.map((m) => m.toLowerCase()));
  const hallados = new Map<string, PrecioDeModelo>();

  for (const m of datos) {
    const id = (m as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !quiero.has(id.toLowerCase())) continue;
    const pre = (m as { pricing?: { prompt?: unknown; completion?: unknown } }).pricing;
    hallados.set(id.toLowerCase(), {
      id,
      entrada: porMillon(pre?.prompt),
      salida: porMillon(pre?.completion),
    });
  }

  /* En el orden en que están configurados, y el que no aparezca en el
     catálogo sale con los precios en null: eso ya lo cuenta `faltan`, y
     aquí mezclar las dos cosas despistaría. */
  return mios.map(
    (m) => hallados.get(m.toLowerCase()) ?? { id: m, entrada: null, salida: null },
  );
}

/* CUÁL DE LOS TUYOS NO EXISTE.
 *
 * Esto NO se puede calcular con la lista recortada que se enseña, y el
 * error de hacerlo cuesta caro: con un catálogo de cientos de modelos,
 * los 60 primeros por abecedario son todos del mismo par de
 * vendedores, así que una configuración perfecta sale marcada como
 * inexistente y mandas a alguien a arreglar lo que estaba bien.
 *
 * Se compara contra la lista ENTERA, y lo que se enseña se recorta
 * después. */
export function cualesFaltan(configurados: string[], todos: string[]): string[] {
  const hay = new Set(todos.map((m) => m.toLowerCase()));
  return configurados.filter((m) => !hay.has(m.toLowerCase()));
}

/** Lo que se enseña: suficiente para copiar un nombre, no tanto como
 *  para llenar la pantalla. */
const AL_ASOMAR = 60;

/* Qué migraciones están puestas de verdad.
 *
 * No se mira una lista escrita a mano: se le pregunta a la propia base
 * de datos por una columna de cada una. Si falta, la respuesta dice el
 * archivo exacto que hay que pegar en Supabase, que es justo lo que uno
 * quiere saber cuando la barra lateral aparece vacía.
 *
 * Hace falta haber iniciado sesión, porque sin sesión la base de datos
 * no deja leer ninguna tabla y no habría forma de distinguir "falta la
 * columna" de "no tienes permiso". */
async function migraciones() {
  if (!hasSupabase) return { estado: "sin Supabase: la app va en modo demo" };

  const supabase = await clienteServidor().catch(() => null);
  if (!supabase) return { estado: "sin Supabase: la app va en modo demo" };

  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion?.user) {
    return { estado: "abre esta página con la sesión iniciada para comprobarlo" };
  }

  const probar = async (tabla: string, columna: string) => {
    const { error } = await supabase.from(tabla).select(columna).limit(1);
    if (!error) return "puesta";
    return faltaColumna(error) ? "FALTA" : `no se sabe: ${error.message.slice(0, 80)}`;
  };

  const [mentes, historial, pagos, fuentes, fichas, papeles, coworks] = await Promise.all([
    probar("mentes", "id"),
    probar("conversaciones", "actualizada_el"),
    probar("suscripciones", "id"),
    probar("mensajes", "fuentes"),
    probar("fichas", "id"),
    probar("papeles", "fecha_limite"),
    probar("coworks", "hora"),
  ]);

  return {
    "0003_mentes.sql": mentes,
    "0005_historial.sql": historial,
    "0006_pagos.sql": pagos,
    "0007_fuentes.sql": fuentes,
    /* Las dos tablas van en el mismo archivo, así que si una falta
       falta la otra. Se enseñan por separado igualmente: si alguna vez
       una está y la otra no, eso hay que verlo. */
    "0008_gist_y_paperwork.sql":
      fichas === papeles ? fichas : `fichas: ${fichas} · papeles: ${papeles}`,
    "0009_coworks.sql": coworks,
    que_pasa_si_falta: {
      "0003_mentes.sql": "no se pueden crear Mentes",
      "0005_historial.sql":
        "la barra lateral sale vacía aunque tengas conversaciones, y las respuestas de Kairo no se guardan",
      "0006_pagos.sql": "los pagos no cambian el plan de nadie",
      "0007_fuentes.sql": "las fuentes se ven al momento pero no al reabrir la conversación",
      "0008_gist_y_paperwork.sql":
        "Gist y Paperwork funcionan, pero cada ficha se pierde al salir de la página",
      "0009_coworks.sql": "no hay Co-Works: no se puede programar nada para que se haga solo",
    },
  };
}

/* ¿Contesta el Supabase al que apunta la URL?
 *
 * Es la pregunta que de verdad se hace uno cuando la pantalla de entrar
 * dice que no. Una URL puede tener la pinta perfecta —dominio correcto,
 * sin espacios, sin barra final— y apuntar a un proyecto pausado,
 * borrado o de otra cuenta. Esto lo llama y cuenta qué respondió.
 * /auth/v1/health es público: no hace falta sesión y no devuelve datos
 * de nadie. */
async function contestaSupabase() {
  if (!SUPABASE_URL) return { probado: false, motivo: "no hay URL configurada" };

  const corta = AbortSignal.timeout(6000);
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: corta,
      cache: "no-store",
    });
    return {
      probado: true,
      responde: r.ok,
      http: r.status,
      /* 401 con la clave puesta significa que el proyecto existe pero la
         clave no es suya: la confusión clásica de tener dos proyectos. */
      pista: r.ok
        ? "el proyecto responde"
        : r.status === 401
          ? "el proyecto responde pero rechaza la clave: ¿la clave anon es de OTRO proyecto?"
          : "el proyecto contesta algo raro",
    };
  } catch (e) {
    return {
      probado: true,
      responde: false,
      pista: "no se ha podido conectar: la URL no apunta a ningún Supabase vivo",
      detalle: corto(e),
    };
  }
}

export async function GET() {
  const crudaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const crudaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const claves = {
    gemini: process.env.GEMINI_API_KEY ?? "",
    claude: process.env.ANTHROPIC_API_KEY ?? "",
    gpt: process.env.OPENAI_API_KEY ?? "",
    extra: process.env.KAIRO_EXTRA_KEY ?? "",
  };

  let dominio: string | null = null;
  try {
    dominio = SUPABASE_URL ? new URL(SUPABASE_URL).host : null;
  } catch {
    dominio = null;
  }

  // Los tres a la vez: si uno tarda, no retrasa a los demás.
  const [gem, cla, gpt, ext, claveOk, precios, migra, salud] = await Promise.all([
    claves.gemini ? modelosDeGemini(claves.gemini).catch(corto) : null,
    claves.claude ? modelosDeClaude(claves.claude).catch(corto) : null,
    claves.gpt ? modelosDeGpt(claves.gpt).catch(corto) : null,
    claves.extra && EXTRA_URL()
      ? modelosDelExtra(claves.extra, EXTRA_URL()).catch(corto)
      : null,
    pruebaLaClaveExtra(claveExtra(), EXTRA_URL()).catch(() => "no_comprobable" as const),
    preciosDeLosMios(
      EXTRA_URL(),
      modelosExtra().map((m) => m.replace(/^extra:/, "")),
    ).catch(() => null),
    migraciones().catch((e) => ({ estado: corto(e) })),
    contestaSupabase().catch((e) => ({ probado: true, responde: false, detalle: corto(e) })),
  ]);

  const disponibles = (v: string[] | string | null) =>
    v === null ? { clave: false } : typeof v === "string" ? { error: v } : { modelos: v };

  const activos = proveedoresActivos();

  return Response.json({
    resumen: !hasSupabase
      ? "Supabase NO configurado: la app está en modo demo"
      : activos.length === 0
        ? "Falta al menos una clave de IA (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY o el proveedor de repuesto)"
        : `TODO CORRECTO · cerebros conectados: ${activos.join(", ")}`,

    /* Las migraciones que faltan por pegar en Supabase. Si algo de la
       web "no se guarda", esto lo dice en una línea. */
    migraciones: migra,

    supabase: {
      url_recibida: crudaUrl.length > 0,
      url_caracteres: crudaUrl.length,
      url_tiene_espacios: crudaUrl !== crudaUrl.trim(),
      url_valida: SUPABASE_URL.length > 0,
      /* Y si no vale, POR QUÉ no vale. Sin esto, "url_valida: false" es
         un callejón sin salida: sabes que está mal y no sabes qué
         mirar. */
      url_problema: pistaDeUrl(crudaUrl),
      dominio,
      clave_recibida: crudaKey.length > 0,
      clave_caracteres: crudaKey.length,
      clave_tiene_espacios: crudaKey !== crudaKey.trim(),
      clave_anon_valida: SUPABASE_ANON_KEY.length > 0,
      contesta: salud,
    },

    /* Lo que hace falta para que algo se ejecute SOLO. Son dos
       variables y una migración, y sin las tres no hay nada que hacer:
       el reloj llama, se encuentra la puerta cerrada y se va. */
    trabajar_solo: {
      cron_secret_recibida: (process.env.CRON_SECRET ?? "").trim().length > 0,
      clave_de_administrador: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim().length > 0,
      reloj_de_vercel: "kairo/vercel.json · una vez al día a las 06:00 UTC",
      reloj_de_github: ".github/workflows/kairo-coworks.yml · cada hora, si has puesto los dos secretos",
      donde_mirar: "docs/kairo/COWORKS.md",
    },

    cerebros: {
      activos,
      gemini: {
        clave_recibida: claves.gemini.length > 0,
        /* CUÁNTAS, no solo si hay.
 
           En la capa gratuita de Gemini la cuota va por clave Y por
           modelo, así que con una sola hay una hora del día en que la
           búsqueda deja de funcionar y Kairo contesta de memoria. El
           código admite hasta cinco desde hace tiempo; lo que faltaba
           era poder ver cuántas se están usando de verdad, porque
           "clave sí" se lee igual con una que con tres. */
        claves: clavesDeGemini().length,
        ...disponibles(gem),
      },
      claude: { clave_recibida: claves.claude.length > 0, ...disponibles(cla) },
      gpt: { clave_recibida: claves.gpt.length > 0, ...disponibles(gpt) },
      extra: (() => {
        const puestos = modelosExtra().map((m) => m.replace(/^extra:/, ""));
        const lista = Array.isArray(ext) ? ext : null;
        return {
          clave_recibida: claves.extra.length > 0,
          /* Y si además SIRVE, que es otra cosa. */
          clave: claveOk,
          url: EXTRA_URL() || null,
          // Los que tú has puesto en KAIRO_EXTRA_MODELOS.
          configurados: puestos,
          /* Cuáles de los TUYOS no están en el catálogo del proveedor.
             Es el dato que de verdad hace falta: un nombre retirado o
             mal escrito no da error, simplemente nunca contesta. */
          faltan: lista ? cualesFaltan(puestos, lista) : null,
          // Cuántos ofrece en total, para saber si la lista va cortada.
          total: lista ? lista.length : null,
          /* Lo que cuesta cada uno de los tuyos, por millón de tokens.
             Un 0 es gratis de verdad; un número distinto de 0 en un
             modelo que pusiste como gratuito es la señal de que hay que
             mirarlo. */
          precios,
          // Y una muestra, para copiar un nombre bien escrito.
          ...disponibles(lista ? lista.slice(0, AL_ASOMAR) : ext),
        };
      })(),
    },

    /* Si Kairo puede buscar en internet antes de contestar. La búsqueda
       la pone Gemini y va incluida con su clave: no hay nada más que
       configurar. "modelos_que_buscan" son los de la cadena normal que
       la aceptan; si alguno rechaza las herramientas, se cae de esta
       lista él solo en cuanto lo intenta una vez. */
    busqueda: {
      apagada_a_mano: /^(1|true|si|sí)$/i.test(process.env.KAIRO_SIN_BUSQUEDA?.trim() ?? ""),
      modelos_que_buscan: cadenaDe("normal", "adulto").filter(puedeBuscar),
      /* LAS REDES DE ABAJO.
 
         Lo de arriba solo habla de Gemini, y eso deja sin explicar el
         caso que más se sufre: Gemini agotado a media tarde. Desde
         fuera se ve "no he podido buscar" y no hay forma de saber si es
         que no hay repuesto o que el repuesto ha fallado, que se
         arreglan distinto. Aquí no sale ninguna clave: solo si la hay. */
      repuestos: {
        web_pagada: hayBuscadorPagado(),
        web_pagada_modelo: hayBuscadorPagado() ? modeloDeBusqueda() : "",
        claude: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
        // Ésta no se puede apagar ni se acaba: no hace falta nada.
        wikipedia: true,
      },
    },

    /* Lo que Kairo va a intentar de verdad en cada nivel, ya filtrado por
       las claves que tienes puestas. Para un adulto: los menores se quedan
       en Gemini, que es el único con filtro de contenido por petición. */
    cadenas: {
      rapido: cadenaDe("fast", "adulto"),
      normal: cadenaDe("normal", "adulto"),
      forja: cadenaDe("forja", "adulto"),
      mega: cadenaDe("mega", "adulto"),
      menores: cadenaDe("normal", "nino"),
    },

    /* SI EL BOT DE TELEGRAM ESTÁ PUESTO.
 
       Solo si ha llegado el testigo, nunca su contenido ni su longitud:
       con él, cualquiera escribe en nombre de tu bot a todo el que lo
       tenga añadido.
 
       Está aquí porque desde fuera esto no se veía de ninguna forma, y
       la pantalla de Ajustes enseña exactamente lo mismo en dos casos
       muy distintos: cuando no has puesto el testigo todavía, y cuando
       lo has puesto pero no has vuelto a desplegar. Lo segundo es lo que
       le pasa a todo el mundo, y sin esto no hay manera de distinguirlo
       sin pedir una captura.
 
       Enlazar la cuenta es aparte y es cosa de cada uno: eso lo dice
       Ajustes, que sabe de quién es la sesión. */
    telegram: {
      bot_puesto: (process.env.TELEGRAM_BOT_TOKEN ?? "").trim().length > 0,
      /* Y si Telegram lo acepta. Lo primero es "está puesto"; esto es
         "sirve". Se separan porque un testigo anulado está puesto y no
         sirve, y eso se pasó media mañana pareciendo otra cosa. */
      testigo: await testigoValido(),
    },

    /* Los pagos son opcionales: sin configurar, los botones llevan a
       crear cuenta y ya está. Esto dice cuáles de las cuatro piezas
       están puestas, nunca su contenido. */
    pagos: {
      tienda_montada: hayTienda(),
      enlaces_puestos: PRODUCTOS.filter((x) => enlaceDe(x)),
      secreto_del_webhook: secretoWebhook().length > 0,
      clave_de_administrador: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length > 0,
      botones_visibles: process.env.NEXT_PUBLIC_TIENDA === "1",
    },

    listo_para_chatear: hasSupabase && activos.length > 0,

    /* Para saber de un vistazo si estás mirando el despliegue que crees.
       Vercel pone estas dos solo; si salen vacías es que estás en local. */
    version: {
      commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || null,
      mensaje: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
      desplegado: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    },
  }, { headers: { "cache-control": "no-store" } });
}
