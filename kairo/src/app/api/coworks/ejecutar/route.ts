import { timingSafeEqual } from "node:crypto";
import { clienteAdmin } from "@/lib/supabase/admin";
import { faltaColumna } from "@/lib/supabase/compat";
import { CREDITOS } from "@/lib/ia/config";
import { redactarBrief, tituloDelBrief } from "@/lib/coworks/brief";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
/* Lo mismo que el chat: el modelo y la base de datos están en Europa, y
   ejecutar esto en Estados Unidos sería cruzar el Atlántico dos veces
   por cada Co-Work. */
export const preferredRegion = "fra1";

/* EL DESPERTADOR.
 *
 * Esta ruta no la llama nadie con un navegador: la llama un reloj. Cada
 * vez que suena, mira qué Co-Works tocan ahora, los hace y se calla.
 *
 * Tres cosas que la hacen segura, y ninguna sobra:
 *
 *  1. La contraseña. Sin ella, cualquiera podría llamar a esta dirección
 *     en bucle y gastarles los créditos a todos tus usuarios. Va en la
 *     cabecera, se compara en tiempo constante y no se escribe en
 *     ningún log.
 *  2. La reserva. Dos relojes a la vez —el de Vercel y el de GitHub— es
 *     lo normal, no un accidente. La base de datos deja pasar a uno solo
 *     (ver `reservar_cowork`), así que da igual cuántos suenen.
 *  3. El plazo. Una función de servidor tiene un minuto, y esto va de uno
 *     en uno: cuando se empieza un Co-Work no hay nada más en marcha, así
 *     que el plazo no sirve para "terminar los que ya estaban", sino para
 *     no empezar uno que no vaya a caber. Un brief son dos llamadas
 *     seguidas —buscar y escribir— y eso puede irse a medio minuto, así
 *     que se deja ese medio minuto libre. Los que no quepan, al siguiente
 *     aviso.
 */

/** Cuánto cuesta un Co-Work. Lo mismo que un mensaje normal: es uno. */
const COSTE = CREDITOS.normal;

/** El minuto que da Vercel, en milisegundos. Es `maxDuration` de arriba. */
const MINUTO = maxDuration * 1000;

/** Lo que hay que dejar libre para que un brief entero quepa: buscar y
 *  escribir, seguidos. Si no cabe, no se empieza. */
const LO_QUE_TARDA_UNO = 35_000;

/** Cuándo se deja de empezar trabajo nuevo. */
const PLAZO = MINUTO - LO_QUE_TARDA_UNO;

/** Cuántos se miran de una tacada. */
const DE_UNA_VEZ = 20;

type Pendiente = {
  id: string;
  perfil_id: string;
  nombre: string;
  tipo: string;
  temas: string;
  zona: string;
  dia: string;
  duenio: string | null;
  modo_edad: ModoEdad | null;
  tono: string | null;
  plan: string | null;
  saldo: number;
};

/** Comparar sin dar pistas por el tiempo que tarda. */
function igual(a: string, b: string): boolean {
  const uno = Buffer.from(a);
  const otro = Buffer.from(b);
  if (uno.length !== otro.length) return false;
  return timingSafeEqual(uno, otro);
}

