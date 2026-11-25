/* CUARENTENA DE MODELOS, COMPARTIDA.
 *
 * Si un modelo falla por algo que no se arregla solo (cuota agotada, no
 * existe, no tienes acceso), no tiene sentido volver a pedírselo en cada
 * mensaje: se aparta un rato y se pasa al siguiente.
 *
 * Vive aquí y no dentro del chat porque la búsqueda gasta LA MISMA cuota
 * con los mismos modelos. Antes solo el chat se acordaba: cada búsqueda
 * volvía a probar los diez Gemini con las tres claves para descubrir otra
 * vez que estaban agotados, y eso eran segundos de espera por pregunta.
 *
 * Vive en memoria: cada instancia del servidor aprende por su cuenta. */

import { clasificarError } from "./errores";

const enfriando = new Map<string, number>();

export const disponible = (m: string) => (enfriando.get(m) ?? 0) < Date.now();
export const enfriar = (m: string, ms: number) => enfriando.set(m, Date.now() + ms);

/** Aparta un modelo que acaba de fallar, el tiempo que toque según por
 *  qué. Devuelve si en ESTA petición hay que dejar de probarlo. */
export function apartar(modelo: string, fallo: unknown): boolean {
  switch (clasificarError(fallo)) {
    case "sobrecargado":
      enfriar(modelo, 30_000);
      return false;
    case "cuota_minuto":
      // El límite por minuto se pasa solo; dentro de esta petición ya no.
      enfriar(modelo, 70_000);
      return true;
    case "cuota_dia":
      // Hasta dentro de una hora. Seguir preguntándole es tirar peticiones.
      enfriar(modelo, 60 * 60_000);
      return true;
    case "modelo_no_sirve":
    case "modelo_vetado":
      // Este no vuelve: a una web no se le sirve, y mañana tampoco.
      enfriar(modelo, 24 * 60 * 60_000);
      return true;
    default:
      // No existe, no tienes acceso o lo han retirado.
      enfriar(modelo, 10 * 60_000);
      return true;
  }
}
