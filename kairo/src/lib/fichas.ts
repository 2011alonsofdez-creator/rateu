/* Las cuentas pequeñas de Gist y Paperwork.
 *
 * Viven aquí fuera y no dentro de sus páginas por un motivo: son las
 * que se equivocan. Un día de diferencia en "faltan 3 días" o un
 * minuto mal calculado en el enlace de un vídeo no dan error, solo
 * mienten. Aquí se pueden probar de una en una.
 */

/** El identificador de un vídeo de YouTube, o null si no lo es. */
export function idDeYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    if (/(^|\.)youtu\.be$/i.test(u.hostname)) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (!/(^|\.)youtube\.com$/i.test(u.hostname)) return null;

    const v = u.searchParams.get("v");
    if (v) return v;

    const corto = u.pathname.match(/\/(shorts|embed|live|v)\/([\w-]+)/);
    return corto?.[2] ?? null;
  } catch {
    return null;
  }
}

/** "12:30" → 750 segundos. "1:02:03" → 3723. */
export function segundosDe(marca: string): number | null {
  const limpia = marca.trim();
  if (!/^\d{1,2}(:\d{1,2}){1,2}$/.test(limpia)) return null;

  const partes = limpia.split(":").map(Number);
  if (partes.some((n) => !Number.isFinite(n) || n < 0)) return null;
  // Los minutos y los segundos no pasan de 59; si pasan, es otra cosa.
  if (partes.slice(1).some((n) => n > 59)) return null;

  return partes.reduce((total, n) => total * 60 + n, 0);
}

/** Dónde empieza una marca, sea un minuto suelto ("12:30") o un tramo
 *  ("12:30-15:40"). Los tramos llegaron con los resúmenes parte por
 *  parte: cada parte ocupa un trozo del vídeo, no un instante. Lo que
 *  interesa de un tramo es por dónde entrar. */
export function comienzoDe(marca: string): number | null {
  /* Se parte por el guion, pero no por cualquiera: los separadores de
     tramo son el guion normal y las dos rayas largas. */
  return segundosDe(marca.trim().split(/[-–—]/)[0] ?? "");
}

/** El enlace del vídeo, saltando al minuto exacto. */
export function enlaceConMinuto(url: string, marca: string): string {
  const s = comienzoDe(marca);
  if (s === null || !idDeYoutube(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}t=${s}s`;
}

/* Las direcciones sueltas dentro de un texto. El paréntesis y la coma
   finales se quedan fuera: "mira (https://youtu.be/x)" no lleva el
   paréntesis dentro del enlace, aunque pegado lo parezca. */
const ENLACES = /https?:\/\/[^\s<>"'`]+/gi;

/** El primer enlace de YouTube que haya en un texto, o null.
 *
 *  Hace falta porque nadie pega un enlace a secas: pega "mírate esto
 *  https://youtu.be/x" y espera que se entienda igual. */
export function primerEnlaceDeYoutube(texto: string): string | null {
  for (const trozo of texto.match(ENLACES) ?? []) {
    const limpio = trozo.replace(/[.,;:!?)\]}'"]+$/, "");
    if (idDeYoutube(limpio)) return limpio;
  }
  return null;
}

/** Días naturales que faltan. Hoy = 0, ayer = -1. */
export function diasHasta(fecha: string | null, hoy = new Date()): number | null {
  if (!fecha) return null;

  const m = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;

  /* En UTC los dos lados, y a mediodía: así ni el horario de verano ni
     la zona horaria del navegador mueven un día arriba o abajo. */
  const limite = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12);
  if (Number.isNaN(limite)) return null;

  return Math.round((limite - hoyUtc) / 86_400_000);
}

/* LA FICHA EN TEXTO PLANO, PARA LLEVÁRSELA.
 *
 * Un resumen que solo se puede leer dentro de Kairo sirve la mitad: lo
 * normal es quererlo en los apuntes, en un documento o pegado en un
 * mensaje. Y ahí el markdown estorba más que ayuda, así que esto sale
 * en texto corriente, con los minutos delante de cada parte.
 */
export function textoDeFicha(f: {
  titulo: string;
  autor: string;
  url: string;
  resumen: string;
  puntos?: { marca: string; texto: string; titulo?: string }[] | null;
}): string {
  const partes = (f.puntos ?? []).filter((p) => p.titulo);

  const cuerpo = partes.length
    ? partes.map((p) => `${p.marca} — ${p.titulo}\n${p.texto}`).join("\n\n")
    : [
        /* Una ficha de las de antes: el resumen seguido, y las ideas
           sueltas detrás. Se le quita el markdown, que pegado en un
           documento se lee como ruido. */
        f.resumen.replace(/^#{1,6}\s+/gm, "").replace(/\*\*/g, "").trim(),
        ...(f.puntos ?? []).map((p) => (p.marca ? `${p.marca} — ${p.texto}` : `· ${p.texto}`)),
      ]
        .filter(Boolean)
        .join("\n\n");

  return [f.titulo, [f.autor, f.url].filter(Boolean).join(" · "), "", cuerpo].join("\n").trim();
}

/** El papel en texto, para preguntarle sobre él o llevárselo.
 *
 *  Lo mismo que `textoDeFicha` pero para Paperwork: lo que importa de
 *  un papel oficial no es el texto escaneado, es qué quieren, cuánto y
 *  para cuándo. Eso es lo que va aquí, y en ese orden. */
export function textoDePapel(p: {
  titulo: string;
  remitente: string;
  de_que_va: string;
  que_quieren: string;
  importe: string;
  fecha_limite: string | null;
  consecuencias: string;
  pasos?: string[] | null;
}): string {
  const linea = (nombre: string, valor: string) => (valor.trim() ? `${nombre}: ${valor}` : "");

  return [
    p.titulo,
    linea("De", p.remitente),
    "",
    p.de_que_va,
    "",
    linea("Qué quieren", p.que_quieren),
    linea("Importe", p.importe),
    linea("Fecha límite", p.fecha_limite ?? ""),
    linea("Si no haces nada", p.consecuencias),
    ...(p.pasos?.length ? ["", "Pasos:", ...p.pasos.map((x, i) => `${i + 1}. ${x}`)] : []),
  ]
    .filter((l, i, todas) => l !== "" || (todas[i + 1] ?? "") !== "")
    .join("\n")
    .trim();
}
