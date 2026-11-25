import { arrancar } from "./proveedores";
import { cadenaDe } from "./config";
import { apartar, disponible } from "./cuarentena";
import { nombraAlgoConcreto, veredicto } from "./ahora";

/* ¿BUSCAR EN FUENTES O PENSARLO?
 *
 * Dos capas:
 *
 *   1. Las reglas (ahora.ts). Instantáneas y gratis. Resuelven lo claro:
 *      "precio", "hoy", "quién ganó" → buscar; "escríbeme", "calcula",
 *      "hola" → pensar.
 *
 *   2. Lo que las reglas no saben ("¿quién es Ibai?", "¿qué es Kick?",
 *      "¿es buena la Ryzen 7 9800X3D?") se lo pregunta a un modelo
 *      rápido, que entiende la frase en vez de buscar palabras. Tiene
 *      1,5 segundos: si no contesta, decide una regla de reserva
 *      (¿nombra algo concreto, con mayúscula?).
 *
 * La idea: buscar cuando la respuesta depende de datos del mundo que
 * cambian o que hay que comprobar, y no buscar cuando sale de pensar. */

const PLAZO = 1500;

const INSTRUCCION =
  "Eres un clasificador. Decide si, para contestar BIEN a la última pregunta, " +
  "hace falta BUSCAR EN INTERNET (fuentes actuales) o basta con PENSAR.\n" +
  "BUSCAR: datos que cambian (precios, fechas, horarios, resultados, noticias, " +
  "versiones, quién ocupa un cargo), hechos concretos de personas, empresas, " +
  "productos, sitios, juegos, apps o eventos reales, estadísticas, leyes y " +
  "trámites, recomendaciones de cosas concretas que existen (qué móvil comprar, " +
  "qué serie ver), y cualquier dato que, si fuera viejo o inventado, haría daño.\n" +
  "PENSAR: escribir, resumir, traducir, calcular, programar, razonar, aconsejar " +
  "en general, opinar, charlar, y explicar conocimiento estable (ciencia básica, " +
  "historia antigua, definiciones, gramática).\n" +
  "Contesta SOLO con una palabra: BUSCAR o PENSAR.";

async function preguntarAlModelo(pregunta: string, contexto: string): Promise<boolean | null> {
  const modelos = cadenaDe("fast", "adulto").filter(disponible).slice(0, 2);
  const texto = (contexto ? `Conversación hasta ahora:\n${contexto}\n\n` : "") + `Última pregunta: ${pregunta.slice(0, 600)}`;

  for (const id of modelos) {
    try {
      const { primero, resto } = await arrancar({
        id,
        sistema: INSTRUCCION,
        mensajes: [{ rol: "user", texto }],
        maxSalida: 5,
        esfuerzo: "bajo",
        modoEdad: "adulto",
        pensar: 0,
        temperatura: 0,
      });
      let salida = primero && "texto" in primero ? primero.texto : "";
      for (let r = await resto.next(); !r.done && salida.length < 20; r = await resto.next()) {
        if ("texto" in r.value) salida += r.value.texto;
      }
      const s = salida.trim().toUpperCase();
      if (s.startsWith("BUSCAR")) return true;
      if (s.startsWith("PENSAR")) return false;
    } catch (e) {
      // Sin cuota o caído: apartado, para no volver a esperarle en un rato.
      apartar(id, e);
      /* el siguiente, o la regla de reserva */
    }
  }
  return null;
}

/** ¿Hay que buscar en fuentes antes de contestar? `contexto` son los
 *  últimos mensajes, para entender "¿y el horario?" o "¿y eso cuánto
 *  cuesta?". */
export async function decidirBusqueda(pregunta: string, contexto = ""): Promise<boolean> {
  const v = veredicto(pregunta);
  if (v !== "duda") return v === "si";

  /* Si los modelos rápidos están apartados (sin cuota), ni se espera:
     la regla de reserva decide al momento en vez de 1,5 s después. */
  if (!cadenaDe("fast", "adulto").some(disponible)) return nombraAlgoConcreto(pregunta);

  const modelo = await Promise.race([
    preguntarAlModelo(pregunta, contexto),
    new Promise<null>((ok) => setTimeout(() => ok(null), PLAZO)),
  ]);
  if (modelo !== null) return modelo;
  return nombraAlgoConcreto(pregunta);
}
