import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "@/lib/supabase/config";
import { cadenaDe, proveedoresActivos } from "@/lib/ia/config";

export const runtime = "nodejs";
export const maxDuration = 30;

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

export async function GET() {
  const crudaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const crudaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const claves = {
    gemini: process.env.GEMINI_API_KEY ?? "",
    claude: process.env.ANTHROPIC_API_KEY ?? "",
    gpt: process.env.OPENAI_API_KEY ?? "",
  };

  let dominio: string | null = null;
  try {
    dominio = SUPABASE_URL ? new URL(SUPABASE_URL).host : null;
  } catch {
    dominio = null;
  }

  // Los tres a la vez: si uno tarda, no retrasa a los demás.
  const [gem, cla, gpt] = await Promise.all([
    claves.gemini ? modelosDeGemini(claves.gemini).catch(corto) : null,
    claves.claude ? modelosDeClaude(claves.claude).catch(corto) : null,
    claves.gpt ? modelosDeGpt(claves.gpt).catch(corto) : null,
  ]);

  const disponibles = (v: string[] | string | null) =>
    v === null ? { clave: false } : typeof v === "string" ? { error: v } : { modelos: v };

  const activos = proveedoresActivos();

  return Response.json({
    resumen: !hasSupabase
      ? "Supabase NO configurado: la app está en modo demo"
      : activos.length === 0
        ? "Falta al menos una clave de IA (GEMINI_API_KEY, ANTHROPIC_API_KEY u OPENAI_API_KEY)"
        : `TODO CORRECTO · cerebros conectados: ${activos.join(", ")}`,

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

    listo_para_chatear: hasSupabase && activos.length > 0,
  });
}
