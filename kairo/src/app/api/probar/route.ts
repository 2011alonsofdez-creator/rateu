import { cadenaDe, ESFUERZO, MAX_SALIDA, RAZONAMIENTO } from "@/lib/ia/config";
import { arrancar, partir } from "@/lib/ia/proveedores";

/** El código HTTP que traía el fallo, si lo traía. Solo el número: el
 *  mensaje entero no sale de aquí. */
function codigoDe(fallo: unknown): string {
  const n = /\b([45]\d\d)\b/.exec(String(fallo));
  return n ? n[1] : "fallo";
}

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

/* PROBAR KAIRO SIN CUENTA.
 *
 * Hasta hoy, un desconocido que llegaba a la web tenía que registrarse
 * ANTES de ver una sola respuesta. Las páginas de Paperwork, Gist y Code
 * eran públicas pero sus API devolvían 401, así que la gente hacía todo
 * el trabajo —subir la foto de su multa, escribir lo que quería saber— y
 * se comía un error. Nadie decide pagar por algo que no ha visto
 * funcionar, y aquí no se podía ver funcionar.
 *
 * Esta ruta es la puerta abierta, y vive APARTE de /api/chat a propósito:
 * el camino con sesión no se toca. Si esto falla, falla solo esto.
 *
 * Lo que puede hacer un desconocido es a propósito poco:
 *
 *   · Solo el nivel Estándar, que en la cadena empieza por Gemini Flash.
 *     Sale por unas diez milésimas de euro la respuesta.
 *   · Sin archivos, sin buscar en internet, sin Forja y sin MEGA, que son
 *     los que cuestan dinero de verdad.
 *   · Pregunta corta y respuesta corta.
 *
 * Y tres cerrojos, cada uno tapando el agujero del anterior:
 *
 *   1. Una galleta con la cuenta de lo gastado. Se salta borrando las
 *      galletas, y no pasa nada: es educación, no seguridad.
 *   2. Un tope por IP en memoria, que para el bucle de un listo.
 *   3. Un tope global al día, que es el que impide que un día bueno en
 *      redes se convierta en una factura mala.
 *
 * Los topes 2 y 3 viven en memoria, así que cada instancia del servidor
 * lleva su propia cuenta: con diez instancias calientes, el tope global
 * es diez veces mayor. Está asumido. Al precio de Estándar, diez mil
 * respuestas regaladas son menos de diez euros, y el problema que tenemos
 * hoy no es gastar de más, es que no entra nadie. Cuando haya tráfico de
 * verdad, esto se cuenta en la base de datos.
 */

/** Cuántas respuestas se regalan por visitante. */
const POR_VISITANTE = 3;
/** Tope por IP y hora, para cortar un bucle. */
const POR_IP_HORA = 8;
/** Tope de toda la casa al día. El que protege la cartera. */
const AL_DIA = 300;

const GALLETA = "kairo_probar";
const LARGO_MAXIMO = 600;

const porIp = new Map<string, number[]>();
let hoy = new Date().toDateString();
let gastadasHoy = 0;

function dentroDelTope(ip: string): boolean {
  const dia = new Date().toDateString();
  if (dia !== hoy) {
    hoy = dia;
    gastadasHoy = 0;
    porIp.clear();
  }
  if (gastadasHoy >= AL_DIA) return false;

  const ahora = Date.now();
  const previas = (porIp.get(ip) ?? []).filter((t) => ahora - t < 3_600_000);
  if (previas.length >= POR_IP_HORA) return false;

  previas.push(ahora);
  porIp.set(ip, previas);
  if (porIp.size > 5000) porIp.clear(); // no crecer sin fin
  gastadasHoy += 1;
  return true;
}

const SISTEMA = `Eres Kairo, un asistente que responde en español de España.
Alguien te está probando por primera vez desde la página de inicio y no tiene cuenta.
Contesta a lo que te pregunten de forma directa y útil, en menos de 120 palabras.
Nada de presentarte, ni de dar la bienvenida, ni de ofrecer ayuda adicional al final: solo la respuesta.
Si la pregunta necesita datos de los últimos meses, dilo en una línea en vez de inventártelos.
No sabes quién está al otro lado y puede ser un menor: nada de contenido sexual, violento, ni instrucciones peligrosas.`;

function respuesta(cuerpo: Record<string, unknown>, estado: number, usadas?: number) {
  const r = Response.json(cuerpo, { status: estado });
  if (usadas !== undefined) {
    r.headers.append(
      "Set-Cookie",
      `${GALLETA}=${usadas}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly`,
    );
  }
  return r;
}

