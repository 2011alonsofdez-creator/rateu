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

/** Un documento ya leído, listo para montar el material. */
export type Pieza = { nombre: string; texto: string };

export type Material = {
  /** Lo que de verdad viaja en cada prompt. */
  texto: string;
  /** Lo que no cupo, documento a documento, para poder decirlo. */
  recortados: { nombre: string; de: number; a: number }[];
  letras: number;
};

/* Lo que cuesta un documento aparte de su texto: la cabecera con el
   nombre, la línea en blanco que lo separa del siguiente y sitio para
   el aviso de recorte. Se descuenta del presupuesto para que `max` sea
   el tope real de lo que viaja, no una aproximación por abajo. */
const MARCO = 72;

/* Reparto por raciones iguales, cediendo lo que sobra.
 *
 * Quien pide menos que su ración se lleva lo que pide y devuelve el
 * resto al bote, que se vuelve a repartir entre los que siguen pidiendo
 * más. Así una carta de una página entra entera y lo que se recorta es
 * la sentencia de cuarenta, en vez de que la sentencia se lo coma todo
 * por llegar primero.
 */
function repartir(pesos: number[], total: number): number[] {
  const dado = pesos.map(() => 0);
  if (pesos.reduce((a, b) => a + b, 0) <= total) return pesos.slice();

  let queda = total;
  let pendientes = pesos.map((_, i) => i);

  while (pendientes.length) {
    const racion = Math.floor(queda / pendientes.length);
    if (racion <= 0) break;

    const caben = pendientes.filter((i) => pesos[i] <= racion);
    if (!caben.length) {
      // Todos piden más que su ración: a ración igual y se acabó.
      for (const i of pendientes) dado[i] = racion;
      break;
    }
    for (const i of caben) {
      dado[i] = pesos[i];
      queda -= pesos[i];
    }
    pendientes = pendientes.filter((i) => pesos[i] > racion);
  }

  return dado;
}

/* Montar el material que verán los seis, diciendo qué se recortó.
 *
 * Antes esto era un corte único al final del montón: con tres
 * documentos, el tercero desaparecía entero y nadie se enteraba. Un
 * corte silencioso es un error que aparece tres pantallas más abajo,
 * cuando uno discute algo que no estaba, así que cada documento entra
 * con su nombre, cada recorte se anota y lo que sobra se dice.
 */
export function componerMaterial(piezas: Pieza[], max: number): Material {
  const utiles = piezas
    .map((p) => ({ nombre: p.nombre.trim() || "documento", texto: p.texto.trim() }))
    .filter((p) => p.texto);
  if (!utiles.length) return { texto: "", recortados: [], letras: 0 };

  const marco = utiles.reduce((s, p) => s + p.nombre.length + MARCO, 0);
  const presupuesto = Math.max(max - marco, utiles.length * 400);
  const cupos = repartir(
    utiles.map((p) => p.texto.length),
    presupuesto,
  );

  const recortados: Material["recortados"] = [];
  const partes = utiles.map((p, i) => {
    const cupo = cupos[i];
    if (p.texto.length <= cupo) return `--- ${p.nombre} ---\n${p.texto}`;
    recortados.push({ nombre: p.nombre, de: p.texto.length, a: cupo });
    return (
      `--- ${p.nombre} ---\n${p.texto.slice(0, cupo)}\n` +
      `[...recortado: este documento tenía ${p.texto.length} caracteres]`
    );
  });

  const texto = partes.join("\n\n");
  return { texto, recortados, letras: texto.length };
}
