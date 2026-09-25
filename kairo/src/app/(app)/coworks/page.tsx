"use client";

import { useUi } from "@/lib/i18n";
import { Section } from "@/components/Section";
import { Clock, Plus } from "@/components/Icons";
import { BotonAunNo } from "@/components/AunNo";

const COWORKS = {
  es: [
    { n: "Plan de la semana", c: "Lunes a las 8:00", d: "Revisa el correo, resume lo urgente y prepara el plan", on: true },
    { n: "Vigilar la conversión", c: "Martes a las 21:00", d: "Avisa si la conversión del día baja del 1,5%", on: true },
    { n: "Resumen de facturas", c: "Día 1 de cada mes", d: "Junta las facturas del mes en una hoja de cálculo", on: false },
  ],
  en: [
    { n: "Weekly plan", c: "Mondays at 8:00", d: "Checks email, summarises what's urgent and drafts the plan", on: true },
    { n: "Conversion watch", c: "Tuesdays at 21:00", d: "Alerts if today's conversion drops below 1.5%", on: true },
    { n: "Invoice roundup", c: "1st of each month", d: "Collects the month's invoices into a spreadsheet", on: false },
  ],
};

export default function CoworksPage() {
  const { t, lang } = useUi();

  return (
    <Section
      icon={Clock}
      title={t("app.coworks")}
      lead={
        lang === "es"
          ? "Un Co-Work es un trabajo que Kairo ejecuta solo a la hora que le digas, estés o no delante. Es lo que hace a Kairo distinto de cualquier otro chat."
          : "A Co-Work is a job Kairo runs on its own at the time you set, whether you're there or not. It's what makes Kairo different from any other chat."
      }
    >
      <div className="space-y-3">
        {COWORKS[lang].map((c) => (
          <div
            key={c.n}
            className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${c.on ? "bg-green" : "bg-faint"}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-medium">{c.n}</h2>
              <p className="mt-0.5 truncate text-[13px] text-muted">{c.d}</p>
            </div>
            <span className="hidden shrink-0 rounded-lg border border-line px-2.5 py-1 font-mono text-[12px] text-faint sm:block">
              {c.c}
            </span>
            <span
              className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition ${
                c.on ? "brand-grad" : "bg-panel-hi"
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-bg transition ${c.on ? "translate-x-4" : ""}`}
              />
            </span>
          </div>
        ))}

        <BotonAunNo
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-hi p-4 text-[14px] font-medium text-muted transition hover:bg-panel hover:text-fg"
          titulo={lang === "es" ? "Nuevo Co-Work" : "New Co-Work"}
          explica={
            lang === "es"
              ? "Un Co-Work es un encargo con hora: cada lunes a las 8, o todas las noches. Kairo lo hace solo mientras tú no estás y te deja el resultado esperándote."
              : "A Co-Work is a job with a time on it: every Monday at 8, or every night. Kairo does it on its own while you are away and leaves the result waiting for you."
          }
          mientras={
            lang === "es"
              ? "Hoy hay que pedírselo tú en el chat, pero la respuesta es la misma."
              : "Today you have to ask for it in the chat, but the answer is the same."
          }
          enlace="/chat"
          enlaceTexto={lang === "es" ? "Ir al chat" : "Go to the chat"}
        >
          <Plus className="h-4 w-4" />
          {lang === "es" ? "Nuevo Co-Work" : "New Co-Work"}
        </BotonAunNo>
      </div>
    </Section>
  );
}
