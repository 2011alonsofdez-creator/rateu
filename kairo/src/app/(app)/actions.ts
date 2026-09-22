"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";
import type { ResultadoGasto, ResultadoSimple } from "@/lib/tipos";

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
