"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import { useCredits } from "@/lib/credits";
import { usePerfil } from "@/lib/perfil-cliente";
import { NOMBRE_PLAN } from "@/lib/planes";
import { TITULO_MAX } from "@/lib/tipos";
import { useHistorial } from "@/lib/historial";
import { borrarConversacion, renombrarConversacion } from "@/app/(app)/actions";
import { Logo } from "./Logo";
import { LangToggle, ThemeToggle } from "./Toggles";
import {
  Bolt, Brain, Chat, Clock, Close, Code, Pencil, Plug, Plus, Settings, Team, Trash,
} from "./Icons";

const NAV: { href: string; label: TKey; icon: typeof Chat }[] = [
  { href: "/chat", label: "app.chats", icon: Chat },
  { href: "/mentes", label: "app.mentes", icon: Brain },
  { href: "/team", label: "app.team", icon: Team },
  { href: "/coworks", label: "app.coworks", icon: Clock },
  { href: "/codigo", label: "app.code", icon: Code },
  { href: "/conectores", label: "app.connectors", icon: Plug },
];

type Grupo = "today" | "week" | "earlier";

const GROUPS: { key: Grupo; label: TKey }[] = [
  { key: "today", label: "app.today" },
  { key: "week", label: "app.week" },
  { key: "earlier", label: "app.earlier" },
];

/* Se agrupa por el último mensaje, no por cuándo se creó la conversación:
   una de hace un mes que has retomado hoy tiene que salir en "Hoy". */
function grupoDe(iso: string): Grupo {
  const cuando = new Date(iso).getTime();
  const medianoche = new Date();
  medianoche.setHours(0, 0, 0, 0);

  if (cuando >= medianoche.getTime()) return "today";
  if (Date.now() - cuando < 7 * 24 * 60 * 60 * 1000) return "week";
  return "earlier";
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { t, lang } = useUi();
  const conversaciones = useHistorial();
  const pathname = usePathname();
  const router = useRouter();
  const abierta = useSearchParams().get("c");
  const { credits, total } = useCredits();
  const perfil = usePerfil();
  const pct = Math.round((credits / total) * 100);

  const [editando, setEditando] = useState<string>();
  const [borrando, setBorrando] = useState<string>();
  const [oculta, setOculta] = useState<string[]>([]);

  const lista = conversaciones.filter((c) => !oculta.includes(c.id));

  const borrar = async (id: string) => {
    // Desaparece de la lista al instante; si la base de datos dice que no,
    // vuelve. Esperar a la respuesta para quitarla se nota y molesta.
    setOculta((v) => [...v, id]);
    setBorrando(undefined);
    const r = await borrarConversacion(id);
    if (!r.ok) return setOculta((v) => v.filter((x) => x !== id));
    if (abierta === id) router.push("/chat");
    router.refresh();
  };

  const renombrar = async (id: string, titulo: string) => {
    setEditando(undefined);
    const r = await renombrarConversacion(id, titulo);
    if (r.ok) router.refresh();
  };

  return (
    <div className="flex h-full w-[264px] shrink-0 flex-col border-r border-line bg-bg-soft">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Kairo">
          <Logo />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-panel-hi hover:text-fg lg:hidden"
            aria-label={t("menu.close")}
          >
            <Close className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-3">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl border border-line-hi px-3 py-2.5 text-[14px] font-medium transition hover:bg-panel-hi"
        >
          <Plus className="h-4 w-4" />
          {t("app.newChat")}
        </Link>
      </div>

      {/* Navegación */}
      <nav className="mt-4 space-y-0.5 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href && !(item.href === "/chat" && abierta);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition ${
                active ? "bg-panel-hi font-medium text-fg" : "text-muted hover:bg-panel hover:text-fg"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {t(item.label)}
            </Link>
          );
        })}
      </nav>

      {/* Historial */}
      <div className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
        {lista.length === 0 && (
          <p className="px-3 py-2 text-[12.5px] leading-relaxed text-faint">
            {t("chat.empty")}
          </p>
        )}

        {GROUPS.map((g) => {
          const items = lista.filter((c) => grupoDe(c.actualizadaEl) === g.key);
          if (!items.length) return null;

          return (
            <div key={g.key} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
                {t(g.label)}
              </p>

              {items.map((c) =>
                editando === c.id ? (
                  <input
                    key={c.id}
                    autoFocus
                    defaultValue={c.titulo}
                    maxLength={TITULO_MAX}
                    onBlur={(e) => renombrar(c.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditando(undefined);
                    }}
                    className="mb-0.5 w-full rounded-lg border border-acento bg-panel px-3 py-[6px] text-[13.5px] outline-none"
                  />
                ) : borrando === c.id ? (
                  <div className="mb-0.5 flex items-center gap-2 rounded-lg bg-panel px-3 py-[7px] text-[13px]">
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {t("chat.deleteAsk")}
                    </span>
                    <button
                      onClick={() => borrar(c.id)}
                      className="font-medium text-gold transition hover:underline"
                    >
                      {t("chat.yes")}
                    </button>
                    <button
                      onClick={() => setBorrando(undefined)}
                      className="text-faint transition hover:text-fg"
                    >
                      {t("chat.no")}
                    </button>
                  </div>
                ) : (
                  <div key={c.id} className="group relative">
                    <Link
                      href={`/chat?c=${c.id}`}
                      onClick={onClose}
                      title={c.titulo}
                      className={`block truncate rounded-lg py-[7px] pl-3 pr-14 text-[13.5px] transition ${
                        abierta === c.id
                          ? "bg-panel-hi font-medium text-fg"
                          : "text-muted hover:bg-panel hover:text-fg"
                      }`}
                    >
                      {c.titulo}
                    </Link>

                    <span className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
                      <button
                        onClick={() => setEditando(c.id)}
                        title={t("chat.rename")}
                        aria-label={t("chat.rename")}
                        className="grid h-6 w-6 place-items-center rounded text-faint transition hover:bg-panel-hi hover:text-fg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setBorrando(c.id)}
                        title={t("chat.delete")}
                        aria-label={t("chat.delete")}
                        className="grid h-6 w-6 place-items-center rounded text-faint transition hover:bg-panel-hi hover:text-gold"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                ),
              )}
            </div>
          );
        })}
      </div>

      {/* Créditos y perfil */}
      <div className="border-t border-line p-3">
        <Link
          href="/precios"
          onClick={onClose}
          className="block rounded-xl border border-line bg-panel p-3 transition hover:border-line-hi"
        >
          <div className="flex items-center justify-between text-[13px]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Bolt className="h-3.5 w-3.5 text-gold" />
              {credits.toLocaleString(lang)}
            </span>
            <span className="text-faint">{t("app.credits")}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-hi">
            <div className="brand-grad h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <Link
            href="/ajustes"
            onClick={onClose}
            className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] transition hover:bg-panel"
          >
            <span className="brand-grad grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold text-on-accent">
              {(perfil.nombre || "?").charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{perfil.nombre}</span>
              <span className="block text-[11.5px] text-faint">{NOMBRE_PLAN[perfil.plan]}</span>
            </span>
            <Settings className="h-4 w-4 shrink-0 text-faint" />
          </Link>
        </div>

        <div className="mt-2 flex gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
