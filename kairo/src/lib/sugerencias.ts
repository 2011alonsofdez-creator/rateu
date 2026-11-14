/* QUÉ OTRA PARTE DE KAIRO HARÍA ESTO MEJOR QUE EL CHAT.
 *
 * Lo mismo que `coworks/detectar.ts`, para el resto de secciones. Quien
 * escribe en el chat "hazme una app de gastos" o "me ha llegado una
 * multa" no sabe que hay una pantalla hecha justo para eso. El chat le
 * contesta, y debajo se le ofrece ir a la que toca.
 *
 * Sin modelo: expresiones regulares. Y conservador a propósito: una
 * sugerencia que sale donde no toca se aprende a ignorar, y entonces
 * no sirve ni cuando sí toca.
 */

export type Sugerencia = {
  tipo: "code" | "paperwork" | "abogado" | "contable" | "comercial" | "gist" | "mentes";
  /** Adónde lleva el botón. */
  href: string;
};

const URL_VIDEO = /\bhttps?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\/\S+/i;

const REGLAS: { tipo: Sugerencia["tipo"]; re: RegExp }[] = [
  {
    tipo: "code",
    re: /\b(hazme|haz|cr[eé]ame|crea|programa|progr[aá]mame|quiero|necesito|me haces)\b[^.?!]{0,40}\b(una?\s+)?(app|aplicaci[oó]n|juego|web|p[aá]gina web|calculadora|herramienta|programa)\b/i,
  },
  {
    tipo: "paperwork",
    re: /\b(me (ha|han) (llegado|mandado|enviado|puesto)|he recibido|tengo)\b[^.?!]{0,25}\b(una?\s+)?(multa|carta|notificaci[oó]n|requerimiento|sanci[oó]n|citaci[oó]n|burofax)\b|\bcarta de (hacienda|la seguridad social|tr[aá]fico|la dgt)\b/i,
  },
  {
    tipo: "abogado",
    re: /\b(contrato|cl[aá]usula|cl[aá]usulas)\b[^.?!]{0,60}\b(revisa|rev[ií]same|mira|abusiv|firmar|firmo|legal|puedo|es normal)\b|\b(revisa|rev[ií]same|mira|es normal|es legal|es abusiva|pueden?)\b[^.?!]{0,40}\b(contrato|cl[aá]usula)/i,
  },
  {
    tipo: "contable",
    re: /\b(mis facturas|las facturas|el iva|modelo 303|modelo 130|trimestral|gastos deducibles|declaraci[oó]n trimestral|llevar las cuentas|contabilidad)\b/i,
  },
  {
    tipo: "comercial",
    re: /\b(un cliente|mis clientes|a un cliente|al cliente|presupuesto para|seguimiento a|captar clientes|conseguir clientes)\b/i,
  },
  {
    tipo: "mentes",
    re: /\b(a partir de ahora|de ahora en adelante|siempre)\b[^.?!]{0,30}\b(h[aá]blame|resp[oó]ndeme|contesta|cont[eé]stame|act[uú]a como|s[eé])\b/i,
  },
];

const DESTINO: Record<Sugerencia["tipo"], string> = {
  code: "/code",
  paperwork: "/paperwork",
  abogado: "/team",
  contable: "/team",
  comercial: "/team",
  gist: "/gist",
  mentes: "/mentes",
};

export function detectarSugerencia(texto: string): Sugerencia | null {
  const limpio = texto.trim();
  if (limpio.length < 10 || limpio.length > 800) return null;

  /* Un enlace de YouTube con algo de "resume", o solo el enlace: Gist
     lo hace por partes y lo deja guardado. */
  if (URL_VIDEO.test(limpio)) return { tipo: "gist", href: DESTINO.gist };

  for (const r of REGLAS) {
    if (!r.re.test(limpio)) continue;
    /* A Code se le pasa la petición ya escrita: si tuviera que volver
       a escribirla, no la escribiría nadie. */
    const href = r.tipo === "code" ? `/code?pedir=${encodeURIComponent(limpio.slice(0, 600))}` : DESTINO[r.tipo];
    return { tipo: r.tipo, href };
  }
  return null;
}
