/** Recorta por puntos de código, no por posiciones de la cadena.
 *
 *  En JavaScript un emoji ocupa dos posiciones, así que `slice(0, 60)`
 *  puede cortarlo por la mitad y dejar medio carácter suelto: PostgreSQL
 *  no lo acepta, cuenta caracteres de otra forma, y por el camino rompe
 *  el JSON. Esto corta por caracteres de verdad. */
export function recortar(valor: unknown, max: number): string {
  return [...String(valor ?? "").trim()].slice(0, max).join("");
}
