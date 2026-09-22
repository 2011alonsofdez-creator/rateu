import type { Level } from "@/lib/mock";
export { NIVELES_POR_PLAN } from "@/lib/planes";

/* Qué modelo atiende cada nivel.
 *
 * Se usan los alias "-latest" a propósito: Google saca modelo nuevo cada
 * pocos meses y los identificadores con número dejan de existir. El alias
 * se actualiza solo y el código no se rompe.
 *
 * Desde abril de 2026 los modelos Pro NO están en la capa gratuita: solo
 * Flash y Flash-Lite. Por eso el nivel máximo apunta también a Flash, pero
 * con más presupuesto de razonamiento. Cuando actives facturación, cambia
 * KAIRO_MODELO_MAXIMO a "gemini-pro-latest" y listo: no hay que tocar código.
 */
export const MODELOS: Record<Level, string> = {
  fast: process.env.KAIRO_MODELO_RAPIDO || "gemini-flash-lite-latest",
  normal: process.env.KAIRO_MODELO_ESTANDAR || "gemini-flash-latest",
  mega: process.env.KAIRO_MODELO_MAXIMO || "gemini-flash-latest",
};

/* Presupuesto de razonamiento en tokens. 0 lo desactiva, -1 lo deja
   a criterio del modelo. Es lo que separa de verdad un nivel de otro
   mientras solo haya un proveedor conectado. */
export const RAZONAMIENTO: Record<Level, number> = {
  fast: 0,
  normal: -1,
  mega: 24576,
};

export const CREDITOS: Record<Level, number> = {
  fast: 1,
  normal: 4,
  mega: 120,
};

/** Nombre bonito del modelo, para enseñárselo al usuario. */
export function nombreModelo(id: string): string {
  const m = id.toLowerCase();
  if (m.includes("claude")) return "Claude";
  if (m.includes("gpt")) return "GPT";
  if (m.includes("lite")) return "Gemini Flash-Lite";
  if (m.includes("flash")) return "Gemini Flash";
  if (m.includes("pro")) return "Gemini Pro";
  return id;
}

/** Cuántos mensajes del historial se envían. Más contexto, más coste. */
export const HISTORIAL_MAX = 20;
