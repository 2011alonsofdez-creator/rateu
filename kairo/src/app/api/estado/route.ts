import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "@/lib/supabase/config";
import { cadenaDe, proveedoresActivos } from "@/lib/ia/config";
import { EXTRA_URL, modelosExtra, puedeBuscar } from "@/lib/ia/proveedores";
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
  return pagina.data.map((m) => m.id).sort().slice(0, 60);
}

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

  const [mentes, historial, pagos, fuentes] = await Promise.all([
    probar("mentes", "id"),
    probar("conversaciones", "actualizada_el"),
    probar("suscripciones", "id"),
    probar("mensajes", "fuentes"),
  ]);

  return {
    "0003_mentes.sql": mentes,
    "0005_historial.sql": historial,
    "0006_pagos.sql": pagos,
    "0007_fuentes.sql": fuentes,
    que_pasa_si_falta: {
      "0003_mentes.sql": "no se pueden crear Mentes",
      "0005_historial.sql":
        "la barra lateral sale vacía aunque tengas conversaciones, y las respuestas de Kairo no se guardan",
      "0006_pagos.sql": "los pagos no cambian el plan de nadie",
      "0007_fuentes.sql": "las fuentes se ven al momento pero no al reabrir la conversación",
    },
  };
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
  const [gem, cla, gpt, ext, migra] = await Promise.all([
    claves.gemini ? modelosDeGemini(claves.gemini).catch(corto) : null,
    claves.claude ? modelosDeClaude(claves.claude).catch(corto) : null,
    claves.gpt ? modelosDeGpt(claves.gpt).catch(corto) : null,
    claves.extra && EXTRA_URL()
      ? modelosDelExtra(claves.extra, EXTRA_URL()).catch(corto)
      : null,
    migraciones().catch((e) => ({ estado: corto(e) })),
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
      dominio,
      clave_recibida: crudaKey.length > 0,
      clave_caracteres: crudaKey.length,
      clave_tiene_espacios: crudaKey !== crudaKey.trim(),
      clave_anon_valida: SUPABASE_ANON_KEY.length > 0,
    },

    cerebros: {
      activos,
      gemini: { clave_recibida: claves.gemini.length > 0, ...disponibles(gem) },
      claude: { clave_recibida: claves.claude.length > 0, ...disponibles(cla) },
      gpt: { clave_recibida: claves.gpt.length > 0, ...disponibles(gpt) },
      extra: {
        clave_recibida: claves.extra.length > 0,
        url: EXTRA_URL() || null,
        // Los que tú has puesto en KAIRO_EXTRA_MODELOS.
        configurados: modelosExtra().map((m) => m.replace(/^extra:/, "")),
        // Y los que ese proveedor dice tener, para que copies el nombre bien.
        ...disponibles(ext),
      },
    },

    /* Si Kairo puede buscar en internet antes de contestar. La búsqueda
       la pone Gemini y va incluida con su clave: no hay nada más que
       configurar. "modelos_que_buscan" son los de la cadena normal que
       la aceptan; si alguno rechaza las herramientas, se cae de esta
       lista él solo en cuanto lo intenta una vez. */
    busqueda: {
      apagada_a_mano: /^(1|true|si|sí)$/i.test(process.env.KAIRO_SIN_BUSQUEDA?.trim() ?? ""),
      modelos_que_buscan: cadenaDe("normal", "adulto").filter(puedeBuscar),
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
