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
  /* Los espacios se van TODOS, no solo los de los extremos: al copiar y
     pegar en el panel de Vercel se cuela alguno en medio, y una
     dirección con un espacio dentro no existe —el navegador ni lo
     intenta—. Y de paso el punto y coma y la coma, que se pegan cuando
     copias la variable con su nombre delante. */
  let texto = (valor ?? "")
    /* Primero, lo que NO SE VE.
       Un copiar y pegar desde una página web se trae de regalo espacios
       de ancho cero, guiones blandos y marcas de orden de bytes. No
       ocupan nada en pantalla, no son espacios para `trim()`, y sin
       embargo convierten un dominio perfecto en uno que no existe. Esto
       es exactamente lo que pasó aquí: 41 caracteres donde debía haber
       40, sin un solo espacio a la vista. */
    .replace(/[\u200B-\u200F\u2028\u2029\u2060\uFEFF\u00AD]/g, "")
    // Comillas y paréntesis angulares de haberla copiado de un ejemplo.
    .replace(/^[\s"'`<(]+/, "")
    .replace(/[\s"'`>)]+$/, "")
    .replace(/\s+/g, "")
    .replace(/[;,]+$/, "")
    // Un punto final: legal en un dominio, pero nadie lo quiere ahí.
    .replace(/\.+$/, "")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
  if (!texto) return "";
  // Copiada a mano es fácil que venga sin el https:// delante.
  if (!/^https?:\/\//i.test(texto)) texto = `https://${texto}`;
  try {
    const u = new URL(texto);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";

    /* Y tiene que parecer una dirección de verdad.
       Quitando los espacios, una frase cualquiera ("pon aquí tu url") se
       convierte en algo que el navegador acepta como dominio, y entonces
       la app cree que está configurada y se pasa la vida sin poder
       conectar. Un dominio lleva un punto; en tu ordenador, no. */
    const enCasaLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname);
    if (!enCasaLocal && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(u.hostname)) {
      return "";
    }

    /* Y http:// se sube a https://, salvo en tu propio ordenador.
       Esto no es manía: la web va por https, y un navegador NO deja que
       una página https pida nada por http. Lo bloquea sin preguntar, y
       lo que se ve es "no se ha podido conectar con el servidor",
       exactamente igual que si el servidor estuviera caído. Una letra de
       más en una variable, y a buscar el fallo donde no está. */
    if (u.protocol === "http:" && !enCasaLocal) {
      u.protocol = "https:";
      return u.toString().replace(/\/+$/, "");
    }

    return texto;
  } catch {
    // Una URL inválida deja la app en modo demo, que es feo pero se ve.
    return "";
  }
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
