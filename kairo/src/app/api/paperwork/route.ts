import { clienteServidor } from "@/lib/supabase/server";
import { mirarPapel } from "@/lib/ia/papeles";
import { revisarAdjuntos } from "@/lib/ia/adjuntos";
import { CREDITOS } from "@/lib/ia/config";
import { faltaColumna } from "@/lib/supabase/compat";

export const runtime = "nodejs";
export const maxDuration = 60;
export const preferredRegion = "fra1";

/* Paperwork: la bandeja de los papeles.
 *
 * GET    → los tuyos, lo que caduca antes primero
 * POST   → {adjuntos, nota} : lo mira, lo guarda y lo devuelve
 * PATCH  → {id, estado} : marcarlo como hecho
 * DELETE ?id= → borrarlo
 */

const COLUMNAS =
  "id, titulo, remitente, de_que_va, que_quieren, importe, fecha_limite, consecuencias, pasos, borrador, archivo, estado, creada_el";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fallo = (estado: number, motivo: string) =>
  new Response(JSON.stringify({ error: motivo }), {
    status: estado,
    headers: { "content-type": "application/json" },
  });

export async function GET() {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ papeles: [] });

  /* Lo que vence antes, arriba. Los que no tienen fecha van al final:
     no es que no importen, es que no corren. */
  const { data, error } = await supabase
    .from("papeles")
    .select(COLUMNAS)
    .order("fecha_limite", { ascending: true, nullsFirst: false })
    .order("creada_el", { ascending: false })
    .limit(200);

  if (error) return Response.json({ papeles: [], falta: faltaColumna(error) });

  return Response.json({ papeles: data ?? [] }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const nota = typeof cuerpo?.nota === "string" ? cuerpo.nota : "";

  /* Los archivos pasan por la misma revisión que los del chat: tipo,
     tamaño, base64 de verdad. Aquí solo valen imágenes y PDF: un .txt
     no es el papel que te ha llegado a casa. */
  const archivos = revisarAdjuntos(cuerpo?.adjuntos);
  if (!archivos.adjuntos.length) return fallo(400, "sin_archivo");

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
    resultado = await mirarPapel(archivos.adjuntos, nota, perfil.modo_edad);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error("[kairo] paperwork:", mensaje);
    if (mensaje === "sin_clave") return fallo(503, "sin_clave");
    return fallo(502, "no_se_ha_podido");
  }

  const { error: errorCobro } = await supabase.rpc("gastar_creditos", {
    p_cantidad: coste,
    p_motivo: "paperwork",
  });
  if (errorCobro) return fallo(402, "sin_creditos");

  const p = resultado.papel;
  const { data, error } = await supabase
    .from("papeles")
    .insert({
      perfil_id: perfil.id,
      titulo: p.titulo,
      remitente: p.remitente,
      de_que_va: p.deQueVa,
      que_quieren: p.queQuieren,
      importe: p.importe,
      // La columna es de tipo fecha: o una fecha de verdad, o nada.
      fecha_limite: p.fechaLimite || null,
      consecuencias: p.consecuencias,
      pasos: p.pasos,
      borrador: p.borrador,
      archivo: archivos.nombres.join(", ").slice(0, 300),
    })
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    console.error("[kairo] no se guardó el papel:", error.message);
    return Response.json({
      papel: {
        id: "",
        titulo: p.titulo,
        remitente: p.remitente,
        de_que_va: p.deQueVa,
        que_quieren: p.queQuieren,
        importe: p.importe,
        fecha_limite: p.fechaLimite || null,
        consecuencias: p.consecuencias,
        pasos: p.pasos,
        borrador: p.borrador,
        archivo: archivos.nombres.join(", "),
        estado: "pendiente",
        creada_el: new Date().toISOString(),
      },
      guardado: false,
    });
  }

  return Response.json({ papel: data, guardado: true });
}

export async function PATCH(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  const id = typeof cuerpo?.id === "string" ? cuerpo.id : "";
  const estado = cuerpo?.estado === "hecho" ? "hecho" : "pendiente";

  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const { error } = await supabase.from("papeles").update({ estado }).eq("id", id);
  if (error) return fallo(500, "no_se_ha_podido");

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const { error } = await supabase.from("papeles").delete().eq("id", id);
  if (error) return fallo(500, "no_se_ha_podido");

  return Response.json({ ok: true });
}
