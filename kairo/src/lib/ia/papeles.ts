import { GoogleGenAI } from "@google/genai";
import { ajustesSeguridad } from "./seguridad";
import { cadenaDe } from "./config";
import { partir } from "./proveedores";
import type { ModoEdad } from "@/lib/planes";
import type { Adjunto } from "@/lib/tipos";

/* Paperwork: qué es este papel y para cuándo.
 *
 * Una multa, una carta del banco, un contrato de alquiler, la póliza
 * del seguro. Lo que la gente necesita de esos papeles no es un
 * resumen: es saber QUÉ le piden, CUÁNTO y PARA CUÁNDO, y qué pasa si
 * no hace nada. Eso es una decisión con fecha, y por eso la fecha sale
 * de aquí como fecha de verdad y no como una frase suelta.
 *
 * Lo que NO hace, y va escrito en el prompt: dar consejo legal. Dice lo
 * que pone el papel y a quién acudir. La diferencia importa.
 */

export type Papel = {
  titulo: string;
  remitente: string;
  deQueVa: string;
  queQuieren: string;
  importe: string;
  /** AAAA-MM-DD, o vacío si el papel no pone ninguna. */
  fechaLimite: string;
  consecuencias: string;
  pasos: string[];
  borrador: string;
};

const FORMATO = `Contesta EXACTAMENTE con este formato, sin nada antes ni después:

TITULO: (de qué es este papel, en cinco o seis palabras)
REMITENTE: (quién lo manda: el organismo, la empresa o la persona)
DE_QUE_VA: (una frase: qué es esto, en cristiano)
QUE_QUIEREN: (qué te piden exactamente que hagas)
IMPORTE: (la cantidad con su moneda, o vacío si no hay dinero de por medio)
FECHA_LIMITE: (AAAA-MM-DD; si el papel da un plazo en días, cuéntalo desde
la fecha del papel y pon el día resultante. Si no hay plazo, deja vacío)
CONSECUENCIAS: (qué pasa si no haces nada. Solo lo que diga el papel)
PASOS:
- (lo primero que hay que hacer)
- (lo siguiente)
BORRADOR:
(Si hay que contestar, escribe aquí el borrador listo para enviar, con
los huecos que falten marcados así: [TU NOMBRE]. Si no hay que contestar
nada, deja esto vacío.)`;

const SISTEMA = `Eres Kairo mirando un papel oficial que alguien acaba de recibir y no entiende.

Cómo trabajas:
- SOLO lo que ponga el papel. Si un dato no aparece, se deja vacío: no te
  inventes un importe, un plazo ni un organismo porque "suele ser así".
- Nada de jerga. "Alega" es "responde diciendo por qué no estás de
  acuerdo". Si tienes que usar una palabra rara, la explicas al lado.
- Lo primero que tiene que quedar claro es el plazo. Si el papel da días
  hábiles, dilo en CONSECUENCIAS, y pon en FECHA_LIMITE la fecha más
  prudente de las posibles.
- Si el papel está borroso, cortado o ilegible, dilo en DE_QUE_VA en vez
  de adivinar.
- No das consejo legal ni fiscal. Cuentas lo que pone y, si la cosa es
  seria, dices con qué profesional u organismo hay que hablar.
- Si lo que te mandan no es un papel oficial (una foto cualquiera, un
  apunte), dilo en DE_QUE_VA y deja el resto vacío.

${FORMATO}`;

