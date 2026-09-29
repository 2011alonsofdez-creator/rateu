import { clienteServidor } from "@/lib/supabase/server";
import { clienteAdmin } from "@/lib/supabase/admin";
import { faltaColumna, faltaFuncion } from "@/lib/supabase/compat";
import { CREDITOS } from "@/lib/ia/config";
import { redactarBrief, tituloDelBrief } from "@/lib/coworks/brief";
import { revisarSalud } from "@/lib/coworks/salud";
import { esGratis, recetaDe, type Tipo } from "@/lib/coworks/recetas";
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
 *
 * LO DE LA LLAVE. Este botón exigía SUPABASE_SERVICE_ROLE_KEY, y era una
 * tontería: la llave del servidor es para el reloj, que trabaja sin
 * nadie delante. Para probar un encargo TUYO, estando TÚ delante, sobra.
 * Desde la migración 0011 hay dos funciones gemelas que comprueban el
 * dueño ellas mismas, así que esto va con tu sesión y la llave solo hace
 * falta si esa migración todavía no está pegada.
 */

const COSTE = CREDITOS.normal;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cuántos resultados anteriores se le enseñan al que escribe, para que
 *  el repaso de hoy no sea el de ayer otra vez. */
const MEMORIA = 5;

const fallo = (estado: number, motivo: string, pista?: string) =>
  Response.json(pista ? { error: motivo, pista } : { error: motivo }, { status: estado });

type Cowork = {
  id: string;
  perfil_id: string;
  nombre: string;
  tipo: string;
  temas: string;
  zona: string;
};

type Sesion = NonNullable<Awaited<ReturnType<typeof clienteServidor>>>;
type Admin = NonNullable<ReturnType<typeof clienteAdmin>>;

