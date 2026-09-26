import { GoogleGenAI } from "@google/genai";
import { ajustesSeguridad } from "./seguridad";
import { recolectorDeFuentes } from "./grounding";
import { cadenaDe } from "./config";
import { partir } from "./proveedores";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";

/* Gist: pegas un enlace y sales con los apuntes.
 *
 * Lo que lo hace distinto de "pégame el enlace en el chat" no es el
 * resumen: es que Gemini VE el vídeo. A un enlace de YouTube no le
 * leemos los subtítulos, se lo pasamos al modelo y lo mira, con lo que
 * sale en pantalla incluido. Para lo demás —artículos, la ficha de un
 * libro, una entrada de blog— abre la página y la lee.
 */

export type Punto = { marca: string; texto: string };

export type Ficha = {
  tipo: "video" | "web";
  url: string;
  titulo: string;
  autor: string;
  /** El resumen largo, en markdown. */
  resumen: string;
  puntos: Punto[];
  fuentes: Fuente[];
};

const YOUTUBE = /^(www\.|m\.|music\.)?(youtube\.com|youtu\.be)$/i;

/** Qué clase de enlace es, o null si no sirve. */
export function tipoDeUrl(crudo: string): "video" | "web" | null {
  let url: URL;
  try {
    url = new URL(crudo.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname.includes(".")) return null;
  if (crudo.length > 2000) return null;

  return YOUTUBE.test(url.hostname) ? "video" : "web";
}

/* El formato de la respuesta.
 *
 * Se pide en texto con etiquetas y no en JSON a propósito: el modo JSON
 * de Gemini no se lleva bien con las herramientas, y para leer una
 * página web hacen falta las herramientas. Con etiquetas funciona en
 * los dos casos, y si el modelo se sale del formato no se pierde nada:
 * lo que no se sepa colocar se queda como resumen, que es lo que de
 * verdad importa.
 */
const FORMATO = `Contesta EXACTAMENTE con este formato, sin nada antes ni después:

TITULO: (el título real de lo que has visto o leído)
AUTOR: (quién lo firma, el canal o el medio; si no lo sabes, deja la línea vacía)
RESUMEN:
(Aquí el resumen largo, en markdown. Esta es la parte importante y tiene
que poder leerse sola, sin ver el original: de qué va, qué defiende, con
qué argumentos y a qué conclusión llega. Varios párrafos. Usa subtítulos
con ## si el contenido tiene partes claras. Nada de "en este vídeo se
habla de": cuenta lo que dice, no que lo dice.)
PUNTOS:
- [marca] idea concreta
- [marca] otra idea concreta`;

const COMUN = `Eres Kairo y estás tomando apuntes de algo para alguien que no lo ha visto.

Reglas que no se saltan:
- Solo lo que salga en el original. Nada de rellenar con lo que tú sepas
  del tema; si el original no lo dice, no está.
- Si no has podido ver o leer el contenido, dilo claramente en el RESUMEN
  en vez de inventarte de qué va por el título o la dirección.
- Ni opiniones tuyas ni juicios: si el autor defiende algo discutible, se
  cuenta como lo que él defiende.
- En el idioma del original, salvo que sea uno que casi nadie lee aquí;
  entonces, en español.
- Entre 300 y 900 palabras de resumen, según lo que dé de sí. Un vídeo de
  tres minutos no da para mil palabras y estirarlo es mentir.`;

const DE_VIDEO = `${COMUN}
- En PUNTOS, la marca es el MINUTO en que se dice, en formato mm:ss o
  h:mm:ss, sacado del propio vídeo. Entre 4 y 10 puntos, en orden.

${FORMATO}`;

const DE_WEB = `${COMUN}
- Abre el enlace y léelo entero antes de escribir nada.
- Si es la ficha de un libro, resume el LIBRO: qué cuenta, cómo está
  organizado, para quién es y qué se saca de él. Busca lo que haga falta
  para no quedarte en la contraportada.
- En PUNTOS, la marca es el apartado o el capítulo donde se dice ("Cap. 3",
  "Introducción"). Si no hay apartados, pon un guion. Entre 4 y 10 puntos.

${FORMATO}`;

/** Parte la respuesta del modelo en las piezas de la ficha. */
export function leerFicha(texto: string): {
  titulo: string;
  autor: string;
  resumen: string;
  puntos: Punto[];
} {
  const limpio = texto.replace(/\r/g, "").trim();

  /* El final de una sección es la etiqueta siguiente o el final del
     texto. Y "final del texto" se escribe (?![\s\S]) y no $: con la
     marca `m`, que hace falta para que ^ETIQUETA case a principio de
     línea, el $ significa "final de LÍNEA" y cortaría cada sección en
     su primer salto. */
  const cacho = (etiqueta: string, hasta: string[]) => {
    const fin = hasta.length ? `\\n(?:${hasta.join("|")}):|(?![\\s\\S])` : `(?![\\s\\S])`;
    const re = new RegExp(`^${etiqueta}:[ \\t]*([\\s\\S]*?)(?=${fin})`, "im");
    return limpio.match(re)?.[1]?.trim() ?? "";
  };

  const titulo = cacho("TITULO", ["AUTOR", "RESUMEN", "PUNTOS"]).split("\n")[0].trim();
  const autor = cacho("AUTOR", ["RESUMEN", "PUNTOS"]).split("\n")[0].trim();
  const resumen = cacho("RESUMEN", ["PUNTOS"]);
  const listaPuntos = cacho("PUNTOS", []);

  const puntos: Punto[] = [];
  for (const linea of listaPuntos.split("\n")) {
    const m = linea.match(/^\s*[-*•]\s*(?:\[([^\]]{0,20})\]\s*)?(.+)$/);
    if (!m) continue;
    const marca = (m[1] ?? "").trim();
    const texto = m[2].trim();
    if (!texto) continue;
    puntos.push({ marca: marca === "-" ? "" : marca.slice(0, 20), texto: texto.slice(0, 400) });
    if (puntos.length >= 12) break;
  }

  /* Si el modelo no ha respetado el formato, lo escrito no se tira: se
     queda entero como resumen. Peor sería enseñar una ficha vacía. */
  return {
    titulo: titulo.slice(0, 300),
    autor: autor.slice(0, 200),
    resumen: (resumen || limpio).slice(0, 40000),
    puntos,
  };
}

