import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/lib/perfil";
import { hasSupabase } from "@/lib/supabase/config";
import { AppShell } from "@/components/AppShell";

/* Componente de servidor: el perfil se carga aquí, antes de pintar nada.
   Así la barra lateral nunca parpadea con datos viejos y, sobre todo, el
   plan y los créditos salen de la base de datos y no de lo que diga el
   navegador. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await obtenerPerfil();

  if (!perfil) redirect("/entrar");

  // Quien entró con Google no dio fecha de nacimiento: hay que preguntarla
  // antes de dejarle usar nada, porque de ella depende la moderación.
  if (hasSupabase && !perfil.modoEdad) redirect("/bienvenida");

  return <AppShell perfil={perfil}>{children}</AppShell>;
}
