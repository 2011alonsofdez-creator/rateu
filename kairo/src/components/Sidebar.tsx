"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import { miles } from "@/lib/formato";
import { useCredits } from "@/lib/credits";
import { usePerfil } from "@/lib/perfil-cliente";
import { NOMBRE_PLAN } from "@/lib/planes";
import { TITULO_MAX } from "@/lib/tipos";
import { useHistorial } from "@/lib/historial";
import { borrarApp, renombrarApp, useAppsCode } from "@/lib/apps-code";
import { borrarConversacion, renombrarConversacion } from "@/app/(app)/actions";
import { Logo } from "./Logo";
import { LangToggle, ThemeToggle } from "./Toggles";
import { Bolt, Brain, Chat, Clock, Close, Code, Credito, Fichas, Papel, Pencil, Plus, Settings, Team, Trash } from "./Icons";

const NAV: { href: string; label: TKey; icon: typeof Chat }[] = [
  /* EL ORDEN NO ES ALFABÉTICO NI ES EL DE CUÁNDO SE HIZO CADA UNO.
 
     Es el de lo que la gente viene a hacer. Antes, los dos sitios más
     valiosos después de Chats los ocupaban Mentes y Gist —lo que hacen
     mejor ChatGPT y NotebookLM—, mientras Paperwork era el cuarto y
     Co-Works el séptimo. O sea: lo que nos diferencia, escondido debajo
     de lo que nos empata.
 
     Ahora van primero las tres que no tiene nadie: el papel que te
     llega, el encargo que se hace solo y el equipo que contratas.
     Mentes y Gist siguen ahí, al final, para quien las use. */
  { href: "/chat", label: "app.chats", icon: Chat },
  { href: "/paperwork", label: "app.paperwork", icon: Papel },
  { href: "/coworks", label: "app.coworks", icon: Clock },
  { href: "/team", label: "app.team", icon: Team },
  { href: "/code", label: "app.code", icon: Code },
  { href: "/mentes", label: "app.mentes", icon: Brain },
  { href: "/gist", label: "app.gist", icon: Fichas },
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
  const params = useSearchParams();
  const abierta = params.get("c");
  /* EN CODE, OTRA BARRA. Code es su propio sitio, como Claude Code: en
     vez de las secciones y los chats, sale el historial de apps. */
  const enCode = pathname.startsWith("/code");
  const appAbierta = params.get("app");
  const apps = useAppsCode(enCode);
  const { credits, total } = useCredits();
  const perfil = usePerfil();
  const pct = Math.round((credits / total) * 100);

  /* UN SEMÁFORO, NO UNA BARRA DE ADORNO.
 
     Era siempre del naranja de la marca, al 95% y al 3%. Una barra que
     se ve igual cuando vas sobrado que cuando estás a punto de quedarte
     sin nada no avisa de nada: solo decora.
 
     Así que verde, amarillo y rojo, que es lo único que no hay que
     explicar. Y el número de al lado va del mismo color: dos formas de
     decir lo mismo a la vez, no dos cosas distintas.
 
     Los escalones son 70 y 40. El amarillo entra pronto a propósito:
     un MEGA cuesta 240 de los 2.000 de Kairo+, o sea un 12%, y con el
     aviso en el 20% te enterabas cuando ya no te llegaba ni para uno.
 
     Las clases van escritas enteras y no montadas con `bg-${...}`,
     porque Tailwind busca los nombres leyendo el código: lo que se
     arma en marcha no lo encuentra, y el día que lo hagas te quedas
     sin barra y sin saber por qué. */
  const comoVa = pct >= 70 ? "bg-green" : pct >= 40 ? "bg-gold" : "bg-red";
  const tinta = pct >= 70 ? "text-green" : pct >= 40 ? "text-gold" : "text-red";

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
    <>
    {/* ARRIBA EL LOGO Y ABAJO EL LÍMITE, QUIETOS; LO DE EN MEDIO SE DESLIZA.
          Antes solo se deslizaba el historial, y en una pantalla baja las
          secciones no cabían. Pero el límite, el perfil y el modo noche
          tienen que verse siempre, sin bajar a buscarlos. */}
    <div className="flex h-full w-[264px] shrink-0 flex-col border-r border-line bg-bg-soft">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Kairo">
          <Logo />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-row lg:hidden"
            aria-label={t("menu.close")}
          >
            <Close className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {enCode ? (
        <>
      <div className="space-y-1 px-3">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-muted transition hover:bg-row hover:text-fg"
        >
          <Chat className="h-[18px] w-[18px]" />
          {t("codeBar.back")}
        </Link>
        <Link
          href="/code"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl border border-line-hi px-3 py-2.5 text-[14px] font-medium transition hover:bg-row"
        >
          <Plus className="h-4 w-4" />
          {t("codeBar.new")}
        </Link>
      </div>

      <div className="mt-5 flex-1 px-3 pb-4">
        <p className="flex items-center gap-2 px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
          <Code className="h-3.5 w-3.5" />
          {t("codeBar.title")}
        </p>
        {apps.filter((a) => !oculta.includes(a.id)).length === 0 && (
          <p className="px-3 py-2 text-[12.5px] leading-relaxed text-faint">{t("codeBar.empty")}</p>
        )}
        {GROUPS.map((g) => {
          const items = apps.filter(
            (a) => !oculta.includes(a.id) && grupoDe(a.actualizadaEl) === g.key,
          );
          if (!items.length) return null;
          return (
            <div key={g.key} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
                {t(g.label)}
              </p>
              {items.map((a) =>
                editando === a.id ? (
                  <input
                    key={a.id}
                    autoFocus
                    defaultValue={a.titulo}
                    maxLength={80}
                    onBlur={(e) => {
                      setEditando(undefined);
                      renombrarApp(a.id, e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditando(undefined);
                    }}
                    className="mb-0.5 w-full rounded-lg border border-acento bg-panel px-3 py-[6px] text-[13.5px] outline-none"
                  />
                ) : borrando === a.id ? (
                  <div key={a.id} className="mb-0.5 flex items-center gap-2 rounded-lg bg-row-sel px-3 py-[7px] text-[13px]">
                    <span className="min-w-0 flex-1 truncate text-muted">{t("codeBar.deleteAsk")}</span>
                    <button
                      onClick={async () => {
                        setBorrando(undefined);
                        setOculta((v) => [...v, a.id]);
                        const ok = await borrarApp(a.id);
                        if (!ok) return setOculta((v) => v.filter((x) => x !== a.id));
                        if (appAbierta === a.id) router.push("/code");
                      }}
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
                  <div key={a.id} className="group relative">
                    <Link
                      href={`/code?app=${a.id}`}
                      onClick={onClose}
                      title={a.titulo}
                      className={`block truncate rounded-lg py-[7px] pl-3 pr-14 text-[13.5px] transition ${
                        appAbierta === a.id ? "bg-row-sel font-medium" : "hover:bg-row"
                      }`}
                    >
                      {a.titulo}
                    </Link>
                    <span className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
                      <button
                        onClick={() => setEditando(a.id)}
                        title={t("chat.rename")}
                        aria-label={t("chat.rename")}
                        className="grid h-6 w-6 place-items-center rounded text-faint transition hover:bg-row-sel hover:text-fg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setBorrando(a.id)}
                        title={t("codeBar.delete")}
                        aria-label={t("codeBar.delete")}
                        className="grid h-6 w-6 place-items-center rounded text-faint transition hover:bg-row-sel hover:text-gold"
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

        </>
      ) : (
        <>
      <div className="px-3">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl border border-line-hi px-3 py-2.5 text-[14px] font-medium transition hover:bg-row"
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
                active ? "bg-row-sel font-medium" : "hover:bg-row"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {t(item.label)}
            </Link>
          );
        })}
      </nav>

      {/* Historial */}
      <div className="mt-5 flex-1 px-3 pb-4">
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
                  <div className="mb-0.5 flex items-center gap-2 rounded-lg bg-row-sel px-3 py-[7px] text-[13px]">
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
                          ? "bg-row-sel font-medium"
                          : "hover:bg-row"
                      }`}
                    >
                      {c.titulo}
                    </Link>

                    <span className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
                      <button
                        onClick={() => setEditando(c.id)}
                        title={t("chat.rename")}
                        aria-label={t("chat.rename")}
                        className="grid h-6 w-6 place-items-center rounded text-faint transition hover:bg-row-sel hover:text-fg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setBorrando(c.id)}
                        title={t("chat.delete")}
                        aria-label={t("chat.delete")}
                        className="grid h-6 w-6 place-items-center rounded text-faint transition hover:bg-row-sel hover:text-gold"
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

        </>
      )}

      </div>

      {/* Créditos y perfil */}
      <div className="shrink-0 border-t border-line p-3">
        <Link
          href="/precios"
          onClick={onClose}
          title={`${miles(credits, lang)} / ${miles(total, lang)} ${t("app.credits")}`}
          className="block rounded-xl border border-line bg-panel p-3 transition hover:border-line-hi"
        >
          {/* EL PORCENTAJE, Y NO EL NÚMERO.
 
              "840" no dice nada si no te acuerdas de con cuántos
              empezabas; "84%" se entiende sin acordarse de nada. El
              número exacto sigue a un palmo: sale al poner el ratón
              encima, para cuando la pregunta es "¿me llega para un
              MEGA?". */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-faint">
              <Credito className={`h-3.5 w-3.5 shrink-0 ${tinta}`} />
              <span className="truncate">{t("app.credits")}</span>
            </span>
            <span className={`shrink-0 text-[13.5px] font-semibold tabular-nums ${tinta}`}>
              {pct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-hi">
            <div
              className={`${comoVa} h-full rounded-full transition-[width,background-color] duration-500`}
              /* Un hilo mínimo aunque no quede nada: una barra vacía
                 del todo se lee como "esto está roto". */
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <Link
            href="/ajustes"
            onClick={onClose}
            className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] transition hover:bg-row"
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
    </>
  );
}
