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
/* Qué modelos atiende cada nivel, en orden de preferencia.
 *
 * Son cadenas, no un solo nombre, y el motivo es práctico: la capa gratuita
 * de Google devuelve 503 "high demand" a menudo. Con un solo modelo, eso es
 * un error en la cara del usuario; con una cadena, se prueba el siguiente y
 * casi nunca se nota.
 *
 * La lista salió de preguntarle a la propia cuenta qué modelos acepta
 * (/api/estado), no de adivinar nombres.
 *
 * Los alias "-latest" van primero porque Google los actualiza solo. Detrás
 * van versiones concretas, que son las que siguen en pie si un alias se
 * queda sin capacidad.
 */
export const CADENAS: Record<Level, string[]> = {
  fast: [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
  ],
  normal: [
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ],
  // Forja intenta primero un modelo Pro: si algún día activas facturación,
  // sube de categoría sola, sin tocar nada. Mientras no tengas acceso, el
  // primer intento falla una vez, se marca en cuarentena y se salta.
  forja: [
    "gemini-pro-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ],
  mega: [
    "gemini-pro-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ],
};

/** Una variable de entorno, si existe, manda por delante de todo. */
const FORZADO: Partial<Record<Level, string | undefined>> = {
  fast: process.env.KAIRO_MODELO_RAPIDO,
  normal: process.env.KAIRO_MODELO_ESTANDAR,
  forja: process.env.KAIRO_MODELO_FORJA,
  mega: process.env.KAIRO_MODELO_MAXIMO,
};

export function cadenaDe(nivel: Level): string[] {
  const forzado = FORZADO[nivel]?.trim();
  const cadena = CADENAS[nivel];
  return forzado ? [forzado, ...cadena.filter((m) => m !== forzado)] : cadena;
}

export const RAZONAMIENTO: Record<Level, number> = {
  fast: 0,
  normal: -1,
  forja: 16384,
  mega: 24576,
};

export const CREDITOS: Record<Level, number> = {
  fast: 1,
  normal: 4,
  forja: 20,
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
