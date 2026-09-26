"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";
import { TITULO_MAX, type ResultadoGasto, type ResultadoSimple } from "@/lib/tipos";
import { recortar } from "@/lib/texto";

/**
 * Descuenta créditos. La comprobación de saldo y el descuento ocurren
 * dentro de una única transacción en la base de datos, con la fila
 * bloqueada: dos pestañas a la vez no pueden gastar el mismo crédito.
 *
 * La función SQL deduce el perfil de la sesión, así que aquí no se pasa
 * ningún identificador de usuario. No hay forma de gastar los créditos
 * de otra persona ni manipulando la petición.
 */
export async function gastarCreditos(
  cantidad: number,
  motivo: string,
): Promise<ResultadoGasto> {
  const supabase = await clienteServidor();
  if (!supabase) return { ok: false, motivo: "demo" };

  const { data, error } = await supabase.rpc("gastar_creditos", {
    p_cantidad: cantidad,
    p_motivo: motivo,
  });

  if (error) {
    // P0002 es el código que lanza la función cuando no hay saldo.
    const sinSaldo =
      error.code === "P0002" || /insuficien/i.test(error.message ?? "");
    return {
      ok: false,
      motivo: sinSaldo ? "sin_creditos" : "error",
      mensaje: error.message,
    };
  }

  const fila = Array.isArray(data) ? data[0] : data;
  if (!fila) return { ok: false, motivo: "error", mensaje: "Respuesta vacía" };

  return {
    ok: true,
    creditos: fila.creditos ?? 0,
    creditosExtra: fila.creditos_extra ?? 0,
  };
}

/** Guarda las preferencias. Solo puede tocar nombre, tono e idioma:
 *  el permiso de la base de datos no le deja llegar a más columnas. */
export async function guardarAjustes(
  tono: string,
  idioma: string,
): Promise<ResultadoSimple> {
  const supabase = await clienteServidor();
  if (!supabase) return { ok: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensaje: "Sin sesión" };

  const { error } = await supabase
    .from("perfiles")
    .update({ tono, idioma })
    .eq("auth_id", user.id);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/ajustes");
  return { ok: true };
}

/** Fija la fecha de nacimiento y el modo de edad. La base de datos solo
 *  lo permite una vez: nadie puede subirse a modo adulto después. */
export async function completarPerfil(
  nombre: string,
  fecha: string,
): Promise<ResultadoSimple> {
  const supabase = await clienteServidor();
  if (!supabase) return { ok: true };

  const { error } = await supabase.rpc("completar_perfil", {
    p_nombre: nombre,
    p_fecha: fecha,
  });

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true };
}

export async function cerrarSesion() {
  const supabase = await clienteServidor();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Borra una conversación. Los mensajes se van con ella por la clave
 *  foránea en cascada, y la política de la tabla solo deja borrar las
 *  tuyas: pasar el identificador de otro no borra nada. */
export async function borrarConversacion(id: string): Promise<ResultadoSimple> {
  if (!UUID.test(id)) return { ok: false, mensaje: "id no válida" };

  const supabase = await clienteServidor();
  if (!supabase) return { ok: false, mensaje: "demo" };

  const { error } = await supabase.from("conversaciones").delete().eq("id", id);
  if (error) return { ok: false, mensaje: error.message };

  return { ok: true };
}

/** Cambia el nombre de una conversación. */
export async function renombrarConversacion(
  id: string,
  titulo: string,
): Promise<ResultadoSimple> {
  if (!UUID.test(id)) return { ok: false, mensaje: "id no válida" };

  const limpio = recortar(titulo.replace(/\s+/g, " "), TITULO_MAX);
  if (!limpio) return { ok: false, mensaje: "sin título" };

  const supabase = await clienteServidor();
  if (!supabase) return { ok: false, mensaje: "demo" };

  const { error } = await supabase
    .from("conversaciones")
    .update({ titulo: limpio })
    .eq("id", id);

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true };
}

/* Rehacer la conversación desde un punto.
 *
 * Es lo que hace falta para dos cosas que se piden solas: editar una
 * pregunta que has mandado con una errata, y volver a pedir una
 * respuesta que no te ha convencido. En los dos casos, lo que había de
 * ahí en adelante deja de valer, y dejarlo en la base de datos haría
 * que al reabrir la conversación aparecieran la pregunta vieja y la
 * nueva, una detrás de otra, como si hubieras preguntado dos veces.
 *
 * Borra ese mensaje y todos los posteriores. La seguridad a nivel de
 * fila solo deja tocar los de tus conversaciones, así que pasar el
 * identificador de otra persona no borra nada de nadie.
 */
export async function borrarDesde(
  conversacionId: string,
  mensajeId: string,
): Promise<ResultadoSimple> {
  if (!UUID.test(conversacionId) || !UUID.test(mensajeId)) {
    return { ok: false, mensaje: "id no válida" };
  }

  const supabase = await clienteServidor();
  if (!supabase) return { ok: false, mensaje: "demo" };

  /* Primero, cuándo se escribió ese mensaje. Se pide filtrando también
     por conversación: así, si el mensaje es de otra, no hay ni fecha
     desde la que borrar. */
  const { data: desde } = await supabase
    .from("mensajes")
    .select("creado_el")
    .eq("id", mensajeId)
    .eq("conversacion_id", conversacionId)
    .maybeSingle<{ creado_el: string }>();

  if (!desde) return { ok: false, mensaje: "no encontrado" };

  const { error } = await supabase
    .from("mensajes")
    .delete()
    .eq("conversacion_id", conversacionId)
    .gte("creado_el", desde.creado_el);

  if (error) return { ok: false, mensaje: error.message };
  return { ok: true };
}
