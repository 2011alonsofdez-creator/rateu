/* Los fallos de los proveedores, contados en castellano y sin claves.
 *
 * Vive aquí fuera y no dentro de la búsqueda porque lo necesita más
 * de uno: la búsqueda lo apunta en su diario y Gist lo escribe en el
 * registro del servidor. Y en los dos sitios importa lo mismo: que un
 * mensaje de error no sea por donde se escapa una clave. Un registro
 * de Vercel lo lee cualquiera que entre al panel.
 */

/** El mensaje de un fallo, en castellano y sin nada que no deba salir.
 *
 *  Google contesta con un JSON de doscientos caracteres que empieza por
 *  {"error":{"code":429... y nadie sabe qué hacer con eso. Los cuatro
 *  fallos que pasan de verdad se traducen a una frase que sí dice qué
 *  hacer; el resto se enseña en crudo, recortado.
 *
 *  Y de aquí no puede salir una clave por mucho que el mensaje original
 *  la traiga: se tacha todo lo que tenga pinta de serlo. */
export function limpiarFallo(e: unknown): string {
  const texto = (e instanceof Error ? e.message : String(e))
    .replace(/(key|token|secret|authorization)["\s:=]+[\w.-]+/gi, "$1=***")
    .replace(/\b(AIza[\w-]{10,}|sk-[\w-]{10,}|eyJ[\w.-]{20,})\b/g, "***");

  if (/\b429\b|quota|rate limit/i.test(texto)) {
    return "CUOTA AGOTADA (429) · este modelo no admite más peticiones por ahora";
  }
  if (/\b404\b|no longer available|not found/i.test(texto)) {
    return "ESE MODELO YA NO EXISTE (404) · hay que quitarlo de la lista";
  }
  if (/\b403\b|permission|not enabled/i.test(texto)) {
    return "LA CLAVE NO TIENE PERMISO (403) · revisa la clave de Gemini";
  }
  if (/\b401\b|api key not valid|invalid.*key/i.test(texto)) {
    return "CLAVE NO VÁLIDA (401) · la GEMINI_API_KEY está mal";
  }
  if (/\b400\b/.test(texto)) {
    return `PETICIÓN RECHAZADA (400) · ${texto.slice(0, 120)}`;
  }

  return texto.slice(0, 200);
}
