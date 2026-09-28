import { clienteServidor } from "@/lib/supabase/server";
import { clienteAdmin } from "@/lib/supabase/admin";
import { faltaColumna } from "@/lib/supabase/compat";
import { CREDITOS } from "@/lib/ia/config";
import { redactarBrief, tituloDelBrief } from "@/lib/coworks/brief";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

/* "Probar ahora".
 *
 * Un encargo que se ejecuta solo mañana a las siete es un acto de fe: no
 * sabes si funciona hasta que amanece, y si no funciona te enteras
 * tarde. Este botón lo hace delante de ti, con tu cuenta y tus
 * créditos.
 *
 * Y ocupa el hueco del día, igual que si lo hubiera hecho el reloj: un
 * resumen diario es uno al día. Si el de hoy salió mal, este botón lo
 * reintenta; si salió bien, te lo enseña en vez de cobrarte otra vez.
 *
 * Quién es el dueño lo decide la base de datos, no esta ruta: el Co-Work
 * se busca con TU sesión, así que si no es tuyo, sencillamente no
 * aparece.
 */

const COSTE = CREDITOS.normal;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fallo = (estado: number, motivo: string, pista?: string) =>
  Response.json(pista ? { error: motivo, pista } : { error: motivo }, { status: estado });

type Cowork = {
  id: string;
  perfil_id: string;
  nombre: string;
  temas: string;
  zona: string;
};

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const id = typeof cuerpo?.id === "string" ? cuerpo.id : "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  // Con tu sesión: si el Co-Work no es tuyo, esto no devuelve nada.
  const { data: cowork, error } = await supabase
    .from("coworks")
    .select("id, perfil_id, nombre, temas, zona")
    .eq("id", id)
    .maybeSingle<Cowork>();

  if (error && faltaColumna(error)) return fallo(503, "falta_migracion");
  if (!cowork) return fallo(404, "no_encontrado");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, modo_edad, tono, creditos, creditos_extra")
    .limit(1)
    .maybeSingle<{
      id: string;
      nombre: string | null;
      modo_edad: ModoEdad | null;
      tono: string | null;
      creditos: number;
      creditos_extra: number;
    }>();

  if (!perfil) return fallo(401, "sin_sesion");
  if (perfil.creditos + perfil.creditos_extra < COSTE) return fallo(402, "sin_creditos");

  /* El reparto y la reserva son del servidor: llevan la misma llave que
     usa el reloj. Sin ella no se puede reservar el día, y sin reservar
     el día esto podría duplicar el trabajo. */
  const admin = clienteAdmin();
  if (!admin) {
    return fallo(503, "sin_clave", "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel");
  }

  // El día, en TU zona. Que lo calcule la base de datos, que es quien
  // luego compara: así no hay dos "hoy" distintos.
  const { data: diaHoy } = await admin.rpc("hora_local", { p_zona: cowork.zona });
  const dia = String(diaHoy ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);

  let reserva = await reservar(admin, cowork.id, dia);

  if (!reserva) {
    // Ya hay algo de hoy: o se está haciendo, o salió bien, o salió mal.
    const { data: deHoy } = await supabase
      .from("cowork_resultados")
      .select("id, dia, estado, contenido, fuentes, modelo, conversacion_id")
      .eq("cowork_id", cowork.id)
      .eq("dia", dia)
      .maybeSingle<{
        id: string;
        dia: string;
        estado: string;
        contenido: string;
        fuentes: Fuente[] | null;
        modelo: string | null;
        conversacion_id: string | null;
      }>();

    if (deHoy?.estado === "ejecutando") return Response.json({ en_marcha: true });
    if (deHoy?.estado === "ok") return Response.json({ ya_hecho: true, resultado: deHoy });

    /* Salió mal (o sin créditos): se borra y se reintenta. Borrar es
       cosa tuya —es tu fila— y por eso va con tu sesión. */
    if (deHoy?.id) await supabase.from("cowork_resultados").delete().eq("id", deHoy.id);
    reserva = await reservar(admin, cowork.id, dia);
    if (!reserva) return Response.json({ en_marcha: true });
  }

  try {
    const brief = await redactarBrief({
      temas: cowork.temas,
      duenio: perfil.nombre ?? undefined,
      modoEdad: perfil.modo_edad,
      tono: perfil.tono ?? "cercano",
      zona: cowork.zona,
    });

    if (!brief) {
      await admin.rpc("terminar_cowork", {
        p_resultado: reserva,
        p_estado: "error",
        p_contenido: "No he podido comprobar las novedades ahora mismo.",
      });
      return fallo(502, "no_se_ha_podido");
    }

    /* Se cobra al final y con TU sesión: esto lo has pedido tú, así que
       el apunte del historial lleva tu nombre y no el del reloj. */
    const { error: errorCobro } = await supabase.rpc("gastar_creditos", {
      p_cantidad: COSTE,
      p_motivo: `Co-Work: ${cowork.nombre || "Daily Brief"}`,
    });

    if (errorCobro) {
      await admin.rpc("terminar_cowork", {
        p_resultado: reserva,
        p_estado: "sin_creditos",
        p_contenido: "No había créditos suficientes.",
      });
      return fallo(402, "sin_creditos");
    }

    const conversacion = await dejarConversacion(supabase, cowork, perfil.id, brief);

    await admin.rpc("terminar_cowork", {
      p_resultado: reserva,
      p_estado: "ok",
      p_contenido: brief.texto,
      p_fuentes: brief.fuentes.length ? brief.fuentes : null,
      p_modelo: brief.modelo,
      p_conversacion: conversacion,
    });

    return Response.json({
      ok: true,
      resultado: {
        /* El día va en la respuesta a propósito: es el de la zona del
           Co-Work, y el navegador no lo puede calcular sin equivocarse
           (en Auckland a las diez de la mañana, para UTC es ayer). */
        dia,
        estado: "ok",
        contenido: brief.texto,
        fuentes: brief.fuentes,
        modelo: brief.modelo,
        conversacion_id: conversacion,
      },
    });
  } catch (e) {
    console.error("[kairo] probar Co-Work:", e instanceof Error ? e.message : e);
    await admin
      .rpc("terminar_cowork", {
        p_resultado: reserva,
        p_estado: "error",
        p_contenido: "Algo ha fallado al prepararlo.",
      })
      .then(() => {}, () => {});
    return fallo(502, "no_se_ha_podido");
  }
}

