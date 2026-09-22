/* Tipos compartidos entre servidor y navegador. Viven aparte para que
   un archivo de servidor no tenga que importar de uno marcado con
   "use client" solo para coger un tipo. */

export type ResultadoGasto =
  | { ok: true; creditos: number; creditosExtra: number }
  | { ok: false; motivo: "sin_creditos" | "error" | "demo"; mensaje?: string };

export type ResultadoSimple =
  | { ok: true }
  | { ok: false; mensaje: string };
