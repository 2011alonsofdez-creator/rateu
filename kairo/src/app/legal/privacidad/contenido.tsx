"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { TITULAR, faltanDelTitular, titularCompleto } from "../datos";
import { Fuerte, Seccion, Tabla } from "../piezas";

/* EL SEGUNDO DOCUMENTO LEGAL, Y DE DÓNDE SALE CADA AFIRMACIÓN.
 *
 * Esto no está escrito de memoria ni copiado de otra web: está escrito
 * leyendo el código que guarda. Así se puede volver a comprobar sin fiarse
 * de quien lo redactó, que es lo único que hace útil a un documento así:
 *
 *   - Paperwork guarda lo leído y el nombre del archivo, y NO el archivo:
 *     `api/paperwork/route.ts:94-108`, donde el `insert` no tiene ninguna
 *     columna con el contenido del fichero.
 *   - Un papel se borra de verdad: `api/paperwork/route.ts:177`, un
 *     `delete()`, no el `update` de estado de la línea 164.
 *   - Las conversaciones y los mensajes se guardan: `api/chat/route.ts:171-205`.
 *   - La memoria solo guarda lo pedido: `api/chat/route.ts:354-355`.
 *   - La analítica cuenta sucesos sin IP, sin identificador y sin cookie:
 *     `supabase/migrations/0022_rastro.sql` y `lib/rastro.ts`.
 *   - La prueba sin cuenta: galleta `kairo_probar` con un número dentro y un
 *     contador por IP que vive en memoria y no se escribe
 *     (`api/probar/route.ts`).
 *   - Google Fonts recibe la IP de quien abre cualquier página:
 *     `app/layout.tsx:73-77`.
 *
 * Y lo que este documento NO hace, que es tan importante:
 *
 *   1. No se inventa el titular. Vive en `../datos.ts` y, mientras esté
 *      vacío, el último apartado dice exactamente qué falta.
 *   2. **No afirma que tus datos no se usan para entrenar modelos.** Hoy
 *      Kairo funciona sobre la capa gratuita de la API de Gemini, y la tabla
 *      de precios del propio proveedor dice que en esa capa los datos se usan
 *      para mejorar sus productos. Decir lo contrario en una política de
 *      privacidad no sería una frase de marketing optimista: sería falso en
 *      el documento donde menos se puede. El apartado 5 lo cuenta como es y
 *      dice qué lo cambiaría.
 *   3. No promete plazos de conservación, copias de seguridad ni cifrado:
 *      nada de eso consta en el repositorio, y el apartado 7 lo dice en vez
 *      de rellenarlo con lo que suelen poner otros. */

