"use client";

import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { Section } from "@/components/Section";
import { Plus, Team } from "@/components/Icons";
import Link from "next/link";

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
      encargo:
        "Cada día cógete una cláusula de las que más se repiten en los contratos normales (alquiler, trabajo, móvil, gimnasio) y explícamela en claro: qué dice de verdad, cuándo es abusiva, y qué frase exacta pedir que cambien.",
      d: "Revisa contratos, señala cláusulas abusivas y te las explica sin latinajos",
      t: "Legal",
    },
    {
      e: "📊",
      n: "Contable",
      encargo:
        "Recuérdame qué papeles y qué pagos tengo que tener controlados este mes, con sus fechas. Empieza por lo que vence antes. Si no vence nada esta semana, dilo en una línea y no rellenes.",
      d: "Ordena facturas y gastos, y avisa de lo que hay que presentar y cuándo",
      t: "Negocio",
    },
    {
      e: "📞",
      n: "Comercial",
      encargo:
        "Escríbeme un mensaje de seguimiento para un cliente que no ha contestado. Cambia el tono cada día: amable, directo, última oportunidad. Corto, para mandar por WhatsApp o correo.",
      d: "Contesta a los clientes, prepara presupuestos y hace seguimiento",
      t: "Negocio",
    },
    {
      e: "🗂️",
      n: "Administrativo",
      encargo:
        "Hazme la lista de lo que suele atascarse en el papeleo y dime por dónde empezar hoy. Una sola cosa al día, la que más pesa, con los pasos concretos.",
      d: "Papeleo, formularios y plazos. Lo aburrido que nadie quiere hacer",
      t: "Oficina",
    },
  ],
  en: [
    {
      e: "⚖️",
      n: "Lawyer",
      encargo:
        "Each day take one of the clauses that turn up in ordinary contracts (rent, work, phone, gym) and explain it plainly: what it really says, when it is unfair, and the exact wording to ask for instead.",
      d: "Reviews contracts, flags unfair clauses and explains them in plain words",
      t: "Legal",
    },
    {
      e: "📊",
      n: "Bookkeeper",
      encargo:
        "Remind me which papers and payments I need on top of this month, with their dates. Start with whatever is due first. If nothing is due this week, say so in one line instead of padding.",
      d: "Sorts invoices and expenses, and warns you what is due and when",
      t: "Business",
    },
    {
      e: "📞",
      n: "Sales rep",
      encargo:
        "Write me a follow-up message for a customer who has not replied. Change the tone each day: friendly, direct, last call. Short, to send by WhatsApp or email.",
      d: "Answers customers, drafts quotes and follows them up",
      t: "Business",
    },
    {
      e: "🗂️",
      n: "Admin",
      encargo:
        "List what usually gets stuck in the paperwork and tell me where to start today. One thing a day, the heaviest one, with the concrete steps.",
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
      /* Fuera la etiqueta de "Próximamente". Decía "esta sección llega
         en la versión 2" y la sección ya contrata: al darle a Contratar
         se crea un Co-Work que trabaja solo a su hora. Un cartel que
         desmiente a la pantalla que lo lleva encima hace dudar de todo
         lo demás, y lo que queda por llegar —leer tus archivos— ya se
         dice abajo, donde toca y sin exagerar. */
      soon={false}
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
                <Link
                  href={`/coworks?puesto=${encodeURIComponent(f.n)}&contratar=${encodeURIComponent(f.encargo)}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-acento/50 bg-acento/10 px-3 py-1.5 text-[13px] font-medium text-acento transition hover:bg-acento/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {es ? "Contratar" : "Hire"}
                </Link>
              </div>
            </div>
          </div>
        ))}

        <Link
          href="/coworks?contratar=%20"
          className="grid min-h-[120px] w-full place-items-center rounded-2xl border border-dashed border-line-hi p-5 text-muted transition hover:bg-panel hover:text-fg sm:col-span-2"
        >
          <span className="text-center">
            <Plus className="mx-auto h-6 w-6" />
            <span className="mt-2 block text-[14px] font-medium">
              {es ? "Contratar a alguien" : "Hire someone"}
            </span>
            <span className="mt-1 block text-[12.5px] text-faint">
              {es
                ? "Le pones nombre, le dices de qué se encarga y a qué hora"
                : "Give them a name, say what they handle and when"}
            </span>
          </span>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-bg-soft p-5">
        <h3 className="text-[14px] font-semibold">
          {es ? "¿En qué se diferencia de las Mentes?" : "How is this different from Minds?"}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          {es
            ? "Una Mente cambia cómo te habla Kairo: el tono, el enfoque, lo que sabe. Un miembro del Team se encarga de un trabajo concreto y repetido. La Mente es una forma de responder; el Team es un puesto. Al contratar a alguien se crea un Co-Work: trabaja solo, a la hora que tú elijas, y te deja el trabajo hecho en un chat. Todavía no puede abrir tus archivos —eso llegará con Conectores—, así que de momento hace la parte que se puede hacer sin ellos."
            : "A Mind changes how Kairo talks to you: the tone, the angle, what it knows. A Team member owns one recurring job. A Mind is a way of answering; the Team is a role. Hiring someone creates a Co-Work: it works on its own, at the hour you pick, and leaves the result in a chat. It cannot open your files yet -- that comes with Connectors -- so for now it does the part that works without them."}
        </p>
      </div>
    </Section>
  );
}
