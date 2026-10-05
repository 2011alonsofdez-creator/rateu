import { timingSafeEqual } from "node:crypto";
import { clienteAdmin } from "@/lib/supabase/admin";
import { faltaColumna } from "@/lib/supabase/compat";
import { CREDITOS } from "@/lib/ia/config";
import { redactarBrief, tituloDelBrief } from "@/lib/coworks/brief";
import { revisarSalud, tituloDeLaRevision } from "@/lib/coworks/salud";
import { hayTelegram, mandar } from "@/lib/telegram";
import {
  avisarDePlazos,
  tituloDelAviso,
  type PapelConPlazo,
} from "@/lib/papeles/plazos";
import { esGratis, recetaDe, type Tipo } from "@/lib/coworks/recetas";
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

  /* La contraseña que llega, limpia.
 
     Se le quita lo que sobra a propósito: estas dos cadenas se pegan a
     mano en dos paneles distintos, y un salto de línea al final de una
     caja de texto no se ve pero cambia el resultado. Ese fallo se lee
     igual que "la contraseña está mal" y no hay forma de distinguirlos
     mirando. */
  const cabecera = (req.headers.get("authorization") ?? "").trim();
  const recibida = cabecera.replace(/^Bearer\s+/i, "").trim();

  if (!igual(recibida, secreto)) {
    /* Y si no coinciden, se dice LO QUE SE PUEDE DECIR sin enseñar
       ninguna de las dos.
 
       Sin esto, el que lo está montando ve un 401 y solo puede volver a
       probar: no sabe si falta la cabecera, si pegó una de más o si se
       equivocó en una letra. Son tres averías distintas con tres
       arreglos distintos y el mismo mensaje.
 
       Lo único que sale de aquí es si llegó algo y si las dos miden lo
       mismo. Ni un carácter, ni un trozo, ni un resumen: con el largo no
       se entra en ningún sitio, y distingue "pegué otra cosa" de "me
       comí una letra", que es justo lo que hace falta saber. */
    return Response.json(
      {
        error: "no_autorizado",
        llego_contrasena: recibida.length > 0,
        mismo_largo: recibida.length === secreto.length,
        pista:
          recibida.length === 0
            ? "No ha llegado ninguna contraseña: revisa el secreto KAIRO_CRON_SECRET en GitHub."
            : recibida.length === secreto.length
              ? "Miden lo mismo pero no son iguales: hay alguna letra distinta. Vuelve a ponerlas copiando y pegando, sin escribirlas a mano."
              : "Son distintas: una de las dos no es la que crees. Acuérdate de volver a desplegar Vercel después de cambiar CRON_SECRET.",
      },
      { status: 401 },
    );
  }

  const supabase = clienteAdmin();
  if (!supabase) {
    return Response.json(
      { error: "sin_clave", pista: "Falta SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 },
    );
  }

  /* LOS PLAZOS, ANTES QUE LOS CO-WORKS.
 
     No es capricho de orden: un Co-Work son dos llamadas a un modelo y
     puede comerse medio minuto, y el minuto es uno para todo. Si los
     avisos fueran detrás, el día que haya cuatro encargos no saldrían
     —y un aviso que llega tarde no es un aviso tarde: es un recargo—.
     Avisar es una consulta y un mensaje: cuesta milisegundos. */
  const plazos = await avisarDePlazos({
    pendientes: async (limite) => {
      const { data, error: fallo } = await supabase.rpc("papeles_para_avisar", {
        p_limite: limite,
      });
      if (fallo) throw new Error(fallo.message);
      return (data ?? []) as PapelConPlazo[];
    },
    coger: async (papel, hito) => {
      const { data, error: fallo } = await supabase.rpc("apuntar_aviso", {
        p_papel: papel,
        p_hito: hito,
      });
      return !fallo && data === true;
    },
    porTelegram: async (chat, texto) => (hayTelegram() ? mandar(chat, texto) : false),
    /* Sin Telegram enlazado, al chat. No es tan bueno —hay que entrar a
       mirarlo— pero es mucho mejor que no decir nada, y es donde ya se
       dejan los avisos del vigilante. */
    porChat: async (papel, texto) => {
      await dejarAvisoDePapel(supabase, papel, texto);
    },
  }, () => Date.now() - entro < PLAZO);

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

  /* De tres en tres, no de uno en uno.
   *
   * Cada Co-Work es independiente del de al lado —tiene su reserva, su
   * cuenta y su modelo—, así que esperarse unos a otros solo servía
   * para que en un minuto cupiera uno. Y como casi todo el mundo pone
   * sus encargos a la misma hora (las 7 de la mañana), de uno en uno el
   * tercero llegaba a las diez.
   *
   * Tres a la vez y no diez: son tres conversaciones con modelos
   * abiertas al mismo tiempo, y esto corre en una función pequeña. */
  const LOTE = 3;

  for (let i = 0; i < pendientes.length; i += LOTE) {
    /* El plazo se mira ANTES de empezar un lote, nunca a mitad: lo que
       ya está en marcha se termina, porque dejarlo colgado deja una
       reserva puesta y un usuario sin su resumen. */
    if (Date.now() - entro > PLAZO) {
      cuenta.aplazados += pendientes.length - i;
      break;
    }

    const lote = pendientes.slice(i, i + LOTE);
    const resultados = await Promise.all(lote.map((c) => hacerUno(supabase, c)));

    for (const r of resultados) if (r !== "saltado") cuenta[r]++;
  }

  return Response.json({
    ok: true,
    ...cuenta,
    plazos,
    segundos: Math.round((Date.now() - entro) / 1000),
  });
}

