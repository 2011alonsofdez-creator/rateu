import { clienteServidor } from "@/lib/supabase/server";
import { revisarSalud } from "@/lib/coworks/salud";
import { DE_DONDE, SUPABASE_HOST, hasSupabase } from "@/lib/supabase/config";
import { mirarCerebros } from "@/lib/ia/cerebros";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

/* LA REVISIÓN, EN UN BOTÓN.
 *
 * Esto existe por una frase: «me dices abre API estado, ¿que lo abra
 * dónde? Lo he buscado en el buscador y no sale nada».
 *
 * Y tenía toda la razón. /api/estado es una dirección que hay que
 * escribir a mano en la barra del navegador, y devuelve un JSON de cien
 * líneas que hay que saber leer. Eso no es un diagnóstico: es un examen.
 *
 * Aquí se mira lo mismo que mira el vigilante, con TU sesión —así que no
 * hace falta ninguna llave de servidor— y se devuelve ya escrito en
 * castellano, con el arreglo de cada cosa al lado. La pantalla que lo
 * enseña está en /revision, que se llega pulsando.
 *
 * Y no devuelve ninguna clave. Solo si están puestas o no.
 */

/* QUÉ VARIABLES HAY PUESTAS DE VERDAD.
 *
 * Esto existe por un caso que no se puede resolver de ninguna otra
 * forma: la variable está puesta, se ve en el panel, y la web sigue sin
 * encontrarla. Desde fuera solo se puede adivinar, y adivinar con una
 * persona al otro lado es hacerle perder la tarde.
 *
 * Así que se le pregunta al servidor qué nombres le han llegado de
 * verdad. Si sale uno que no es el que toca —una letra cambiada, un
 * nombre parecido— se ve en un segundo.
 *
 * SALEN LOS NOMBRES Y QUÉ PINTA TIENE EL CONTENIDO. NUNCA EL CONTENIDO.
 * Una clave no sale de aquí ni troceada ni medida: de las que parecen
 * clave no se dice ni la longitud, porque esta página se puede abrir sin
 * sesión (tiene que poder, si no no serviría el día que no puedes
 * entrar).
 *
 * Y solo mira las de Supabase, incluidas las mal escritas: por eso el
 * filtro es tan ancho, porque lo que se busca es precisamente un nombre
 * que no es el correcto.
 */
function variablesDeSupabase() {
  return Object.keys(process.env)
    .filter((n) => /su[pb]+[ae]r?ba[sz]e/i.test(n))
    .sort()
    .map((nombre) => {
      const valor = (process.env[nombre] ?? "").trim();

      if (!valor) return { nombre, pinta: "VACÍA" };
      if (/^(eyj|sb_|sbp_|sbs_)/i.test(valor)) return { nombre, pinta: "una clave" };
      if (/supabase\.(co|in)/i.test(valor)) return { nombre, pinta: "una dirección" };

      /* Ni clave ni dirección: no se dice NADA de lo que hay dentro, ni
         siquiera cuánto mide.
 
         Se decía el tamaño, con el argumento de que distinguía "me he
         dejado media pegada" de "he pegado otra cosa". Pero "no empieza
         como una clave conocida" no significa que no sea un secreto:
         SUPABASE_DB_PASSWORD entra por este mismo filtro —lleva
         "supabase" en el nombre— y su longitud acabaría publicada en una
         página que se abre sin sesión. Saber que hay algo raro puesto ya
         basta para ir a mirarlo. */
      return { nombre, pinta: "otra cosa (ni dirección ni clave conocida)" };
    });
}

export async function GET() {
  /* Aquí no se exige sesión, y es a propósito: el momento en que esto
     hace más falta es cuando NO se puede iniciar sesión. Sin cliente se
     mira lo que no necesita base de datos, que es donde está el fallo
     precisamente cuando no hay base de datos. */
  const supabase = await clienteServidor().catch(() => null);

  let perfil: string | null = null;
  /* El modo de edad, que decide algo que no se ve por ningún lado: con
     él sin fijar, Kairo descarta todos los modelos que no son de Gemini.
     Es decir, se puede pagar una clave de Claude, ponerla bien, y que no
     se use nunca sin que nada lo diga. */
  let modoEdad: string | null = null;

  if (supabase) {
    const { data } = await supabase
      .from("perfiles")
      .select("id, modo_edad")
      .limit(1)
      .maybeSingle<{ id: string; modo_edad: string | null }>();
    perfil = data?.id ?? null;
    modoEdad = data?.modo_edad ?? null;
  }

  try {
    const revision = await revisarSalud(supabase as never, perfil, {});

    return Response.json(
      {
        gravedad: revision.gravedad,
        puntos: revision.puntos,
        texto: revision.texto,
        arreglado: revision.arreglado,
        // Para el botón de copiar: lo que hace falta para ayudar de lejos.
        demo: !hasSupabase,
        dominio: SUPABASE_HOST || null,
        con_sesion: Boolean(perfil),
        modo_edad: modoEdad,
        /* Los nombres con los que han llegado las variables, para poder
           ver de un vistazo si alguna está escrita de otra forma. */
        variables: variablesDeSupabase(),
        /* Qué cerebros hay puestos y con qué modelo. De las claves solo
           si están; del nombre del modelo sí el valor, porque el fallo
           que hay que cazar es precisamente ese y sin verlo escrito no
           se caza. Lo que no tenga pinta de nombre de modelo no sale:
           ver cerebros.ts. */
        cerebros: mirarCerebros(),
        de_donde: DE_DONDE,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
        cuando: new Date().toISOString(),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    console.error("[kairo] revisión:", e instanceof Error ? e.message : e);
    return Response.json({ error: "no_se_ha_podido" }, { status: 500 });
  }
}
