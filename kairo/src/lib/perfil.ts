import { clienteServidor } from "./supabase/server";
import { miPerfil } from "@/lib/supabase/mi-perfil";
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

  /* Una consulta en lugar de dos, como en /api/chat. Lo que no vale es
     dar por hecho que solo vuelve una fila: la seguridad a nivel de fila
     deja ver el tuyo Y el de los hijos que tengas a cargo, así que con
     un hijo salían dos y cuál iba primera no lo decidía nadie. Esta es
     la que carga el nombre, el plan y el saldo de TODA la web: con mala
     suerte, un adulto entraba a Kairo con la cuenta de su hijo delante.
     `miPerfil` pide la tuya por su nombre. */
  const { perfil: data } = await miPerfil<FilaPerfil>(
    supabase,
    "id, nombre, email, plan, creditos, creditos_extra, modo_edad, tono, idioma, renueva_el",
  );

  // El disparador crea el perfil al registrarse. Si por lo que sea aún no
  // está, devolvemos null y la app manda a completar el registro.
  if (!data) return null;

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
