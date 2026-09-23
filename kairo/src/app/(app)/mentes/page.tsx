import { listarMentes } from "@/lib/mentes";
import { MentesCliente } from "./MentesCliente";

/* Componente de servidor: las Mentes se leen antes de pintar nada, así
   la página no parpadea con una lista vacía mientras carga. */
export default async function MentesPage() {
  const mentes = await listarMentes();
  return <MentesCliente inicial={mentes} />;
}
