/* Las dos variables públicas de Supabase. La clave "anon" puede vivir
   en el navegador sin problema: no da acceso a nada por sí sola, porque
   quien manda es la seguridad a nivel de fila (RLS) de la base de datos.
   La que NUNCA puede salir del servidor es la service_role, y este
   proyecto no la usa en ninguna parte. */

/* La URL se limpia antes de usarla. Al copiarla del panel es facilísimo
   llevarse el "/rest/v1/" del final o un espacio invisible, y con eso la
   librería lanza una excepción nada más arrancar. Como el proxy corre en
   todas las rutas, eso tumbaba la web entera con un "Internal Server
   Error" que no dice nada. Mejor aceptar las dos formas. */
/** Deja la dirección como debería haber llegado. Se exporta para poder
 *  probarla caso a caso: es el sitio donde una variable mal pegada deja
 *  de ser una variable mal pegada y pasa a ser un "no se ha podido
 *  conectar" que nadie sabe de dónde sale. */
export function limpiarUrl(valor: string | undefined): string {
  let texto = (valor ?? "")
    /* 1. Lo que NO SE VE.
       Copiar y pegar desde una página web se trae de regalo espacios de
       ancho cero, guiones blandos y marcas de orden de bytes. No ocupan
       nada en pantalla, `trim()` no los considera espacios, y convierten
       un dominio perfecto en uno que no existe. Esto no es teoría: pasó
       aquí, 41 caracteres donde debía haber 40, y tres días buscando el
       fallo en la contraseña. */
    .replace(/[\u200B-\u200F\u2028\u2029\u2060\uFEFF\u00AD]/g, "")
    /* 2. Y ya puestos, TODO lo que una dirección no puede llevar.
       En una dirección de Supabase solo caben letras, números, punto,
       guion, dos puntos y barra. Cualquier otra cosa —una comilla, un
       paréntesis, un carácter raro de otro alfabeto— es basura del
       pegado. Fuera, sin preguntar: es la red que atrapa lo que las
       reglas de arriba no vieron venir. */
    .replace(/[^A-Za-z0-9.:/_[\]-]/g, "")
    // 3. Y las formas de escribirla mal que sí tienen arreglo.
    .replace(/^(https?):\/+/i, "$1://")  // https:/ con una sola barra
    .replace(/\.{2,}/g, ".")             // dos puntos seguidos
    .replace(/[.;,]+$/, "")               // puntuación al final
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");

  if (!texto) return "";
  // Copiada a mano es fácil que venga sin el https:// delante.
  if (!/^https?:\/\//i.test(texto)) texto = `https://${texto}`;

  try {
    const u = new URL(texto);
    if (u.protocol !== "https:" && u.protocol !== "http:") return rescatar(texto);

    /* Tiene que parecer una dirección de verdad. Sin esto, una frase
       cualquiera ("pon aquí tu url") se queda en algo que el navegador
       acepta como dominio, y la app cree que está configurada mientras
       se pasa la vida sin poder conectar. Un dominio lleva un punto; en
       tu ordenador, no. */
    const enCasaLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname);
    const formaDeDominio = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
    if (!enCasaLocal && !formaDeDominio.test(u.hostname)) return rescatar(texto);

    /* Y http:// se sube a https://, salvo en tu propio ordenador. Esto
       no es manía: un navegador NO deja que una página https pida nada
       por http. Lo bloquea sin preguntar, y lo que se ve es "no se ha
       podido conectar con el servidor", igual que si estuviera caído. */
    if (u.protocol === "http:" && !enCasaLocal) u.protocol = "https:";

    /* Todo lo que cuelgue de supabase.co se reduce a su forma de
       siempre. El subdominio `db.` es el de la base de datos, no el de
       la API: puesto aquí falla de una forma incomprensible, y es lo que
       copia quien entra por "Database" en vez de por "API". */
    if (/\.supabase\.(co|in)$/i.test(u.hostname)) {
      const canonica = rescatar(u.hostname);
      if (canonica) return canonica;
    }

    /* Y se devuelve lo que ha entendido el navegador, no el texto tal
       cual: eso deja el dominio en minúsculas y sin nada colgando
       detrás, que es como tiene que viajar. */
    return u.origin;
  } catch {
    return rescatar(texto);
  }
}

