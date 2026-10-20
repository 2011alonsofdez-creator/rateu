"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* El texto, en los dos idiomas y aquí dentro, como /precios y /multas.

   Lo que NO lleva, y es deliberado: ningún plazo en días. Los tres tipos
   de carta sí van, porque saber cuál te ha llegado es la pregunta que
   trae a alguien a esta página y se reconoce leyendo el papel. Pero
   cuántos días tienes sale de TU carta, y lo confirma la Agencia
   Tributaria: una página que promete un plazo y se equivoca deja a
   alguien fuera de tiempo. Tampoco lleva la cifra de créditos, por lo
   mismo que /multas: un número a mano envejece sin que nadie se entere. */
const T = {
  es: {
    migas: "Cartas de Hacienda",
    h1: "Te ha llegado una carta de Hacienda. Kairo te dice cuál de las tres es.",
    lead:
      "Porque no todas son lo mismo, y es lo primero que hay que saber: una te pide un papel, otra te reclama un importe y la tercera solo te avisa de un error. Súbela y te lo dice, con lo que te piden y para cuándo según tu propia carta.",
    ctaPrincipal: "Subir mi carta",
    ctaSecundario: "Ver qué cuesta",
    tiposTitulo: "Las tres cartas, y qué cambia en cada una",
    tipos: [
      {
        t: "Requerimiento de información",
        d: "La más habitual. No hay un importe: te piden que justifiques algo que declaraste —una deducción, un ingreso, dónde vivías—. Lo que toca es reunir papeles y contestar, no pagar.",
      },
      {
        t: "Propuesta de liquidación",
        d: "Aquí ya hay números: Hacienda ha hecho la cuenta y dice que deberías pagar más. Abre un plazo para que respondas si no estás de acuerdo. Es la que no conviene dejar pasar.",
      },
      {
        t: "Aviso o carta informativa",
        d: "La más leve: señala algo que no cuadra, a menudo una casilla. Muchas veces se arregla corrigiendo el dato, y algunas no piden respuesta.",
      },
    ],
    sacaTitulo: "Qué saca Kairo de tu carta",
    saca: [
      {
        t: "De cuál de las tres se trata",
        d: "Y por tanto si tienes que buscar papeles, revisar una cuenta o solo corregir un dato.",
      },
      {
        t: "Qué te piden exactamente",
        d: "Traducido. En la carta suele venir como un artículo, un modelo y un número de expediente.",
      },
      {
        t: "Cuánto, si hay un importe",
        d: "Y si lo hay, de dónde sale según la propia carta.",
      },
      {
        t: "Para cuándo",
        d: "La fecha tal y como figura en tu carta. Es lo que de verdad importa y lo que peor se ve.",
      },
      {
        t: "Qué pasa si no contestas",
        d: "Solo lo que anuncie el documento. Si no lo dice, Kairo no se lo inventa.",
      },
      {
        t: "Y el borrador, si hay que responder",
        d: "Con los huecos marcados para que los rellenes tú. Enviarlo lo haces tú.",
      },
    ],
    fechaTitulo: "Lo que más gente pilla tarde",
    fechaCuerpo: [
      "El plazo no empieza cuando abres el sobre: empieza cuando la notificación se te considera entregada. Y si no llegaste a recibirla, puede haber empezado sin que te enteraras.",
      "Por eso Kairo lee la fecha de tu carta y no te recita un plazo de memoria: te señala dónde está en el papel, te cuenta los días que quedan desde hoy y te dice que lo confirmes en la Agencia Tributaria, que es quien lo sabe. Si tu carta no trae la fecha legible, te lo dice en vez de rellenar el hueco.",
      "También conviene saber esto: el buzón electrónico de la Agencia Tributaria tiene la misma validez que el papel. Una notificación que solo está ahí cuenta igual.",
    ],
    noTitulo: "Lo que no hace",
    no: [
      "No es tu asesor y no da consejo fiscal. Te explica tu carta y te dice cuándo conviene que la vea un profesional.",
      "No contesta a Hacienda por ti ni entra en la sede electrónica. Te prepara el escrito; lo mandas tú.",
      "No paga nada ni toca tu banco.",
      "No se inventa lo que no se lee. Si la foto sale cortada o el PDF viene a medias, lo dice.",
    ],
    costeTitulo: "Lo que cuesta",
    costeCuerpo:
      "Leer un papel con Paperwork cuesta lo mismo que mandarle un mensaje normal a Kairo: no tiene tarifa aparte. El plan gratuito trae créditos cada día, así que para una carta suelta no hace falta pagar nada. Lo que cuesta cada cosa está en la página de precios.",
    cierreTitulo: "Y si la fecha todavía no te aprieta",
    cierreCuerpo:
      "Kairo puede programarte un aviso para unos días antes de que acabe el plazo. Eso es un Co-Work: se ejecuta solo, sin que tengas que acordarte tú.",
    cierreCta: "Empezar con mi carta",
  },
  en: {
    migas: "Tax letters",
    h1: "A letter from the tax office. Kairo tells you which of the three it is.",
    lead:
      "Because they are not the same thing, and that is the first thing to know: one asks you for a document, another claims an amount, and the third just flags an error. Upload it and it tells you which, what they want, and by when according to your own letter.",
    ctaPrincipal: "Upload my letter",
    ctaSecundario: "See what it costs",
    tiposTitulo: "The three letters, and what changes in each",
    tipos: [
      {
        t: "Request for information",
        d: "The most common. There is no amount: they ask you to back up something you declared — a deduction, income, where you lived. The job is gathering documents and replying, not paying.",
      },
      {
        t: "Proposed assessment",
        d: "Here there are numbers: they have done the maths and say you should pay more. It opens a window for you to respond if you disagree. This is the one you do not let slide.",
      },
      {
        t: "Notice or informational letter",
        d: "The mildest: it flags something that does not add up, often a single box. Often it is fixed by correcting the figure, and some do not ask for a reply at all.",
      },
    ],
    sacaTitulo: "What Kairo pulls out of your letter",
    saca: [
      {
        t: "Which of the three it is",
        d: "And therefore whether you need to dig out documents, check a figure, or just correct one.",
      },
      {
        t: "What exactly they want",
        d: "Translated. On the letter it usually appears as an article, a form number and a case reference.",
      },
      {
        t: "How much, if there is an amount",
        d: "And where it comes from according to the letter itself.",
      },
      {
        t: "By when",
        d: "The date exactly as printed on your letter. It is what actually matters and the hardest to spot.",
      },
      {
        t: "What happens if you do not reply",
        d: "Only what the document announces. If it does not say, Kairo does not invent it.",
      },
      {
        t: "And the draft, if a reply is needed",
        d: "With the gaps marked for you to fill. You send it yourself.",
      },
    ],
    fechaTitulo: "What most people catch too late",
    fechaCuerpo: [
      "The clock does not start when you open the envelope: it starts when the notice counts as delivered. And if it never reached you, it may have started without you knowing.",
      "That is why Kairo reads the date off your letter instead of reciting a deadline from memory: it points to where it is on the page, counts the days left from today, and tells you to confirm it with the tax office, who are the ones who know. If your letter does not carry the date legibly, it says so instead of filling the gap.",
      "One more thing worth knowing: the tax office's electronic mailbox has the same legal weight as paper. A notice that only lives there counts just the same.",
    ],
    noTitulo: "What it does not do",
    no: [
      "It is not your accountant and gives no tax advice. It explains your letter and tells you when a professional should see it.",
      "It does not reply to the tax office for you and does not log into any portal. It drafts the text; you send it.",
      "It does not pay anything and never touches your bank.",
      "It does not make up what it cannot read. If the photo is cut off or the PDF comes half-way, it says so.",
    ],
    costeTitulo: "What it costs",
    costeCuerpo:
      "Reading a document with Paperwork costs the same as sending Kairo a normal message: there is no separate rate. The free plan comes with credits every day, so a one-off letter costs you nothing. What each thing costs is on the pricing page.",
    cierreTitulo: "And if the date is not on top of you yet",
    cierreCuerpo:
      "Kairo can schedule a reminder for a few days before the window closes. That is a Co-Work: it runs on its own, without you having to remember.",
    cierreCta: "Start with my letter",
  },
} as const;

export function CartasContenido() {
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
              href="/paperwork"
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

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.tiposTitulo}</h2>
          <ol className="mt-6 space-y-4">
            {c.tipos.map((item, i) => (
              <li key={item.t} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">
                  <span className="text-faint">{i + 1}. </span>
                  {item.t}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.d}</p>
              </li>
            ))}
          </ol>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.sacaTitulo}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {c.saca.map((item) => (
              <div key={item.t} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">{item.t}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.d}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.fechaTitulo}</h2>
          <div className="mt-5 space-y-4">
            {c.fechaCuerpo.map((p) => (
              <p key={p} className="text-[15px] leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </div>

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

          <div className="mt-16 rounded-2xl border border-line bg-panel p-6">
            <p className="text-[17px] font-semibold">{c.cierreTitulo}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.cierreCuerpo}</p>
            <Link
              href="/paperwork"
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
