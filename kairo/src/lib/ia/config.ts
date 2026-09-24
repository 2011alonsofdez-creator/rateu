import type { Level } from "@/lib/mock";
import type { ModoEdad } from "@/lib/planes";
import { modelosExtra, partir, proveedorActivo, type Esfuerzo } from "./proveedores";

export { NIVELES_POR_PLAN } from "@/lib/planes";
export { proveedoresActivos, type Proveedor } from "./proveedores";

/* Qué cerebro atiende cada nivel.
 *
 * Aquí es donde Kairo deja de ser un chat con un modelo detrás. Cada
 * identificador lleva delante su proveedor —"claude:", "gpt:", sin nada
 * para Gemini— y cada nivel empieza por el que mejor hace ese trabajo,
 * que es exactamente lo que promete la portada:
 *
 *   Claude  → código y textos largos      → manda en Forja y en MEGA
 *   Gemini  → velocidad                    → manda en Rápido y en Normal
 *   GPT     → razonamiento                 → segundo en Forja y en MEGA
 *
 * Detrás del primero va una cadena de suplentes. No es adorno: la capa
 * gratuita de Google devuelve 503 a todas horas, y cualquier proveedor
 * puede tener un mal día. Con un solo modelo eso es un error en la cara
 * del usuario; con una cadena, se prueba el siguiente y casi nunca se nota.
 *
 * Un proveedor sin clave puesta desaparece de todas las cadenas, así que
 * esto funciona igual con una clave, con dos o con tres.
 *
 * Los identificadores de Gemini salieron de preguntarle a la propia
 * cuenta qué acepta (/api/estado), y los de Claude de su documentación.
 * Los de GPT son los previsibles: si alguno no existe en tu cuenta, mira
 * /api/estado, que te lista los que sí, y ponlo en KAIRO_MODELO_*.
 */
export const CADENAS: Record<Level, string[]> = {
  /* El orden de los suplentes de Gemini no es el que parece lógico, y hay
     un motivo: en la capa gratuita LA CUOTA ES POR MODELO. Poner cinco
     variantes de Flash-Lite seguidas no sirve de nada, porque en cuanto
     se acaba la del primero suele estar acabada la de sus hermanos —y el
     alias "-latest" apunta a uno de ellos, así que comparte cuota con él.
     Por eso cada suplente cambia de familia o de generación respecto al
     anterior: cada salto es un depósito de cuota distinto. */

  /* Los identificadores de Gemini de abajo están comprobados uno a uno
     contra lo que devuelve /api/estado en una cuenta de verdad, no
     copiados de la documentación. Cada generación es un depósito de
     cuota distinto, así que cuantas más haya, más tarda en acabarse. */

  // Rápido: lo que importa es que conteste ya.
  fast: [
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite", // otra generación → otra cuota
    "gemini-flash-latest", // otra familia → otra cuota
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash-lite", // suele ser al que apunta el alias: el último
    "gpt:gpt-5-mini",
    "claude:claude-haiku-4-5",
  ],

  // Normal: redactar, resumir, explicar.
  normal: [
    "gemini-flash-latest",
    "gemini-2.5-flash", // otra generación
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    // Bajar a Flash-Lite es peor respuesta, sí. Pero peor todavía es no
    // contestar, y en la capa gratuita es el que más cuota suele tener.
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gpt:gpt-5",
    "claude:claude-sonnet-5",
  ],

  // Forja: programar, analizar, crear. Aquí manda Claude.
  forja: [
    "claude:claude-opus-5",
    "claude:claude-sonnet-5",
    "gpt:gpt-5",
    "gemini-pro-latest",
    // Los Pro salieron de la capa gratuita, pero las versiones "preview"
    // a veces siguen entrando. Si no, falla una vez y se salta: barato de
    // intentar y mucho mejor respuesta si cuela.
    "gemini-3.1-pro-preview",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-lite-latest",
  ],

  // MEGA: lo más capaz de cada casa, en ese orden.
  mega: [
    "claude:claude-opus-5",
    "gpt:gpt-5",
    "gemini-pro-latest",
    "gemini-3.1-pro-preview",
    "claude:claude-sonnet-5",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
  ],
};

/** Una variable de entorno, si existe, manda por delante de todo.
 *  Lleva el proveedor delante igual que las cadenas: "claude:claude-opus-5". */
