import { clienteServidor } from "./supabase/server";
import { hasSupabase } from "./supabase/config";
import { busquedasDesdeJson, fuentesDesdeJson } from "./ia/grounding";
import { faltaColumna } from "./supabase/compat";
import type { Conversacion, MensajeGuardado } from "./tipos";

/* Lectura del historial. Solo servidor: usa cookies.
   Ninguna consulta filtra por usuario, y no hace falta: la seguridad a
   nivel de fila ya devuelve solo lo tuyo. */

/* Qué sabe hacer todavía la base de datos.
 *
 * Cada una de estas banderas es una migración que puede estar sin
 * ejecutar. Se averigua a la primera consulta que falle y no se vuelve
 * a preguntar: a partir de ahí se pide solo lo que existe.
 * La alternativa era lo que pasaba antes: pedir `actualizada_el` sin
 * tener la migración 0005 hace fallar la consulta entera, y la barra
 * lateral se queda vacía como si no tuvieras ninguna conversación
 * guardada. Las tenías; no se podían leer. */
let columnasDeFuentes = true; // 0007
let columnaDeActividad = true; // 0005

/** Las conversaciones de quien está usando la app, la más reciente primero. */
export async function listarConversaciones(): Promise<Conversacion[]> {
  if (!hasSupabase) return [];

  try {
    const supabase = await clienteServidor();
    if (!supabase) return [];

    const conActividad = () =>
      supabase
        .from("conversaciones")
        .select("id, titulo, mente_id, actualizada_el")
        .order("actualizada_el", { ascending: false })
        .limit(60);

    /* Sin la migración 0005 no existe `actualizada_el`. Se ordena
       entonces por cuándo se creó cada una: no es lo ideal (una vieja
       que retomas hoy no sube), pero es infinitamente mejor que no
       enseñar ninguna. */
    const porFechaDeCreacion = () =>
      supabase
        .from("conversaciones")
        .select("id, titulo, mente_id, creada_el")
        .order("creada_el", { ascending: false })
        .limit(60);

    let { data, error } = columnaDeActividad ? await conActividad() : await porFechaDeCreacion();

    if (error && columnaDeActividad && faltaColumna(error)) {
      columnaDeActividad = false;
      console.warn("[kairo] falta la migración 0005: las conversaciones se ordenan por fecha de creación");
      ({ data, error } = await porFechaDeCreacion());
    }

    if (error || !data) return [];

    return (data as unknown as Record<string, unknown>[]).map((c) => ({
      id: c.id as string,
      titulo: (c.titulo as string) || "",
      menteId: (c.mente_id as string | null) ?? null,
      actualizadaEl: (c.actualizada_el ?? c.creada_el) as string,
    }));
  } catch {
    return [];
  }
}

/** Una conversación con todos sus mensajes, o null si no es tuya. */
export async function leerConversacion(
  id: string,
): Promise<{ conversacion: Conversacion; mensajes: MensajeGuardado[] } | null> {
  if (!hasSupabase) return null;

  try {
    const supabase = await clienteServidor();
    if (!supabase) return null;

    // Si la conversación es de otro, RLS no devuelve fila y aquí se acaba.
    const cabecera = (columnas: string) =>
      supabase.from("conversaciones").select(columnas).eq("id", id).maybeSingle();

    let { data: conv, error: errorConv } = await cabecera(
      columnaDeActividad ? "id, titulo, mente_id, actualizada_el" : "id, titulo, mente_id, creada_el",
    );

    if (errorConv && columnaDeActividad && faltaColumna(errorConv)) {
      columnaDeActividad = false;
      ({ data: conv } = await cabecera("id, titulo, mente_id, creada_el"));
    }

    if (!conv) return null;
    const c = conv as unknown as Record<string, unknown>;

    const mensajesDe = (columnas: string) =>
      supabase
        .from("mensajes")
        .select(columnas)
        .eq("conversacion_id", id)
        .order("creado_el", { ascending: true })
        .limit(400);

    const BASE = "id, rol, contenido, modelo_usado, nivel, creditos_gastados";

    /* Si la migración 0007 no está puesta, pedir las columnas de las
       fuentes hace fallar la consulta entera y la conversación saldría
       vacía. Se pregunta una vez, y si no están se sigue sin ellas: una
       conversación sin fuentes se lee; una conversación en blanco, no. */
    let { data: filas, error } = columnasDeFuentes
      ? await mensajesDe(`${BASE}, fuentes, busquedas`)
      : await mensajesDe(BASE);

    /* Solo se rinde si el fallo es por las columnas. Un corte de red no
       puede dejar las fuentes apagadas hasta el siguiente reinicio. */
    if (error && columnasDeFuentes && faltaColumna(error)) {
      columnasDeFuentes = false;
      ({ data: filas } = await mensajesDe(BASE));
    }

    return {
      conversacion: {
        id: c.id as string,
        titulo: (c.titulo as string) || "",
        menteId: (c.mente_id as string | null) ?? null,
        actualizadaEl: (c.actualizada_el ?? c.creada_el) as string,
      },
      mensajes: ((filas ?? []) as unknown as Record<string, unknown>[]).map((m) => ({
        id: m.id as string,
        rol: m.rol as "user" | "kairo",
        contenido: (m.contenido as string) || "",
        modelo: (m.modelo_usado as string | null) ?? null,
        nivel: (m.nivel as string | null) ?? null,
        creditos: (m.creditos_gastados as number) ?? 0,
        fuentes: fuentesDesdeJson(m.fuentes),
        busquedas: busquedasDesdeJson(m.busquedas),
      })),
    };
  } catch {
    return null;
  }
}

/** Título a partir del primer mensaje. Es lo que verás en la lista, así
 *  que se corta por palabra entera y no a mitad de una.
 *
 *  El recorte va por puntos de código y no por posiciones de la cadena:
 *  un emoji ocupa dos, y cortar por la mitad deja medio carácter roto
 *  que PostgreSQL ni siquiera acepta. */
export function tituloDesde(texto: string, max = 60): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (!limpio) return "Chat";

  const letras = [...limpio];
  if (letras.length <= max) return limpio;

  const corte = letras.slice(0, max).join("");
  const espacio = corte.lastIndexOf(" ");
  return (espacio > max * 0.6 ? corte.slice(0, espacio) : corte) + "…";
}
