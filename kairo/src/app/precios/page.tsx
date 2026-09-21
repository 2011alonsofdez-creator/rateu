"use client";

import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";

const FAQ = {
  es: [
    {
      q: "¿Qué es un crédito?",
      a: "La unidad con la que se mide lo que gastas. Un mensaje rápido cuesta 1 crédito, uno normal 4, y un Mega-Prompt 120. Siempre ves el coste antes de pulsar enviar.",
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
      a: "Sí, creando un perfil hijo desde tu cuenta de adulto. Tú decides las restricciones y puedes ver lo que hace. Un menor no puede abrirse cuenta por su cuenta.",
    },
    {
      q: "¿Se usan mis conversaciones para entrenar modelos?",
      a: "No. Y en los perfiles de menores, además, se guardan los datos mínimos imprescindibles.",
    },
  ],
  en: [
    {
      q: "What is a credit?",
      a: "The unit that measures your usage. A fast message costs 1 credit, a normal one 4, and a Mega-Prompt 120. You always see the cost before you hit send.",
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
      a: "Yes, by creating a child profile from your adult account. You set the restrictions and can see what they do. A minor cannot open an account on their own.",
    },
    {
      q: "Are my conversations used to train models?",
      a: "No. And on child profiles we additionally store only the bare minimum of data.",
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
