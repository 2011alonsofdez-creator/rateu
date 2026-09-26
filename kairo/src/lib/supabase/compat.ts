/* Cuando la base de datos va por detrás del código.
 *
 * Las migraciones se pegan a mano en Supabase, así que siempre puede
 * haber un rato —o un mes— en el que la web ya pide una columna que la
 * tabla todavía no tiene. Eso, sin más, revienta la consulta ENTERA: no
 * es que falte un dato, es que no vuelve ninguno. Una barra lateral
 * vacía, una conversación en blanco, una respuesta que no se guarda.
 *
 * Esto sirve para distinguir ese caso de un fallo de verdad. Si la
 * columna no existe, se vuelve a preguntar por lo que sí existe y la
 * web sigue funcionando, con menos cosas pero funcionando. Cualquier
 * otro error se deja pasar tal cual: disimularlo sería peor.
 */

/** 42703: la columna no existe (al leer).
 *  42P01: la tabla no existe (una migración entera sin ejecutar).
 *  PGRST204: PostgREST no conoce esa columna (al escribir). */
const CODIGOS = new Set(["42703", "42P01", "PGRST204"]);

const TEXTO = /column .* does not exist|could not find the .* column|relation .* does not exist|schema cache/i;

export function faltaColumna(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code && CODIGOS.has(error.code)) return true;
  return TEXTO.test(error.message ?? "");
}
