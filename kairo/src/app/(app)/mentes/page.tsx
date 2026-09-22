"use client";

import { useUi } from "@/lib/i18n";
import { Section } from "@/components/Section";
import { Brain, Plus } from "@/components/Icons";

const MENTES = {
  es: [
    { e: "📣", n: "Community manager", d: "Escribe mis publicaciones con mi tono de siempre" },
    { e: "⚖️", n: "Revisor de contratos", d: "Busca cláusulas abusivas y me las explica en claro" },
    { e: "📚", n: "Profe de Lucía", d: "Explica matemáticas de 4º sin dar la respuesta hecha" },
  ],
  en: [
    { e: "📣", n: "Community manager", d: "Writes my posts in my usual voice" },
    { e: "⚖️", n: "Contract reviewer", d: "Finds unfair clauses and explains them plainly" },
    { e: "📚", n: "Lucía's tutor", d: "Explains 4th-grade maths without giving the answer away" },
  ],
};

export default function MentesPage() {
  const { t, lang } = useUi();

  return (
    <Section
      icon={Brain}
      title={t("app.mentes")}
      lead={
        lang === "es"
          ? "Una Mente es tu propia IA especializada: le das instrucciones, un tono y unos archivos, y responde siempre igual. Es lo que otros llaman GPTs, pero sin tener que configurarlo cada vez."
          : "A Mind is your own specialised AI: give it instructions, a voice and some files, and it always answers the same way. It's what others call GPTs, without reconfiguring it every time."
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MENTES[lang].map((m) => (
          <div key={m.n} className="rounded-2xl border border-line bg-panel p-5">
            <span className="text-[24px]">{m.e}</span>
            <h2 className="mt-3 text-[15px] font-semibold">{m.n}</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{m.d}</p>
          </div>
        ))}

        <button className="grid min-h-[150px] place-items-center rounded-2xl border border-dashed border-line-hi p-5 text-muted transition hover:bg-panel hover:text-fg">
          <span className="text-center">
            <Plus className="mx-auto h-6 w-6" />
            <span className="mt-2 block text-[14px] font-medium">
              {lang === "es" ? "Crear Mente" : "Create a Mind"}
            </span>
          </span>
        </button>
      </div>
    </Section>
  );
}
