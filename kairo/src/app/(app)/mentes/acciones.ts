"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";
import { MENTE, type Mente, type ResultadoMente, type ResultadoSimple } from "@/lib/tipos";

/* Crear, editar y borrar Mentes.
 *
 * Todo lo que llega del navegador se recorta aquí antes de tocar la base
 * de datos, pero no porque eso sea la defensa: la defensa son los CHECK
 * de la tabla y la seguridad a nivel de fila. Esto solo evita que el
 * usuario se coma un error feo por pasarse tres caracteres.
 */

const COLUMNAS = "id, nombre, emoji, descripcion, instrucciones, tono";
const TONOS = ["cercano", "experto", "chispa", "breve"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EntradaMente = {
  id?: string | null;
  nombre: string;
  emoji: string;
  descripcion: string;
  instrucciones: string;
  tono: string | null;
};

/** Recorta por puntos de código, que es lo que cuenta PostgreSQL:
 *  un emoji no ocupa un carácter y cortar por bytes lo partiría. */
const recortar = (v: unknown, max: number) =>
  [...String(v ?? "").trim()].slice(0, max).join("");

export async function guardarMente(entrada: EntradaMente): Promise<ResultadoMente> {
  const supabase = await clienteServidor();
  if (!supabase) return { ok: false, motivo: "demo" };

  const campos = {
    nombre: recortar(entrada.nombre, MENTE.nombre),
    emoji: recortar(entrada.emoji, 8) || "🧠",
    descripcion: recortar(entrada.descripcion, MENTE.descripcion),
    instrucciones: recortar(entrada.instrucciones, MENTE.instrucciones),
    tono: TONOS.includes(entrada.tono ?? "") ? entrada.tono : null,
  };

  if (!campos.nombre) return { ok: false, motivo: "nombre" };
  if (!campos.instrucciones) return { ok: false, motivo: "instrucciones" };

  const editando = typeof entrada.id === "string" && UUID.test(entrada.id);

  // Editar. No hace falta comprobar de quién es: la política solo deja
  // tocar las tuyas, así que una id ajena no actualiza nada.
  if (editando) {
    const { data, error } = await supabase
      .from("mentes")
      .update(campos)
      .eq("id", entrada.id!)
      .select(COLUMNAS)
      .maybeSingle<Mente>();

    if (error || !data) return fallo(error?.message);
    revalidatePath("/mentes");
    return { ok: true, mente: data };
  }

  /* Crear. El perfil se pregunta a la base de datos en vez de deducirlo
     de la primera fila visible: un adulto con hijos a cargo ve más de un
     perfil, y la Mente tiene que quedar en el suyo. */
  const { data: perfilId } = await supabase.rpc("mi_perfil_id");
  if (!perfilId) return { ok: false, motivo: "sesion" };

  const { data, error } = await supabase
    .from("mentes")
    .insert({ perfil_id: perfilId, ...campos })
    .select(COLUMNAS)
    .maybeSingle<Mente>();

  if (error || !data) return fallo(error?.message);
  revalidatePath("/mentes");
  return { ok: true, mente: data };
}

export async function borrarMente(id: string): Promise<ResultadoSimple> {
  if (!UUID.test(id)) return { ok: false, mensaje: "id no válida" };

  const supabase = await clienteServidor();
  if (!supabase) return { ok: false, mensaje: "demo" };

  const { error } = await supabase.from("mentes").delete().eq("id", id);
  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/mentes");
  return { ok: true };
}

function fallo(mensaje?: string): ResultadoMente {
  if (mensaje && /máximo de Mentes|P0003/i.test(mensaje)) {
    return { ok: false, motivo: "limite" };
  }
  if (mensaje) console.error("[kairo] mentes:", mensaje);
  return { ok: false, motivo: "error", detalle: mensaje?.slice(0, 140) };
}
