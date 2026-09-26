import { clienteServidor } from "@/lib/supabase/server";
import { resumir, tipoDeUrl, type Ficha } from "@/lib/ia/gist";
import { CREDITOS } from "@/lib/ia/config";
import { faltaColumna } from "@/lib/supabase/compat";

export const runtime = "nodejs";
/* Ver un vídeo entero lleva su tiempo. Es el techo de Vercel, y aun así
   un vídeo muy largo puede no llegar: eso se le dice al usuario. */
export const maxDuration = 60;
export const preferredRegion = "fra1";

/* Gist: la ficha de un enlace.
 *
 * GET  → tus fichas, la última primero
 * POST → {url} : la mira, la guarda y la devuelve
 * DELETE ?id=  → borra una
 *
 * Ninguna consulta filtra por usuario y no hace falta: la seguridad a
 * nivel de fila solo deja ver y tocar lo tuyo.
 */

const COLUMNAS = "id, tipo, url, titulo, autor, resumen, puntos, fuentes, modelo, creada_el";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fallo = (estado: number, motivo: string) =>
  new Response(JSON.stringify({ error: motivo }), {
    status: estado,
    headers: { "content-type": "application/json" },
  });

export async function GET() {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ fichas: [] });

  const { data, error } = await supabase
    .from("fichas")
    .select(COLUMNAS)
    .order("creada_el", { ascending: false })
    .limit(120);

  // Sin la migración 0008 la tabla no existe: no es un fallo que
  // haya que enseñar en rojo, es que esto todavía no está montado.
  if (error) {
    return Response.json({ fichas: [], falta: faltaColumna(error) });
  }

  return Response.json({ fichas: data ?? [] }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const url = typeof cuerpo?.url === "string" ? cuerpo.url.trim() : "";

  const tipo = tipoDeUrl(url);
  if (!tipo) return fallo(400, "enlace_no_valido");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, modo_edad, creditos, creditos_extra")
    .limit(1)
    .maybeSingle<{
      id: string;
      modo_edad: "nino" | "adolescente" | "adulto" | null;
      creditos: number;
      creditos_extra: number;
    }>();

  if (!perfil) return fallo(401, "sin_sesion");

  const coste = CREDITOS.normal;
  if (perfil.creditos + perfil.creditos_extra < coste) return fallo(402, "sin_creditos");

  let resultado;
  try {
    resultado = await resumir(url, tipo, perfil.modo_edad);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error("[kairo] gist:", mensaje);
    if (mensaje === "sin_clave") return fallo(503, "sin_clave");
    return fallo(502, "no_se_ha_podido");
  }

  /* Se cobra DESPUÉS de tener la ficha: si el vídeo es privado, si la
     página no se deja leer o si el modelo falla, no se paga nada. */
  const { error: errorCobro } = await supabase.rpc("gastar_creditos", {
    p_cantidad: coste,
    p_motivo: `gist ${tipo}`,
  });
  if (errorCobro) return fallo(402, "sin_creditos");

  const f: Ficha = resultado.ficha;
  const { data, error } = await supabase
    .from("fichas")
    .insert({
      perfil_id: perfil.id,
      tipo: f.tipo,
      url: f.url,
      titulo: f.titulo,
      autor: f.autor,
      resumen: f.resumen,
      puntos: f.puntos,
      fuentes: f.fuentes,
      modelo: resultado.modelo,
    })
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    console.error("[kairo] no se guardó la ficha:", error.message);
    // La ficha está hecha y pagada: se devuelve aunque no se guarde.
    return Response.json({ ficha: { ...f, id: "", creada_el: new Date().toISOString() }, guardada: false });
  }

  return Response.json({ ficha: data, guardada: true });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const { error } = await supabase.from("fichas").delete().eq("id", id);
  if (error) return fallo(500, "no_se_ha_podido");

  return Response.json({ ok: true });
}
