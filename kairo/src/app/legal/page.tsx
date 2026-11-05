import type { Metadata } from "next";
import { LegalContenido } from "./contenido";

/* El índice de los cuatro documentos legales. De servidor desde el 05-11,
 * para que tenga sus propios metadatos: hasta hoy salía en Google con el
 * título de la portada, como `/precios`.
 *
 * La descripción dice la verdad de hoy —uno de los cuatro escrito— en vez de
 * prometer los cuatro. Cuando se escriban los otros tres hay que cambiarla,
 * y es a propósito: una descripción que no se puede quedar vieja sin que
 * alguien lo note es mejor que una genérica que nunca hay que tocar. */
export const metadata: Metadata = {
  title: "Información legal — Kairo",
  description:
    "Los cuatro documentos legales de Kairo: aviso legal, política de privacidad, política de cookies y términos del servicio. La política de cookies ya está publicada; los otros tres, pendientes antes del lanzamiento.",
  alternates: { canonical: "/legal" },
  openGraph: {
    title: "Información legal de Kairo",
    description:
      "Aviso legal, privacidad, cookies y términos. La política de cookies ya está publicada.",
    url: "/legal",
    type: "website",
  },
};

export default function LegalPage() {
  return <LegalContenido />;
}
