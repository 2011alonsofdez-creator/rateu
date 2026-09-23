/* Tipos compartidos entre servidor y navegador. Viven aparte para que
   un archivo de servidor no tenga que importar de uno marcado con
   "use client" solo para coger un tipo. */

export type ResultadoGasto =
  | { ok: true; creditos: number; creditosExtra: number }
  | { ok: false; motivo: "sin_creditos" | "error" | "demo"; mensaje?: string };

export type ResultadoSimple =
  | { ok: true }
  | { ok: false; mensaje: string };

/* Una Mente: las instrucciones con nombre que una persona guarda para
   que Kairo responda siempre igual en un tema. Vive aquí, y no en
   mentes.ts, porque ese archivo toca cookies y base de datos y el
   navegador no puede importarlo solo para coger un tipo. */
export type Mente = {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  instrucciones: string;
  /** null = hereda el tono de los ajustes del perfil. */
  tono: string | null;
};

/** Los mismos topes que impone la base de datos. Aquí solo sirven para
 *  avisar antes de enviar; quien decide de verdad es la tabla. */
export const MENTE = {
  nombre: 60,
  descripcion: 300,
  instrucciones: 12000,
  porPersona: 30,
} as const;

export type ResultadoMente =
  | { ok: true; mente: Mente }
  | {
      ok: false;
      motivo: "demo" | "limite" | "nombre" | "instrucciones" | "sesion" | "error";
      detalle?: string;
    };
