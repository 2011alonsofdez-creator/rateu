"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUi, type Lang, type TKey } from "@/lib/i18n";
import { LEVELS, pick, thread, type Level, type Message } from "@/lib/mock";
import { useCredits } from "@/lib/credits";
import { Composer } from "@/components/Composer";
import { Markdown } from "@/components/Markdown";
import {
  Bolt,
  Brain,
  Chat as ChatIcon,
  Check,
  Clock,
  Code,
  Copy,
  Image as ImageIcon,
  Refresh,
  Sparkle,
} from "@/components/Icons";

/* Respuestas de ejemplo. En el Paso 3 esto lo sustituye la llamada real
   al router multi-modelo, que decide el nivel y el proveedor. */
const CANNED: Record<Level, Record<Lang, string>> = {
  fast: {
    es: "Listo. Para algo así el nivel **Rápido** sobra: he respondido con el modelo más ligero y te ha costado **1 crédito**.\n\nSi la pregunta fuera más larga o necesitara pensar, Kairo habría subido de nivel solo.",
    en: "Done. **Fast** is plenty for this: I answered with the lightest model and it cost you **1 credit**.\n\nIf the question were longer or needed reasoning, Kairo would have stepped up on its own.",
  },
  normal: {
    es: "He usado el nivel **Normal**, que es el equilibrio entre calidad y coste: **4 créditos**.\n\nPara redactar, resumir o explicar es el que mejor relación da. Si en algún momento detecto que la tarea necesita razonar en varios pasos, subo sola al nivel máximo y te lo aviso antes de gastar.",
    en: "I used the **Normal** level, the balance between quality and cost: **4 credits**.\n\nFor writing, summarising or explaining it gives the best ratio. If I detect a task that needs multi-step reasoning, I step up to the top tier and warn you before spending.",
  },
  mega: {
    es: "**Mega-Prompt ejecutado.** He lanzado la pregunta a los tres modelos a la vez y he combinado lo mejor de cada respuesta:\n\n- **Claude** ha aportado la estructura y el detalle técnico.\n- **Gemini** ha añadido los datos más recientes.\n- **GPT** ha revisado el razonamiento y ha detectado dos huecos.\n\nCoste: **120 créditos**. Úsalo cuando acertar importe de verdad; para el día a día, con el nivel Normal vas sobrado.",
    en: "**Mega-Prompt executed.** I sent your question to all three models at once and merged the best of each answer:\n\n- **Claude** contributed the structure and technical detail.\n- **Gemini** added the most recent data.\n- **GPT** reviewed the reasoning and caught two gaps.\n\nCost: **120 credits**. Use it when getting it right really matters; for everyday work, Normal is plenty.",
  },
};

const MODEL_LABEL: Record<Level, string> = {
  fast: "Gemini Flash",
  normal: "Sonnet",
  mega: "Mega-Prompt · Claude + Gemini + GPT",
};

const CARDS: {
  icon: typeof ChatIcon;
  title: TKey;
  desc: TKey;
  href?: string;
  demo?: boolean;
}[] = [
  { icon: ChatIcon, title: "card.chat", desc: "card.chatDesc", demo: true },
  { icon: Brain, title: "card.mentes", desc: "card.mentesDesc", href: "/mentes" },
  { icon: Clock, title: "card.cowork", desc: "card.coworkDesc", href: "/coworks" },
  { icon: Code, title: "card.code", desc: "card.codeDesc", href: "/codigo" },
  { icon: ImageIcon, title: "card.image", desc: "card.imageDesc", href: "/codigo" },
];

