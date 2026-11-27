import type { Fuente } from "@/lib/tipos";

/* MÁS FUENTES: BUSCADORES DE VERDAD Y LEER LAS PÁGINAS.
 *
 * Hasta ahora, fuera de Gemini, Kairo tenía titulares (Google Noticias)
 * y primeros párrafos (Wikipedia). Para "reseñas del GTA 6" o "quién es
 * DjMario" eso se queda corto: hace falta lo que dicen las páginas.
 *
 * Esto añade dos cosas:
 *
 *   1. Buscadores web con API y capa gratis, que se encienden solos si
 *      su clave está puesta en Vercel (sin clave, no hacen nada):
 *        - TAVILY_API_KEY  → Tavily (1000 búsquedas/mes gratis). Ya
 *          devuelve el trozo de la página que importa.
 *        - BRAVE_SEARCH_KEY → Brave Search. Resultados con varios
 *          fragmentos por página.
 *
 *   2. LEER las mejores páginas: se descargan las 3 primeras (4 s como
 *      mucho, en paralelo) y se quedan los párrafos que hablan del tema.
 *      Un fragmento de buscador dice "aquí hay algo"; el párrafo dice
 *      QUÉ hay.
 *
 * Todo esto va en paralelo con la búsqueda principal, así que no suma
 * tiempo delante de la respuesta salvo que lo demás sea más rápido. */

export type Resultado = {
  titulo: string;
  url: string;
  dominio: string;
  /** Lo que dice la página sobre el tema (fragmento o párrafos leídos). */
  texto: string;
  fecha: string | null;
  /** Si `texto` sale de leer la página entera, no de un fragmento. */
  leida: boolean;
};

const UA = "Mozilla/5.0 (compatible; Kairo/1.0; +https://kairo.app)";

/* Páginas que no se pueden leer con un fetch (piden sesión, son vídeo o
   todo es JavaScript). Siguen valiendo como fuente con su fragmento. */
const NO_LEER = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|x\.com|twitter\.com|reddit\.com|twitch\.tv|kick\.com|linkedin\.com|news\.google\.com)$/i;

const dominioDe = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const limpio = (t: string) => t.replace(/\s+/g, " ").trim();

/** ¿Hay algún buscador con clave puesto? */
export function hayBuscadorLibre(): boolean {
  // DuckDuckGo no necesita clave: siempre hay buscador, salvo que se apague.
  return !(process.env.KAIRO_SIN_DUCKDUCKGO ?? "").trim() || Boolean(process.env.TAVILY_API_KEY?.trim() || process.env.BRAVE_SEARCH_KEY?.trim());
}

/* ---------- Tavily ---------- */

export function leerTavily(datos: unknown): Resultado[] {
  const lista = (datos as { results?: unknown[] })?.results;
  if (!Array.isArray(lista)) return [];
  const out: Resultado[] = [];
  for (const r of lista) {
    const x = r as { title?: string; url?: string; content?: string; published_date?: string };
    if (!x.url || !/^https?:\/\//.test(x.url)) continue;
    out.push({
      titulo: limpio(x.title ?? dominioDe(x.url)),
      url: x.url,
      dominio: dominioDe(x.url),
      texto: limpio(x.content ?? "").slice(0, 900),
      fecha: x.published_date ?? null,
      leida: false,
    });
  }
  return out;
}

/* Trámites, leyes, impuestos: además de la búsqueda normal, una solo en
   webs oficiales. Lo que diga el BOE o Hacienda manda sobre un blog. */
const DE_TRAMITES =
  /(tr[aá]mite|\bley\b|multa|hacienda|renta|irpf|\biva\b|aut[oó]nomo|seguridad social|\bparo\b|sepe|\bdgt\b|\bitv\b|\bdni\b|\bnie\b|pasaporte|empadron|cita previa|ayuda|subvenci|\bbono\b|pensi[oó]n|impuesto|\bboe\b|deducci|baja (laboral|por)|n[oó]mina|despido|finiquito|contrato|alquiler|herencia|vacaciones)/i;
const WEBS_OFICIALES = ["boe.es", "agenciatributaria.gob.es", "seg-social.es", "sepe.es", "dgt.es", "administracion.gob.es", "mites.gob.es", "lamoncloa.gob.es", "ine.es", "bde.es"];

async function tavily(consulta: string, plazo: number, soloOficial = false): Promise<Resultado[]> {
  const clave = process.env.TAVILY_API_KEY?.trim();
  if (!clave) return [];
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: AbortSignal.timeout(plazo),
      headers: { "content-type": "application/json", authorization: `Bearer ${clave}` },
      body: JSON.stringify({
        query: consulta,
        search_depth: "basic",
        max_results: soloOficial ? 4 : 6,
        include_answer: false,
        ...(soloOficial ? { include_domains: WEBS_OFICIALES } : {}),
      }),
      cache: "no-store",
    });
    if (!r.ok) return [];
    return leerTavily(await r.json());
  } catch {
    return [];
  }
}

