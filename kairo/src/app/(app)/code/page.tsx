"use client";

import { useEffect, useRef, useState } from "react";
import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { preguntar, primerBloque } from "@/lib/chatear";
import { esAvisoDelMarco, paraVistaPrevia } from "@/lib/ejecutar";
import { descargarTexto } from "@/lib/copiar";
import { Editor } from "@/components/Editor";
import { Code as IconoCode, Descarga, Play, Refresh } from "@/components/Icons";

/* KAIRO CODE: pide una app, la ves escribirse, la ves funcionando.
 *
 * Lo que NO es, para que nadie se lleve un chasco: esto no instala nada
 * ni toca tus archivos. Una página web no puede hacer eso, y menos mal.
 * Un generador de verdad —Cline y compañía— vive en tu ordenador y
 * necesita Node, una terminal y media tarde de montaje.
 *
 * Lo que SÍ es: una app en UN archivo, que corre en el navegador de
 * quien la pide, se descarga con un botón y se abre con doble clic. Sin
 * instalar, sin cuenta, sin internet después. Eso es casi todo lo que
 * alguien quiere de verdad cuando dice "hazme una herramienta", y
 * funciona también en el móvil, que es donde un generador de escritorio
 * no llega.
 *
 * Y lo que lo separa de pedirle código al chat: se EJECUTA aquí, y
 * cuando se rompe, el error vuelve solo (el vigía de `ejecutar.ts`) y
 * se le puede pedir que lo arregle sin copiar nada a mano.
 */

/** El nivel con el que se genera. Escribir una app entera no es una
 *  pregunta de una línea: con el rápido sale, pero sale peor, y rehacer
 *  una app cuesta más créditos que hacerla bien la primera vez. */
const NIVEL = "normal" as const;

/** Lo que se le manda al modelo. Va aquí y no en el servidor porque es
 *  parte de lo que esta pantalla ES: cambia esto y cambia el producto.
 *
 *  Las reglas no son decoración. Sin "un solo archivo" devuelve tres y
 *  no hay dónde ponerlos; sin "nada de librerías" mete una de un CDN y
 *  la app deja de funcionar sin internet, que es justo lo que se
 *  prometió; y sin lo último contesta explicando lo que ha hecho, con
 *  el código en medio de la explicación. */
function encargo(peticion: string): string {
  return `Hazme una app web de una sola página que haga esto:

${peticion}

Reglas, todas obligatorias:
- UN SOLO archivo HTML, con el CSS y el JavaScript dentro.
- Nada de librerías externas ni de llamadas a internet: tiene que
  funcionar abriendo el archivo con doble clic, sin conexión.
- Nada de claves ni de cuentas.
- Todo el texto que se vea, en español.
- Que se vea bien en un móvil.
- Si hay algo que guardar, usa localStorage.

Contesta SOLO con el archivo entero dentro de un bloque de código.
Ni una palabra antes ni después.`;
}

/** Y cuando se rompe. El error va tal cual: el modelo lee mejor el
 *  mensaje del navegador que mi paráfrasis de él. */
function arreglo(codigo: string, fallo: string): string {
  return `Esta app da este error al abrirla:

${fallo}

Este es el archivo entero:

\`\`\`html
${codigo}
\`\`\`

Arréglalo. Contesta SOLO con el archivo entero corregido dentro de un
bloque de código. Ni una palabra antes ni después.`;
}

const EJEMPLOS = [
  "code.ex1",
  "code.ex2",
  "code.ex3",
] as const;

