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

  if (estado === 401) return "clave_invalida";
  if (estado === 403) return VETADO.test(texto(fallo)) ? "modelo_vetado" : "clave_invalida";
  if (estado === 429) return tipoDeCuota(texto(fallo));
  if (estado === 404) return "modelo_no_existe";
  if (estado === 400) return "modelo_no_existe"; // parámetro que ese modelo no acepta
  if (estado >= 500) return "sobrecargado";

  const mensaje = texto(fallo);

  if (VETADO.test(mensaje)) return "modelo_vetado";
  if (/api[_ ]?key|API_KEY_INVALID|401|403|PERMISSION_DENIED/i.test(mensaje)) {
    return "clave_invalida";
  }
  if (/quota|rate|429|RESOURCE_EXHAUSTED/i.test(mensaje)) return tipoDeCuota(mensaje);
  if (/not found|404|NOT_FOUND|is not supported/i.test(mensaje)) return "modelo_no_existe";
  if (/503|UNAVAILABLE|overloaded|high demand/i.test(mensaje)) return "sobrecargado";
  return "error_modelo";
}

/* UN 403 NO SIEMPRE ES LA CLAVE, Y CONFUNDIRLO SALE CARO.
 *
 * OpenRouter usa el mismo 403 para dos cosas que no se parecen en nada:
 *   · la clave no vale
 *   · la clave vale perfectamente, pero ESE modelo no se sirve aquí
 *
 * Lo segundo es real: hay modelos gratis reservados a agentes de
 * programación —contestan «only available on agentic harnesses»— que
 * desde una web rechazan la petición con la clave impecable.
 *
 * Leerlo como «clave inválida» costaba dos cosas a la vez: el chat
 * descarta TODOS los modelos de esa casa en cuanto una clave se cae
 * (está puesto a propósito, en api/chat), así que un solo modelo vetado
 * tumbaba el respaldo entero; y encima mandaba a revisar las claves en
 * Vercel, que es donde no estaba el problema. Pasó de verdad. */
const VETADO =
  /agentic harness|only available on|not available (to|for|on)|no access to (this )?model|model not available/i;

const texto = (fallo: unknown) =>
  fallo instanceof Error ? fallo.message : typeof fallo === "string" ? fallo : JSON.stringify(fallo ?? "");

/* Un 429 no siempre quiere decir lo mismo, y la diferencia le importa
   mucho a quien está esperando:
 *   - por minuto: se arregla solo en menos de un minuto.
 *   - por día:    hasta mañana no hay nada que hacer.
 * Google lo dice en el identificador de la cuota que viene en el error,
 * así que se lee de ahí en vez de suponer lo peor. */
function tipoDeCuota(mensaje: string) {
  /* El retraso que pide el proveedor va primero, y a propósito: a veces
     el error enumera las dos cuotas y no dice cuál has roto, pero si te
     pide esperar medio minuto está claro que no es la del día. */
  const espera = segundosDeEspera(mensaje);
  if (espera !== null && espera <= 120) return "cuota_minuto";

  if (/per\s*day|perday/i.test(mensaje)) return "cuota_dia";
  if (/per\s*minute|perminute/i.test(mensaje)) return "cuota_minuto";

  return "cuota_agotada";
}

/** Los segundos que el propio proveedor pide esperar, si los dice. */
export function segundosDeEspera(mensaje: string): number | null {
  const m = /retry[_-]?delay["\s:]*["']?(\d+(?:\.\d+)?)s/i.exec(mensaje);
  if (m) return Math.ceil(Number(m[1]));

  const cabecera = /retry[_-]?after["\s:]*["']?(\d+)/i.exec(mensaje);
  if (cabecera) return Number(cabecera[1]);

  return null;
}
