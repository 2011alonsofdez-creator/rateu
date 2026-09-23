"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { creditPacks, plans } from "@/lib/mock";
import { Bolt, Check } from "./Icons";

const NAME = { free: "pricing.free", plus: "pricing.plus", supreme: "pricing.supreme" } as const;
const DESC = {
  free: "pricing.freeDesc",
  plus: "pricing.plusDesc",
  supreme: "pricing.supremeDesc",
} as const;

export function PricingCards() {
  const { t, lang } = useUi();
  const [yearly, setYearly] = useState(false);
  const money = (n: number) =>
    n === 0 ? "0 €" : `${n.toFixed(2).replace(".", lang === "es" ? "," : ".")} €`;

  return (
    <>
      {/* Mensual / anual */}
      <div className="mb-9 flex items-center justify-center gap-3">
        <div className="inline-flex rounded-xl border border-line bg-panel p-1">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              onClick={() => setYearly(y)}
              className={`rounded-lg px-4 py-1.5 text-[13px] font-medium transition ${
                yearly === y ? "bg-panel-hi text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {t(y ? "pricing.yearly" : "pricing.monthly")}
            </button>
          ))}
        </div>
        {yearly && (
          <span className="rounded-full border border-green/30 bg-green/10 px-2.5 py-1 text-[12px] font-medium text-green">
            {t("pricing.save")}
          </span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const price = yearly ? p.yearly : p.monthly;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-panel p-6 ${
                p.featured ? "border-acento/50 shadow-[0_0_0_1px_var(--acento)]" : "border-line"
              }`}
            >
              {p.featured && (
                <span className="brand-grad absolute -top-3 left-6 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-accent">
                  {t("pricing.popular")}
                </span>
              )}

              <h3 className="text-[17px] font-semibold">{t(NAME[p.id])}</h3>
              <p className="mt-1 text-[13px] text-faint">{t(DESC[p.id])}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[34px] font-bold tracking-tight">{money(price)}</span>
                {price > 0 && (
                  <span className="text-[14px] text-faint">
                    {t(yearly ? "pricing.year" : "pricing.month")}
                  </span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {p.bullets[lang].map((b) => (
                  <li key={b} className="flex gap-2.5 text-[14px] text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                href="/chat"
                className={`mt-7 rounded-xl px-4 py-2.5 text-center text-[14px] font-semibold transition ${
                  p.featured
                    ? "brand-grad text-on-accent hover:opacity-90"
                    : "border border-line-hi text-fg hover:bg-panel-hi"
                }`}
              >
                {t(p.id === "free" ? "pricing.ctaFree" : "pricing.ctaPaid")}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Packs de créditos */}
      <div className="mt-8 rounded-2xl border border-line bg-panel p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-[16px] font-semibold">
              <Bolt className="h-4 w-4 text-gold" />
              {t("pricing.creditsTitle")}
            </h3>
            <p className="mt-1 text-[13px] text-faint">{t("pricing.creditsSub")}</p>
          </div>
          <div className="flex gap-3">
            {creditPacks.map((pack) => (
              <button
                key={pack.credits}
                className="rounded-xl border border-line-hi px-4 py-2.5 text-[14px] transition hover:bg-panel-hi"
              >
                <span className="font-semibold">{pack.credits.toLocaleString(lang)}</span>
                <span className="text-faint"> · {money(pack.price)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
