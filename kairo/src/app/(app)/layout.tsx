import { redirect } from "next/navigation";
import { obtenerPerfil } from "@/lib/perfil";
import { listarConversaciones } from "@/lib/conversaciones";
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
  /* Las dos consultas salen a la vez: el historial no le cuesta espera
     a nadie, porque se pide mientras se pide el perfil. */
  const [perfil, conversaciones] = await Promise.all([
    obtenerPerfil(),
    listarConversaciones(),
  ]);

  if (!perfil) redirect("/entrar");

  // Quien entró con Google no dio fecha de nacimiento: hay que preguntarla
  // antes de dejarle usar nada, porque de ella depende la moderación.
  if (hasSupabase && !perfil.modoEdad) redirect("/bienvenida");

  return (
    <AppShell perfil={perfil} conversaciones={conversaciones}>
      {children}
    </AppShell>
  );
}