const FORZADO: Partial<Record<Level, string | undefined>> = {
  fast: process.env.KAIRO_MODELO_RAPIDO,
  normal: process.env.KAIRO_MODELO_ESTANDAR,
  forja: process.env.KAIRO_MODELO_FORJA,
  mega: process.env.KAIRO_MODELO_MAXIMO,
};

/* La cadena que se va a usar de verdad, ya filtrada.
 *
 * Dos filtros, y el segundo importa más que el primero:
 *
 *  1. Fuera los proveedores sin clave. Si solo tienes Gemini, Kairo
 *     funciona exactamente igual que antes.
 *
 *  2. Los menores se quedan en Gemini. Es el único de los tres que acepta
 *     un filtro de contenido por petición, y en modo niño va puesto en su
 *     ajuste más estricto. Los otros dos tienen su propio entrenamiento de
 *     seguridad y el añadido de edad del prompt sigue aplicándose, pero
 *     esa capa extra la perderían. Conectar dos modelos más no es motivo
 *     para que un crío quede menos protegido que ayer.
 */
export function cadenaDe(nivel: Level, modoEdad: ModoEdad | null): string[] {
  const forzado = FORZADO[nivel]?.trim();
  /* El proveedor de repuesto va al final de todas las cadenas: es la red
     por si el resto está saturado, no la primera opción. */
  const base = [...CADENAS[nivel], ...modelosExtra()];
  const conForzado = forzado ? [forzado, ...base.filter((m) => m !== forzado)] : base;

  const conClave = conForzado.filter((id) => proveedorActivo(partir(id).proveedor));

  if (modoEdad === "nino" || modoEdad === null) {
    return conClave.filter((id) => partir(id).proveedor === "gemini");
  }

  return conClave;
}

/** Cuánto se le pide que se esfuerce a cada nivel. Cada motor lo traduce
 *  a lo suyo: presupuesto de pensamiento en Gemini, `effort` en los otros. */
export const ESFUERZO: Record<Level, Esfuerzo> = {
  fast: "bajo",
  normal: "medio",
  forja: "alto",
  mega: "maximo",
};

/** Presupuesto de razonamiento de Gemini. -1 = que lo decida él. */
export const RAZONAMIENTO: Record<Level, number> = {
  fast: 0,
  normal: -1,
  forja: 16384,
  mega: 24576,
};

/** Techo de respuesta. Es un tope, no un gasto: solo se paga lo que salga.
 *  Va holgado a propósito, porque en los modelos que piensan el
 *  razonamiento también cuenta y un techo corto trunca a media frase. */
export const MAX_SALIDA: Record<Level, number> = {
  fast: 4096,
  normal: 8192,
  forja: 32000,
  mega: 64000,
};

export const CREDITOS: Record<Level, number> = {
  fast: 1,
  normal: 4,
  forja: 20,
  mega: 120,
};

/** Nombre bonito del modelo, para enseñárselo al usuario. */
export function nombreModelo(id: string): string {
  const { proveedor, modelo } = partir(id);

  if (proveedor === "claude") {
    if (modelo.includes("opus")) return "Claude Opus";
    if (modelo.includes("sonnet")) return "Claude Sonnet";
    if (modelo.includes("haiku")) return "Claude Haiku";
    return "Claude";
  }

  if (proveedor === "gpt") {
    return modelo.toLowerCase().startsWith("gpt") ? modelo.toUpperCase() : `GPT ${modelo}`;
  }

  /* Del de repuesto no sabemos el nombre comercial, así que se enseña su
     identificador. Pero sin la casa que lo publica: muchos van como
     "openai/gpt-oss-20b" o "meta/llama-3.3-70b", y enseñar ese prefijo
     haría creer que detrás está OpenAI o Meta cuando lo que hay es otro
     proveedor sirviendo un modelo abierto. Queda el nombre del modelo,
     que es lo que te dice cuál de los tuyos ha contestado. */
  if (proveedor === "extra") return modelo.split("/").pop() ?? modelo;

  if (modelo.includes("lite")) return "Gemini Flash-Lite";
  if (modelo.includes("flash")) return "Gemini Flash";
  if (modelo.includes("pro")) return "Gemini Pro";
  return modelo;
}

/** Cuántos mensajes del historial se envían. Más contexto, más coste. */
export const HISTORIAL_MAX = 20;
