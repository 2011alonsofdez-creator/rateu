import type { Metadata } from "next";
import { CartasContenido } from "./contenido";

/* Segunda página de intención, hermana de /multas y con la misma
 * estructura: servidor para el title y la description, cliente para el
 * texto en dos idiomas.
 *
 * Esta pesa más que la de multas por un motivo: una multa da miedo y se
 * entiende; una carta de Hacienda da miedo y NO se entiende, y la
 * diferencia entre los tres tipos que existen —te piden un papel, te
 * reclaman un importe, o solo te avisan— cambia por completo lo que hay
 * que hacer. Esa es la pregunta que trae a alguien aquí.
 *
 * Y la misma regla que /multas, por lo mismo: ningún plazo de memoria.
 * El plazo bueno es el que viene en la carta de cada uno, y quien lo
 * confirma es la Agencia Tributaria. */
export const metadata: Metadata = {
  title: "Me ha llegado una carta de Hacienda, ¿qué significa? — Kairo",
  description:
    "Sube la carta y Kairo te dice cuál de los tres tipos es, qué te piden, cuánto, para cuándo según tu propia carta y qué pasa si no contestas.",
  alternates: { canonical: "/cartas-de-hacienda" },
  openGraph: {
    title: "Me ha llegado una carta de Hacienda, ¿qué significa?",
    description:
      "Kairo lee tu carta y te dice de qué tipo es, qué te piden y para cuándo.",
    url: "/cartas-de-hacienda",
    type: "article",
  },
};

export default function CartasDeHaciendaPage() {
  return <CartasContenido />;
}
