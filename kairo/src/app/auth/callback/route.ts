import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { clienteServidor } from "@/lib/supabase/server";

/* Aquí aterriza quien entra con Google, confirma su correo o va a
 * cambiar la contraseña.
 *
 * Supabase manda el enlace de dos formas distintas según la plantilla de
 * correo que tenga puesta el proyecto, y hay que admitir las dos o media
 * gente se queda fuera sin saber por qué:
 *
 *  - `?code=...`                  el flujo nuevo (PKCE): se canjea.
 *  - `?token_hash=...&type=...`   el de las plantillas de siempre: se verifica.
 *
 * Y cuando el enlace ya se ha usado o ha caducado, Supabase no manda
 * ninguno de los dos: manda `?error=...`. Antes eso acababa igual que
 * todo lo demás —de vuelta en la pantalla de entrar sin explicación—, y
 * el siguiente paso de cualquiera era probar su contraseña y que le
 * dijeran que estaba mal. Ahora vuelve con el motivo.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const volver = searchParams.get("volver");

  // Detrás de un proxy (Vercel) el origin interno no es el público.
  const reenviado = request.headers.get("x-forwarded-host");
  const protocolo = request.headers.get("x-forwarded-proto") ?? "https";
  const base = reenviado ? `${protocolo}://${reenviado}` : origin;

  /* Recuperar contraseña acaba siempre en la pantalla de la contraseña
     nueva, aunque el enlace no traiga a dónde volver. */
  const pedido = volver ?? (tipo === "recovery" ? "/nueva-clave" : "/chat");

  // Solo admitimos rutas internas: si no, un enlace manipulado podría
  // rebotar al usuario a otro sitio justo después de iniciar sesión.
  const destino = pedido.startsWith("/") && !pedido.startsWith("//") ? pedido : "/chat";

  // El propio Supabase dice que el enlace no vale. No hay nada que canjear.
  if (searchParams.get("error") || searchParams.get("error_code")) {
    return NextResponse.redirect(`${base}/entrar?error=enlace`);
  }

  const supabase = await clienteServidor();

  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${destino}`);
  }

  if (supabase && tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    if (!error) return NextResponse.redirect(`${base}${destino}`);
  }

  return NextResponse.redirect(`${base}/entrar?error=enlace`);
}
