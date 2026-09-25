import { clienteServidor } from "@/lib/supabase/server";
import {
  CREDITOS,
  ESFUERZO,
  HISTORIAL_MAX,
  MAX_SALIDA,
  NIVELES_POR_PLAN,
  RAZONAMIENTO,
  cadenaDe,
  nombreModelo,
} from "@/lib/ia/config";
import { arrancar, puedeBuscar, type Arranque, type Trozo } from "@/lib/ia/proveedores";
import { clasificarError, segundosDeEspera } from "@/lib/ia/errores";
import { construirPrompt } from "@/lib/ia/prompt";
import { tituloDesde } from "@/lib/conversaciones";
import { recortar } from "@/lib/texto";
import { faltaColumna } from "@/lib/supabase/compat";
import type { Level } from "@/lib/mock";
import type { ModoEdad, PlanId } from "@/lib/planes";
import type { Fuente, Mente } from "@/lib/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

/* Por defecto Vercel ejecuta esto en Estados Unidos, mientras que tu base
   de datos está en Irlanda y tú en España. Cada mensaje cruzaba el
   Atlántico dos veces antes de llegar siquiera al modelo. Fijándolo en
   Fráncfort, todo el viaje se queda en Europa. Es el mayor recorte de
   espera de todo el proyecto, y es una línea. */
export const preferredRegion = "fra1";

/* El cerebro de Kairo.
 *
 * Todo pasa por aquí, en el servidor, y por un motivo: la clave de la API
 * no puede acercarse al navegador ni de lejos. Si se filtra, cualquiera
 * gasta tu cuota en una noche.
 *
 * Orden de comprobaciones, y ninguna es opcional:
 *   sesión → perfil → plan → créditos → límite de peticiones → modelo
 *
 * Los créditos se cobran cuando llega el primer trozo de respuesta, no
 * antes: así, si el modelo falla o el filtro de seguridad corta, al usuario
 * no se le cobra nada.
 */

const NIVELES: Level[] = ["fast", "normal", "forja", "mega"];

/* Solo se acepta algo con forma de identificador. Filtrar aquí evita
   mandarle a la base de datos cualquier cosa que llegue en el cuerpo. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Entrada = { rol: "user" | "kairo"; texto: string };

// ---------------------------------------------------------------
// Límite de peticiones. Vive en memoria, así que en un servidor sin
// estado como Vercel solo protege dentro de cada instancia. Es una
// primera barrera contra el abuso tonto, no contra un ataque serio;
// para eso hace falta llevarlo a la base de datos.
// ---------------------------------------------------------------
const ventanas = new Map<string, number[]>();

function permitePeticion(id: string, max = 20, ventanaMs = 60_000) {
  const ahora = Date.now();
  const previas = (ventanas.get(id) ?? []).filter((t) => ahora - t < ventanaMs);
  if (previas.length >= max) return false;
  previas.push(ahora);
  ventanas.set(id, previas);
  if (ventanas.size > 5000) ventanas.clear(); // no crecer sin fin
  return true;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Cuarentena de modelos. Si uno falla por algo que no se arregla solo
   (no tienes acceso, no existe, cuota agotada), no tiene sentido volver a
   pedírselo en cada mensaje: se aparta un rato y se pasa al siguiente.
   Vive en memoria, así que cada instancia aprende por su cuenta. */
const enfriando = new Map<string, number>();
const disponible = (m: string) => (enfriando.get(m) ?? 0) < Date.now();
const enfriar = (m: string, ms: number) => enfriando.set(m, Date.now() + ms);

/* ¿Está puesta la migración 0007, la que añade las columnas de las
   fuentes? Se averigua a la primera y no se vuelve a preguntar. Sin
   esto, una web con la migración pendiente dejaría de guardar las
   respuestas enteras, y perder la conversación por no poder guardar de
   dónde salió un dato sería un pésimo canje. */
let columnasDeFuentes = true;

/* La conversación abierta, más el identificador que la base de datos le
   dio a la pregunta. Ese identificador es lo que luego permite EDITAR la
   pregunta: para rehacer la conversación desde ese punto hay que saber
   cuál es ese punto, y el navegador solo lo sabe si se lo decimos. */
type Guardado = {
  id: string;
  titulo: string;
  nueva: boolean;
  mensajeUsuario: string | null;
};

