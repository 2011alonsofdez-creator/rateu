"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./config";

/* Cliente para el navegador. Devuelve null en modo demo para que quien
   lo use tenga que decidir explícitamente qué hacer sin Supabase. */
export function clienteNavegador() {
  if (!hasSupabase) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
