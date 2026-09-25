import { clienteServidor } from "@/lib/supabase/server";
import { PRODUCTOS, enlaceDe, type Producto } from "@/lib/pagos/config";

export const runtime = "nodejs";

/* El botón de "Subir de plan" pasa por aquí antes de ir a la tienda.
 *
 * El motivo es que la página de precios es pública y no sabe quién eres,
 * pero el enlace de compra tiene que llevar tu identificador: es lo que
 * permite que, cuando el proveedor avise de que has pagado, sepamos a
 * quién darle el plan. Aquí sí hay sesión, así que se añade y se te
 * manda a la tienda de una.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pedido = url.searchParams.get("producto") ?? "";
  const producto = PRODUCTOS.includes(pedido as Producto) ? (pedido as Producto) : null;
  const enlace = producto ? enlaceDe(producto) : "";

  // Sin tienda montada, a precios, que al menos explica los planes.
  if (!enlace) return Response.redirect(new URL("/precios", url), 302);

  const supabase = await clienteServidor();
  if (!supabase) return Response.redirect(new URL("/registro", url), 302);

  // mi_perfil_id() y no "el primer perfil que vea": un adulto con hijos
  // a cargo ve más de uno, y el plan tiene que ir al suyo.
  const { data: perfilId } = await supabase.rpc("mi_perfil_id");
  if (!perfilId) return Response.redirect(new URL("/registro", url), 302);

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("email")
    .eq("id", perfilId)
    .maybeSingle<{ email: string | null }>();

  let destino: URL;
  try {
    destino = new URL(enlace);
  } catch {
    return Response.redirect(new URL("/precios", url), 302);
  }

  destino.searchParams.set("checkout[custom][perfil_id]", String(perfilId));
  if (perfil?.email) destino.searchParams.set("checkout[email]", perfil.email);

  return Response.redirect(destino, 302);
}
