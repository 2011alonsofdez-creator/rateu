"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { creditPacks, plans } from "@/lib/mock";
import { CREDITOS } from "@/lib/ia/config";
import { CREDITOS_PLAN } from "@/lib/planes";

/* Las cifras salen de donde las saca la página de precios, no de aquí:
   `plans` y `creditPacks` de `lib/mock.ts`, y `CREDITOS` de
   `lib/ia/config.ts`, que es lo que cobra de verdad cada nivel. Así esta
   página no puede desfasarse sola.

   Y el 31-10 resultó que la cifra no era lo único: dos frases de "Lo
   que no te vamos a contar" seguían diciendo que el plan gratuito va
   "con el modelo rápido", y desde el 29-10 llega al rápido **y al
   normal**. Arreglar el número y dejar la frase es arreglar la mitad:
   esas dos frases son las que más confianza piden, porque son las que
   dicen lo que Kairo NO hace. Corregidas las dos, en los dos idiomas.

   El 30-10 resultó que sí podía, y por esta línea: `GRATIS_AL_DIA`
   estaba escrito a mano justo debajo del comentario que presumía de lo
   contrario. El dueño subió el plan gratis de 15 a 20 el 29 y la página
   siguió diciendo 15 al día siguiente. Ahora sale de `CREDITOS_PLAN`,
   que es lo que de verdad recarga cada día. */
const GRATIS_AL_DIA = CREDITOS_PLAN.free;

const T = {
  es: {
    migas: "Sin suscripción",
    h1: "Una IA que no te cobra todos los meses por si acaso.",
    lead:
      "Kairo te da créditos cada día sin pagar nada y sin pedirte la tarjeta. Si un mes necesitas más, compras un paquete que no caduca. Y si el mes siguiente no la usas, no pagas.",
    ctaPrincipal: "Probarla gratis",
    ctaSecundario: "Ver qué cuesta cada cosa",
    porQueTitulo: "Por qué esto importa más de lo que parece",
    porQueCuerpo: [
      "Casi todas las IA se cobran como el gimnasio: una cuota al mes, la uses o no. Y para la mayoría de la gente eso no encaja, porque no necesita una IA todos los días: necesita una el martes que le llega una multa y otra vez en marzo con la renta.",
      "Pagar diez euros cada mes por dos tardes al año no es caro ni barato: es raro. Por eso Kairo cuenta lo que gastas, no los meses que llevas.",
    ],
    comoTitulo: "Cómo funciona, en tres frases",
    como: [
      {
        t: "Gratis, todos los días",
        d: "Créditos nuevos cada día sin tarjeta y sin prueba que caduca. No es una semana de regalo: es el plan gratuito, y sigue ahí el mes que viene.",
      },
      {
        t: "Si necesitas más, un paquete",
        d: "Se compra una vez y no caduca. Lo que no gastes este mes sigue ahí el que viene, que es justo lo contrario de una cuota.",
      },
      {
        t: "Y si prefieres cuota, también",
        d: "Los planes mensuales existen y salen mejor si la usas a diario. Pero son una opción, no la puerta de entrada.",
      },
    ],
    cuantoTitulo: "Y cuánto es eso en cosas de verdad",
    cuantoPie:
      "Los números de arriba son los que cobra Kairo de verdad: esta página los lee del mismo sitio que la caja, así que no pueden quedarse viejos.",
    ejemploTitulo: "El caso que lo explica mejor",
    ejemploCuerpo:
      "Pedirle una herramienta a Kairo Código —un contador de gastos, una calculadora de notas— cuesta cuatro créditos. Cuatro. Las herramientas que hacen eso y viven de una suscripción empiezan en veinte euros al mes. Si lo que querías era una hojita con dos campos, no tienes por qué entrar en una cuota mensual para conseguirla.",
    sinceroTitulo: "Lo que no te vamos a contar",
    sincero: [
      "Que seamos los únicos. No lo somos: hay productos que venden análisis sueltos sin suscripción y otros con plan gratuito. Lo que Kairo tiene no es la novedad, es la amplitud: el mismo saldo sirve para el chat, para leer un papel, para resumir un vídeo, para una herramienta y para un encargo programado.",
      "Que lo gratuito sea ilimitado. No lo es: son créditos al día, y cuando se acaban Kairo deja de responder hasta el día siguiente. Te lo dice antes, no después.",
      "Que gratis vaya con el motor mejor. El plan gratuito llega al rápido y al normal —con eso van el chat, Paperwork, Gist y Código—, pero Forja y el Mega-Prompt están en los de pago, salvo lo que abran los créditos de bienvenida de una cuenta nueva mientras duren. Es lo que cuesta dinero de verdad, y por eso está donde se paga.",
    ],
    cierreTitulo: "La prueba de todo esto",
    cierreCuerpo:
      "Entra, úsala hoy y no vuelvas en dos meses. No va a pasar nada: no hay nada que cancelar.",
    cierreCta: "Empezar sin pagar",
  },
  en: {
    migas: "No subscription",
    h1: "An AI that does not charge you every month just in case.",
    lead:
      "Kairo gives you credits every day without paying anything and without asking for your card. If one month you need more, you buy a pack that never expires. And if you do not use it the month after, you pay nothing.",
    ctaPrincipal: "Try it free",
    ctaSecundario: "See what each thing costs",
    porQueTitulo: "Why this matters more than it looks",
    porQueCuerpo: [
      "Almost every AI charges like a gym: a monthly fee whether you use it or not. For most people that does not fit, because they do not need an AI every day: they need one on the Tuesday a fine arrives, and again in March with their tax return.",
      "Paying ten euros a month for two afternoons a year is not expensive or cheap: it is odd. So Kairo counts what you spend, not how many months you have been here.",
    ],
    comoTitulo: "How it works, in three sentences",
    como: [
      {
        t: "Free, every day",
        d: "New credits every day, no card and no trial that runs out. It is not a free week: it is the free plan, and it is still there next month.",
      },
      {
        t: "If you need more, a pack",
        d: "Bought once, never expires. What you do not spend this month is still there the next, which is the opposite of a fee.",
      },
      {
        t: "And if you prefer a fee, that too",
        d: "Monthly plans exist and work out better if you use it daily. But they are an option, not the front door.",
      },
    ],
    cuantoTitulo: "And what that is in real things",
    cuantoPie:
      "The numbers above are what Kairo actually charges: this page reads them from the same place the till does, so they cannot go stale.",
    ejemploTitulo: "The case that explains it best",
    ejemploCuerpo:
      "Asking Kairo Code for a tool — a spending tracker, a grade calculator — costs four credits. Four. The tools that do that and live on a subscription start at twenty euros a month. If what you wanted was a little sheet with two fields, you should not have to enter a monthly fee to get it.",
    sinceroTitulo: "What we are not going to tell you",
    sincero: [
      "That we are the only ones. We are not: there are products selling one-off analyses without a subscription, and others with a free tier. What Kairo has is not the novelty, it is the breadth: the same balance works for the chat, for reading a document, for summarising a video, for a tool and for a scheduled job.",
      "That the free tier is unlimited. It is not: it is credits per day, and when they run out Kairo stops replying until the next day. It tells you before, not after.",
      "That free comes with the best engine. The free plan reaches the fast and standard ones — that covers the chat, Paperwork, Gist and Code — but Forja and the Mega-Prompt are on the paid plans, except for whatever a new account's welcome credits open while they last. That is what actually costs money, which is why it sits where you pay.",
    ],
    cierreTitulo: "The proof of all this",
    cierreCuerpo:
      "Come in, use it today, and do not come back for two months. Nothing will happen: there is nothing to cancel.",
    cierreCta: "Start without paying",
  },
} as const;

