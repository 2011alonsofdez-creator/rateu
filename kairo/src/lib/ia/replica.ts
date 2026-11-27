/* "NO, ESO ESTÁ MAL": CUANDO TE CORRIGEN (27-11).
 *
 * Lo que más se critica hoy de las IAs es que, al decirles "te
 * equivocas", contestan "tienes toda la razón" aunque no la tengas.
 * Para quien paga por respuestas fiables eso es lo peor: un dato bueno
 * cambiado por uno malo solo por insistir.
 *
 * Cuando el mensaje es una réplica a lo que dijo Kairo, el chat hace dos
 * cosas: vuelve a buscar sobre el tema (si era de buscar) y le recuerda
 * al modelo que compruebe antes de ceder. Si la persona tiene razón, se
 * reconoce en una frase; si no, se mantiene con el dato y su fuente. */

const REPLICA = [
  /^(que no|q no|k no|mentira|falso|incorrecto)\s*([,.!¡]|$)/,
  /^(seguro|estas seguro|estás seguro)\s*\?/,
  /^(eso|esto) (no es|esta mal|está mal|es mentira|es falso|no existe)/,
  /\b(te equivocas|te has equivocado|estas equivocad|estás equivocad|te has colado|no tienes razon|no tienes razón|eso es falso|eso es mentira|eso no es (asi|así|verdad|cierto)|no es (asi|así|verdad|cierto)|esta mal|está mal|no existe|te lo has inventado|te lo inventas|que dices|qué dices|seguro\?|estas seguro|estás seguro)\b/,
];

/** ¿Es un mensaje que discute lo que acaba de decir Kairo? */
export function esReplica(texto: string): boolean {
  const t = texto.trim().toLowerCase();
  if (!t || t.length > 400) return false;
  return REPLICA.some((re) => re.test(t));
}
