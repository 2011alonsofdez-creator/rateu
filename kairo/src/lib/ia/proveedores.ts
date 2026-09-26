import { GoogleGenAI, type ToolListUnion } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ajustesSeguridad } from "./seguridad";
import { recolectorDeFuentes } from "./grounding";
import type { ModoEdad } from "@/lib/planes";
import { esImagen, type Adjunto, type Fuente } from "@/lib/tipos";

/* Los tres cerebros, detrás de una sola puerta.
 *
 * Cada proveedor tiene su SDK, su forma de pedir las cosas y su forma de
 * devolver el texto trozo a trozo. Aquí se les pone el mismo enchufe:
 * todos reciben una `Peticion` y todos devuelven trozos de texto. El
 * resto de Kairo no sabe con quién está hablando, y por eso puede
 * cambiar de uno a otro sin enterarse.
 */

export type Proveedor = "gemini" | "claude" | "gpt" | "extra";
export type Esfuerzo = "bajo" | "medio" | "alto" | "maximo";

/* Lo que sale de un motor. Casi siempre es texto, pero cuando el modelo
   ha buscado en internet sale además de dónde lo ha sacado. Van por el
   mismo tubo, y con dos formas distintas para que sea imposible
   confundir una fuente con un trozo de respuesta. */
export type Trozo = { texto: string } | { fuentes: Fuente[]; busquedas: string[] };

export type Peticion = {
  /** Identificador completo, con proveedor delante: "claude:claude-opus-5". */
  id: string;
  sistema: string;
  mensajes: { rol: "user" | "kairo"; texto: string; adjuntos?: Adjunto[] }[];
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
    cabeza === "claude" || cabeza === "gpt" || cabeza === "extra" ? cabeza : "gemini";

  return { proveedor, modelo: id.slice(corte + 1) };
}

const CLAVES: Record<Proveedor, () => string | undefined> = {
  gemini: () => process.env.GEMINI_API_KEY,
  claude: () => process.env.ANTHROPIC_API_KEY,
  gpt: () => process.env.OPENAI_API_KEY,
  extra: () => process.env.KAIRO_EXTRA_KEY,
};

export const EXTRA_URL = () => process.env.KAIRO_EXTRA_URL?.trim() ?? "";

/** Los modelos del proveedor de repuesto, tal y como los hayas escrito. */
export function modelosExtra(): string[] {
  return (process.env.KAIRO_EXTRA_MODELOS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => `extra:${m}`);
}

/** Un proveedor sin clave puesta no existe: se cae de la cadena y ya está.
 *  Kairo sigue funcionando con los que sí tengas. */
export function proveedorActivo(p: Proveedor): boolean {
  if (p === "extra") {
    return Boolean(CLAVES.extra()?.trim()) && Boolean(EXTRA_URL()) && modelosExtra().length > 0;
  }
  return Boolean(CLAVES[p]()?.trim());
}

/* ¿Este modelo sabe mirar una imagen o un PDF?
 *
 * Los tres grandes, sí. El de repuesto es cualquier cosa que hable como
 * OpenAI —puede ser un modelo de texto y nada más—, y mandarle una foto
 * es un error raro en vez de una respuesta. Cuando hay archivos, se cae
 * de la cadena: mejor menos suplentes que un fallo incomprensible. */
export function aceptaArchivos(id: string): boolean {
  return partir(id).proveedor !== "extra";
}

export function proveedoresActivos(): Proveedor[] {
  return (["gemini", "claude", "gpt", "extra"] as const).filter(proveedorActivo);
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
    if (ultimo?.rol === m.rol) {
      ultimo.texto += `\n\n${m.texto}`;
      // Y los archivos de los dos, o el segundo perdería el suyo.
      if (m.adjuntos?.length) ultimo.adjuntos = [...(ultimo.adjuntos ?? []), ...m.adjuntos];
    } else {
      salida.push({ ...m });
    }
  }

  return salida;
}

// ---------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------
/* Las herramientas, de más a menos.
 *
 * Esto es lo que hace que Kairo pueda contestar a "¿dónde está la
 * biblioteca?" o "¿cuánto cuesta el abono?" con un dato de verdad en vez
 * de con lo que recuerde de su entrenamiento:
 *
 *   googleSearch → busca en Google y trae las páginas que leyó
 *   urlContext   → si le pegas un enlace, lo abre y lo lee
 *   googleMaps   → sitios reales: dirección, horario, teléfono
 *
 * El modelo decide cuándo usarlas; no se le fuerza. Y van en escalera
 * porque no todos los modelos ni todas las cuentas aceptan las tres: si
 * una sobra, la petición rebota con un 400 y lo único razonable es
 * volver a intentarlo con menos en vez de dar la respuesta por perdida.
 * El peldaño que funcionó se recuerda, así que ese rebote pasa una vez
 * por modelo y no en cada mensaje. */
const ESCALERA: ToolListUnion[] = [
  [{ googleSearch: {} }, { urlContext: {} }, { googleMaps: {} }],
  [{ googleSearch: {} }, { urlContext: {} }],
  [{ googleSearch: {} }],
  [],
];

