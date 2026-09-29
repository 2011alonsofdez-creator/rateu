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
  /** Si llegó a buscar DE VERDAD. Esto no es un detalle: ver abajo. */
  busco: boolean;
};

const SISTEMA = `Eres el buscador de Kairo. No hablas con nadie: recoges datos.

Te dan una pregunta y devuelves SOLO lo que encuentres buscando, así:
- Un dato por línea, empezando por guion.
- Cada línea con su fecha cuando la haya ("a 26/09/2026", "temporada 2026").
- Nombres propios, cifras, direcciones y horarios EXACTOS, como los has
  encontrado. Nada de redondear ni de reescribir.
- Si dos fuentes se contradicen, pon las dos y dilo.

Reglas:
- BUSCA. Siempre, sin excepción, aunque estés convencido de saberlo y
  aunque la pregunta te parezca absurda o creas que la respuesta es "eso
  no existe". Una respuesta tuya sin haber usado el buscador no vale
  para nada y se tira.
- No contestes a la persona, no saludes, no expliques, no resumas por
  encima: solo los datos.
- Si buscas y no hay nada sólido, responde exactamente: NADA ENCONTRADO
- Jamás te inventes un dato para rellenar. Un sitio, un precio o una
  fecha que no aparezcan en los resultados no existen.`;

/* Lo que como mucho puede tardar la búsqueda entera.
 *
 * Buscar antes de contestar es lo que evita que Kairo te diga que el GTA
 * 6 no tiene fecha. Pero es tiempo que se suma DELANTE de la primera
 * palabra, y una búsqueda lenta se nota más que una respuesta regular.
 * Pasado el plazo se contesta sin ella y Kairo dice que no lo ha podido
 * comprobar, que es la verdad y tarda cero. */
const PLAZO = 9000;

const conPlazo = <T>(promesa: Promise<T>, ms: number): Promise<T | null> => {
  let reloj: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promesa,
    new Promise<null>((listo) => {
      reloj = setTimeout(() => listo(null), ms);
    }),
  ]).finally(() => {
    if (reloj !== undefined) clearTimeout(reloj);
  });
};

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

  /* Lo que se devuelve si NINGÚN modelo llega a buscar: hechos vacíos,
     que es lo que hace que Kairo diga "he mirado y no lo he
     encontrado" en vez de soltar lo que recordaba. */
  let sinBuscar: Hallazgo | null = null;
  const seAcaba = Date.now() + PLAZO;

  const hoy = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  for (const modelo of modelos) {
    const queda = seAcaba - Date.now();
    // Menos de dos segundos no da ni para empezar: mejor contestar ya.
    if (queda < 2000) break;

    try {
      const fuentes = recolectorDeFuentes();

      const respuesta = await conPlazo(ia.models.generateContent({
        model: modelo,
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `Hoy es ${hoy}.\n` +
                  (contexto ? `De qué venían hablando: ${contexto}\n` : "") +
                  `\nUsa el buscador y dime qué encuentras sobre esto:\n${pregunta.slice(0, 1500)}` +
                  `\n\nNo contestes de memoria. Busca primero, aunque creas que ya lo sabes.`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: SISTEMA,
          safetySettings: ajustesSeguridad(modoEdad),
          /* Que piense un poco. Con el presupuesto a cero contestaba de
             memoria sin llegar a usar el buscador —que es exactamente
             el fallo que esto venía a arreglar—, así que se le deja
             decidir: un segundo más y sí busca. */
          thinkingConfig: { thinkingBudget: -1 },
          /* Lo que escribe el buscador no se lee: se funde en el prompt
             del que contesta. Con 800 caben de sobra las viñetas, y
             cada token que no escribe es tiempo que no esperas. */
          maxOutputTokens: 800,
          tools: [{ googleSearch: {} }],
        },
      }), queda);

      // Se acabó el tiempo: mejor sin datos que tarde.
      if (!respuesta) break;

      fuentes.anadir(respuesta.candidates?.[0]?.groundingMetadata);
      const texto = (respuesta.text ?? "").trim();

      /* ¿Buscó de verdad? La prueba no es lo que diga, es si Google
         devolvió algo: páginas consultadas o consultas hechas. Si no
         hay ni una cosa ni la otra, ha contestado de memoria.
         Y eso NO se puede dar por bueno: su texto llega al prompt
         anunciado como "lo que acabas de buscar en internet", así que
         pasarlo tal cual convertiría un recuerdo viejo en un hecho
         recién comprobado. Es peor que no buscar: es blanquearlo.
         Se prueba con otro modelo, y si ninguno busca, se dice que no
         se ha encontrado nada, que es la verdad. */
      const busco = fuentes.fuentes.length > 0 || fuentes.busquedas.length > 0;

      if (!busco) {
        sinBuscar = { hechos: "", fuentes: [], busquedas: [], modelo, busco: false };
        continue;
      }

      return {
        hechos: !texto || /^NADA ENCONTRADO/i.test(texto) ? "" : texto.slice(0, 6000),
        fuentes: fuentes.fuentes,
        busquedas: fuentes.busquedas,
        modelo,
        busco: true,
      };
    } catch {
      // Se prueba con el siguiente modelo de la cadena.
    }
  }

  return sinBuscar;
}
