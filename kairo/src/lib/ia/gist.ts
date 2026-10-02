import { GoogleGenAI } from "@google/genai";
import { ajustesSeguridad } from "./seguridad";
import { recolectorDeFuentes } from "./grounding";
import { cadenaDe } from "./config";
import { partir } from "./proveedores";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";
import { claveDeGemini } from "./claves";
import { enlaceConMinuto, segundosDe } from "@/lib/fichas";

/* Gist: pegas un enlace y sales con los apuntes.
 *
 * Lo que lo hace distinto de "pégame el enlace en el chat" no es el
 * resumen: es que Gemini VE el vídeo. A un enlace de YouTube no le
 * leemos los subtítulos, se lo pasamos al modelo y lo mira, con lo que
 * sale en pantalla incluido. Para lo demás —artículos, la ficha de un
 * libro, una entrada de blog— abre la página y la lee.
 *
 * De un vídeo no sale un resumen seguido, sale el vídeo CONTADO POR
 * PARTES: "del minuto 0 al 2 pasa esto, del 2 al 5 esto otro". Un
 * resumen seguido te dice de qué va; las partes te dicen qué pasa, en
 * orden, y te dejan saltar al minuto que te interese sin verlo entero.
 */

/** Una parte del vídeo, o una idea suelta si no lleva título.
 *
 *  Es el mismo tipo para las dos cosas a propósito: así los resúmenes
 *  parte por parte caben en la misma columna de la base de datos que
 *  las fichas de antes, sin migración y sin romper lo ya guardado. Con
 *  `titulo` es una parte; sin él, una idea con su minuto. */
export type Punto = { marca: string; texto: string; titulo?: string };

/** En qué idioma se escribe el resumen. Un vídeo en inglés resumido en
 *  inglés no sirve de nada a quien no lo habla, así que se pregunta. */
export type Idioma = "es" | "original";