/* ---------- Brave ---------- */

export function leerBrave(datos: unknown): Resultado[] {
  const lista = (datos as { web?: { results?: unknown[] } })?.web?.results;
  if (!Array.isArray(lista)) return [];
  const sinHtml = (t: string) => t.replace(/<[^>]+>/g, "");
  const out: Resultado[] = [];
  for (const r of lista) {
    const x = r as { title?: string; url?: string; description?: string; extra_snippets?: string[]; page_age?: string; age?: string };
    if (!x.url || !/^https?:\/\//.test(x.url)) continue;
    const texto = [x.description ?? "", ...(x.extra_snippets ?? []).slice(0, 3)].map(sinHtml).map(limpio).filter(Boolean).join(" … ");
    out.push({
      titulo: limpio(sinHtml(x.title ?? dominioDe(x.url))),
      url: x.url,
      dominio: dominioDe(x.url),
      texto: texto.slice(0, 900),
      fecha: x.page_age ?? x.age ?? null,
      leida: false,
    });
  }
  return out;
}

async function brave(consulta: string, plazo: number): Promise<Resultado[]> {
  const clave = process.env.BRAVE_SEARCH_KEY?.trim();
  if (!clave) return [];
  const q = new URLSearchParams({ q: consulta, country: "ES", search_lang: "es", count: "8", extra_snippets: "true" });
  try {
    const r = await fetch(`https://api.search.brave.com/res/v1/web/search?${q}`, {
      signal: AbortSignal.timeout(plazo),
      headers: { accept: "application/json", "x-subscription-token": clave },
      cache: "no-store",
    });
    if (!r.ok) return [];
    return leerBrave(await r.json());
  } catch {
    return [];
  }
}

/* ---------- DuckDuckGo (sin clave, siempre encendido) ---------- */

/* Probado el 25-11 desde un servidor en la nube (GitHub Actions, como
   Vercel): la versión HTML de DuckDuckGo contesta 200 con diez
   resultados y su fragmento. Bing por RSS también, pero sus condiciones
   no permiten usarlo en un producto; Google Noticias, ese día, 429. Esto
   es lo que hace que Kairo busque aunque no quede cuota de ninguna IA. */

const entidades = (t: string) =>
  t
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));

/** Lee la página de resultados de DuckDuckGo. Separado para probarlo sin red. */
export function leerDuckDuckGo(html: string): Resultado[] {
  const out: Resultado[] = [];
  const bloques = html.split(/<div class="result results_links/).slice(1);
  for (const b of bloques) {
    if (/result--ad|y\.js\?/.test(b.slice(0, 400))) continue; // anuncios
    const a = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(b);
    if (!a) continue;
    let url = entidades(a[1]);
    const salto = /[?&]uddg=([^&]+)/.exec(url);
    if (salto) url = decodeURIComponent(salto[1]);
    if (url.startsWith("//")) url = "https:" + url;
    if (!/^https?:\/\//.test(url)) continue;
    const frag = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/.exec(b);
    out.push({
      titulo: limpio(entidades(a[2])),
      url,
      dominio: dominioDe(url),
      texto: limpio(entidades(frag?.[1] ?? "")).slice(0, 600),
      fecha: null,
      leida: false,
    });
    if (out.length >= 8) break;
  }
  return out;
}

async function duckduckgo(consulta: string, plazo: number): Promise<Resultado[]> {
  if ((process.env.KAIRO_SIN_DUCKDUCKGO ?? "").trim()) return [];
  try {
    const r = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      signal: AbortSignal.timeout(plazo),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        "accept-language": "es-ES,es;q=0.9",
      },
      body: new URLSearchParams({ q: consulta, kl: "es-es" }).toString(),
      cache: "no-store",
    });
    if (!r.ok) return [];
    return leerDuckDuckGo(await r.text());
  } catch {
    return [];
  }
}

/* ---------- Canales de YouTube (para youtubers y streamers) ---------- */

/* "quién es djmario", "cuántos subs tiene X": lo que de verdad contesta
   es el propio canal —nombre, @, suscriptores y de qué va—. La página de
   búsqueda de YouTube lo trae dentro (probado el 25-11 desde la nube:
   "DjMaRiiO · @DjMaRiiO · 10,4 millones de suscriptores"). Solo se usa
   para preguntas sobre personas, y solo los canales cuyo nombre casa
   con la persona preguntada. */

