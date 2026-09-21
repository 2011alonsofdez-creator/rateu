"use client";

import { useUi } from "@/lib/i18n";
import { Section } from "@/components/Section";
import { Plug } from "@/components/Icons";

const SERVICES = [
  { e: "📁", n: "Google Drive", es: "Leer y crear documentos", en: "Read and create documents" },
  { e: "✉️", n: "Gmail", es: "Buscar y redactar correos", en: "Search and draft emails" },
  { e: "📅", n: "Google Calendar", es: "Ver la agenda y crear eventos", en: "See your agenda and create events" },
  { e: "🐙", n: "GitHub", es: "Leer repositorios y proponer cambios", en: "Read repos and propose changes" },
];

export default function ConectoresPage() {
  const { t, lang } = useUi();
  const es = lang === "es";

  return (
    <Section
      icon={Plug}
      title={t("app.connectors")}
      lead={
        es
          ? "Kairo trabaja con tus cosas de verdad, no con copias pegadas a mano. Tú decides qué conectas y puedes desconectarlo cuando quieras."
          : "Kairo works with your actual files, not pasted copies. You choose what to connect and can disconnect any time."
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <div
            key={s.n}
            className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-5"
          >
            <span className="text-[22px]">{s.e}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold">{s.n}</h2>
              <p className="mt-0.5 text-[13px] text-muted">{es ? s.es : s.en}</p>
            </div>
            <button className="shrink-0 rounded-lg border border-line-hi px-3 py-1.5 text-[13px] font-medium transition hover:bg-panel-hi">
              {es ? "Conectar" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}
