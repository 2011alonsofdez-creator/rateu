import { EXTRA_URL, claveExtra, modelosExtra, partir, proveedorActivo } from "@/lib/ia/proveedores";
import { VOTANTES_MAX, type Miembro } from "./tipos";

/* Quién se sienta en la mesa.
 *
 * El consejo no vale por tener seis opiniones: vale por tener seis
 * opiniones de SEIS CASAS DISTINTAS. Dos modelos del mismo fabricante
 * comparten datos de entrenamiento, criterios de alineamiento y, sobre
 * todo, los mismos puntos ciegos: si uno se inventa una cifra, el otro
 * tiende a encontrarla razonable. Por eso aquí nunca se sientan dos de
 * la misma casa, aunque sobren huecos.
 *
 * Claude es siempre el secretario, y no por simpatía: hace falta UN
 * miembro con permiso para mirar la deliberación desde fuera —verificar
 * datos, destilar los puntos, redactar— y hace falta que ese miembro NO
 * vote, porque quien redacta la propuesta tiene ventaja sobre lo que se
 * vota. Separar las dos cosas es lo que impide que el que escribe el
 * acta decida también el resultado.
 *
 * LAS SEIS CASAS VIENEN DE SERIE. Antes el consejo se formaba con
 * KAIRO_EXTRA_MODELOS, que es la lista de repuesto del CHAT, y el
 * resultado fue un consejo de NVIDIA y poolside deliberando sobre una
 * sanción administrativa: modelos de programar opinando de derecho,
 * porque estaban en una lista puesta para otra cosa. El consejo trae
 * ahora su propia plantilla, y esa lista solo rellena huecos.
 */

/* Las casas del consejo, y por dónde entra cada una.
 *
 * `nativo` es la cadena por las claves propias de Kairo; `porRouter`, la
 * misma casa a través de OpenRouter. Se prefiere la nativa: ya la tienes
 * contratada, así que no se paga dos veces lo mismo.
 *
 * Cada una es una cadena con suplentes porque los modelos se retiran, se
 * quedan sin cuota y los "preview" dejan de servirse de un día para
 * otro. Vale más un miembro con un modelo modesto que una silla vacía. */
const PLANTILLA: { casa: string; nativo?: string[]; porRouter: string[] }[] = [
  {
    casa: "Google",
    nativo: [
      "gemini-pro-latest",
      "gemini-3.1-pro-preview",
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-flash-lite-latest",
    ],
    porRouter: ["google/gemini-4-argon", "google/gemini-3.1-pro-preview", "google/gemini-2.5-pro"],
  },
  {
    casa: "OpenAI",
    nativo: ["gpt:gpt-5.1", "gpt:gpt-5", "gpt:gpt-5-mini"],
    porRouter: ["openai/gpt-6.1-sol", "openai/gpt-5.5", "openai/gpt-5.1"],
  },
  {
    casa: "xAI",
    porRouter: ["x-ai/grok-4.7", "x-ai/grok-4.6", "x-ai/grok-4.5", "x-ai/grok-4.3"],
  },
  {
    casa: "DeepSeek",
    porRouter: [
      "deepseek/deepseek-v4-pro",
      "deepseek/deepseek-v3.2",
      "deepseek/deepseek-chat-v3.1",
    ],
  },
  {
    casa: "Qwen",
    porRouter: [
      "qwen/qwen3.8-max-prime",
      "qwen/qwen3.8-max-0902",
      "qwen/qwen3.7-max",
      "qwen/qwen3.5-397b-a17b",
    ],
  },
];

/** La cadena del secretario, por sus dos puertas. */
const SECRETARIO = {
  nativo: ["claude:claude-opus-5-5", "claude:claude-opus-5", "claude:claude-sonnet-5-5"],
  porRouter: ["anthropic/claude-opus-5", "anthropic/claude-opus-4.1", "anthropic/claude-sonnet-4.5"],
};

