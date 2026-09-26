"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { useCredits } from "@/lib/credits";
import { NIVELES_POR_PLAN } from "@/lib/planes";
import { LEVELS, type Level } from "@/lib/mock";
import { ejecutar, paraVistaPrevia, type Ejecucion, type Salida } from "@/lib/ejecutar";
import { primerBloque, preguntar } from "@/lib/chatear";
import type { Lenguaje } from "@/lib/resaltar";
import { Editor } from "@/components/Editor";
import { Markdown } from "@/components/Markdown";
import { Marca } from "@/components/Logo";
import { Bolt, Check, Code, Play, Stop, Trash } from "@/components/Icons";

/* La pantalla de Código.
 *
 * Editor, botón de ejecutar y panel de salida, con Kairo al lado
 * leyendo el mismo código que tú. Todo corre en TU navegador: no hay
 * servidor de ejecución, no hay clave que conectar y tu código no sale
 * de aquí salvo que le preguntes a Kairo por él.
 */

const LENGUAJES: { id: Lenguaje; nombre: string; archivo: string }[] = [
  { id: "js", nombre: "JavaScript", archivo: "script.js" },
  { id: "python", nombre: "Python", archivo: "main.py" },
  { id: "html", nombre: "HTML", archivo: "index.html" },
];

/* Se abre con algo que funciona, no con una pantalla en blanco. Un
   editor vacío no enseña qué hace esta página; esto sí, y además da
   algo que tocar al que nunca ha programado. */
const EJEMPLOS: Record<Lenguaje, string> = {
  js: `// Pulsa Ejecutar y mira abajo.
const notas = [7.5, 9, 4.25, 8, 6.5];

const media = notas.reduce((a, b) => a + b, 0) / notas.length;
console.log("Media:", media.toFixed(2));

const aprobadas = notas.filter((n) => n >= 5);
console.log("Aprobadas:", aprobadas.length, "de", notas.length);
`,
  python: `# Pulsa Ejecutar. La primera vez tarda: se descarga Python.
notas = [7.5, 9, 4.25, 8, 6.5]

media = sum(notas) / len(notas)
print(f"Media: {media:.2f}")

aprobadas = [n for n in notas if n >= 5]
print(f"Aprobadas: {len(aprobadas)} de {len(notas)}")
`,
  html: `<h1>Hola 👋</h1>
<p>Esto se pinta de verdad, aquí al lado.</p>

<button onclick="this.textContent = 'Has pulsado'">Púlsame</button>

<style>
  body { font-family: system-ui; }
  button { padding: 8px 14px; border-radius: 8px; cursor: pointer; }
</style>
`,
};

const guardado = (l: Lenguaje) => `kairo.codigo.${l}`;

