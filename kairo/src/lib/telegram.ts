import { createHmac } from "node:crypto";

/* KAIRO EN EL MÓVIL.
 *
 * El brief de la mañana se escribía a las 7:05 y se quedaba dentro de la
 * web esperando a que alguien entrara a leerlo. Un encargo que trabaja
 * mientras no estás y luego te obliga a ir a buscarlo no está terminado.
 *
 * Telegram es la forma más barata de cerrar eso: no hay servidor de
 * correo, ni dominio que verificar, ni nada que mantener encendido. Un
 * bot, una dirección y ya.
 *
 * Y NADA de esto sale del servidor. El testigo del bot es una contraseña:
 * con él, cualquiera puede escribir en nombre de Kairo a quien lo tenga
 * añadido.
 */

const API = "https://api.telegram.org";

/** Telegram corta los mensajes a 4096 caracteres. Se deja margen: lo que
 *  pase del tope no da error, llega cortado por donde caiga. */
export const TROZO_MAX = 3500;

/** Cuántos trozos como mucho. Un brief larguísimo no puede convertirse
 *  en quince avisos seguidos en el móvil de alguien. */
export const TROZOS_MAX = 5;

/** Cuánto se espera a Telegram. El reloj tiene un minuto para TODOS los
 *  encargos: uno que no contesta no puede quedarse con él. */
const PLAZO = 8000;

const testigo = (): string => (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();

/** ¿Está puesto el bot? */
export const hayTelegram = (): boolean => testigo().length > 0;

/* --------------------------------------------------------------
   El código para enlazar
   -------------------------------------------------------------- */

/* Las letras y números que se usan. Sin I, O, 0 ni 1: en la pantalla de
   un móvil no se distinguen, y esto hay que poder leerlo y escribirlo. */
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** El código que hay que mandarle al bot para enlazar una cuenta.
 *
 *  Sale de la cuenta y del testigo del bot, así que es siempre el mismo
 *  para la misma persona —no hay que guardarlo en ninguna parte ni
 *  caducarlo— y no se puede adivinar sin el testigo, que no sale de
 *  aquí. */
export function codigoDe(perfilId: string): string {
  const firma = createHmac("sha256", testigo() || "sin-bot").update(perfilId).digest();

  let fuera = "";
  for (let i = 0; i < 6; i++) fuera += LETRAS[firma[i] % LETRAS.length];
  return `KAIRO-${fuera}`;
}

/* --------------------------------------------------------------
   Partir un texto largo
   -------------------------------------------------------------- */

/** Parte un texto en trozos que quepan, cortando por donde se lee.
 *
 *  Por párrafo si puede, por línea si no, y por espacio en el peor caso.
 *  Cortar a mitad de palabra cada 3500 caracteres se nota en cada aviso
 *  que llega. */
export function trocear(texto: string, max = TROZO_MAX): string[] {
  const limpio = texto.trim();
  if (!limpio) return [];
  if (limpio.length <= max) return [limpio];

  const trozos: string[] = [];
  let resto = limpio;

  while (resto.length > max && trozos.length < TROZOS_MAX - 1) {
    const cacho = resto.slice(0, max);

    /* Se busca el mejor corte de más a menos: dos saltos (párrafo), uno
       (línea), un espacio. Y solo si cae en la segunda mitad: cortar en
       el carácter 200 de 3500 desperdicia el mensaje entero. */
    let corte = -1;
    for (const marca of ["\n\n", "\n", " "]) {
      const donde = cacho.lastIndexOf(marca);
      if (donde > max * 0.5) {
        corte = donde + (marca === " " ? 0 : marca.length);
        break;
      }
    }
    if (corte <= 0) corte = max;

    trozos.push(resto.slice(0, corte).trim());
    resto = resto.slice(corte).trim();
  }

  if (resto) trozos.push(resto.slice(0, max));
  return trozos.filter(Boolean);
}

/* --------------------------------------------------------------
   Hablar con Telegram
   -------------------------------------------------------------- */

async function llamar(metodo: string, cuerpo?: unknown): Promise<unknown> {
  const t = testigo();
  if (!t) throw new Error("sin_bot");

  const res = await fetch(`${API}/bot${t}/${metodo}`, {
    method: cuerpo ? "POST" : "GET",
    headers: cuerpo ? { "content-type": "application/json" } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    signal: AbortSignal.timeout(PLAZO),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: unknown } | null;
  if (!json?.ok) throw new Error(`telegram_${res.status}`);
  return json.result;
}

/** Manda un texto a una conversación. Si es largo, va en varios.
 *
 *  Devuelve si ha salido TODO. Un brief que llega a la mitad es peor que
 *  uno que no llega: el que lo lee no tiene forma de saber que falta. */
export async function mandar(chatId: string, texto: string): Promise<boolean> {
  const trozos = trocear(texto);
  if (!trozos.length) return false;

  for (let i = 0; i < trozos.length; i++) {
    /* Numerados solo cuando hay más de uno, y al principio: en el móvil
       se ve la primera línea del aviso, no la última. */
    const cuerpo = trozos.length > 1 ? `(${i + 1}/${trozos.length})\n\n${trozos[i]}` : trozos[i];

    try {
      await llamar("sendMessage", {
        chat_id: chatId,
        text: cuerpo,
        /* Sin formato. El texto lo escribe un modelo, y un asterisco
           suelto o un guion bajo en medio de una palabra hacen que
           Telegram rechace el mensaje ENTERO con un 400. Que se vean dos
           asteriscos es feo; que no llegue el brief, no. */
        disable_web_page_preview: true,
      });
    } catch {
      return false;
    }
  }

  return true;
}

/** El nombre del bot, para poder enlazar a él desde un botón. */
export async function nombreDelBot(): Promise<string | null> {
  try {
    const r = (await llamar("getMe")) as { username?: string } | null;
    return r?.username ?? null;
  } catch {
    return null;
  }
}

/** Busca quién ha mandado este código al bot y devuelve su conversación.
 *
 *  Se pregunta por los mensajes recibidos en vez de montar un webhook, y
 *  es a propósito: un webhook hay que darlo de alta con la dirección de
 *  la web, y esa dirección cambia en cada despliegue de prueba. Esto
 *  funciona sin dar de alta nada. */
export async function buscarChat(codigo: string): Promise<string | null> {
  const buscado = codigo.trim().toUpperCase();
  if (!buscado) return null;

  let novedades: unknown;
  try {
    novedades = await llamar("getUpdates?limit=100&timeout=0");
  } catch {
    return null;
  }

  const lista = Array.isArray(novedades) ? novedades : [];

  // De atrás hacia delante: si alguien lo ha mandado dos veces, vale el
  // último, que es el que acaba de enviar.
  for (let i = lista.length - 1; i >= 0; i--) {
    const m = (lista[i] as { message?: { text?: string; chat?: { id?: number | string } } })
      ?.message;
    const texto = (m?.text ?? "").toUpperCase();
    const chat = m?.chat?.id;

    if (chat !== undefined && texto.includes(buscado)) return String(chat);
  }

  return null;
}
