import OpenAI from "openai";
import { claveExtra, EXTRA_URL, esOpenRouter, modelosExtra, partir } from "./proveedores";
import type { Fuente } from "@/lib/tipos";

/* BUSCAR EN LA WEB PAGANDO, CUANDO LO GRATIS SE ACABA.
 *
 * Gemini busca en Google gratis y se agota: la capa gratuita tiene tope
 * por clave Y por modelo, así que hay una hora de la tarde en que Kairo
 * deja de poder mirar. A partir de ahí contestaba de memoria con un
 * cartel amarillo encima —honrado, y sin servir para nada—.
 *
 * Esto es la segunda red, y busca de verdad: OpenRouter le engancha un
 * buscador a cualquier modelo y devuelve las páginas que ha leído. Es
 * lo único de aquí que contesta a "quién ganó ayer", que es justo lo
 * que Wikipedia no sabe hacer.
 *
 * CUESTA DINERO, poco pero dinero: unos 0,007 $ por búsqueda con el
 * buscador que sale por defecto (Exa; con 5 € salen unas setecientas).
 * Por eso no es la primera opción: entra cuando Gemini ya ha dicho que
 * no. Y por eso se puede apagar sin tocar código, con
 * KAIRO_SIN_BUSCADOR_PAGADO=1, que el día que se acabe el saldo es
 * mejor apagarlo que ver fallar cada búsqueda.
 */

export type Citada = { texto: string; fuentes: Fuente[] };

/** Si está encendido. Apagarlo es poner la variable a algo. */
export const buscadorPagadoApagado = (): boolean =>
  Boolean((process.env.KAIRO_SIN_BUSCADOR_PAGADO ?? "").trim());

/** Con qué modelo se busca.
 *
 *  Da bastante igual cuál sea —no tiene que razonar, tiene que copiar
 *  lo que le ponga el buscador delante—, así que se coge el primero de
 *  los configurados, que es el que el dueño ha puesto primero. Se puede
 *  mandar otro con KAIRO_BUSCADOR_WEB.
 *
 *  Lo que sí se descarta es el nombre acabado en `:batch`: existe, pero
 *  no sirve para chatear, y falla con un error que parece de la clave.
 *  Ya nos costó una tarde. */
export function modeloDeBusqueda(): string {
  const aMano = (process.env.KAIRO_BUSCADOR_WEB ?? "").trim();
  if (aMano) return aMano;

  /* Y SIN EL "extra:" DELANTE.
 
     `modelosExtra()` no devuelve el nombre del modelo: devuelve el
     identificador de Kairo, que lleva el proveedor pegado delante
     ("extra:deepseek/..."). Mandarlo tal cual a OpenRouter es pedir un
     modelo que no existe, y eso contesta un 404 que se lee igual que
     una clave mala. Lo pilló la prueba antes de salir de aquí. */
  const sirve = modelosExtra()
    .map((id) => partir(id).modelo)
    .filter((m) => m && !/:batch(?![\w-])/.test(m));

  return sirve[0] ?? "";
}

/** ¿Se puede usar? Hace falta OpenRouter puesto y un modelo que valga. */
export function hayBuscadorPagado(): boolean {
  if (buscadorPagadoApagado()) return false;
  return Boolean(claveExtra()) && esOpenRouter(EXTRA_URL()) && Boolean(modeloDeBusqueda());
}

/* LO QUE DEVUELVE OPENROUTER.
 *
 * El texto va donde siempre, y las páginas leídas van aparte, en
 * `annotations`, cada una dentro de un `url_citation`. Está separado de
 * la llamada para poder probarlo con una respuesta de verdad guardada,
 * sin gastar saldo en cada prueba.
 *
 * Y se mira `annotations` y no el texto porque es la única prueba de
 * que ha buscado. Un modelo al que le pones un buscador y no lo usa
 * contesta igual de convencido, y ese texto llega al prompt anunciado
 * como "lo que acabas de buscar en internet": colarlo sería convertir
 * un recuerdo viejo en un hecho recién comprobado. */
export function leerLoDeOpenRouter(respuesta: unknown): Citada {
  const mensaje = (respuesta as {
    choices?: { message?: { content?: unknown; annotations?: unknown[] } }[];
  })?.choices?.[0]?.message;

  const texto = typeof mensaje?.content === "string" ? mensaje.content.trim() : "";

  const fuentes: Fuente[] = [];
  const vistas = new Set<string>();

  for (const a of mensaje?.annotations ?? []) {
    const cita = (a as { url_citation?: { url?: string; title?: string } })?.url_citation;
    if (!cita?.url || vistas.has(cita.url)) continue;
    vistas.add(cita.url);

    let dominio = "";
    try {
      dominio = new URL(cita.url).hostname.replace(/^www\./i, "");
    } catch {
      dominio = "";
    }

    fuentes.push({
      titulo: (cita.title || dominio || cita.url).slice(0, 160),
      url: cita.url,
      dominio,
      tipo: "web",
    });

    if (fuentes.length >= 12) break;
  }

  return { texto, fuentes };
}

/** Le pide a OpenRouter que busque y devuelva lo que encuentre. */
export async function preguntarConBuscador(
  sistema: string,
  mensaje: string,
  señal?: AbortSignal,
): Promise<Citada | null> {
  if (!hayBuscadorPagado()) return null;

  const cliente = new OpenAI({
    apiKey: claveExtra(),
    baseURL: EXTRA_URL(),
    /* OpenRouter mira estas dos para saber de qué aplicación viene cada
       llamada; sin ellas, en su panel no se ve quién está gastando. */
    defaultHeaders: { "HTTP-Referer": "https://kairo.app", "X-Title": "Kairo" },
  });

  const respuesta = await cliente.chat.completions.create(
    {
      model: modeloDeBusqueda(),
      messages: [
        { role: "system", content: sistema },
        { role: "user", content: mensaje },
      ],
      max_tokens: 2000,
      /* El buscador. Cinco resultados es lo que da por defecto y es de
         sobra: lo que se busca aquí es un dato, no un trabajo.
 
         Sin `engine`, OpenRouter usa el buscador propio del modelo si
         lo tiene y, si no —que es el caso de DeepSeek—, Exa. Se deja
         así a posta: elegir uno a mano ata Kairo a ese buscador, y el
         día que cambie el modelo configurado la decisión buena ya no
         sería ésa. */
      plugins: [{ id: "web", max_results: 5 }],
    } as never,
    señal ? { signal: señal } : undefined,
  );

  return leerLoDeOpenRouter(respuesta);
}
