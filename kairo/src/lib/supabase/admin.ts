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
 *   - Solo la usan TRES rutas, y las tres por el mismo motivo: hay que
 *     escribir algo que el usuario no tiene permiso para escribir.
 *       · /api/pagos/webhook    → un aviso del proveedor de pago que
 *                                 cambia el plan de una cuenta. No hay
 *                                 nadie con sesión.
 *       · /api/coworks/ejecutar → un reloj que ejecuta los encargos de
 *                                 todos. Tampoco hay nadie. Además de
 *                                 esta llave exige una contraseña propia
 *                                 (CRON_SECRET) antes de mirar nada.
 *       · /api/coworks/probar   → aquí SÍ hay sesión, y el Co-Work se
 *                                 busca con ella (si no es tuyo, no
 *                                 aparece). La llave solo se usa para
 *                                 reservar el día y apuntar el
 *                                 resultado, que es justo lo que un
 *                                 usuario no puede hacer a mano.
 *     Ninguna otra. Si aparece una cuarta, hay que preguntarse por qué.
 *   - Nunca se escribe en un log, ni se devuelve en ninguna respuesta.
 *
 * Si no está puesta, esto devuelve null y cada ruta responde que eso no
 * está configurado. Kairo funciona igual sin ella: no cobra suscripciones
 * y no ejecuta nada por su cuenta, pero el chat entero sigue en pie.
 */
export function clienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!clave || !SUPABASE_URL) return null;

  return createClient(SUPABASE_URL, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