/* Un Co-Work, de principio a fin. Devuelve en qué acabó, y "saltado"
   cuando se lo había llevado otro antes. */
type Final = "hechos" | "sin_creditos" | "fallidos" | "saltado";

async function hacerUno(
  supabase: NonNullable<ReturnType<typeof clienteAdmin>>,
  c: Pendiente,
): Promise<Final> {
  // Quien no consiga la reserva es que ya la tiene otro. Se pasa.
  const { data: reserva } = await supabase.rpc("reservar_cowork", {
    p_cowork: c.id,
    p_dia: c.dia,
  });
  if (!reserva) return "saltado";

  const resultado = String(reserva);

  /* El vigilante va por otro camino y no pasa por caja: no le pregunta
     nada a ningún modelo, solo mira si todo sigue en pie. Cobrar por
     comprobar que la casa no se ha caído sería cobrar por respirar. */
  if (esGratis(c.tipo)) {
    return (await vigilar(supabase, c, resultado)) ? "hechos" : "fallidos";
  }

  // Sin saldo no se trabaja. Y se deja dicho, que si no parece averiado.
  if ((c.saldo ?? 0) < COSTE) {
    await supabase.rpc("terminar_cowork", {
      p_resultado: resultado,
      p_estado: "sin_creditos",
      p_contenido: "Hoy no había créditos suficientes para hacerlo.",
    });
    return "sin_creditos";
  }

  try {
    const brief = await redactarBrief({
      tipo: c.tipo as Tipo,
      temas: c.temas,
      duenio: c.duenio ?? undefined,
      modoEdad: c.modo_edad,
      tono: c.tono ?? "cercano",
      zona: c.zona,
      anteriores: await loDeAntes(supabase, c.id),
    });

    /* Sin nada escrito no se cobra y no se guarda nada. Lo normal aquí
       es que no se haya podido buscar, y un resumen sin haber buscado
       no es un resumen: es lo que el modelo recuerde de hace dos años. */
    if (!brief) {
      await supabase.rpc("terminar_cowork", {
        p_resultado: resultado,
        p_estado: "error",
        p_contenido: "Hoy no he podido prepararlo. Mañana vuelvo a intentarlo.",
      });
      return "fallidos";
    }

    // Se cobra cuando ya hay algo escrito, nunca antes.
    const { error: fallaCobro } = await supabase.rpc("gastar_creditos_de", {
      p_perfil: c.perfil_id,
      p_cantidad: COSTE,
      p_motivo: `Co-Work: ${c.nombre || recetaDe(c.tipo).nombre}`,
    });

    if (fallaCobro) {
      await supabase.rpc("terminar_cowork", {
        p_resultado: resultado,
        p_estado: "sin_creditos",
        p_contenido: "Hoy no había créditos suficientes para hacerlo.",
      });
      return "sin_creditos";
    }

    const conversacion = await dejarConversacion(supabase, c, brief.texto, brief);

    /* Y al móvil, si lo ha pedido.
 
       Va DESPUÉS de guardar y antes de cerrar el encargo, y no al revés:
       lo que no puede pasar es que Telegram falle y se pierda el brief.
       Guardado está; lo del móvil es un extra que, si no sale, no se
       lleva nada por delante. */
    await aTelegram(
      supabase,
      c,
      `${tituloDelBrief(c.nombre, new Date(), c.zona)}\n\n${brief.texto}`,
    );

    await supabase.rpc("terminar_cowork", {
      p_resultado: resultado,
      p_estado: "ok",
      p_contenido: brief.texto,
      p_fuentes: brief.fuentes.length ? brief.fuentes : null,
      p_modelo: brief.modelo,
      p_conversacion: conversacion,
    });

    return "hechos";
  } catch (e) {
    console.error("[kairo] Co-Work fallido:", e instanceof Error ? e.message : e);
    await supabase
      .rpc("terminar_cowork", {
        p_resultado: resultado,
        p_estado: "error",
        p_contenido: "Algo ha fallado al prepararlo. Mañana vuelvo a intentarlo.",
      })
      .then(() => {}, () => {});
    return "fallidos";
  }
}