async function ejecutar(req: Request) {
  const entro = Date.now();

  /* La contraseña del reloj. Vercel Cron la manda sola en esta misma
     cabecera cuando existe la variable, así que el mismo candado vale
     para los dos disparadores. */
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) {
    return Response.json(
      { error: "sin_cron_secret", pista: "Falta la variable CRON_SECRET" },
      { status: 503 },
    );
  }

  const cabecera = req.headers.get("authorization") ?? "";
  if (!igual(cabecera, `Bearer ${secreto}`)) {
    return Response.json({ error: "no_autorizado" }, { status: 401 });
  }

  const supabase = clienteAdmin();
  if (!supabase) {
    return Response.json(
      { error: "sin_clave", pista: "Falta SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase.rpc("coworks_pendientes", { p_limite: DE_UNA_VEZ });

  if (error) {
    /* Lo más probable con diferencia: la migración 0009 no está puesta.
       Se dice con esas palabras en vez de soltar el error crudo. */
    console.error("[kairo] no se pudo repartir el trabajo:", error.message);
    return Response.json(
      {
        error: "sin_reparto",
        pista: "¿Está puesta la migración 0009_coworks.sql en Supabase?",
        detalle: error.message.slice(0, 200),
      },
      { status: 503 },
    );
  }

  const pendientes = (data ?? []) as Pendiente[];
  const cuenta = { mirados: pendientes.length, hechos: 0, sin_creditos: 0, fallidos: 0, aplazados: 0 };

  for (const c of pendientes) {
    if (Date.now() - entro > PLAZO) {
      cuenta.aplazados++;
      continue;
    }

    // Quien no consiga la reserva es que ya la tiene otro. Se pasa.
    const { data: reserva } = await supabase.rpc("reservar_cowork", {
      p_cowork: c.id,
      p_dia: c.dia,
    });
    if (!reserva) continue;

    const resultado = String(reserva);

    // Sin saldo no se trabaja. Y se deja dicho, que si no parece averiado.
    if ((c.saldo ?? 0) < COSTE) {
      await supabase.rpc("terminar_cowork", {
        p_resultado: resultado,
        p_estado: "sin_creditos",
        p_contenido: "Hoy no había créditos suficientes para hacerlo.",
      });
      cuenta.sin_creditos++;
      continue;
    }

    try {
      const brief = await redactarBrief({
        temas: c.temas,
        duenio: c.duenio ?? undefined,
        modoEdad: c.modo_edad,
        tono: c.tono ?? "cercano",
        zona: c.zona,
      });

      /* Sin brief no se cobra y no se escribe nada. Lo normal aquí es
         que no se haya podido buscar, y un resumen sin haber buscado no
         es un resumen: es lo que el modelo recuerde de hace dos años. */
      if (!brief) {
        await supabase.rpc("terminar_cowork", {
          p_resultado: resultado,
          p_estado: "error",
          p_contenido: "Hoy no he podido comprobar las novedades. Mañana vuelvo a mirar.",
        });
        cuenta.fallidos++;
        continue;
      }

      // Se cobra cuando ya hay algo escrito, nunca antes.
      const { error: fallaCobro } = await supabase.rpc("gastar_creditos_de", {
        p_perfil: c.perfil_id,
        p_cantidad: COSTE,
        p_motivo: `Co-Work: ${c.nombre || "Daily Brief"}`,
      });

      if (fallaCobro) {
        await supabase.rpc("terminar_cowork", {
          p_resultado: resultado,
          p_estado: "sin_creditos",
          p_contenido: "Hoy no había créditos suficientes para hacerlo.",
        });
        cuenta.sin_creditos++;
        continue;
      }

      const conversacion = await dejarConversacion(supabase, c, brief.texto, brief);

      await supabase.rpc("terminar_cowork", {
        p_resultado: resultado,
        p_estado: "ok",
        p_contenido: brief.texto,
        p_fuentes: brief.fuentes.length ? brief.fuentes : null,
        p_modelo: brief.modelo,
        p_conversacion: conversacion,
      });

      cuenta.hechos++;
    } catch (e) {
      console.error("[kairo] Co-Work fallido:", e instanceof Error ? e.message : e);
      await supabase
        .rpc("terminar_cowork", {
          p_resultado: resultado,
          p_estado: "error",
          p_contenido: "Algo ha fallado al prepararlo. Mañana vuelvo a intentarlo.",
        })
        .then(() => {}, () => {});
      cuenta.fallidos++;
    }
  }

  return Response.json({ ok: true, ...cuenta, segundos: Math.round((Date.now() - entro) / 1000) });
}

/* El resultado no se queda escondido en una pantalla aparte: se deja una
   conversación abierta, como si Kairo te hubiera escrito. Así puedes
   responderle —"¿y esto qué significa?"— sin copiar y pegar nada.
   Si no se puede crear, el Co-Work no falla: el resumen ya está
   guardado en su propia tabla y se ve igual. */
async function dejarConversacion(
  supabase: NonNullable<ReturnType<typeof clienteAdmin>>,
  c: Pendiente,
  texto: string,
  brief: { fuentes: Fuente[]; busquedas: string[]; modelo: string },
): Promise<string | null> {
  try {
    const { data: conv } = await supabase
      .from("conversaciones")
      .insert({
        perfil_id: c.perfil_id,
        titulo: tituloDelBrief(c.nombre, new Date(), c.zona),
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (!conv?.id) return null;

    const pregunta = {
      conversacion_id: conv.id,
      rol: "user",
      contenido: `Novedades de hoy sobre: ${c.temas}`,
    };

    const respuesta: Record<string, unknown> = {
      conversacion_id: conv.id,
      rol: "kairo",
      contenido: texto,
      modelo_usado: brief.modelo,
      nivel: "normal",
      creditos_gastados: COSTE,
    };

    const conFuentes = brief.fuentes.length
      ? { ...respuesta, fuentes: brief.fuentes, busquedas: brief.busquedas }
      : respuesta;

    let { error } = await supabase.from("mensajes").insert([pregunta, conFuentes]);

    // Sin la migración 0007 no existen esas dos columnas. Antes perder
    // las fuentes que perder el resumen entero.
    if (error && faltaColumna(error)) {
      ({ error } = await supabase.from("mensajes").insert([pregunta, respuesta]));
    }

    /* Si los mensajes no entran, la conversación se queda vacía, y una
       conversación vacía es peor que ninguna: la web enseñaría "sigue
       preguntando en el chat" y al pulsarlo saldría una pantalla en
       blanco. Se devuelve null y el resumen se lee en su propia tarjeta,
       que es donde de todas formas está guardado. */
    if (error) {
      console.error("[kairo] no se guardó la conversación del Co-Work:", error.message);
      return null;
    }

    return conv.id;
  } catch (e) {
    console.error("[kairo] conversación del Co-Work:", e instanceof Error ? e.message : e);
    return null;
  }
}

/* Vercel Cron llama con GET; un disparador propio suele mandar POST.
   Se aceptan los dos y hacen lo mismo. */
export const GET = ejecutar;
export const POST = ejecutar;
