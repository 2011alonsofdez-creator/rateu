"use client";

import Link from "next/link";
import { useUi, type TKey } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import { ElegirPlan } from "@/components/ElegirPlan";
import { Probar } from "@/components/Probar";
import { CREDITOS_NIVEL, CREDITOS_PLAN } from "@/lib/planes";
import { Marca } from "@/components/Logo";
import { Arrow, Capas, Clock, Code as Codigo, Papel, Shield, Team } from "@/components/Icons";
import { IconoNivel } from "@/components/IconoNivel";

const BRAINS: { name: string; title: TKey; desc: TKey; color: string }[] = [
  { name: "Claude", title: "brains.claude", desc: "brains.claudeDesc", color: "var(--acento)" },
  { name: "Gemini", title: "brains.gemini", desc: "brains.geminiDesc", color: "var(--acento-2)" },
  { name: "GPT", title: "brains.gpt", desc: "brains.gptDesc", color: "var(--green)" },
];

/* EL ORDEN IMPORTA MÁS QUE LA LISTA.
 *
 * Un chat con tres modelos lo tiene cualquiera, y quien llega aquí ya
 * usa uno. Lo que no tiene nadie es que le subas la multa y Kairo le
 * avise tres veces antes de que venza. Así que eso va primero, y el
 * resto detrás.
 *
 * Los Co-Works no tienen tarjeta propia a propósito: «tareas
 * programadas» no le dice nada a quien no conoce Kairo, y contado
 * dentro de Paperwork —te avisa sin que entres— sí. La promesa general
 * ya está arriba del todo, en el titular. */
/* QUÉ SE ENSEÑA AQUÍ, Y POR QUÉ ESTAS SEIS.
 *
 * Antes empezaba por Paperwork y el Mega-Prompt era el cuarto, detrás
 * de Gist y de Mentes. Eso es poner lo único que no tiene nadie después
 * de dos cosas que hacen mejor ChatGPT y NotebookLM: te comparan en el
 * terreno donde pierdes y se van antes de llegar a donde ganas.
 *
 * Y faltaban las dos que sostienen el titular. La portada promete «la
 * IA que trabaja cuando tú no» y luego no enseñaba Co-Works ni Team por
 * ningún lado: la promesa estaba escrita y sin respaldo.
 *
 * Fuera Conectores, que estaba listado en una sección titulada «lo que
 * los demás no hacen» siendo lo único que Kairo todavía no hace.
 */
const FEATURES: { icon: typeof Clock; title: TKey; desc: TKey }[] = [
  /* La tarjeta de MEGA lleva el dibujo de MEGA, no un rayo suelto. */
  { icon: Capas, title: "features.mega", desc: "features.megaDesc" },
  { icon: Papel, title: "features.paperwork", desc: "features.paperworkDesc" },
  { icon: Clock, title: "features.coworks", desc: "features.coworksDesc" },
  { icon: Team, title: "features.team", desc: "features.teamDesc" },
  { icon: Codigo, title: "features.code", desc: "features.codeDesc" },
  { icon: Shield, title: "features.ages", desc: "features.agesDesc" },
];

export default function Landing() {
  const { t, lang } = useUi();

  return (
    <>
      <SiteHeader />

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="glow relative overflow-hidden px-4 pb-20 pt-16 sm:pt-24">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[12.5px] text-muted">
              <Marca className="h-3.5 w-3.5" />
              {t("hero.badge")}
            </span>

            <h1 className="mt-6 text-[40px] font-bold leading-[1.08] tracking-tight sm:text-[62px]">
              {t("hero.title")}
              <br />
              <span className="brand-text">{t("hero.titleAccent")}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
              {t("hero.sub")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="brand-grad inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold text-on-accent transition hover:opacity-90 sm:w-auto"
              >
                {t("hero.cta")}
                <Arrow className="h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-xl border border-line-hi px-6 py-3 text-[15px] font-medium transition hover:bg-panel sm:w-auto"
              >
                {t("hero.cta2")}
              </Link>
            </div>

            <p className="mt-4 text-[13px] text-faint">
              {t("hero.note").replace("{n}", String(CREDITOS_PLAN.free))}
            </p>
          </div>

          <Probar />
        </section>

        {/* ---------------- Tres cerebros ---------------- */}
        <section className="border-y border-line bg-bg-soft px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[30px] font-bold tracking-tight sm:text-[38px]">
                {t("brains.title")}
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-muted">{t("brains.sub")}</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {BRAINS.map((b) => (
                <div key={b.name} className="rounded-2xl border border-line bg-panel p-6">
                  <span
                    className="inline-block rounded-lg px-2.5 py-1 font-mono text-[12px] font-medium"
                    style={{ color: b.color, background: `color-mix(in oklab, ${b.color} 14%, transparent)` }}
                  >
                    {b.name}
                  </span>
                  <h3 className="mt-4 text-[17px] font-semibold">{t(b.title)}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{t(b.desc)}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-[14px] text-faint">
              {t("brains.note")}
            </p>
          </div>
        </section>

        {/* ---------------- Funcionalidades ---------------- */}
        <section id="features" className="scroll-mt-20 px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[30px] font-bold tracking-tight sm:text-[38px]">
                {t("features.title")}
              </h2>
              <p className="mt-4 text-[16px] text-muted">{t("features.sub")}</p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-line bg-panel p-6 transition hover:border-line-hi"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel-hi text-acento">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-[16px] font-semibold">{t(f.title)}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{t(f.desc)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- Precios ---------------- */}
        <section className="border-t border-line bg-bg-soft px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[30px] font-bold tracking-tight sm:text-[38px]">
                {t("pricing.title")}
              </h2>
              <p className="mt-4 text-[16px] text-muted">{t("pricing.sub")}</p>
            </div>
            {/* PRIMERO ELEGIR, DESPUÉS COMPARAR.
 
                El deslizador contesta "¿cuál me hace falta?", que es
                con lo que llega la gente. Las tarjetas contestan "¿qué
                incluye cada uno?", que es lo segundo que se pregunta.
                En ese orden, y no al revés. */}
            <div className="mt-12">
              <ElegirPlan />
            </div>
            <div className="mt-14">
              <PricingCards />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
