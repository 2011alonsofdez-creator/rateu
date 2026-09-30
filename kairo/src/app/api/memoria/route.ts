import { clienteServidor } from "@/lib/supabase/server";
import { faltaColumna } from "@/lib/supabase/compat";
import { limpiarRecuerdo, mismoRecuerdo } from "@/lib/memoria";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

/* Tu memoria.
 *
 * GET    → todo lo que Kairo sabe de ti
 * POST   → añade uno   {texto}
 * PATCH  → corrige uno {id, texto}
 * DELETE ?id= → lo olvida
 *
 * Ninguna consulta filtra por usuario y no hace falta: la seguridad a
 * nivel de fila solo deja ver y tocar lo tuyo. Lo que sí se mira aquí es
 * lo que ENTRA, porque el cuerpo de una petición lo escribe quien quiere.
 *
 * Y todo esto existe por una razón que va antes que la técnica: una
 * memoria que no se puede leer entera, corregir y borrar no es una
 * memoria, es una ficha que alguien tiene sobre ti.
 */

const COLUMNAS = "id, texto, origen, creado_el";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fallo = (estado: number, motivo: string) =>
  Response.json({ error: motivo }, { status: estado });

/** TU perfil, no uno cualquiera de los que puedes ver.
 *
 *  `perfiles` deja ver también los perfiles hijo que uno tenga a cargo,
 *  así que un `limit(1)` sin orden puede devolver el del hijo. Se lo
 *  pregunta a la base de datos, que lo saca del token y no se equivoca.
 *  Si esa función no estuviera, se cae al camino de antes en vez de
 *  dejar de funcionar. */
async function miPerfil(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteServidor>>>,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("mi_perfil_id");
  if (!error && data) return String(data);

  const { data: fila } = await supabase
    .from("perfiles")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  return fila?.id ?? null;
}

export async function GET() {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ recuerdos: [] });

  const { data, error } = await supabase
    .from("recuerdos")
    .select(COLUMNAS)
    .order("creado_el", { ascending: false })
    .limit(200);

  // Sin la migración 0012 la tabla no existe. No es un error rojo: es
  // que esto todavía no está montado en tu base de datos.
  if (error) return Response.json({ recuerdos: [], falta: faltaColumna(error) });

  return Response.json(
    { recuerdos: data ?? [] },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const texto = limpiarRecuerdo(typeof cuerpo?.texto === "string" ? cuerpo.texto : "");
  if (!texto) return fallo(400, "sin_texto");

  const mio = await miPerfil(supabase);
  if (!mio) return fallo(401, "sin_sesion");

  /* Ya lo sabía. No es un error: es que lo has dicho dos veces, y
     guardarlo otra vez sería tener el mismo dato dos veces ocupando dos
     huecos y contando doble en el tope. */
  const { data: previos } = await supabase.from("recuerdos").select("id, texto").limit(200);
  const repetido = ((previos ?? []) as { id: string; texto: string }[]).find((r) =>
    mismoRecuerdo(r.texto, texto),
  );
  if (repetido) return Response.json({ recuerdo: repetido, repetido: true });

  const { data, error } = await supabase
    .from("recuerdos")
    .insert({
      perfil_id: mio,
      texto,
      origen: cuerpo?.origen === "chat" ? "chat" : "mano",
    })
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    if (faltaColumna(error)) return fallo(503, "falta_migracion");
    // El tope de 200 llega como P0001 con su mensaje ya escrito.
    if (error.code === "P0001") return fallo(409, "demasiados");
    console.error("[kairo] no se pudo guardar el recuerdo:", error.message);
    return fallo(500, "no_se_ha_podido");
  }

  return Response.json({ recuerdo: data });
}

export async function PATCH(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const id = typeof cuerpo?.id === "string" ? cuerpo.id : "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const texto = limpiarRecuerdo(typeof cuerpo?.texto === "string" ? cuerpo.texto : "");
  if (!texto) return fallo(400, "sin_texto");

  /* Solo el texto. `perfil_id` no está en esta lista y tampoco en los
     permisos de la tabla: un recuerdo no se puede mover a la cuenta de
     otro ni queriendo. */
  const { data, error } = await supabase
    .from("recuerdos")
    .update({ texto })
    .eq("id", id)
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    console.error("[kairo] no se pudo corregir el recuerdo:", error.message);
    return fallo(500, "no_se_ha_podido");
  }
  if (!data) return fallo(404, "no_encontrado");

  return Response.json({ recuerdo: data });
}

export async function DELETE(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";

  /* Borrarlo todo de una vez. Tiene que ser fácil: si irse cuesta más
     que entrar, la memoria deja de ser tuya. */
  if (url.searchParams.get("todo") === "1") {
    /* Sin preguntar quién eres, y es más seguro así: la seguridad a
       nivel de fila ya solo deja borrar lo tuyo, mientras que averiguar
       el perfil con un `limit(1)` sin orden podía devolver el de un
       perfil hijo a cargo —`perfiles` deja verlos— y entonces el borrado
       filtraba por una cuenta que no es la tuya: cero filas borradas,
       ningún error, y la pantalla diciendo que ya no queda nada. */
    const { error } = await supabase
      .from("recuerdos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) return fallo(500, "no_se_ha_podido");
    return Response.json({ ok: true });
  }

  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const { error } = await supabase.from("recuerdos").delete().eq("id", id);
  if (error) return fallo(500, "no_se_ha_podido");

  return Response.json({ ok: true });
}