/* La revisión diaria.
 *
 * Se guarda SIEMPRE —para poder mirar atrás y ver desde cuándo algo va
 * mal— pero solo deja conversación en la barra lateral cuando hay algo
 * que contar. Un aviso diario que casi siempre dice "todo correcto" se
 * deja de leer a la semana, y el día que dice otra cosa tampoco se lee.
 */
async function vigilar(
  supabase: NonNullable<ReturnType<typeof clienteAdmin>>,
  c: Pendiente,
  resultado: string,
): Promise<boolean> {
  try {
    /* De quién es la revisión. Este cliente lleva la llave del servidor
       y se salta la seguridad a nivel de fila, así que hay que decirlo:
       sin el perfil el informe se haría con los Co-Works de todo el
       mundo y le nombraría a uno los de otro. */
    const revision = await revisarSalud(supabase as never, c.perfil_id, { yo: c.id });

    let conversacion: string | null = null;
    if (revision.gravedad !== "bien") {
      conversacion = await dejarAviso(supabase, c, revision.texto, revision.gravedad);
    }

    await supabase.rpc("terminar_cowork", {
      p_resultado: resultado,
      p_estado: "ok",
      p_contenido: revision.texto,
      p_modelo: `Vigilante · ${revision.gravedad}`,
      p_conversacion: conversacion,
    });

    return true;
  } catch (e) {
    console.error("[kairo] vigilante:", e instanceof Error ? e.message : e);
    await supabase
      .rpc("terminar_cowork", {
        p_resultado: resultado,
        p_estado: "error",
        p_contenido: "No he podido hacer la revisión de hoy.",
      })
      .then(() => {}, () => {});
    return false;
  }
}

/* AL MÓVIL.
 *
 * Un encargo que trabaja mientras no estás y luego te obliga a entrar en
 * la web a buscarlo no está terminado. Si has enlazado Telegram, llega
 * donde se lee.
 *
 * Nada de lo que pase aquí puede tumbar un Co-Work ya hecho y ya
 * cobrado: si Telegram no contesta, se apunta y se sigue.
 */
