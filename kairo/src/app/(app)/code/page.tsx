"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cargarApp, guardarApp } from "@/lib/apps-code";
import { useUi, type TKey } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { documentoHtml, preguntar } from "@/lib/chatear";
import { esAvisoDelMarco, paraVistaPrevia } from "@/lib/ejecutar";
import { descargarTexto } from "@/lib/copiar";
import { Editor } from "@/components/Editor";
import { Pensando } from "@/components/Pensando";
import { CodigoEnVivo } from "@/components/CodigoEnVivo";
import { Code as IconoCode, Descarga, Play, Refresh } from "@/components/Icons";
import { CREDITOS_NIVEL } from "@/lib/planes";

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
/* POR DÓNDE VA, MIRANDO EL ARCHIVO.
 *
 * Esto antes era un reloj: una frase cada 1,9 segundos, pasara lo que
 * pasara. O sea que "Ya casi" no quería decir que casi estuviera;
 * quería decir que habían pasado ocho segundos. Y si el modelo tardaba
 * medio minuto, el cartel decía "Ya casi" durante veinte segundos.
 *
 * Un cartel que no mira lo que cuenta es un cartel que miente despacio.
 * Y aquí no hace falta: el archivo va llegando a trozos, así que se
 * puede saber de verdad por dónde va. Las marcas se buscan de la más
 * tardía a la más temprana, porque en un HTML van en ese orden y lo que
 * interesa es la última que haya aparecido.
 */
const FASES_CODE = {
  piensa: ["code.f.piensa1", "code.f.piensa2"],
  empieza: ["code.f.empieza1", "code.f.empieza2"],
  estilo: ["code.f.estilo1", "code.f.estilo2", "code.f.estilo3"],
  pantalla: ["code.f.pantalla1", "code.f.pantalla2", "code.f.pantalla3"],
  logica: ["code.f.logica1", "code.f.logica2", "code.f.logica3"],
  casi: ["code.f.casi1", "code.f.casi2", "code.f.casi3"],
} as const satisfies Record<string, readonly TKey[]>;

function faseDe(bruto: string): keyof typeof FASES_CODE {
  if (!bruto.trim()) return "piensa";
  if (/<\/html>/i.test(bruto)) return "casi";
  if (/<script[\s>]/i.test(bruto)) return "logica";
  if (/<body[\s>]/i.test(bruto)) return "pantalla";
  if (/<style[\s>]/i.test(bruto)) return "estilo";
  return "empieza";
}

function encargo(peticion: string, corta = false): string {
  /* Con `corta`, después de que se cortara por tiempo. No es un capricho
     de estilo: lo que cuesta es escribir, y una app con la mitad de
     líneas se escribe en la mitad de tiempo. */
  const brevedad = corta
    ? `
- CORTA. Lo mínimo que funcione: sin animaciones, sin iconos, sin
  comentarios, sin temas de color. Fea pero entera es mejor que bonita
  a medias.`
    : "";

  return `Hazme una app web de una sola página que haga esto:

${peticion}${brevedad}

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

/** Cuántas veces se le pide que siga si se corta por tiempo. */
const SEGUIDAS = 3;

/** Lo que se le pide para que siga un archivo cortado a medias. */
function seguir(pedida: string, llevado: string): string {
  return `Estabas escribiendo una app en un solo archivo HTML para esto:
"${pedida.slice(0, 800)}"

Te has cortado a mitad. Así acaba lo que llevas escrito:

${llevado.slice(-1500)}

Sigue EXACTAMENTE desde el último carácter, sin repetir nada de lo de
arriba. Sin explicaciones y sin abrir un bloque de código: escribe solo
lo que falta, hasta cerrar el archivo con </html>.`;
}

/** Quita las vallas de bloque de código (```html y ```). */
function sinVallas(texto: string): string {
  return texto.replace(/^[ \t]*```[a-z]*[ \t]*$/gim, "");
}

/** Si lo nuevo empieza repitiendo el final de lo anterior, lo quita. */
function sinRepetir(antes: string, nuevo: string): string {
  const max = Math.min(400, antes.length, nuevo.length);
  for (let n = max; n >= 12; n--) {
    if (antes.endsWith(nuevo.slice(0, n))) return nuevo.slice(n);
  }
  return nuevo;
}

const EJEMPLOS = [
  "code.ex1",
  "code.ex2",
  "code.ex3",
] as const;

/* useSearchParams necesita un Suspense alrededor para poder compilarse. */
export default function CodePage() {
  return (
    <Suspense>
      <PantallaCode />
    </Suspense>
  );
}

