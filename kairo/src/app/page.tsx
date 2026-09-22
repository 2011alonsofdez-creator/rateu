"use client";

import Link from "next/link";
import { useUi, type TKey } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import {
  Arrow,
  Bolt,
  Brain,
  Clock,
  Code,
  Plug,
  Shield,
  Sparkle,
} from "@/components/Icons";

const BRAINS: { name: string; title: TKey; desc: TKey; color: string }[] = [
  { name: "Claude", title: "brains.claude", desc: "brains.claudeDesc", color: "var(--violet)" },
  { name: "Gemini", title: "brains.gemini", desc: "brains.geminiDesc", color: "var(--cyan)" },
  { name: "GPT", title: "brains.gpt", desc: "brains.gptDesc", color: "var(--green)" },
];

const FEATURES: { icon: typeof Clock; title: TKey; desc: TKey }[] = [
  { icon: Clock, title: "features.cowork", desc: "features.coworkDesc" },
  { icon: Brain, title: "features.mentes", desc: "features.mentesDesc" },
  { icon: Bolt, title: "features.mega", desc: "features.megaDesc" },
  { icon: Code, title: "features.code", desc: "features.codeDesc" },
  { icon: Plug, title: "features.connect", desc: "features.connectDesc" },
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
              <Sparkle className="h-3.5 w-3.5 text-violet" />
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

            <p className="mt-4 text-[13px] text-faint">{t("hero.note")}</p>
          </div>

          {/* Vista previa del chat */}
          <div className="relative z-10 mx-auto mt-14 max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--shadow)]">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green/60" />
                <span className="ml-2 text-[12px] text-faint">kairo.app</span>
              </div>

              <div className="space-y-4 px-5 py-6 text-left">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-panel-hi px-4 py-2.5 text-[14px]">
                    {lang === "es"
                      ? "Prepárame el resumen de ventas de la semana"
                      : "Draft my weekly sales summary"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="brand-grad mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-on-accent">
                    <Sparkle className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[14px] leading-relaxed text-muted">
                      {lang === "es"
                        ? "Hecho. He cruzado tus pedidos con los de la semana pasada: las ventas suben un 12%, pero el ticket medio baja 3 €."
                        : "Done. I compared this week's orders with last week's: sales are up 12%, but average order value is down €3."}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11.5px] text-faint">
                      <span className="rounded-md border border-line px-2 py-0.5">
                        {lang === "es" ? "Nivel Normal" : "Normal level"}
                      </span>
                      <span className="rounded-md border border-line px-2 py-0.5">4 cr</span>
                      <span className="rounded-md border border-line px-2 py-0.5">1,4 s</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-line px-5 py-3">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft px-3.5 py-2.5">
                  <span className="flex-1 text-[14px] text-faint">{t("app.placeholder")}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted">
                    <Bolt className="h-3 w-3 text-green" />
                    {t("app.fast")}
                  </span>
                  <span className="brand-grad grid h-7 w-7 place-items-center rounded-lg text-on-accent">
                    <Arrow className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
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
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel-hi text-violet">
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
            <div className="mt-12">
              <PricingCards />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
