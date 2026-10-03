/* BUSCAR EN INTERNET: AUTOMÁTICO, SIEMPRE O NUNCA.
 *
 * Kairo decide solo si una pregunta necesita datos de hoy, mirando cómo
 * está escrita. Acierta casi siempre y por eso es lo que viene puesto,
 * pero "casi siempre" tiene un problema que no se arregla añadiendo
 * pistas a la lista: cuando falla, TÚ sabes que esa pregunta era de
 * actualidad y Kairo no.
 *
 * De ahí el interruptor. No sustituye al automático: lo remata.
 *
 *   auto    → como hasta ahora: busca si la pregunta pinta de actualidad
 *   siempre → busca aunque no lo parezca
 *   nunca   → no busca, contesta ya
 *
 * "Nunca" no es un capricho: una búsqueda son hasta dieciocho segundos y
 * un trozo de cuota, y para "resúmeme esto" o "arréglame este código" no
 * pinta nada.
 */

export const MODOS_BUSQUEDA = ["auto", "siempre", "nunca"] as const;
export type ModoBusqueda = (typeof MODOS_BUSQUEDA)[number];

const LLAVE = "kairo.buscar";

/** Lo que llegue de fuera solo vale si es uno de los tres. */
export function modoValido(v: unknown): ModoBusqueda {
  return MODOS_BUSQUEDA.includes(v as ModoBusqueda) ? (v as ModoBusqueda) : "auto";
}

/** El siguiente al pulsar: auto → siempre → nunca → auto. */
export function siguienteModo(actual: ModoBusqueda): ModoBusqueda {
  const i = MODOS_BUSQUEDA.indexOf(actual);
  return MODOS_BUSQUEDA[(i + 1) % MODOS_BUSQUEDA.length];
}

/** Lo elegido la última vez. En el servidor, y si el navegador no deja
 *  guardar nada, el automático de siempre. */
export function modoGuardado(): ModoBusqueda {
  if (typeof window === "undefined") return "auto";
  try {
    return modoValido(window.localStorage.getItem(LLAVE));
  } catch {
    return "auto";
  }
}

export function guardarModo(modo: ModoBusqueda): void {
  try {
    window.localStorage.setItem(LLAVE, modo);
  } catch {
    /* sin memoria en el navegador: vale para esta sesión y ya está */
  }
}

/** ¿Hay que buscar? La decisión, en un sitio y sin repartir.
 *
 *  `pinta` es lo que haya dicho el detector automático. Con archivos
 *  delante NO se busca —lo que quieres es que mire el archivo— salvo
 *  que lo hayas pedido a mano, porque pedirlo a mano es más claro que
 *  cualquier suposición. */
export function hayQueBuscar(
  modo: ModoBusqueda,
  pinta: boolean,
  conArchivos: boolean,
): boolean {
  if (modo === "nunca") return false;
  if (modo === "siempre") return true;
  return pinta && !conArchivos;
}
