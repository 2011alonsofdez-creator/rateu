"use client";

import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* Estas páginas hay que escribirlas de verdad antes de lanzar.
   Están listadas en el checklist de la especificación. */
/* Cada bloque lleva su `id` desde el 01-11, porque hasta entonces los
   cuatro enlaces del pie apuntaban a `/legal` a secas y tres de los
   cuatro mentían sobre a dónde llevaban. Los `id` son los mismos en los
   dos idiomas a propósito: un enlace compartido no se rompe porque quien
   lo abra tenga la web en inglés. */
const BLOCKS = {
  es: [
    ["aviso", "Aviso legal", "Titular del servicio, datos de contacto y condiciones de uso."],
    ["privacidad", "Política de privacidad", "Qué datos se guardan, para qué, cuánto tiempo y cómo se borran. Incluye un apartado específico para perfiles de menores."],
    ["cookies", "Política de cookies", "Qué cookies se usan y cómo desactivarlas."],
    ["terminos", "Términos del servicio", "Planes, créditos, renovaciones, cancelaciones y límites de uso."],
  ],
  en: [
    ["aviso", "Legal notice", "Service owner, contact details and terms of use."],
    ["privacidad", "Privacy policy", "What data is stored, why, for how long and how it is deleted. Includes a dedicated section for child profiles."],
    ["cookies", "Cookie policy", "Which cookies are used and how to disable them."],
    ["terminos", "Terms of service", "Plans, credits, renewals, cancellations and usage limits."],
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
            {BLOCKS[lang].map(([id, title, desc]) => (
              <div
                key={id}
                id={id}
                className="scroll-mt-24 rounded-2xl border border-line bg-panel p-5"
              >
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
