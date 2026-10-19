"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* El texto, en los dos idiomas, como lo hace /precios con su FAQ: aquí
   dentro y no en lib/i18n.tsx, porque es de esta página y de ninguna
   otra. Si mañana hay seis páginas de intención, cada una trae el suyo.

   Lo que NO lleva: el precio en créditos. El código cobra lo mismo que
   un mensaje normal (`CREDITOS.normal` en lib/ia/config.ts), pero una
   cifra escrita a mano en una página estática envejece el día que el
   dueño la cambie y nadie se entera. Así que se dice la relación —lo
   mismo que un mensaje normal, sin tarifa aparte— y se manda a
   /precios, que es donde vive el dato. */
const T = {
  es: {
    migas: "Multas",
    h1: "Te ha llegado una multa. Kairo te dice qué dice.",
    lead:
      "Le haces una foto o subes el PDF y te lo cuenta en castellano normal: qué te reclaman, cuánto, para cuándo y qué pasa si no haces nada. Sin tener que descifrar el reverso del papel.",
    ctaPrincipal: "Subir mi multa",
    ctaSecundario: "Ver qué cuesta",
    sacaTitulo: "Qué saca Kairo de tu multa",
    saca: [
      {
        t: "Quién te la manda",
        d: "DGT, el ayuntamiento de tu ciudad, una empresa de aparcamiento: no es lo mismo y cambia a dónde hay que ir.",
      },
      {
        t: "Qué dicen que hiciste",
        d: "La infracción, traducida. En el papel suele venir como un artículo y un código.",
      },
      {
        t: "Cuánto, y cuánto con descuento",
        d: "El importe y, si tu documento lo trae, el reducido por pronto pago, que casi siempre implica renunciar a recurrir.",
      },
      {
        t: "Para cuándo",
        d: "La fecha límite tal y como figura en tu notificación, no una de memoria. Es lo más importante del papel y lo que peor se ve.",
      },
      {
        t: "Qué pasa si no haces nada",
        d: "Lo que el propio documento anuncia: recargo, apremio, vía ejecutiva. Suele estar en letra pequeña al final.",
      },
      {
        t: "Qué puedes hacer ahora",
        d: "Los pasos concretos, en orden, y qué datos te van a pedir en cada uno.",
      },
    ],
    fechaTitulo: "De dónde sale la fecha, y por qué importa",
    fechaCuerpo: [
      "Kairo lee el plazo de tu documento. No te lo recita de memoria, y eso es a propósito.",
      "Las guías que hay por internet ni siquiera coinciden entre ellas: unas dicen que para recurrir una multa de tráfico hay 20 días naturales y otras que son 20 hábiles. La diferencia son días de verdad y puede dejarte fuera de plazo.",
      "Así que el único plazo que vale es el que viene escrito en tu notificación, y quien lo confirma es el organismo que la ha mandado. Kairo te señala dónde está en el papel, te calcula los días que quedan desde hoy y te dice que lo compruebes ahí. Si tu documento no lo trae legible, te lo dice en vez de rellenar el hueco.",
    ],
    noTitulo: "Lo que no hace",
    no: [
      "No es un abogado y no da consejo legal personalizado. Te explica tu papel y te dice cuándo merece la pena que lo vea alguien.",
      "No presenta el recurso por ti ni entra en ninguna sede electrónica. Te prepara el texto; enviarlo lo haces tú.",
      "No paga nada ni toca tu banco.",
      "No se inventa lo que no se lee. Si la foto sale borrosa o el papel viene cortado, lo dice.",
    ],
    costeTitulo: "Lo que cuesta",
    costeCuerpo:
      "Leer un papel con Paperwork cuesta lo mismo que mandarle un mensaje normal a Kairo: no tiene tarifa aparte. El plan gratuito trae créditos cada día, así que para una multa suelta no hace falta pagar nada. Lo que cuesta cada cosa está en la página de precios.",
    cierreTitulo: "Y lo que casi nadie hace a tiempo",
    cierreCuerpo:
      "Si el plazo todavía no se te echa encima, Kairo puede programarte un aviso para unos días antes. Eso es un Co-Work: se ejecuta solo, sin que tengas que acordarte tú.",
    cierreCta: "Empezar con mi multa",
  },
  en: {
    migas: "Fines",
    h1: "You got a fine. Kairo tells you what it says.",
    lead:
      "Take a photo or upload the PDF and it explains it in plain words: what they want, how much, by when, and what happens if you do nothing. No need to decipher the back of the page.",
    ctaPrincipal: "Upload my fine",
    ctaSecundario: "See what it costs",
    sacaTitulo: "What Kairo pulls out of your fine",
    saca: [
      {
        t: "Who sent it",
        d: "The national traffic authority, your city council, a private car park: they are not the same and it changes where you have to go.",
      },
      {
        t: "What they say you did",
        d: "The offence, translated. On paper it usually shows up as an article number and a code.",
      },
      {
        t: "How much, and how much with the discount",
        d: "The amount and, if your document carries it, the early-payment reduction, which almost always means giving up your right to appeal.",
      },
      {
        t: "By when",
        d: "The deadline exactly as printed on your notice, not one from memory. It is the most important thing on the page and the hardest to spot.",
      },
      {
        t: "What happens if you do nothing",
        d: "Whatever the document itself announces: surcharges, enforcement, collection. Usually in small print at the end.",
      },
      {
        t: "What you can do now",
        d: "The concrete steps, in order, and what they will ask you for at each one.",
      },
    ],
    fechaTitulo: "Where the date comes from, and why it matters",
    fechaCuerpo: [
      "Kairo reads the deadline off your document. It does not recite it from memory, and that is deliberate.",
      "The guides online do not even agree with each other: some say you have 20 calendar days to appeal a traffic fine, others say 20 working days. That difference is real days and it can leave you out of time.",
      "So the only deadline that counts is the one written on your notice, and the body that sent it is who confirms it. Kairo points to where it is on the page, counts the days left from today, and tells you to check it there. If your document does not carry it legibly, it says so instead of filling the gap.",
    ],
    noTitulo: "What it does not do",
    no: [
      "It is not a lawyer and gives no personalised legal advice. It explains your document and tells you when it is worth having someone look at it.",
      "It does not file the appeal for you and does not log into any government portal. It drafts the text; you send it.",
      "It does not pay anything and never touches your bank.",
      "It does not make up what it cannot read. If the photo is blurry or the page is cut off, it says so.",
    ],
    costeTitulo: "What it costs",
    costeCuerpo:
      "Reading a document with Paperwork costs the same as sending Kairo a normal message: there is no separate rate. The free plan comes with credits every day, so a one-off fine costs you nothing. What each thing costs is on the pricing page.",
    cierreTitulo: "And the bit almost nobody does in time",
    cierreCuerpo:
      "If the deadline is still ahead of you, Kairo can schedule a reminder for a few days before. That is a Co-Work: it runs on its own, without you having to remember.",
    cierreCta: "Start with my fine",
  },
} as const;

export function MultasContenido() {
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