/* Abre la conversación (o continúa la que ya había) y guarda de
   inmediato lo que acaba de escribir el usuario.
   Se guarda ANTES de llamar al modelo a propósito: si el modelo falla o
   se cae la conexión, tu pregunta no se pierde. */
async function abrirConversacion(
  supabase: Awaited<ReturnType<typeof clienteServidor>>,
  perfilId: string,
  pedida: string | null,
  menteId: string | null,
  textoUsuario: string,
  /* En un reintento la pregunta ya está guardada del intento que falló.
     Volver a guardarla la dejaría dos veces en el historial. */
  guardarPregunta: boolean,
): Promise<Guardado | null> {
  if (!supabase) return null;

  const guardarMensaje = async (conversacionId: string): Promise<string | null> => {
    if (!guardarPregunta) return null;

    const { data, error } = await supabase
      .from("mensajes")
      .insert({
        conversacion_id: conversacionId,
        rol: "user",
        contenido: textoUsuario,
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) console.error("[kairo] no se guardó la pregunta:", error.message);
    return data?.id ?? null;
  };

  if (pedida) {
    // Si no es tuya, RLS devuelve vacío y se abre una nueva.
    const { data } = await supabase
      .from("conversaciones")
      .select("id, titulo")
      .eq("id", pedida)
      .maybeSingle<{ id: string; titulo: string }>();

    if (data) {
      return {
        id: data.id,
        titulo: data.titulo,
        nueva: false,
        mensajeUsuario: await guardarMensaje(data.id),
      };
    }
  }

  const titulo = tituloDesde(textoUsuario);
  const { data, error } = await supabase
    .from("conversaciones")
    .insert({ perfil_id: perfilId, titulo, mente_id: menteId })
    .select("id, titulo")
    .maybeSingle<{ id: string; titulo: string }>();

  if (error || !data) {
    console.error("[kairo] no se pudo abrir la conversación:", error?.message);
    return null;
  }

  return {
    id: data.id,
    titulo: data.titulo,
    nueva: true,
    mensajeUsuario: await guardarMensaje(data.id),
  };
}

const fallo = (estado: number, motivo: string) =>
  new Response(JSON.stringify({ error: motivo }), {
    status: estado,
    headers: { "content-type": "application/json" },
  });

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const nivel: Level = NIVELES.includes(cuerpo?.nivel) ? cuerpo.nivel : "fast";
  const entradas: Entrada[] = Array.isArray(cuerpo?.mensajes) ? cuerpo.mensajes : [];

  /* De la Mente el navegador manda el identificador y nada más. Las
     instrucciones se leen siempre de la base de datos, nunca del cuerpo
     de la petición: si vinieran de fuera, cualquiera podría inyectar el
     texto que quisiera en el system prompt sin pasar por su cuenta. */
  const menteId: string | null =
    typeof cuerpo?.menteId === "string" && UUID.test(cuerpo.menteId) ? cuerpo.menteId : null;

  /* La conversación en la que estamos. Si no viene, o viene una que no
     es tuya, se abre una nueva: RLS no devuelve la fila y aquí no hay
     forma de escribir en la conversación de otro. */
  const conversacionPedida: string | null =
    typeof cuerpo?.conversacionId === "string" && UUID.test(cuerpo.conversacionId)
      ? cuerpo.conversacionId
      : null;

  /* Reintento de una respuesta que falló. La pregunta ya está guardada,
     así que no se vuelve a guardar. Solo cuenta si además viene la
     conversación: sin ella no hay nada que reintentar. */
  const reintento = cuerpo?.reintento === true && conversacionPedida !== null;

  /* Una sola consulta en vez de dos. Antes se pedía el usuario y después
     su perfil; ahora se pide el perfil directamente, porque la seguridad
     a nivel de fila ya se encarga de devolver únicamente el de quien
     pregunta. Sin sesión no hay fila, así que sigue sin haber manera de
     ver lo ajeno: se ahorra un viaje de ida y vuelta, no una comprobación.
     Y si además hay Mente, las dos consultas salen a la vez, así que
     usarla no cuesta ni un milisegundo de espera de más. */
  const consultaPerfil = supabase
    .from("perfiles")
    .select("id, auth_id, nombre, plan, creditos, creditos_extra, modo_edad, tono")
    .limit(1)
    .maybeSingle<{
      id: string;
      auth_id: string;
      nombre: string | null;
      plan: PlanId;
      creditos: number;
      creditos_extra: number;
      modo_edad: ModoEdad | null;
      tono: string | null;
    }>();

  // Aquí tampoco hace falta filtrar por dueño: RLS solo deja ver las tuyas,
  // así que pedir una Mente ajena por su id devuelve simplemente nada.
  const consultaMente = menteId
    ? supabase
        .from("mentes")
        .select("id, nombre, emoji, descripcion, instrucciones, tono")
        .eq("id", menteId)
        .maybeSingle<Mente>()
    : null;

  const [resPerfil, resMente] = await Promise.all([consultaPerfil, consultaMente]);
  const perfil = resPerfil.data;
  const mente = resMente?.data ?? null;

  if (!perfil) return fallo(401, "sin_sesion");
  if (!entradas.length) return fallo(400, "sin_mensaje");

  // El plan manda. Y se lee de la base de datos, nunca de lo que diga
  // el navegador, que es justo lo que un usuario listo intentaría cambiar.
  if (!NIVELES_POR_PLAN[perfil.plan].includes(nivel)) {
    return fallo(403, "nivel_no_permitido");
  }

  const coste = CREDITOS[nivel];
  if (perfil.creditos + perfil.creditos_extra < coste) {
    return fallo(402, "sin_creditos");
  }

  if (!permitePeticion(perfil.auth_id)) return fallo(429, "demasiadas_peticiones");

  /* La cadena ya viene filtrada: fuera los proveedores sin clave, y en
     modo niño solo los que llevan filtro de contenido. Si queda vacía es
     que no hay ningún cerebro al que preguntar, y eso se dice, no se
     disimula respondiendo con otro. */
  const cadena = cadenaDe(nivel, perfil.modo_edad);
  if (!cadena.length) return fallo(503, "sin_clave");

  const historial = entradas.slice(-HISTORIAL_MAX).map((m) => ({
    rol: m.rol,
    texto: recortar(m.texto, 12000),
  }));

  const codificador = new TextEncoder();
  const stream = new ReadableStream({
    async start(controlador) {
      const enviar = (dato: unknown) =>
        controlador.enqueue(codificador.encode(`${JSON.stringify(dato)}\n`));

      // Lo primero, decirle al cliente qué modelo está trabajando:
      // es lo que pinta la etiqueta bajo "Pensando…".
      enviar({ t: "meta", modelo: nombreModelo(cadena[0]), nivel });

      let cobrado = false;
      let algoEscrito = false;

      /* Lo que va respondiendo se acumula para guardarlo entero al final.
         Al final y no trozo a trozo: serían cien escrituras por mensaje. */
      let acumulado = "";
      let usado = "";
      /* De dónde salió lo que ha dicho. Se guarda con la respuesta para
         que al volver a abrir la conversación sigan estando ahí. */
      let fuentes: Fuente[] = [];
      let busquedas: string[] = [];
      let conversacion: Guardado | null = null;
      let avisado = false;

      /* El navegador necesita saber en qué conversación está, y lo necesita
         TAMBIÉN cuando el modelo falla: sin el identificador no hay a qué
         reintentar. Por eso se avisa desde dos sitios y solo una vez. */
      const avisarConversacion = () => {
        if (!conversacion || avisado) return;
        avisado = true;
        enviar({
          t: "conversacion",
          id: conversacion.id,
          titulo: conversacion.titulo,
          nueva: conversacion.nueva,
          mensajeUsuario: conversacion.mensajeUsuario,
        });
      };

      /* Se abre la conversación a la vez que se llama al modelo, no antes.
         Así guardar el historial no añade ni un milisegundo de espera:
         mientras la base de datos escribe, el modelo ya está pensando. */
      const abriendo = abrirConversacion(
        supabase,
        perfil.id,
        conversacionPedida,
        menteId,
        recortar(entradas[entradas.length - 1]?.texto, 12000),
        !reintento,
      );

      try {
        /* El prompt se arma por candidato y no una vez para todos: no
           todos los modelos de la cadena pueden buscar en internet, y
           decirle a uno que no puede que tiene buscador es pedirle que
           se invente lo que no ha consultado. */
        const promptPara = (candidato: string) =>
          construirPrompt({
            modoEdad: perfil.modo_edad,
            tono: perfil.tono ?? "cercano",
            nombre: perfil.nombre || undefined,
            nivel,
            mente,
            conBusqueda: puedeBuscar(candidato),
          });

        /* Cómo se busca un cerebro que conteste.
         *
         * Antes se insistía tres veces con el MISMO modelo antes de probar
         * otro. Con la capa gratuita de Google eso es justo al revés de lo
         * que conviene: cuando un modelo está saturado, el de al lado suele
         * estar libre, porque no comparten la misma cola. Ahora se prueban
         * todos una vez, deprisa, y solo si TODOS han fallado por saturación
         * se espera y se da otra vuelta. Se llega al que funciona en el
         * primer segundo en vez de en el quinto.
         *
         * Todo esto ocurre antes de la primera palabra: una vez empieza a
         * salir texto, reintentar duplicaría la respuesta. */
        const VUELTAS = [0, 1200, 3000];

        const enJuego = cadena.filter(disponible);
        /* Si están todos en cuarentena se prueban igual: la cuarentena es
           una pista de lo que pasó en la petición anterior, no una condena. */
        const candidatos = enJuego.length ? enJuego : cadena;

        let arranque: Arranque | undefined;
        let ultimoFallo: unknown;
        const descartados = new Set<string>();

        buscar: for (const espera of VUELTAS) {
          // Un poco de azar para que dos usuarios a la vez no vuelvan justo
          // a la vez y se pisen otra vez en la misma cola.
          if (espera) await esperar(espera + Math.round(Math.random() * 400));

          for (const candidato of candidatos) {
            if (descartados.has(candidato)) continue;

            try {
              arranque = await arrancar({
                id: candidato,
                sistema: promptPara(candidato),
                mensajes: historial,
                maxSalida: MAX_SALIDA[nivel],
                esfuerzo: ESFUERZO[nivel],
                modoEdad: perfil.modo_edad,
                pensar: RAZONAMIENTO[nivel],
              });
              usado = candidato;
              break buscar;
            } catch (e) {
              ultimoFallo = e;

              /* Cada fallo dura lo suyo, y apartar un modelo más tiempo del
                 necesario es tan malo como no apartarlo: en la capa gratuita
                 cada intento que se tira a la basura es cuota que te comes. */
              switch (clasificarError(e)) {
                case "sobrecargado":
                  // Vuelve a estar libre enseguida: otra oportunidad en la
                  // vuelta siguiente, pero no en la siguiente petición.
                  enfriar(candidato, 30_000);
                  break;
                case "cuota_minuto":
                  // El límite por minuto se pasa solo; dentro de esta
                  // petición ya no, pero en un minuto sí.
                  enfriar(candidato, 70_000);
                  descartados.add(candidato);
                  break;
                case "cuota_dia":
                  // Hasta mañana. Seguir preguntándole es tirar peticiones.
                  enfriar(candidato, 60 * 60_000);
                  descartados.add(candidato);
                  break;
                default:
                  // No existe, no tienes acceso o lo han retirado.
                  enfriar(candidato, 10 * 60_000);
                  descartados.add(candidato);
              }
            }
          }
        }

        if (!arranque) throw ultimoFallo;
        const respuesta = arranque;

        // Si acabó respondiendo otro, que la etiqueta diga la verdad.
        if (usado !== cadena[0]) {
          enviar({ t: "meta", modelo: nombreModelo(usado), nivel });
        }

        // Para entonces la conversación ya está abierta. El navegador
        // necesita su identificador para seguir escribiendo en ella.
        conversacion = await abriendo;
        avisarConversacion();

        /* El primer trozo ya está en la mano (es lo que confirmó que el
           modelo responde). Se vuelve a poner al principio de la cola y
           el resto sale del iterador. */
        const trozos: AsyncIterable<Trozo> = {
          async *[Symbol.asyncIterator]() {
            if (respuesta.primero) yield respuesta.primero;
            while (true) {
              const siguiente = await respuesta.resto.next();
              if (siguiente.done) return;
              if (siguiente.value) yield siguiente.value as Trozo;
            }
          },
        };

        for await (const trozo of trozos) {
          /* Las fuentes no son respuesta: no se cobran, no se acumulan
             en el texto y van por su propio aviso. */
          if ("fuentes" in trozo) {
            fuentes = trozo.fuentes;
            busquedas = trozo.busquedas;
            enviar({ t: "fuentes", v: fuentes, busquedas });
            continue;
          }

          const texto = trozo.texto;
          if (!texto) continue;

          // Primer trozo bueno: ahora sí se cobra. Ni antes (podría
          // fallar) ni al final (el usuario podría cerrar la pestaña).
          if (!cobrado) {
            cobrado = true;
            const { data, error } = await supabase.rpc("gastar_creditos", {
              p_cantidad: coste,
              p_motivo: `mensaje ${nivel}`,
            });

            if (error) {
              enviar({ t: "error", v: "sin_creditos" });
              controlador.close();
              return;
            }

            const fila = Array.isArray(data) ? data[0] : data;
            enviar({
              t: "creditos",
              creditos: fila?.creditos ?? 0,
              creditosExtra: fila?.creditos_extra ?? 0,
            });
          }

          algoEscrito = true;
          acumulado += texto;
          enviar({ t: "texto", v: texto });
        }

        // Sin una sola palabra: o lo cortó el filtro de seguridad, o el
        // modelo no tenía nada que decir. Al usuario se le explica, y no
        // se le cobra, porque nunca llegamos a cobrar.
        if (!algoEscrito) enviar({ t: "error", v: "bloqueado" });

        enviar({ t: "fin" });
      } catch (e) {
        const mensaje = e instanceof Error ? e.message : String(e);
        console.error("[kairo] fallo del modelo:", mensaje);
        enviar({
          t: "error",
          // Se le pasa el error entero, no solo su texto: los SDK traen el
          // código de estado dentro, y ese código es más de fiar.
          v: clasificarError(e),
          // Si el propio proveedor dice cuánto hay que esperar, se dice.
          espera: segundosDeEspera(mensaje),
          // El detalle va al dueño de la web, que es quien puede arreglarlo.
          detalle: mensaje.slice(0, 200),
        });
      } finally {
        /* Se guarda aquí, en el `finally`, y no al terminar el bucle:
           si cierras la pestaña a mitad, lo que Kairo llevaba escrito se
           queda guardado igual en vez de perderse. */
        try {
          conversacion = conversacion ?? (await abriendo);
          avisarConversacion();

          if (conversacion && acumulado.trim()) {
            const fila = {
              conversacion_id: conversacion.id,
              rol: "kairo",
              contenido: acumulado,
              modelo_usado: usado ? nombreModelo(usado) : null,
              nivel,
              creditos_gastados: cobrado ? coste : 0,
            };

            const conFuentes =
              columnasDeFuentes && (fuentes.length || busquedas.length)
                ? { ...fila, fuentes, busquedas }
                : fila;

            const guardar = (f: Record<string, unknown>) =>
              supabase.from("mensajes").insert(f).select("id").maybeSingle<{ id: string }>();

            let { data: guardado, error } = await guardar(conFuentes);

            /* Las columnas de fuentes todavía no existen: se guarda la
               respuesta sin ellas. Mejor la conversación sin las fuentes
               que la conversación perdida. */
            if (error && conFuentes !== fila && faltaColumna(error)) {
              columnasDeFuentes = false;
              console.warn("[kairo] falta la migración 0007: las fuentes no se guardan todavía");
              ({ data: guardado, error } = await guardar(fila));
            }

            /* Y sin la 0005, la tabla solo acepta los nombres de nivel
               viejos, así que rechaza CADA respuesta que Kairo escribe:
               escribes, lees la respuesta, vuelves mañana y no está.
               Se guarda sin nivel antes que perderla. */
            if (error && /nivel/i.test(error.message)) {
              console.warn("[kairo] falta la migración 0005: la respuesta se guarda sin nivel");
              // Con las fuentes si todavía caben: quitar el nivel no es
              // motivo para tirar también de dónde salió el dato.
              const base = columnasDeFuentes ? conFuentes : fila;
              ({ data: guardado, error } = await guardar({ ...base, nivel: null }));
            }

            if (error) console.error("[kairo] no se guardó la respuesta:", error.message);

            /* Y el identificador de la respuesta, para que "Regenerar"
               sepa cuál tiene que reemplazar en vez de dejar dos. */
            if (guardado?.id) enviar({ t: "guardado", id: guardado.id });
          }
        } catch (e) {
          console.error("[kairo] fallo al guardar:", e instanceof Error ? e.message : e);
        }

        try {
          controlador.close();
        } catch {
          /* ya cerrado porque el navegador se fue */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
