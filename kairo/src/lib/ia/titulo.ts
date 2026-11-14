import { GoogleGenAI } from "@google/genai";
import { clavesDeGemini } from "./claves";
import { cadenaDe } from "./config";
import { partir } from "./proveedores";
import { disponible } from "./cuarentena";

/* EL TÍTULO DEL CHAT, RESUMIDO.
 *
 * Antes el título era el principio de tu primera pregunta tal cual:
 * "q es el token d fornite", "rtdsd", "[Archivos adjuntos: Scr…". En la
 * lista no decía de qué iba cada chat. Ahora, al acabar la primera
 * respuesta, un modelo rápido lo resume en 2-5 palabras ("Token de
 * Fortnite"). Si no hay modelo libre, se queda el de antes: nada se
 * rompe por no tener título bonito. */

const PLAZO = 5000;

export async function tituloResumido(pregunta: string, respuesta: string): Promise<string | null> {
  const claves = clavesDeGemini();
  const modelos = cadenaDe("fast", "adulto")
    .filter((id) => partir(id).proveedor === "gemini" && disponible(id))
    .map((id) => partir(id).modelo)
    .slice(0, 2);
  if (!claves.length || !modelos.length) return null;

  const peticion =
    "Pon un título de 2 a 5 palabras, en el idioma de la pregunta, que diga de qué va " +
    "esta conversación. Sin comillas, sin punto final y sin emojis. Solo el título.\n\n" +
    `Pregunta: ${pregunta.slice(0, 500)}\n\nRespuesta: ${respuesta.slice(0, 700)}`;

  for (const modelo of modelos) {
    try {
      const r = await Promise.race([
        new GoogleGenAI({ apiKey: claves[0] }).models.generateContent({
          model: modelo,
          contents: [{ role: "user", parts: [{ text: peticion }] }],
          config: { maxOutputTokens: 40, temperature: 0.3, thinkingConfig: { thinkingBudget: 0 } },
        }),
        new Promise<null>((ok) => setTimeout(() => ok(null), PLAZO)),
      ]);
      const texto = r?.text
        ?.replace(/["«»“”*#]/g, "")
        .replace(/\s+/g, " ")
        .replace(/[.。]+$/, "")
        .trim();
      if (texto && texto.length >= 3 && texto.length <= 60) {
        return texto[0].toUpperCase() + texto.slice(1);
      }
    } catch {
      /* el siguiente modelo, o nada */
    }
  }
  return null;
}