export default function ChatPage() {
  const { t, lang } = useUi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [level, setLevel] = useState<Level>("fast");
  const { credits, spend } = useCredits();
  const [busy, setBusy] = useState(false);
  const [noCredits, setNoCredits] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const cost = LEVELS[level].credits;

    // Comprobación rápida para no molestar al servidor si es evidente
    // que no llega. La que decide de verdad es la de la base de datos,
    // que descuenta y comprueba en la misma transacción.
    if (cost > credits) {
      setNoCredits(true);
      return;
    }

    const id = `u${Date.now()}`;
    const bi = { es: text, en: text };
    setMessages((m) => [...m, { id, role: "user", content: bi }]);
    setBusy(true);

    const ok = await spend(cost, `mensaje ${level}`);
    if (!ok) {
      // El servidor ha dicho que no: retiramos el mensaje y avisamos.
      setMessages((m) => m.filter((x) => x.id !== id));
      setBusy(false);
      setNoCredits(true);
      return;
    }

    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `k${Date.now()}`,
          role: "kairo",
          level,
          credits: cost,
          model: MODEL_LABEL[level],
          content: { es: CANNED[level].es, en: CANNED[level].en },
        },
      ]);
      setBusy(false);
    }, 900);
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-12">
            <span className="brand-grad grid h-12 w-12 place-items-center rounded-2xl text-on-accent">
              <Sparkle className="h-6 w-6" />
            </span>
            <h1 className="mt-5 text-[26px] font-semibold tracking-tight sm:text-[30px]">
              {t("app.greeting")}
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">{t("app.greetingSub")}</p>

            <div className="mt-9 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {CARDS.map((c) => {
                const Icon = c.icon;
                const inner = (
                  <>
                    <Icon className="h-5 w-5 text-violet" />
                    <span className="mt-2.5 block text-[13.5px] font-medium">{t(c.title)}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-faint">
                      {t(c.desc)}
                    </span>
                  </>
                );
                const cls =
                  "rounded-xl border border-line bg-panel p-3.5 text-left transition hover:border-line-hi hover:bg-panel-hi";

                return c.demo ? (
                  <button key={c.title} className={cls} onClick={() => setMessages(thread)}>
                    {inner}
                  </button>
                ) : (
                  <Link key={c.title} href={c.href ?? "/chat"} className={cls}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-7 px-4 py-8">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-panel-hi px-4 py-2.5 text-[15px] leading-relaxed">
                    {pick(m.content, lang)}
                  </p>
                </div>
              ) : (
                <KairoMessage key={m.id} m={m} />
              ),
            )}

            {busy && (
              <div className="flex gap-3">
                <span className="brand-grad mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-on-accent">
                  <Sparkle className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1.5 pt-2.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint"
                      style={{ animationDelay: `${i * 140}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottom} />
          </div>
        )}
      </div>

      {/* Contador de créditos flotante */}
      <div className="pointer-events-none flex justify-center">
        <span className="pointer-events-auto -mb-1 inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-[12px] text-muted shadow-[var(--shadow)]">
          <Bolt className="h-3 w-3 text-gold" />
          {credits.toLocaleString(lang)} {t("app.credits")}
        </span>
      </div>

      <Composer level={level} setLevel={setLevel} onSend={send} busy={busy} />

      {noCredits && <NoCreditsModal onClose={() => setNoCredits(false)} />}
    </div>
  );
}

function KairoMessage({ m }: { m: Message }) {
  const { t, lang } = useUi();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pick(m.content, lang));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* portapapeles no disponible */
    }
  };

  return (
    <div className="flex gap-3">
      <span className="brand-grad mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-on-accent">
        <Sparkle className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <Markdown text={pick(m.content, lang)} />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted transition hover:border-line-hi hover:text-fg"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("app.copied") : t("app.copy")}
          </button>
          <button
            title={t("app.regenWarn")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted transition hover:border-line-hi hover:text-fg"
          >
            <Refresh className="h-3.5 w-3.5" />
            {t("app.regen")}
          </button>

          {m.model && (
            <span className="rounded-lg border border-line px-2 py-1 text-[11.5px] text-faint">
              {m.model}
            </span>
          )}
          {m.credits != null && (
            <span className="rounded-lg border border-line px-2 py-1 text-[11.5px] text-faint">
              {m.credits} {t("app.cr")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoCreditsModal({ onClose }: { onClose: () => void }) {
  const { t } = useUi();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label={t("app.later")} />
      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-panel p-6 text-center shadow-[var(--shadow)]">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <Bolt className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold">{t("app.noCredits")}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{t("app.noCreditsSub")}</p>
        <div className="mt-6 space-y-2">
          <Link
            href="/precios"
            className="brand-grad block rounded-xl px-4 py-2.5 text-[14px] font-semibold text-on-accent transition hover:opacity-90"
          >
            {t("app.upgrade")}
          </Link>
          <Link
            href="/precios"
            className="block rounded-xl border border-line-hi px-4 py-2.5 text-[14px] font-medium transition hover:bg-panel-hi"
          >
            {t("app.buyCredits")}
          </Link>
          <button
            onClick={onClose}
            className="block w-full rounded-xl px-4 py-2 text-[13.5px] text-faint transition hover:text-fg"
          >
            {t("app.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
