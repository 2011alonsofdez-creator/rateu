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
    .replace(/\s+/g, "")
    .replace(/[;,]+$/, "")
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