/** Qué proveedor nativo le toca a cada casa, cuando lo tiene. */
const NATIVO: Record<string, "gemini" | "gpt"> = { Google: "gemini", OpenAI: "gpt" };

/** De qué casa es un modelo de OpenRouter, por su prefijo. */
const CASAS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  "x-ai": "xAI",
  xai: "xAI",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  alibaba: "Qwen",
  anthropic: "Anthropic",
  "meta-llama": "Meta",
  meta: "Meta",
  mistralai: "Mistral",
  mistral: "Mistral",
  cohere: "Cohere",
  microsoft: "Microsoft",
  nvidia: "NVIDIA",
  perplexity: "Perplexity",
  amazon: "Amazon",
  moonshotai: "Moonshot",
  "z-ai": "Z.ai",
  poolside: "poolside",
};

function casaDe(modelo: string): string {
  const prefijo = modelo.includes("/") ? modelo.split("/")[0].toLowerCase() : "";
  if (prefijo && CASAS[prefijo]) return CASAS[prefijo];
  // Sin prefijo conocido no se inventa una casa: se usa el nombre tal cual,
  // que al menos es comprobable contra el historial de OpenRouter.
  return prefijo ? prefijo : modelo;
}

const modeloDe = (ref: string): string => partir(ref).modelo;

/** Con el prefijo que entiende Kairo para el proveedor de repuesto. */
const porRouter = (ids: string[]): string[] => ids.map((m) => `extra:${m}`);

/* ¿Se puede llamar por OpenRouter?
 *
 * Deliberadamente NO se usa `proveedorActivo("extra")`: esa función
 * exige además que KAIRO_EXTRA_MODELOS tenga algo, porque para el chat
 * un proveedor sin modelos listados no sirve de nada. El consejo trae
 * los suyos, así que le basta con la clave y la dirección. Atarlo a esa
 * comprobación dejaba el consejo sin formar por una lista que es de
 * otra parte de la aplicación. */
function hayRouter(): boolean {
  return Boolean(claveExtra().trim()) && Boolean(EXTRA_URL());
}

/* Si quieres mandar tú, esta variable gana sobre la plantilla.
 *
 * Es propia del consejo y NO es KAIRO_EXTRA_MODELOS: esa es la del chat,
 * y mezclarlas fue justo lo que sentó modelos de programar en una
 * deliberación jurídica. */