/** Lee los canales de la página de búsqueda de YouTube. Sin red, para probarlo. */
export function leerCanales(html: string, max = 3): Resultado[] {
  const out: Resultado[] = [];
  const trozos = html.split('"channelRenderer":{').slice(1);
  for (const t of trozos) {
    const b = t.slice(0, 6000);
    const id = /"channelId":"([\w-]+)"/.exec(b)?.[1];
    const nombre = /"title":\{"simpleText":"([^"]+)"/.exec(b)?.[1];
    if (!id || !nombre) continue;
    const arroba = /"subscriberCountText":\{"simpleText":"(@[^"]+)"/.exec(b)?.[1] ?? "";
    // YouTube pone los suscriptores en un campo u otro según el día.
    const subs =
      /"label":"([^"]*suscriptores[^"]*)"/.exec(b)?.[1] ??
      /"simpleText":"([^"]*(suscriptores|subscribers)[^"]*)"/.exec(b)?.[1] ??
      "";
    const desc = [...(/"descriptionSnippet":\{"runs":\[([\s\S]*?)\]\}/.exec(b)?.[1] ?? "").matchAll(/"text":"([^"]*)"/g)]
      .map((m) => m[1])
      .join("")
      .replace(/\\n/g, " ");
    const url = arroba ? `https://www.youtube.com/${arroba}` : `https://www.youtube.com/channel/${id}`;
    out.push({
      titulo: `${nombre} (canal de YouTube)`,
      url,
      dominio: "youtube.com",
      texto: limpio([`Canal de YouTube «${nombre}»`, arroba, subs, desc].filter(Boolean).join(" · ")).slice(0, 500),
      fecha: new Date().toISOString().slice(0, 10),
      leida: true,
    });
    if (out.length >= max) break;
  }
  return out;
}

/** Busca canales de YouTube que casen con alguna palabra clave. Nunca lanza. */
export async function canalesDe(consulta: string, clave: string[], plazo: number): Promise<Resultado[]> {
  if ((process.env.KAIRO_SIN_YOUTUBE ?? "").trim()) return [];
  try {
    const q = encodeURIComponent(consulta);
    const pedir = async (filtro: string) => {
      const r = await fetch(`https://www.youtube.com/results?search_query=${q}${filtro}&hl=es&gl=ES`, {
        signal: AbortSignal.timeout(plazo),
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
          "accept-language": "es-ES,es;q=0.9",
        },
        cache: "no-store",
      });
      return r.ok ? leerCanales(await r.text()) : [];
    };
    /* Con el filtro "solo canales" salen mejor, pero a veces YouTube no
       lo aplica y devuelve otra cosa: entonces, la búsqueda normal, que
       también suele traer el canal arriba. */
    let canales = await pedir("&sp=EgIQAg%253D%253D");
    if (!canales.length) canales = await pedir("");
    const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/(.)\1+/g, "$1");
    return canales.filter((c) => clave.some((w) => norm(c.titulo + " " + c.url).includes(norm(w))));
  } catch {
    return [];
  }
}

/* ---------- La wiki de youtubers (Fandom) ---------- */

/* Muchos youtubers y streamers españoles no tienen artículo en
   Wikipedia, pero sí en la Wiki YouTube Pedia de Fandom (DjMaRiiO:
   nombre real, de dónde es, de qué va su canal). Su API contesta desde
   un servidor sin clave (probado el 25-11). */
export async function wikiDeYoutubers(clave: string[], plazo: number): Promise<Resultado[]> {
  if (!clave.length || (process.env.KAIRO_SIN_FANDOM ?? "").trim()) return [];
  const base = "https://youtube.fandom.com/es/api.php";
  const ua = { "user-agent": "Kairo/1.0 (+https://github.com/2011alonsofdez-creator/rateu)" };
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/(.)\1+/g, "$1");
  try {
    const q = new URLSearchParams({ action: "query", list: "search", format: "json", srlimit: "3", srsearch: clave.join(" ") });
    const r = await fetch(`${base}?${q}`, { signal: AbortSignal.timeout(plazo), headers: ua, cache: "no-store" });
    if (!r.ok) return [];
    const titulos = (((await r.json()) as { query?: { search?: { title: string }[] } }).query?.search ?? [])
      .map((x) => x.title)
      .filter((t) => clave.some((w) => norm(t).includes(norm(w)) || norm(w).includes(norm(t))));
    const titulo = titulos[0];
    if (!titulo) return [];
    const p = new URLSearchParams({ action: "parse", page: titulo, prop: "text", format: "json", section: "0", redirects: "1" });
    const r2 = await fetch(`${base}?${p}`, { signal: AbortSignal.timeout(plazo), headers: ua, cache: "no-store" });
    if (!r2.ok) return [];
    const html = ((await r2.json()) as { parse?: { text?: { "*"?: string } } }).parse?.text?.["*"] ?? "";
    const texto = parrafosDe(html, [], 1400);
    if (!texto) return [];
    return [{
      titulo: `${titulo} · Wiki YouTube Pedia`,
      url: `https://youtube.fandom.com/es/wiki/${encodeURIComponent(titulo.replace(/ /g, "_"))}`,
      dominio: "youtube.fandom.com",
      texto,
      fecha: null,
      leida: true,
    }];
  } catch {
    return [];
  }
}