const T = {
  es: {
    migas: "Información legal",
    h1: "Política de privacidad",
    actualizado: "Última actualización: 13 de noviembre de 2026",
    resumenTitulo: "En una frase",
    resumen:
      "De un papel que subes se guarda lo que Kairo ha leído y el nombre del archivo, pero no el archivo; las conversaciones se guardan para que puedas volver a ellas; la memoria solo guarda lo que le pides que recuerde; y hay cosas que todavía no podemos afirmarte —cuánto se conserva, si se cifra, y si el proveedor del modelo usa lo que le mandamos para mejorar el suyo—, así que en vez de prometerlas te las contamos como están.",

    s1: "1. Qué datos se guardan, y cuáles no",
    s1intro:
      "Esta tabla está escrita leyendo el código que guarda, no de memoria. Cada fila se puede comprobar en el repositorio.",
    s1cabeceras: ["Qué", "Se guarda", "No se guarda"],
    s1filas: [
      [
        "Papeles (Paperwork)",
        "Lo que Kairo ha leído del papel: título, remitente, de qué va, qué quieren, importe, fecha límite, consecuencias, pasos y borrador. Y el nombre del archivo.",
        "El archivo. La foto o el PDF viajan al modelo que los lee y no se escriben en ninguna tabla.",
      ],
      [
        "Chat",
        "Las conversaciones y sus mensajes, atados a tu cuenta, para que mañana puedas volver a la de hoy.",
        "Nada se asocia a tu navegación por la web ni se usa para perfilarte.",
      ],
      [
        "Memoria",
        "Solo lo que tú le pides expresamente que recuerde.",
        "Kairo no va apuntando cosas por su cuenta mientras hablas.",
      ],
      [
        "Tu cuenta",
        "Correo, nombre, plan, saldo de créditos, modo de edad, idioma y tono.",
        "No se pide dirección postal, ni teléfono, ni documento de identidad.",
      ],
      [
        "Mentes y Co-Works",
        "Las instrucciones y los encargos que escribes, porque son el producto: sin ellos no hay nada que ejecutar.",
        "—",
      ],
      [
        "Telegram",
        "Solo si lo enlazas tú: el identificador de tu chat, para poder avisarte de un plazo.",
        "Si no lo enlazas, no hay nada. Y se puede desenlazar.",
      ],
      [
        "Medición de uso",
        "Sucesos: una visita, una prueba, un registro, un mensaje; en qué página, y el dominio del sitio del que venías.",
        "Tu dirección IP, ningún identificador de visitante y ninguna cookie. Cuenta sucesos, no personas.",
      ],
    ],

    s2: "2. Para qué se usa cada cosa",
    s2cuerpo: [
      "**Para prestarte el servicio que has pedido.** Guardar la conversación es lo que te deja volver a ella; guardar lo leído de un papel es lo que te deja consultarlo sin volver a subirlo; guardar un Co-Work es lo que permite que se ejecute mañana a su hora sin que estés delante.",
      "**Para cobrar lo que corresponde.** El saldo de créditos y el plan se guardan porque son la cuenta de lo que usas.",
      "**Para proteger a los menores.** El modo de edad cambia cómo responde Kairo, y por eso se guarda con tu perfil.",
      "**Para saber si la web funciona.** La medición de uso cuenta sucesos agregados, sin identificarte, y sirve para saber si la gente llega y si algo se rompe. Si no existiera, lo único que sabríamos de un fallo es que alguien se queja.",
      "**Y no se usa para nada más.** No se vende, no se cede a terceros con fines comerciales, y no se usa para construir un perfil tuyo ni para publicidad.",
    ],

    s3: "3. Con qué derecho se guardan",
    s3cuerpo: [
      "**La ejecución del contrato** (artículo 6.1.b del RGPD) para todo lo que hace falta para darte el servicio: tu cuenta, tus conversaciones, tus papeles, tus Mentes y tus Co-Works.",
      "**Tu consentimiento** (artículo 6.1.a) para lo que es opcional y lo activas tú: enlazar Telegram, y pedirle a Kairo que recuerde algo.",
      "**El interés legítimo** (artículo 6.1.f) para la medición agregada que no te identifica y para los límites antiabuso de la prueba sin cuenta.",
      "**Y una obligación legal** (artículo 6.1.c) para lo que haya que conservar por facturación cuando los pagos estén activos.",
    ],

    s4: "4. Quién más ve tus datos",
    s4intro:
      "Kairo no funciona sola: se apoya en servicios de terceros, y lo que cada uno ve es distinto. Esta lista es la de hoy; cualquier cambio se refleja aquí.",
    s4filas: [
      [
        "Google (API de Gemini)",
        "Es el motor que escribe las respuestas, así que recibe tu pregunta y, si subes un papel, el papel. Es inevitable: sin mandarle el texto no hay respuesta. Lo que hace Google con eso depende de la capa contratada, y eso está en el apartado 5.",
      ],
      [
        "OpenRouter",
        "La vía de respaldo cuando el motor principal agota su cuota del día. Recibe lo mismo que el anterior y solo cuando entra.",
      ],
      [
        "Supabase",
        "Es la base de datos y el servicio de cuentas: ahí viven tu perfil, tus conversaciones y tus papeles.",
      ],
      [
        "Vercel",
        "Es donde está alojada la web. Como atiende cada petición, ve tu dirección IP y tu navegador en los registros del servidor.",
      ],
      [
        "Telegram",
        "Solo si lo enlazas: recibe el aviso que te mandamos.",
      ],
      [
        "Google Fonts",
        "Las dos tipografías se cargan desde sus servidores, así que al abrir cualquier página Google recibe tu dirección IP. No pone cookies.",
      ],
    ],

    s5: "5. Si lo que le mandas se usa para entrenar modelos",
    s5cuerpo: [
      "**Esta es la pregunta que más se hace, y la contestamos como está, no como nos gustaría.**",
      "Kairo funciona hoy sobre la **capa gratuita** de la API de Gemini. En la tabla de precios del propio proveedor, esa capa figura con la fila *«usado para mejorar nuestros productos»* marcada como **sí**, mientras que en la capa de pago figura como **no**. Así que, mientras Kairo siga en esa capa, **no podemos afirmarte que lo que le mandas no se use para mejorar los modelos de Google**.",
      "**Qué significa en la práctica**: si vas a subir un papel con tu nombre, tu dirección o tu DNI, esa es la información que necesitas para decidir, y preferimos dártela antes que después.",
      "**Qué lo cambiaría**: pasar la cuenta a la capa de pago de esa API. Es una decisión de quien lleva Kairo, no un cambio de código, y el día que se tome este apartado se reescribe con la fecha.",
      "**Y lo que sí podemos decirte hoy**: Kairo no vende tus datos, no los cede con fines comerciales y no los usa para entrenar ningún modelo propio. Lo que no controlamos es lo que el proveedor del motor haga bajo las condiciones de la capa contratada, y por eso lo decimos en vez de callarlo.",
    ],

    s6: "6. Menores",
    s6cuerpo: [
      "Kairo tiene tres modos de edad —niño, adolescente y adulto— y el modo cambia de verdad cómo responde: con un menor no habla de contenido sexual, drogas, apuestas, armas ni autolesión, y con un niño se limita a temas educativos, creativos y de ocio.",
      "**Por debajo de 13 años no se puede abrir cuenta.** Los perfiles que crea y supervisa un adulto de la familia están en camino; mientras no existan, el registro lo dice en vez de prometerlo.",
      "**Ante la duda, el modo más protegido.** Si la edad no consta, Kairo trata la conversación como si hablara con un menor. Esa decisión está en el código y no depende de que nadie se acuerde.",
      "De un perfil de menor se guardan los mismos datos mínimos que de cualquier otro: correo, nombre y preferencias. Nunca se le piden datos personales en la conversación —ni colegio, ni dirección, ni fotos—, y así está escrito en las instrucciones de Kairo.",
    ],

    s7: "7. Lo que todavía no podemos decirte",
    s7intro:
      "Un documento honesto tiene que tener este apartado. Estas cuatro cosas no constan hoy en el proyecto, y preferimos decirlo a escribir lo que suele ponerse:",
    s7lista: [
      "**Cuánto tiempo se conserva cada cosa.** No hay un plazo de borrado automático configurado. Lo que sí puedes hacer hoy es borrar tú: un papel se borra de verdad desde Paperwork.",
      "**Si hay copias de seguridad, y cuánto duran.** Depende de la configuración del servicio de base de datos y no consta documentada.",
      "**Si los datos se cifran en reposo**, más allá de lo que haga el proveedor por defecto.",
      "**Quién puede verlos por dentro.** No hay una política de acceso escrita.",
    ],
    s7pie:
      "Las cuatro se resuelven con decisiones de quien lleva Kairo, y este documento se actualizará con cada una. Mientras tanto, si alguna es importante para ti antes de subir un papel, pregúntalo por el correo de contacto.",

    s8: "8. Tus derechos",
    s8intro:
      "Puedes ejercer en cualquier momento los derechos que te da el Reglamento General de Protección de Datos:",
    s8lista: [
      "**Acceso**: saber qué datos tuyos hay.",
      "**Rectificación**: corregir los que estén mal.",
      "**Supresión**: pedir que se borren.",
      "**Oposición y limitación**: pedir que dejen de usarse para algo concreto.",
      "**Portabilidad**: llevarte tus datos a otra parte.",
      "**Y reclamar** ante la Agencia Española de Protección de Datos (www.aepd.es) si crees que no se ha hecho bien.",
    ],
    s8pie:
      "Se ejercen escribiendo al correo de contacto que aparece al final de esta página. Y dos los puedes ejercer tú mismo y al momento, sin pedir permiso: borrar un papel desde Paperwork, y borrar lo que Kairo recuerda desde Memoria.",

    s9: "9. Cambios en esta política",
    s9cuerpo:
      "Cuando algo de lo de arriba cambie —un servicio nuevo, un dato que empiece a guardarse, la capa de la API—, se cambia esta página y se cambia la fecha de arriba. No se avisa por correo de cada cambio menor, pero los que afecten a qué se guarda o a quién se comparte se anuncian dentro de la aplicación.",

    s10: "10. Quién responde de todo esto",
    s10pendiente:
      "**Este apartado está pendiente.** Los datos del responsable del tratamiento todavía no se han publicado, y preferimos dejarlo dicho a inventarnos un nombre: un titular falso en una política de privacidad es peor que un apartado que avisa de que falta.",
    s10faltan: "Faltan por concretar:",
    s10campos: {
      nombre: "Nombre o razón social del responsable",
      nif: "NIF, NIE o CIF",
      domicilio: "Domicilio a efectos de notificaciones",
      email: "Correo de contacto para ejercer tus derechos",
      fuero: "Ley aplicable y fuero",
    } as Record<string, string>,
    s10etiquetas: {
      nombre: "Responsable",
      nif: "NIF",
      domicilio: "Domicilio",
      email: "Contacto",
      fuero: "Ley aplicable",
    } as Record<string, string>,
    verCookies: "Y lo que Kairo guarda en tu navegador está en la política de cookies.",
    volver: "Volver a información legal",
  },

  en: {
    migas: "Legal information",
    h1: "Privacy policy",
    actualizado: "Last updated: 13 November 2026",
    resumenTitulo: "In one sentence",
    resumen:
      "From a document you upload we store what Kairo read and the file name, but not the file; conversations are stored so you can come back to them; memory only keeps what you ask it to keep; and there are things we cannot yet promise you —how long data is kept, whether it is encrypted, and whether the model provider uses what we send to improve theirs—, so instead of promising them we tell you how they stand.",

    s1: "1. What is stored, and what is not",
    s1intro:
      "This table was written by reading the code that stores things, not from memory. Every row can be checked in the repository.",
    s1cabeceras: ["What", "Stored", "Not stored"],
    s1filas: [
      [
        "Documents (Paperwork)",
        "What Kairo read from the document: title, sender, what it is about, what they want, amount, deadline, consequences, steps and draft. Plus the file name.",
        "The file itself. The photo or PDF travels to the model that reads it and is never written to any table.",
      ],
      [
        "Chat",
        "Conversations and their messages, tied to your account, so that tomorrow you can return to today's.",
        "Nothing is linked to your browsing or used to profile you.",
      ],
      [
        "Memory",
        "Only what you explicitly ask it to remember.",
        "Kairo does not take notes on its own while you talk.",
      ],
      [
        "Your account",
        "Email, name, plan, credit balance, age mode, language and tone.",
        "No postal address, no phone number, no ID document.",
      ],
      [
        "Minds and Co-Works",
        "The instructions and jobs you write: without them there is nothing to run.",
        "—",
      ],
      [
        "Telegram",
        "Only if you link it yourself: your chat identifier, so we can warn you about a deadline.",
        "If you do not link it, there is nothing. And it can be unlinked.",
      ],
      [
        "Usage measurement",
        "Events: a visit, a trial, a sign-up, a message; on which page, and the domain you came from.",
        "Your IP address, any visitor identifier and any cookie. It counts events, not people.",
      ],
    ],

    s2: "2. What each thing is used for",
    s2cuerpo: [
      "**To provide the service you asked for.** Storing the conversation is what lets you return to it; storing what was read from a document is what lets you consult it without uploading it again; storing a Co-Work is what lets it run tomorrow at its hour without you being there.",
      "**To charge correctly.** Your credit balance and plan are stored because they are the account of what you use.",
      "**To protect minors.** The age mode changes how Kairo answers, which is why it is stored with your profile.",
      "**To know whether the site works.** Usage measurement counts aggregate events, without identifying you, and tells us whether people arrive and whether something breaks. Without it, the only way to learn about a fault is for someone to complain.",
      "**And for nothing else.** Your data is not sold, not shared with third parties for commercial purposes, and not used to build a profile of you or for advertising.",
    ],

    s3: "3. The legal basis",
    s3cuerpo: [
      "**Performance of the contract** (GDPR article 6.1.b) for everything needed to give you the service: your account, conversations, documents, Minds and Co-Works.",
      "**Your consent** (article 6.1.a) for what is optional and switched on by you: linking Telegram, and asking Kairo to remember something.",
      "**Legitimate interest** (article 6.1.f) for aggregate measurement that does not identify you and for the anti-abuse limits of the no-account trial.",
      "**And a legal obligation** (article 6.1.c) for whatever must be kept for invoicing once payments are live.",
    ],

    s4: "4. Who else sees your data",
    s4intro:
      "Kairo does not work alone: it relies on third-party services, and each one sees something different. This is today's list; any change is reflected here.",
    s4filas: [
      [
        "Google (Gemini API)",
        "The engine that writes the answers, so it receives your question and, if you upload a document, the document. That is unavoidable: without sending the text there is no answer. What Google does with it depends on the tier in use, and that is section 5.",
      ],
      [
        "OpenRouter",
        "The fallback route when the main engine runs out of its daily quota. It receives the same, and only when it steps in.",
      ],
      [
        "Supabase",
        "The database and accounts service: your profile, conversations and documents live there.",
      ],
      [
        "Vercel",
        "Where the site is hosted. As it serves every request, it sees your IP address and your browser in the server logs.",
      ],
      [
        "Telegram",
        "Only if you link it: it receives the notice we send you.",
      ],
      [
        "Google Fonts",
        "The two typefaces load from their servers, so opening any page gives Google your IP address. It sets no cookies.",
      ],
    ],

    s5: "5. Whether what you send is used to train models",
    s5cuerpo: [
      "**This is the most asked question, and we answer it as it stands, not as we would like it to stand.**",
      "Kairo currently runs on the **free tier** of the Gemini API. In the provider's own pricing table, that tier shows the row *“used to improve our products”* marked **yes**, while the paid tier shows **no**. So, while Kairo stays on that tier, **we cannot tell you that what you send is not used to improve Google's models**.",
      "**What that means in practice**: if you are about to upload a document with your name, your address or your ID number, that is the information you need in order to decide, and we would rather give it to you beforehand.",
      "**What would change it**: moving the account to the paid tier of that API. That is a decision for whoever runs Kairo, not a code change, and the day it is taken this section will be rewritten with the date.",
      "**And what we can tell you today**: Kairo does not sell your data, does not share it for commercial purposes and does not use it to train any model of its own. What we do not control is what the engine provider does under the terms of the tier in use, which is why we say so rather than keep quiet.",
    ],

    s6: "6. Minors",
    s6cuerpo: [
      "Kairo has three age modes —child, teen and adult— and the mode really does change how it answers: with a minor it does not discuss sexual content, drugs, gambling, weapons or self-harm, and with a child it sticks to educational, creative and wholesome topics.",
      "**Under 13 you cannot open an account.** Profiles created and supervised by an adult in the family are on the way; until they exist, sign-up says so rather than promising it.",
      "**When in doubt, the most protected mode.** If age is unknown, Kairo treats the conversation as if it were talking to a minor. That decision is in the code and does not depend on anyone remembering it.",
      "A minor's profile stores the same minimum data as any other: email, name and preferences. Personal details are never requested in conversation —no school, no address, no photos—, and that is written into Kairo's instructions.",
    ],

    s7: "7. What we cannot tell you yet",
    s7intro:
      "An honest document needs this section. These four things are not established in the project today, and we would rather say so than write what is usually written:",
    s7lista: [
      "**How long each thing is kept.** There is no automatic deletion period configured. What you can do today is delete things yourself: a document is really deleted from Paperwork.",
      "**Whether there are backups, and for how long.** That depends on the database service configuration and is not documented.",
      "**Whether data is encrypted at rest**, beyond whatever the provider does by default.",
      "**Who can see it internally.** There is no written access policy.",
    ],
    s7pie:
      "All four are resolved by decisions from whoever runs Kairo, and this document will be updated with each one. In the meantime, if any of them matters to you before uploading a document, ask at the contact address.",

    s8: "8. Your rights",
    s8intro:
      "You can exercise the rights given to you by the General Data Protection Regulation at any time:",
    s8lista: [
      "**Access**: find out what data about you exists.",
      "**Rectification**: correct anything wrong.",
      "**Erasure**: ask for it to be deleted.",
      "**Objection and restriction**: ask that it stop being used for something specific.",
      "**Portability**: take your data elsewhere.",
      "**And complain** to the Spanish Data Protection Agency (www.aepd.es) if you believe this has not been handled properly.",
    ],
    s8pie:
      "They are exercised by writing to the contact address at the end of this page. And two of them you can exercise yourself, right away, without asking: deleting a document from Paperwork, and clearing what Kairo remembers from Memory.",

    s9: "9. Changes to this policy",
    s9cuerpo:
      "When anything above changes —a new service, a piece of data that starts being stored, the API tier— this page changes and the date at the top changes with it. We do not email about every minor change, but anything affecting what is stored or who it is shared with is announced inside the app.",

    s10: "10. Who is responsible for this",
    s10pendiente:
      "**This section is pending.** The data controller's details have not been published yet, and we would rather say so than invent a name: a false controller in a privacy policy is worse than a section that warns it is missing.",
    s10faltan: "Still to be filled in:",
    s10campos: {
      nombre: "Name or company name of the controller",
      nif: "Tax number",
      domicilio: "Address for notifications",
      email: "Contact address for exercising your rights",
      fuero: "Applicable law and jurisdiction",
    } as Record<string, string>,
    s10etiquetas: {
      nombre: "Controller",
      nif: "Tax number",
      domicilio: "Address",
      email: "Contact",
      fuero: "Applicable law",
    } as Record<string, string>,
    verCookies: "And what Kairo stores in your browser is in the cookie policy.",
    volver: "Back to legal information",
  },
};

