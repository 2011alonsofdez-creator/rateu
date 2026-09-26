"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { useCredits } from "@/lib/credits";
import { Markdown } from "@/components/Markdown";
import { Fuentes } from "@/components/Fuentes";
import { Marca } from "@/components/Logo";
import { Arrow, Chat as ChatIcon, Close, Fichas as IconoFichas, Trash } from "@/components/Icons";
import type { Fuente } from "@/lib/tipos";
import { enlaceConMinuto, idDeYoutube, segundosDe } from "@/lib/fichas";

/* Gist: los apuntes de un enlace, guardados.
 *
 * La diferencia con pegarle el enlace al chat es que esto NO se pierde.
 * Un resumen en el chat se hunde en el historial a los dos días; una
 * ficha sigue aquí en marzo, con su buscador y su botón de seguir
 * preguntando.
 */

type Ficha = {
  id: string;
  tipo: "video" | "web";
  url: string;
  titulo: string;
  autor: string;
  resumen: string;
  puntos: { marca: string; texto: string }[] | null;
  fuentes: Fuente[] | null;
  modelo: string | null;
  creada_el: string;
};

export default function GistPage() {
  const { t, lang } = useUi();
  const perfil = usePerfil();
  const { sincronizar } = useCredits();
  const router = useRouter();

  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [url, setUrl] = useState("");
  const [trabajando, setTrabajando] = useState<"" | "video" | "web">("");
  const [error, setError] = useState<string>();
  const [falta, setFalta] = useState(false);
  const [abierta, setAbierta] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/gist")
      .then((r) => r.json())
      .then((j) => {
        setFichas(Array.isArray(j?.fichas) ? j.fichas : []);
        setFalta(Boolean(j?.falta));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const resumir = async () => {
    const limpia = url.trim();
    if (!limpia || trabajando) return;

    const esVideo = /youtube\.com|youtu\.be/i.test(limpia);
    setError(undefined);
    setTrabajando(esVideo ? "video" : "web");

    try {
      const r = await fetch("/api/gist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: limpia }),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok) {
        setError(
          j?.error === "enlace_no_valido"
            ? "gist.badUrl"
            : j?.error === "sin_clave"
              ? "gist.noKey"
              : j?.error === "sin_creditos"
                ? "gist.noCredits"
                : j?.error === "demo"
                  ? "code.demo"
                  : "gist.failed",
        );
        return;
      }

      setFichas((v) => [j.ficha as Ficha, ...v]);
      setUrl("");
      setAbierta(j.ficha as Ficha);
      if (!j.guardada) setFalta(true);
      // El saldo ha bajado: que la barra lateral se entere.
      router.refresh();
    } catch {
      setError("err.red");
    } finally {
      setTrabajando("");
    }
  };

  const borrar = async (f: Ficha) => {
    setFichas((v) => v.filter((x) => x.id !== f.id));
    setAbierta(null);
    if (f.id) await fetch(`/api/gist?id=${f.id}`, { method: "DELETE" }).catch(() => {});
  };

  /* "Preguntar sobre esto" deja la pregunta escrita en el chat en vez
     de mandarla: casi siempre quieres añadirle algo tuyo antes. */
  const preguntar = (f: Ficha) => {
    try {
      sessionStorage.setItem(
        "kairo.borrador",
        `Sobre "${f.titulo}" (${f.url}), que ya has resumido:\n\n`,
      );
    } catch {
      /* sin memoria: se abre el chat vacío y ya está */
    }
    router.push("/chat");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <IconoFichas className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">{t("app.gist")}</h1>
        {fichas.length > 0 && (
          <span className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-faint">
            {t("gist.count").replace("{n}", String(fichas.length))}
          </span>
        )}
      </div>
      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{t("gist.lead")}</p>

      {/* Pegar el enlace */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && resumir()}
          type="url"
          inputMode="url"
          placeholder={t("gist.placeholder")}
          aria-label={t("gist.placeholder")}
          className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 py-3 text-[14.5px] outline-none transition focus:border-line-hi"
        />
        <button
          onClick={resumir}
          disabled={!url.trim() || Boolean(trabajando)}
          className="brand-grad shrink-0 rounded-xl px-5 py-3 text-[14.5px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          {trabajando ? t("gist.working") : t("gist.go")}
        </button>
      </div>

      {trabajando && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-panel px-4 py-3">
          <Marca className="h-5 w-5 shrink-0" animada />
          <p className="text-[13.5px] text-muted">
            {t(trabajando === "video" ? "gist.workingVideo" : "gist.workingWeb")}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] text-gold">
          {t(error as "gist.failed")}
        </p>
      )}

      {falta && !perfil.demo && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] text-gold">
          {t("gist.needsMigration")}
        </p>
      )}

      {/* Las fichas */}
      {!cargando && fichas.length === 0 && !trabajando && (
        <p className="mt-10 text-center text-[14px] text-faint">{t("gist.empty")}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fichas.map((f) => {
          const idVideo = idDeYoutube(f.url);
          return (
            <button
              key={f.id || f.url}
              onClick={() => setAbierta(f)}
              className="overflow-hidden rounded-2xl border border-line bg-panel text-left transition hover:border-line-hi hover:bg-panel-hi"
            >
              {idVideo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://img.youtube.com/vi/${idVideo}/mqdefault.jpg`}
                  alt=""
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid aspect-video w-full place-items-center bg-bg-soft">
                  <IconoFichas className="h-7 w-7 text-faint" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2 text-[11px] text-faint">
                  <span className="rounded-full border border-line px-2 py-0.5">
                    {t(f.tipo === "video" ? "gist.video" : "gist.web")}
                  </span>
                  <span className="truncate">{f.autor || new URL(f.url).hostname}</span>
                </div>
                <h2 className="mt-2 line-clamp-2 text-[14.5px] font-semibold leading-snug">
                  {f.titulo}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                  {f.resumen.replace(/[#*`>-]/g, " ").slice(0, 160)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* La ficha abierta */}
      {abierta && (
        <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/60 p-0 sm:p-6">
          <button
            className="absolute inset-0 -z-10"
            onClick={() => setAbierta(null)}
            aria-label={t("menu.close")}
          />
          <div className="relative my-0 h-fit w-full max-w-3xl rounded-none border-line bg-bg sm:my-auto sm:rounded-2xl sm:border">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:rounded-t-2xl">
              <span className="truncate text-[13px] text-faint">
                {abierta.autor || new URL(abierta.url).hostname}
              </span>
              <button
                onClick={() => setAbierta(null)}
                aria-label={t("menu.close")}
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-faint transition hover:bg-panel-hi hover:text-fg"
              >
                <Close className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <h2 className="text-balance text-[22px] font-semibold leading-tight tracking-tight">
                {abierta.titulo}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={abierta.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-muted transition hover:border-line-hi hover:text-fg"
                >
                  <Arrow className="h-3.5 w-3.5" />
                  {t("gist.open")}
                </a>
                <button
                  onClick={() => preguntar(abierta)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-acento/50 bg-acento/10 px-2.5 py-1.5 text-[12.5px] font-medium text-acento transition hover:bg-acento/20"
                >
                  <ChatIcon className="h-3.5 w-3.5" />
                  {t("gist.ask")}
                </button>
                <button
                  onClick={() => borrar(abierta)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-faint transition hover:border-line-hi hover:text-fg"
                >
                  <Trash className="h-3.5 w-3.5" />
                  {t("gist.delete")}
                </button>
              </div>

              {Boolean(abierta.puntos?.length) && (
                <div className="mt-6 rounded-xl border border-line bg-bg-soft p-4">
                  <h3 className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
                    {t("gist.points")}
                  </h3>
                  <ol className="mt-2.5 space-y-2">
                    {abierta.puntos!.map((p, i) => (
                      <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug">
                        {p.marca ? (
                          abierta.tipo === "video" && segundosDe(p.marca) !== null ? (
                            <a
                              href={enlaceConMinuto(abierta.url, p.marca)}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="shrink-0 rounded-md border border-line bg-panel px-1.5 font-mono text-[11.5px] text-acento transition hover:border-acento/50"
                            >
                              {p.marca}
                            </a>
                          ) : (
                            <span className="shrink-0 rounded-md border border-line bg-panel px-1.5 font-mono text-[11.5px] text-faint">
                              {p.marca}
                            </span>
                          )
                        ) : (
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-faint" />
                        )}
                        <span className="text-muted">{p.texto}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-6">
                <Markdown text={abierta.resumen} />
              </div>

              <Fuentes fuentes={abierta.fuentes ?? undefined} />

              <p className="mt-6 border-t border-line pt-3 text-[11.5px] text-faint">
                {new Date(abierta.creada_el).toLocaleDateString(lang, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {abierta.modelo ? ` · ${abierta.modelo}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
