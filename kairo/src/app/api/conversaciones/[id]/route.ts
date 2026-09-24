import { leerConversacion } from "@/lib/conversaciones";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

/* Los mensajes de una conversación. Si no es tuya, la seguridad a nivel
   de fila no devuelve nada y esto responde 404: no hay diferencia entre
   "no existe" y "no es tuya", que es justo lo que queremos. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const datos = await leerConversacion(id);

  if (!datos) {
    return new Response(JSON.stringify({ error: "no_encontrada" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  return Response.json(datos, { headers: { "cache-control": "no-store" } });
}