export default function CodePage() {
  const { t } = useUi();
  const perfil = usePerfil();

  const [peticion, setPeticion] = useState("");
  const [codigo, setCodigo] = useState("");
  /* Lo que va llegando, en crudo. Se enseña mientras escribe —ver cómo
     se escribe es la mitad de la gracia— y al acabar se limpia para
     quedarse solo con el archivo. */
  const [enBruto, setEnBruto] = useState("");
  const [trabajando, setTrabajando] = useState<"" | "haciendo" | "arreglando">("");
  const [error, setError] = useState<string>();
  const [falloDeLaApp, setFalloDeLaApp] = useState<string>();
  const [modelo, setModelo] = useState<string>();
  const cortar = useRef<(() => void) | null>(null);

  /* Lo que grita el marco cuando la app de dentro se rompe. Se escucha
     siempre: el marco puede petar en cualquier momento, no solo al
     arrancar (un botón que falla al tercer clic, por ejemplo). */
  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (esAvisoDelMarco(e.data)) setFalloDeLaApp(e.data.texto);
    };
    window.addEventListener("message", oir);
    return () => window.removeEventListener("message", oir);
  }, []);

  /* Y si se sale de la pantalla a media generación, se corta. Si no, se
     sigue pagando una respuesta que ya no va a ver nadie. */
  useEffect(() => () => cortar.current?.(), []);

  const pedir = (texto: string, modo: "haciendo" | "arreglando") => {
    if (trabajando) return;
    if (perfil.demo) return setError("app.sinIa");

    setError(undefined);
    setFalloDeLaApp(undefined);
    setEnBruto("");
    setTrabajando(modo);

    let todo = "";
    cortar.current = preguntar(texto, NIVEL, {
      onTexto: (trozo) => {
        todo += trozo;
        setEnBruto(todo);
      },
      onModelo: setModelo,
      onError: (clave) => {
        setError(
          clave === "sin_creditos"
            ? "gist.noCredits"
            : clave === "sin_sesion"
              ? "err.sesion"
              : clave === "red"
                ? "err.red"
                : "code.failed",
        );
      },
      onFin: (motivo) => {
        setTrabajando("");
        if (motivo !== "ok") return;

        const limpio = primerBloque(todo);
        if (limpio) {
          setCodigo(limpio);
          setEnBruto("");
          return;
        }

        /* Sin bloque de código, lo que ha vuelto no es un archivo: una
           negativa, una explicación, una pregunta. Dejar la pantalla
           como estaba sería hacerle creer que no pasó nada, habiendo
           pagado. Así que se dice, y lo que contestó se queda a la
           vista en el cuadro de arriba. */
        setError("code.noFile");
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <IconoCode className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">Kairo Code</h1>
      </div>

      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{t("code.lead")}</p>

      {/* Lo que se pide */}
      <div className="mt-6 rounded-2xl border border-line bg-panel p-4">
        <textarea
          value={peticion}
          onChange={(e) => setPeticion(e.target.value)}
          rows={3}
          placeholder={t("code.placeholder")}
          aria-label={t("code.placeholder")}
          className="w-full resize-y rounded-xl border border-line bg-bg-soft px-3.5 py-3 text-[14.5px] outline-none transition focus:border-line-hi"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => pedir(encargo(peticion), "haciendo")}
            disabled={!peticion.trim() || Boolean(trabajando)}
            className="brand-grad rounded-xl px-5 py-2.5 text-[14px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {trabajando === "haciendo" ? t("code.working") : t("code.go")}
          </button>

          {!codigo && !trabajando && (
            <span className="text-[12.5px] text-faint">{t("code.cost")}</span>
          )}
        </div>

        {!codigo && !trabajando && (
          <div className="mt-4">
            <p className="text-[12.5px] text-faint">{t("code.try")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EJEMPLOS.map((k) => (
                <button
                  key={k}
                  onClick={() => setPeticion(t(k))}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-left text-[12.5px] text-muted transition hover:border-line-hi hover:text-fg"
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-[13.5px] leading-relaxed text-gold">
          {t(error as Parameters<typeof t>[0])}
        </p>
      )}

      {/* Mientras escribe, y lo que quedó si no salió un archivo */}
      {(trabajando || (enBruto && !codigo)) && (
        <div className="mt-5 rounded-2xl border border-line bg-panel p-4">
          <p className="text-[13px] text-acento">
            {trabajando === "arreglando"
              ? t("code.fixing")
              : trabajando
                ? t("code.writing")
                : t("code.said")}
          </p>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-faint">
            {enBruto.slice(-2000)}
          </pre>
        </div>
      )}

      {/* La app, cuando ya está */}
      {codigo && !trabajando && (
        <>
          {falloDeLaApp && (
            <div className="mt-5 rounded-2xl border border-red/40 bg-red/10 p-4">
              <p className="text-[13.5px] font-medium text-red">{t("code.appBroke")}</p>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] text-muted">
                {falloDeLaApp}
              </pre>
              <button
                onClick={() => pedir(arreglo(codigo, falloDeLaApp), "arreglando")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-acento/50 bg-acento/10 px-3.5 py-2 text-[13.5px] font-medium text-acento transition hover:bg-acento/20"
              >
                <Refresh className="h-3.5 w-3.5" />
                {t("code.fix")}
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => descargarTexto("app.html", codigo)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-[13.5px] text-muted transition hover:border-line-hi hover:text-fg"
            >
              <Descarga className="h-3.5 w-3.5" />
              {t("code.download")}
            </button>
            <button
              onClick={() => {
                setCodigo("");
                setPeticion("");
                setFalloDeLaApp(undefined);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-[13.5px] text-muted transition hover:border-line-hi hover:text-fg"
            >
              <Play className="h-3.5 w-3.5" />
              {t("code.another")}
            </button>
            {modelo && <span className="text-[12px] text-faint">{modelo}</span>}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-line">
              <Editor
                valor={codigo}
                onCambio={setCodigo}
                lenguaje="html"
                etiqueta={t("code.editor")}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line bg-panel px-4 py-2 text-[12.5px] text-faint">
                {t("code.preview")}
              </div>
              <iframe
                key={codigo}
                title={t("code.preview")}
                sandbox="allow-scripts allow-modals allow-forms"
                srcDoc={paraVistaPrevia(codigo, true)}
                className="h-[520px] w-full"
              />
            </div>
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-faint">{t("code.note")}</p>
        </>
      )}
    </div>
  );
}