/* EL RESCATE: la última carta antes de rendirse.
 *
 * Una dirección de Supabase tiene siempre la misma forma:
 *
 *     https://<veinte letras>.supabase.co
 *
 * Así que cuando lo que llega no vale ni después de limpiarlo, todavía
 * se puede buscar ese identificador ahí dentro —quitando TODO lo que no
 * sea letra o número, da igual lo que se haya colado en medio— y
 * reconstruir la dirección entera desde cero.
 *
 * Vale más una dirección reconstruida que una web en modo demo por un
 * carácter que nadie puede ver. Y si no hay identificador que valga,
 * devuelve vacío y la app lo dice en la cara en vez de fingir. */
function rescatar(valor: string): string {
  const soloLetras = valor.toLowerCase().replace(/[^a-z0-9]/g, "");
  const proyecto = soloLetras.match(/([a-z0-9]{20})supabaseco/);
  return proyecto ? `https://${proyecto[1]}.supabase.co` : "";
}

/* Por qué una dirección no vale.
 *
 * Esto existe porque perdimos días con un "no se ha podido conectar" que
 * en realidad era un carácter invisible en una variable de entorno. El
 * diagnóstico decía "url_valida: false" y ahí se acababa: ni qué
 * carácter, ni dónde. Ahora lo dice.
 *
 * Nunca devuelve el valor entero a ciegas: si alguien se ha equivocado
 * de variable y ha pegado ahí una clave, enseñarla sería peor que el
 * fallo que se está arreglando. */
export function pistaDeUrl(valor: string | undefined): string | null {
  const cruda = valor ?? "";
  if (!cruda.trim()) return "no hay nada puesto";

  // Lo primero: ¿es esto una clave disfrazada de dirección?
  if (/^(sb_|eyJ|sbp_)/.test(cruda.trim())) {
    return "esto parece una CLAVE, no una dirección. Te has equivocado de variable";
  }

  if (limpiarUrl(cruda)) return null; // vale, no hay nada que contar

  const invisibles: string[] = [];
  for (let i = 0; i < cruda.length; i++) {
    const c = cruda.codePointAt(i) ?? 0;
    const raro =
      (c >= 0x200b && c <= 0x200f) || c === 0x2060 || c === 0xfeff || c === 0x00ad || c === 0x2028;
    if (raro) invisibles.push(`posición ${i + 1} (U+${c.toString(16).toUpperCase().padStart(4, "0")})`);
  }
  if (invisibles.length) {
    return `tiene ${invisibles.length} carácter(es) invisible(s): ${invisibles.join(", ")}. Bórrala y escríbela a mano`;
  }

  if (/\s/.test(cruda.trim())) return "tiene un espacio en medio";
  if (/^["'`]/.test(cruda.trim())) return "empieza por una comilla";
  if (!/^https?:\/\//i.test(cruda.trim())) return "no empieza por https://";

  try {
    const u = new URL(cruda.trim());
    if (!u.hostname.includes(".")) return "el dominio no tiene ningún punto: no parece una dirección";
    const malos = [...u.hostname].filter((ch) => !/[a-z0-9.-]/i.test(ch));
    if (malos.length) {
      return `el dominio lleva caracteres que no puede llevar: ${[...new Set(malos)].join(" ")}`;
    }
    if (/^-|-$|\.-|-\./.test(u.hostname)) return "el dominio tiene un guion mal puesto";
    return "el dominio no tiene una forma válida";
  } catch {
    return "no se puede interpretar como una dirección web";
  }
}

export const SUPABASE_URL = limpiarUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** El sitio con el que se intenta hablar. Para poder decirlo en pantalla
 *  cuando no se llega: va dentro del código que se descarga el
 *  navegador, así que no revela nada que no estuviera ya a la vista. */
export const SUPABASE_HOST = (() => {
  try {
    return SUPABASE_URL ? new URL(SUPABASE_URL).host : "";
  } catch {
    return "";
  }
})();


export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/* Sin variables configuradas la app sigue funcionando en modo demo, con
   los datos de ejemplo. Así el despliegue nunca se queda en blanco por
   una variable que falta. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const RUTAS_PRIVADAS = [
  "/chat",
  "/mentes",
  "/coworks",
  "/codigo",
  "/conectores",
  "/ajustes",
  "/bienvenida",
];

export const esRutaPrivada = (path: string) =>
  RUTAS_PRIVADAS.some((r) => path === r || path.startsWith(`${r}/`));

/* Entrar con Google exige darlo de alta en Google Cloud y activarlo en
   Supabase. Mientras no esté hecho, Supabase responde
   "provider is not enabled" y el usuario se come un error en crudo.
   Un botón que siempre falla es peor que no tenerlo, así que solo
   aparece cuando se enciende a propósito con esta variable. */
export const LOGIN_GOOGLE =
  (process.env.NEXT_PUBLIC_LOGIN_GOOGLE ?? "").trim() === "1";
