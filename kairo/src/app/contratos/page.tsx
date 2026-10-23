import type { Metadata } from "next";
import { ContratosContenido } from "./contenido";

/* Tercera página de intención, misma estructura que /multas y
 * /cartas-de-hacienda: servidor para el title y la description, cliente
 * para el texto en dos idiomas.
 *
 * Esta se diferencia de las dos anteriores en una cosa, y le cambia el
 * tono entero: una multa y una carta de Hacienda ya han pasado, y lo
 * que queda es reaccionar. Un contrato NO ha pasado todavía: la persona
 * lo tiene delante sin firmar. Así que aquí lo útil no es explicar lo
 * que le han hecho, es decirle qué mirar ANTES, y eso es lo que ordena
 * la página.
 *
 * Y la misma regla de las otras dos: ni plazos ni importes de memoria,
 * y Kairo no dice si un contrato es bueno, malo o abusivo. Dice qué
 * pone y qué conviene mirar. */
export const metadata: Metadata = {
  title: "Entender un contrato sin abogado — Kairo te dice qué firmas",
  description:
    "Sube el contrato de alquiler, de trabajo o de un servicio y Kairo te dice qué firmas: cuánto pagas, cuánto dura, cómo se renueva y qué pasa si quieres irte. Antes de firmar.",
  alternates: { canonical: "/contratos" },
  openGraph: {
    title: "Entender un contrato sin abogado",
    description:
      "Kairo lee tu contrato y te dice qué firmas, qué cuesta y qué pasa si te quieres ir.",
    url: "/contratos",
    type: "article",
  },
};

export default function ContratosPage() {
  return <ContratosContenido />;
}
