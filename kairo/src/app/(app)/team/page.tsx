"use client";

import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { Section } from "@/components/Section";
import { Plus, Team } from "@/components/Icons";

/* Team es lo contrario de Mentes, aunque de lejos se parezcan.
   Una Mente cambia CÓMO responde Kairo. Un miembro del Team se encarga
   de UN trabajo concreto y recurrente: revisar contratos, perseguir
   facturas, contestar a clientes. Uno es una forma de hablar; el otro,
   un puesto. */
const FICHAS = {
  es: [
    {
      e: "⚖️",
      n: "Abogado",
      d: "Revisa contratos, señala cláusulas abusivas y te las explica sin latinajos",
      t: "Legal",
    },
    {
      e: "📊",
      n: "Contable",
      d: "Ordena facturas y gastos, y avisa de lo que hay que presentar y cuándo",
      t: "Negocio",
    },
    {
      e: "📞",
      n: "Comercial",
      d: "Contesta a los clientes, prepara presupuestos y hace seguimiento",
      t: "Negocio",
    },
    {
      e: "🗂️",
      n: "Administrativo",
      d: "Papeleo, formularios y plazos. Lo aburrido que nadie quiere hacer",
      t: "Oficina",
    },
  ],
  en: [
    {
      e: "⚖️",
      n: "Lawyer",
      d: "Reviews contracts, flags unfair clauses and explains them in plain words",
      t: "Legal",
    },
    {
      e: "📊",
      n: "Bookkeeper",
      d: "Sorts invoices and expenses, and warns you what is due and when",
      t: "Business",
    },
    {
      e: "📞",
      n: "Sales rep",
      d: "Answers customers, drafts quotes and follows them up",
      t: "Business",
    },
    {
      e: "🗂️",
      n: "Admin",
      d: "Paperwork, forms and deadlines. The dull part nobody wants",
      t: "Office",
    },
  ],
};

export default function TeamPage() {
  const { t, lang } = useUi();
  const perfil = usePerfil();
  const es = lang === "es";

  return (
    <Section
      icon={Team}
      title={t("app.team")}
      lead={
        es
          ? `Tu equipo, ${perfil.nombre || "el tuyo"}. Cada miembro se encarga de un trabajo concreto y lo hace siempre igual: un abogado que revisa tus contratos, un contable que ordena tus facturas, un comercial que contesta a tus clientes. Tú le dices de qué se ocupa y él se ocupa.`
          : `Your team, ${perfil.nombre || "yours"}. Each member owns one job and does it the same way every time: a lawyer who reviews your contracts, a bookkeeper who sorts your invoices, a sales rep who answers your customers. You say what they handle, and they handle it.`
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FICHAS[lang].map((f) => (
          <div key={f.n} className="rounded-2xl border border-line bg-panel p-5">
            <div className="flex items-start gap-3">
              <span className="text-[24px]">{f.e}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold">{f.n}</h2>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-faint">
                    {f.t}
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{f.d}</p>
              </div>
            </div>
          </div>
        ))}

        <button className="grid min-h-[120px] place-items-center rounded-2xl border border-dashed border-line-hi p-5 text-muted transition hover:bg-panel hover:text-fg sm:col-span-2">
          <span className="text-center">
            <Plus className="mx-auto h-6 w-6" />
            <span className="mt-2 block text-[14px] font-medium">
              {es ? "Contratar a alguien" : "Hire someone"}
            </span>
            <span className="mt-1 block text-[12.5px] text-faint">
              {es
                ? "Le pones nombre, le dices de qué se encarga y listo"
                : "Give them a name, say what they handle, done"}
            </span>
          </span>
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-bg-soft p-5">
        <h3 className="text-[14px] font-semibold">
          {es ? "¿En qué se diferencia de las Mentes?" : "How is this different from Minds?"}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          {es
            ? "Una Mente cambia cómo te habla Kairo: el tono, el enfoque, lo que sabe. Un miembro del Team se encarga de un trabajo concreto y repetido. La Mente es una forma de responder; el Team es un puesto."
            : "A Mind changes how Kairo talks to you: the tone, the angle, what it knows. A Team member owns one recurring job. A Mind is a way of answering; the Team is a role."}
        </p>
      </div>
    </Section>
  );
}