/** Parte la respuesta en las piezas del papel. */
export function leerPapel(texto: string, hoy = new Date()): Papel {
  const limpio = texto.replace(/\r/g, "").trim();
  const ETIQUETAS = [
    "TITULO",
    "REMITENTE",
    "DE_QUE_VA",
    "QUE_QUIEREN",
    "IMPORTE",
    "FECHA_LIMITE",
    "CONSECUENCIAS",
    "PASOS",
    "BORRADOR",
  ];

  /* (?![\s\S]) es "final del texto". Con la marca `m`, $ sería "final
     de línea" y cada sección se quedaría en su primer salto. */
  const cacho = (etiqueta: string) => {
    const otras = ETIQUETAS.filter((e) => e !== etiqueta);
    const re = new RegExp(
      `^${etiqueta}:[ \\t]*([\\s\\S]*?)(?=\\n(?:${otras.join("|")}):|(?![\\s\\S]))`,
      "im",
    );
    return limpio.match(re)?.[1]?.trim() ?? "";
  };

  const unaLinea = (etiqueta: string, max: number) =>
    cacho(etiqueta).split("\n")[0].trim().slice(0, max);

  const pasos = cacho("PASOS")
    .split("\n")
    .map((l) => l.replace(/^\s*[-*•\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((p) => p.slice(0, 300));

  return {
    titulo: unaLinea("TITULO", 300) || "Papel sin identificar",
    remitente: unaLinea("REMITENTE", 200),
    deQueVa: cacho("DE_QUE_VA").slice(0, 1000),
    queQuieren: cacho("QUE_QUIEREN").slice(0, 1000),
    importe: unaLinea("IMPORTE", 60),
    fechaLimite: fechaValida(unaLinea("FECHA_LIMITE", 40), hoy),
    consecuencias: cacho("CONSECUENCIAS").slice(0, 1000),
    pasos,
    borrador: cacho("BORRADOR").slice(0, 8000),
  };
}

/* Una fecha que no sea una fecha rompe la columna `date` de la tabla, y
   una de hace diez años o del siglo que viene es que el modelo se la ha
   inventado: en los dos casos, mejor sin fecha que con una falsa. */
export function fechaValida(crudo: string, hoy = new Date()): string {
  const m = crudo.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";

  const fecha = new Date(`${m[0]}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return "";

  const anioHoy = hoy.getUTCFullYear();
  const anio = Number(m[1]);
  if (anio < anioHoy - 5 || anio > anioHoy + 10) return "";

  return m[0];
}

export type Analisis = { papel: Papel; modelo: string };

/** Mira el papel y saca qué es, qué quieren y para cuándo. */
export async function mirarPapel(
  adjuntos: Adjunto[],
  nota: string,
  modoEdad: ModoEdad | null,
): Promise<Analisis> {
  const clave = process.env.GEMINI_API_KEY?.trim();
  if (!clave) throw new Error("sin_clave");

  const ia = new GoogleGenAI({ apiKey: clave });
  const modelos = cadenaDe("normal", modoEdad)
    .filter((id) => partir(id).proveedor === "gemini")
    .map((id) => partir(id).modelo)
    .slice(0, 4);

  if (!modelos.length) throw new Error("sin_clave");

  /* La fecha de hoy va en la pregunta porque el plazo casi siempre es
     relativo: "quince días desde la notificación" no es nada sin saber
     en qué día vivimos. */
  const hoy = new Date();
  const fechaHoy = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(hoy);

  let ultimo: unknown;

  for (const modelo of modelos) {
    try {
      const respuesta = await ia.models.generateContent({
        model: modelo,
        contents: [
          {
            role: "user",
            parts: [
              ...adjuntos.map((a) => ({
                inlineData: { mimeType: a.tipo, data: a.datos },
              })),
              {
                text:
                  `Hoy es ${fechaHoy}. Mira este papel y dime qué es.` +
                  (nota.trim() ? `\n\nLo que añade quien lo manda: ${nota.trim().slice(0, 1000)}` : ""),
              },
            ],
          },
        ],
        config: {
          systemInstruction: SISTEMA,
          safetySettings: ajustesSeguridad(modoEdad),
          maxOutputTokens: 4096,
        },
      });

      const texto = respuesta.text ?? "";
      if (!texto.trim()) throw new Error("vacio");

      return { papel: leerPapel(texto, hoy), modelo };
    } catch (e) {
      ultimo = e;
    }
  }

  throw ultimo ?? new Error("sin_respuesta");
}
