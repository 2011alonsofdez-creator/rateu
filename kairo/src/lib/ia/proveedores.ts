import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ajustesSeguridad } from "./seguridad";
import type { ModoEdad } from "@/lib/planes";

/* Los tres cerebros, detrás de una sola puerta.
 *
 * Cada proveedor tiene su SDK, su forma de pedir las cosas y su forma de
 * devolver el texto trozo a trozo. Aquí se les pone el mismo enchufe:
 * todos reciben una `Peticion` y todos devuelven trozos de texto. El
 * resto de Kairo no sabe con quién está hablando, y por eso puede
 * cambiar de uno a otro sin enterarse.
 */

export type Proveedor = "gemini" | "claude" | "gpt";
export type Esfuerzo = "bajo" | "medio" | "alto" | "maximo";

export type Peticion = {
  /** Identificador completo, con proveedor delante: "claude:claude-opus-5". */
  id: string;
  sistema: string;
  mensajes: { rol: "user" | "kairo"; texto: string }[];
  maxSalida: number;
  esfuerzo: Esfuerzo;
  /** Solo lo usa Gemini, que es el único con filtro de contenido por petición. */
  modoEdad: ModoEdad | null;
  /** Presupuesto de razonamiento de Gemini. -1 = que decida él. */
  pensar: number;
};

/** Separa "claude:claude-opus-5" en sus dos mitades. Sin prefijo, Gemini,
 *  que es de donde venimos y así las variables de entorno viejas siguen
 *  valiendo. */
export function partir(id: string): { proveedor: Proveedor; modelo: string } {
  const corte = id.indexOf(":");
  if (corte === -1) return { proveedor: "gemini", modelo: id };

  const cabeza = id.slice(0, corte);
  const proveedor: Proveedor =
    cabeza === "claude" || cabeza === "gpt" ? cabeza : "gemini";

  return { proveedor, modelo: id.slice(corte + 1) };
}

const CLAVES: Record<Proveedor, () => string | undefined> = {
  gemini: () => process.env.GEMINI_API_KEY,
  claude: () => process.env.ANTHROPIC_API_KEY,
  gpt: () => process.env.OPENAI_API_KEY,
};

/** Un proveedor sin clave puesta no existe: se cae de la cadena y ya está.
 *  Kairo sigue funcionando con los que sí tengas. */
export function proveedorActivo(p: Proveedor): boolean {
  return Boolean(CLAVES[p]()?.trim());
}

export function proveedoresActivos(): Proveedor[] {
  return (["gemini", "claude", "gpt"] as const).filter(proveedorActivo);
}

/* Claude exige que los mensajes se alternen y que el primero sea del
   usuario. Si una respuesta falló, en el historial pueden quedar dos
   mensajes seguidos del usuario, y eso es un error 400 en la cara.
   Se arregla aquí, para todos, y no en el motor de Claude: un historial
   bien formado no le viene mal a ninguno. */
export function normalizar(mensajes: Peticion["mensajes"]) {
  const limpios = mensajes.filter((m) => m.texto.trim());
  const salida: Peticion["mensajes"] = [];

  for (const m of limpios) {
    // Nada de empezar con Kairo hablando solo.
    if (!salida.length && m.rol === "kairo") continue;

    const ultimo = salida[salida.length - 1];
    if (ultimo?.rol === m.rol) ultimo.texto += `\n\n${m.texto}`;
    else salida.push({ ...m });
  }

  return salida;
}

// ---------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------
async function* deGemini(pet: Peticion, modelo: string) {
  const ia = new GoogleGenAI({ apiKey: CLAVES.gemini()! });

  const respuesta = await ia.models.generateContentStream({
    model: modelo,
    contents: normalizar(pet.mensajes).map((m) => ({
      role: m.rol === "kairo" ? "model" : "user",
      parts: [{ text: m.texto }],
    })),
    config: {
      systemInstruction: pet.sistema,
      safetySettings: ajustesSeguridad(pet.modoEdad),
      thinkingConfig: { thinkingBudget: pet.pensar },
      // Los Flash no aceptan techos enormes; los de Forja y MEGA se quedan aquí.
      maxOutputTokens: Math.min(pet.maxSalida, 8192),
    },
  });

  for await (const trozo of respuesta) {
    if (trozo.text) yield trozo.text;
  }
}