/** Quién puede reservar y cerrar el trabajo, y por qué camino. */
type Manos =
  | { como: "sesion" }
  | { como: "llave"; admin: Admin }
  | { como: "no_se_puede"; motivo: string; pista?: string };

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const id = typeof cuerpo?.id === "string" ? cuerpo.id : "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  // Con tu sesión: si el Co-Work no es tuyo, esto no devuelve nada.
  const { data: cowork, error } = await supabase
    .from("coworks")
    .select("id, perfil_id, nombre, tipo, temas, zona")
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
  // El vigilante no llama a ningún modelo, así que tampoco cuesta nada.
  const gratis = esGratis(cowork.tipo);
  if (!gratis && perfil.creditos + perfil.creditos_extra < COSTE) {
    return fallo(402, "sin_creditos");
  }

  /* Reservar el día, para que esto no se haga dos veces. Primero con tu
     sesión; la llave del servidor solo entra si la migración que lo
     permite todavía no está puesta. */
  const reserva = await reservar(supabase, cowork.id, cowork.zona);
  if (reserva.estado === "no_se_puede") {
    return fallo(503, reserva.motivo, reserva.pista);
  }

  const { manos, dia } = reserva;
  let resultado = reserva.resultado;

  if (!resultado) {
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

    const otra = await reservar(supabase, cowork.id, cowork.zona);
    if (otra.estado === "no_se_puede" || !otra.resultado) {
      return Response.json({ en_marcha: true });
    }
    resultado = otra.resultado;
  }

  const cerrar = (
    estado: string,
    contenido: string,
    extra?: { fuentes?: Fuente[] | null; modelo?: string | null; conversacion?: string | null },
  ) => terminar(supabase, manos, resultado, estado, contenido, extra);

  try {
    /* El vigilante: mira que todo siga en pie y lo cuenta. Ni busca ni
       escribe nada con un modelo, así que aquí no hay nada que cobrar.
       Y mira con TU sesión: la seguridad a nivel de fila le enseña lo
       tuyo y nada más, que es justo lo que tiene que mirar. */
    if (gratis) {
      const revision = await revisarSalud(supabase as never, cowork.perfil_id, { yo: cowork.id });

      await cerrar("ok", revision.texto, { modelo: `Vigilante · ${revision.gravedad}` });

      return Response.json({
        ok: true,
        resultado: {
          /* El día va DENTRO de `resultado`, que es de donde lo lee el
             navegador. Fuera se queda sin leer y el navegador lo calcula
             en UTC, que es justo lo que hay que evitar: en Auckland a las
             diez de la mañana, para UTC todavía es ayer. */
          dia,
          estado: "ok",
          contenido: revision.texto,
          modelo: `Vigilante · ${revision.gravedad}`,
          fuentes: [],
          conversacion_id: null,
        },
      });
    }

    const brief = await redactarBrief({
      tipo: cowork.tipo as Tipo,
      temas: cowork.temas,
      duenio: perfil.nombre ?? undefined,
      modoEdad: perfil.modo_edad,
      tono: perfil.tono ?? "cercano",
      zona: cowork.zona,
      anteriores: await loDeAntes(supabase, cowork.id),
    });

    if (!brief) {
      await cerrar("error", "No he podido prepararlo ahora mismo.");
      return fallo(502, "no_se_ha_podido");
    }

    /* Se cobra al final y con TU sesión: esto lo has pedido tú, así que
       el apunte del historial lleva tu nombre y no el del reloj. */
    const { error: errorCobro } = await supabase.rpc("gastar_creditos", {
      p_cantidad: COSTE,
      p_motivo: `Co-Work: ${cowork.nombre || recetaDe(cowork.tipo).nombre}`,
    });

    if (errorCobro) {
      await cerrar("sin_creditos", "No había créditos suficientes.");
      return fallo(402, "sin_creditos");
    }

    /* El dueño lo dice el Co-Work, no la consulta de arriba: `perfiles`
       deja ver también los perfiles hijo que uno tenga a cargo, así que
       un `limit(1)` sin orden puede devolver el del hijo y la
       conversación se insertaría a nombre de otro. */
    const conversacion = await dejarConversacion(supabase, cowork, cowork.perfil_id, brief);

    await cerrar("ok", brief.texto, {
      fuentes: brief.fuentes.length ? brief.fuentes : null,
      modelo: brief.modelo,
      conversacion,
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
    await cerrar("error", "Algo ha fallado al prepararlo.").catch(() => {});
    return fallo(502, "no_se_ha_podido");
  }
}

/* --------------------------------------------------------------
   Reservar el día
   -------------------------------------------------------------- */

type Reserva =
  | { estado: "hecha"; manos: Manos; resultado: string | null; dia: string }
  | { estado: "no_se_puede"; motivo: string; pista?: string };

/** Coge el hueco de hoy, con la sesión si se puede y con la llave si no.
 *
 *  `resultado` nulo no es un fallo: es que el hueco ya estaba cogido.
 *  El día viene siempre, porque quien llama lo necesita para ir a buscar
 *  lo que se hizo. */
async function reservar(supabase: Sesion, cowork: string, zona: string): Promise<Reserva> {
  /* Con tu sesión. El día NO lo elige esta ruta: lo calcula la propia
     función con la zona del encargo, que es lo que impide pedir el de
     mañana, el de pasado y el del mes que viene. */
  const { data, error } = await supabase
    .rpc("reservar_mi_cowork", { p_cowork: cowork })
    .maybeSingle<{ resultado: string | null; dia: string }>();

  if (!error && data) {
    return {
      estado: "hecha",
      manos: { como: "sesion" },
      resultado: data.resultado ? String(data.resultado) : null,
      dia: String(data.dia).slice(0, 10),
    };
  }

  /* La 0011 todavía no está pegada. Se hace por el camino viejo, que
     necesita la llave del servidor. */
  if (error && !faltaFuncion(error)) {
    console.error("[kairo] reservar con sesión:", error.message);
  }

  const admin = clienteAdmin();
  if (!admin) {
    return {
      estado: "no_se_puede",
      motivo: "falta_migracion",
      pista:
        "Pega supabase/migrations/0011_coworks_a_mano.sql en Supabase → SQL Editor. " +
        "(O pon SUPABASE_SERVICE_ROLE_KEY en Vercel, pero con la migración no hace falta.)",
    };
  }

  /* El día, en la zona del encargo. Que lo calcule la base de datos,
     que es quien luego compara: así no hay dos "hoy" distintos. */
  const { data: diaHoy } = await admin.rpc("hora_local", { p_zona: zona });
  const dia = String(diaHoy ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);

  const { data: vieja } = await admin.rpc("reservar_cowork", { p_cowork: cowork, p_dia: dia });

  return {
    estado: "hecha",
    manos: { como: "llave", admin },
    resultado: vieja ? String(vieja) : null,
    dia,
  };
}

/** Apunta cómo acabó, por el mismo camino por el que se reservó. */
async function terminar(
  supabase: Sesion,
  manos: Manos,
  resultado: string,
  estado: string,
  contenido: string,
  extra?: { fuentes?: Fuente[] | null; modelo?: string | null; conversacion?: string | null },
): Promise<void> {
  const args = {
    p_resultado: resultado,
    p_estado: estado,
    p_contenido: contenido,
    p_fuentes: extra?.fuentes ?? null,
    p_modelo: extra?.modelo ?? null,
    p_conversacion: extra?.conversacion ?? null,
  };

  const { error } =
    manos.como === "llave"
      ? await manos.admin.rpc("terminar_cowork", args)
      : await supabase.rpc("terminar_mi_cowork", args);

  if (error) console.error("[kairo] cerrar Co-Work:", error.message);
}

/* --------------------------------------------------------------
   Lo de los días anteriores
   -------------------------------------------------------------- */

/** Lo último que se escribió para este encargo.
 *
 *  Un repaso diario que empieza cada día por el principio no es un
 *  repaso: es la misma página cinco veces. Esto es toda la memoria que
 *  tiene, y con esto basta. Va con tu sesión, así que solo puede leer lo
 *  tuyo aunque se le pida otra cosa. */
async function loDeAntes(supabase: Sesion, cowork: string): Promise<string[]> {
  const { data } = await supabase
    .from("cowork_resultados")
    .select("contenido, estado, dia")
    .eq("cowork_id", cowork)
    .eq("estado", "ok")
    .order("dia", { ascending: false })
    .limit(MEMORIA);

  return ((data ?? []) as { contenido: string | null }[])
    .map((r) => r.contenido ?? "")
    .filter(Boolean);
}

/** La misma conversación que deja el reloj, para que las dos se lean igual. */
async function dejarConversacion(
  supabase: Sesion,
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
      contenido: recetaDe(cowork.tipo).paraElChat(cowork.temas),
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
