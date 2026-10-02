/* VARIAS CLAVES DE GEMINI, NO UNA.
 *
 * Nace de un día concreto: los modelos contestaron 429, 404 y 429, no se
 * buscó nada, y Kairo contestó de memoria como si supiera. En la capa
 * gratuita de Gemini la cuota va por clave Y por modelo, así que con una
 * sola clave hay un momento del día en que Kairo se queda mudo y no hay
 * código que lo arregle.
 *
 * Con dos claves, cuando la primera dice basta se prueba con la
 * siguiente. No es magia y no es infinito: es que un proyecto agotado no
 * tenga por qué apagar la web entera.
 *
 * Y lo que NO hay que entender mal: esto no multiplica nada por sí solo.
 * Sirve si de verdad tienes más de una clave —dos proyectos tuyos, una
 * gratis y otra con facturación— y cada una trae su propio cupo. Si
 * pones la misma dos veces, tienes la misma cuota escrita dos veces.
 */

/** Cuántas se admiten. Más de esto no es tener claves de repuesto: es
 *  una lista que nadie revisa y que alarga cada fallo por ocho. */
export const CLAVES_MAX = 5;

/** Una clave con pinta de clave, y con la manga ancha a propósito.
 *
 *  La tentación es pedir que empiece por "AIza" y mida cuarenta. Y sería
 *  un error: el día que Google cambie el formato, Kairo se quedaría
 *  ciego con la clave bien puesta y sin decir nada, que es el peor fallo
 *  de todos —lo hemos vivido hoy con la dirección de Supabase—.
 *
 *  Así que solo se descarta lo que seguro que no es una clave: lo vacío
 *  y lo que lleva espacios dentro ("pon aquí tu clave"). Si algo raro
 *  cuela, cuesta un intento fallido de ciento cincuenta milisegundos;
 *  si algo bueno se descarta, cuesta que la web deje de funcionar. */
const parece = (v: string) => v.length > 0 && !/\s/.test(v);

/* Los nombres se escriben enteros y a mano, uno por línea, por lo mismo
   de siempre: `process.env.X` no es una lectura, es un hueco que se
   rellena al compilar, y escrito de otra forma no se rellena. */
function crudas(env: Entorno): string[] {
  return [
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_2,
    env.GEMINI_API_KEY_3,
    /* Y todas juntas separadas por comas, que es como se hace cuando son
       varias y no se quiere una variable por cada una. */
    ...(env.GEMINI_API_KEYS ?? "").split(","),
  ].map((v) => (v ?? "").trim());
}

/** De dónde se leen. Casi siempre del entorno; se puede pasar otro para
 *  poder contarlas desde una pantalla sin repetir estas reglas, que es
 *  como se acaba diciendo "2 claves" cuando solo se usa una. */
export type Entorno = Record<string, string | undefined>;

/** Las claves de Gemini, en orden y sin repetidas.
 *
 *  Sin repetidas porque una clave puesta dos veces no es una clave de
 *  repuesto: es el mismo cupo agotado, intentado dos veces, esperando
 *  dos veces. */
export function clavesDeGemini(env: Entorno = process.env): string[] {
  const vistas = new Set<string>();
  const buenas: string[] = [];

  for (const v of crudas(env)) {
    if (!parece(v) || vistas.has(v)) continue;
    vistas.add(v);
    buenas.push(v);
    if (buenas.length >= CLAVES_MAX) break;
  }

  return buenas;
}

/** La primera, para lo que solo necesita una. */
export const claveDeGemini = (): string => clavesDeGemini()[0] ?? "";

/** ¿Este fallo es de cuota? Es el único que tiene sentido reintentar con
 *  otra clave: un 404 (ese modelo ya no existe) o un 400 (la petición
 *  está mal) van a fallar igual con todas, y probarlas todas solo sirve
 *  para tardar cinco veces más en dar el mismo error. */
export function esDeCuota(e: unknown): boolean {
  const texto = e instanceof Error ? e.message : String(e);
  /* Google lo dice de varias formas según por dónde salga el error:
     el código 429, el estado RESOURCE_EXHAUSTED, o la frase "Resource
     has been exhausted". Las tres son lo mismo. */
  return /\b429\b|quota|rate limit|resource[_ ]?(has[_ ]?been[_ ]?)?exhausted/i.test(texto);
}