// ---------------------------------------------------------------
// Claude
// ---------------------------------------------------------------
const ESFUERZO_CLAUDE = {
  bajo: "low",
  medio: "medium",
  alto: "high",
  maximo: "max",
} as const;

/* Haiku 4.5 es de la generación anterior: ni acepta `effort` ni entiende
   el pensamiento adaptativo, y mandárselos es un 400. Solo está en la
   cadena como último recurso, así que va sin adornos. */
const ES_HAIKU = /^claude-haiku/;

async function* deClaude(pet: Peticion, modelo: string) {
  const cliente = new Anthropic({ apiKey: CLAVES.claude()! });

  const extras = ES_HAIKU.test(modelo)
    ? {}
    : {
        thinking: { type: "adaptive" as const },
        output_config: { effort: ESFUERZO_CLAUDE[pet.esfuerzo] },
      };

  const flujo = cliente.messages.stream({
    model: modelo,
    max_tokens: pet.maxSalida,
    system: pet.sistema,
    messages: normalizar(pet.mensajes).map((m) => ({
      role: m.rol === "kairo" ? ("assistant" as const) : ("user" as const),
      content: m.texto,
    })),
    ...extras,
  });

  for await (const evento of flujo) {
    if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
      yield evento.delta.text;
    }
  }
}

// ---------------------------------------------------------------
// GPT
// ---------------------------------------------------------------
const ESFUERZO_GPT = { bajo: "low", medio: "low", alto: "high", maximo: "high" } as const;

async function* deGpt(pet: Peticion, modelo: string) {
  const cliente = new OpenAI({ apiKey: CLAVES.gpt()! });

  /* El parámetro de razonamiento solo lo entienden los modelos que razonan,
     y a los demás les sienta mal. Se manda únicamente en Forja y MEGA, que
     es justo donde GPT está por lo que sabe razonar. */
  const razona = pet.esfuerzo === "alto" || pet.esfuerzo === "maximo";

  const flujo = await cliente.responses.create({
    model: modelo,
    instructions: pet.sistema,
    input: normalizar(pet.mensajes).map((m) => ({
      role: m.rol === "kairo" ? ("assistant" as const) : ("user" as const),
      content: m.texto,
    })),
    max_output_tokens: pet.maxSalida,
    ...(razona ? { reasoning: { effort: ESFUERZO_GPT[pet.esfuerzo] } } : {}),
    // Que OpenAI no se quede una copia de las conversaciones de tus usuarios.
    store: false,
    stream: true,
  });

  for await (const evento of flujo) {
    if (evento.type === "response.output_text.delta") yield evento.delta;
  }
}

// ---------------------------------------------------------------
// La puerta
// ---------------------------------------------------------------
export type Arranque = {
  /** El primer trozo, si lo hubo. Vacío = el modelo no dijo nada. */
  primero?: string;
  resto: AsyncIterator<string, unknown>;
};

/* Arranca la respuesta y espera al primer trozo.
 *
 * Esperar al primero es lo que hace posible cambiar de modelo: si algo va
 * a fallar —clave mala, modelo retirado, proveedor saturado— falla aquí,
 * antes de que el usuario haya visto una sola letra, y se puede probar
 * con el siguiente. Una vez empieza a salir texto ya no hay vuelta atrás:
 * reintentar duplicaría la respuesta. */
export async function arrancar(pet: Peticion): Promise<Arranque> {
  const { proveedor, modelo } = partir(pet.id);

  const generador =
    proveedor === "claude"
      ? deClaude(pet, modelo)
      : proveedor === "gpt"
        ? deGpt(pet, modelo)
        : deGemini(pet, modelo);

  const resto = generador[Symbol.asyncIterator]();
  const primero = await resto.next();

  return { primero: primero.done ? undefined : primero.value, resto };
}
