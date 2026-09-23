import { GoogleGenAI } from "@google/genai";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "@/lib/supabase/config";
import { cadenaDe } from "@/lib/ia/config";

export const runtime = "nodejs";

/* Diagnóstico. Dice QUÉ variables han llegado, nunca su contenido:
   solo verdadero/falso, la longitud y el dominio, que de todas formas
   va dentro del código que se descarga el navegador.
   Ninguna clave sale de aquí. */
export async function GET() {
  const crudaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const crudaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const gemini = process.env.GEMINI_API_KEY ?? "";

  let dominio: string | null = null;
  try {
    dominio = SUPABASE_URL ? new URL(SUPABASE_URL).host : null;
  } catch {
    dominio = null;
  }

  /* Le preguntamos a Google qué modelos acepta esta clave, en vez de
     confiar en una lista escrita a mano que se queda vieja. Si esto falla,
     el mensaje de error dice exactamente por qué. */
  let modelos: { disponibles?: string[]; error?: string; configurados?: string[] } = {};
  if (gemini) {
    try {
      const ia = new GoogleGenAI({ apiKey: gemini });
      const lista: string[] = [];
      for await (const m of await ia.models.list()) {
        if (m.name) lista.push(m.name.replace(/^models\//, ""));
        if (lista.length >= 60) break;
      }
      modelos = {
        configurados: [
          ...new Set(
            (["fast", "normal", "forja", "mega"] as const).flatMap((n) => cadenaDe(n)),
          ),
        ],
        disponibles: lista.filter((n) => n.includes("gemini")).slice(0, 40),
      };
    } catch (e) {
      modelos = { error: (e instanceof Error ? e.message : String(e)).slice(0, 300) };
    }
  }

  return Response.json({
    resumen: hasSupabase
      ? gemini
        ? "TODO CORRECTO"
        : "Supabase bien, falta GEMINI_API_KEY"
      : "Supabase NO configurado: la app está en modo demo",

    supabase: {
      url_recibida: crudaUrl.length > 0,
      url_caracteres: crudaUrl.length,
      url_tiene_espacios: crudaUrl !== crudaUrl.trim(),
      url_valida: SUPABASE_URL.length > 0,
      dominio,
      clave_recibida: crudaKey.length > 0,
      clave_caracteres: crudaKey.length,
      clave_tiene_espacios: crudaKey !== crudaKey.trim(),
    },

    gemini: {
      clave_recibida: gemini.length > 0,
      clave_caracteres: gemini.length,
    },

    modelos,

    listo_para_chatear: hasSupabase && gemini.length > 0,
  });
}
