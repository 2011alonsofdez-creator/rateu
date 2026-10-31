import type { Firma, Punto, Resultado, Voto, VotoEmitido } from "./tipos";

/* Lo que se puede romper sin que salte ningún error.
 *
 * Todo lo de este archivo son funciones puras: entra texto, sale un
 * número o un dato. Viven aparte del motor por eso mismo —no tocan
 * claves ni red, así que se pueden probar de verdad— y porque son
 * justamente la parte en la que un fallo no se nota: un voto mal leído
 * no revienta nada, solo cambia el resultado en silencio.
 */

/* Sacar el bloque JSON de una respuesta.
 *
 * Se pide "solo JSON" y aun así llega envuelto en ```json, con una frase
 * de cortesía delante o con dos bloques porque el modelo se corrigió a
 * sí mismo. Se recorren los candidatos del último al primero: cuando hay
 * dos, el bueno es el de después de pensárselo. */
export function sacarJson(texto: string): Record<string, unknown> | null {
  const candidatos: string[] = [];
  for (const m of texto.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)) candidatos.push(m[1].trim());
  const sueltos = texto.match(/\{[\s\S]*\}/);
  if (sueltos) candidatos.push(sueltos[0].trim());

  for (let i = candidatos.length - 1; i >= 0; i--) {
    try {
      const d = JSON.parse(candidatos[i]);
      if (d && typeof d === "object" && !Array.isArray(d)) return d as Record<string, unknown>;
    } catch {
      /* el siguiente */
    }
  }
  return null;
}

const VOTOS: Voto[] = ["de_acuerdo", "en_desacuerdo", "matiz", "abstencion"];

/** Lee un voto, o devuelve null. Nunca adivina: un voto ilegible es un
 *  voto que no se cuenta, no un voto que se supone. */
export function leerVoto(v: unknown): Voto | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return (VOTOS as string[]).includes(s) ? (s as Voto) : null;
}

export function leerFirma(v: unknown): Firma | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (s === "firmo" || s === "firmo_con_reservas" || s === "no_firmo") return s;
  return null;
}

/** Baraja una copia. Los alias se reparten al azar en cada deliberación
 *  para que «el Miembro A» no sea siempre la misma casa. */
export function barajar<T>(xs: T[]): T[] {
  const c = [...xs];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** Lee la votación de un miembro sobre los puntos que había. */
export function leerVotacion(
  texto: string,
  puntos: Punto[],
): Record<string, VotoEmitido> {
  const d = sacarJson(texto);
  const votos = (d?.votos ?? {}) as Record<string, unknown>;
  const salida: Record<string, VotoEmitido> = {};

  for (const p of puntos) {
    const bruto = votos[p.id];
    // Algunos contestan {"P1": "de_acuerdo"} en vez del objeto con motivo.
    const campo =
      typeof bruto === "string" ? { voto: bruto } : (bruto as Record<string, unknown> | undefined);
    const voto = leerVoto(campo?.voto);
    if (!voto) continue;
    salida[p.id] = { voto, motivo: String(campo?.motivo ?? "").trim() };
  }
  return salida;
}

/* Contar los votos de un punto sin adornar el resultado.
 *
 * El único matiz que importa aquí: «unánime» exige que hayan votado
 * TODOS. Con tres votos de cinco, decir «3 de 3» se lee como unanimidad
 * del consejo, y no lo es: es unanimidad de los que contestaron, que es
 * otra cosa y hay que decirla. Un recuento que exagera el acuerdo es
 * peor que no tener recuento. */
export function contar(
  punto: Punto,
  votos: Record<string, VotoEmitido>,
  total: number,
): Resultado {
  const n = { de_acuerdo: 0, en_desacuerdo: 0, matiz: 0, abstencion: 0 };
  for (const v of Object.values(votos)) n[v.voto]++;
  const emitidos = n.de_acuerdo + n.en_desacuerdo + n.matiz + n.abstencion;
  const favor = n.de_acuerdo + n.matiz;

  let veredicto: Resultado["veredicto"];
  if (emitidos === 0) veredicto = "sin_votos";
  else if (n.de_acuerdo === emitidos && emitidos === total) veredicto = "unanime";
  else if (favor === emitidos) veredicto = "acuerdo_con_matices";
  else if (favor > emitidos / 2) veredicto = "mayoria";
  else veredicto = "sin_acuerdo";

  return {
    punto,
    votos,
    deAcuerdo: n.de_acuerdo,
    enDesacuerdo: n.en_desacuerdo,
    matiz: n.matiz,
    abstencion: n.abstencion,
    emitidos,
    veredicto,
  };
}

/** Recorta diciéndolo. Un corte silencioso es un error que aparece tres
 *  pantallas más abajo, cuando alguien discute algo que no estaba. */
export function recortarMaterial(t: string, max: number): string {
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n\n[...recortado: el material ocupaba ${t.length} caracteres y el consejo trabaja con los primeros ${max}]`;
}
