/* Constantes y tipos de los planes. Sin dependencias de servidor, para
   que pueda importarlo tanto el navegador como el servidor. Todo lo que
   toca cookies o base de datos vive en perfil.ts, que es solo servidor. */

export type ModoEdad = "nino" | "adolescente" | "adulto";
export type PlanId = "free" | "plus" | "supreme";

/** Créditos que incluye cada plan. Sirve para la barra de progreso. */
export const CREDITOS_PLAN: Record<PlanId, number> = {
  free: 20,
  plus: 1000,
  supreme: 3000,
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
 * Quien se registra entra con 150 créditos de regalo que no caducan
 * (van a `creditos_extra`, la hucha que la recarga diaria no toca). Y
 * mientras le queden, puede usarlo TODO: Forja y MEGA incluidos.
 *
 * El 150 no es una cifra redonda por casualidad: un MEGA cuesta 120.
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