async function aTelegram(
  supabase: NonNullable<ReturnType<typeof clienteAdmin>>,
  c: Pendiente,
  texto: string,
): Promise<void> {
  if (!hayTelegram()) return;

  try {
    const { data } = await supabase
      .from("perfiles")
      .select("telegram_chat_id")
      .eq("id", c.perfil_id)
      .maybeSingle<{ telegram_chat_id: string | null }>();

    const chat = data?.telegram_chat_id;
    if (!chat) return;

    await mandar(chat, texto);
  } catch {
    /* Sin la migración 0013 la columna no existe, o Telegram está caído.
       Ni una cosa ni la otra son motivo para dar por fallido un encargo
       que está hecho y guardado. */
  }
}

/* El aviso de un plazo, cuando no hay Telegram enlazado.
 *
 * Deja una conversación en la barra lateral, igual que el vigilante. No
 * es tan bueno como que te suene el móvil —hay que entrar a mirarlo—
 * pero un aviso que no se manda a ninguna parte no es un aviso. */
async function dejarAvisoDePapel(
  supabase: NonNullable<ReturnType<typeof clienteAdmin>>,
  papel: PapelConPlazo,
  texto: string,
): Promise<void> {
  const { data: conv } = await supabase
    .from("conversaciones")
    .insert({ perfil_id: papel.perfil_id, titulo: tituloDelAviso(papel) })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (!conv?.id) return;

  await supabase.from("mensajes").insert([
    { conversacion_id: conv.id, rol: "user", contenido: "¿Me vence algo?" },
    { conversacion_id: conv.id, rol: "kairo", contenido: texto },
  ]);
}

/* Cuando algo está roto, el aviso llega donde se mira: al chat. Sin
   pregunta inventada delante, porque aquí no has preguntado nada. */
async function dejarAviso(
  supabase: NonNullable<ReturnType<typeof clienteAdmin>>,
  c: Pendiente,
  texto: string,
  gravedad: string,
): Promise<string | null> {
  try {
    const { data: conv } = await supabase
      .from("conversaciones")
      .insert({
        perfil_id: c.perfil_id,
        titulo: tituloDeLaRevision(gravedad as "roto", new Date(), c.zona),
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (!conv?.id) return null;

    const { error } = await supabase.from("mensajes").insert([
      {
        conversacion_id: conv.id,
        rol: "user",
        contenido: "¿Está todo bien?",
      },
      {
        conversacion_id: conv.id,
        rol: "kairo",
        contenido: texto,
        modelo_usado: "Vigilante",
        creditos_gastados: 0,
      },
    ]);

    if (error) {
      console.error("[kairo] no se guardó el aviso del vigilante:", error.message);
      return null;
    }

    return conv.id;
  } catch (e) {
    console.error("[kairo] aviso del vigilante:", e instanceof Error ? e.message : e);
    return null;
  }
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
      contenido: recetaDe(c.tipo).paraElChat(c.temas),
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

/** Lo último que se escribió para este encargo.
 *
 *  Un repaso diario que empieza cada día por el principio no es un
 *  repaso: es la misma página cinco veces. Esto es toda la memoria que
 *  tiene un Co-Work, y con esto basta. Se filtra por el encargo, así que
 *  solo trae lo suyo aunque este cliente lleve la llave del servidor. */
async function loDeAntes(
  supabase: NonNullable<ReturnType<typeof clienteAdmin>>,
  cowork: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("cowork_resultados")
    .select("contenido")
    .eq("cowork_id", cowork)
    .eq("estado", "ok")
    .order("dia", { ascending: false })
    .limit(5);

  return ((data ?? []) as { contenido: string | null }[])
    .map((r) => r.contenido ?? "")
    .filter(Boolean);
}

/* Vercel Cron llama con GET; un disparador propio suele mandar POST.
   Se aceptan los dos y hacen lo mismo. */
export const GET = ejecutar;
export const POST = ejecutar;