export type Ficha = {
  tipo: "video" | "web";
  url: string;
  titulo: string;
  autor: string;
  /** El resumen largo, en markdown. En un vídeo son las partes, ya
   *  escritas, para que se lea igual en cualquier sitio donde se
   *  enseñe sin tener que montarlas otra vez. */
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
const FORMATO_WEB = `Contesta EXACTAMENTE con este formato, sin nada antes ni después:

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

/* El formato de un vídeo: el vídeo contado por partes.
 *
 * El tramo va primero y entre corchetes porque es lo único que hay que
 * saber leer sin equivocarse: de ahí sale el enlace que salta a ese
 * minuto. El título y el texto, si el modelo los adorna, se limpian. */
const FORMATO_VIDEO = `Contesta EXACTAMENTE con este formato, sin nada antes ni después:

TITULO: (el título real del vídeo)
AUTOR: (el canal; si no lo sabes, deja la línea vacía)
PARTES:
[0:00-2:15] Título corto de esta parte
Qué pasa y qué se dice en esta parte, con detalle: los datos, los
nombres, los números y las conclusiones que salgan. Varias frases. Se
tiene que entender sin haber visto el vídeo.

[2:15-5:40] Título corto de la siguiente parte
Lo mismo para esta parte.

(y así hasta el final del vídeo)`;

const COMUN = `Eres Kairo y estás tomando apuntes de algo para alguien que no lo ha visto.

Reglas que no se saltan:
- Solo lo que salga en el original. Nada de rellenar con lo que tú sepas
  del tema; si el original no lo dice, no está.
- Si no has podido ver o leer el contenido, dilo claramente en vez de
  inventarte de qué va por el título o la dirección.
- Ni opiniones tuyas ni juicios: si el autor defiende algo discutible, se
  cuenta como lo que él defiende.`;

/* El idioma se decide fuera y se mete aquí, porque lo decide quien lee.
   Un vídeo en inglés resumido en inglés es un resumen que no se puede
   leer, y eso no lo arregla ningún modelo mejor. */
const EN_ESPANOL = `- Escribe TODO en español, aunque el original esté en otro idioma. Los
  nombres propios, las marcas y los títulos se dejan como están.`;

const EN_SU_IDIOMA = `- En el idioma del original, salvo que sea uno que casi nadie lee aquí;
  entonces, en español.`;

const deIdioma = (idioma: Idioma) => (idioma === "es" ? EN_ESPANOL : EN_SU_IDIOMA);

const DE_VIDEO = (idioma: Idioma) => `${COMUN}
${deIdioma(idioma)}
- El vídeo va contado POR PARTES, en orden y desde el minuto 0 hasta el
  final. Entre 5 y 14 partes según lo que dure: un vídeo de tres minutos
  tiene tres o cuatro partes, uno de una hora tiene doce.
- Los tramos son los del propio vídeo, en mm:ss (o h:mm:ss si pasa de
  una hora), y van seguidos: donde acaba una parte empieza la siguiente.
  Sin huecos y sin solaparse.
- De 40 a 120 palabras por parte. Si una parte no da para eso, es que no
  era una parte: júntala con la de al lado.
- No te saltes el final. Un resumen que se queda a la mitad del vídeo es
  peor que ninguno, porque no se nota.

${FORMATO_VIDEO}`;

const DE_WEB = (idioma: Idioma) => `${COMUN}
${deIdioma(idioma)}
- Entre 300 y 900 palabras de resumen, según lo que dé de sí. Un texto
  de tres párrafos no da para mil palabras y estirarlo es mentir.
- Abre el enlace y léelo entero antes de escribir nada.
- Si es la ficha de un libro, resume el LIBRO: qué cuenta, cómo está
  organizado, para quién es y qué se saca de él. Busca lo que haga falta
  para no quedarte en la contraportada.
- En PUNTOS, la marca es el apartado o el capítulo donde se dice ("Cap. 3",
  "Introducción"). Si no hay apartados, pon un guion. Entre 4 y 10 puntos.

${FORMATO_WEB}`;

/** Cuántas partes se admiten. Más de esto no es un resumen por partes,
 *  es la transcripción con otro nombre. */
const PARTES_MAX = 24;

/* La cabecera de una parte, quitándole antes los adornos.
 *
 * El modelo escribe el tramo de siete formas distintas según el día:
 * "[0:00-2:15]", "## 0:00 – 2:15 —", "- **[0:00]**". Todas significan
 * lo mismo y todas tienen que valer: si una no se reconoce, esa parte
 * se pierde entera y el usuario ve un resumen con un agujero.
 */
function cabeceraDeParte(linea: string): { marca: string; titulo: string } | null {
  const pelada = linea
    .trim()
    .replace(/^>+\s*/, "") // cita
    .replace(/^[-*•]\s+/, "") // viñeta
    .replace(/^#{1,6}\s*/, "") // título de markdown
    .replace(/\*\*/g, "")
    .trim();

  const m = pelada.match(
    /* El tramo del final NO lleva un \s* suelto por delante: si lo
       llevara, se comería el espacio y el tramo dejaría de reconocerse
       en "[0:00 a 2:15]". No por falta de marcha atrás del motor de
       expresiones, sino porque sin ella TAMBIÉN encaja —el tramo es
       opcional— y entonces no hay nada que hacer marcha atrás. */
    /^\[?\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)(?:\s*(?:[-–—]|a|hasta)\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?))?\s*\]?\s*(?:[-–—:·|]\s*)?(.*)$/,
  );
  if (!m) return null;

  const desde = m[1];
  if (segundosDe(desde) === null) return null;

  const hasta = m[2] && segundosDe(m[2]) !== null ? m[2] : "";
  const titulo = m[3]
    .trim()
    .replace(/^[-–—:·|]\s*/, "")
    .replace(/[*_`]+/g, "")
    .trim();

  return { marca: hasta ? `${desde}-${hasta}` : desde, titulo: titulo.slice(0, 150) };
}

