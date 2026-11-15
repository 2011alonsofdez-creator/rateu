"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  COWORKS_POR_PLAN,
  CREDITOS_NIVEL,
  CREDITOS_PLAN,
  MENTES_POR_PLAN,
} from "@/lib/planes";
import { miles } from "@/lib/formato";
import { TITULAR, faltanDelTitular, titularCompleto } from "../datos";
import { Fuerte, Seccion, Tabla } from "../piezas";

/* LAS CIFRAS DE ESTE DOCUMENTO NO SE ESCRIBEN A MANO.
 *
 * Es la regla que dejó el verificador de cifras (`agentes/comprobar/`) después
 * de encontrar la escala de créditos vieja en cinco sitios a la vez: un número
 * escrito a mano en un texto es un número que se queda viejo sin que nadie se
 * entere. Aquí se interpolan de `lib/planes.ts`, que es donde el servidor los
 * lee, así que el día que cambien, cambia el documento solo.
 *
 * Y LOS MILES SE SEPARAN CON `lib/formato.ts`, no con `toLocaleString`.
 * La primera versión de este archivo, hace media hora, usaba
 * `toLocaleString("es-ES")` y el HTML generado salió con "2000 créditos al
 * mes" en vez de "2.000": en español un número de cuatro cifras va sin punto
 * y el ICU de Node lo aplica, que es correcto como tipografía y se lee mal en
 * una tabla de precios. Lo encontró la comprobación del HTML, no una
 * sospecha. Y resulta que `lib/formato.ts` ya existía, ya lo separa a mano y
 * su comentario avisa de esta misma trampa con estas mismas cifras. O sea que
 * el error no fue de formato: fue escribir un ayudante nuevo sin mirar si
 * estaba hecho. */

