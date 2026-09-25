import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/* ⚠️  LA CLAVE DE ADMINISTRADOR ⚠️
 *
 * `service_role` se salta TODA la seguridad de la base de datos. No hay
 * políticas, ni permisos por columna, ni nada: quien la tenga puede leer
 * y borrar los datos de todos tus usuarios.
 *
 * Por eso:
 *   - NO lleva NEXT_PUBLIC_ delante. Ese prefijo la metería dentro del
 *     JavaScript que se descarga el navegador, y sería el final.
 *   - Solo la usa /api/pagos/webhook, que es el único sitio donde hace
 *     falta: ahí no hay usuario con sesión, hay un aviso del proveedor
 *     de pago, y hay que cambiar el plan de alguien.
 *   - Nunca se escribe en un log, ni se devuelve en ninguna respuesta.
 *
 * Si no está puesta, esto devuelve null y la ruta responde que los pagos
 * no están configurados. Kairo funciona igual sin ella.
 */
export function clienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!clave || !SUPABASE_URL) return null;

  return createClient(SUPABASE_URL, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
