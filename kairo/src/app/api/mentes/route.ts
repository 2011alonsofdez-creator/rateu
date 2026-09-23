import { listarMentes } from "@/lib/mentes";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

/* Las Mentes para el selector del chat. El desplegable las pide la
   primera vez que se abre, no al cargar la página: así abrir el chat
   sigue costando una sola consulta. */
export async function GET() {
  const mentes = await listarMentes();
  return Response.json({ mentes }, { headers: { "cache-control": "no-store" } });
}
