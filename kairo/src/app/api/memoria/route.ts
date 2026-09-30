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

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!perfil) return fallo(401, "sin_sesion");

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
      perfil_id: perfil.id,
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
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id")
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (!perfil) return fallo(401, "sin_sesion");

    const { error } = await supabase.from("recuerdos").delete().eq("perfil_id", perfil.id);
    if (error) return fallo(500, "no_se_ha_podido");
    return Response.json({ ok: true });
  }

  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const { error } = await supabase.from("recuerdos").delete().eq("id", id);
  if (error) return fallo(500, "no_se_ha_podido");

  return Response.json({ ok: true });
}
