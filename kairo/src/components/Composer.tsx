"use client";

import { useEffect, useRef, useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import { LEVELS, type Level } from "@/lib/mock";
import { NIVELES_POR_PLAN } from "@/lib/planes";
import { usePerfil } from "@/lib/perfil-cliente";
import type { Mente } from "@/lib/tipos";
import { Bolt, Brain, Chevron, Clip, Close, Mic, Send } from "./Icons";
import Link from "next/link";

const LEVEL_META: { id: Level; label: TKey; desc: TKey }[] = [
  { id: "fast", label: "app.fast", desc: "app.fastDesc" },
  { id: "normal", label: "app.normal", desc: "app.normalDesc" },
  { id: "forja", label: "app.forja", desc: "app.forjaDesc" },
  { id: "mega", label: "app.mega", desc: "app.megaDesc" },
];

export function Composer({
  level,
  setLevel,
  mente,
  setMente,
  onSend,
  busy,
}: {
  level: Level;
  setLevel: (l: Level) => void;
  mente: Mente | null;
  setMente: (m: Mente | null) => void;
  onSend: (text: string) => void;
  busy: boolean;
}) {
  const { t } = useUi();
  const perfil = usePerfil();
  const permitidos = NIVELES_POR_PLAN[perfil.plan];
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [menuMente, setMenuMente] = useState(false);
  // null = todavía no se han pedido. Se piden al abrir el desplegable,
  // no al cargar el chat: abrir el chat sigue costando una consulta.
  const [mentes, setMentes] = useState<Mente[] | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const wrapMente = useRef<HTMLDivElement>(null);

  const abrirMentes = async () => {
    const abriendo = !menuMente;
    setMenuMente(abriendo);
    if (!abriendo || mentes) return;
    try {
      const r = await fetch("/api/mentes");
      const j = await r.json();
      setMentes(Array.isArray(j?.mentes) ? j.mentes : []);
    } catch {
      setMentes([]);
    }
  };

  // La caja crece con el texto, hasta un máximo
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  // Cerrar los desplegables al pulsar fuera
  useEffect(() => {
    if (!menu && !menuMente) return;
    const close = (e: MouseEvent) => {
      const dentro = (r: React.RefObject<HTMLDivElement | null>) =>
        r.current?.contains(e.target as Node);
      if (!dentro(wrap)) setMenu(false);
      if (!dentro(wrapMente)) setMenuMente(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu, menuMente]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    onSend(value);
    setText("");
  };

  const current = LEVEL_META.find((l) => l.id === level)!;

  return (
    <div className="border-t border-line bg-bg px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-line bg-panel transition focus-within:border-line-hi">
          <textarea
            ref={box}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("app.placeholder")}
            className="block w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed outline-none placeholder:text-faint"
          />

          <div className="flex items-center gap-1.5 px-2.5 pb-2.5 pt-1">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-panel-hi hover:text-fg"
              title={t("app.attach")}
              aria-label={t("app.attach")}
            >
              <Clip className="h-[18px] w-[18px]" />
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-panel-hi hover:text-fg"
              title={t("app.voice")}
              aria-label={t("app.voice")}
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>

            {/* Selector de Mente. Compacto a propósito: al lado del de
                nivel, y en el móvil solo el icono cuando no hay ninguna. */}
            <div className="relative" ref={wrapMente}>
              <button
                onClick={abrirMentes}
                aria-expanded={menuMente}
                title={t("mente.one")}
                className={`inline-flex max-w-[150px] items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[12.5px] font-medium transition ${
                  mente
                    ? "border-acento/50 bg-acento/10 text-fg"
                    : "border-line text-muted hover:border-line-hi hover:text-fg"
                }`}
              >
                {mente ? (
                  <>
                    <span className="text-[14px] leading-none">{mente.emoji}</span>
                    <span className="truncate">{mente.nombre}</span>
                  </>
                ) : (
                  <Brain className="h-[15px] w-[15px]" />
                )}
              </button>

              {mente && (
                <button
                  onClick={() => setMente(null)}
                  title={t("mente.none")}
                  aria-label={t("mente.none")}
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border border-line bg-panel text-faint transition hover:text-fg"
                >
                  <Close className="h-2.5 w-2.5" />
                </button>
              )}

              {menuMente && (
                <div className="absolute bottom-full left-0 z-30 mb-2 w-[260px] overflow-hidden rounded-xl border border-line bg-panel shadow-[var(--shadow)]">
                  <button
                    onClick={() => {
                      setMente(null);
                      setMenuMente(false);
                    }}
                    className={`flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition hover:bg-panel-hi ${
                      mente ? "" : "bg-panel-hi"
                    }`}
                  >
                    <Brain className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium">{t("mente.none")}</span>
                      <span className="block text-[12px] text-faint">{t("mente.noneDesc")}</span>
                    </span>
                  </button>

                  <div className="max-h-[210px] overflow-y-auto border-t border-line">
                    {(mentes ?? []).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMente(m);
                          setMenuMente(false);
                        }}
                        className={`flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition hover:bg-panel-hi ${
                          mente?.id === m.id ? "bg-panel-hi" : ""
                        }`}
                      >
                        <span className="mt-0.5 shrink-0 text-[15px] leading-none">{m.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">
                            {m.nombre}
                          </span>
                          {m.descripcion && (
                            <span className="block truncate text-[12px] text-faint">
                              {m.descripcion}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Link
                    href="/mentes"
                    onClick={() => setMenuMente(false)}
                    className="block border-t border-line px-3.5 py-2.5 text-[12.5px] text-muted transition hover:bg-panel-hi hover:text-fg"
                  >
                    {t("mente.manage")}
                  </Link>
                </div>
              )}
            </div>

            <div className="relative ml-auto" ref={wrap}>
              <button
                onClick={() => setMenu((v) => !v)}
                aria-expanded={menu}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] font-medium text-muted transition hover:border-line-hi hover:text-fg"
              >
                <Bolt className="h-3.5 w-3.5" style={{ color: LEVELS[level].color }} />
                {t(current.label)}
                <span className="text-faint">
                  {LEVELS[level].credits} {t("app.cr")}
                </span>
                <Chevron className={`h-3.5 w-3.5 transition ${menu ? "rotate-180" : ""}`} />
              </button>

              {menu && (
                <div className="absolute bottom-full right-0 z-30 mb-2 w-[290px] overflow-hidden rounded-xl border border-line bg-panel shadow-[var(--shadow)]">
                  {LEVEL_META.map((l) => {
                    // Un nivel que el plan no incluye no se ofrece como si
                    // funcionara: se marca y se manda a la página de precios.
                    const bloqueado = !permitidos.includes(l.id);

                    const contenido = (
                      <>
                        <Bolt
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: bloqueado ? "var(--faint)" : LEVELS[l.id].color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium">{t(l.label)}</span>
                          <span className="block text-[12px] text-faint">
                            {bloqueado ? t("app.upgrade") : t(l.desc)}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[12px] text-muted">
                          {LEVELS[l.id].credits} {t("app.cr")}
                        </span>
                      </>
                    );

                    const clases = `flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:bg-panel-hi ${
                      level === l.id ? "bg-panel-hi" : ""
                    } ${bloqueado ? "opacity-55" : ""}`;

                    return bloqueado ? (
                      <Link key={l.id} href="/precios" className={clases} onClick={() => setMenu(false)}>
                        {contenido}
                      </Link>
                    ) : (
                      <button
                        key={l.id}
                        onClick={() => {
                          setLevel(l.id);
                          setMenu(false);
                        }}
                        className={clases}
                      >
                        {contenido}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={submit}
              disabled={!text.trim() || busy}
              className="brand-grad grid h-9 w-9 place-items-center rounded-lg text-on-accent transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
              title={t("app.send")}
              aria-label={t("app.send")}
            >
              <Send className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {perfil.demo && (
          <p className="mt-2 text-center text-[11.5px] text-faint">{t("app.demo")}</p>
        )}
      </div>
    </div>
  );
}
