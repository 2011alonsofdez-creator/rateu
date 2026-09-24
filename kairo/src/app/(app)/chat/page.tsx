"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUi, type Lang, type TKey } from "@/lib/i18n";
import { LEVELS, pick, type Level, type Message } from "@/lib/mock";
import { useCredits } from "@/lib/credits";
import { usePerfil } from "@/lib/perfil-cliente";
import { useHistorial } from "@/lib/historial";
import type { Mente, MensajeGuardado } from "@/lib/tipos";
import { Composer } from "@/components/Composer";
import { Markdown } from "@/components/Markdown";
import { Pensando } from "@/components/Pensando";
import { Marca } from "@/components/Logo";
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
  forja: {
    es: "Modo demo. Forja es el nivel para trabajar a fondo: programar, analizar y crear.",
    en: "Demo mode. Forge is the level for deep work: coding, analysis and creation.",
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

/* La página lee la dirección (?c= y ?mente=), y eso obliga a envolverla:
   sin el Suspense, Next no puede adelantar nada del HTML. */
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <Chat />
    </Suspense>
  );
}

function Chat() {
  const { t, lang } = useUi();
  const router = useRouter();
  const params = useSearchParams();
  const perfil = usePerfil();
  const historial = useHistorial();
  const { credits, spend, sincronizar } = useCredits();

  const [messages, setMessages] = useState<Message[]>([]);
  const [level, setLevel] = useState<Level>("fast");
  const [busy, setBusy] = useState(false);
  const [modelo, setModelo] = useState<string>();
  const [mente, setMente] = useState<Mente | null>(null);
  /* Id del mensaje que se está escribiendo ahora mismo. Hace falta aparte
     de `busy`, porque `busy` se apaga con la primera palabra y el logo
     tiene que seguir vivo hasta la última. */
  const [escribiendo, setEscribiendo] = useState<string>();
  /* En qué conversación estamos. Null = todavía no existe; se creará
     con el primer mensaje. */
  const [conversacion, setConversacion] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<TKey>();
  const [detalle, setDetalle] = useState<string>();
  const [noCredits, setNoCredits] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  /* Cuál está ya en pantalla. Sin esto, cambiar la dirección al crear una
     conversación volvería a cargarla y borraría lo que se está escribiendo. */
  const puesta = useRef<string | null>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  /* Al llegar desde "Usar en el chat" la Mente viene en la dirección.
     Solo preselecciona; quien decide de verdad qué Mente se usa es el
     servidor, que la busca por su identificador. */
  useEffect(() => {
    const id = params.get("mente");
    if (!id) return;

    fetch("/api/mentes")
      .then((r) => r.json())
      .then((j) => {
        const m = (j?.mentes as Mente[] | undefined)?.find((x) => x.id === id);
        if (m) setMente(m);
      })
      .catch(() => {
        /* sin Mentes: el chat funciona igual */
      });
  }, [params]);

  /* Abrir una conversación guardada, o empezar una limpia si no hay ?c=.
     Es lo que hace que "Nuevo chat" vacíe la pantalla: cambia la
     dirección, y esto se entera. */
  useEffect(() => {
    const c = params.get("c");
    if (c === puesta.current) return; // ya está en pantalla
    puesta.current = c;

    if (!c) {
      setMessages([]);
      setConversacion(null);
      setMente(null);
      setError(undefined);
      return;
    }

    setCargando(true);
    fetch(`/api/conversaciones/${c}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("404"))))
      .then((j) => {
        const guardados = (j?.mensajes ?? []) as MensajeGuardado[];
        setMessages(
          guardados.map((m) => ({
            id: m.id,
            role: m.rol,
            content: { es: m.contenido, en: m.contenido },
            model: m.modelo ?? undefined,
            level: (m.nivel as Level | null) ?? undefined,
            credits: m.rol === "kairo" ? m.creditos : undefined,
          })),
        );
        setConversacion(c);

        // Si la conversación se abrió con una Mente, se sigue con ella.
        const menteId = j?.conversacion?.menteId as string | null | undefined;
        if (!menteId) return setMente(null);
        return fetch("/api/mentes")
          .then((r) => r.json())
          .then((jm) => {
            const m = (jm?.mentes as Mente[] | undefined)?.find((x) => x.id === menteId);
            setMente(m ?? null);
          });
      })
      .catch(() => {
        // Borrada, o de otra persona: se vuelve a un chat en blanco.
        setMessages([]);
        setConversacion(null);
        puesta.current = null;
      })
      .finally(() => setCargando(false));
  }, [params]);

  const send = async (texto: string) => {
    const coste = LEVELS[level].credits;
    setError(undefined);
    setDetalle(undefined);

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
          // Solo el identificador. Las instrucciones las lee el servidor
          // de la base de datos: si viajaran en la petición, cualquiera
          // podría colar el texto que quisiera en el system prompt.
          menteId: mente?.id ?? null,
          conversacionId: conversacion,
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
          } else if (ev.t === "conversacion") {
            const id = String(ev.id);
            setConversacion(id);
            puesta.current = id;
            // La dirección pasa a apuntar a esta conversación, para que
            // recargar o compartir el enlace la abra. Sin salto de página.
            if (ev.nueva) {
              router.replace(`/chat?c=${id}`, { scroll: false });
              router.refresh(); // que salga ya en la barra lateral
            }
          } else if (ev.t === "creditos") {
            sincronizar(Number(ev.creditos ?? 0), Number(ev.creditosExtra ?? 0));
          } else if (ev.t === "texto") {
            if (!abierto) {
              abierto = true;
              setBusy(false);
              setEscribiendo(idK);
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
                : v === "sobrecargado"
                  ? "err.sobrecargado"
                : v === "bloqueado"
                  ? "err.bloqueado"
                  : v === "clave_invalida"
                    ? "err.clave"
                    : "err.modelo",
            );
            if (ev.detalle) setDetalle(String(ev.detalle));
            if (v === "sin_creditos") setNoCredits(true);
          }
        }
      }
    } catch {
      setError("err.red");
    } finally {
      setBusy(false);
      setEscribiendo(undefined);
    }
  };

  const empty = messages.length === 0;

  /* El saludo lleva tu nombre, y cambia según quién seas: a quien ya
     tiene chats se le pregunta por dónde sigue; a quien llega hoy, en
     qué trabaja. Solo el nombre de pila: el apellido suena a carta del
     banco. */
  const pila = (perfil.nombre || "").trim().split(/\s+/)[0];
  const saludo = pila
    ? t(historial.length ? "app.greetingBack" : "app.greetingName").replace("{n}", pila)
    : t("app.greeting");

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {cargando ? (
          <div className="grid h-full place-items-center">
            <Marca className="h-10 w-10 opacity-60" animada />
          </div>
        ) : empty ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-12">
            <Marca className="h-12 w-12" />
            <h1 className="mt-5 text-balance text-center text-[26px] font-semibold tracking-tight sm:text-[30px]">
              {saludo}
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">{t("app.greetingSub")}</p>

            {mente && (
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-acento/40 bg-acento/10 px-3 py-1.5 text-[13px]">
                <span className="text-[15px] leading-none">{mente.emoji}</span>
                <span className="text-faint">{t("mente.talkingTo")}</span>
                <span className="font-medium">{mente.nombre}</span>
              </span>
            )}

            <div className="mt-9 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {CARDS.map((c) => {
                const Icon = c.icon;
                const inner = (
                  <>
                    <Icon className="h-5 w-5 text-acento" />
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
                <KairoMessage key={m.id} m={m} viva={m.id === escribiendo} />
              ),
            )}

            {busy && <Pensando nivel={level} modelo={modelo} />}

            {error && (
              <div className="flex gap-3">
                <Marca className="mt-0.5 h-8 w-8 shrink-0" />
                <div className="rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2.5">
                  <p className="text-[14px] leading-relaxed text-gold">{t(error)}</p>
                  {detalle && (
                    // Detalle técnico: te lo enseña para que puedas
                    // arreglarlo, porque de momento el único usuario eres tú.
                    <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-faint">
                      {detalle}
                    </p>
                  )}
                </div>
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

      <Composer
        level={level}
        setLevel={setLevel}
        mente={mente}
        setMente={setMente}
        onSend={send}
        busy={busy}
      />

      {noCredits && <NoCreditsModal onClose={() => setNoCredits(false)} />}
    </div>
  );
}

function KairoMessage({ m, viva = false }: { m: Message; viva?: boolean }) {
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
      <Marca className="mt-0.5 h-8 w-8 shrink-0" animada={viva} />

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
