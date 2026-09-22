"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUi, type TKey } from "@/lib/i18n";
import { conversations, pick } from "@/lib/mock";
import { useCredits } from "@/lib/credits";
import { usePerfil } from "@/lib/perfil-cliente";
import { NOMBRE_PLAN } from "@/lib/planes";
import { Logo } from "./Logo";
import { LangToggle, ThemeToggle } from "./Toggles";
import { Bolt, Brain, Chat, Clock, Close, Code, Plug, Plus, Settings } from "./Icons";

const NAV: { href: string; label: TKey; icon: typeof Chat }[] = [
  { href: "/chat", label: "app.chats", icon: Chat },
  { href: "/mentes", label: "app.mentes", icon: Brain },
  { href: "/coworks", label: "app.coworks", icon: Clock },
  { href: "/codigo", label: "app.code", icon: Code },
  { href: "/conectores", label: "app.connectors", icon: Plug },
];

const GROUPS: { key: "today" | "week" | "earlier"; label: TKey }[] = [
  { key: "today", label: "app.today" },
  { key: "week", label: "app.week" },
  { key: "earlier", label: "app.earlier" },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { t, lang } = useUi();
  const pathname = usePathname();
  const { credits, total } = useCredits();
  const perfil = usePerfil();
  const pct = Math.round((credits / total) * 100);

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
          const active = pathname === item.href;
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
        {GROUPS.map((g) => {
          const items = conversations.filter((c) => c.group === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
                {t(g.label)}
              </p>
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={onClose}
                  className="block w-full truncate rounded-lg px-3 py-[7px] text-left text-[13.5px] text-muted transition hover:bg-panel hover:text-fg"
                  title={pick(c.title, lang)}
                >
                  {pick(c.title, lang)}
                </button>
              ))}
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
