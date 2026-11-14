/* EL TÍTULO DE CADA CHAT, RESUMIDO SIN IA.
 *
 * Antes el título era tu primera pregunta tal cual: "q es el token d
 * fornite". Ahora se arregla con reglas, aquí mismo, sin preguntarle a
 * ningún modelo: es instantáneo, no gasta cuota y funciona aunque Gemini
 * esté caído.
 *
 *   "q es el token d fornite"            → "Token de Fortnite"
 *   "cuanto cuesta un iphone 17"         → "Precio de un iPhone 17"
 *   "como hago una tortilla d patatas"   → "Cómo hago una tortilla de patatas"
 *
 * Solo toca títulos que parecen la pregunta en bruto (empiezan en
 * minúscula, con ¿ o ¡, o con "[Archivos adjuntos"). Los que ya están
 * bien —los de los Co-Works, los que has renombrado tú— no se tocan. */

// Las abreviaturas de mensaje, a palabra entera.
const ABREVIATURAS: Record<string, string> = {
  q: "que", k: "que", ke: "que", qe: "que",
  d: "de", x: "por", xq: "por qué", pq: "por qué", porq: "por qué", xk: "por qué",
  tb: "también", tmb: "también", tmbn: "también",
  pa: "para", xa: "para", cn: "con", sn: "sin", ns: "no sé", nse: "no sé",
  sbs: "sabes", dnd: "dónde", cndo: "cuándo", cdo: "cuándo", tl: "tal",
  mjr: "mejor", bn: "bien", msj: "mensaje", ntp: "no te preocupes",
  hcer: "hacer", aki: "aquí", tqm: "te quiero mucho", porfa: "por favor",
  info: "información", finde: "fin de semana",
};

// Nombres propios que casi siempre se escriben mal o en minúscula.
const NOMBRES: Record<string, string> = {
  fornite: "Fortnite", fortnite: "Fortnite", fornait: "Fortnite",
  minecraft: "Minecraft", maincra: "Minecraft", roblox: "Roblox",
  tiktok: "TikTok", instagram: "Instagram", insta: "Instagram",
  youtube: "YouTube", whatsapp: "WhatsApp", wasap: "WhatsApp", guasap: "WhatsApp",
  iphone: "iPhone", ipad: "iPad", android: "Android", windows: "Windows",
  playstation: "PlayStation", ps5: "PS5", ps4: "PS4", xbox: "Xbox", switch: "Switch",
  google: "Google", gemini: "Gemini", chatgpt: "ChatGPT", kairo: "Kairo",
  españa: "España", espana: "España", madrid: "Madrid", barcelona: "Barcelona",
  hacienda: "Hacienda", dgt: "DGT", itv: "ITV", irpf: "IRPF", iva: "IVA",
  sepe: "SEPE", dni: "DNI", nie: "NIE", bitcoin: "Bitcoin",
  "real madrid": "Real Madrid", barça: "Barça", barca: "Barça",
};

// Las tildes de las preguntas, que casi nadie pone al escribir rápido.
const TILDES: Record<string, string> = {
  que: "qué", como: "cómo", cuanto: "cuánto", cuanta: "cuánta", cuantos: "cuántos",
  cuantas: "cuántas", cuando: "cuándo", donde: "dónde", quien: "quién",
  quienes: "quiénes", cual: "cuál", cuales: "cuáles",
};

/* Lo que sobra al principio: saludos, "dime", "puedes"… Se quita en
   bucle, así "oye kairo dime q es…" queda en "q es…". */
const RELLENO =
  /^(hola+|holi|buenas( tardes| noches| días| dias)?|oye|ey|eh|mira|vale|bueno|pues|una pregunta|pregunta|por favor|kairo|tío|tio|bro|dime|explícame|explicame|explica|cuéntame|cuentame|necesito saber|quiero saber|me (puedes|podrías|podrias) (decir|explicar)|(puedes|podrías|podrias)( decirme| explicarme)?|sabes|me ayudas( con)?|ayúdame( con)?|ayudame( con)?)[\s,:]+/i;

// "qué es el X" / "qué son las X" / "qué significa X": el tema es X.
/* "me ha llegado una multa…", "necesito ayuda con mi tarea…", "quiero
   hacer una fiesta…": el tema es lo de después. */
