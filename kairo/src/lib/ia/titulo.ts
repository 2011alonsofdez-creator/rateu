import { arrancar, partir } from "./proveedores";
import { cadenaDe } from "./config";
import { disponible } from "./cuarentena";

/* EL TÍTULO DEL CHAT, RESUMIDO.
 *
 * Antes el título era el principio de tu primera pregunta tal cual:
 * "q es el token d fornite", "rtdsd", "[Archivos adjuntos: Scr…". En la
 * lista no decía de qué iba cada chat. Ahora, al acabar la primera
 * respuesta, un modelo rápido lo resume en 2-5 palabras ("Token de
 * Fortnite").
 *
 * Se prueban los modelos rápidos de TODOS los proveedores, no solo
 * Gemini: cuando Gemini se queda sin cuota, el título lo pone otro. Si
 * no hay ninguno libre, se queda el de antes: nada se rompe por no tener
 * título bonito. */

const PLAZO = 5000;
const SISTEMA =
  "Pon un título de 2 a 5 palabras, en el idioma de la pregunta, que diga de qué va " +
  "esta conversación. Corrige las faltas. Sin comillas, sin punto final y sin emojis. " +
  "Contesta SOLO con el título.";

function limpiar(texto: string): string | null {
  const t = texto
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean)
    ?.replace(/^t[íi]tulo\s*:\s*/i, "")
    .replace(/["«»“”*#`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.。]+$/, "")
    .trim();
  if (!t || t.length < 3 || t.length > 60) return null;
  return t[0].toUpperCase() + t.slice(1);
}

async function conModelo(id: string, pregunta: string, respuesta: string): Promise<string | null> {
  const { primero, resto } = await arrancar({
    id,
    sistema: SISTEMA,
    mensajes: [
      {
        rol: "user",
        texto: `Pregunta: ${pregunta.slice(0, 500)}\n\nRespuesta: ${respuesta.slice(0, 700)}\n\nTítulo:`,
      },
    ],
    maxSalida: 40,
    esfuerzo: "bajo",
    modoEdad: "adulto",
    pensar: 0,
    temperatura: 0.3,
  });
  let texto = primero && "texto" in primero ? primero.texto : "";
  for (let r = await resto.next(); !r.done && texto.length < 120; r = await resto.next()) {
    if ("texto" in r.value) texto += r.value.texto;
  }
  return limpiar(texto);
}

export async function tituloResumido(pregunta: string, respuesta: string): Promise<string | null> {
  // Gemini primero (gratis); luego los demás proveedores, uno de cada.
  const cuantos = new Map<string, number>();
  const modelos = cadenaDe("fast", "adulto")
    .filter(disponible)
    .filter((id) => {
      const p = partir(id).proveedor;
      const n = cuantos.get(p) ?? 0;
      cuantos.set(p, n + 1);
      return p === "gemini" ? n < 2 : n < 1;
    })
    .slice(0, 4);

  const hasta = Date.now() + PLAZO;
  for (const id of modelos) {
    const queda = hasta - Date.now();
    if (queda < 500) break;
    try {
      const t = await Promise.race([
        conModelo(id, pregunta, respuesta),
        new Promise<null>((ok) => setTimeout(() => ok(null), queda)),
      ]);
      if (t) return t;
    } catch {
      /* el siguiente modelo, o nada */
    }
  }
  return null;
}
