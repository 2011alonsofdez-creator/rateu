"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { useCredits } from "@/lib/credits";
import { NOMBRE_PLAN } from "@/lib/planes";
import { cerrarSesion, guardarAjustes } from "../actions";
import { Bolt, Check, Settings, Shield } from "@/components/Icons";

/* El tono elegido aquí se inyecta en el system prompt ({TONO_ELEGIDO})
   cuando se conecte la IA en el Paso 3. */
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

const MODOS = {
  es: {
    nino: { n: "Niños", d: "Hasta 12 años · moderación estricta" },
    adolescente: { n: "Adolescente", d: "13 a 17 años · moderación alta" },
    adulto: { n: "Adulto", d: "18 años o más · sin restricciones extra" },
  },
  en: {
    nino: { n: "Kids", d: "Up to 12 · strict moderation" },
    adolescente: { n: "Teen", d: "13 to 17 · high moderation" },
    adulto: { n: "Adult", d: "18+ · no extra restrictions" },
  },
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
  const perfil = usePerfil();
  const { credits, total } = useCredits();

  const [tone, setTone] = useState(perfil.tono);
  const [guardado, setGuardado] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const es = lang === "es";

  const elegirTono = (id: string) => {
    setTone(id);
    setGuardado(false);
    if (perfil.demo) return;

    startTransition(async () => {
      const res = await guardarAjustes(id, lang);
      if (res.ok) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      }
    });
  };

  const modo = perfil.modoEdad ? MODOS[lang][perfil.modoEdad] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <Settings className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">{t("app.settings")}</h1>
        {perfil.demo && (
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11.5px] font-medium text-gold">
            {es ? "demo" : "demo"}
          </span>
        )}
      </div>

      <div className="mt-8 space-y-5">
        {/* Cuenta */}
        <Card title={es ? "Tu cuenta" : "Your account"}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="brand-grad grid h-10 w-10 place-items-center rounded-full text-[15px] font-bold text-on-accent">
                {(perfil.nombre || "?").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-[15px] font-medium">{perfil.nombre}</p>
                <p className="text-[13px] text-faint">{perfil.email}</p>
              </div>
            </div>
            {!perfil.demo && (
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="rounded-xl border border-line-hi px-4 py-2 text-[13.5px] font-medium transition hover:bg-panel-hi"
                >
                  {t("auth.logout")}
                </button>
              </form>
            )}
          </div>
        </Card>

        {/* Tono */}
        <Card title={es ? "Cómo te habla Kairo" : "How Kairo talks to you"}>
          <div className="grid gap-3 sm:grid-cols-2">
            {TONES[lang].map((o) => (
              <button
                key={o.id}
                onClick={() => elegirTono(o.id)}
                disabled={pendiente}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition disabled:opacity-60 ${
                  tone === o.id
                    ? "border-acento/60 bg-panel-hi"
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
          {guardado && (
            <p className="mt-3 text-[12.5px] text-green">{es ? "Guardado" : "Saved"}</p>
          )}
        </Card>

        {/* Modo de edad: se fija al registrarse y no se cambia desde aquí */}
        <Card title={es ? "Modo de edad" : "Age mode"}>
          {modo ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft p-3.5">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full brand-grad text-on-accent">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>
                <span className="block text-[14px] font-medium">{modo.n}</span>
                <span className="block text-[12.5px] text-faint">{modo.d}</span>
              </span>
            </div>
          ) : (
            <p className="text-[14px] text-muted">
              {es ? "Sin definir todavía." : "Not set yet."}
            </p>
          )}

          <p className="mt-4 flex gap-2.5 rounded-xl border border-line bg-bg-soft p-3.5 text-[13px] leading-relaxed text-muted">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {es
              ? "El modo sale de tu fecha de nacimiento y no se puede cambiar desde aquí: si se pudiera, bastaría con tocarlo para saltarse la moderación. Los perfiles de menores los crea y supervisa un adulto desde su cuenta."
              : "The mode comes from your date of birth and cannot be changed here: if it could, anyone could switch it to bypass moderation. Child profiles are created and supervised by an adult from their account."}
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
                {NOMBRE_PLAN[perfil.plan]}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {t("app.creditsLeft")}:{" "}
                <strong className="text-fg">{credits.toLocaleString(lang)}</strong> / {total}
              </p>
              {perfil.renuevaEl && (
                <p className="mt-0.5 text-[12.5px] text-faint">
                  {t("app.renews")} {perfil.renuevaEl}
                </p>
              )}
            </div>
            <Link
              href="/precios"
              className="rounded-xl border border-line-hi px-4 py-2 text-[13.5px] font-medium transition hover:bg-panel-hi"
            >
              {es ? "Gestionar plan" : "Manage plan"}
            </Link>
          </div>
        </Card>

        {/* Datos */}
        <Card title={es ? "Tus datos" : "Your data"}>
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
