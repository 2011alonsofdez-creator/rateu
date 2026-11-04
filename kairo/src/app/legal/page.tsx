"use client";

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
    ["privacidad", "Política de privacidad", "Qué datos se guardan, para qué, cuánto tiempo y cómo se borran. Incluye un apartado específico para perfiles de menores.", null],
    ["cookies", "Política de cookies", "Qué cookies se usan, cuánto duran, qué guarda Kairo en tu navegador y cómo borrarlo.", "/legal/cookies"],
    ["terminos", "Términos del servicio", "Planes, créditos, renovaciones, cancelaciones y límites de uso.", null],
  ],
  en: [
    ["aviso", "Legal notice", "Service owner, contact details and terms of use.", null],
    ["privacidad", "Privacy policy", "What data is stored, why, for how long and how it is deleted. Includes a dedicated section for child profiles.", null],
    ["cookies", "Cookie policy", "Which cookies are used, how long they last, what Kairo stores in your browser and how to clear it.", "/legal/cookies"],
    ["terminos", "Terms of service", "Plans, credits, renewals, cancellations and usage limits.", null],
  ],
};

const TEXTOS = {
  es: {
    lead: "De los cuatro documentos necesarios, la política de cookies ya está escrita. Los otros tres están pendientes de redactar antes del lanzamiento.",
    leer: "Leer el documento",
    pendiente: "Pendiente de redactar",
  },
  en: {
    lead: "Of the four required documents, the cookie policy is written. The other three are still to be drafted before launch.",
    leer: "Read the document",
    pendiente: "Still to be drafted",
  },
};

export default function LegalPage() {
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
