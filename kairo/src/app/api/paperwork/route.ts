import { clienteServidor } from "@/lib/supabase/server";
import { miPerfil } from "@/lib/supabase/mi-perfil";
import { mirarPapel } from "@/lib/ia/papeles";
import { revisarAdjuntos } from "@/lib/ia/adjuntos";
import { CREDITOS } from "@/lib/ia/config";
import { faltaColumna } from "@/lib/supabase/compat";
import { clasificarError } from "@/lib/ia/errores";
import { limpiarFallo } from "@/lib/ia/fallos";

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

  const { perfil } = await miPerfil<{
    id: string;
    modo_edad: "nino" | "adolescente" | "adulto" | null;
    creditos: number;
    creditos_extra: number;
  }>(supabase, "id, modo_edad, creditos, creditos_extra");

  if (!perfil) return fallo(401, "sin_sesion");

  const coste = CREDITOS.normal;
  if (perfil.creditos + perfil.creditos_extra < coste) return fallo(402, "sin_creditos");

  let resultado;
  try {
    resultado = await mirarPapel(archivos.adjuntos, nota, perfil.modo_edad);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    /* Tachando antes lo que tenga pinta de clave: un "API key not valid:
       AIza…" deja la clave entera escrita en el registro del servidor, y
       ese registro lo lee cualquiera que entre al panel. */
    console.error("[kairo] paperwork:", limpiarFallo(e));
    if (mensaje === "sin_clave") return fallo(503, "sin_clave");

    /* POR QUÉ NO HA PODIDO, QUE NO ES LO MISMO.
 
       Todo acababa en el mismo cartel: «prueba con una foto más
       nítida». Y eso es MENTIR cuando la foto está perfecta y lo que
       pasa es que la cuota gratuita se ha agotado, que es el caso más
       frecuente con diferencia. Quien lo lee se pone a repetir la foto
       con mejor luz, que es lo único que seguro no lo arregla.
 
       Es lo mismo que ya se hizo en Gist, y por el mismo motivo. */
    const motivo = clasificarError(e);
    if (motivo === "clave_invalida") return fallo(503, "sin_clave");
    if (motivo === "cuota_minuto") return fallo(429, "cuota_minuto");
    if (motivo === "cuota_dia" || motivo === "cuota_agotada") return fallo(429, "cuota_dia");
    if (motivo === "sobrecargado") return fallo(503, "sobrecargado");
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
