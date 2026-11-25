/* LA PRIMERA VERSIÓN DE KAIRO (decidido el 25-11).
 *
 * Para lanzar (enero-marzo) Kairo se queda con lo que la distingue:
 *   · el Chat, con Rápido, Normal, Forja y MEGA (la fusión de IAs);
 *   · Paperwork (los papeles oficiales);
 *   · Gist (las fichas);
 *   · Code (crear aplicaciones).
 *
 * Co-Works, Team y Mentes NO se borran: se esconden. Las tienen ChatGPT y
 * Claude, así que no son lo que va a traer gente, y cada apartado más es
 * más cosas que pueden fallar el día del lanzamiento. Volverán en una
 * versión posterior si la gente las pide.
 *
 * Para volver a enseñarlas sin tocar código: en Vercel, la variable
 *   NEXT_PUBLIC_KAIRO_SECCIONES = coworks,team,mentes
 * (las que se pongan ahí, se enseñan) y volver a desplegar. */

export type SeccionExtra = "coworks" | "team" | "mentes";

const ENCENDIDAS = new Set(
  (process.env.NEXT_PUBLIC_KAIRO_SECCIONES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

/** ¿Se enseña esta sección en esta versión? */
export const seccionVisible = (s: SeccionExtra): boolean => ENCENDIDAS.has(s);

/** La sección escondida a la que pertenece una ruta, si alguna. */
export function seccionDeRuta(path: string): SeccionExtra | null {
  const m = /^\/(coworks|team|mentes)(\/|$)/.exec(path);
  return m ? (m[1] as SeccionExtra) : null;
}
