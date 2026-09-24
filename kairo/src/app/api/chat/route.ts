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
import { arrancar, type Arranque } from "@/lib/ia/proveedores";
import { clasificarError } from "@/lib/ia/errores";
import { construirPrompt } from "@/lib/ia/prompt";
import { tituloDesde } from "@/lib/conversaciones";
import { recortar } from "@/lib/texto";
import type { Level } from "@/lib/mock";
import type { ModoEdad, PlanId } from "@/lib/planes";
import type { Mente } from "@/lib/tipos";

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

type Guardado = { id: string; titulo: string; nueva: boolean };

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
): Promise<Guardado | null> {
  if (!supabase) return null;

  const guardarMensaje = (conversacionId: string) =>
    supabase.from("mensajes").insert({
      conversacion_id: conversacionId,
      rol: "user",
      contenido: textoUsuario,
    });

  if (pedida) {
    // Si no es tuya, RLS devuelve vacío y se abre una nueva.
    const { data } = await supabase
      .from("conversaciones")
      .select("id, titulo")
      .eq("id", pedida)
      .maybeSingle<{ id: string; titulo: string }>();

    if (data) {
      await guardarMensaje(data.id);
      return { id: data.id, titulo: data.titulo, nueva: false };
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

  await guardarMensaje(data.id);
  return { id: data.id, titulo: data.titulo, nueva: true };
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
      let conversacion: Guardado | null = null;

      /* Se abre la conversación a la vez que se llama al modelo, no antes.
         Así guardar el historial no añade ni un milisegundo de espera:
         mientras la base de datos escribe, el modelo ya está pensando. */
      const abriendo = abrirConversacion(
        supabase,
        perfil.id,
        conversacionPedida,
        menteId,
        recortar(entradas[entradas.length - 1]?.texto, 12000),
      );

      try {
        const sistema = construirPrompt({
          modoEdad: perfil.modo_edad,
          tono: perfil.tono ?? "cercano",
          nombre: perfil.nombre || undefined,
          nivel,
          mente,
        });

        /* Se recorre la cadena de cerebros hasta que uno conteste.
           Con el mismo modelo se reintenta solo si está saturado, porque
           eso se pasa en segundos; cualquier otro fallo significa que ese
           modelo no va a funcionar hoy, así que se aparta y se prueba el
           siguiente, aunque sea de otra casa. Todo esto ocurre antes de la
           primera palabra: una vez empieza a salir texto, reintentar
           duplicaría la respuesta. */
        const esperas = [700, 1800];
        const enJuego = cadena.filter(disponible);
        const candidatos = enJuego.length ? enJuego : [cadena[cadena.length - 1]];

        let arranque: Arranque | undefined;
        let ultimoFallo: unknown;

        buscar: for (const candidato of candidatos) {
          for (let intento = 0; intento <= esperas.length; intento++) {
            try {
              arranque = await arrancar({
                id: candidato,
                sistema,
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
              const tipo = clasificarError(e);

              if (tipo === "sobrecargado") {
                if (intento < esperas.length) {
                  await esperar(esperas[intento]);
                  continue;
                }
                enfriar(candidato, 60_000); // saturación: vuelve pronto
              } else {
                enfriar(candidato, 10 * 60_000); // sin acceso o retirado
              }
              break; // siguiente modelo de la cadena
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
        if (conversacion) {
          enviar({
            t: "conversacion",
            id: conversacion.id,
            titulo: conversacion.titulo,
            nueva: conversacion.nueva,
          });
        }

        /* El primer trozo ya está en la mano (es lo que confirmó que el
           modelo responde). Se vuelve a poner al principio de la cola y
           el resto sale del iterador. */
        const trozos: AsyncIterable<string> = {
          async *[Symbol.asyncIterator]() {
            if (respuesta.primero) yield respuesta.primero;
            while (true) {
              const siguiente = await respuesta.resto.next();
              if (siguiente.done) return;
              if (siguiente.value) yield siguiente.value as string;
            }
          },
        };

        for await (const texto of trozos) {
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
          v: clasificarError(mensaje),
          // El detalle va al dueño de la web, que es quien puede arreglarlo.
          detalle: mensaje.slice(0, 200),
        });
      } finally {
        /* Se guarda aquí, en el `finally`, y no al terminar el bucle:
           si cierras la pestaña a mitad, lo que Kairo llevaba escrito se
           queda guardado igual en vez de perderse. */
        try {
          conversacion = conversacion ?? (await abriendo);
          if (conversacion && acumulado.trim()) {
            const { error } = await supabase.from("mensajes").insert({
              conversacion_id: conversacion.id,
              rol: "kairo",
              contenido: acumulado,
              modelo_usado: usado ? nombreModelo(usado) : null,
              nivel,
              creditos_gastados: cobrado ? coste : 0,
            });
            if (error) console.error("[kairo] no se guardó la respuesta:", error.message);
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
