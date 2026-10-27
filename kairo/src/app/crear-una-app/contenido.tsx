"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* El texto, en los dos idiomas y aquí dentro, como las tres páginas de
   intención anteriores.

   Todo lo que afirma sale de leer el código de Kairo Código, no de su
   titular: un solo archivo y sin librerías —por eso funciona sin
   internet— está en la función `encargo` de `(app)/code/page.tsx`; que
   se ejecuta en el navegador de quien lo pide y no en un servidor, en
   `lib/ejecutar.ts`; los diez segundos de corte, en `LIMITE_MS`; el
   botón de descarga, en `code/page.tsx:293`; la vista previa aislada,
   en el `iframe` con `sandbox` de la línea 330; los tres lenguajes, en
   `lib/resaltar.ts:17`; y los 4 créditos, de que genera con nivel
   `normal`.

   Los tres ejemplos son los de su propia pantalla (`code.ex1`, `ex2` y
   `ex3` de `i18n.tsx`), a propósito: si la página promete algo que la
   herramienta no se ofrece a hacer, el primer visitante lo nota. */
const T = {
  es: {
    migas: "Crear una herramienta",
    h1: "Pídele una herramienta y la ves funcionando. Sale un archivo que es tuyo.",
    lead:
      "Un contador de gastos, una calculadora de notas, un cronómetro de estudio. Le dices qué necesitas, lo escribe delante de ti, lo ejecuta ahí mismo y te lo descargas. Se abre con doble clic, sin instalar nada y sin internet.",
    ctaPrincipal: "Pedirle una",
    ctaSecundario: "Ver qué cuesta",
    queEsTitulo: "Qué sale, exactamente",
    queEs: [
      {
        t: "Un archivo. Uno.",
        d: "No un proyecto con carpetas: un archivo que te llevas. Por eso no lleva librerías de fuera, y por eso sigue funcionando cuando no hay cobertura.",
      },
      {
        t: "Se ejecuta aquí, no en un servidor",
        d: "Lo ves funcionando en tu propio navegador antes de descargarlo. Si se queda colgado, se corta a los diez segundos y no hay que cerrar la pestaña.",
      },
      {
        t: "Y si se rompe, no copias nada",
        d: "El error vuelve solo y le puedes pedir que lo arregle. Eso es lo que lo separa de pedirle el código a un chat y apañártelas tú.",
      },
    ],
    ejemplosTitulo: "Tres que la gente pide de verdad",
    ejemplos: [
      "Una calculadora de notas: añado asignaturas con su nota y sus créditos y me da la media ponderada.",
      "Un contador de gastos del mes: apunto lo que gasto, lo agrupo por tipo y veo el total.",
      "Un cronómetro de estudio de 25 minutos con descansos de 5 y una cuenta de cuántos llevo.",
    ],
    ejemplosPie:
      "Son los tres ejemplos que la propia pantalla te ofrece si no se te ocurre nada. Hace JavaScript, Python y HTML.",
    noTitulo: "Lo que no es, y conviene saberlo antes",
    no: [
      "No es una app con usuarios y base de datos. No guarda nada en ningún servidor, no tiene cuentas y no se publica en internet. Si lo que necesitas es eso, esto no es eso.",
      "No instala nada en tu ordenador ni toca tus archivos. Es una página web: no puede, y mejor así.",
      "No es un entorno de programación. No hay terminal, no hay proyecto y no hay repositorio.",
      "No sustituye a un programador para algo que tenga que aguantar a gente dentro. Para la herramienta que necesitas hoy y que no existe, llega de sobra.",
    ],
    costeTitulo: "Lo que cuesta",
    costeCuerpo:
      "Cuatro créditos la herramienta. Y cada arreglo cuesta otros cuatro, porque se escribe otra vez: si le pides tres cambios seguidos, son tres. El plan gratuito trae créditos cada día, así que para probar no hace falta pagar nada. Lo que cuesta cada cosa está en la página de precios.",
    movilTitulo: "Y una cosa que casi nadie espera",
    movilCuerpo:
      "Funciona en el móvil. Le pides la herramienta desde el teléfono, la ves funcionando en el teléfono y te la descargas en el teléfono. Los generadores que viven en tu ordenador no llegan ahí.",
    cierreTitulo: "¿Qué te hace falta hoy?",
    cierreCuerpo:
      "Si has pensado alguna vez «esto lo arreglaría una hojita con dos campos», eso es exactamente lo que sabe hacer.",
    cierreCta: "Pedirle una herramienta",
  },
  en: {
    migas: "Make a tool",
    h1: "Ask it for a tool and watch it run. You get a file that is yours.",
    lead:
      "A spending tracker, a grade calculator, a study timer. You say what you need, it writes it in front of you, runs it right there, and you download it. It opens with a double click, with nothing to install and no internet.",
    ctaPrincipal: "Ask for one",
    ctaSecundario: "See what it costs",
    queEsTitulo: "What you actually get",
    queEs: [
      {
        t: "One file. One.",
        d: "Not a project with folders: a file you take with you. That is why it carries no outside libraries, and why it still works when you have no signal.",
      },
      {
        t: "It runs here, not on a server",
        d: "You watch it working in your own browser before you download it. If it hangs, it is cut off after ten seconds and you do not have to close the tab.",
      },
      {
        t: "And if it breaks, you copy nothing",
        d: "The error comes back on its own and you can ask for a fix. That is what separates this from asking a chat for code and sorting it out yourself.",
      },
    ],
    ejemplosTitulo: "Three people actually ask for",
    ejemplos: [
      "A grade calculator: I add subjects with their mark and credits and it gives me the weighted average.",
      "A monthly spending tracker: I note what I spend, group it by kind and see the total.",
      "A 25-minute study timer with 5-minute breaks and a count of how many I have done.",
    ],
    ejemplosPie:
      "These are the three examples the screen itself offers if nothing comes to mind. It does JavaScript, Python and HTML.",
    noTitulo: "What it is not, and better to know first",
    no: [
      "It is not an app with users and a database. It stores nothing on any server, it has no accounts and it is not published online. If that is what you need, this is not it.",
      "It installs nothing on your computer and does not touch your files. It is a web page: it cannot, and that is for the best.",
      "It is not a development environment. No terminal, no project, no repository.",
      "It does not replace a developer for something that has to hold real people. For the tool you need today that does not exist, it is more than enough.",
    ],
    costeTitulo: "What it costs",
    costeCuerpo:
      "Four credits for the tool. And each fix costs another four, because it is written again: ask for three changes in a row and that is three. The free plan comes with credits every day, so trying it costs you nothing. What each thing costs is on the pricing page.",
    movilTitulo: "And one thing almost nobody expects",
    movilCuerpo:
      "It works on your phone. You ask for the tool on the phone, watch it running on the phone and download it on the phone. Generators that live on your computer do not reach there.",
    cierreTitulo: "What do you need today?",
    cierreCuerpo:
      "If you have ever thought “a little sheet with two fields would fix this”, that is exactly what it knows how to make.",
    cierreCta: "Ask it for a tool",
  },
} as const;

