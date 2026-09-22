"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUi, type Lang, type TKey } from "@/lib/i18n";
import { LEVELS, pick, type Level, type Message } from "@/lib/mock";
import { useCredits } from "@/lib/credits";
import { usePerfil } from "@/lib/perfil-cliente";
import { Composer } from "@/components/Composer";
import { Markdown } from "@/components/Markdown";
import { Pensando } from "@/components/Pensando";
import { Marca, MarcaTile } from "@/components/Logo";
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
} from "@/components/Icons";

/* Respuestas de ejemplo. Solo se usan en modo demo, cuando no hay
   Supabase ni clave de Gemini configurados. */
const DEMO: Record<Level, Record<Lang, string>> = {
  fast: {
    es: "Esto es el **modo demo**: no hay ninguna IA detrás todavía, solo un texto de ejemplo.\n\nConfigura Supabase y la clave de Gemini y aquí empezará a responder de verdad.",
    en: "This is **demo mode**: there is no AI behind this yet, just sample text.\n\nSet up Supabase and the Gemini key and this will start answering for real.",
  },
  normal: {
    es: "Modo demo. Con las claves puestas, este nivel usa un modelo mejor y responde de verdad.",
    en: "Demo mode. With the keys in place, this level uses a better model and answers for real.",
  },
  mega: {
    es: "Modo demo. El Mega-Prompt exprime el modelo al máximo cuando está conectado de verdad.",
    en: "Demo mode. The Mega-Prompt pushes the model to its limit once properly connected.",
  },
};

const CARDS: {
  icon: typeof ChatIcon;
  title: TKey;
  desc: TKey;
  href?: string;
  prompt?: { es: string; en: string };
}[] = [
  {
    icon: ChatIcon,
    title: "card.chat",
    desc: "card.chatDesc",
    prompt: {
      es: "Explícame en 3 frases qué sabes hacer",
      en: "Tell me in 3 sentences what you can do",
    },
  },
  { icon: Brain, title: "card.mentes", desc: "card.mentesDesc", href: "/mentes" },
  { icon: Clock, title: "card.cowork", desc: "card.coworkDesc", href: "/coworks" },
  { icon: Code, title: "card.code", desc: "card.codeDesc", href: "/codigo" },
  { icon: ImageIcon, title: "card.image", desc: "card.imageDesc", href: "/codigo" },
];

export default function ChatPage() {
  const { t, lang } = useUi();
  const perfil = usePerfil();
  const { credits, spend, sincronizar } = useCredits();

  const [messages, setMessages] = useState<Message[]>([]);
  const [level, setLevel] = useState<Level>("fast");
  const [busy, setBusy] = useState(false);
  const [modelo, setModelo] = useState<string>();
  const [error, setError] = useState<TKey>();
  const [noCredits, setNoCredits] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (texto: string) => {
    const coste = LEVELS[level].credits;
    setError(undefined);

    // Comprobación rápida para no molestar al servidor en vano.
    // La que decide de verdad está en la base de datos.
    if (coste > credits) {
      setNoCredits(true);
      return;
    }

    const bi = { es: texto, en: texto };
    const conElMio: Message[] = [
      ...messages,
      { id: `u${Date.now()}`, role: "user", content: bi },
    ];
    setMessages(conElMio);
    setBusy(true);
    setModelo(undefined);

    // --- Modo demo: sin claves, respuesta de ejemplo ---
    if (perfil.demo) {
      await spend(coste, `demo ${level}`);
      window.setTimeout(() => {
        setMessages((m) => [
          ...m,
          {
            id: `k${Date.now()}`,
            role: "kairo",
            level,
            credits: coste,
            model: "demo",
            content: { es: DEMO[level].es, en: DEMO[level].en },
          },
        ]);
        setBusy(false);
      }, 700);
      return;
    }

    // --- Modo real ---
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nivel: level,
          mensajes: conElMio.map((m) => ({
            rol: m.role,
            texto: pick(m.content, lang),
          })),
        }),
      });

      if (!res.ok || !res.body) {
        setBusy(false);
        if (res.status === 402) return setNoCredits(true);
        if (res.status === 403) return setError("err.nivel");
        if (res.status === 401) return setError("err.sesion");
        return setError("err.modelo");
      }

      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      const idK = `k${Date.now()}`;
      let resto = "";
      let abierto = false;

      const anadirTexto = (v: string) => {
        setMessages((m) => {
          if (!abierto) return m;
          const copia = [...m];
          const ult = copia[copia.length - 1];
          if (ult?.id !== idK) return m;
          copia[copia.length - 1] = {
            ...ult,
            content: { es: ult.content.es + v, en: ult.content.en + v },
          };
          return copia;
        });
      };

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decoder.decode(value, { stream: true });
        const lineas = resto.split("\n");
        resto = lineas.pop() ?? "";

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(linea);
          } catch {
            continue; // línea partida a medias: se recompone en la siguiente vuelta
          }

          if (ev.t === "meta") {
            setModelo(String(ev.modelo ?? ""));
          } else if (ev.t === "creditos") {
            sincronizar(Number(ev.creditos ?? 0), Number(ev.creditosExtra ?? 0));
          } else if (ev.t === "texto") {
            if (!abierto) {
              abierto = true;
              setBusy(false);
              setMessages((m) => [
                ...m,
                {
                  id: idK,
                  role: "kairo",
                  level,
                  credits: coste,
                  model: modelo,
                  content: { es: "", en: "" },
                },
              ]);
            }
            anadirTexto(String(ev.v ?? ""));
          } else if (ev.t === "error") {
            setBusy(false);
            const v = String(ev.v);
            setError(
              v === "cuota_agotada"
                ? "err.cuota"
                : v === "bloqueado"
                  ? "err.bloqueado"
                  : v === "sin_creditos"
                    ? "err.modelo"
                    : "err.modelo",
            );
            if (v === "sin_creditos") setNoCredits(true);
          }
        }
      }
    } catch {
      setError("err.red");
    } finally {
      setBusy(false);
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-12">
            <MarcaTile className="h-12 w-12 rounded-2xl" />
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

                return c.prompt ? (
                  <button key={c.title} className={cls} onClick={() => send(c.prompt![lang])}>
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

            {busy && <Pensando nivel={level} modelo={modelo} />}

            {error && (
              <div className="flex gap-3">
                <MarcaTile className="mt-0.5 h-8 w-8" />
                <p className="rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-[14px] leading-relaxed text-gold">
                  {t(error)}
                </p>
              </div>
            )}

            <div ref={bottom} />
          </div>
        )}
      </div>

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
  const texto = pick(m.content, lang);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* portapapeles no disponible */
    }
  };

  return (
    <div className="flex gap-3">
      <MarcaTile className="mt-0.5 h-8 w-8" />

      <div className="min-w-0 flex-1">
        <Markdown text={texto} />

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

          {m.model && m.model !== "demo" && (
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
            className="brand-grad block rounded-xl px-4 py-2.5 text-center text-[14px] font-semibold text-on-accent transition hover:opacity-90"
          >
            {t("app.upgrade")}
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
