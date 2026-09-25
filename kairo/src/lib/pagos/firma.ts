import { createHmac, timingSafeEqual } from "node:crypto";

/* Comprobar la firma del aviso es LA pieza de seguridad de todo esto.
 *
 * La dirección del webhook es pública: cualquiera puede mandarle un
 * mensaje diciendo "este usuario ha pagado el Supreme". Lo único que
 * separa un aviso de verdad de uno inventado es que el de verdad viene
 * firmado con un secreto que solo conocéis tu proveedor de pago y tú.
 *
 * Dos detalles que parecen manías y no lo son:
 *   - Se firma el cuerpo EN CRUDO, byte a byte. Si lo pasas por JSON.parse
 *     y lo vuelves a escribir, cambia un espacio y la firma ya no cuadra.
 *   - Se comparan en tiempo constante. Comparar con === tarda un poquito
 *     más cuantos más caracteres coincidan, y con suficientes intentos
 *     eso deja adivinar la firma byte a byte.
 */
export function firmaValida(
  cuerpoCrudo: string,
  firmaRecibida: string | null,
  secreto: string,
): boolean {
  if (!firmaRecibida || !secreto) return false;

  const esperada = createHmac("sha256", secreto).update(cuerpoCrudo, "utf8").digest();
  const recibida = Buffer.from(firmaRecibida.trim(), "hex");

  // Longitudes distintas: ni se compara, y así no se filtra nada.
  if (recibida.length !== esperada.length) return false;

  return timingSafeEqual(recibida, esperada);
}
