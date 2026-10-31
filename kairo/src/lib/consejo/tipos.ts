/* Tipos del Consejo, compartidos entre servidor y navegador.
 *
 * Viven aparte, como los de `lib/tipos.ts`, para que la página no tenga
 * que importar nada del motor —que toca claves y proveedores— solo para
 * saber pintar una tabla de votos.
 */

/** Cómo de a fondo delibera el consejo. */
export type Modo = "rapido" | "completo";

/** El sentido de un voto sobre un punto concreto.
 *
 *  `matiz` no es un adorno: con solo sí y no, quien está de acuerdo bajo
 *  una condición tiene que votar en contra, y entonces el recuento
 *  enseña una pelea donde había un acuerdo con letra pequeña. Esa letra
 *  pequeña suele ser lo más útil de toda la deliberación. */
export type Voto = "de_acuerdo" | "en_desacuerdo" | "matiz" | "abstencion";

/** Qué hace un miembro con la propuesta final. */
export type Firma = "firmo" | "firmo_con_reservas" | "no_firmo";

/** Un miembro del consejo, tal y como lo ve el navegador. */
export type Miembro = {
  /** M1…M6. Estable dentro de una deliberación. */
  id: string;
  /** Quién lo publica: OpenAI, Google, xAI… Es lo que importa que sea distinto. */
  casa: string;
  /** El modelo concreto, para que se pueda comprobar quién contestó. */
  modelo: string;
  /* Los identificadores de Kairo a probar, en orden.
   *
   * Es una lista y no uno solo porque los modelos fallan a diario: se
   * retiran, se les acaba la cuota o el "preview" deja de servirse. El
   * resto de Kairo ya trabaja así (ver CADENAS en ia/config.ts), y un
   * miembro que se cae por no tener suplente deja al consejo cojo por
   * una razón que no tiene nada que ver con deliberar. */
  refs: string[];
  /** El secretario coordina, verifica y redacta, pero NO vota. */
  secretario: boolean;
};

/** Lo que responde un miembro en una ronda. */
export type Intervencion = {
  miembro: string;
  texto: string;
  /** Con cuál de sus suplentes contestó, si no fue con el primero. */
  modelo?: string;
  /** Vacío mientras llega; se rellena al terminar. */
  ok: boolean;
  error?: string;
};

/** Un punto sometido a votación, destilado por el secretario. */
export type Punto = {
  id: string;
  texto: string;
};

/** El voto de un miembro sobre un punto, con su porqué. */
export type VotoEmitido = {
  voto: Voto;
  motivo: string;
};

/** Cómo quedó un punto después de votarlo. */
export type Resultado = {
  punto: Punto;
  /** Por miembro. Si falta, es que no votó: no se rellena con nada. */
  votos: Record<string, VotoEmitido>;
  deAcuerdo: number;
  enDesacuerdo: number;
  matiz: number;
  abstencion: number;
  /** Cuántos votaron de verdad. Sin esto, «3 de 3» parece unanimidad. */
  emitidos: number;
  veredicto: "unanime" | "acuerdo_con_matices" | "mayoria" | "sin_acuerdo" | "sin_votos";
};

/** La postura de un miembro ante la propuesta final. */
export type Veredicto = {
  miembro: string;
  firma: Firma | "sin_respuesta";
  motivo: string;
  reservas: string[];
};

/* Lo que viaja por el flujo, trozo a trozo, igual que en el chat:
   un JSON por línea. Cada tipo es un momento del proceso, para que la
   página pueda ir pintando sin esperar al final. */
export type Evento =
  | { t: "consejo"; miembros: Miembro[]; modo: Modo }
  | { t: "fase"; fase: string; detalle?: string }
  | { t: "transcrito"; letras: number; de: string }
  | { t: "intervencion"; ronda: 1 | 2 | 3; v: Intervencion }
  | { t: "puntos"; puntos: Punto[] }
  | { t: "verificacion"; texto: string }
  | { t: "resultados"; resultados: Resultado[] }
  | { t: "propuesta"; texto: string }
  | { t: "veredictos"; veredictos: Veredicto[] }
  | { t: "sintesis"; texto: string }
  | { t: "fin"; segundos: number }
  | { t: "error"; mensaje: string };

/** Cuántos miembros votantes como mucho. Seis en total con el secretario. */
export const VOTANTES_MAX = 5;

/** Lo que se le deja ocupar al material de partida dentro de cada prompt.
 *
 *  No es un capricho: ese texto viaja en TODAS las llamadas de TODAS las
 *  rondas. Un PDF de veinte páginas sin recortar multiplica la factura
 *  por quince y empuja fuera lo que de verdad se está debatiendo. */
export const MATERIAL_MAX = 24000;

export const ETIQUETA_VOTO: Record<Voto, string> = {
  de_acuerdo: "De acuerdo",
  en_desacuerdo: "En desacuerdo",
  matiz: "Matiz",
  abstencion: "Abstención",
};

export const ETIQUETA_FIRMA: Record<Firma | "sin_respuesta", string> = {
  firmo: "Firma",
  firmo_con_reservas: "Firma con reservas",
  no_firmo: "No firma",
  sin_respuesta: "Sin respuesta",
};
