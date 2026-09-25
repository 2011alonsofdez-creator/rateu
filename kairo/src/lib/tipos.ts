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

/* Una conversación guardada, tal y como la enseña la barra lateral. */
export type Conversacion = {
  id: string;
  titulo: string;
  menteId: string | null;
  /** Cuándo se escribió el último mensaje. Es por lo que se ordena. */
  actualizadaEl: string;
};

/* Una fuente: de dónde salió lo que Kairo acaba de decir.
   Va aquí, y no en la carpeta de la IA, porque la pinta el navegador. */
export type Fuente = {
  titulo: string;
  /** El enlace tal y como lo da Google. No se toca: acorta a su
   *  redirección y así el que lo publica sabe que el clic vino de aquí. */
  url: string;
  /** El sitio, limpio: "renfe.com". Es lo que se lee de un vistazo. */
  dominio: string;
  tipo: "web" | "mapa";
};

/** Cuántas fuentes se enseñan. Más de esto es una pared de enlaces que
 *  nadie mira, y ocupa sitio en la base de datos por nada. */
export const FUENTES_MAX = 12;

/** Cuántas búsquedas sugeridas se enseñan debajo de las fuentes. */
export const BUSQUEDAS_MAX = 6;

/** Un mensaje recuperado de la base de datos. */
export type MensajeGuardado = {
  id: string;
  rol: "user" | "kairo";
  contenido: string;
  modelo: string | null;
  nivel: string | null;
  creditos: number;
  /** De dónde sacó los datos, si los buscó. */
  fuentes: Fuente[];
  /** Lo que buscó para responder. */
  busquedas: string[];
};

export const TITULO_MAX = 120;
