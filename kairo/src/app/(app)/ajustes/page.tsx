"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { user } from "@/lib/mock";
import { Bolt, Check, Settings, Shield } from "@/components/Icons";

/* El selector de tono es una decisión de producto: el usuario elige
   la personalidad de Kairo, y esa elección se inyecta en el system
   prompt ({TONO_ELEGIDO}) en el Paso 3. */
const TONES = {
  es: [
    { id: "cercano", n: "Cercano y claro", d: "Directo, sin tecnicismos. El que viene puesto." },
    { id: "experto", n: "Experto", d: "Serio y preciso, orientado a trabajo." },
    { id: "chispa", n: "Con chispa", d: "Divertido y con energía. Algún emoji." },
    { id: "breve", n: "Al grano", d: "Lo mínimo imprescindible, sin rodeos." },
  ],
  en: [
    { id: "cercano", n: "Warm and clear", d: "Direct, no jargon. The default." },
    { id: "experto", n: "Expert", d: "Serious and precise, work-oriented." },
    { id: "chispa", n: "With spark", d: "Fun and energetic. The odd emoji." },
    { id: "breve", n: "To the point", d: "The bare minimum, no padding." },
  ],
};

const AGES = {
  es: [
    { id: "nino", n: "Niños", d: "Hasta 12 años · moderación estricta" },
    { id: "adolescente", n: "Adolescente", d: "13 a 17 años · moderación alta" },
    { id: "adulto", n: "Adulto", d: "18 años o más · sin restricciones extra" },
  ],
  en: [
    { id: "nino", n: "Kids", d: "Up to 12 · strict moderation" },
    { id: "adolescente", n: "Teen", d: "13 to 17 · high moderation" },
    { id: "adulto", n: "Adult", d: "18+ · no extra restrictions" },
  ],
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AjustesPage() {
  const { t, lang, theme, toggleTheme, setLang } = useUi();
  const [tone, setTone] = useState("cercano");
  const [age, setAge] = useState("adulto");
  const es = lang === "es";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-violet">
          <Settings className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">{t("app.settings")}</h1>
      </div>

      <div className="mt-8 space-y-5">
        {/* Tono */}
        <Card title={es ? "Cómo te habla Kairo" : "How Kairo talks to you"}>
          <div className="grid gap-3 sm:grid-cols-2">
            {TONES[lang].map((o) => (
              <button
                key={o.id}
                onClick={() => setTone(o.id)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  tone === o.id
                    ? "border-violet/60 bg-panel-hi"
                    : "border-line hover:border-line-hi hover:bg-panel-hi"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    tone === o.id ? "brand-grad border-transparent text-on-accent" : "border-line-hi"
                  }`}
                >
                  {tone === o.id && <Check className="h-2.5 w-2.5" />}
                </span>
                <span>
                  <span className="block text-[14px] font-medium">{o.n}</span>
                  <span className="block text-[12.5px] text-faint">{o.d}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Modo de edad */}
        <Card title={es ? "Modo de edad" : "Age mode"}>
          <div className="space-y-2.5">
            {AGES[lang].map((o) => (
              <button
                key={o.id}
                onClick={() => setAge(o.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                  age === o.id
                    ? "border-violet/60 bg-panel-hi"
                    : "border-line hover:border-line-hi hover:bg-panel-hi"
                }`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    age === o.id ? "brand-grad border-transparent text-on-accent" : "border-line-hi"
                  }`}
                >
                  {age === o.id && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{o.n}</span>
                  <span className="block text-[12.5px] text-faint">{o.d}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="mt-4 flex gap-2.5 rounded-xl border border-line bg-bg-soft p-3.5 text-[13px] leading-relaxed text-muted">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {es
              ? "Los perfiles de menores los crea y supervisa un adulto desde su propia cuenta. Un menor no puede registrarse por su cuenta."
              : "Child profiles are created and supervised by an adult from their own account. A minor cannot register on their own."}
          </p>
        </Card>

        {/* Idioma y tema */}
        <Card title={es ? "Idioma y apariencia" : "Language and appearance"}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-line p-1">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${
                    lang === l ? "bg-panel-hi text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {l === "es" ? "Español" : "English"}
                </button>
              ))}
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-medium text-muted transition hover:border-line-hi hover:text-fg"
            >
              {theme === "dark"
                ? es ? "Cambiar a tema claro" : "Switch to light theme"
                : es ? "Cambiar a tema oscuro" : "Switch to dark theme"}
            </button>
          </div>
        </Card>

        {/* Plan */}
        <Card title={es ? "Plan y créditos" : "Plan and credits"}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-[15px] font-medium">
                <Bolt className="h-4 w-4 text-gold" />
                {user.plan}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {t("app.creditsLeft")}: <strong className="text-fg">{user.credits.toLocaleString(lang)}</strong>
                {" · "}
                {t("app.thisMonth")}: {user.spentThisMonth}
              </p>
              <p className="mt-0.5 text-[12.5px] text-faint">
                {t("app.renews")} {user.renewsOn[lang]}
              </p>
            </div>
            <Link
              href="/precios"
              className="rounded-xl border border-line-hi px-4 py-2 text-[13.5px] font-medium transition hover:bg-panel-hi"
            >
              {es ? "Gestionar plan" : "Manage plan"}
            </Link>
          </div>
        </Card>

        {/* Cuenta */}
        <Card title={es ? "Cuenta" : "Account"}>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-line-hi px-4 py-2 text-[13.5px] font-medium transition hover:bg-panel-hi">
              {es ? "Descargar mis datos" : "Download my data"}
            </button>
            <button className="rounded-xl border border-red/40 px-4 py-2 text-[13.5px] font-medium text-red transition hover:bg-red/10">
              {es ? "Borrar cuenta" : "Delete account"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
