import { clienteServidor } from "./supabase/server";
import { hasSupabase } from "./supabase/config";
import type { Conversacion, MensajeGuardado } from "./tipos";

/* Lectura del historial. Solo servidor: usa cookies.
   Ninguna consulta filtra por usuario, y no hace falta: la seguridad a
   nivel de fila ya devuelve solo lo tuyo. */

/** Las conversaciones de quien está usando la app, la más reciente primero. */
export async function listarConversaciones(): Promise<Conversacion[]> {
  if (!hasSupabase) return [];

  try {
    const supabase = await clienteServidor();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("conversaciones")
      .select("id, titulo, mente_id, actualizada_el")
      .order("actualizada_el", { ascending: false })
      .limit(60);

    if (error || !data) return [];

    return data.map((c) => ({
      id: c.id as string,
      titulo: (c.titulo as string) || "",
      menteId: (c.mente_id as string | null) ?? null,
      actualizadaEl: c.actualizada_el as string,
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
    const { data: conv } = await supabase
      .from("conversaciones")
      .select("id, titulo, mente_id, actualizada_el")
      .eq("id", id)
      .maybeSingle();

    if (!conv) return null;

    const { data: filas } = await supabase
      .from("mensajes")
      .select("id, rol, contenido, modelo_usado, nivel, creditos_gastados")
      .eq("conversacion_id", id)
      .order("creado_el", { ascending: true })
      .limit(400);

    return {
      conversacion: {
        id: conv.id as string,
        titulo: (conv.titulo as string) || "",
        menteId: (conv.mente_id as string | null) ?? null,
        actualizadaEl: conv.actualizada_el as string,
      },
      mensajes: (filas ?? []).map((m) => ({
        id: m.id as string,
        rol: m.rol as "user" | "kairo",
        contenido: (m.contenido as string) || "",
        modelo: (m.modelo_usado as string | null) ?? null,
        nivel: (m.nivel as string | null) ?? null,
        creditos: (m.creditos_gastados as number) ?? 0,
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
