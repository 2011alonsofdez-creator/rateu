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

/* EL RUIDO DEL FINAL: el audio de Gemini a veces acaba de golpe, a mitad
   de onda, y el altavoz lo convierte en un "clic". Se le quita el silencio
   del final y se apaga en 60 ms (y se enciende en 10 ms al principio). */
function suavizar(pcm: Buffer): Buffer {
  const n = Math.floor(pcm.length / 2);
  const m = new Int16Array(n);
  for (let i = 0; i < n; i++) m[i] = pcm.readInt16LE(i * 2);
  let fin = n;
  while (fin > 0 && Math.abs(m[fin - 1]) < 300) fin--;
  fin = Math.min(n, fin + 2400); // deja 0,1 s de cola natural
  const bajar = Math.min(1440, fin);
  const subir = Math.min(240, fin);
  const out = Buffer.alloc(fin * 2);
  for (let i = 0; i < fin; i++) {
    let v = m[i];
    if (i < subir) v = Math.round((v * i) / subir);
    if (i >= fin - bajar) v = Math.round((v * (fin - i)) / bajar);
    out.writeInt16LE(v, i * 2);
  }
  return out;
}

/* EL ACENTO DE ESPAÑA.
 *
 * Los modelos de voz de Gemini entienden un guion con "notas del
 * director" y solo leen lo que va debajo de TRANSCRIPT. Es la forma que
 * recomienda Google para pedir acento y tono SIN que lo lea en voz alta
 * (la vez que se lo pedí en una frase normal, la leía). */
function guion(texto: string): string {
  return [
    "# AUDIO PROFILE: Kairo",
    "Young Spanish man in his twenties, born and raised in Madrid.",
    "",
    "### DIRECTOR'S NOTES",
    "Accent: native European Spanish from Madrid, Spain (castellano peninsular).",
    "Pronounce 'z' and soft 'c' as the 'th' sound (distinción), clear final 's',",
    "Spain intonation. Absolutely no Latin American accent.",
    "Style: natural, calm and friendly, with a bit of energy. Not robotic.",
    "Pace: normal conversational speed.",
    "Only speak the transcript below. Never read these notes.",
    "",
    "#### TRANSCRIPT",
    texto,
  ].join("\n");
}

/* LA VOZ DE KAIRO: Umbriel, la que elegiste (la 5 de las 10): masculina,
   joven, tranquila y cercana. Si un día no está, Fenrir (la 3), algo más
   animada. */
const VOCES = ["Umbriel", "Fenrir"];

/** El texto dicho con la voz de Kairo, en .wav. Lanza si ningún modelo ni
 *  clave ha podido (el navegador entonces lee con su propia voz). */
export async function hablar(texto: string, conIdioma = true): Promise<Buffer> {
  const voces = VOCES;
  const claves = clavesDeGemini();
  if (!claves.length) throw new Error("sin clave de Gemini");

  let ultimo: unknown = new Error("ningún modelo de voz disponible");
  // Todo junto, como mucho 20 s: más vale que el navegador lea con su voz
  // a que te quedes esperando en silencio.
  const hasta = Date.now() + 20_000;
  for (const modelo of MODELOS) {
    if (!disponible(modelo)) continue;
    for (const clave of claves) for (const voz of voces) {
      const queda = hasta - Date.now();
      if (queda < 1000) throw ultimo;
      try {
        const r = await new GoogleGenAI({
          apiKey: clave,
          httpOptions: { timeout: Math.min(15_000, queda) },
        }).models.generateContent({
          model: modelo,
          contents: [{ role: "user", parts: [{ text: guion(texto) }] }],
          config: {
            responseModalities: ["AUDIO"],
            /* El acento, por configuración y NO escrito en el texto: escrito,
               Gemini lo leía en voz alta. Si el modelo no acepta el idioma,
               se repite sin él (abajo). */
            speechConfig: {
              ...(conIdioma ? { languageCode: "es-ES" } : {}),
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } },
            },
          },
        });
        const parte = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        const datos = parte?.inlineData?.data;
        if (!datos) throw new Error(`${modelo} no ha devuelto audio`);
        const tipo = parte?.inlineData?.mimeType ?? "";
        const hz = Number(tipo.match(/rate=(\d+)/)?.[1]) || 24000;
        const crudo = Buffer.from(datos, "base64");
        // Si algún día lo manda ya empaquetado (wav, mp3), tal cual.
        if (/wav|mpeg|mp3|ogg/i.test(tipo)) return crudo;
        return aWav(suavizar(crudo), hz);
      } catch (e) {
        ultimo = e;
        // No acepta "es-ES": otra vez, igual pero sin idioma.
        if (conIdioma && /language/i.test(String(e))) {
          return hablar(texto, false);
        }
        // Una voz que no existe no es culpa de la clave: se prueba la otra.
        if (!/voice|voz/i.test(String(e))) break;
      }
    }
    apartar(modelo, ultimo);
  }
  throw ultimo;
}
