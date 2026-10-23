"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/* El texto, en los dos idiomas y aquí dentro, como /multas y
   /cartas-de-hacienda.

   Lo que NO lleva, y es deliberado: ni plazos en días ni importes de
   memoria —los de un contrato salen del contrato, no de una página— ni la
   cifra de créditos, que envejece sin que nadie se entere.

   Y una cosa más que estas dos páginas no tenían que decir: Kairo NO dice
   si un contrato es bueno, malo o abusivo. Eso es una opinión jurídica y
   depende de cosas que no están en el papel. Lo que dice es qué pone, qué
   cuesta y qué pasa si te quieres ir. Si el texto de esta página prometiera
   "te avisa de las cláusulas abusivas", prometería algo que ni Kairo ni
   nadie puede sostener leyendo solo el PDF. */
const T = {
  es: {
    migas: "Entender un contrato",
    h1: "Tienes un contrato delante y no lo has firmado. Kairo te dice qué firmas.",
    lead:
      "Alquiler, trabajo, el gimnasio, la luz, un préstamo. Súbelo y te dice cuánto pagas, cuánto dura, cómo se renueva y qué pasa si te quieres ir —en tus palabras, no en las del contrato—. Mejor antes de firmar que después.",
    ctaPrincipal: "Subir mi contrato",
    ctaSecundario: "Ver qué cuesta",
    antesTitulo: "Por qué antes y no después",
    antesCuerpo: [
      "Una multa y una carta de Hacienda ya han pasado: cuando las abres, lo único que queda es reaccionar bien. Un contrato no ha pasado todavía. Está encima de la mesa, sin tu firma, y hasta que la pongas eres tú quien decide.",
      "Lo que suele fallar no es entender las palabras raras: es que lo importante no está donde se mira. El precio está en la primera página y en grande; lo que cuesta irte, la subida anual y la renovación automática están en la cuarta, en una frase, entre dos cláusulas que parecen de trámite.",
      "Kairo lee las dos páginas con la misma atención. No te dice si el contrato es bueno, malo o abusivo —eso es una opinión y no sale del papel—: te dice qué pone, qué te compromete y qué conviene mirar otra vez antes de firmar.",
    ],
    tiposTitulo: "Los tres que más se traen, y qué mirar en cada uno",
    tipos: [
      {
        t: "Alquiler",
        d: "La duración y lo que pasa al acabar. La fianza y cuándo te la devuelven. Cuánto sube la renta cada año y con qué índice. Quién paga la comunidad, el agua, las reparaciones. Y lo que casi nadie busca: qué pasa si tienes que irte antes de tiempo.",
      },
      {
        t: "Trabajo",
        d: "Si es temporal o indefinido, y si hay prueba, cuánto dura. Las horas que pone y las que no. El salario y qué parte es fija. Si hay pacto de no competencia o de permanencia, porque esos dos te atan después de irte.",
      },
      {
        t: "Servicios y suscripciones",
        d: "Gimnasio, luz, móvil, software. El compromiso mínimo. Cuánto cuesta cancelar y cómo se cancela —a veces solo vale un canal concreto—. Si se renueva solo y con cuánta antelación hay que avisar. Y si el precio de la oferta es el de siempre o el de los tres primeros meses.",
      },
    ],
    sacaTitulo: "Qué saca Kairo de tu contrato",
    saca: [
      {
        t: "Cuánto pagas, y todo lo que pagas",
        d: "La cuota y lo que se suma aparte: alta, fianza, comisiones, gastos. Según lo que ponga el documento.",
      },
      {
        t: "Cuánto dura y cómo se renueva",
        d: "Si se prorroga solo, y si hay que avisar para que no lo haga.",
      },
      {
        t: "Qué pasa si quieres irte",
        d: "Lo que cuesta, cuánto hay que avisar y si hay algo pendiente de pagar al salir.",
      },
      {
        t: "Qué te comprometes a hacer",
        d: "Tus obligaciones, traducidas. Es la parte que más se firma sin leer.",
      },
      {
        t: "Lo que sube con el tiempo",
        d: "Revisiones de precio, índices, promociones que caducan. Si el contrato lo dice.",
      },
      {
        t: "Y qué preguntar antes de firmar",
        d: "Una lista corta de lo que no queda claro en el texto, para llevarla a quien te lo da a firmar.",
      },
    ],
    noTitulo: "Lo que no hace",
    no: [
      "No es tu abogado y no da consejo jurídico. Te explica tu contrato y te dice cuándo conviene que lo vea un profesional —y con un contrato importante conviene.",
      "No dice si una cláusula es abusiva o nula. Eso depende de la ley y del caso, no del PDF. Puede señalarte que algo llama la atención y que preguntes por ello.",
      "No firma nada ni manda nada por ti.",
      "No se inventa lo que no se lee. Si falta un anexo, si la foto sale cortada o el PDF viene a medias, lo dice en vez de rellenar el hueco.",
    ],
    costeTitulo: "Lo que cuesta",
    costeCuerpo:
      "Leer un papel con Paperwork cuesta lo mismo que mandarle un mensaje normal a Kairo: no tiene tarifa aparte. El plan gratuito trae créditos cada día, así que para un contrato suelto no hace falta pagar nada. Lo que cuesta cada cosa está en la página de precios.",
    cierreTitulo: "Si ya lo firmaste",
    cierreCuerpo:
      "Sigue sirviendo, y a veces más: saber cuánto te queda, qué hay que avisar y para cuándo es justo lo que hace falta para salirse a tiempo. Súbelo igual.",
    cierreCta: "Empezar con mi contrato",
  },
  en: {
    migas: "Understanding a contract",
    h1: "There is a contract in front of you and you have not signed it. Kairo tells you what you are signing.",
    lead:
      "A lease, a job, the gym, your electricity, a loan. Upload it and it tells you how much you pay, how long it lasts, how it renews and what happens if you want out — in your words, not the contract's. Better before you sign than after.",
    ctaPrincipal: "Upload my contract",
    ctaSecundario: "See what it costs",
    antesTitulo: "Why before, not after",
    antesCuerpo: [
      "A fine and a letter from the tax office have already happened: by the time you open them, all that is left is reacting well. A contract has not happened yet. It is on the table without your signature, and until you put it there, you are the one deciding.",
      "What usually goes wrong is not the odd legal word: it is that the important part is not where you look. The price is on page one in large type; what it costs to leave, the annual increase and the automatic renewal are on page four, in one sentence, between two clauses that look like boilerplate.",
      "Kairo reads both pages with the same attention. It does not tell you whether the contract is good, bad or unfair — that is an opinion and it does not come off the page. It tells you what it says, what it commits you to, and what is worth a second look before you sign.",
    ],
    tiposTitulo: "The three people actually bring, and what to look at in each",
    tipos: [
      {
        t: "A lease",
        d: "How long it runs and what happens when it ends. The deposit and when you get it back. How much the rent rises each year and against which index. Who pays service charges, water, repairs. And the one almost nobody looks for: what happens if you have to leave early.",
      },
      {
        t: "A job",
        d: "Fixed-term or permanent, and how long any probation lasts. The hours it states and the ones it does not. The pay, and which part of it is guaranteed. Whether there is a non-compete or a stay-on clause, because those two bind you after you leave.",
      },
      {
        t: "Services and subscriptions",
        d: "Gym, energy, phone, software. The minimum commitment. What cancelling costs and how you cancel — sometimes only one channel counts. Whether it renews on its own and how much notice you must give. And whether the advertised price is the real one or just the first three months.",
      },
    ],
    sacaTitulo: "What Kairo pulls out of your contract",
    saca: [
      {
        t: "How much you pay, and everything you pay",
        d: "The instalment and what gets added on top: sign-up, deposit, fees, charges. Per what the document says.",
      },
      {
        t: "How long it lasts and how it renews",
        d: "Whether it rolls over on its own, and whether you must give notice to stop it.",
      },
      {
        t: "What happens if you want out",
        d: "What it costs, how much notice is needed, and whether anything is still owed on the way out.",
      },
      {
        t: "What you are committing to",
        d: "Your obligations, translated. It is the part most often signed unread.",
      },
      {
        t: "What goes up over time",
        d: "Price reviews, indices, promotions that expire. If the contract says so.",
      },
      {
        t: "And what to ask before signing",
        d: "A short list of what the text leaves unclear, to take back to whoever is handing it to you.",
      },
    ],
    noTitulo: "What it does not do",
    no: [
      "It is not your lawyer and gives no legal advice. It explains your contract and tells you when a professional should see it — and with an important contract, one should.",
      "It does not say whether a clause is unfair or void. That depends on the law and the case, not on the PDF. It can flag that something stands out and that you should ask about it.",
      "It does not sign anything or send anything for you.",
      "It does not make up what it cannot read. If an annex is missing, the photo is cut off or the PDF comes half-way, it says so instead of filling the gap.",
    ],
    costeTitulo: "What it costs",
    costeCuerpo:
      "Reading a document with Paperwork costs the same as sending Kairo a normal message: there is no separate rate. The free plan comes with credits every day, so a one-off contract costs you nothing. What each thing costs is on the pricing page.",
    cierreTitulo: "If you already signed",
    cierreCuerpo:
      "It still helps, sometimes more: knowing how long you have left, what notice you owe and by when is exactly what it takes to get out in time. Upload it anyway.",
    cierreCta: "Start with my contract",
  },
} as const;

export function ContratosContenido() {
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

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.antesTitulo}</h2>
          <div className="mt-5 space-y-4">
            {c.antesCuerpo.map((p) => (
              <p key={p} className="text-[15px] leading-relaxed text-muted">
                {p}
              </p>
            ))}
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