/** El último peldaño: sin herramientas. Es el que siempre funciona. */
const SIN_HERRAMIENTAS = ESCALERA.length - 1;

/* Modelo → primer peldaño que se sabe que traga, y hasta cuándo nos lo
   creemos.
 *
 * Lo de la caducidad no es un adorno: un 400 de un mal día dejaba a ese
 * modelo SIN BUSCADOR para siempre (hasta reiniciar el servidor), y
 * como el prompt le dice entonces que no tiene internet, el resultado
 * era Kairo contestando de memoria durante horas sin que nadie supiera
 * por qué. Ahora se vuelve a probar cada cuarto de hora: si la
 * herramienta no estaba de verdad, cuesta una llamada fallida cada
 * quince minutos; si fue cosa de un momento, se arregla solo. */
const CADUCA_MS = 15 * 60_000;

const peldano = new Map<string, { desde: number; hasta: number }>();

function peldanoDe(modelo: string): number {
  const apunte = peldano.get(modelo);
  if (!apunte) return 0;
  if (apunte.hasta < Date.now()) {
    peldano.delete(modelo);
    return 0;
  }
  return apunte.desde;
}

function apuntarPeldano(modelo: string, desde: number) {
  /* Que funcione se recuerda mucho más tiempo que que falle: si este
     modelo acepta las tres herramientas, no hay por qué volver a
     dudarlo cada cuarto de hora. */
  const rato = desde === 0 ? 12 * 60 * 60_000 : CADUCA_MS;
  peldano.set(modelo, { desde, hasta: Date.now() + rato });
}

/** Apagar la búsqueda entera sin tocar código, por si algún día hace falta. */
const busquedaApagada = () => /^(1|true|si|sí)$/i.test(process.env.KAIRO_SIN_BUSQUEDA?.trim() ?? "");

/** ¿Este modelo va a poder buscar? Lo pregunta el prompt: prometerle al
 *  modelo un buscador que no tiene es peor que no prometerle nada. */
export function puedeBuscar(id: string): boolean {
  const { proveedor, modelo } = partir(id);
  if (proveedor !== "gemini" || busquedaApagada()) return false;
  return peldanoDe(modelo) < SIN_HERRAMIENTAS;
}

/* Un 400 o un 403 con herramientas puestas casi siempre significa "esta
   no la tengo": modelo antiguo, cuenta sin Maps, combinación no
   permitida. Un 429 o un 503 no tienen nada que ver con las
   herramientas, y ahí no se baja ningún peldaño: se deja subir el error
   para que la cadena pruebe con otro modelo. */
function puedeSerLaHerramienta(fallo: unknown): boolean {
  const estado = (fallo as { status?: number } | null)?.status;
  if (typeof estado === "number") return estado === 400 || estado === 403 || estado === 404;

  const mensaje = fallo instanceof Error ? fallo.message : String(fallo);
  return /\b(400|403|404)\b|not supported|unsupported|invalid argument|permission denied/i.test(
    mensaje,
  );
}

async function* deGemini(pet: Peticion, modelo: string): AsyncGenerator<Trozo> {
  const ia = new GoogleGenAI({ apiKey: CLAVES.gemini()! });

  const contents = normalizar(pet.mensajes).map((m) => ({
    role: m.rol === "kairo" ? "model" : "user",
    /* El archivo va DELANTE de la pregunta a propósito: el modelo lee
       en orden, y "mira esto y dime qué es" se entiende mejor después
       de haber visto el esto. */
    parts: [
      ...(m.adjuntos ?? []).map((a) => ({
        inlineData: { mimeType: a.tipo, data: a.datos },
      })),
      { text: m.texto },
    ],
  }));

  const desde = busquedaApagada() ? SIN_HERRAMIENTAS : peldanoDe(modelo);

  for (let i = desde; i <= SIN_HERRAMIENTAS; i++) {
    const herramientas = ESCALERA[i];
    const fuentes = recolectorDeFuentes();
    let empezado = false;

    try {
      const respuesta = await ia.models.generateContentStream({
        model: modelo,
        contents,
        config: {
          systemInstruction: pet.sistema,
          safetySettings: ajustesSeguridad(pet.modoEdad),
          thinkingConfig: { thinkingBudget: pet.pensar },
          // Los Flash no aceptan techos enormes; los de Forja y MEGA se quedan aquí.
          maxOutputTokens: Math.min(pet.maxSalida, 8192),
          ...(herramientas.length ? { tools: herramientas } : {}),
        },
      });

      /* El primer trozo se pide dentro del `try` a propósito: según el
         fallo, el error salta al hacer la petición o al leer la primera
         respuesta, y bajar un peldaño solo vale si todavía no ha salido
         ni una letra. */
      const lector = respuesta[Symbol.asyncIterator]();
      const primero = await lector.next();
      empezado = true;
      apuntarPeldano(modelo, i);

      let actual = primero;
      while (!actual.done) {
        const trozo = actual.value;
        fuentes.anadir(trozo.candidates?.[0]?.groundingMetadata);
        if (trozo.text) yield { texto: trozo.text };
        actual = await lector.next();
      }

      /* Las fuentes, al final y de una vez. Llegan repartidas y
         repetidas entre los trozos, así que soltarlas a mitad sería
         enseñar media lista y luego cambiarla. */
      if (fuentes.hayAlgo) {
        yield { fuentes: fuentes.fuentes, busquedas: fuentes.busquedas };
      }
      return;
    } catch (fallo) {
      // Ya había salido texto: reintentar duplicaría la respuesta.
      if (empezado || i === SIN_HERRAMIENTAS || !puedeSerLaHerramienta(fallo)) throw fallo;
      // Este modelo no quiere estas herramientas. Se apunta y se baja.
      console.warn(`[kairo] ${modelo} rechaza el peldaño ${i} de herramientas; se prueba con menos`);
      apuntarPeldano(modelo, i + 1);
    }
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

async function* deClaude(pet: Peticion, modelo: string): AsyncGenerator<Trozo> {
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
      content: m.adjuntos?.length
        ? [
            ...m.adjuntos.map((a) =>
              esImagen(a.tipo)
                ? ({
                    type: "image" as const,
                    source: {
                      type: "base64" as const,
                      media_type: a.tipo as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
                      data: a.datos,
                    },
                  })
                : ({
                    type: "document" as const,
                    source: {
                      type: "base64" as const,
                      media_type: "application/pdf" as const,
                      data: a.datos,
                    },
                  }),
            ),
            { type: "text" as const, text: m.texto },
          ]
        : m.texto,
    })),
    ...extras,
  });

  for await (const evento of flujo) {
    if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
      yield { texto: evento.delta.text };
    }
  }
}

