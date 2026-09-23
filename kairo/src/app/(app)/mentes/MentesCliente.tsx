"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi, type Lang } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { Section } from "@/components/Section";
import { Brain, Check, Close, Plus } from "@/components/Icons";
import { MENTE, type Mente } from "@/lib/tipos";
import { borrarMente, guardarMente, type EntradaMente } from "./acciones";

const EMOJIS = [
  "🧠", "⚖️", "📣", "📚", "📊", "💡", "🧭", "🩺",
  "🍳", "💼", "🧾", "🎯", "✍️", "🔬", "🎨", "📈",
];

const TONOS: { id: string; es: string; en: string }[] = [
  { id: "cercano", es: "Cercano", en: "Warm" },
  { id: "experto", es: "Experto", en: "Expert" },
  { id: "chispa", es: "Con chispa", en: "Playful" },
  { id: "breve", es: "Al grano", en: "Terse" },
];

/* Plantillas para quien llega con la página vacía. Una Mente en blanco
   asusta; una a medio escribir se entiende sola. */
const PLANTILLAS: Record<Lang, EntradaMente[]> = {
  es: [
    {
      nombre: "Revisor de contratos",
      emoji: "⚖️",
      descripcion: "Busca cláusulas abusivas y me las explica en claro",
      instrucciones:
        "Lees contratos y señalas lo que perjudica a quien firma.\nPor cada punto: cita la cláusula, explícala en palabras normales y di si es negociable.\nTermina siempre con las tres cosas que cambiaría yo antes de firmar.\nNo das consejo legal: me preparas para hablar con un abogado.",
      tono: "experto",
    },
    {
      nombre: "Community manager",
      emoji: "📣",
      descripcion: "Escribe mis publicaciones con mi tono de siempre",
      instrucciones:
        "Escribes publicaciones para redes sociales.\nUna idea por publicación, frases cortas y nada de palabras huecas tipo «sinergia» o «disruptivo».\nEmpieza por el gancho, nunca por el contexto.\nMe das tres versiones y me dices cuál elegirías.",
      tono: "chispa",
    },
    {
      nombre: "Profe particular",
      emoji: "📚",
      descripcion: "Explica el temario sin dar la respuesta hecha",
      instrucciones:
        "Me ayudas a estudiar.\nNunca das la solución directa: haces preguntas y das pistas hasta que salga sola.\nSi me atasco dos veces seguidas, enseñas el primer paso y me dejas seguir.\nAl final, un resumen de lo que he aprendido en tres líneas.",
      tono: "cercano",
    },
    {
      nombre: "Segunda opinión",
      emoji: "🧭",
      descripcion: "Busca los fallos de mis ideas antes que nadie",
      instrucciones:
        "Tu trabajo es encontrar lo que falla en lo que te cuento, no darme la razón.\nEmpieza por el riesgo más grande y explica por qué lo es.\nDi qué tendría que ser verdad para que mi idea funcione.\nSi de verdad está bien, dilo en una línea y pasa a lo que mejoraría.",
      tono: "experto",
    },
  ],
  en: [
    {
      nombre: "Contract reviewer",
      emoji: "⚖️",
      descripcion: "Finds unfair clauses and explains them plainly",
      instrucciones:
        "You read contracts and flag what works against the person signing.\nFor each point: quote the clause, explain it in plain words and say whether it is negotiable.\nAlways end with the three things I should change before signing.\nYou do not give legal advice: you get me ready to talk to a lawyer.",
      tono: "experto",
    },
    {
      nombre: "Community manager",
      emoji: "📣",
      descripcion: "Writes my posts in my usual voice",
      instrucciones:
        "You write social media posts.\nOne idea per post, short sentences, and no hollow words like \"synergy\" or \"disruptive\".\nStart with the hook, never with the context.\nGive me three versions and tell me which one you would pick.",
      tono: "chispa",
    },
    {
      nombre: "Private tutor",
      emoji: "📚",
      descripcion: "Explains the syllabus without giving the answer away",
      instrucciones:
        "You help me study.\nNever give the answer directly: ask questions and drop hints until it comes to me.\nIf I get stuck twice in a row, show the first step and let me carry on.\nAt the end, sum up what I learned in three lines.",
      tono: "cercano",
    },
    {
      nombre: "Second opinion",
      emoji: "🧭",
      descripcion: "Finds the holes in my ideas before anyone else does",
      instrucciones:
        "Your job is to find what is wrong with what I tell you, not to agree with me.\nStart with the biggest risk and explain why it is the biggest.\nSay what would have to be true for my idea to work.\nIf it is genuinely good, say so in one line and move on to what you would improve.",
      tono: "experto",
    },
  ],
};

