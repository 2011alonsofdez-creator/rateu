"use client";

import { useEffect, useState } from "react";
import { clienteNavegador } from "./supabase/client";

/* EL HISTORIAL DE CODE.
 *
 * Las apps se guardan en Supabase (tabla `apps_code`, migración 0024)
 * desde el propio navegador: la seguridad la pone la base de datos, que
 * solo deja tocar las tuyas.
 *
 * Si la tabla todavía no existe —la migración sin pegar— o estás en
 * modo demo, nada de esto rompe Code: la lista sale vacía y guardar no
 * hace nada. */

export type AppCode = {
  id: string;
  titulo: string;
  actualizadaEl: string;
};

export type AppCodeEntera = AppCode & { peticion: string; codigo: string };

/* La barra lateral y la pantalla de Code no se ven entre ellas: cuando
   se guarda o se borra una app, se avisa con este evento y la barra
   vuelve a pedir la lista. */
const EVENTO = "kairo-apps-code";
const avisar = () => window.dispatchEvent(new Event(EVENTO));

/** El título: la primera frase de lo que se pidió, recortada. */
export function tituloDe(peticion: string): string {
  const limpio = peticion.replace(/\s+/g, " ").trim();
  const frase = limpio.split(/(?<=[.!?])\s/)[0] || limpio;
  const corto = frase.length > 60 ? `${frase.slice(0, 57).trimEnd()}…` : frase;
  return corto || "App sin nombre";
}

export async function listarApps(): Promise<AppCode[]> {
  const sb = clienteNavegador();
  if (!sb) return [];
  const { data, error } = await sb
    .from("apps_code")
    .select("id, titulo, actualizada_el")
    .order("actualizada_el", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map((f) => ({ id: f.id, titulo: f.titulo, actualizadaEl: f.actualizada_el }));
}

export async function cargarApp(id: string): Promise<AppCodeEntera | null> {
  const sb = clienteNavegador();
  if (!sb) return null;
  const { data, error } = await sb
    .from("apps_code")
    .select("id, titulo, peticion, codigo, actualizada_el")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    titulo: data.titulo,
    peticion: data.peticion,
    codigo: data.codigo,
    actualizadaEl: data.actualizada_el,
  };
}

/** Guarda una app nueva (sin `id`) o la pisa (con `id`). Devuelve su id,
 *  o null si no se ha podido. */
export async function guardarApp(app: {
  id?: string;
  peticion: string;
  codigo: string;
}): Promise<string | null> {
  const sb = clienteNavegador();
  if (!sb) return null;

  if (app.id) {
    const { error } = await sb
      .from("apps_code")
      .update({ codigo: app.codigo, actualizada_el: new Date().toISOString() })
      .eq("id", app.id);
    if (error) return null;
    avisar();
    return app.id;
  }

  const { data, error } = await sb
    .from("apps_code")
    .insert({ titulo: tituloDe(app.peticion), peticion: app.peticion, codigo: app.codigo })
    .select("id")
    .maybeSingle();
  if (error || !data) return null;
  avisar();
  return data.id as string;
}

export async function renombrarApp(id: string, titulo: string): Promise<boolean> {
  const limpio = titulo.replace(/\s+/g, " ").trim().slice(0, 80);
  const sb = clienteNavegador();
  if (!sb || !limpio) return false;
  const { error } = await sb.from("apps_code").update({ titulo: limpio }).eq("id", id);
  if (!error) avisar();
  return !error;
}

export async function borrarApp(id: string): Promise<boolean> {
  const sb = clienteNavegador();
  if (!sb) return false;
  const { error } = await sb.from("apps_code").delete().eq("id", id);
  if (!error) avisar();
  return !error;
}

/** La lista, viva: se vuelve a pedir cada vez que algo cambia. */
export function useAppsCode(activo: boolean): AppCode[] {
  const [apps, setApps] = useState<AppCode[]>([]);
  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const pedir = () => listarApps().then((a) => vivo && setApps(a));
    pedir();
    window.addEventListener(EVENTO, pedir);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO, pedir);
    };
  }, [activo]);
  return apps;
}
