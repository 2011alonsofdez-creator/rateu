import { GoogleGenAI } from "@google/genai";
import { ajustesSeguridad } from "./seguridad";
import { recolectorDeFuentes } from "./grounding";
import { cadenaDe } from "./config";
import { partir } from "./proveedores";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";

/* Buscar ANTES de contestar.
 *
 * Darle un buscador a un modelo y esperar que lo use es como dejar un
 * diccionario encima de la mesa: ahí se queda. Esto hace la búsqueda
 * por su cuenta, antes de que el modelo abra la boca, y le pone los
 * resultados delante. A partir de ahí, contestar sin mirar ya no es una
 * opción que tenga.
 *
 * Es una llamada aparte y corta —un modelo rápido, sin pensar, con el
 * buscador puesto— así que cuesta un segundo o dos. Solo se hace cuando
 * la pregunta lo pide (ver `ahora.ts`).
 */

export type Hallazgo = {
  /** Los hechos encontrados, en viñetas. Vacío si no encontró nada. */
  hechos: string;
  fuentes: Fuente[];
  busquedas: string[];
  modelo: string;
};

const SISTEMA = `Eres el buscador de Kairo. No hablas con nadie: recoges datos.

Te dan una pregunta y devuelves SOLO lo que encuentres buscando, así:
- Un dato por línea, empezando por guion.
- Cada línea con su fecha cuando la haya ("a 26/09/2026", "temporada 2026").
- Nombres propios, cifras, direcciones y horarios EXACTOS, como los has
  encontrado. Nada de redondear ni de reescribir.
- Si dos fuentes se contradicen, pon las dos y dilo.

Reglas:
- Busca siempre. Aunque creas saberlo, búscalo.
- No contestes a la persona, no saludes, no expliques, no resumas por
  encima: solo los datos.
- Si buscas y no hay nada sólido, responde exactamente: NADA ENCONTRADO
- Jamás te inventes un dato para rellenar. Un sitio, un precio o una
  fecha que no aparezcan en los resultados no existen.`;

/** Busca en internet lo que haga falta para contestar la pregunta. */
export async function buscarHechos(
  pregunta: string,
  contexto: string,
  modoEdad: ModoEdad | null,
): Promise<Hallazgo | null> {
  const clave = process.env.GEMINI_API_KEY?.trim();
  if (!clave) return null;

  const modelos = cadenaDe("normal", modoEdad)
    .filter((id) => partir(id).proveedor === "gemini")
    .map((id) => partir(id).modelo)
    .slice(0, 3);

  if (!modelos.length) return null;

  const ia = new GoogleGenAI({ apiKey: clave });

  const hoy = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  for (const modelo of modelos) {
    try {
      const fuentes = recolectorDeFuentes();

      const respuesta = await ia.models.generateContent({
        model: modelo,
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `Hoy es ${hoy}.\n` +
                  (contexto ? `De qué venían hablando: ${contexto}\n` : "") +
                  `\nBusca lo necesario para contestar a esto:\n${pregunta.slice(0, 1500)}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: SISTEMA,
          safetySettings: ajustesSeguridad(modoEdad),
          // Sin pensar y con techo corto: esto tiene que ser rápido.
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 1500,
          tools: [{ googleSearch: {} }],
        },
      });

      fuentes.anadir(respuesta.candidates?.[0]?.groundingMetadata);
      const texto = (respuesta.text ?? "").trim();

      /* Sin fuentes y sin texto no hay búsqueda que valga: se devuelve
         null y Kairo contesta como antes, avisando de lo que no sabe.
         Fingir que se ha buscado sería peor que no buscar. */
      if (!texto || /^NADA ENCONTRADO/i.test(texto)) {
        if (!fuentes.fuentes.length) return null;
      }

      return {
        hechos: /^NADA ENCONTRADO/i.test(texto) ? "" : texto.slice(0, 6000),
        fuentes: fuentes.fuentes,
        busquedas: fuentes.busquedas,
        modelo,
      };
    } catch {
      // Se prueba con el siguiente modelo de la cadena.
    }
  }

  return null;
}