export function CrearUnaAppContenido() {
  const { lang } = useUi();
  const c = T[lang];

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[12.5px] text-faint">
            <Link href="/" className="transition hover:text-fg">
              Kairo
            </Link>
            {" · "}
            {c.migas}
          </p>

          <h1 className="mt-4 text-[34px] font-bold leading-tight tracking-tight sm:text-[44px]">
            {c.h1}
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-muted">{c.lead}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/code"
              className="brand-grad inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold text-on-accent transition hover:opacity-90 sm:w-auto"
            >
              {c.ctaPrincipal}
            </Link>
            <Link
              href="/precios"
              className="inline-flex w-full items-center justify-center rounded-xl border border-line-hi px-6 py-3 text-[15px] font-medium transition hover:bg-panel sm:w-auto"
            >
              {c.ctaSecundario}
            </Link>
          </div>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.queEsTitulo}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {c.queEs.map((item) => (
              <div key={item.t} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">{item.t}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.d}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.ejemplosTitulo}</h2>
          <ul className="mt-6 space-y-3">
            {c.ejemplos.map((e) => (
              <li
                key={e}
                className="rounded-2xl border border-line bg-panel px-5 py-4 text-[14.5px] leading-relaxed text-muted"
              >
                «{e}»
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] leading-relaxed text-faint">{c.ejemplosPie}</p>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.noTitulo}</h2>
          <ul className="mt-5 space-y-3">
            {c.no.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                <span aria-hidden className="text-faint">
                  —
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.costeTitulo}</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">{c.costeCuerpo}</p>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.movilTitulo}</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">{c.movilCuerpo}</p>

          <div className="mt-16 rounded-2xl border border-line bg-panel p-6">
            <p className="text-[17px] font-semibold">{c.cierreTitulo}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.cierreCuerpo}</p>
            <Link
              href="/code"
              className="brand-grad mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-on-accent transition hover:opacity-90"
            >
              {c.cierreCta}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
