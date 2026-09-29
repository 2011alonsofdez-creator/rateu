import { clienteServidor } from "@/lib/supabase/server";
import { revisarSalud } from "@/lib/coworks/salud";
import { SUPABASE_HOST, hasSupabase } from "@/lib/supabase/config";

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

export async function GET() {
  /* Aquí no se exige sesión, y es a propósito: el momento en que esto
     hace más falta es cuando NO se puede iniciar sesión. Sin cliente se
     mira lo que no necesita base de datos, que es donde está el fallo
     precisamente cuando no hay base de datos. */
  const supabase = await clienteServidor().catch(() => null);

  let perfil: string | null = null;
  if (supabase) {
    const { data } = await supabase
      .from("perfiles")
      .select("id")
      .limit(1)
      .maybeSingle<{ id: string }>();
    perfil = data?.id ?? null;
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
