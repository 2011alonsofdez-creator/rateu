import { createHash } from "node:crypto";
import { clienteAdmin } from "@/lib/supabase/admin";
import { firmaValida } from "@/lib/pagos/firma";
import { queEs, secretoWebhook, traducirEstado } from "@/lib/pagos/config";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

/* Aquí llega el aviso del proveedor de pago cuando alguien compra,
 * renueva o cancela. Es la única puerta por la que entra dinero, así
 * que es la que más cuidado lleva.
 *
 * Orden, y ninguno es opcional:
 *   firma → ya atendido → de quién es → qué ha comprado → aplicarlo
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fecha = (v: unknown) => {
  const t = typeof v === "string" ? v.slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
};

/* Se responde 200 incluso a lo que no sabemos atender. Un 500 hace que
   el proveedor lo reintente durante horas, y si el problema es que no
   reconocemos el producto, reintentar no lo va a arreglar: solo llena
   los registros. Lo que sí hace falta es que quede escrito. */
const atendido = (texto: string) => new Response(texto, { status: 200 });

export async function POST(req: Request) {
  const secreto = secretoWebhook();
  if (!secreto) return new Response("pagos sin configurar", { status: 503 });

  /* El cuerpo, tal cual llegó. Nada de req.json() aquí: la firma se
     calcula sobre los bytes exactos, y volver a escribir el JSON cambia
     un espacio y ya no cuadra. */
  const crudo = await req.text();

  if (!firmaValida(crudo, req.headers.get("x-signature"), secreto)) {
    console.error("[kairo] aviso de pago con firma que no cuadra: descartado");
    return new Response("firma no válida", { status: 401 });
  }

  const admin = clienteAdmin();
  if (!admin) {
    console.error("[kairo] falta SUPABASE_SERVICE_ROLE_KEY: no puedo aplicar el pago");
    return new Response("sin clave de administrador", { status: 503 });
  }

  let aviso: Record<string, unknown>;
  try {
    aviso = JSON.parse(crudo);
  } catch {
    return new Response("json no válido", { status: 400 });
  }

  const meta = (aviso.meta ?? {}) as Record<string, unknown>;
  const datos = (aviso.data ?? {}) as Record<string, unknown>;
  const attrs = (datos.attributes ?? {}) as Record<string, unknown>;
  const propio = (meta.custom_data ?? {}) as Record<string, unknown>;
  const evento = String(meta.event_name ?? "");

  /* Ya atendido, ¿o no?
     Se apunta ANTES de hacer nada, no después. Si algo falla a mitad, el
     reenvío no se atiende y hay que arreglarlo a mano; al revés, un
     reenvío tras un fallo tardío regalaría los créditos dos veces. De
     los dos errores posibles, se elige el que no cuesta dinero. */
  const huella = createHash("sha256").update(`${evento}:${crudo}`).digest("hex");
  const { data: primeraVez, error: errEvento } = await admin.rpc("registrar_evento_pago", {
    p_id: huella,
    p_tipo: evento,
  });

  if (errEvento) {
    console.error("[kairo] no se pudo registrar el aviso:", errEvento.message);
    return new Response("error", { status: 500 }); // este sí merece reintento
  }
  if (primeraVez === false) return atendido("ya atendido");

  // ---- ¿De quién es este pago? ----
  const perfilId = await buscarPerfil(admin, propio.perfil_id, attrs.user_email);
  if (!perfilId) {
    console.error(
      `[kairo] pago de ${String(attrs.user_email ?? "?")} sin perfil que lo reciba (${evento}).`,
    );
    return atendido("sin perfil");
  }

  // ---- ¿Qué ha comprado? ----
  const primerArticulo = (attrs.first_order_item ?? {}) as Record<string, unknown>;
  const que = queEs(attrs.variant_id ?? primerArticulo.variant_id);

  const suscripcionId = String(datos.id ?? attrs.order_id ?? huella.slice(0, 32));
  const urls = (attrs.urls ?? {}) as Record<string, unknown>;
  const portal =
    typeof urls.customer_portal === "string" ? urls.customer_portal : null;

  try {
    // ---- Packs de créditos: una compra suelta ----
    if (evento === "order_created") {
      if (!que?.creditos) return atendido("compra que no es un pack");

      await admin.rpc("anadir_creditos", {
        p_perfil: perfilId,
        p_cantidad: que.creditos,
        p_motivo: `pack de ${que.creditos} créditos`,
      });
      return atendido("créditos añadidos");
    }

    // ---- Se ha cobrado una mensualidad: se reponen los créditos ----
    if (evento === "subscription_payment_success") {
      if (!que?.plan) return atendido("cobro de un producto desconocido");

      await admin.rpc("recargar_plan", { p_perfil: perfilId, p_plan: que.plan });
      return atendido("créditos del mes repuestos");
    }

    // ---- Alta, cambio, pausa, cancelación o fin ----
    if (evento.startsWith("subscription_")) {
      const estado = traducirEstado(attrs.status as string);
      if (!que?.plan || !estado) return atendido("suscripción que no reconozco");

      await admin.rpc("aplicar_suscripcion", {
        p_perfil: perfilId,
        p_proveedor_id: suscripcionId,
        p_plan: que.plan,
        p_estado: estado,
        p_renueva: fecha(attrs.renews_at),
        p_termina: fecha(attrs.ends_at),
        p_portal: portal,
      });
      return atendido(`suscripción ${estado}`);
    }

    return atendido("aviso que no me toca");
  } catch (e) {
    console.error("[kairo] fallo aplicando el pago:", e instanceof Error ? e.message : e);
    return new Response("error", { status: 500 });
  }
}

/* De quién es el pago. Primero por el identificador que metimos nosotros
   en el enlace de compra, que es el bueno; y si no viene, por el correo,
   que es lo único que queda cuando alguien compra desde otro sitio. */
async function buscarPerfil(
  admin: NonNullable<ReturnType<typeof clienteAdmin>>,
  perfilId: unknown,
  correo: unknown,
): Promise<string | null> {
  if (typeof perfilId === "string" && UUID.test(perfilId)) {
    const { data } = await admin
      .from("perfiles")
      .select("id")
      .eq("id", perfilId)
      .maybeSingle<{ id: string }>();
    if (data) return data.id;
  }

  if (typeof correo === "string" && correo.includes("@")) {
    const { data } = await admin
      .from("perfiles")
      .select("id")
      .ilike("email", correo.trim())
      .maybeSingle<{ id: string }>();
    if (data) return data.id;
  }

  return null;
}