function plantillaPropia(): string[] {
  return (process.env.KAIRO_CONSEJO_MODELOS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

export type Composicion = {
  miembros: Miembro[];
  /** Los que votan, sin el secretario. */
  votantes: Miembro[];
  sec: Miembro | null;
  /** Por qué el consejo no está completo, si no lo está. */
  aviso: string | null;
};

/** El secretario: nativo si hay clave propia, y si no por OpenRouter. */
function secretario(propia: string[]): Miembro | null {
  const hecho = (refs: string[]): Miembro => ({
    id: "M6",
    casa: "Anthropic",
    modelo: modeloDe(refs[0]),
    refs,
    secretario: true,
  });

  // Si lo has elegido tú a mano, manda lo tuyo.
  const tuyo = propia.filter((m) => casaDe(m) === "Anthropic");
  if (tuyo.length && hayRouter()) return hecho(porRouter(tuyo));

  if (proveedorActivo("claude")) return hecho(SECRETARIO.nativo);
  if (hayRouter()) return hecho(porRouter(SECRETARIO.porRouter));
  return null;
}

/* Forma el consejo con lo que haya configurado.
 *
 * No falla por estar incompleto: un consejo de cuatro casas distintas
 * sigue sirviendo para lo que sirve —cruzar criterios ajenos— y es mejor
 * que no deliberar. Lo que sí hace es DECIRLO, porque un consejo de dos
 * es un consejo de dos y presentarlo como seis sería mentir. */
export function formarConsejo(): Composicion {
  const propia = plantillaPropia();
  const router = hayRouter();
  const sec = secretario(propia);
  const vistas = new Set<string>();
  const votantes: Miembro[] = [];

  const añadir = (casa: string, refs: string[]) => {
    if (votantes.length >= VOTANTES_MAX || !refs.length) return;
    const clave = casa.toLowerCase();
    // Ni la casa del secretario ni ninguna repetida.
    if (vistas.has(clave)) return;
    if (sec && clave === sec.casa.toLowerCase()) return;
    vistas.add(clave);
    votantes.push({
      id: `M${votantes.length + 1}`,
      casa,
      modelo: modeloDe(refs[0]),
      refs,
      secretario: false,
    });
  };

  if (propia.length) {
    /* Plantilla propia: se respeta tal cual, sin añadir nada por detrás.
       Si te has molestado en escribir la lista, es que sabes a quién
       quieres sentar. */
    if (router) for (const m of propia) añadir(casaDe(m), porRouter([m]));
  } else {
    /* La plantilla de serie. Cada casa entra por su mejor puerta y, si
       esa se cierra, por la otra: la cadena de una casa con clave propia
       termina en sus modelos de OpenRouter.

       No es redundancia. La capa gratuita de Gemini se agota por día y
       devuelve 429 en TODOS sus modelos a la vez ("retry in 16h"), así
       que una cadena de cinco Gemini nativos se cae entera de golpe y
       Google desaparece del consejo hasta mañana. Cruzando de proveedor,
       la casa sigue sentada: es el mismo fabricante por otra puerta, que
       es lo único que al consejo le importa. */
    for (const c of PLANTILLA) {
      const puerta = NATIVO[c.casa];
      const nativa = c.nativo && puerta && proveedorActivo(puerta) ? c.nativo : [];
      const suplente = router ? porRouter(c.porRouter) : [];
      añadir(c.casa, [...nativa, ...suplente]);
    }

    /* Y si aún sobran sillas, las rellenan los modelos de repuesto del
       chat. Van los últimos a propósito: esa lista está puesta para otra
       cosa, así que puede completar el consejo pero no definirlo. */
    if (proveedorActivo("extra")) {
      for (const ref of modelosExtra()) añadir(casaDe(partir(ref).modelo), [ref]);
    }
  }

  const miembros = sec ? [...votantes, sec] : votantes;

  let aviso: string | null = null;
  if (!sec) {
    aviso =
      "No hay secretario: hace falta un modelo de Anthropic, por su clave propia " +
      "(ANTHROPIC_API_KEY) o por OpenRouter (KAIRO_EXTRA_KEY). Sin él nadie " +
      "verifica los datos ni redacta la propuesta.";
  } else if (votantes.length < 2) {
    aviso =
      "Hacen falta al menos dos votantes de casas distintas para que haya debate. " +
      (propia.length
        ? "Añade más casas en KAIRO_CONSEJO_MODELOS, o borra esa variable para usar la plantilla de serie."
        : "Con una clave de OpenRouter (KAIRO_EXTRA_KEY) el consejo se completa solo.");
  } else if (votantes.length < VOTANTES_MAX) {
    /* El remedio depende de por qué falta gente: si has escrito tú la
       plantilla, el consejo es el que pediste y mandarte a poner una
       clave que ya tienes sería un consejo inútil. */
    const remedio = propia.length
      ? "Añade más casas en KAIRO_CONSEJO_MODELOS, o borra esa variable para usar la plantilla de serie."
      : "Con una clave de OpenRouter (KAIRO_EXTRA_KEY) entran las casas que faltan.";
    aviso =
      `Consejo de ${votantes.length + 1} en vez de 6: ` +
      `${votantes.map((m) => m.casa).join(", ")} y el secretario. ${remedio}`;
  }

  return { miembros, votantes, sec, aviso };
}

/** ¿Se puede deliberar siquiera? */
export function hayConsejo(c: Composicion): boolean {
  return Boolean(c.sec) && c.votantes.length >= 2;
}