const T = {
  es: {
    migas: "Información legal",
    h1: "Términos de uso",
    actualizado: "Última actualización: 15 de noviembre de 2026",
    resumenTitulo: "En una frase",
    resumen:
      "Kairo te ayuda a entender papeles y a trabajar mientras no estás, pero no es un abogado ni un asesor: te dice qué te piden y para cuándo, y la decisión importante sigue siendo tuya. Usarla es gratis con un límite diario, los créditos que compras no caducan, y lo que escribes y subes sigue siendo tuyo.",

    s1: "1. Qué es Kairo y qué hace",
    s1intro:
      "Kairo es un asistente de inteligencia artificial en español. Esto es lo que hace hoy, no lo que está previsto:",
    s1lista: [
      "**Contesta preguntas** en un chat, y cuando hace falta busca en internet antes de responder.",
      "**Lee papeles oficiales** (Paperwork): le mandas la foto o el PDF de una multa, una carta de Hacienda o un contrato y te dice de qué va, qué te piden, cuánto, para cuándo y qué pasa si no haces nada.",
      "**Trabaja cuando tú no** (Co-Works): encargos que se ejecutan a una hora que tú eliges, sin que estés delante.",
      "**Te avisa de un plazo** por Telegram, si enlazas tu cuenta tú mismo.",
      "**Guarda Mentes**: versiones de Kairo con instrucciones tuyas para un trabajo que repites.",
    ],
    s1pie:
      "Kairo está en desarrollo activo. Hay funciones que aparecen, cambian y alguna que se quita; cuando algo se quita, se dice.",

    s2: "2. Lo más importante: Kairo no es un abogado ni un asesor",
    s2cuerpo:
      "Esto va arriba y no escondido al final, porque es el aviso que de verdad importa en un producto que lee multas y contratos.",
    s2lista: [
      "Lo que Kairo hace bien es **entender un papel y traducirlo a lenguaje normal**: qué te piden, cuánto, para cuándo y qué pasa si no contestas.",
      "Lo que Kairo **no** hace es sustituir a un abogado, a un asesor fiscal, a un gestor o a un médico. No es asesoramiento jurídico, fiscal, financiero ni sanitario.",
      "**Los datos concretos se comprueban en el papel.** Un plazo, un importe o un descuento cambian según el organismo y según el año: Kairo te enseña dónde mirarlo en tu documento en vez de recitarlo de memoria, y eso es a propósito.",
      "**Si la decisión es grande —recurrir, firmar, renunciar a algo— contrástala.** Con el papel delante y, si hace falta, con un profesional. Kairo te deja mucho mejor preparado para esa conversación, pero no la sustituye.",
    ],
    s2pie:
      "Y como toda inteligencia artificial, Kairo se puede equivocar. Cuando algo puede haber cambiado, te lo dice y te dice dónde comprobarlo; cuando algo no lo sabe, lo dice en vez de rellenar el hueco. Pero la responsabilidad de lo que hagas con una respuesta es tuya.",

    s3: "3. Quién puede usarla",
    s3lista: [
      "**Hace falta tener 13 años o más.** No es una frase de adorno: el registro lo comprueba y, por debajo de esa edad, no te deja darte de alta.",
      "**Los perfiles para menores que crea y supervisa un adulto de la familia están en camino.** Mientras no existan, el registro lo dice en vez de prometerlo.",
      "**Si tienes entre 13 y 17 años, Kairo responde en modo menor**, que cambia lo que puede contestar: ni dinero real, ni temas de adultos, y en asuntos delicados te manda a alguien de confianza.",
      "Si usas Kairo en nombre de una empresa, quien acepta estos términos es la empresa.",
    ],

    s4: "4. Tu cuenta",
    s4lista: [
      "Los datos que das al registrarte tienen que ser **tuyos y ciertos**.",
      "La contraseña es tuya y **no se comparte**: lo que se haga desde tu cuenta cuenta como hecho por ti.",
      "Una cuenta es de una persona. Compartirla para multiplicar los créditos gratuitos es justo lo que el apartado 6 llama uso indebido.",
    ],

    s5: "5. Créditos, planes y cobros",
    s5intro:
      "Kairo no funciona con una suscripción obligatoria: funciona con créditos, y cada cosa cuesta lo que cuesta. Estas cifras se leen del código al construir la página, así que son las que aplica el servidor:",
    s5cabeceras: ["Qué", "Cuánto"],
    s5filas: [
      ["Plan gratis", `${CREDITOS_PLAN.free} créditos al día, sin tarjeta. Se reponen cada día.`],
      ["Kairo+", `${miles(CREDITOS_PLAN.plus, "es")} créditos al mes`],
      ["Supreme", `${miles(CREDITOS_PLAN.supreme, "es")} créditos al mes`],
      ["Una respuesta rápida", `${CREDITOS_NIVEL.fast} créditos`],
      ["Una respuesta normal", `${CREDITOS_NIVEL.normal} créditos`],
      ["Forja (trabajo a fondo)", `${CREDITOS_NIVEL.forja} créditos`],
      ["Mega", `${miles(CREDITOS_NIVEL.mega, "es")} créditos`],
      [
        "Co-Works a la vez",
        `${COWORKS_POR_PLAN.free} en gratis, ${COWORKS_POR_PLAN.plus} en Kairo+, ${COWORKS_POR_PLAN.supreme} en Supreme`,
      ],
      [
        "Mentes guardadas",
        `${MENTES_POR_PLAN.free} en gratis, ${MENTES_POR_PLAN.plus} en Kairo+, ${MENTES_POR_PLAN.supreme} en Supreme`,
      ],
    ],
    s5lista: [
      "**Los créditos de un pack no caducan.** Los de un plan se reponen con el plan.",
      "**Si te quedas sin créditos, Kairo no se apaga**: te lo dice y te deja seguir cuando se repongan o cuando compres un pack.",
      "**El cobro lo hace una tienda externa y Kairo no ve tu tarjeta.** No hay ni un campo de tarjeta en Kairo: el botón de comprar te lleva a la tienda del proveedor de pagos, que es quien cobra y quien guarda esos datos.",
      "**Un plan se cancela cuando quieras** y deja de renovarse; lo pagado cubre el periodo ya pagado.",
      "**Y mientras la tienda no esté encendida, no se puede comprar nada**: los botones de plan llevan al chat en vez de a un cobro, y el plan gratis es el único que hay.",
    ],
    s5pie:
      "Si los precios cambian, el precio nuevo se aplica a partir de la siguiente renovación, nunca a un periodo ya pagado.",

    s6: "6. Lo que no se puede hacer con Kairo",
    s6intro: "Pocas cosas y claras:",
    s6lista: [
      "**Nada ilegal**, ni usarla para preparar algo que lo sea.",
      "**No usarla para hacer daño a otra persona**: acosar, suplantar su identidad, o fabricar documentos o mensajes que parezcan de alguien que no eres.",
      "**No intentar sacarle las claves ni la tripa del sistema**, ni colarse por la puerta de atrás de la cuenta de otro.",
      "**No automatizar peticiones en masa** para saltarse los límites, ni crear cuentas en serie con el mismo fin. Kairo se apoya en cuotas de terceros: quien las agota se las quita a usuarios reales.",
      "**No revender las respuestas de Kairo como si fueran un servicio propio** ni presentarlas como asesoramiento profesional.",
    ],
    s6pie:
      "Si pasa algo de esto, la cuenta se puede suspender. Cuando se pueda avisar antes, se avisa; cuando el abuso esté en marcha, primero se corta.",

    s7: "7. Lo que escribes y subes es tuyo",
    s7lista: [
      "**Lo tuyo sigue siendo tuyo.** Kairo no se queda con la propiedad de tus textos, de tus papeles ni de lo que te conteste.",
      "**Lo único que hace con ellos es lo necesario para contestarte**: mandarlos al motor que los lee y guardar lo que dice la política de privacidad, que lo cuenta fila por fila.",
      "**No se venden ni se ceden con fines comerciales.**",
      "Y tú respondes de tener derecho a subir lo que subes: no mandes papeles de otra persona sin que lo sepa.",
    ],

    s8: "8. Dejar de usar Kairo",
    s8lista: [
      "Puedes dejar de usarla cuando quieras, y **borrar tú mismo y al momento** un papel guardado desde Paperwork y lo que Kairo recuerde desde Memoria.",
      "**Para borrar la cuenta entera todavía no hay un botón.** Se pide por el correo de contacto, y lo decimos así porque es como está: describir aquí una pantalla que no existe sería más cómodo y sería falso.",
      "Kairo puede cerrar una cuenta por lo del apartado 6, o si el servicio se descontinúa. En ese caso se avisa con antelación y se devuelve la parte no consumida de un plan en vigor.",
    ],

    s9: "9. Qué no se promete",
    s9intro:
      "Este apartado existe porque lo honesto es escribirlo, no porque haga falta para cubrirse:",
    s9lista: [
      "**No se promete que Kairo esté disponible siempre.** Está en desarrollo y se apoya hoy en cuotas gratuitas de proveedores externos: si uno falla o se agota, Kairo puede ir más lenta, cambiar de motor o dejar de responder un rato. No hay un porcentaje de disponibilidad comprometido, y poner uno sería inventarlo.",
      "**No se promete que una respuesta sea correcta ni completa.** Es un sistema de IA; el apartado 2 cuenta qué hacer con eso.",
      "**No se promete que una función siga existiendo.** Lo que se promete es decirlo cuando se quite.",
      "**No se responde de lo que decidas hacer** a partir de una respuesta, ni de lo que te pase por no comprobar un dato en tu papel, ni de un fallo de un servicio de terceros.",
    ],
    s9pie:
      "Y lo que sí se promete, que es lo que se puede cumplir: que lo que diga esta página y la de privacidad sea verdad, comprobable en el código, y que cuando algo cambie se cambie aquí con su fecha.",

    s10: "10. Cambios en estos términos, ley aplicable y contacto",
    s10cambios:
      "Cuando cambie algo de lo de arriba, se cambia esta página y se cambia la fecha del principio. Los cambios que afecten a lo que pagas o a lo que puedes hacer se anuncian dentro de la aplicación antes de aplicarse.",
    s10pendiente:
      "**La ley aplicable y el fuero están pendientes**, igual que en los otros documentos legales. No se ponen al azar: es un dato de quien lleva Kairo, y un fuero inventado en unos términos de uso es peor que un apartado que avisa de que falta.",
    s10faltan: "Faltan por concretar:",
    s10campos: {
      nombre: "Nombre o razón social del titular del servicio",
      nif: "NIF, NIE o CIF",
      domicilio: "Domicilio a efectos de notificaciones",
      email: "Correo de contacto",
      fuero: "Ley aplicable y fuero",
    } as Record<string, string>,
    s10etiquetas: {
      nombre: "Titular",
      nif: "NIF",
      domicilio: "Domicilio",
      email: "Contacto",
      fuero: "Ley aplicable",
    } as Record<string, string>,
    verPrivacidad: "Y qué se guarda de lo que le mandas está en la política de privacidad:",
    volver: "Volver a información legal",
  },

  en: {
    migas: "Legal information",
    h1: "Terms of use",
    actualizado: "Last updated: 15 November 2026",
    resumenTitulo: "In one sentence",
    resumen:
      "Kairo helps you understand paperwork and work while you are away, but it is not a lawyer or an adviser: it tells you what you are being asked for and by when, and the important decision is still yours. Using it is free with a daily limit, the credits you buy never expire, and what you write and upload stays yours.",

    s1: "1. What Kairo is and what it does",
    s1intro:
      "Kairo is an AI assistant. This is what it does today, not what is planned:",
    s1lista: [
      "**Answers questions** in a chat, and searches the web first when the answer needs it.",
      "**Reads official documents** (Paperwork): send it a photo or PDF of a fine, a tax letter or a contract and it tells you what it is about, what they want, how much, by when and what happens if you do nothing.",
      "**Works when you don't** (Co-Works): jobs that run at a time you choose, without you being there.",
      "**Warns you about a deadline** over Telegram, if you link your account yourself.",
      "**Keeps Minds**: versions of Kairo with your own instructions for work you repeat.",
    ],
    s1pie:
      "Kairo is under active development. Features appear, change, and occasionally one is removed; when something is removed, we say so.",

    s2: "2. The important one: Kairo is not a lawyer or an adviser",
    s2cuerpo:
      "This goes at the top and not hidden at the end, because it is the warning that actually matters in a product that reads fines and contracts.",
    s2lista: [
      "What Kairo does well is **understand a document and put it in plain words**: what they want, how much, by when, and what happens if you do not reply.",
      "What Kairo does **not** do is replace a lawyer, a tax adviser, an accountant or a doctor. It is not legal, tax, financial or medical advice.",
      "**Check the specifics against your own document.** A deadline, an amount or a discount change with the authority and the year: Kairo shows you where to look in your document instead of reciting it from memory, and that is deliberate.",
      "**If the decision is a big one —appealing, signing, giving something up— double-check it.** With the document in front of you and, if needed, with a professional. Kairo leaves you far better prepared for that conversation, but it does not replace it.",
    ],
    s2pie:
      "And like any AI, Kairo can be wrong. When something may have changed it tells you, and tells you where to check; when it does not know something, it says so instead of filling the gap. But what you do with an answer is your responsibility.",

    s3: "3. Who can use it",
    s3lista: [
      "**You must be 13 or older.** This is not decoration: sign-up checks it and will not let you register below that age.",
      "**Profiles for minors, created and supervised by an adult in the family, are on the way.** Until they exist, sign-up says so instead of promising it.",
      "**If you are between 13 and 17, Kairo answers in minor mode**, which changes what it can discuss: no real money, no adult topics, and on sensitive matters it points you to someone you trust.",
      "If you use Kairo on behalf of a company, the company is the one accepting these terms.",
    ],

    s4: "4. Your account",
    s4lista: [
      "The details you give when registering must be **yours and true**.",
      "Your password is yours and **is not shared**: whatever happens from your account counts as done by you.",
      "An account belongs to one person. Sharing it to multiply free credits is exactly what section 6 calls misuse.",
    ],

    s5: "5. Credits, plans and charges",
    s5intro:
      "Kairo does not run on a compulsory subscription: it runs on credits, and each thing costs what it costs. These figures are read from the code when the page is built, so they are the ones the server applies:",
    s5cabeceras: ["What", "How much"],
    s5filas: [
      ["Free plan", `${CREDITOS_PLAN.free} credits a day, no card. They refill every day.`],
      ["Kairo+", `${miles(CREDITOS_PLAN.plus, "en")} credits a month`],
      ["Supreme", `${miles(CREDITOS_PLAN.supreme, "en")} credits a month`],
      ["A fast answer", `${CREDITOS_NIVEL.fast} credits`],
      ["A normal answer", `${CREDITOS_NIVEL.normal} credits`],
      ["Forge (deep work)", `${CREDITOS_NIVEL.forja} credits`],
      ["Mega", `${miles(CREDITOS_NIVEL.mega, "en")} credits`],
      [
        "Co-Works at once",
        `${COWORKS_POR_PLAN.free} on free, ${COWORKS_POR_PLAN.plus} on Kairo+, ${COWORKS_POR_PLAN.supreme} on Supreme`,
      ],
      [
        "Saved Minds",
        `${MENTES_POR_PLAN.free} on free, ${MENTES_POR_PLAN.plus} on Kairo+, ${MENTES_POR_PLAN.supreme} on Supreme`,
      ],
    ],
    s5lista: [
      "**Credits in a pack never expire.** Plan credits refill with the plan.",
      "**If you run out of credits, Kairo does not shut down**: it tells you, and lets you carry on when they refill or when you buy a pack.",
      "**An external store handles the charge and Kairo never sees your card.** There is not a single card field in Kairo: the buy button takes you to the payment provider's store, which charges you and holds those details.",
      "**A plan can be cancelled whenever you like** and stops renewing; what you paid covers the period already paid for.",
      "**And while the store is switched off, nothing can be bought**: plan buttons lead to the chat rather than to a charge, and the free plan is the only one there is.",
    ],
    s5pie:
      "If prices change, the new price applies from the next renewal, never to a period already paid for.",

    s6: "6. What you cannot do with Kairo",
    s6intro: "Few things, and clear ones:",
    s6lista: [
      "**Nothing illegal**, and not using it to prepare something that is.",
      "**Not using it to harm another person**: harassment, impersonation, or producing documents or messages that look like they come from someone you are not.",
      "**Not trying to extract its keys or the system's internals**, nor getting into someone else's account.",
      "**No mass automated requests** to get around the limits, and no serial accounts for the same purpose. Kairo relies on third-party quotas: whoever burns them takes them from real users.",
      "**Not reselling Kairo's answers as a service of your own**, nor presenting them as professional advice.",
    ],
    s6pie:
      "If any of this happens, the account may be suspended. Where we can warn you first, we will; where the abuse is under way, we stop it first.",

    s7: "7. What you write and upload is yours",
    s7lista: [
      "**Yours stays yours.** Kairo does not take ownership of your text, your documents or the answers it gives you.",
      "**All it does with them is what is needed to answer you**: send them to the engine that reads them, and store what the privacy policy describes row by row.",
      "**They are not sold and not shared for commercial purposes.**",
      "And you are responsible for having the right to upload what you upload: do not send someone else's paperwork without them knowing.",
    ],

    s8: "8. Leaving Kairo",
    s8lista: [
      "You can stop using it whenever you like, and **delete, yourself and immediately**, a stored document from Paperwork and whatever Kairo remembers from Memory.",
      "**There is no button yet to delete the whole account.** You ask for it by email, and we say it like that because that is how it is: describing a screen here that does not exist would be more comfortable and would be false.",
      "Kairo may close an account over section 6, or if the service is discontinued. In that case we give notice and refund the unused part of an active plan.",
    ],

    s9: "9. What is not promised",
    s9intro:
      "This section exists because writing it is the honest thing to do, not because it is needed as cover:",
    s9lista: [
      "**No promise that Kairo is always available.** It is under development and today relies on free quotas from external providers: if one fails or runs out, Kairo may get slower, switch engines or stop answering for a while. There is no committed uptime figure, and putting one here would be inventing it.",
      "**No promise that an answer is correct or complete.** It is an AI system; section 2 says what to do about that.",
      "**No promise that a feature will keep existing.** What is promised is saying so when one is removed.",
      "**No liability for what you decide to do** with an answer, nor for what happens if you do not check a detail against your document, nor for a third-party service failing.",
    ],
    s9pie:
      "And what is promised, because it can be kept: that what this page and the privacy policy say is true and checkable in the code, and that when something changes it changes here, with its date.",

    s10: "10. Changes to these terms, governing law and contact",
    s10cambios:
      "When something above changes, this page changes and so does the date at the top. Changes affecting what you pay or what you can do are announced inside the app before they apply.",
    s10pendiente:
      "**Governing law and jurisdiction are pending**, as in the other legal documents. They are not filled in at random: that is a detail belonging to whoever runs Kairo, and an invented jurisdiction in terms of use is worse than a section warning that it is missing.",
    s10faltan: "Still to be confirmed:",
    s10campos: {
      nombre: "Name or company name of the service owner",
      nif: "Tax identification number",
      domicilio: "Address for notifications",
      email: "Contact email",
      fuero: "Governing law and jurisdiction",
    } as Record<string, string>,
    s10etiquetas: {
      nombre: "Owner",
      nif: "Tax ID",
      domicilio: "Address",
      email: "Contact",
      fuero: "Governing law",
    } as Record<string, string>,
    verPrivacidad: "And what is stored of what you send is in the privacy policy:",
    volver: "Back to legal information",
  },
};