// ---------------------------------------------------------------
// GPT
// ---------------------------------------------------------------
const ESFUERZO_GPT = { bajo: "low", medio: "low", alto: "high", maximo: "high" } as const;

async function* deGpt(pet: Peticion, modelo: string): AsyncGenerator<Trozo> {
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
      content: m.adjuntos?.length
        ? [
            ...m.adjuntos.map((a) =>
              esImagen(a.tipo)
                ? ({
                    type: "input_image" as const,
                    image_url: `data:${a.tipo};base64,${a.datos}`,
                    detail: "auto" as const,
                  })
                : ({
                    type: "input_file" as const,
                    filename: a.nombre,
                    file_data: `data:${a.tipo};base64,${a.datos}`,
                  }),
            ),
            { type: "input_text" as const, text: m.texto },
          ]
        : m.texto,
    })),
    max_output_tokens: pet.maxSalida,
    ...(razona ? { reasoning: { effort: ESFUERZO_GPT[pet.esfuerzo] } } : {}),
    // Que OpenAI no se quede una copia de las conversaciones de tus usuarios.
    store: false,
    stream: true,
  });

  for await (const evento of flujo) {
    if (evento.type === "response.output_text.delta") yield { texto: evento.delta };
  }
}

// ---------------------------------------------------------------
// El de repuesto: cualquiera que hable como OpenAI
// ---------------------------------------------------------------
/* Casi todos los proveedores de IA —incluidos los que tienen capa
   gratuita— copian la interfaz de OpenAI en /chat/completions. Con eso,
   una puerta más y tres variables de entorno bastan para enchufar el que
   sea sin tocar código.
   Aquí se usa /chat/completions y no la API de respuestas de OpenAI a
   propósito: es la que entienden todos, y la otra es solo de OpenAI. */
async function* deExtra(pet: Peticion, modelo: string): AsyncGenerator<Trozo> {
  const cliente = new OpenAI({ apiKey: CLAVES.extra()!, baseURL: EXTRA_URL() });

  const flujo = await cliente.chat.completions.create({
    model: modelo,
    messages: [
      { role: "system" as const, content: pet.sistema },
      ...normalizar(pet.mensajes).map((m) => ({
        role: m.rol === "kairo" ? ("assistant" as const) : ("user" as const),
        content: m.texto,
      })),
    ],
    // Techo prudente: de un proveedor desconocido no sabemos cuánto aguanta.
    max_tokens: Math.min(pet.maxSalida, 8192),
    stream: true,
  });

  for await (const parte of flujo) {
    const texto = parte.choices?.[0]?.delta?.content;
    if (texto) yield { texto };
  }
}

// ---------------------------------------------------------------
// La puerta
// ---------------------------------------------------------------
export type Arranque = {
  /** El primer trozo, si lo hubo. Vacío = el modelo no dijo nada. */
  primero?: Trozo;
  resto: AsyncIterator<Trozo, unknown>;
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
        : proveedor === "extra"
          ? deExtra(pet, modelo)
          : deGemini(pet, modelo);

  const resto = generador[Symbol.asyncIterator]();
  const primero = await resto.next();

  return { primero: primero.done ? undefined : primero.value, resto };
}
