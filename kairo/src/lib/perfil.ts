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

  const supabase = await clienteServidor();
  if (!supabase) return perfilDemo();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfiles")
    .select(
      "id, nombre, email, plan, creditos, creditos_extra, modo_edad, tono, idioma, renueva_el",
    )
    .eq("auth_id", user.id)
    .maybeSingle<FilaPerfil>();

  // El disparador crea el perfil al registrarse. Si por lo que sea aún no
  // está, devolvemos null y la app manda a completar el registro.
  if (error || !data) return null;

  return {
    id: data.id,
    nombre: data.nombre || user.email?.split("@")[0] || "",
    email: data.email || user.email || "",
    plan: data.plan ?? "free",
    creditos: data.creditos ?? 0,
    creditosExtra: data.creditos_extra ?? 0,
    modoEdad: data.modo_edad,
    tono: data.tono ?? "cercano",
    idioma: data.idioma ?? "es",
    renuevaEl: data.renueva_el,
    demo: false,
  };
}
