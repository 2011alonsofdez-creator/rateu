import { clienteServidor } from "@/lib/supabase/server";
import { hablar } from "@/lib/ia/voz-gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

/* Tope por persona: 60 trozos cada 10 minutos (unos 30.000 caracteres,
   muchas respuestas largas). La cuota de Gemini es UNA para todos: sin
   tope, una sola cuenta podía pedir audio sin parar y dejar sin voz (y
   sin respuestas) a todo el mundo. */
const VENTANA = 10 * 60_000;
const TOPE = 60;
const usos = new Map<string, number[]>();
function cabe(id: string): boolean {
  const ahora = Date.now();
  const previas = (usos.get(id) ?? []).filter((t) => ahora - t < VENTANA);
  if (previas.length >= TOPE) return false;
  previas.push(ahora);
  usos.set(id, previas);
  if (usos.size > 5000) usos.clear(); // no crecer sin fin
  return true;
}

/* Lee un trozo de texto con la voz de Kairo (de Gemini). Solo para
   quien tiene sesión: cada llamada gasta cuota de Gemini. */
export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ error: "demo" }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return Response.json({ error: "sin_sesion" }, { status: 401 });
  if (!cabe(data.user.id)) return Response.json({ error: "demasiadas" }, { status: 429 });

  const cuerpo = await req.json().catch(() => null);
  const texto = typeof cuerpo?.texto === "string" ? cuerpo.texto.trim().slice(0, 1200) : "";
  if (!texto) return Response.json({ error: "mal" }, { status: 400 });

  try {
    const wav = await hablar(texto, cuerpo?.idioma === "en" ? "en" : "es");
    return new Response(new Uint8Array(wav), {
      headers: { "content-type": "audio/wav", "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[kairo] voz:", e instanceof Error ? e.message.slice(0, 200) : e);
    return Response.json({ error: "sin_voz" }, { status: 502 });
  }
}