export default function CodigoPage() {
  const { t } = useUi();
  const perfil = usePerfil();
  const { credits } = useCredits();

  const [lenguaje, setLenguaje] = useState<Lenguaje>("js");
  const [codigo, setCodigo] = useState(EJEMPLOS.js);
  const [salida, setSalida] = useState<Salida[]>([]);
  const [corriendo, setCorriendo] = useState(false);
  const [vista, setVista] = useState("");
  const ejecucion = useRef<Ejecucion | null>(null);

  // En el móvil no caben las tres columnas: se convierten en pestañas.
  const [pestana, setPestana] = useState<"editor" | "salida" | "kairo">("editor");

  /* Lo que escribes se guarda en TU navegador, por lenguaje. Ni se
     manda ni se guarda en ninguna base de datos: es para que cerrar la
     pestaña sin querer no te cueste media hora de trabajo. */
  useEffect(() => {
    try {
      const previo = localStorage.getItem(guardado(lenguaje));
      setCodigo(previo ?? EJEMPLOS[lenguaje]);
    } catch {
      setCodigo(EJEMPLOS[lenguaje]);
    }
    setSalida([]);
    setVista("");
  }, [lenguaje]);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(guardado(lenguaje), codigo);
      } catch {
        /* sin memoria: se sigue pudiendo programar */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [codigo, lenguaje]);

  // Si te vas de la página a media ejecución, que no siga corriendo.
  useEffect(() => () => ejecucion.current?.parar(), []);

  const correr = () => {
    if (corriendo) {
      ejecucion.current?.parar();
      setCorriendo(false);
      setSalida((s) => [...s, { tipo: "aviso", texto: t("code.stopped") }]);
      return;
    }

    setSalida([]);
    setCorriendo(true);
    if (window.innerWidth < 1024) setPestana("salida");

    if (lenguaje === "html") {
      setVista(paraVistaPrevia(codigo));
      setCorriendo(false);
      return;
    }

    ejecucion.current = ejecutar(codigo, lenguaje, (s) => {
      if (s.tipo === "fin") return setCorriendo(false);
      setSalida((v) => [...v, s]);
    });
  };

  const limpiar = () => {
    setSalida([]);
    setVista("");
  };

  const archivo = LENGUAJES.find((l) => l.id === lenguaje)!.archivo;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Barra de arriba */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-panel text-acento">
          <Code className="h-4 w-4" />
        </span>

        <select
          value={lenguaje}
          onChange={(e) => setLenguaje(e.target.value as Lenguaje)}
          aria-label={t("code.language")}
          className="rounded-lg border border-line bg-panel px-2 py-1.5 text-[13px] outline-none transition hover:border-line-hi"
        >
          {LENGUAJES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>

        <span className="hidden font-mono text-[12.5px] text-faint sm:inline">{archivo}</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={limpiar}
            title={t("code.clear")}
            aria-label={t("code.clear")}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-line-hi hover:text-fg"
          >
            <Trash className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={correr}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition ${
              corriendo
                ? "border border-gold/50 bg-gold/10 text-gold"
                : "brand-grad text-on-accent hover:opacity-90"
            }`}
          >
            {corriendo ? <Stop className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {corriendo ? t("code.stop") : t("code.run")}
          </button>
        </div>
      </div>

      {/* Pestañas, solo en móvil */}
      <div className="flex border-b border-line lg:hidden">
        {(["editor", "salida", "kairo"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPestana(p)}
            className={`flex-1 border-b-2 px-3 py-2 text-[13px] font-medium transition ${
              pestana === p
                ? "border-acento text-fg"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t(p === "editor" ? "code.editor" : p === "salida" ? "code.output" : "code.ask")}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_360px]">
        {/* Editor + salida */}
        <div
          className={`flex min-h-0 flex-col lg:flex ${
            pestana === "kairo" ? "hidden" : "flex"
          }`}
        >
          <div className={`min-h-0 flex-1 ${pestana === "salida" ? "hidden lg:flex" : "flex"}`}>
            <Editor
              valor={codigo}
              onCambio={setCodigo}
              lenguaje={lenguaje}
              etiqueta={t("code.editor")}
            />
          </div>

          {/* Salida: consola, o la página pintada si es HTML */}
          <div
            className={`min-h-0 shrink-0 flex-col border-t border-line bg-bg-soft lg:flex lg:h-[38%] ${
              pestana === "salida" ? "flex flex-1" : "hidden lg:flex"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
                {lenguaje === "html" ? t("code.preview") : t("code.output")}
              </span>
              {corriendo && (
                <span className="text-[11.5px] text-acento">{t("code.running")}</span>
              )}
            </div>

            {lenguaje === "html" ? (
              vista ? (
                <iframe
                  title={t("code.preview")}
                  srcDoc={vista}
                  /* Aislado a propósito: puede ejecutar su JavaScript,
                     pero no tocar Kairo ni tus cookies. */
                  sandbox="allow-scripts allow-modals"
                  className="min-h-0 flex-1 bg-white"
                />
              ) : (
                <p className="px-4 py-3 text-[13px] text-faint">{t("code.previewHint")}</p>
              )
            ) : (
              <div className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
                {salida.length === 0 && !corriendo && (
                  <p className="text-faint">{t("code.outputHint")}</p>
                )}
                {salida.map((s, i) => (
                  <pre
                    key={i}
                    className={`whitespace-pre-wrap break-words ${
                      s.tipo === "error"
                        ? "text-acento"
                        : s.tipo === "aviso"
                          ? "text-gold"
                          : "text-muted"
                    }`}
                  >
                    {s.texto}
                  </pre>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kairo, al lado */}
        <PanelKairo
          codigo={codigo}
          lenguaje={lenguaje}
          onAplicar={setCodigo}
          oculto={pestana !== "kairo"}
          demo={perfil.demo}
          plan={perfil.plan}
          creditos={credits}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------
   El panel de Kairo
   -------------------------------------------------------------- */
function PanelKairo({
  codigo,
  lenguaje,
  onAplicar,
  oculto,
  demo,
  plan,
  creditos,
}: {
  codigo: string;
  lenguaje: Lenguaje;
  onAplicar: (v: string) => void;
  oculto: boolean;
  demo: boolean;
  plan: "free" | "plus" | "supreme";
  creditos: number;
}) {
  const { t } = useUi();
  const permitidos = NIVELES_POR_PLAN[plan];
  const [nivel, setNivel] = useState<Level>(permitidos[permitidos.length - 1]);
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState<string>();
  const [aplicado, setAplicado] = useState(false);
  const cortar = useRef<(() => void) | null>(null);
  const fondo = useRef<HTMLDivElement>(null);

  useEffect(() => () => cortar.current?.(), []);

  useEffect(() => {
    // Seguir el texto según va saliendo, como en el chat.
    fondo.current?.scrollTo({ top: fondo.current.scrollHeight });
  }, [respuesta]);

  const bloque = useMemo(() => primerBloque(respuesta), [respuesta]);

  const enviar = (texto: string) => {
    const limpia = texto.trim();
    if (!limpia || pensando) return;

    if (demo) {
      setError("code.demo");
      return;
    }
    if (LEVELS[nivel].credits > creditos) {
      setError("code.noCredits");
      return;
    }

    setError(undefined);
    setRespuesta("");
    setAplicado(false);
    setPensando(true);
    setPregunta("");

    /* La pregunta va DELANTE del código a propósito: el título de la
       conversación se saca de las primeras palabras, y "¿por qué falla
       esto?" es mejor título que las tres primeras líneas de un
       archivo. */
    const mensaje =
      `${limpia}\n\nEste es el código que tengo abierto (${lenguaje}):\n` +
      "```\n" +
      `${codigo.slice(0, 12000)}\n` +
      "```";

    cortar.current = preguntar(mensaje, nivel, {
      onTexto: (v) => setRespuesta((r) => r + v),
      onError: (clave) => {
        setPensando(false);
        setError(
          clave === "sin_creditos"
            ? "code.noCredits"
            : clave === "sin_sesion"
              ? "err.sesion"
              : clave === "nivel"
                ? "err.nivel"
                : clave === "red"
                  ? "err.red"
                  : "err.modelo",
        );
      },
    });

  };

  /* No hay evento de "he terminado" en esta versión corta, así que se
     apaga el indicador en cuanto llega la primera letra: a partir de
     ahí lo que se ve es la respuesta escribiéndose. */
  useEffect(() => {
    if (respuesta) setPensando(false);
  }, [respuesta]);

  const ATAJOS: { clave: TKey; texto: string }[] = [
    { clave: "code.explain", texto: t("code.explainAsk") },
    { clave: "code.bug", texto: t("code.bugAsk") },
    { clave: "code.improve", texto: t("code.improveAsk") },
  ];

  return (
    <aside
      className={`min-h-0 flex-col border-line bg-bg-soft lg:flex lg:border-l ${
        oculto ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <Marca className="h-5 w-5" animada={pensando} />
        <span className="text-[13px] font-medium">{t("code.ask")}</span>

        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value as Level)}
          aria-label={t("app.level")}
          className="ml-auto rounded-lg border border-line bg-panel px-1.5 py-1 text-[12px] outline-none"
        >
          {permitidos.map((n) => (
            <option key={n} value={n}>
              {t(`app.${n}`)}
            </option>
          ))}
        </select>
      </div>

      <div ref={fondo} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {!respuesta && !pensando && !error && (
          <div className="space-y-2">
            <p className="text-[13px] leading-relaxed text-muted">{t("code.askHint")}</p>
            {ATAJOS.map((a) => (
              <button
                key={a.clave}
                onClick={() => enviar(a.texto)}
                className="block w-full rounded-lg border border-line bg-panel px-3 py-2 text-left text-[13px] transition hover:border-line-hi hover:bg-panel-hi"
              >
                {t(a.clave)}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-[13px] text-gold">
            {t(error as TKey)}
          </p>
        )}

        {pensando && !respuesta && (
          <p className="text-[13px] text-faint">{t("code.thinking")}</p>
        )}

        {respuesta && (
          <>
            <Markdown text={respuesta} />
            {bloque && (
              <button
                onClick={() => {
                  onAplicar(bloque);
                  setAplicado(true);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-acento/50 bg-acento/10 px-2.5 py-1.5 text-[12.5px] font-medium text-acento transition hover:bg-acento/20"
              >
                {aplicado ? <Check className="h-3.5 w-3.5" /> : <Bolt className="h-3.5 w-3.5" />}
                {aplicado ? t("code.applied") : t("code.apply")}
              </button>
            )}
          </>
        )}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(pregunta);
              }
            }}
            rows={2}
            placeholder={t("code.placeholder")}
            className="min-h-0 flex-1 resize-none rounded-lg border border-line bg-panel px-3 py-2 text-[13.5px] outline-none transition focus:border-line-hi"
          />
          <button
            onClick={() => enviar(pregunta)}
            disabled={!pregunta.trim() || pensando}
            className="brand-grad grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-accent transition enabled:hover:opacity-90 disabled:opacity-35"
            title={t("app.send")}
            aria-label={t("app.send")}
          >
            <Bolt className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
