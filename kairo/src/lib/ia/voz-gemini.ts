import { GoogleGenAI } from "@google/genai";
import { clavesDeGemini } from "./claves";
import { apartar, disponible } from "./cuarentena";

/* TEXTO A VOZ CON GEMINI.
 *
 * Los modelos de voz cambian de nombre cada pocos meses, así que se
 * prueban en orden hasta que uno conteste. Se puede forzar uno con la
 * variable KAIRO_MODELO_VOZ en Vercel. */
const MODELOS = [
  process.env.KAIRO_MODELO_VOZ?.trim(),
  "gemini-3.8-flash-tts",
  "gemini-3.8-flash-lite-tts",
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
].filter((m): m is string => Boolean(m));

/* Gemini devuelve el audio en crudo (PCM de 16 bits, mono, 24 kHz). El
   navegador no sabe reproducir eso tal cual: se le pone delante la
   cabecera de un .wav, que es lo mismo con 44 bytes de etiqueta. */
function aWav(pcm: Buffer, hz = 24000): Buffer {
  const cab = Buffer.alloc(44);
  cab.write("RIFF", 0);
  cab.writeUInt32LE(36 + pcm.length, 4);
  cab.write("WAVE", 8);
  cab.write("fmt ", 12);
  cab.writeUInt32LE(16, 16);
  cab.writeUInt16LE(1, 20); // PCM
  cab.writeUInt16LE(1, 22); // mono
  cab.writeUInt32LE(hz, 24);
  cab.writeUInt32LE(hz * 2, 28);
  cab.writeUInt16LE(2, 32);
  cab.writeUInt16LE(16, 34);
  cab.write("data", 36);
  cab.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([cab, pcm]);
}

/* LA VOZ DE KAIRO: masculina, joven, natural, tranquila pero con chispa.
   Achird es la "cercana" de Gemini; si esa no está, Puck, más animada. */
const VOCES = ["Achird", "Puck"];

/** El texto dicho con la voz de Kairo, en .wav. Lanza si ningún modelo ni
 *  clave ha podido (el navegador entonces lee con su propia voz). */
export async function hablar(texto: string): Promise<Buffer> {
  const claves = clavesDeGemini();
  if (!claves.length) throw new Error("sin clave de Gemini");

  let ultimo: unknown = new Error("ningún modelo de voz disponible");
  for (const modelo of MODELOS) {
    if (!disponible(modelo)) continue;
    for (const clave of claves) for (const voz of VOCES) {
      try {
        const r = await new GoogleGenAI({ apiKey: clave }).models.generateContent({
          model: modelo,
          contents: [{ role: "user", parts: [{ text: texto }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } },
          },
        });
        const parte = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        const datos = parte?.inlineData?.data;
        if (!datos) throw new Error(`${modelo} no ha devuelto audio`);
        const tipo = parte?.inlineData?.mimeType ?? "";
        const hz = Number(tipo.match(/rate=(\d+)/)?.[1]) || 24000;
        return aWav(Buffer.from(datos, "base64"), hz);
      } catch (e) {
        ultimo = e;
        // Una voz que no existe no es culpa de la clave: se prueba la otra.
        if (!/voice|voz/i.test(String(e))) break;
      }
    }
    apartar(modelo, ultimo);
  }
  throw ultimo;
}
