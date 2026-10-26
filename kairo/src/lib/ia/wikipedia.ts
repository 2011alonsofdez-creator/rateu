import type { Fuente } from "@/lib/tipos";

/* EL BUSCADOR QUE NO SE AGOTA.
 *
 * Kairo busca con Google (por Gemini) y, si eso falla, con Claude. Las
 * dos son buenas y las dos se acaban: la capa gratuita de Gemini tiene
 * un tope diario POR CLAVE Y POR MODELO, y Claude cuesta dinero y hace
 * falta clave. El día que las dos dicen basta, Kairo se queda mudo y
 * contesta de memoria con un cartel amarillo encima.
 *
 * Wikipedia no se acaba. No hay clave, no hay tarjeta, no hay cupo que
 * se gaste a media tarde. A cambio cubre mucho menos: va bien para
 * "quién es", "qué es" y "qué pasó en", y va mal para lo de hace cuatro
 * horas, porque un artículo tarda en recoger lo que acaba de pasar.
 *
 * Por eso va la última y no la primera. No es el buscador bueno: es el
 * suelo, para que "no he podido mirar" deje de ser la única salida.
 *
 * Aquí no hay modelo de IA. Se le pregunta a la API de MediaWiki, se
 * cogen las entradillas de los artículos que salen y se devuelven tal
 * cual. Lo que no haya en Wikipedia, no se inventa.
 */

/** Cuántos artículos se traen. Tres cubre la pregunta y sus alrededores;
 *  más es llenar el prompt de relleno que empuja fuera lo que importa. */
const ARTICULOS = 3;

/** Cuánto se queda de cada entradilla. */
const POR_ARTICULO = 1200;

/** Lo que como mucho puede tardar. Es el último recurso y entra con el
 *  plazo ya medio gastado: si tarda, no sirve. */
const PLAZO = 6000;

/* Wikimedia pide que cada programa diga quién es y dónde encontrarlo.
   No es un formalismo: las peticiones sin identificar son las primeras
   que se cortan cuando hay que cortar. */
const QUIEN_SOY = "Kairo/1.0 (+https://github.com/2011alonsofdez-creator/rateu)";

export type Articulo = { titulo: string; url: string; extracto: string };

/* LAS PALABRAS QUE NO AYUDAN A BUSCAR.
 *
 * El buscador de Wikipedia es de texto completo, así que "quién ganó el
 * partido de ayer" no se le atraganta. Pero las palabras de pregunta
 * pesan en el ranking y empujan hacia artículos sobre la palabra en sí
 * —"ayer", "quién"— en vez de hacia el tema. Se quitan solo las de
 * delante y las vacías; los nombres, las cifras y los años se quedan
 * enteros, que son justo lo que encuentra la página buena. */
const VACIAS = new Set([
  "a", "al", "ahora", "algun", "alguna", "alguno", "ayer", "como", "con",
  "cual", "cuales", "cuando", "cuanto", "cuanta", "cuantos", "cuantas",
  "de", "del", "donde", "dime", "el", "ella", "ellos", "en", "es", "esa",
  "ese", "eso", "esta", "este", "esto", "hay", "hoy", "la", "las", "le",
  "lo", "los", "me", "mismo", "much", "muy", "ni", "no", "o", "para",
  "pasado", "por", "porque", "que", "qué", "quien", "quienes", "se",
  "ser", "si", "sobre", "son", "su", "sus", "tal", "te", "tiene", "un",
  "una", "uno", "unos", "unas", "y", "ya",
  // y las de siempre en inglés, que la gente mezcla
  "the", "what", "who", "when", "where", "which", "is", "are", "was",
  "were", "did", "does", "do", "of", "in", "on", "at", "to", "for",
]);

const sinTildes = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * La pregunta, convertida en algo que Wikipedia pueda buscar.
 *
 * Es una función aparte y exportada a propósito: es lo único de aquí
 * que se puede equivocar en silencio —devolver cadena vacía y hacer
 * creer que Wikipedia no tenía nada— y así se prueba sola, sin red.
 */
