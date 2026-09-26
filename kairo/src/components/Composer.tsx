"use client";

import { useEffect, useRef, useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import { LEVELS, type Level } from "@/lib/mock";
import { NIVELES_POR_PLAN } from "@/lib/planes";
import { usePerfil } from "@/lib/perfil-cliente";
import { escuchar, hayMicrofono } from "@/lib/voz";
import { ADJUNTOS, ADJUNTOS_ACEPTADOS, esImagen, type Adjunto, type Mente } from "@/lib/tipos";
import { prepararArchivo, pesoTotal, tamano, tipoDe, tipoAceptado } from "@/lib/archivos";
import { Bolt, Brain, Chevron, Clip, Close, Mic, Send } from "./Icons";
import Link from "next/link";

/* Lo que se enseña de cada nivel es el esfuerzo, no el precio.
   El número de créditos convertía cada mensaje en un taxímetro: la
   gente elegía por lo que costaba y no por lo que necesitaba. El saldo
   sigue a la vista encima del cuadro de escribir, que es donde importa. */
const LEVEL_META: { id: Level; label: TKey; desc: TKey; esfuerzo: TKey }[] = [
  { id: "fast", label: "app.fast", desc: "app.fastDesc", esfuerzo: "effort.low" },
  { id: "normal", label: "app.normal", desc: "app.normalDesc", esfuerzo: "effort.mid" },
  { id: "forja", label: "app.forja", desc: "app.forjaDesc", esfuerzo: "effort.high" },
  { id: "mega", label: "app.mega", desc: "app.megaDesc", esfuerzo: "effort.extra" },
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
  onSend: (text: string, adjuntos: Adjunto[]) => void;
  busy: boolean;
}) {
  const { t, lang } = useUi();
  const perfil = usePerfil();
  const permitidos = NIVELES_POR_PLAN[perfil.plan];
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [menuMente, setMenuMente] = useState(false);
  // null = todavía no se han pedido. Se piden al abrir el desplegable,
  // no al cargar el chat: abrir el chat sigue costando una consulta.
  const [mentes, setMentes] = useState<Mente[] | null>(null);
  /* Archivos adjuntos.
   *
   * Viven aquí y no en la página del chat porque son parte de lo que
   * estás escribiendo: se ponen, se quitan y se van con el mensaje. */
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [avisoArchivo, setAvisoArchivo] = useState<string>();
  const [leyendo, setLeyendo] = useState(false);
  const [encima, setEncima] = useState(false);
  const selector = useRef<HTMLInputElement>(null);

  const box = useRef<HTMLTextAreaElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const wrapMente = useRef<HTMLDivElement>(null);

  /* Dictado. Lo pone el navegador, no un servicio de pago.
   *
   * Si se preguntara "¿hay micrófono?" al pintar, el servidor diría que no
   * (allí no hay navegador) y el navegador diría que sí: dos HTML distintos
   * para la misma página, y React se queja con razón. Se pregunta después
   * de pintar, así que el botón aparece un instante más tarde y ya está. */
  const [conMicrofono, setConMicrofono] = useState(false);
  useEffect(() => setConMicrofono(hayMicrofono()), []);

  const [escuchando, setEscuchando] = useState(false);
  const [sinPermiso, setSinPermiso] = useState(false);
  const parar = useRef<(() => void) | null>(null);
  // Lo que ya habías escrito antes de abrir el micro: el dictado se le
  // añade detrás en vez de pisarlo.
  const yaEscrito = useRef("");

  const micro = () => {
    if (escuchando) return parar.current?.();

    setSinPermiso(false);
    yaEscrito.current = text.trim() ? `${text.trimEnd()} ` : "";

    const detener = escuchar(
      lang,
      (dictado) => setText(yaEscrito.current + dictado),
      (motivo) => {
        setEscuchando(false);
        parar.current = null;
        // "sin habla" y "cancelado" no son fallos: es que te has callado.
        if (motivo === "not-allowed" || motivo === "service-not-allowed") {
          setSinPermiso(true);
        }
      },
    );

    if (!detener) return;
    parar.current = detener;
    setEscuchando(true);
  };

  // Si te vas de la página, que no se quede el micro abierto.
  useEffect(() => () => parar.current?.(), []);

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

  /* Meter archivos. Da igual por dónde lleguen —el clip, arrastrarlos
     encima o pegar una captura—, acaban todos aquí. */
  const anadirArchivos = async (lista: FileList | File[] | null) => {
    const archivos = [...(lista ?? [])];
    if (!archivos.length) return;

    setAvisoArchivo(undefined);
    setLeyendo(true);

    const sitio = ADJUNTOS.max - adjuntos.length;
    const cabenAhora = archivos.slice(0, Math.max(0, sitio));
    const quejas: string[] = [];

    if (archivos.length > cabenAhora.length) {
      quejas.push(t("file.tooMany").replace("{n}", String(ADJUNTOS.max)));
    }

    const nuevos: Adjunto[] = [];
    for (const archivo of cabenAhora) {
      const r = await prepararArchivo(archivo);
      if (r.ok) {
        nuevos.push(r.adjunto);
        continue;
      }
      quejas.push(
        (r.motivo === "tipo"
          ? t("file.badType")
          : r.motivo === "grande"
            ? t("file.tooBig")
            : t("file.broken")
        ).replace("{f}", r.nombre),
      );
    }

    /* El tope de todos juntos se mira al final, cuando ya se sabe lo
       que ocupa cada uno: una foto de 4 MB puede quedarse en 300 KB
       después de encogerla, y rechazarla antes habría sido injusto. */
    const juntos = [...adjuntos, ...nuevos];
    const buenos: Adjunto[] = [];
    let peso = 0;
    for (const a of juntos) {
      if (peso + a.datos.length > ADJUNTOS.bytesTotal) {
        quejas.push(t("file.tooBig").replace("{f}", a.nombre));
        continue;
      }
      peso += a.datos.length;
      buenos.push(a);
    }

    setAdjuntos(buenos);
    if (quejas.length) setAvisoArchivo(quejas[0]);
    setLeyendo(false);
    box.current?.focus();
  };

  const quitarArchivo = (i: number) => {
    setAdjuntos((v) => v.filter((_, n) => n !== i));
    setAvisoArchivo(undefined);
  };

  const submit = () => {
    const value = text.trim();
    // Con un archivo delante, "mira esto" puede ir sin texto: la propia
    // foto es la pregunta. Sin archivo, un mensaje vacío no se manda.
    if ((!value && !adjuntos.length) || busy || leyendo) return;
    parar.current?.(); // enviar cierra el micro
    onSend(value, adjuntos);
    setText("");
    setAdjuntos([]);
    setAvisoArchivo(undefined);
  };

  const current = LEVEL_META.find((l) => l.id === level)!;

  return (
    <div className="border-t border-line bg-bg px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setEncima(true);
          }}
          onDragLeave={(e) => {
            // Solo cuando se sale del cuadro entero, no al pasar de un
            // hijo a otro: si no, el aviso parpadea al mover el ratón.
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setEncima(false);
          }}
          onDrop={(e) => {
            if (!e.dataTransfer.files.length) return;
            e.preventDefault();
            setEncima(false);
            anadirArchivos(e.dataTransfer.files);
          }}
          className={`relative rounded-2xl border bg-panel transition focus-within:border-line-hi ${
            encima ? "border-acento bg-acento/5" : "border-line"
          }`}
        >
          {encima && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl bg-panel/80 text-[13.5px] font-medium text-acento">
              {t("file.drop")}
            </div>
          )}

          {/* Lo que llevas puesto, encima de donde escribes. */}
          {Boolean(adjuntos.length) && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
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
                      {(a.nombre.split(".").pop() ?? "?").slice(0, 4).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] leading-tight">{a.nombre}</span>
                    <span className="block text-[11px] leading-tight text-faint">
                      {tamano(a.bytes, lang)}
                    </span>
                  </span>
                  <button
                    onClick={() => quitarArchivo(i)}
                    title={t("file.remove")}
                    aria-label={`${t("file.remove")}: ${a.nombre}`}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-panel-hi hover:text-fg"
                  >
                    <Close className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            ref={box}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              /* Pegar una captura de pantalla. Es como la gente manda
                 de verdad una imagen: Imprimir pantalla y Ctrl+V. */
              const pegados = [...e.clipboardData.files].filter((f) => tipoAceptado(tipoDe(f)));
              if (!pegados.length) return;
              e.preventDefault();
              anadirArchivos(pegados);
            }}
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
            <input
              ref={selector}
              type="file"
              multiple
              accept={ADJUNTOS_ACEPTADOS}
              className="hidden"
              onChange={(e) => {
                anadirArchivos(e.target.files);
                // Para que elegir dos veces el mismo archivo funcione.
                e.target.value = "";
              }}
            />
            <button
              onClick={() => selector.current?.click()}
              disabled={leyendo || adjuntos.length >= ADJUNTOS.max}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-panel-hi hover:text-fg disabled:opacity-40"
              title={t("file.attach")}
              aria-label={t("file.attach")}
            >
              <Clip className={`h-[18px] w-[18px] ${leyendo ? "animate-pulse" : ""}`} />
            </button>
            {conMicrofono && (
              <button
                onClick={micro}
                aria-pressed={escuchando}
                title={escuchando ? t("app.stopVoice") : t("app.voice")}
                aria-label={escuchando ? t("app.stopVoice") : t("app.voice")}
                className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                  escuchando
                    ? "bg-acento/15 text-acento ring-1 ring-acento/50"
                    : "text-muted hover:bg-panel-hi hover:text-fg"
                }`}
              >
                <Mic className={`h-[18px] w-[18px] ${escuchando ? "animate-pulse" : ""}`} />
              </button>
            )}

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
                <span className="text-faint">{t(current.esfuerzo)}</span>
                <Chevron className={`h-3.5 w-3.5 transition ${menu ? "rotate-180" : ""}`} />
              </button>

              {menu && (
                <div className="absolute bottom-full right-0 z-30 mb-2 w-[300px] overflow-hidden rounded-xl border border-line bg-panel shadow-[var(--shadow)]">
                  <div className="flex items-center justify-between border-b border-line px-3.5 py-2 text-[11px] uppercase tracking-wide text-faint">
                    <span>{t("app.level")}</span>
                    <span>{t("effort.title")}</span>
                  </div>

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
                        <span className="shrink-0 text-[12px] text-muted">
                          {t(l.esfuerzo)}
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

                  <p className="border-t border-line px-3.5 py-2.5 text-[11.5px] leading-relaxed text-faint">
                    {t("effort.note")}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={submit}
              disabled={(!text.trim() && !adjuntos.length) || busy || leyendo}
              className="brand-grad grid h-9 w-9 place-items-center rounded-lg text-on-accent transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
              title={t("app.send")}
              aria-label={t("app.send")}
            >
              <Send className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {avisoArchivo && (
          <p className="mt-2 text-center text-[12px] leading-relaxed text-gold">{avisoArchivo}</p>
        )}
        {leyendo && !avisoArchivo && (
          <p className="mt-2 text-center text-[12px] text-muted">{t("file.reading")}</p>
        )}
        {/* Que quede dicho dónde acaban los archivos: se leen y se
            tiran. Es justo lo que uno querría saber antes de subir una
            factura o los apuntes de clase. */}
        {Boolean(adjuntos.length) && !avisoArchivo && !leyendo && (
          <p className="mt-2 text-center text-[11.5px] text-faint">{t("file.notKept")}</p>
        )}
        {escuchando && (
          <p className="mt-2 text-center text-[12px] text-acento">{t("app.listening")}</p>
        )}
        {sinPermiso && (
          <p className="mt-2 text-center text-[12px] leading-relaxed text-gold">
            {t("app.micDenied")}
          </p>
        )}
        {perfil.demo && !escuchando && !sinPermiso && !avisoArchivo && !adjuntos.length && (
          <p className="mt-2 text-center text-[11.5px] text-faint">{t("app.demo")}</p>
        )}
      </div>
    </div>
  );
}
