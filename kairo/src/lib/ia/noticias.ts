import type { Fuente } from "@/lib/tipos";

/* GOOGLE NOTICIAS, LA RED GRATIS PARA LO DE HOY.
 *
 * Cuando Gemini agota su cupo de búsqueda y no hay saldo en OpenRouter,
 * Kairo se quedaba con Wikipedia, que es estupenda para lo asentado y
 * no sabe nada de lo de esta mañana. Alguien preguntaba "¿por qué es la
 * huelga general de hoy?" y Kairo contestaba de memoria con un cartel
 * amarillo encima. Para la pregunta que más gente hace —qué está
 * pasando— no tenía nada.
 *
 * Google Noticias publica los titulares de cualquier búsqueda en una
 * dirección pública, en RSS: sin clave, sin tarjeta y sin cupo diario.
 * No trae el artículo entero, trae TITULAR, PERIÓDICO Y FECHA. Para "qué
 * ha pasado" casi siempre basta, y el modelo lo sabe porque se lo dice
 * la cabecera del bloque: son titulares, no reportajes.
 *
 * Va DELANTE de Wikipedia porque para lo reciente es mejor, y DETRÁS de
 * los buscadores de verdad porque un titular no es una página leída.
 */

export type Noticia = {
  titular: string;
  periodico: string;
  url: string;
  dominio: string;
  fecha: Date | null;
};

const VACIAS = new Set([
  "por", "que", "qué", "porq", "porque", "porqué", "es", "son", "la", "el", "lo", "los", "las",
  "de", "d", "del", "un", "una", "y", "o", "a", "al", "en", "me", "mi", "se", "te", "q", "k",
  "hoy", "ahora", "cual", "cuál", "como", "cómo", "dime", "sabes", "explicame", "explícame",
  "hay", "ha", "han", "pasa", "pasado", "pasando", "va", "sobre", "para", "con",
]);

/** De la pregunta, solo lo que sirve para buscar un titular. */
export function consultaDe(pregunta: string): string {
  const palabras = pregunta
    .toLowerCase()
    .replace(/[¿?¡!.,;:"«»()]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 1 && !VACIAS.has(p));
  return palabras.slice(0, 8).join(" ");
}

function descodificar(t: string): string {
  return t
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

const etiqueta = (bloque: string, nombre: string) =>
  descodificar(new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)</${nombre}>`).exec(bloque)?.[1] ?? "");

/** Lee el RSS de Google Noticias. Separado para poder probarlo sin red. */
export function leerRss(xml: string, max = 8): Noticia[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const out: Noticia[] = [];
  for (const it of items) {
    const periodico = etiqueta(it, "source");
    let titular = etiqueta(it, "title");
    // Google pone " - El País" al final del titular; ya va en su campo.
    if (periodico && titular.endsWith(` - ${periodico}`)) {
      titular = titular.slice(0, -(periodico.length + 3));
    }
    const url = etiqueta(it, "link");
    const fuente = /<source[^>]*url="([^"]+)"/.exec(it)?.[1] ?? url;
    let dominio = "";
    try {
      dominio = new URL(fuente).hostname.replace(/^www\./, "");
    } catch {
      /* sin dominio */
    }
    const f = new Date(etiqueta(it, "pubDate"));
    if (!titular || !url) continue;
    out.push({ titular, periodico, url, dominio, fecha: Number.isNaN(f.getTime()) ? null : f });
  }
  // Lo más reciente primero: para "qué pasa hoy", lo de hoy manda.
  out.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));
  return out.slice(0, max);
}

/** Busca titulares de los últimos días. Nunca lanza: si falla, lista vacía. */
export async function noticiasDe(pregunta: string, plazo: number): Promise<Noticia[]> {
  const q = consultaDe(pregunta);
  if (!q) return [];
  const url =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(`${q} when:3d`) +
    "&hl=es&gl=ES&ceid=ES:es";
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(Math.max(1000, plazo)),
      headers: { "user-agent": "Mozilla/5.0 (compatible; Kairo/1.0)" },
      cache: "no-store",
    });
    if (!r.ok) return [];
    return leerRss(await r.text());
  } catch {
    return [];
  }
}

export function comoHechos(noticias: Noticia[], hoy: string): string {
  if (!noticias.length) return "";
  const fecha = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }).format(d)
      : "sin fecha";
  return (
    `ESTO SON TITULARES DE GOOGLE NOTICIAS DE LOS ÚLTIMOS DÍAS (hoy es ${hoy}).\n` +
    "No son artículos enteros: son el titular, el periódico y la hora. Úsalos así:\n" +
    "- Lo que dicen los titulares, lo puedes dar como hecho y citar el periódico.\n" +
    "- Lo que NO dicen, no lo rellenes de memoria como si viniera de aquí.\n" +
    "- Si varios periódicos dicen lo mismo, es sólido. Si solo uno, dilo.\n\n" +
    noticias.map((n) => `- [${fecha(n.fecha)}] ${n.titular} (${n.periodico || n.dominio})`).join("\n")
  );
}

export function comoFuentes(noticias: Noticia[]): Fuente[] {
  return noticias.map((n) => ({
    titulo: n.titular,
    url: n.url,
    dominio: n.dominio || n.periodico,
    tipo: "web" as const,
  }));
}
