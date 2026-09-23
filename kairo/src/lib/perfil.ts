import { clienteServidor } from "./supabase/server";
import { hasSupabase } from "./supabase/config";
import { user as demoUser } from "./mock";
import type { ModoEdad, Perfil, PlanId } from "./planes";

export type { ModoEdad, Perfil, PlanId } from "./planes";
export { CREDITOS_PLAN, NOMBRE_PLAN } from "./planes";

export function perfilDemo(): Perfil {
  return {
    id: "demo",
    nombre: demoUser.name,
    email: "demo@kairo.app",
    plan: "plus",
    creditos: demoUser.credits,
    creditosExtra: 0,
    modoEdad: "adulto",
    tono: "cercano",
    idioma: "es",
    renuevaEl: null,
    demo: true,
  };
}

type FilaPerfil = {
  id: string;
  nombre: string | null;
  email: string | null;
  plan: PlanId | null;
  creditos: number | null;
  creditos_extra: number | null;
  modo_edad: ModoEdad | null;
  tono: string | null;
  idioma: string | null;
  renueva_el: string | null;
};

/**
 * Perfil de quien está usando la app.
 * - Sin Supabase: perfil de ejemplo, para que la demo siga viva.
 * - Con Supabase y sin sesión: null (el proxy ya habrá redirigido).
 */
export async function obtenerPerfil(): Promise<Perfil | null> {
  if (!hasSupabase) return perfilDemo();

  try {
  const supabase = await clienteServidor();
  if (!supabase) return perfilDemo();

  // Igual que en /api/chat: una consulta en lugar de dos. RLS decide
  // qué fila se ve, así que preguntar "dame el perfil" ya es preguntar
  // "dame MI perfil".
  const { data, error } = await supabase
    .from("perfiles")
    .select(
      "id, nombre, email, plan, creditos, creditos_extra, modo_edad, tono, idioma, renueva_el",
    )
    .limit(1)
    .maybeSingle<FilaPerfil>();

  // El disparador crea el perfil al registrarse. Si por lo que sea aún no
  // está, devolvemos null y la app manda a completar el registro.
  if (error || !data) return null;

  return {
    id: data.id,
    nombre: data.nombre || data.email?.split("@")[0] || "",
    email: data.email || "",
    plan: data.plan ?? "free",
    creditos: data.creditos ?? 0,
    creditosExtra: data.creditos_extra ?? 0,
    modoEdad: data.modo_edad,
    tono: data.tono ?? "cercano",
    idioma: data.idioma ?? "es",
    renuevaEl: data.renueva_el,
    demo: false,
  };
  } catch {
    // Mejor mandar a la pantalla de entrar que enseñar un error 500.
    return null;
  }
}
