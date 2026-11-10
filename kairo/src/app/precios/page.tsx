"use client";

import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import { CREDITOS_NIVEL } from "@/lib/planes";

const FAQ = {
  es: [
    {
      q: "¿Qué es un crédito?",
      a: `La unidad con la que se mide lo que gastas. Un mensaje rápido cuesta ${CREDITOS_NIVEL.fast} créditos, uno normal ${CREDITOS_NIVEL.normal}, y un Mega-Prompt ${CREDITOS_NIVEL.mega}. Siempre ves el coste antes de pulsar enviar.`,
    },
    {
      q: "¿Qué pasa si me quedo sin créditos?",
      a: "Kairo deja de responder hasta que se renueven. En el plan Free se renuevan cada día; en los de pago, cada mes. También puedes comprar un pack, y esos no caducan.",
    },
    {
      q: "¿Puedo cancelar cuando quiera?",
      a: "Sí, desde Ajustes, en dos clics. Sigues teniendo el plan hasta que termine el periodo que ya has pagado.",
    },
    {
      q: "¿Mis hijos pueden usarlo?",
      a: "De 13 a 17 años sí: se registran con su fecha de nacimiento real y Kairo les aplica una moderación bastante más estricta que la de un adulto. Por debajo de 13 todavía no — los perfiles que crea y supervisa un adulto están en camino, y mientras no estén preferimos decirlo a prometerlo.",
    },
    {
      q: "¿Se usan mis conversaciones para entrenar modelos?",
      a: "No. Ni las tuyas ni las de nadie, y tampoco se venden.",
    },
  ],
  en: [
    {
      q: "What is a credit?",
      a: `The unit that measures your usage. A fast message costs ${CREDITOS_NIVEL.fast} credits, a normal one ${CREDITOS_NIVEL.normal}, and a Mega-Prompt ${CREDITOS_NIVEL.mega}. You always see the cost before you hit send.`,
    },
    {
      q: "What happens if I run out of credits?",
      a: "Kairo stops replying until they reset. On Free they reset daily; on paid plans, monthly. You can also buy a pack, and those never expire.",
    },
    {
      q: "Can I cancel any time?",
      a: "Yes, from Settings, in two clicks. You keep your plan until the period you already paid for ends.",
    },
    {
      q: "Can my kids use it?",
      a: "Between 13 and 17, yes: they sign up with their real date of birth and Kairo applies considerably stricter moderation than an adult's. Under 13 not yet — profiles created and supervised by an adult are on the way, and until they exist we would rather say so than promise it.",
    },
    {
      q: "Are my conversations used to train models?",
      a: "No. Not yours, not anyone's, and they are not sold either.",
    },
  ],
};

export default function PreciosPage() {
  const { t, lang } = useUi();

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-[36px] font-bold tracking-tight sm:text-[46px]">
              {t("pricing.title")}
            </h1>
            <p className="mt-4 text-[16px] text-muted">{t("pricing.sub")}</p>
          </div>

          <div className="mt-12">
            <PricingCards />
          </div>

          <div className="mx-auto mt-16 max-w-2xl">
            <div className="divide-y divide-line rounded-2xl border border-line bg-panel">
              {FAQ[lang].map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-[15px] font-medium marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-faint transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