/** Parte el bloque PARTES en partes. */
export function leerPartes(bloque: string): Punto[] {
  const partes: Punto[] = [];
  let abierta: { marca: string; titulo: string; lineas: string[] } | null = null;

  const cerrar = () => {
    if (!abierta) return;
    const texto = abierta.lineas
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    /* Una parte sin título y sin texto no es una parte: es una marca de
       tiempo suelta que el modelo ha dejado colgando. */
    if (abierta.titulo || texto) {
      partes.push({
        marca: abierta.marca,
        titulo: abierta.titulo || undefined,
        texto: texto.slice(0, 2000),
      });
    }
    abierta = null;
  };

  for (const linea of bloque.split("\n")) {
    const cabecera = cabeceraDeParte(linea);
    if (cabecera) {
      cerrar();
      if (partes.length >= PARTES_MAX) return partes;
      abierta = { ...cabecera, lineas: [] };
      continue;
    }
    // Lo de antes de la primera cabecera se tira: es paja del modelo.
    if (abierta) abierta.lineas.push(linea);
  }

  cerrar();
  return partes;
}

/** Las partes escritas en markdown, con el minuto convertido en enlace.
 *
 *  Se guarda ya escrito y no se monta al pintar porque el resumen se
 *  enseña en más de un sitio —la ficha, el chat, lo que se le pasa al
 *  modelo cuando preguntas sobre el vídeo— y en todos tiene que leerse
 *  igual. */
export function markdownDePartes(partes: Punto[], url: string): string {
  return partes
    .map((p) => {
      const salto = enlaceConMinuto(url, p.marca);
      const minuto = salto === url ? `\`${p.marca}\`` : `[\`${p.marca}\`](${salto})`;
      const cabecera = p.titulo ? `### ${minuto} · ${p.titulo}` : `### ${minuto}`;
      return p.texto ? `${cabecera}\n\n${p.texto}` : cabecera;
    })
    .join("\n\n")
    .slice(0, 40000);
}

/** Parte la respuesta del modelo en las piezas de la ficha. */
export function leerFicha(texto: string): {
  titulo: string;
  autor: string;
  resumen: string;
  puntos: Punto[];
  partes: Punto[];
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

  const titulo = cacho("TITULO", ["AUTOR", "RESUMEN", "PARTES", "PUNTOS"]).split("\n")[0].trim();
  const autor = cacho("AUTOR", ["RESUMEN", "PARTES", "PUNTOS"]).split("\n")[0].trim();
  const resumen = cacho("RESUMEN", ["PARTES", "PUNTOS"]);
  const partes = leerPartes(cacho("PARTES", ["PUNTOS"]));
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
    partes,
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
  idioma: Idioma = "es",
): Promise<Resumen> {
  const clave = claveDeGemini();
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
                    { text: "Cuenta este vídeo por partes, de principio a fin." },
                  ]
                : [{ text: `Toma apuntes de esto: ${url}` }],
          },
        ],
        config: {
          systemInstruction: tipo === "video" ? DE_VIDEO(idioma) : DE_WEB(idioma),
          safetySettings: ajustesSeguridad(modoEdad),
          /* Contar un vídeo por partes ocupa bastante más que un
             resumen seguido, y lo que se corta por el techo no avisa:
             sale una ficha que se acaba en el minuto veinte. */
          maxOutputTokens: 16384,
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
      const porPartes = leido.partes.length > 0;

      return {
        modelo,
        ficha: {
          tipo,
          url,
          titulo: leido.titulo || url,
          autor: leido.autor,
          /* Con partes, el resumen SON las partes ya escritas. Sin
             ellas, lo que haya dicho el modelo: un vídeo sin capítulos
             claros puede salir como un resumen seguido, y eso es mejor
             que nada. */
          resumen: porPartes ? markdownDePartes(leido.partes, url) : leido.resumen,
          puntos: porPartes ? leido.partes : leido.puntos,
          fuentes: fuentes.fuentes,
        },
      };
    } catch (e) {
      ultimo = e;
    }
  }

  throw ultimo ?? new Error("sin_respuesta");
}
