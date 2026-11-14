import { clienteServidor } from "@/lib/supabase/server";
import { hablar } from "@/lib/ia/voz-gemini";
import { esVoz } from "@/lib/voces";

export const runtime = "nodejs";
export const maxDuration = 30;

/* Lee un trozo de texto con una de las cinco voces de Gemini. Solo para
   quien tiene sesión: cada llamada gasta cuota de Gemini. */
export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ error: "demo" }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return Response.json({ error: "sin_sesion" }, { status: 401 });

  const cuerpo = await req.json().catch(() => null);
  const texto = typeof cuerpo?.texto === "string" ? cuerpo.texto.trim().slice(0, 1200) : "";
  if (!texto || !esVoz(cuerpo?.voz)) return Response.json({ error: "mal" }, { status: 400 });

  try {
    const wav = await hablar(texto, cuerpo.voz);
    return new Response(new Uint8Array(wav), {
      headers: { "content-type": "audio/wav", "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[kairo] voz:", e instanceof Error ? e.message.slice(0, 200) : e);
    return Response.json({ error: "sin_voz" }, { status: 502 });
  }
}
