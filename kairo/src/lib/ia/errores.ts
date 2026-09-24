/* Traduce el error del proveedor a algo accionable.
 *
 * Los SDK de Claude y GPT traen el código de estado en el propio error, y
 * eso es más de fiar que adivinar leyendo el texto. Se mira primero el
 * número y solo después las palabras, que es lo único que da Gemini. */
export function clasificarError(fallo: unknown) {
  const estado =
    typeof fallo === "object" && fallo !== null && "status" in fallo
      ? Number((fallo as { status?: unknown }).status)
      : NaN;

  if (estado === 401 || estado === 403) return "clave_invalida";
  if (estado === 429) return "cuota_agotada";
  if (estado === 404) return "modelo_no_existe";
  if (estado === 400) return "modelo_no_existe"; // parámetro que ese modelo no acepta
  if (estado >= 500) return "sobrecargado";

  const mensaje = fallo instanceof Error ? fallo.message : String(fallo);

  if (/api[_ ]?key|API_KEY_INVALID|401|403|PERMISSION_DENIED/i.test(mensaje)) {
    return "clave_invalida";
  }
  if (/quota|rate|429|RESOURCE_EXHAUSTED/i.test(mensaje)) return "cuota_agotada";
  if (/not found|404|NOT_FOUND|is not supported/i.test(mensaje)) return "modelo_no_existe";
  if (/503|UNAVAILABLE|overloaded|high demand/i.test(mensaje)) return "sobrecargado";
  return "error_modelo";
}