export async function POST(request: Request) {
  let pregunta = "";
  try {
    const cuerpo = (await request.json()) as { pregunta?: unknown };
    pregunta = String(cuerpo?.pregunta ?? "").trim();
  } catch {
    return respuesta({ error: "peticion_mala" }, 400);
  }

  if (pregunta.length < 3) return respuesta({ error: "vacia" }, 400);
  if (pregunta.length > LARGO_MAXIMO) pregunta = pregunta.slice(0, LARGO_MAXIMO);

  const galletas = request.headers.get("cookie") ?? "";
  const usadas = Number(new RegExp(`${GALLETA}=(\\d+)`).exec(galletas)?.[1] ?? 0);
  if (usadas >= POR_VISITANTE) return respuesta({ error: "se_acabaron", quedan: 0 }, 429);

  const ip = (request.headers.get("x-forwarded-for") ?? "desconocida").split(",")[0].trim();
  if (!dentroDelTope(ip)) return respuesta({ error: "muchas_pruebas" }, 429);

  /* QUÉ CEREBROS ATIENDEN A UN DESCONOCIDO.
   *
   * De quien llega a la portada no se sabe la edad, así que lo primero
   * que se pide es la cadena de edad desconocida: `cadenaDe(.., null)`
   * devuelve SOLO Gemini, que es el único de los tres con filtro de
   * contenido por petición.
   *
   * Y ahí estuvo el fallo que costó dos despliegues: si esta casa no
   * tiene clave de Gemini puesta —porque tira de OpenRouter, que es
   * configurable— esa lista sale VACÍA. No falla nada, no salta ningún
   * error: simplemente no hay a quién preguntar, y el desconocido ve
   * "no he podido contestar" en su primera pantalla de Kairo.
   *
   * Pero quedarse en "¿hay Gemini o no hay Gemini?" tampoco bastaba, y
   * eso lo dijo la primera comprobación que supo contar lo que pasaba:
   * tres intentos, `gemini:429`, `gemini:429`, `gemini:429`. Clave de
   * Gemini había. Lo que no había era cupo: el plan gratuito de Google
   * tiene un tope diario, y al llegar al tope devuelve 429. La lista
   * entera eran Gemini, así que los tres intentos eran el mismo modelo
   * chocando con la misma puerta cerrada.
   *
   * Así que Gemini va PRIMERO, no en exclusiva. Si contesta, el visitante
   * se lleva el filtro de contenido por petición, que es lo que se quería.
   * Si no contesta —sin cupo, caído, lo que sea— detrás hay otros, porque
   * entre una respuesta sin ese filtro y ninguna respuesta, ninguna es
   * peor: el filtro no es lo único que protege, los modelos traen el suyo
   * de fábrica, y el encargo de abajo lo dice en voz alta por si acaso.
   *
   * Dos de cada uno. Cuatro intentos son ya quince segundos de espera, y
   * quien está probando esto no ha prometido esperar nada.
   */
  const conFiltro = cadenaDe("normal", null);
  const sinFiltro = cadenaDe("normal", "adulto").filter((id) => !conFiltro.includes(id));
  const cadena = [...conFiltro.slice(0, 2), ...sinFiltro.slice(0, 2)];
  let texto = "";

  /* Qué le pasó a cada uno, para poder contarlo si fallan los tres.
     Solo el proveedor y el código: ni el modelo exacto ni el mensaje del
     servidor, que es de donde se escapan las cosas que no deben salir. */
  const intentos: string[] = [];

  for (const id of cadena) {
    try {
      const { primero, resto } = await arrancar({
        id,
        sistema: SISTEMA,
        mensajes: [{ rol: "user", texto: pregunta }],
        /* EL TECHO NO ES EL LARGO DE LA RESPUESTA.
 
           Aquí ponía 900, pensando "respuesta corta, techo corto". Y el
           techo no cuenta solo lo que se lee: en los modelos que piensan,
           el razonamiento sale del mismo saco. Con 900 y el razonamiento
           en "decide tú", Gemini se gastaba el presupuesto entero
           pensando y devolvía texto vacío. Sin error, sin excepción, sin
           nada en el registro: los tres de la cadena "contestaban" en
           blanco y el desconocido veía "no he podido contestar".
 
           Esto es lo que quedaba del fallo después de arreglar el
           razonamiento en cero, y es más tonto que aquel, porque no
           avisa. Ahora el techo va holgado. No se paga por el techo, se
           paga por lo que salga, y el encargo ya pide menos de 120
           palabras: lo que cambia es que ahora caben las dos cosas. */
        maxSalida: Math.min(MAX_SALIDA.normal, 4096),
        esfuerzo: ESFUERZO.normal,
        modoEdad: null,
        /* Lo mismo que pide el chat en este nivel, y no un cero.
 
           Poner cero parecía lo barato —no pienses, contesta— y lo que
           hacía era tumbar la respuesta entera: los Gemini nuevos no
           dejan apagar el razonamiento y devuelven un 400. Los tres
           modelos de la cadena fallaban igual y el desconocido veía
           "no he podido contestar" en la primera pantalla de Kairo.
           -1 es "decide tú", que es lo que hace el chat de verdad. */
        pensar: RAZONAMIENTO.normal,
        temperatura: 0.4,
      });

      const junta = (t: unknown) => {
        if (t && typeof t === "object" && "texto" in t) texto += (t as { texto: string }).texto;
      };
      junta(primero);
      for (let n = await resto.next(); !n.done; n = await resto.next()) junta(n.value);

      if (texto.trim()) break;
      intentos.push(`${partir(id).proveedor}:vacio`);
    } catch (fallo) {
      texto = "";
      /* Al registro del servidor, no a la respuesta. Sin esto, cuando
         los tres de la cadena fallan solo queda un "sin_cerebros" que
         no dice nada, y averiguar por qué cuesta una noche. */
      console.warn("[probar] %s no contestó: %s", id, String(fallo).slice(0, 300));
      intentos.push(`${partir(id).proveedor}:${codigoDe(fallo)}`);
    }
  }

  /* SIN CEREBROS, PERO DICIENDO CUÁL.
 
     El que lo lee no es el visitante —a él la caja le enseña "no he
     podido contestar" y ya está— sino el comprobador que corre contra la
     web de verdad desde fuera. Sin esto, un fallo aquí solo se puede
     mirar en el registro de Vercel, que desde donde yo trabajo no se ve:
     dos despliegues a ciegas costó la lección.
 
     Va el proveedor y el código, que no son secreto: la portada ya dice
     que Kairo usa Claude, Gemini y GPT. No va el modelo exacto ni el
     mensaje del servidor. */
  if (!texto.trim()) {
    return respuesta(
      { error: cadena.length ? "sin_cerebros" : "sin_modelos", intentos },
      503,
    );
  }

  return respuesta({ texto: texto.trim(), quedan: POR_VISITANTE - usadas - 1 }, 200, usadas + 1);
}
