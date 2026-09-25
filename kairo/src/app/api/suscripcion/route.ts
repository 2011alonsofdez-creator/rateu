import { clienteServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* La suscripción de quien pregunta. La seguridad a nivel de fila ya
   devuelve solo la tuya, así que no hace falta filtrar por nadie.
   Solo la pide la página de ajustes, para no cargar una consulta más en
   todas las demás. */
export async function GET() {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ suscripcion: null });

  const { data } = await supabase
    .from("suscripciones")
    .select("plan, estado, renueva_el, termina_el, portal")
    .order("actualizada_el", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Response.json(
    { suscripcion: data ?? null },
    { headers: { "cache-control": "no-store" } },
  );
}