/* ---------- Leer una página ---------- */

/** Los párrafos de un HTML que hablan del tema. Separado para probarlo sin red. */
export function parrafosDe(html: string, clave: string[], max = 1400): string {
  const cuerpo = html
    .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const bloques = [...cuerpo.matchAll(/<(p|li|h[1-4]|td)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) =>
      limpio(
        m[2]
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;|&apos;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))),
      ),
    )
    .filter((t) => t.length >= 40 && !/cookies|suscr[ií]bete|newsletter|todos los derechos|inicia sesi[oó]n/i.test(t));

  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/(.)\1+/g, "$1");
  const puntos = (t: string) => clave.filter((w) => norm(t).includes(norm(w))).length;
  // Los que nombran el tema, en el orden de la página; si ninguno, los primeros.
  const buenos = clave.length ? bloques.filter((b) => puntos(b) > 0) : bloques;
  const elegidos = (buenos.length ? buenos : bloques.slice(0, 4));

  let out = "";
  const vistos = new Set<string>();
  for (const b of elegidos) {
    if (vistos.has(b)) continue;
    vistos.add(b);
    if (out.length + b.length > max) {
      if (!out) out = b.slice(0, max);
      break;
    }
    out += (out ? "\n" : "") + b;
  }
  return out;
}

async function leerPagina(url: string, clave: string[], plazo: number): Promise<string> {
  if (NO_LEER.test(dominioDe(url)) || /\.pdf($|\?)/i.test(url)) return "";
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(plazo),
      headers: { "user-agent": UA, accept: "text/html", "accept-language": "es-ES,es;q=0.9,en;q=0.6" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!r.ok || !/text\/html/i.test(r.headers.get("content-type") ?? "")) return "";
    // Como mucho 800 KB: lo que importa está arriba y algunas pesan megas.
    const html = (await r.text()).slice(0, 800_000);
    return parrafosDe(html, clave);
  } catch {
    return "";
  }
}

/* ---------- Todo junto ---------- */

/** Busca en la web (si hay clave) y lee las mejores páginas. Nunca lanza.
 *  `extrasALeer` son direcciones de otras fuentes (p. ej. las que ya ha
 *  encontrado Gemini) que también merece la pena leer. */
