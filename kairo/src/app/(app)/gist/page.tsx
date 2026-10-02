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
import { GistChat } from "@/components/GistChat";
import { comienzoDe, enlaceConMinuto, idDeYoutube } from "@/lib/fichas";

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
  /* Con `titulo` es una parte del vídeo; sin él, una idea suelta con
     su minuto, que es como se guardaban las fichas antes. Las dos
     formas viven en la misma columna y las dos tienen que pintarse. */
  puntos: { marca: string; texto: string; titulo?: string }[] | null;
  fuentes: Fuente[] | null;
  modelo: string | null;
  creada_el: string;
};

/* UNA FICHA DE EJEMPLO, SOLO EN LA DEMOSTRACIÓN.
 *
 * Sin esto, quien entra sin cuenta ve una caja para pegar un enlace y
 * nada más: no hay forma de saber qué sale de ahí. Y lo que sale es
 * justo lo que hay que decidir si te interesa, porque cuesta un minuto
 * de espera y unos créditos.
 *
 * Es de mentira y se dice que lo es. Enseñar una ficha inventada sin
 * avisar sería peor que la caja vacía.
 */
const EJEMPLO: Ficha = {
  id: "demo-1",
  tipo: "video",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  titulo: "Así queda un vídeo resumido parte por parte",
  autor: "Ejemplo",
  resumen: "",
  puntos: [
    {
      marca: "0:00-1:30",
      titulo: "De qué va y por qué",
      texto:
        "Kairo ve el vídeo entero y lo cuenta por tramos, en orden, desde el minuto cero hasta el final. No son ideas sueltas: es el vídeo contado, de forma que se entiende sin haberlo visto.",
    },
    {
      marca: "1:30-4:10",
      titulo: "Los minutos son botones",
      texto:
        "Cada tramo lleva su minuto delante. Al pulsarlo se abre el vídeo justo en ese momento, así que puedes leer el resumen y saltar solo a la parte que te interese.",
    },
    {
      marca: "4:10-6:00",
      titulo: "Y queda guardado",
      texto:
        "La ficha se queda aquí. Un resumen en el chat se hunde en el historial a los dos días; esto sigue estando en marzo, con su buscador y su botón de seguir preguntando.",
    },
  ],
  fuentes: [],
  modelo: null,
  creada_el: new Date().toISOString(),
};