const INTENCION =
  /^(me (ha|han) (llegado|dado|pasado|mandado|puesto)|tengo (una )?(duda|pregunta)( (sobre|de|con))?|necesito ayuda (con|para)|ayuda (con|para)|me gustar[íi]a|quiero|necesito)\s+(mi |mis |un |una )?/i;
const QUE_HAGO = /\s+(qu[ée] (hago|hacer|puedo hacer|me recomiendas)|ayuda|porfa|por favor)$/i;

// Tildes que casi nadie pone y que se notan en un título.
const ACENTOS: Record<string, string> = {
  sabado: "sábado", miercoles: "miércoles", aqui: "aquí", ahi: "ahí",
  tambien: "también", telefono: "teléfono", musica: "música", numero: "número",
  pelicula: "película", peliculas: "películas", futbol: "fútbol", ultimo: "último",
  examen: "examen", matematicas: "matemáticas", fisica: "física", quimica: "química",
  informatica: "informática", codigo: "código", pagina: "página", camara: "cámara",
};

const QUE_ES = /^qu[ée] (es|son|significa|quiere decir|era|eran|fue)( (el|la|los|las|un|una|lo))?\s+/i;
const PRECIO = /^cu[áa]nto (cuesta|cuestan|vale|valen|sale|salen)\s+/i;

const FINALES = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "y", "o", "en", "con",
  "para", "por", "a", "al", "que", "qué", "mi", "tu", "su", "lo", "se", "me",
]);

const MAX_PALABRAS = 6;

/** ¿Es un título en bruto, tal cual lo escribiste? */
export function pareceCrudo(titulo: string): boolean {
  const t = titulo.trim();
  if (!t) return false;
  if (/^(\[archivos adjuntos|[¿¡])/i.test(t)) return true;
  const primera = [...t][0];
  return primera !== primera.toUpperCase() && primera === primera.toLowerCase() && /\p{L}/u.test(primera);
}

/** El título resumido de una pregunta. Nunca vacío. */
export function tituloChat(texto: string): string {
  let t = texto
    .replace(/\[Archivos adjuntos:[^\]]*\]/gi, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\r\n]+/g, " ")
    .replace(/[¿?¡!"«»“”*#`_~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!t) return /archivos adjuntos/i.test(texto) ? "Archivos adjuntos" : "Chat";

  // Abreviaturas y nombres, palabra a palabra (y "real madrid" de dos).
  t = t
    .split(" ")
    .map((p) => {
      const base = p.replace(/[.,;:]+$/, "");
      const resto = p.slice(base.length);
      return (ABREVIATURAS[base] ?? NOMBRES[base] ?? ACENTOS[base] ?? base) + resto;
    })
    .join(" ");
  for (const [mal, bien] of Object.entries(NOMBRES)) {
    if (mal.includes(" ")) t = t.replace(new RegExp(`\\b${mal}\\b`, "g"), bien);
  }

  for (let i = 0; i < 4 && RELLENO.test(t); i++) t = t.replace(RELLENO, "");

  // La primera palabra, con su tilde si es de pregunta.
  const [primera, ...resto] = t.split(" ");
  t = [TILDES[primera] ?? primera, ...resto].join(" ");

  t = t.replace(QUE_HAGO, "");
  if (INTENCION.test(t)) t = t.replace(INTENCION, "");

  if (QUE_ES.test(t)) t = t.replace(QUE_ES, "");
  else if (PRECIO.test(t)) t = "precio de " + t.replace(PRECIO, "");

  // Corto, y sin acabar en "de", "la", "y"…
  let palabras = t.replace(/[.,;:]+/g, "").split(" ").filter(Boolean).slice(0, MAX_PALABRAS);
  while (palabras.length > 1 && FINALES.has(palabras[palabras.length - 1].toLowerCase())) {
    palabras = palabras.slice(0, -1);
  }
  t = palabras.join(" ");

  // Basura de teclado ("rtdsd"): sin una sola vocal no es un tema.
  if (!t || !/[aeiouáéíóúü0-9]/i.test(t)) return "Chat";

  return [...t][0].toUpperCase() + [...t].slice(1).join("");
}