/** Los modelos de Gemini que pueden atender esto, en orden. */
function candidatos(modoEdad: ModoEdad | null): string[] {
  return cadenaDe("normal", modoEdad)
    .filter((id) => partir(id).proveedor === "gemini")
    .map((id) => partir(id).modelo)
    .slice(0, 4);
}

export type Resumen = { ficha: Ficha; modelo: string };

/** Mira el enlace y devuelve la ficha. Lanza si no hay forma. */
export async function resumir(
  url: string,
  tipo: "video" | "web",
  modoEdad: ModoEdad | null,
): Promise<Resumen> {
  const clave = process.env.GEMINI_API_KEY?.trim();
  if (!clave) throw new Error("sin_clave");

  const ia = new GoogleGenAI({ apiKey: clave });
  const modelos = candidatos(modoEdad);
  if (!modelos.length) throw new Error("sin_clave");

  let ultimo: unknown;

  for (const modelo of modelos) {
    try {
      const fuentes = recolectorDeFuentes();

      const respuesta = await ia.models.generateContent({
        model: modelo,
        contents: [
          {
            role: "user",
            parts:
              tipo === "video"
                ? [
                    // Así es como se le enseña un vídeo de YouTube: el
                    // enlace tal cual, y él se encarga de verlo.
                    { fileData: { fileUri: url } },
                    { text: "Toma apuntes de este vídeo." },
                  ]
                : [{ text: `Toma apuntes de esto: ${url}` }],
          },
        ],
        config: {
          systemInstruction: tipo === "video" ? DE_VIDEO : DE_WEB,
          safetySettings: ajustesSeguridad(modoEdad),
          maxOutputTokens: 8192,
          // Para leer una página hay que poder abrirla y, si hace falta,
          // buscar. Un vídeo se ve solo, así que ahí no hacen falta.
          ...(tipo === "web"
            ? { tools: [{ urlContext: {} }, { googleSearch: {} }] }
            : {}),
        },
      });

      fuentes.anadir(respuesta.candidates?.[0]?.groundingMetadata);

      const texto = respuesta.text ?? "";
      if (!texto.trim()) throw new Error("vacio");

      const leido = leerFicha(texto);

      return {
        modelo,
        ficha: {
          tipo,
          url,
          titulo: leido.titulo || url,
          autor: leido.autor,
          resumen: leido.resumen,
          puntos: leido.puntos,
          fuentes: fuentes.fuentes,
        },
      };
    } catch (e) {
      ultimo = e;
    }
  }

  throw ultimo ?? new Error("sin_respuesta");
}
