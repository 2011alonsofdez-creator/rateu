import { modelosExtra, partir, proveedorActivo } from "@/lib/ia/proveedores";
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
 */

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
};

function casaDe(modelo: string): string {
  const prefijo = modelo.includes("/") ? modelo.split("/")[0].toLowerCase() : "";
  if (prefijo && CASAS[prefijo]) return CASAS[prefijo];
  // Sin prefijo conocido no se inventa una casa: se usa el nombre tal cual,
  // que al menos es comprobable contra el historial de OpenRouter.
  return prefijo ? prefijo : modelo;
}

/** El nombre corto del modelo, sin la casa delante. */
function modeloDe(ref: string): string {
  return partir(ref).modelo;
}

/* Los nativos van primero, y hay dos razones.
 *
 * La barata: ya tienes esas claves contratadas, así que no pagas en
 * OpenRouter lo que puedes gastar en casa.
 *
 * La buena: los nativos son los únicos que aceptan archivos
 * (`aceptaArchivos` descarta "extra"), y eso importa más adelante. */
function nativos(): { casa: string; refs: string[] }[] {
  const lista: { casa: string; refs: string[] }[] = [];
  /* Las cadenas salen de CADENAS en ia/config.ts, que son los
     identificadores comprobados contra cuentas de verdad. Lo mejor
     primero y, detrás, lo que casi seguro contesta: en un consejo vale
     más un miembro con un modelo modesto que una silla vacía. */
  if (proveedorActivo("gemini")) {
    lista.push({
      casa: "Google",
      refs: [
        "gemini-pro-latest",
        "gemini-3.1-pro-preview",
        "gemini-flash-latest",
        "gemini-3.8-flash",
        "gemini-flash-lite-latest",
      ],
    });
  }
  if (proveedorActivo("gpt")) {
    lista.push({ casa: "OpenAI", refs: ["gpt:gpt-5.1", "gpt:gpt-5", "gpt:gpt-5-mini"] });
  }
  return lista;
}

/* El secretario. Siempre un Claude, y siempre sin voto.
 *
 * Lo normal es que vaya por la clave nativa de Anthropic. Pero si no la
 * hay y en cambio tienes un Claude configurado en OpenRouter, ese hace
 * de secretario igual: sería absurdo dejar el consejo sin acta teniendo
 * al modelo disponible por otra puerta, solo porque entra por la de
 * atrás. Es el mismo modelo; cambia quién cobra la llamada. */
function secretario(): Miembro | null {
  if (proveedorActivo("claude")) {
    return {
      id: "M6",
      casa: "Anthropic",
      modelo: "claude-opus-5-5",
      refs: ["claude:claude-opus-5-5", "claude:claude-opus-5", "claude:claude-sonnet-5-5"],
      secretario: true,
    };
  }

  if (proveedorActivo("extra")) {
    const porOpenRouter = modelosExtra().find(
      (ref) => casaDe(partir(ref).modelo) === "Anthropic",
    );
    if (porOpenRouter) {
      return {
        id: "M6",
        casa: "Anthropic",
        modelo: modeloDe(porOpenRouter),
        refs: [porOpenRouter],
        secretario: true,
      };
    }
  }

  return null;
}

export type Composicion = {
  miembros: Miembro[];
  /** Los que votan, sin el secretario. */
  votantes: Miembro[];
  sec: Miembro | null;
  /** Por qué el consejo no está completo, si no lo está. */
  aviso: string | null;
};

/* Forma el consejo con lo que haya configurado.
 *
 * No falla por estar incompleto: un consejo de cuatro casas distintas
 * sigue sirviendo para lo que sirve —cruzar criterios ajenos— y es mejor
 * que no deliberar. Lo que sí hace es DECIRLO, porque un consejo de dos
 * es un consejo de dos y presentarlo como seis sería mentir. */
export function formarConsejo(): Composicion {
  const sec = secretario();
  const vistas = new Set<string>();
  const votantes: Miembro[] = [];

  const añadir = (casa: string, refs: string[]) => {
    if (votantes.length >= VOTANTES_MAX) return;
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

  for (const n of nativos()) añadir(n.casa, n.refs);

  /* Y los de OpenRouter rellenan los huecos que queden. Van después a
     propósito: así las casas que ya tienes en nativo no se pagan dos
     veces, y OpenRouter aporta justo las que Kairo no habla de serie
     —Grok, DeepSeek, Qwen—, que es para lo que hace falta. */
  if (proveedorActivo("extra")) {
    for (const ref of modelosExtra()) {
      añadir(casaDe(partir(ref).modelo), [ref]);
    }
  }

  const miembros = sec ? [...votantes, sec] : votantes;

  let aviso: string | null = null;
  if (!sec) {
    aviso =
      "No hay secretario: hace falta un modelo de Anthropic, por su clave propia " +
      "(ANTHROPIC_API_KEY) o añadiendo uno en KAIRO_EXTRA_MODELOS. Sin él nadie " +
      "verifica los datos ni redacta la propuesta.";
  } else if (votantes.length < 2) {
    aviso =
      "Hacen falta al menos dos votantes de casas distintas para que haya debate. " +
      "Añade modelos en KAIRO_EXTRA_MODELOS o pon la clave de Gemini o de OpenAI.";
  } else if (votantes.length < VOTANTES_MAX) {
    aviso =
      `Consejo de ${votantes.length + 1} en vez de 6: ` +
      `${votantes.map((m) => m.casa).join(", ")} y el secretario. ` +
      "Para completarlo, añade modelos de otras casas en KAIRO_EXTRA_MODELOS.";
  }

  return { miembros, votantes, sec, aviso };
}

/** ¿Se puede deliberar siquiera? */
export function hayConsejo(c: Composicion): boolean {
  return Boolean(c.sec) && c.votantes.length >= 2;
}