async function reservar(
  admin: NonNullable<ReturnType<typeof clienteAdmin>>,
  cowork: string,
  dia: string,
): Promise<string | null> {
  const { data } = await admin.rpc("reservar_cowork", { p_cowork: cowork, p_dia: dia });
  return data ? String(data) : null;
}

/** La misma conversación que deja el reloj, para que las dos se lean igual. */
async function dejarConversacion(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteServidor>>>,
  cowork: Cowork,
  perfilId: string,
  brief: { texto: string; fuentes: Fuente[]; busquedas: string[]; modelo: string },
): Promise<string | null> {
  try {
    const { data: conv } = await supabase
      .from("conversaciones")
      .insert({
        perfil_id: perfilId,
        titulo: tituloDelBrief(cowork.nombre, new Date(), cowork.zona),
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (!conv?.id) return null;

    const pregunta = {
      conversacion_id: conv.id,
      rol: "user",
      contenido: `Novedades de hoy sobre: ${cowork.temas}`,
    };
    const respuesta: Record<string, unknown> = {
      conversacion_id: conv.id,
      rol: "kairo",
      contenido: brief.texto,
      modelo_usado: brief.modelo,
      nivel: "normal",
      creditos_gastados: COSTE,
    };
    const conFuentes = brief.fuentes.length
      ? { ...respuesta, fuentes: brief.fuentes, busquedas: brief.busquedas }
      : respuesta;

    let { error } = await supabase.from("mensajes").insert([pregunta, conFuentes]);
    if (error && faltaColumna(error)) {
      ({ error } = await supabase.from("mensajes").insert([pregunta, respuesta]));
    }

    /* Lo mismo que en el reloj: una conversación sin mensajes no se
       ofrece. El botón del chat llevaría a una pantalla en blanco. */
    if (error) {
      console.error("[kairo] no se guardó la conversación del Co-Work:", error.message);
      return null;
    }

    return conv.id;
  } catch {
    return null;
  }
}