export function SinSuscripcionContenido() {
  const { lang } = useUi();
  const c = T[lang];

  /* Lo que dan los créditos gratis de un día, contado con lo que cobra
     cada cosa de verdad. Nada escrito a mano. */
  const euros = (n: number) =>
    `${n.toFixed(2).replace(".", lang === "es" ? "," : ".")} €`;
  /* Los miles, a mano y no con `toLocaleString`: el build salió con "2000"
     en vez de "2.000" porque los datos de locale del servidor no tienen por
     qué estar completos. Es el mismo motivo por el que `euros` cambia la
     coma a mano. Lo pilló la comprobación del HTML generado. */
  const miles = (n: number) =>
    n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === "es" ? "." : ",");
  const plus = plans.find((p) => p.id === "plus");

  const cuentas = [
    {
      n: `${GRATIS_AL_DIA}`,
      q: lang === "es" ? "créditos gratis cada día" : "free credits every day",
      d:
        lang === "es"
          ? `Dan para ${GRATIS_AL_DIA} mensajes rápidos, o para ${Math.floor(GRATIS_AL_DIA / CREDITOS.normal)} papeles leídos con Paperwork. Cada día otra vez.`
          : `Enough for ${GRATIS_AL_DIA} fast messages, or ${Math.floor(GRATIS_AL_DIA / CREDITOS.normal)} documents read with Paperwork. Again the next day.`,
    },
    {
      n: `${CREDITOS.normal}`,
      q: lang === "es" ? "créditos, una herramienta" : "credits, one tool",
      d:
        lang === "es"
          ? "Lo mismo que un mensaje normal o que leer un papel. Y cada arreglo cuesta otros tantos, porque se escribe otra vez."
          : "The same as a normal message or reading a document. And each fix costs the same again, because it is written again.",
    },
    {
      n: creditPacks.map((p) => euros(p.price)).join(" / "),
      q:
        lang === "es"
          ? `paquetes de ${creditPacks.map((p) => miles(p.credits)).join(" y ")} créditos`
          : `packs of ${creditPacks.map((p) => miles(p.credits)).join(" and ")} credits`,
      d:
        lang === "es"
          ? "Se compran una vez y no caducan. Sin renovación y sin nada que cancelar."
          : "Bought once and they never expire. No renewal and nothing to cancel.",
    },
    {
      n: plus ? euros(plus.monthly) : "—",
      q: lang === "es" ? "al mes, si la usas a diario" : "a month, if you use it daily",
      d:
        lang === "es"
          ? "El plan de cuota, para quien sí la abre todos los días. Es una opción, no el peaje de entrada."
          : "The subscription plan, for people who do open it every day. An option, not the toll at the door.",
    },
  ];

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
              href="/registro"
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

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.porQueTitulo}</h2>
          <div className="mt-5 space-y-4">
            {c.porQueCuerpo.map((p) => (
              <p key={p} className="text-[15px] leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </div>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.comoTitulo}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {c.como.map((item) => (
              <div key={item.t} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">{item.t}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.d}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.cuantoTitulo}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {cuentas.map((x) => (
              <div key={x.q} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[22px] font-bold tracking-tight">{x.n}</p>
                <p className="text-[13px] font-medium text-faint">{x.q}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-faint">{c.cuantoPie}</p>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.ejemploTitulo}</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">{c.ejemploCuerpo}</p>

          <h2 className="mt-16 text-[24px] font-semibold tracking-tight">{c.sinceroTitulo}</h2>
          <ul className="mt-5 space-y-3">
            {c.sincero.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                <span aria-hidden className="text-faint">
                  —
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-16 rounded-2xl border border-line bg-panel p-6">
            <p className="text-[17px] font-semibold">{c.cierreTitulo}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.cierreCuerpo}</p>
            <Link
              href="/registro"
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