export function terminosDe(pregunta: string): string {
  const palabras = pregunta
    .replace(/[¿?¡!.,;:()"«»]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const utiles = palabras.filter(
    (p) => !VACIAS.has(sinTildes(p.toLowerCase())),
  );

  /* Si al quitar lo vacío no queda nada, se busca la pregunta entera.
     Una pregunta de tres palabras corrientes ("qué es esto") no da
     términos, y devolver "" aquí sería llamar a la API con la cadena
     vacía: contesta sin resultados y el diario diría "no hay nada en
     Wikipedia", que no es verdad. */
  const base = utiles.length ? utiles : palabras;

  // Diez palabras es de sobra; a partir de ahí el ranking empeora.
  return base.slice(0, 10).join(" ").trim();
}

/** Lo que devuelve la API, convertido en artículos.
 *
 *  Separado de la llamada para poder probarlo con una respuesta de
 *  verdad guardada en un archivo, sin internet. */
export function leerLoDeWikipedia(datos: unknown): Articulo[] {
  const paginas = (datos as { query?: { pages?: unknown[] } })?.query?.pages;
  if (!Array.isArray(paginas)) return [];

  const salida: Articulo[] = [];
  for (const p of paginas) {
    const pag = p as { title?: string; fullurl?: string; extract?: string };
    const extracto = (pag.extract ?? "").replace(/\s+/g, " ").trim();
    if (!pag.title || !extracto) continue;

    salida.push({
      titulo: pag.title,
      url:
        pag.fullurl ??
        `https://es.wikipedia.org/wiki/${encodeURIComponent(pag.title.replace(/ /g, "_"))}`,
      extracto: extracto.slice(0, POR_ARTICULO),
    });
  }

  /* La API no promete orden, y `index` es el puesto que le dio el
     buscador. Sin esto el artículo más flojo puede salir primero, y el
     primero es el que más pesa en la respuesta. */
  const puesto = new Map<string, number>();
  for (const p of paginas) {
    const pag = p as { title?: string; index?: number };
    if (pag.title) puesto.set(pag.title, pag.index ?? 99);
  }
  salida.sort((a, b) => (puesto.get(a.titulo) ?? 99) - (puesto.get(b.titulo) ?? 99));

  return salida.slice(0, ARTICULOS);
}

/** La dirección que hay que pedir. Exportada para poder verla en una
 *  prueba sin tener que llamar. */
export function urlDeBusqueda(terminos: string, idioma: string): string {
  const q = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: terminos,
    gsrlimit: String(ARTICULOS),
    prop: "extracts|info",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    exlimit: String(ARTICULOS),
  });
  return `https://${idioma}.wikipedia.org/w/api.php?${q}`;
}

/** Busca en Wikipedia y devuelve los artículos que encuentre. */
export async function articulosDe(
  pregunta: string,
  idioma = "es",
  plazo = PLAZO,
): Promise<Articulo[]> {
  const terminos = terminosDe(pregunta);
  if (!terminos) return [];

  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), plazo);

  try {
    const r = await fetch(urlDeBusqueda(terminos, idioma), {
      signal: corte.signal,
      headers: { "User-Agent": QUIEN_SOY, "Api-User-Agent": QUIEN_SOY },
    });
    if (!r.ok) return [];
    return leerLoDeWikipedia(await r.json());
  } catch {
    /* Se cayó, tardó demasiado o devolvió algo que no es JSON. Da igual
       cuál: esto es la última red, y una red que falla no se anuncia,
       se cae al suelo de abajo —que es decir que no se ha podido
       mirar—. El motivo se apunta en el diario desde `buscar.ts`. */
    return [];
  } finally {
    clearTimeout(reloj);
  }
}

/** Los artículos, escritos como los hechos que espera el prompt. */
export function comoHechos(articulos: Articulo[]): string {
  if (!articulos.length) return "";

  /* La advertencia va DENTRO del bloque, no en un comentario, porque el
     bloque se presenta al modelo como "lo que acabas de buscar, esto es
     lo que hay HOY". De Wikipedia eso no es del todo cierto: un partido
     de anoche puede tardar horas en aparecer. Decirlo aquí es la
     diferencia entre un dato con su edad y un dato disfrazado de
     recién hecho. */
  const cabecera =
    "Buscado en Wikipedia (no en un buscador web). Wikipedia es fiable " +
    "para lo asentado y puede ir con horas de retraso en lo que acaba de " +
    "pasar: si la pregunta es de hace un rato, dilo.";

  const cuerpo = articulos
    .map((a) => `- «${a.titulo}» (${a.url}):\n  ${a.extracto}`)
    .join("\n");

  return `${cabecera}\n\n${cuerpo}`;
}

/** Los artículos, como fuentes para enseñar debajo de la respuesta. */
export function comoFuentes(articulos: Articulo[]): Fuente[] {
  return articulos.map((a) => ({
    titulo: a.titulo,
    url: a.url,
    dominio: "wikipedia.org",
    tipo: "web" as const,
  }));
}