function PantallaCode() {
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
  /* Se quedó a medias por tiempo. Lo escrito vale, pero no entero: lo
     honesto es ofrecer una más corta, no reintentar lo mismo. */
  const [seCorto, setSeCorto] = useState(false);
  const cortar = useRef<(() => void) | null>(null);

  /* EL HISTORIAL. La app abierta va en la dirección (`/code?app=…`), así
     se puede volver a ella desde la barra, recargar o compartir enlace
     con uno mismo. `appId` es la que está en pantalla ahora. */
  const router = useRouter();
  const appParam = useSearchParams().get("app");
  const appId = useRef<string | null>(null);
  const guardado = useRef("");

  useEffect(() => {
    if (appParam === appId.current) return;
    cortar.current?.();
    setTrabajando("");
    setEnBruto("");
    setError(undefined);
    setFalloDeLaApp(undefined);
    setSeCorto(false);

    if (!appParam) {
      appId.current = null;
      guardado.current = "";
      setCodigo("");
      setPeticion("");
      return;
    }

    appId.current = appParam;
    let vivo = true;
    cargarApp(appParam).then((app) => {
      if (!vivo) return;
      if (!app) return router.replace("/code");
      guardado.current = app.codigo;
      setCodigo(app.codigo);
      setPeticion(app.peticion);
    });
    return () => {
      vivo = false;
    };
  }, [appParam, router]);

  /* Lo que se toca a mano en el editor también se guarda, con un
     respiro para no guardar a cada tecla. */
  useEffect(() => {
    if (!appId.current || !codigo || codigo === guardado.current || trabajando) return;
    const id = appId.current;
    const reloj = window.setTimeout(() => {
      guardado.current = codigo;
      guardarApp({ id, peticion: "", codigo });
    }, 1500);
    return () => window.clearTimeout(reloj);
  }, [codigo, trabajando]);

  /** Al acabar una app: si es nueva, se crea en el historial y la
   *  dirección pasa a ser la suya; si era un arreglo, se pisa. */
  const guardarResultado = async (limpio: string, modo: "haciendo" | "arreglando", pedida: string) => {
    guardado.current = limpio;
    const id = await guardarApp({
      id: modo === "arreglando" ? (appId.current ?? undefined) : undefined,
      peticion: pedida,
      codigo: limpio,
    });
    if (id && id !== appId.current) {
      appId.current = id;
      router.replace(`/code?app=${id}`);
    }
  };

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
    setSeCorto(false);
    setEnBruto("");
    setTrabajando(modo);

    let todo = "";
    const pedida = peticion;

    /* UNA RONDA, Y SI SE CORTA, OTRA DESDE DONDE IBA.
     *
     * Vercel da un minuto por petición. Gemini escribe una app en veinte
     * segundos, pero cuando se le acaba la cuota escriben los modelos
     * gratis, que van en cola y no llegan: la app se quedaba a medias y
     * salía "se ha pasado del tiempo". Ahora, si se corta, se le pasa el
     * final de lo que llevaba y se le pide que siga. Hasta tres veces. */
    const ronda = (prompt: string, vuelta: number) => {
      let cortadoPorTiempo = false;
      const antes = todo;
      let nuevo = "";

      cortar.current = preguntar(prompt, NIVEL, {
        onTexto: (trozo) => {
          nuevo += trozo;
          todo = vuelta === 0 ? nuevo : antes + sinRepetir(antes, sinVallas(nuevo));
          setEnBruto(todo);
        },
        onModelo: setModelo,
        onError: (clave) => {
          if (clave === "sin_tiempo" && todo.trim() && vuelta < SEGUIDAS) {
            cortadoPorTiempo = true;
            return;
          }
          /* `sin_tiempo` no es "no he podido": es "iba demasiado lento y
             me han cortado", incluso después de seguir tres veces. */
          setError(
            clave === "sin_creditos"
              ? "gist.noCredits"
              : clave === "sin_sesion"
                ? "err.sesion"
                : clave === "red"
                  ? "err.red"
                  : clave === "sin_tiempo"
                    ? "code.tooSlow"
                    : "code.failed",
          );
          if (clave === "sin_tiempo") setSeCorto(true);
        },
        onFin: (motivo) => {
          if (cortadoPorTiempo) return ronda(seguir(pedida, todo), vuelta + 1);

          setTrabajando("");
          if (motivo !== "ok") return;

          const limpio = documentoHtml(vuelta === 0 ? todo : sinVallas(todo));
          if (limpio) {
            setCodigo(limpio);
            setEnBruto("");
            guardarResultado(limpio, modo, pedida);
            return;
          }

          /* Sin bloque de código, lo que ha vuelto no es un archivo: una
             negativa, una explicación, una pregunta. Dejar la pantalla
             como estaba sería hacerle creer que no pasó nada, habiendo
             pagado. Así que se dice, y lo que contestó se queda a la
             vista en el cuadro de arriba. */
          setError("code.noFile");
        },
      }, { paraCode: true });
    };

    ronda(texto, 0);
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
            <span className="text-[12.5px] text-faint">
              {t("code.cost").replace("{n}", String(CREDITOS_NIVEL.normal))}
            </span>
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
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3">
          <p className="text-[13.5px] leading-relaxed text-gold">
            {t(error as Parameters<typeof t>[0])}
          </p>
          {seCorto && (
            <button
              onClick={() => pedir(encargo(peticion, true), "haciendo")}
              disabled={Boolean(trabajando)}
              className="mt-2.5 rounded-lg border border-gold/50 px-3 py-1.5 text-[13px] font-medium text-gold transition hover:bg-gold/10 disabled:opacity-50"
            >
              {t("code.shorter")}
            </button>
          )}
        </div>
      )}

      {/* Mientras escribe, y lo que quedó si no salió un archivo */}
      {(trabajando || (enBruto && !codigo)) && (
        <div className="mt-5 rounded-2xl border border-line bg-panel p-4">
          {trabajando ? (
            /* La marca viva y girando, con las frases de aquí.
 
               Antes esto era una línea de texto en el naranja de la
               marca —el mismo que usan los avisos—, así que mientras
               todo iba BIEN la pantalla parecía estar dándote un
               problema. Y encima no se movía: cuarenta segundos
               mirando una frase quieta se leen como colgado. */
            <Pensando
              nivel={NIVEL}
              puntos
              fases={
                trabajando === "arreglando"
                  ? ["code.fixing"]
                  : [...FASES_CODE[faseDe(enBruto)]]
              }
            />
          ) : (
            <p className="text-[13px] text-muted">{t("code.said")}</p>
          )}
          <CodigoEnVivo texto={enBruto} />
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
                appId.current = null;
                guardado.current = "";
                router.push("/code");
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