export default function GistPage() {
  const { t, lang } = useUi();
  const perfil = usePerfil();
  const { sincronizar } = useCredits();
  const router = useRouter();

  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [url, setUrl] = useState("");
  /* En qué idioma se quiere el resumen. Se pregunta y no se adivina:
     un vídeo en inglés resumido en inglés no le sirve a quien no lo
     habla, y resumirlo siempre en español le estorba a quien lo está
     estudiando. Viene en español porque es lo que querrá la mayoría. */
  const [idioma, setIdioma] = useState<"es" | "original">("es");
  const [trabajando, setTrabajando] = useState<"" | "video" | "web">("");
  const [error, setError] = useState<string>();
  const [falta, setFalta] = useState(false);
  const [abierta, setAbierta] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (perfil.demo) {
      setFichas([EJEMPLO]);
      setCargando(false);
      return;
    }
    fetch("/api/gist")
      .then((r) => r.json())
      .then((j) => {
        setFichas(Array.isArray(j?.fichas) ? j.fichas : []);
        setFalta(Boolean(j?.falta));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [perfil.demo]);

  const resumir = async () => {
    const limpia = url.trim();
    if (!limpia || trabajando) return;
    if (perfil.demo) return setError("code.demo");

    const esVideo = /youtube\.com|youtu\.be/i.test(limpia);
    setError(undefined);
    setTrabajando(esVideo ? "video" : "web");

    try {
      const r = await fetch("/api/gist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: limpia, idioma }),
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

  /* Lo de la ficha abierta, calculado una vez y no dentro del JSX.
     `minuto` solo se llama cuando hay ficha abierta, pero se comprueba
     igual: una pantalla no se cae por una comprobación de sobra. */
  const partes = (abierta?.puntos ?? []).filter((x) => x.titulo);
  const esVideo = abierta?.tipo === "video";

  /** La marca de tiempo. En un vídeo es un botón que salta a ese
   *  momento; en una página es solo la etiqueta del apartado. */
  const minuto = (marca: string) => {
    if (!abierta) return null;
    const salta = esVideo && comienzoDe(marca) !== null;
    return salta ? (
      <a
        href={enlaceConMinuto(abierta.url, marca)}
        target="_blank"
        rel="noreferrer noopener"
        className="shrink-0 rounded-md border border-line bg-panel px-1.5 py-0.5 font-mono text-[11.5px] text-acento transition hover:border-acento/50"
      >
        {marca}
      </a>
    ) : (
      <span className="shrink-0 rounded-md border border-line bg-panel px-1.5 py-0.5 font-mono text-[11.5px] text-faint">
        {marca}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <IconoFichas className="h-5 w-5" />
        </span>
        {/* "Kairo Gist", y Gist en la otra tipografía.
            No es un adorno: dice que esto es una herramienta de Kairo y
            no otra aplicación, igual que un "Code" en monoespaciada
            detrás de un nombre se lee solo. La fuente ya estaba
            cargada para los minutos, así que no cuesta ni una
            descarga. */}
        <h1 className="text-[24px] font-semibold tracking-tight">
          Kairo{" "}
          <span className="font-mono text-[21px] font-medium tracking-tight text-acento">
            Gist
          </span>
        </h1>
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

      {/* El idioma, preguntado antes y no después: rehacer el resumen
          para cambiarlo cuesta otro minuto de espera y otro crédito. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-faint">{t("gist.lang")}</span>
        {(["es", "original"] as const).map((cual) => (
          <button
            key={cual}
            onClick={() => setIdioma(cual)}
            aria-pressed={idioma === cual}
            className={`rounded-lg border px-2.5 py-1 text-[12.5px] transition ${
              idioma === cual
                ? "border-acento/50 bg-acento/10 font-medium text-acento"
                : "border-line text-muted hover:border-line-hi hover:text-fg"
            }`}
          >
            {t(cual === "es" ? "gist.langEs" : "gist.langOriginal")}
          </button>
        ))}
      </div>

      {trabajando && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-panel px-4 py-3">
          <Marca className="h-5 w-5 shrink-0" animada />
          <p className="text-[13.5px] text-muted">
            {t(trabajando === "video" ? "gist.workingParts" : "gist.workingWeb")}
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

              {/* El vídeo contado por partes.
                  Una parte lleva título; una idea suelta de las fichas
                  de antes, no. Por eso se distinguen así y no por una
                  columna nueva en la base de datos: lo ya guardado
                  sigue pintándose como siempre, sin migración. */}
              {partes.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
                    {t("gist.parts")}
                  </h3>
                  {esVideo && (
                    <p className="mt-1 text-[12.5px] text-faint">{t("gist.partsLead")}</p>
                  )}
                  <ol className="mt-4 space-y-5">
                    {partes.map((pt, i) => (
                      <li key={i} className="border-l-2 border-line pl-4">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {minuto(pt.marca)}
                          <h4 className="text-[15.5px] font-semibold leading-snug">{pt.titulo}</h4>
                        </div>
                        {pt.texto && (
                          <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-relaxed text-muted">
                            {pt.texto}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <>
                  {Boolean(abierta.puntos?.length) && (
                    <div className="mt-6 rounded-xl border border-line bg-bg-soft p-4">
                      <h3 className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
                        {t("gist.points")}
                      </h3>
                      <ol className="mt-2.5 space-y-2">
                        {abierta.puntos!.map((pt, i) => (
                          <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug">
                            {pt.marca ? (
                              minuto(pt.marca)
                            ) : (
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-faint" />
                            )}
                            <span className="text-muted">{pt.texto}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="mt-6">
                    <Markdown text={abierta.resumen} />
                  </div>
                </>
              )}

              <Fuentes fuentes={abierta.fuentes ?? undefined} />

              <p className="mt-6 border-t border-line pt-3 text-[11.5px] text-faint">
                {new Date(abierta.creada_el).toLocaleDateString(lang, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {abierta.modelo ? ` · ${abierta.modelo}` : ""}
              </p>

              {/* Preguntar donde está el resumen, sin tener que irse al
                  chat a explicarle otra vez de qué vídeo hablas. */}
              {perfil.demo ? (
                <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 p-3.5 text-[13px] leading-relaxed text-gold">
                  {t("gist.demoCard")}
                </p>
              ) : (
                <GistChat ficha={abierta} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
