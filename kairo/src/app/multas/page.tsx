import type { Metadata } from "next";
import { MultasContenido } from "./contenido";

/* La primera página de intención de Kairo.
 *
 * Existe por un hallazgo del 17-10: Kairo tenía tres páginas públicas
 * —/, /precios y /legal— y ninguna respondía a nadie que estuviera
 * buscando su problema. Quien acaba de recibir una multa no busca "IA
 * en español": busca "me ha llegado una multa, qué hago", y ahí
 * contestaba un competidor con una página por trámite.
 *
 * Por eso es un componente de servidor y no un "use client" como
 * /precios: lo que hace útil a esta página es su propio title y su
 * propia descripción, y esos no se pueden exportar desde un cliente.
 * El texto bilingüe vive en ./contenido.tsx, que sí es cliente.
 *
 * Y una regla que esta página NO se salta: no da plazos de memoria.
 * Las guías ni siquiera coinciden en si los 20 días del recurso son
 * naturales o hábiles, así que el único plazo bueno es el que viene
 * escrito en la notificación de cada uno. La página lo dice en voz
 * alta, porque prometer un plazo y equivocarse aquí le cuesta dinero
 * a quien nos cree. */
export const metadata: Metadata = {
  title: "Me ha llegado una multa, ¿qué hago? — Kairo la lee por ti",
  description:
    "Sube la foto de la multa y Kairo te dice qué te reclaman, cuánto, para cuándo según tu propia notificación y qué pasa si no haces nada. En español y en un minuto.",
  alternates: { canonical: "/multas" },
  openGraph: {
    title: "Me ha llegado una multa, ¿qué hago?",
    description:
      "Kairo lee tu multa y te dice qué te reclaman, cuánto, para cuándo y qué pasa si no haces nada.",
    url: "/multas",
    type: "article",
  },
};

export default function MultasPage() {
  return <MultasContenido />;
}
