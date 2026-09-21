"use client";

import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* Estas páginas hay que escribirlas de verdad antes de lanzar.
   Están listadas en el checklist de la especificación. */
const BLOCKS = {
  es: [
    ["Aviso legal", "Titular del servicio, datos de contacto y condiciones de uso."],
    ["Política de privacidad", "Qué datos se guardan, para qué, cuánto tiempo y cómo se borran. Incluye un apartado específico para perfiles de menores."],
    ["Política de cookies", "Qué cookies se usan y cómo desactivarlas."],
    ["Términos del servicio", "Planes, créditos, renovaciones, cancelaciones y límites de uso."],
  ],
  en: [
    ["Legal notice", "Service owner, contact details and terms of use."],
    ["Privacy policy", "What data is stored, why, for how long and how it is deleted. Includes a dedicated section for child profiles."],
    ["Cookie policy", "Which cookies are used and how to disable them."],
    ["Terms of service", "Plans, credits, renewals, cancellations and usage limits."],
  ],
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
          <p className="mt-3 text-[15px] text-muted">
            {lang === "es"
              ? "Pendiente de redactar antes del lanzamiento. Estos son los cuatro documentos necesarios."
              : "To be written before launch. These are the four required documents."}
          </p>

          <div className="mt-8 space-y-4">
            {BLOCKS[lang].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-line bg-panel p-5">
                <h2 className="text-[16px] font-semibold">{title}</h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
