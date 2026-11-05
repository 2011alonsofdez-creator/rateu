import type { Metadata } from "next";
import { PreciosContenido } from "./contenido";
import { plans } from "@/lib/mock";
import { CREDITOS_PLAN } from "@/lib/planes";

/* LA PÁGINA DONDE SE DECIDE PAGAR SALÍA EN GOOGLE CON EL TÍTULO DE LA
 * PORTADA.
 *
 * Hasta el 05-11, `/precios` empezaba por `"use client"`, y Next no deja
 * exportar `metadata` de un componente de cliente. Resultado: en el
 * buscador salía como "Kairo — La IA que trabaja cuando tú no", igual que
 * la portada, con la descripción de la portada, y encima está en el
 * `sitemap.xml` con prioridad 0,8. El checklist lo llevaba en 🟡 desde el
 * 29-10 y el radar lo pidió el 04-11.
 *
 * El arreglo es el patrón que ya usaban las cinco páginas de intención y,
 * desde ayer, `/legal/cookies`: la página es de servidor y solo tiene los
 * metadatos; el cuerpo vive en `contenido.tsx` con su `"use client"`.
 *
 * Y las cifras NO van escritas a mano, que es la regla de la casa desde el
 * 30-10: el precio de los dos planes sale de `plans` (`lib/mock.ts`), que
 * es de donde lo saca la propia página, y los créditos del plan gratuito de
 * `CREDITOS_PLAN`. Si mañana cambia un precio, cambia también lo que ve
 * Google, sin que nadie tenga que acordarse. Aquí eso importa más que en
 * ninguna otra página: un precio viejo en el resultado de búsqueda es una
 * promesa que la página de al lado desmiente. */

const PLUS = plans.find((p) => p.id === "plus");
const SUPREME = plans.find((p) => p.id === "supreme");

/** 9,99 con coma, que es como se escribe en español y como lo pinta la página. */
function euros(n: number | undefined): string {
  return n === undefined ? "" : n.toFixed(2).replace(".", ",");
}

export const metadata: Metadata = {
  title: "Precios de Kairo — plan gratis, Kairo+ y Supreme",
  description: `${CREDITOS_PLAN.free} créditos gratis cada día sin tarjeta. Kairo+ por ${euros(PLUS?.monthly)} €/mes y Supreme por ${euros(SUPREME?.monthly)} €/mes, o paquetes de créditos que no caducan. Qué es un crédito, qué pasa si se acaban y qué se guarda de lo que le mandas.`,
  alternates: { canonical: "/precios" },
  openGraph: {
    title: "Precios de Kairo",
    description: `${CREDITOS_PLAN.free} créditos gratis al día, Kairo+ desde ${euros(PLUS?.monthly)} € al mes y créditos sueltos que no caducan.`,
    url: "/precios",
    type: "website",
  },
};

export default function PreciosPage() {
  return <PreciosContenido />;
}