const VACIA: EntradaMente = {
  nombre: "",
  emoji: "🧠",
  descripcion: "",
  instrucciones: "",
  tono: null,
};

export function MentesCliente({ inicial }: { inicial: Mente[] }) {
  const { t, lang } = useUi();
  const perfil = usePerfil();
  const [mentes, setMentes] = useState(inicial);
  const [borrador, setBorrador] = useState<EntradaMente | null>(null);

  const abrir = (m: Mente) => setBorrador({ ...m });

  return (
    <Section icon={Brain} title={t("app.mentes")} lead={t("mente.lead")} soon={false}>
      {mentes.length === 0 && (
        <div className="mb-6">
          <h2 className="text-[15px] font-semibold">{t("mente.templates")}</h2>
          <p className="mt-1 text-[13px] text-faint">{t("mente.templatesSub")}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mentes.map((m) => (
          <div
            key={m.id}
            className="flex flex-col rounded-2xl border border-line bg-panel p-5"
          >
            <span className="text-[24px]">{m.emoji}</span>
            <h3 className="mt-3 text-[15px] font-semibold">{m.nombre}</h3>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">
              {m.descripcion || m.instrucciones.slice(0, 90)}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <Link
                href={`/chat?mente=${m.id}`}
                className="rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] font-medium text-muted transition hover:border-line-hi hover:text-fg"
              >
                {t("mente.use")}
              </Link>
              <button
                onClick={() => abrir(m)}
                className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-faint transition hover:text-fg"
              >
                {t("mente.edit")}
              </button>
            </div>
          </div>
        ))}

        {/* Con la lista vacía las plantillas ocupan el hueco: se abre el
            editor ya relleno y solo hay que retocar. */}
        {mentes.length === 0 &&
          PLANTILLAS[lang].map((p) => (
            <button
              key={p.nombre}
              onClick={() => setBorrador({ ...p })}
              className="rounded-2xl border border-dashed border-line-hi bg-panel/40 p-5 text-left transition hover:bg-panel"
            >
              <span className="text-[24px]">{p.emoji}</span>
              <span className="mt-3 block text-[15px] font-semibold">{p.nombre}</span>
              <span className="mt-1.5 block text-[13.5px] leading-relaxed text-muted">
                {p.descripcion}
              </span>
            </button>
          ))}

        <button
          onClick={() => setBorrador({ ...VACIA })}
          className="grid min-h-[150px] place-items-center rounded-2xl border border-dashed border-line-hi p-5 text-muted transition hover:bg-panel hover:text-fg"
        >
          <span className="text-center">
            <Plus className="mx-auto h-6 w-6" />
            <span className="mt-2 block text-[14px] font-medium">{t("mente.new")}</span>
            {mentes.length > 0 && (
              <span className="mt-1 block text-[12px] text-faint">
                {mentes.length} / {MENTE.porPersona}
              </span>
            )}
          </span>
        </button>
      </div>

      {borrador && (
        <Editor
          borrador={borrador}
          demo={perfil.demo}
          onCerrar={() => setBorrador(null)}
          onGuardada={(m) => {
            setMentes((v) => {
              const i = v.findIndex((x) => x.id === m.id);
              if (i === -1) return [...v, m];
              const copia = [...v];
              copia[i] = m;
              return copia;
            });
            setBorrador(null);
          }}
          onBorrada={(id) => {
            setMentes((v) => v.filter((x) => x.id !== id));
            setBorrador(null);
          }}
        />
      )}
    </Section>
  );
}

function Editor({
  borrador,
  demo,
  onCerrar,
  onGuardada,
  onBorrada,
}: {
  borrador: EntradaMente;
  demo: boolean;
  onCerrar: () => void;
  onGuardada: (m: Mente) => void;
  onBorrada: (id: string) => void;
}) {
  const { t, lang } = useUi();
  const [campos, setCampos] = useState(borrador);
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string>();

  const cambiar = (parte: Partial<EntradaMente>) =>
    setCampos((c) => ({ ...c, ...parte }));

  const guardar = async () => {
    setError(undefined);
    setOcupado(true);
    const r = await guardarMente(campos);
    setOcupado(false);

    if (r.ok) return onGuardada(r.mente);

    setError(
      t(
        r.motivo === "demo"
          ? "mente.errDemo"
          : r.motivo === "limite"
            ? "mente.errLimit"
            : r.motivo === "nombre"
              ? "mente.errName"
              : r.motivo === "instrucciones"
                ? "mente.errInstr"
                : "mente.errSave",
      ),
    );
  };

  const borrar = async () => {
    if (!campos.id) return;
    // En la demo las Mentes son de mentira: ni se guardan ni se borran.
    if (demo) return setError(t("mente.errDemo"));
    setOcupado(true);
    const r = await borrarMente(campos.id);
    setOcupado(false);
    if (r.ok) onBorrada(campos.id);
    else setError(t("mente.errSave"));
  };

  const etiqueta = "block text-[12.5px] font-medium text-muted";
  const caja =
    "mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[14px] outline-none transition focus:border-line-hi";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onCerrar}
        aria-label={t("mente.cancel")}
      />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-panel p-6 pb-0 shadow-[var(--shadow)] sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">
            {campos.id ? t("mente.editTitle") : t("mente.newTitle")}
          </h2>
          <button
            onClick={onCerrar}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint transition hover:bg-panel-hi hover:text-fg"
            aria-label={t("mente.cancel")}
          >
            <Close className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <span className={etiqueta}>{t("mente.icon")}</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => cambiar({ emoji: e })}
                  className={`grid h-9 w-9 place-items-center rounded-lg border text-[17px] transition ${
                    campos.emoji === e
                      ? "border-acento bg-panel-hi"
                      : "border-line hover:bg-panel-hi"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={etiqueta}>{t("mente.name")}</span>
            <input
              value={campos.nombre}
              onChange={(e) => cambiar({ nombre: e.target.value })}
              maxLength={MENTE.nombre}
              placeholder={t("mente.namePh")}
              className={caja}
            />
          </label>

          <label className="block">
            <span className={etiqueta}>{t("mente.desc")}</span>
            <input
              value={campos.descripcion}
              onChange={(e) => cambiar({ descripcion: e.target.value })}
              maxLength={MENTE.descripcion}
              placeholder={t("mente.descPh")}
              className={caja}
            />
          </label>

          <label className="block">
            <span className={etiqueta}>{t("mente.instr")}</span>
            <textarea
              value={campos.instrucciones}
              onChange={(e) => cambiar({ instrucciones: e.target.value })}
              maxLength={MENTE.instrucciones}
              rows={14}
              placeholder={t("mente.instrPh")}
              className={`${caja} min-h-[260px] resize-y leading-relaxed`}
            />
            <span className="mt-1.5 flex items-start justify-between gap-3 text-[12px] text-faint">
              <span className="leading-relaxed">{t("mente.instrHelp")}</span>
              <span className="shrink-0 font-mono">
                {campos.instrucciones.length}/{MENTE.instrucciones}
              </span>
            </span>
          </label>

          <div>
            <span className={etiqueta}>{t("mente.tone")}</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[{ id: null, es: t("mente.toneInherit"), en: t("mente.toneInherit") }, ...TONOS].map(
                (to) => (
                  <button
                    key={to.id ?? "hereda"}
                    onClick={() => cambiar({ tono: to.id })}
                    className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] transition ${
                      campos.tono === to.id
                        ? "border-acento bg-panel-hi text-fg"
                        : "border-line text-muted hover:bg-panel-hi"
                    }`}
                  >
                    {lang === "es" ? to.es : to.en}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {demo && !error && (
          <p className="mt-4 text-[12.5px] text-faint">{t("mente.errDemo")}</p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-[13px] text-gold">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-6 mt-6 flex items-center gap-2 border-t border-line bg-panel px-6 py-4">
          <button
            onClick={guardar}
            disabled={ocupado}
            className="brand-grad inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {ocupado ? t("mente.saving") : t("mente.save")}
          </button>

          <button
            onClick={onCerrar}
            className="rounded-xl px-3 py-2.5 text-[13.5px] text-faint transition hover:text-fg"
          >
            {t("mente.cancel")}
          </button>

          {campos.id &&
            (confirmando ? (
              <span className="ml-auto flex items-center gap-2 text-[12.5px] text-muted">
                {t("mente.deleteAsk")}
                <button
                  onClick={borrar}
                  disabled={ocupado}
                  className="rounded-lg border border-gold/40 px-2.5 py-1.5 font-medium text-gold transition hover:bg-gold/10"
                >
                  {t("mente.delete")}
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmando(true)}
                className="ml-auto rounded-lg px-2.5 py-1.5 text-[12.5px] text-faint transition hover:text-gold"
              >
                {t("mente.delete")}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
