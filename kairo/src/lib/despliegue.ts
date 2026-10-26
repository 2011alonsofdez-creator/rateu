/* ¿ESTÁS MIRANDO EL KAIRO PUBLICADO, O UNA FOTO DE UN DESPLIEGUE?
 *
 * Vercel le da una dirección propia a cada despliegue
 * (kairo-5zwfjk6ri-…), y cada una queda congelada con las variables que
 * había al construirla. Entrar por ahí es abrir el pasado: la clave que
 * pusiste después no está, el modelo que cambiaste tampoco. Y por fuera
 * no se distingue en nada.
 *
 * La decisión vive aquí fuera, y no dentro del componente, porque es
 * justo la clase de cosa que se equivoca en silencio: una comparación
 * con un puerto de más saca el aviso estando en el sitio correcto, y un
 * aviso que sale cuando no toca deja de leerse a la semana. Aquí se
 * puede probar caso por caso sin levantar un navegador.
 */

/** Deja un host en lo comparable: sin esquema, sin ruta, sin puerto.
 *
 *  El puerto se quita con cuidado, porque una dirección IPv6 va llena de
 *  dos puntos: quitárselo a lo bruto convertía `::1` en `:` y el aviso
 *  salía en tu propio ordenador. Van primero los corchetes —que es como
 *  se escribe IPv6 con puerto, `[::1]:3000`— y después el caso normal,
 *  que exige que no haya más de unos dos puntos. */
function pelado(v: string): string {
  return v
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^\[([^\]]+)\](?::\d+)?$/, "$1")
    .replace(/^([^:]+):\d+$/, "$1")
    .toLowerCase();
}

/** El dominio publicado, limpio, para poder enlazarlo. */
export const dominioDe = (v: string): string => pelado(v ?? "");

/** Las direcciones donde este aviso no pinta nada. */
const DE_CASA = /^localhost$|^127\.0\.0\.1$|^\[?::1\]?$|\.local$/;

/**
 * ¿Hay que avisar de que esto no es el Kairo publicado?
 *
 * @param aqui       lo que tiene el navegador en la barra
 * @param publicada  el dominio publicado, tal y como lo da Vercel
 */
export function esOtroDespliegue(aqui: string, publicada: string): boolean {
  const a = pelado(aqui ?? "");
  const p = pelado(publicada ?? "");

  /* Sin uno de los dos no hay nada que comparar, y un aviso que no sabe
     lo que dice es ruido. */
  if (!a || !p) return false;

  // En tu propio ordenador es lo normal y lo correcto.
  if (DE_CASA.test(a)) return false;

  return a !== p;
}
