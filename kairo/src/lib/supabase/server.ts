import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./config";

/* Cliente para componentes de servidor, acciones y rutas.
   Hay que crear uno nuevo en cada petición: compartirlo entre peticiones
   mezclaría las sesiones de distintos usuarios. */
export async function clienteServidor() {
  if (!hasSupabase) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Desde un componente de servidor no se pueden escribir cookies.
             No pasa nada: el proxy ya refrescó la sesión antes de llegar aquí. */
        }
      },
    },
  });
}
