/* Constantes y tipos de los planes. Sin dependencias de servidor, para
   que pueda importarlo tanto el navegador como el servidor. Todo lo que
   toca cookies o base de datos vive en perfil.ts, que es solo servidor. */

export type ModoEdad = "nino" | "adolescente" | "adulto";
export type PlanId = "free" | "plus" | "supreme";

/** Créditos que incluye cada plan. Sirve para la barra de progreso. */
export const CREDITOS_PLAN: Record<PlanId, number> = {
  free: 15,
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
