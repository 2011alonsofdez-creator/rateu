import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

/* Aquí aterriza quien entra con Google o confirma su correo.
   Supabase devuelve un código de un solo uso que hay que canjear por
   la sesión; el cliente de servidor deja las cookies puestas. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const volver = searchParams.get("volver") ?? "/chat";

  // Detrás de un proxy (Vercel) el origin interno no es el público.
  const reenviado = request.headers.get("x-forwarded-host");
  const protocolo = request.headers.get("x-forwarded-proto") ?? "https";
  const base = reenviado ? `${protocolo}://${reenviado}` : origin;

  // Solo admitimos rutas internas: si no, un enlace manipulado podría
  // rebotar al usuario a otro sitio justo después de iniciar sesión.
  const destino = volver.startsWith("/") && !volver.startsWith("//") ? volver : "/chat";

  if (code) {
    const supabase = await clienteServidor();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${base}${destino}`);
    }
  }

  return NextResponse.redirect(`${base}/entrar?error=1`);
}
