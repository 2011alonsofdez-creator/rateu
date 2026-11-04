import type { Metadata } from "next";
import { CookiesContenido } from "./contenido";

/* El primero de los cuatro documentos legales que pide el checklist de
 * lanzamiento, y el único que se podía escribir entero sin pedirle datos
 * al dueño: lo que Kairo pone en el navegador está en el código y se
 * cuenta con los dedos.
 *
 * Esta página es de servidor y solo existe para tener `metadata`
 * propios: `/legal` es `"use client"` y por eso hereda los metadatos de
 * la portada, que es una de las cosas que el radar lleva pidiendo. El
 * texto vive en `contenido.tsx`, con sus dos idiomas y con la lista de
 * dónde sale cada dato.
 *
 * `robots: index` a propósito, al contrario que las páginas de dentro:
 * una política de cookies es pública y que se pueda encontrar es parte
 * de para qué existe. */
export const metadata: Metadata = {
  title: "Política de cookies — Kairo",
  description:
    "Kairo solo usa las cookies necesarias para mantener tu sesión: ni publicidad, ni analítica, ni cookies de terceros. Qué cookies hay, cuánto duran y cómo borrarlas.",
  alternates: { canonical: "/legal/cookies" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Política de cookies de Kairo",
    description:
      "Solo las cookies imprescindibles para mantener la sesión. Sin publicidad ni analítica, y por eso sin ventana de consentimiento.",
    url: "/legal/cookies",
    type: "article",
  },
};

export default function CookiesPage() {
  return <CookiesContenido />;
}
