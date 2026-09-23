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
function limpiarUrl(valor: string | undefined): string {
  let texto = (valor ?? "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  if (!texto) return "";
  // Copiada a mano es fácil que venga sin el https:// delante.
  if (!/^https?:\/\//i.test(texto)) texto = `https://${texto}`;
  try {
    const u = new URL(texto);
    return u.protocol === "https:" || u.protocol === "http:" ? texto : "";
  } catch {
    // Una URL inválida deja la app en modo demo, que es feo pero se ve.
    return "";
  }
}

export const SUPABASE_URL = limpiarUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
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
