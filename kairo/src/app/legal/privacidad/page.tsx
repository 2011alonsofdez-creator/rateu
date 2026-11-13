import type { Metadata } from "next";
import { PrivacidadContenido } from "./contenido";

/* EL SEGUNDO DE LOS CUATRO DOCUMENTOS LEGALES.
 *
 * El primero fue la política de cookies (04-11). Este es el que más falta
 * hacía de los tres que quedaban, y por dos motivos que no son de opinión:
 *
 *   1. Kairo lee multas, cartas de Hacienda y contratos. Son papeles con el
 *      nombre, la dirección y a veces el DNI de alguien. "¿Y esto dónde
 *      acaba?" es la pregunta que decide si suben el papel o no.
 *   2. El bloque PRIVACIDAD del prompt manda a Kairo decir, cuando alguien
 *      pregunta qué se hace con sus datos, que "está en los textos legales".
 *      Hasta hoy mandaba a leer un documento que no existía.
 *
 * Por qué se ha podido escribir sin esperar a los datos del titular: porque
 * el grueso de una política de privacidad no es la identificación, es QUÉ SE
 * GUARDA, y eso está en el código y está medido. Lo que falta del titular
 * sale en su propio apartado, diciendo exactamente qué falta, igual que en la
 * de cookies. Un titular inventado en un documento legal es peor que un
 * apartado que dice que falta.
 *
 * `robots: index`: una política de privacidad es pública y que se encuentre
 * es parte de para qué existe. */
export const metadata: Metadata = {
  title: "Política de privacidad — Kairo",
  description:
    "Qué datos guarda Kairo y cuáles no, con el archivo y la línea donde se comprueba cada cosa: de un papel se guarda lo leído y el nombre, no el archivo; las conversaciones se guardan; la memoria solo guarda lo que le pides.",
  alternates: { canonical: "/legal/privacidad" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Política de privacidad de Kairo",
    description:
      "Lo que se guarda, lo que no, con quién se comparte y lo que todavía no se puede afirmar. Escrito leyendo el código, no de memoria.",
    url: "/legal/privacidad",
    type: "article",
  },
};

export default function PrivacidadPage() {
  return <PrivacidadContenido />;
}
