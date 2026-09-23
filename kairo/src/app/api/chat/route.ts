import { GoogleGenAI } from "@google/genai";
import { clienteServidor } from "@/lib/supabase/server";
import {
  CREDITOS,
  HISTORIAL_MAX,
  MODELOS,
  MODELO_RESPALDO,
  NIVELES_POR_PLAN,
  RAZONAMIENTO,
  nombreModelo,
} from "@/lib/ia/config";
import { construirPrompt } from "@/lib/ia/prompt";
import { ajustesSeguridad } from "@/lib/ia/seguridad";
import type { Level } from "@/lib/mock";
import type { ModoEdad, PlanId } from "@/lib/planes";

export const runtime = "nodejs";
export const maxDuration = 60;

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

/** Traduce el error del proveedor a algo accionable. */
function clasificarError(mensaje: string) {
  if (/api[_ ]?key|API_KEY_INVALID|401|403|PERMISSION_DENIED/i.test(mensaje)) {
    return "clave_invalida";
  }
  if (/quota|rate|429|RESOURCE_EXHAUSTED/i.test(mensaje)) return "cuota_agotada";
  if (/not found|404|NOT_FOUND|is not supported/i.test(mensaje)) return "modelo_no_existe";
  if (/503|UNAVAILABLE|overloaded|high demand/i.test(mensaje)) return "sobrecargado";
  return "error_modelo";
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fallo = (estado: number, motivo: string) =>
  new Response(JSON.stringify({ error: motivo }), {
    status: estado,
    headers: { "content-type": "application/json" },
  });

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fallo(401, "sin_sesion");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, plan, creditos, creditos_extra, modo_edad, tono")
    .eq("auth_id", user.id)
    .maybeSingle<{
      nombre: string | null;
      plan: PlanId;
      creditos: number;
      creditos_extra: number;
      modo_edad: ModoEdad | null;
      tono: string | null;
    }>();

  if (!perfil) return fallo(403, "sin_perfil");

  const cuerpo = await req.json().catch(() => null);
  const nivel: Level = NIVELES.includes(cuerpo?.nivel) ? cuerpo.nivel : "fast";
  const entradas: Entrada[] = Array.isArray(cuerpo?.mensajes) ? cuerpo.mensajes : [];

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

  if (!permitePeticion(user.id)) return fallo(429, "demasiadas_peticiones");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallo(503, "sin_clave");

  const modelo = MODELOS[nivel];
  const etiqueta = nombreModelo(modelo);

  const contents = entradas.slice(-HISTORIAL_MAX).map((m) => ({
    role: m.rol === "kairo" ? "model" : "user",
    parts: [{ text: String(m.texto ?? "").slice(0, 12000) }],
  }));

  const codificador = new TextEncoder();
  const stream = new ReadableStream({
    async start(controlador) {
      const enviar = (dato: unknown) =>
        controlador.enqueue(codificador.encode(`${JSON.stringify(dato)}\n`));

      // Lo primero, decirle al cliente qué modelo está trabajando:
      // es lo que pinta la etiqueta bajo "Pensando…".
      enviar({ t: "meta", modelo: etiqueta, nivel });

      let cobrado = false;
      let algoEscrito = false;

      try {
        const ia = new GoogleGenAI({ apiKey });
        const config = {
          systemInstruction: construirPrompt({
            modoEdad: perfil.modo_edad,
            tono: perfil.tono ?? "cercano",
            nombre: perfil.nombre || undefined,
            nivel,
          }),
          safetySettings: ajustesSeguridad(perfil.modo_edad),
          thinkingConfig: { thinkingBudget: RAZONAMIENTO[nivel] },
          maxOutputTokens: nivel === "mega" ? 8192 : 4096,
        };

        /* Abrir el flujo puede fallar por dos motivos que NO son culpa del
           usuario y que se arreglan solos:
             - el modelo ya no existe  -> se prueba con el alias estable
             - el modelo está saturado -> se espera un poco y se reintenta
           Reintentar aquí es seguro porque todavía no ha salido ni una
           palabra; si fallara a mitad del flujo, repetir duplicaría texto. */
        const esperas = [900, 2500];
        let respuesta;
        let usado = modelo;

        for (let intento = 0; ; intento++) {
          try {
            respuesta = await ia.models.generateContentStream({
              model: usado,
              contents,
              config,
            });
            break;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const tipo = clasificarError(msg);

            if (tipo === "modelo_no_existe" && usado !== MODELO_RESPALDO) {
              usado = MODELO_RESPALDO;
              enviar({ t: "meta", modelo: nombreModelo(usado), nivel });
              continue;
            }

            if (tipo === "sobrecargado" && intento < esperas.length) {
              await esperar(esperas[intento]);
              continue;
            }

            throw e;
          }
        }

        for await (const trozo of respuesta) {
          const texto = trozo.text;
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
        controlador.close();
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
