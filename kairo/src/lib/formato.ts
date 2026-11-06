import type { Lang } from "./i18n";

/* LOS MILES, A MANO.
 *
 * `toLocaleString` parece lo correcto y no siempre lo es: depende de
 * los datos de idioma que lleve el navegador, y los hay que devuelven
 * "2000" pelado donde debería poner "2.000". En una página de precios
 * eso no es un detalle —un número sin separar se lee mal y de un
 * vistazo parece otro— así que se separa aquí y no se delega.
 *
 * Punto en español, coma en inglés, que es como se escribe en cada uno.
 */
export function miles(n: number, lang: Lang): string {
  const sep = lang === "es" ? "." : ",";
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}
