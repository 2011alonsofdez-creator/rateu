"use client";

/* El cuerpo de `/legal`, tal cual estaba. La página (`page.tsx`) es ahora de
 * servidor y solo tiene los metadatos, que un componente de cliente no puede
 * exportar; esto es el contenido. Partido el 05-11, por lo mismo que
 * `/precios`: en Google salía con el título de la portada. */

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* Estas páginas hay que escribirlas de verdad antes de lanzar.
   Están listadas en el checklist de la especificación. */
/* Cada bloque lleva su `id` desde el 01-11, porque hasta entonces los
   cuatro enlaces del pie apuntaban a `/legal` a secas y tres de los
   cuatro mentían sobre a dónde llevaban. Los `id` son los mismos en los
   dos idiomas a propósito: un enlace compartido no se rompe porque quien
   lo abra tenga la web en inglés. */
/* El cuarto elemento es la página del documento, cuando existe. Desde el
   04-11 existe el de cookies: es el único de los cuatro que se puede
   redactar entero leyendo el código, sin datos del titular. Los otros
   tres siguen siendo una tarjeta con su descripción, y la tarjeta lo
   dice en vez de aparentar lo contrario. */
const BLOCKS: Record<"es" | "en", [string, string, string, string | null][]> = {
  es: [
    ["aviso", "Aviso legal", "Titular del servicio, datos de contacto y condiciones de uso.", null],
    ["privacidad", "Política de privacidad", "Qué datos se guardan y cuáles no, con quién se comparten, qué derechos tienes y qué no se puede afirmar todavía. Incluye un apartado específico para menores.", "/legal/privacidad"],
    ["cookies", "Política de cookies", "Qué cookies se usan, cuánto duran, qué guarda Kairo en tu navegador y cómo borrarlo.", "/legal/cookies"],
    ["terminos", "Términos del servicio", "Planes, créditos, renovaciones, cancelaciones y límites de uso.", null],
  ],
  en: [
    ["aviso", "Legal notice", "Service owner, contact details and terms of use.", null],
    ["privacidad", "Privacy policy", "What is stored and what is not, who else sees it, what rights you have and what cannot be claimed yet. Includes a dedicated section for minors.", "/legal/privacidad"],
    ["cookies", "Cookie policy", "Which cookies are used, how long they last, what Kairo stores in your browser and how to clear it.", "/legal/cookies"],
    ["terminos", "Terms of service", "Plans, credits, renewals, cancellations and usage limits.", null],
  ],
};

const TEXTOS = {
  es: {
    lead: "De los cuatro documentos necesarios ya están escritos dos: la política de cookies y la de privacidad. El aviso legal y los términos están pendientes de redactar antes del lanzamiento.",
    leer: "Leer el documento",
    pendiente: "Pendiente de redactar",
  },
  en: {
    lead: "Of the four required documents, two are written: the cookie policy and the privacy policy. The legal notice and the terms are still to be drafted before launch.",
    leer: "Read the document",
    pendiente: "Still to be drafted",
  },
};

export function LegalContenido() {
  const { lang } = useUi();

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[32px] font-bold tracking-tight">
            {lang === "es" ? "Información legal" : "Legal information"}
          </h1>
          <p className="mt-3 text-[15px] text-muted">{TEXTOS[lang].lead}</p>

          <div className="mt-8 space-y-4">
            {BLOCKS[lang].map(([id, title, desc, href]) => (
              <div
                key={id}
                id={id}
                className="scroll-mt-24 rounded-2xl border border-line bg-panel p-5"
              >
                <h2 className="text-[16px] font-semibold">{title}</h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{desc}</p>
                {href ? (
                  <Link
                    href={href}
                    className="mt-3 inline-block text-[13.5px] font-medium text-acento transition hover:underline"
                  >
                    {TEXTOS[lang].leer} →
                  </Link>
                ) : (
                  <p className="mt-3 text-[12.5px] uppercase tracking-wide text-faint">
                    {TEXTOS[lang].pendiente}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