export function TerminosContenido() {
  const { lang } = useUi();
  const t = T[lang];
  const faltan = faltanDelTitular();
  const completo = titularCompleto();

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/legal" className="text-[13px] text-muted transition hover:text-fg">
            ← {t.migas}
          </Link>

          <h1 className="mt-4 text-[32px] font-bold tracking-tight">{t.h1}</h1>
          <p className="mt-2 text-[13px] text-faint">{t.actualizado}</p>

          <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
            <h2 className="text-[14px] font-semibold">{t.resumenTitulo}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{t.resumen}</p>
          </div>

          <Seccion titulo={t.s1}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s1intro}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s1lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s1pie}</p>
          </Seccion>

          <Seccion titulo={t.s2}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s2cuerpo}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s2lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s2pie}</p>
          </Seccion>

          <Seccion titulo={t.s3}>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s3lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion titulo={t.s4}>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s4lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion titulo={t.s5}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s5intro}</p>
            <Tabla cabeceras={t.s5cabeceras} filas={t.s5filas} />
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s5lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s5pie}</p>
          </Seccion>

          <Seccion titulo={t.s6}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s6intro}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s6lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s6pie}</p>
          </Seccion>

          <Seccion titulo={t.s7}>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s7lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion titulo={t.s8}>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s8lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion titulo={t.s9}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s9intro}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s9lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s9pie}</p>
          </Seccion>

          <Seccion titulo={t.s10}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s10cambios}</p>
            {completo ? (
              <dl className="mt-4 space-y-2 text-[14.5px]">
                {(Object.keys(TITULAR) as (keyof typeof TITULAR)[]).map((k) => (
                  <div key={k} className="flex gap-2">
                    <dt className="font-semibold">{t.s10etiquetas[k]}:</dt>
                    <dd className="text-muted">{TITULAR[k]}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
                  <Fuerte texto={t.s10pendiente} />
                </p>
                <p className="mt-3 text-[14px] text-muted">{t.s10faltan}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-muted">
                  {faltan.map((k) => (
                    <li key={k}>{t.s10campos[k]}</li>
                  ))}
                </ul>
              </>
            )}
          </Seccion>

          <p className="mt-10 text-[14px] text-muted">
            {t.verPrivacidad}{" "}
            <Link
              href="/legal/privacidad"
              className="underline underline-offset-4 hover:text-fg"
            >
              /legal/privacidad
            </Link>
          </p>

          <div className="mt-12">
            <Link href="/legal" className="text-[14px] text-muted transition hover:text-fg">
              ← {t.volver}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
