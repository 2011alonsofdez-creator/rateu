"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { prepararArchivo, tamano } from "@/lib/archivos";
import { ADJUNTOS, esImagen, type Adjunto } from "@/lib/tipos";
import { Marca } from "@/components/Logo";
import { Check, Clip, Close, Copy, Papel as IconoPapel, Trash } from "@/components/Icons";
import { diasHasta } from "@/lib/fichas";

/* Paperwork: qué es este papel y para cuándo.
 *
 * La pantalla está montada alrededor de la fecha, no del texto. Lo que
 * vence esta semana sale arriba y en rojo; lo que no corre, abajo y en
 * gris. Todo lo demás —el importe, los pasos, el borrador— cuelga de
 * ahí, porque es el orden en que lo mira alguien con una carta en la
 * mano.
 */

type Papel = {
  id: string;
  titulo: string;
  remitente: string;
  de_que_va: string;
  que_quieren: string;
  importe: string;
  fecha_limite: string | null;
  consecuencias: string;
  pasos: string[] | null;
  borrador: string;
  archivo: string;
  estado: "pendiente" | "hecho";
  creada_el: string;
};

export default function PaperworkPage() {
  const { t, lang } = useUi();
  const perfil = usePerfil();
  const router = useRouter();

  const [papeles, setPapeles] = useState<Papel[]>([]);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [nota, setNota] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string>();
  const [falta, setFalta] = useState(false);
  const [abierto, setAbierto] = useState<Papel | null>(null);
  const [copiado, setCopiado] = useState(false);
  const selector = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/paperwork")
      .then((r) => r.json())
      .then((j) => {
        setPapeles(Array.isArray(j?.papeles) ? j.papeles : []);
        setFalta(Boolean(j?.falta));
      })
      .catch(() => {})
      .finally(() => {});
  }, []);

  const anadir = async (lista: FileList | null) => {
    const archivos = [...(lista ?? [])].slice(0, ADJUNTOS.max - adjuntos.length);
    if (!archivos.length) return;

    setError(undefined);
    const nuevos: Adjunto[] = [];
    for (const archivo of archivos) {
      const r = await prepararArchivo(archivo);
      // Un .txt no es el papel que te ha llegado a casa.
      if (r.ok && (esImagen(r.adjunto.tipo) || r.adjunto.tipo === "application/pdf")) {
        nuevos.push(r.adjunto);
      } else {
        setError("paper.badFile");
      }
    }
    setAdjuntos((v) => [...v, ...nuevos]);
  };

  const mirar = async () => {
    if (!adjuntos.length || trabajando) return;
    setError(undefined);
    setTrabajando(true);

    try {
      const r = await fetch("/api/paperwork", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adjuntos, nota }),
      });
      const j = await r.json().catch(() => null);

      if (!r.ok) {
        setError(
          j?.error === "sin_archivo"
            ? "paper.badFile"
            : j?.error === "sin_clave"
              ? "gist.noKey"
              : j?.error === "sin_creditos"
                ? "gist.noCredits"
                : j?.error === "demo"
                  ? "code.demo"
                  : "paper.failed",
        );
        return;
      }

      setPapeles((v) => [j.papel as Papel, ...v]);
      setAdjuntos([]);
      setNota("");
      setAbierto(j.papel as Papel);
      if (!j.guardado) setFalta(true);
      router.refresh();
    } catch {
      setError("err.red");
    } finally {
      setTrabajando(false);
    }
  };

  const marcar = async (p: Papel) => {
    const estado = p.estado === "hecho" ? "pendiente" : "hecho";
    setPapeles((v) => v.map((x) => (x.id === p.id ? { ...x, estado } : x)));
    setAbierto((a) => (a && a.id === p.id ? { ...a, estado } : a));
    if (p.id) {
      await fetch("/api/paperwork", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: p.id, estado }),
      }).catch(() => {});
    }
  };

  const borrar = async (p: Papel) => {
    setPapeles((v) => v.filter((x) => x.id !== p.id));
    setAbierto(null);
    if (p.id) await fetch(`/api/paperwork?id=${p.id}`, { method: "DELETE" }).catch(() => {});
  };

  const copiarBorrador = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      /* portapapeles no disponible */
    }
  };

  const pendientes = papeles.filter((p) => p.estado !== "hecho");
  const hechos = papeles.filter((p) => p.estado === "hecho");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <IconoPapel className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">{t("app.paperwork")}</h1>
      </div>
      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{t("paper.lead")}</p>

      {/* Subir el papel */}
      <div className="mt-6 rounded-2xl border border-line bg-panel p-4">
        <input
          ref={selector}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            anadir(e.target.files);
            e.target.value = "";
          }}
        />

        {adjuntos.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {adjuntos.map((a, i) => (
              <span
                key={`${a.nombre}-${i}`}
                className="inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-line bg-bg-soft py-1 pl-1 pr-1.5"
              >
                {esImagen(a.tipo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${a.tipo};base64,${a.datos}`}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-[10px] font-semibold text-faint">
                    PDF
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] leading-tight">{a.nombre}</span>
                  <span className="block text-[11px] leading-tight text-faint">
                    {tamano(a.bytes, lang)}
                  </span>
                </span>
                <button
                  onClick={() => setAdjuntos((v) => v.filter((_, n) => n !== i))}
                  aria-label={`${t("file.remove")}: ${a.nombre}`}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-panel-hi hover:text-fg"
                >
                  <Close className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <button
            onClick={() => selector.current?.click()}
            disabled={adjuntos.length >= ADJUNTOS.max}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-hi px-4 py-2.5 text-[14px] font-medium transition hover:bg-panel-hi disabled:opacity-40"
          >
            <Clip className="h-4 w-4" />
            {t("paper.pick")}
          </button>

          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={t("paper.notePlaceholder")}
            aria-label={t("paper.notePlaceholder")}
            className="min-w-0 flex-1 rounded-xl border border-line bg-bg-soft px-3.5 py-2.5 text-[14px] outline-none transition focus:border-line-hi"
          />

          <button
            onClick={mirar}
            disabled={!adjuntos.length || trabajando}
            className="brand-grad shrink-0 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {trabajando ? t("paper.working") : t("paper.go")}
          </button>
        </div>

        <p className="mt-2.5 text-[11.5px] text-faint">{t("paper.privacy")}</p>
      </div>

      {trabajando && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-panel px-4 py-3">
          <Marca className="h-5 w-5 shrink-0" animada />
          <p className="text-[13.5px] text-muted">{t("paper.workingLong")}</p>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] text-gold">
          {t(error as "paper.failed")}
        </p>
      )}

      {falta && !perfil.demo && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] text-gold">
          {t("gist.needsMigration")}
        </p>
      )}

      {/* La bandeja */}
      {papeles.length === 0 && !trabajando && (
        <p className="mt-10 text-center text-[14px] text-faint">{t("paper.empty")}</p>
      )}

      <div className="mt-6 space-y-2.5">
        {pendientes.map((p) => (
          <Fila key={p.id || p.creada_el} p={p} onAbrir={() => setAbierto(p)} onMarcar={() => marcar(p)} />
        ))}
      </div>

      {hechos.length > 0 && (
        <>
          <h2 className="mt-8 text-[11.5px] font-medium uppercase tracking-wide text-faint">
            {t("paper.done")}
          </h2>
          <div className="mt-3 space-y-2.5 opacity-60">
            {hechos.map((p) => (
              <Fila key={p.id || p.creada_el} p={p} onAbrir={() => setAbierto(p)} onMarcar={() => marcar(p)} />
            ))}
          </div>
        </>
      )}

      {/* El papel abierto */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/60 p-0 sm:p-6">
          <button
            className="absolute inset-0 -z-10"
            onClick={() => setAbierto(null)}
            aria-label={t("menu.close")}
          />
          <div className="relative h-fit w-full max-w-2xl border-line bg-bg sm:my-auto sm:rounded-2xl sm:border">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:rounded-t-2xl">
              <span className="truncate text-[13px] text-faint">{abierto.remitente || t("app.paperwork")}</span>
              <button
                onClick={() => setAbierto(null)}
                aria-label={t("menu.close")}
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-faint transition hover:bg-panel-hi hover:text-fg"
              >
                <Close className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <Plazo fecha={abierto.fecha_limite} grande />
              <h2 className="mt-3 text-balance text-[21px] font-semibold leading-tight tracking-tight">
                {abierto.titulo}
              </h2>
              {abierto.de_que_va && (
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{abierto.de_que_va}</p>
              )}

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <Dato titulo={t("paper.want")} valor={abierto.que_quieren} />
                <Dato titulo={t("paper.amount")} valor={abierto.importe} />
                <Dato titulo={t("paper.orElse")} valor={abierto.consecuencias} ancho />
              </dl>

              {Boolean(abierto.pasos?.length) && (
                <div className="mt-5 rounded-xl border border-line bg-bg-soft p-4">
                  <h3 className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
                    {t("paper.steps")}
                  </h3>
                  <ol className="mt-2.5 space-y-2">
                    {abierto.pasos!.map((paso, i) => (
                      <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-panel text-[11px] tabular-nums text-faint">
                          {i + 1}
                        </span>
                        <span className="text-muted">{paso}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {abierto.borrador && (
                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
                      {t("paper.draft")}
                    </h3>
                    <button
                      onClick={() => copiarBorrador(abierto.borrador)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted transition hover:border-line-hi hover:text-fg"
                    >
                      {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiado ? t("app.copied") : t("app.copy")}
                    </button>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-line bg-bg-soft p-4 font-sans text-[13.5px] leading-relaxed text-muted">
                    {abierto.borrador}
                  </pre>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                <button
                  onClick={() => marcar(abierto)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition ${
                    abierto.estado === "hecho"
                      ? "border-green/50 bg-green/10 text-green"
                      : "border-line text-muted hover:border-line-hi hover:text-fg"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {abierto.estado === "hecho" ? t("paper.isDone") : t("paper.markDone")}
                </button>
                <button
                  onClick={() => borrar(abierto)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] text-faint transition hover:border-line-hi hover:text-fg"
                >
                  <Trash className="h-3.5 w-3.5" />
                  {t("gist.delete")}
                </button>
              </div>

              <p className="mt-4 text-[11.5px] leading-relaxed text-faint">{t("paper.notLegal")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------
   Piezas
   -------------------------------------------------------------- */

function Plazo({ fecha, grande = false }: { fecha: string | null; grande?: boolean }) {
  const { t, lang } = useUi();
  const dias = diasHasta(fecha);

  if (dias === null) {
    return (
      <span className={`text-faint ${grande ? "text-[13px]" : "text-[12px]"}`}>
        {t("paper.noDate")}
      </span>
    );
  }

  /* El color dice lo urgente que es antes de leer una palabra: pasado,
     esta semana, o todavía hay tiempo. */
  const color =
    dias < 0 ? "text-acento" : dias <= 7 ? "text-gold" : "text-green";

  const texto =
    dias < 0
      ? t("paper.late").replace("{n}", String(Math.abs(dias)))
      : dias === 0
        ? t("paper.today")
        : t("paper.inDays").replace("{n}", String(dias));

  const cuando = new Date(`${fecha}T00:00:00`).toLocaleDateString(lang, {
    day: "numeric",
    month: "short",
  });

  return (
    <span className={`font-medium ${color} ${grande ? "text-[13.5px]" : "text-[12px]"}`}>
      {texto} · {cuando}
    </span>
  );
}

function Dato({ titulo, valor, ancho = false }: { titulo: string; valor: string; ancho?: boolean }) {
  if (!valor) return null;
  return (
    <div className={ancho ? "sm:col-span-2" : ""}>
      <dt className="text-[11.5px] font-medium uppercase tracking-wide text-faint">{titulo}</dt>
      <dd className="mt-1 text-[14px] leading-relaxed">{valor}</dd>
    </div>
  );
}

function Fila({
  p,
  onAbrir,
  onMarcar,
}: {
  p: Papel;
  onAbrir: () => void;
  onMarcar: () => void;
}) {
  const { t } = useUi();
  const dias = diasHasta(p.fecha_limite);
  const urgente = p.estado !== "hecho" && dias !== null && dias <= 7;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-panel p-3.5 transition hover:border-line-hi ${
        urgente ? "border-gold/40" : "border-line"
      }`}
    >
      <button
        onClick={onMarcar}
        aria-label={p.estado === "hecho" ? t("paper.isDone") : t("paper.markDone")}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
          p.estado === "hecho"
            ? "border-green bg-green text-bg"
            : "border-line-hi text-transparent hover:border-green"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </button>

      <button onClick={onAbrir} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-[14.5px] font-medium">{p.titulo}</span>
          {p.importe && <span className="text-[12.5px] text-muted">· {p.importe}</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
          <Plazo fecha={p.fecha_limite} />
          {p.remitente && <span className="truncate text-[12px] text-faint">· {p.remitente}</span>}
        </div>
      </button>
    </div>
  );
}
