/* Constantes y tipos de los planes. Sin dependencias de servidor, para
   que pueda importarlo tanto el navegador como el servidor. Todo lo que
   toca cookies o base de datos vive en perfil.ts, que es solo servidor. */

export type ModoEdad = "nino" | "adolescente" | "adulto";
export type PlanId = "free" | "plus" | "supreme";

/** Los cuatro niveles de esfuerzo. Sin "auto": eso no es un nivel, es
 *  dejar que elija Kairo. */
export type NivelEsfuerzo = "fast" | "normal" | "forja" | "mega";

/* LO QUE CUESTA CADA NIVEL, Y POR QUÉ ESTOS NÚMEROS.
 *
 * La escala estaba en 1 / 4 / 20 / 120 y se ha multiplicado por dos.
 * No es un recorte ni un regalo: los planes se multiplican por dos a la
 * vez, así que con la misma suscripción salen exactamente las mismas
 * preguntas que antes. Lo único que cambia es que los números de la
 * página de precios suenan a más, que es lo que vende.
 *
 * La proporción entre niveles sí dice algo real: un Forja cuesta veinte
 * veces un Rápido porque detrás hay Claude Opus pensando, y un MEGA
 * cuesta seis Forjas porque son tres modelos y una fusión. De los
 * cuatro, el que de verdad gasta dinero es Forja; MEGA parece el caro y
 * sale más barato por crédito.
 *
 * Y vive aquí, en un archivo sin dependencias, porque lo usan los dos
 * lados: el servidor para cobrar y la pantalla para avisar de lo que va
 * a costar. Estuvo escrito dos veces —una en cada lado— y eso es una
 * bomba de relojería: el día que se cambie una y no la otra, la app
 * promete un precio y cobra otro. */
export const CREDITOS_NIVEL: Record<NivelEsfuerzo, number> = {
  fast: 2,
  normal: 8,
  forja: 40,
  mega: 240,
};

/** Créditos que incluye cada plan. Sirve para la barra de progreso.
 *  El de `free` es el tope DIARIO; los otros dos son al mes. */
export const CREDITOS_PLAN: Record<PlanId, number> = {
  free: 40,
  plus: 2000,
  supreme: 6000,
};

export const NOMBRE_PLAN: Record<PlanId, string> = {
  free: "Free",
  plus: "Kairo+",
  supreme: "Supreme",
};

export type Perfil = {
  id: string;
  nombre: string;
  email: string;
  plan: PlanId;
  creditos: number;
  creditosExtra: number;
  modoEdad: ModoEdad | null;
  tono: string;
  idioma: string;
  renuevaEl: string | null;
  /** true cuando no hay Supabase configurado y son datos de ejemplo. */
  demo: boolean;
};

/** Qué niveles del selector ⚡ puede usar cada plan. */
export const NIVELES_POR_PLAN: Record<
  PlanId,
  ("fast" | "normal" | "forja" | "mega")[]
> = {
  /* Rápido Y Normal, no solo Rápido. Con solo Rápido, Kairo Code, Gist
     y Paperwork —que van en Normal— estaban cerrados para quien se
     acababa de registrar: enseñas Code por ahí, alguien entra a
     probarlo y no puede. Es la peor forma de gastar una visita. */
  free: ["fast", "normal"],
  plus: ["fast", "normal", "forja", "mega"],
  supreme: ["fast", "normal", "forja", "mega"],
};

/* EL REGALO ABRE LAS PUERTAS MIENTRAS DURA.
 *
 * Quien se registra entra con 300 créditos de regalo que no caducan
 * (van a `creditos_extra`, la hucha que la recarga diaria no toca). Y
 * mientras le queden, puede usarlo TODO: Forja y MEGA incluidos.
 *
 * El 300 no es una cifra redonda por casualidad: un MEGA cuesta 240.
 * Da para probar exactamente un MEGA —varios cerebros a la vez, que es
 * lo mejor que hace Kairo— y que sobren treinta. Para el segundo, se
 * paga. Es la diferencia entre leer lo que hace y haberlo visto.
 *
 * Y cuando se acaban no se cierra nada de lo de todos los días: siguen
 * Rápido y Normal, o sea el chat, Code, Gist y Paperwork. Lo que se
 * pierde es lo gordo, que es justo lo que se echa de menos.
 */
export function nivelesDe(
  plan: PlanId,
  creditosExtra: number,
): ("fast" | "normal" | "forja" | "mega")[] {
  if (plan === "free" && creditosExtra > 0) {
    return ["fast", "normal", "forja", "mega"];
  }
  return NIVELES_POR_PLAN[plan];
}