export function PrivacidadContenido() {
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
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{t.resumen}</p>
          </div>

          <Seccion titulo={t.s1}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s1intro}</p>
            <Tabla cabeceras={t.s1cabeceras} filas={t.s1filas} />
          </Seccion>

          <Seccion titulo={t.s2}>
            <div className="mt-3 space-y-3">
              {t.s2cuerpo.map((p) => (
                <p key={p} className="text-[14.5px] leading-relaxed text-muted">
                  <Fuerte texto={p} />
                </p>
              ))}
            </div>
          </Seccion>

          <Seccion titulo={t.s3}>
            <div className="mt-3 space-y-3">
              {t.s3cuerpo.map((p) => (
                <p key={p} className="text-[14.5px] leading-relaxed text-muted">
                  <Fuerte texto={p} />
                </p>
              ))}
            </div>
          </Seccion>

          <Seccion titulo={t.s4}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s4intro}</p>
            <div className="mt-4 space-y-4">
              {t.s4filas.map(([quien, que]) => (
                <div key={quien} className="rounded-2xl border border-line p-4">
                  <h3 className="text-[14px] font-semibold">{quien}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{que}</p>
                </div>
              ))}
            </div>
          </Seccion>

          <Seccion titulo={t.s5}>
            <div className="mt-3 space-y-3">
              {t.s5cuerpo.map((p) => (
                <p key={p} className="text-[14.5px] leading-relaxed text-muted">
                  <Fuerte texto={p} />
                </p>
              ))}
            </div>
          </Seccion>

          <Seccion titulo={t.s6}>
            <div className="mt-3 space-y-3">
              {t.s6cuerpo.map((p) => (
                <p key={p} className="text-[14.5px] leading-relaxed text-muted">
                  <Fuerte texto={p} />
                </p>
              ))}
            </div>
          </Seccion>

          <Seccion titulo={t.s7}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s7intro}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s7lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s7pie}</p>
          </Seccion>

          <Seccion titulo={t.s8}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s8intro}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-muted">
              {t.s8lista.map((p) => (
                <li key={p}>
                  <Fuerte texto={p} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s8pie}</p>
          </Seccion>

          <Seccion titulo={t.s9}>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s9cuerpo}</p>
          </Seccion>

          <Seccion titulo={t.s10}>
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
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
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
            {t.verCookies}{" "}
            <Link href="/legal/cookies" className="underline underline-offset-4 hover:text-fg">
              /legal/cookies
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
