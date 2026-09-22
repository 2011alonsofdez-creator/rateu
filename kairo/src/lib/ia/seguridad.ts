import { HarmBlockThreshold, HarmCategory, type SafetySetting } from "@google/genai";
import type { ModoEdad } from "@/lib/planes";

/* Filtros de contenido según la edad.
 *
 * Esto NO sustituye al system prompt: el prompt le dice a la IA cómo
 * comportarse, y esto corta lo que se le escape. Las dos capas hacen falta,
 * porque a un modelo siempre se le puede dar la vuelta con el texto adecuado.
 */
const UMBRALES: Record<ModoEdad, HarmBlockThreshold> = {
  nino: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  adolescente: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  adulto: HarmBlockThreshold.BLOCK_ONLY_HIGH,
};

const CATEGORIAS = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
];

export function ajustesSeguridad(modo: ModoEdad | null): SafetySetting[] {
  // Sin modo definido tratamos al usuario como menor. Ante la duda,
  // la opción segura, nunca la permisiva.
  const umbral = UMBRALES[modo ?? "nino"];
  return CATEGORIAS.map((category) => ({ category, threshold: umbral }));
}