export async function buscarYLeer(
  consulta: string,
  clave: string[],
  plazo: number,
  extrasALeer: string[] = [],
): Promise<Resultado[]> {
  const inicio = Date.now();
  const [o, a, b, c] = await Promise.all([
    DE_TRAMITES.test(consulta) ? tavily(consulta, plazo - 1500, true) : Promise.resolve([]),
    tavily(consulta, plazo - 1500),
    brave(consulta, plazo - 1500),
    duckduckgo(consulta, Math.min(6000, plazo - 1500)),
  ]);

  // Sin repetir página: la misma dirección por dos buscadores vale una vez.
  const vistas = new Set<string>();
  const todos: Resultado[] = [];
  for (const r of [...o, ...a, ...b, ...c]) {
    const llave = r.url.replace(/[?#].*$/, "").replace(/\/$/, "");
    if (vistas.has(llave)) continue;
    vistas.add(llave);
    todos.push(r);
  }

  // Leer las 3 mejores que se puedan leer (y las extra, hasta 3 en total).
  const queda = Math.max(1500, Math.min(4000, plazo - (Date.now() - inicio)));
  const aLeer = [
    ...todos.filter((r) => !NO_LEER.test(r.dominio)).map((r) => r.url),
    ...extrasALeer.filter((u) => /^https?:\/\//.test(u) && !NO_LEER.test(dominioDe(u))),
  ]
    .filter((u, i, l) => l.indexOf(u) === i)
    .slice(0, 3);

  const leidas = await Promise.all(aLeer.map((u) => leerPagina(u, clave, queda)));
  aLeer.forEach((url, i) => {
    const texto = leidas[i];
    if (!texto) return;
    const ya = todos.find((r) => r.url === url);
    if (ya) {
      ya.texto = texto;
      ya.leida = true;
    } else {
      todos.push({ titulo: dominioDe(url), url, dominio: dominioDe(url), texto, fecha: null, leida: true });
    }
  });

  return todos.filter((r) => r.texto).slice(0, 8);
}

/* LO FIABLE PRIMERO (27-11).
 *
 * No todas las páginas valen lo mismo. Para "quién es DjMario" salen a
 * la vez su canal, una wiki y webs de "patrimonio neto y edad" que
 * copian e inventan. Se ordenan así: oficial > medios y referencias >
 * el resto > las de dudosa fiabilidad, que además van marcadas para
 * que el modelo no se fíe de ellas sin que otra lo confirme. */
const OFICIAL = /(\.gob\.es|\.gov(\.[a-z]{2})?|boe\.es|europa\.eu|bde\.es|agenciatributaria\.(es|gob\.es)|seg-social\.(es|gob\.es)|sepe\.es|dgt\.es|ine\.es|\.edu|\.ac\.[a-z]{2}|who\.int|un\.org|aemet\.es|cnmc\.es)$/i;
const BUENA =
  /(^|\.)(wikipedia\.org|rtve\.es|elpais\.com|elmundo\.es|abc\.es|lavanguardia\.com|elconfidencial\.com|20minutos\.es|europapress\.es|efe\.com|eldiario\.es|elespanol\.com|xataka\.com|ign\.com|3djuegos\.com|vandal\.elespanol\.com|marca\.com|as\.com|mundodeportivo\.com|expansion\.com|cincodias\.elpais\.com|ocu\.org|bbc\.com|reuters\.com|apnews\.com|theverge\.com|youtube\.com|socialblade\.com|rockstargames\.com|metacritic\.com|opencritic\.com)$/i;
const DUDOSA =
  /(^|\.)(famousbirthdays\.com|ifann\.net|tunota\.com|biografiasyvidas\.com|celebsnetworth|networth|wikiwand|quora\.com|answers\.|brainly|pinterest\.|scribd\.com|medium\.com|blogspot\.|wordpress\.com)/i;

/** 0 oficial · 1 medio o referencia · 2 normal · 3 dudosa. */
export function confianza(dominio: string): number {
  if (OFICIAL.test(dominio)) return 0;
  if (BUENA.test(dominio)) return 1;
  if (DUDOSA.test(dominio)) return 3;
  return 2;
}

export function comoHechos(resultados: Resultado[], hoy: string): string {
  if (!resultados.length) return "";
  resultados = [...resultados].sort((a, b) => confianza(a.dominio) - confianza(b.dominio));
  const marca = (r: Resultado) =>
    confianza(r.dominio) === 0 ? "[OFICIAL] " : confianza(r.dominio) === 3 ? "[POCO FIABLE] " : "";
  return (
    `ESTO ES LO QUE DICEN PÁGINAS WEB DE VERDAD (búsqueda de hoy, ${hoy}).\n` +
    "Las marcadas [LEÍDA] son párrafos sacados de la propia página; las demás, el fragmento del buscador.\n" +
    "- Úsalo como base de la respuesta y cita la web cuando des un dato.\n" +
    "- Si una página no habla de lo que te preguntan (otro juego, otra persona con el mismo nombre), ignórala.\n" +
    "- Van ordenadas de más a menos fiables. [OFICIAL] manda sobre todo lo demás. Lo marcado [POCO FIABLE] (webs de biografías y 'patrimonio neto' que copian e inventan) NO lo uses salvo que otra fuente lo confirme.\n" +
    "- Si dos páginas se contradicen, dilo. Si es una tienda o una web de opinión, tenlo en cuenta.\n\n" +
    resultados
      .map((r) => `- ${marca(r)}${r.leida ? "[LEÍDA] " : ""}${r.titulo} (${r.dominio}${r.fecha ? `, ${r.fecha}` : ""}):\n  ${r.texto.replace(/\n/g, "\n  ")}`)
      .join("\n")
  );
}

export function comoFuentes(resultados: Resultado[]): Fuente[] {
  return [...resultados].sort((a, b) => confianza(a.dominio) - confianza(b.dominio)).filter((r) => confianza(r.dominio) < 3).map((r) => ({ titulo: r.titulo, url: r.url, dominio: r.dominio, tipo: "web" as const }));
}
