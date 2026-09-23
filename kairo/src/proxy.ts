import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  esRutaPrivada,
  hasSupabase,
} from "@/lib/supabase/config";

/* En Next 16 este archivo se llama proxy.ts (antes middleware.ts).
   Hace dos cosas, y las dos son imprescindibles:

   1. Refrescar la sesión en cada petición y devolver las cookies nuevas.
      Si no se hace aquí, la sesión caduca sola y el usuario se encuentra
      deslogueado sin motivo aparente.
   2. Cortar el paso a las rutas privadas antes de renderizar nada. */

export async function proxy(request: NextRequest) {
  // Modo demo: sin Supabase configurado, todo es público.
  if (!hasSupabase) return NextResponse.next();

  let response = NextResponse.next({ request });

  try {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Importante: getUser() y no getSession(). getUser() valida el token
  // contra Supabase; getSession() se limita a leer la cookie, que el
  // usuario controla y puede falsificar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && esRutaPrivada(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("volver", path);
    return NextResponse.redirect(url);
  }

  // Ya dentro, las pantallas de entrar y registro sobran.
  if (user && (path === "/entrar" || path === "/registro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
  } catch {
    // Supabase caído, cookie corrupta, lo que sea: la web sigue en pie.
    // Quien no tenga sesión se topará igualmente con la comprobación
    // del layout, que es la que de verdad protege los datos.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /* Todo menos los archivos estáticos, las imágenes y /api.
       Las rutas de API comprueban la sesión por su cuenta, así que
       pasarlas también por aquí era pedirle a Supabase lo mismo dos
       veces por mensaje. La sesión se mantiene fresca igualmente: el
       cliente del navegador renueva el token solo. */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
