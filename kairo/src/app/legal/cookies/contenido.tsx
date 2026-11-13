"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { TITULAR, faltanDelTitular, titularCompleto } from "../datos";
import { Fuerte, Seccion, Tabla } from "../piezas";

/* EL PRIMERO DE LOS CUATRO DOCUMENTOS LEGALES.
 *
 * Y es el primero por un motivo: es el único de los cuatro que se puede
 * escribir **entero** desde el código, sin pedirle nada a nadie. Lo que
 * pone Kairo en el navegador de quien la abre está en tres archivos y se
 * cuenta con los dedos. Los otros tres (aviso legal, privacidad y
 * términos) necesitan datos del dueño; este necesita leer el código.
 *
 * De dónde sale cada dato de este documento, para que se pueda volver a
 * comprobar sin fiarse de mí:
 *
 *   - Las cookies: no hay ni una línea en la aplicación que llame a
 *     `cookies().set()` por su cuenta. Las únicas que se escriben las
 *     pone `@supabase/ssr` a través de `src/proxy.ts` (líneas 26-40) y
 *     `src/lib/supabase/server.ts` (líneas 14-28), que se limitan a
 *     pasar lo que la librería les da.
 *   - El nombre: `sb-<referencia>-auth-token`, el `storageKey` por
 *     omisión de Supabase Auth, partido en trozos `.0`, `.1`… cuando no
 *     cabe en una cookie (`@supabase/ssr`, `utils/chunker.js`:
 *     `MAX_CHUNK_SIZE = 3180`).
 *   - Los 400 días, el `path` y el `SameSite`: `DEFAULT_COOKIE_OPTIONS`
 *     de `@supabase/ssr` (`maxAge: 400 * 24 * 60 * 60`, `path: "/"`,
 *     `sameSite: "lax"`). La aplicación no los cambia.
 *   - Que NO hay analítica ni publicidad: `package.json` no trae ninguna
 *     librería de medición, y en todo `src/` no aparece `gtag`,
 *     `analytics`, `plausible`, `posthog` ni `@vercel/analytics`.
 *   - Las cinco claves de almacenamiento del navegador: son exactamente
 *     las que existen en el código (`kairo.theme` y `kairo.lang` en
 *     `lib/i18n.tsx`, `kairo.buscar` en `lib/buscar-modo.ts`,
 *     `kairo.sonido` en `lib/sonido.ts` y `kairo.borrador` en
 *     `components/Composer.tsx` y `gist/page.tsx`).
 *   - Google Fonts: `src/app/layout.tsx:73-77` carga las dos tipografías
 *     desde `fonts.googleapis.com`, así que Google recibe la IP de quien
 *     abre cualquier página. No pone cookies, pero recibe eso, y por eso
 *     está escrito aquí en vez de callado.
 *
 * Lo que este documento NO hace: inventarse el titular. Los datos de
 * identificación viven en `../datos.ts`, vacíos hasta que el dueño los
 * ponga, y mientras lo estén el documento lo dice con todas las letras
 * en su último apartado. Un titular inventado en un documento legal es
 * peor que un apartado que dice que falta.
 *
 * Tampoco repite nada que no sea de cookies: qué se guarda de las
 * conversaciones y de los papeles es la política de privacidad, que
 * todavía no existe, y aquí se dice que no existe en vez de enlazarla. */

const T = {
  es: {
    migas: "Información legal",
    h1: "Política de cookies",
    actualizado: "Última actualización: 7 de noviembre de 2026",
    resumenTitulo: "En una frase",
    resumen:
      "Kairo usa tres cookies, y las tres son imprescindibles: dos para que sigas dentro de tu cuenta al cambiar de página y una para dejarte probarla sin registrarte. No hay cookies de publicidad y no hay cookies de otras empresas. Kairo sí cuenta lo que pasa —visitas, pruebas, registros—, pero en su propia base de datos y sin tu IP, sin identificador y sin cookies: cuenta sucesos, no personas. Por eso no verás una ventana pidiéndote permiso.",

    s1: "1. Las cookies que usa Kairo",
    s1cabeceras: ["Cookie", "Para qué sirve", "Cuánto dura"],
    s1filas: [
      [
        "sb-<referencia>-auth-token (y sus trozos .0, .1…)",
        "Mantener tu sesión abierta. Es lo que hace que no tengas que volver a entrar cada vez que cambias de pantalla.",
        "400 días, o hasta que cierres sesión o borres los datos del navegador",
      ],
      [
        "sb-<referencia>-auth-token-code-verifier (y una por cada intento de entrada)",
        "Solo durante el inicio de sesión: comprueba que quien termina de entrar es quien lo empezó.",
        "Se borra en cuanto termina de entrar",
      ],
      [
        "kairo_probar",
        "Contar cuántas preguntas de prueba has gastado desde la portada, para dejarte tres sin pedirte cuenta ni correo. El valor es un número, del 1 al 3: no lleva nada tuyo dentro.",
        "30 días",
      ],
    ],
    s1notas: [
      "**Las tres son cookies de Kairo**: se ponen y se leen desde este mismo sitio y no se envían a ninguna otra empresa. Las dos de sesión las emite Supabase Auth, que es el servicio que guarda las cuentas, y «referencia» es el identificador de ese proyecto, que forma parte del nombre. La tercera, la de la prueba, la pone Kairo.",
      "**La de la prueba es la única que toca a alguien que no tiene cuenta**, y existe justo para no pedirte una: sin ella, dejarte probar sin registrarte sería imposible de limitar. No te identifica —guarda un número— y se puede borrar como cualquier otra, con el único efecto de que la prueba vuelve a empezar.",
      "Técnicamente: ámbito todo el sitio (path=/) y SameSite=Lax, que impide que viajen cuando otra web enlaza a Kairo. La de sesión se parte en varias cookies numeradas cuando es demasiado larga para una sola; son la misma cosa.",
      "**Y no hay más.** Kairo no escribe ninguna otra cookie, ni propia ni de terceros. Eran dos hasta el 6 de noviembre, cuando se añadió la prueba sin cuenta.",
    ],

    s2: "2. Por qué no hay una ventana de cookies",
    s2cuerpo: [
      "Porque para estas tres cookies la ley no la exige. El artículo 22.2 de la Ley 34/2002 (la LSSI) pide tu permiso para las cookies que no son imprescindibles; las que hacen falta para prestar un servicio que has pedido tú —entrar en tu cuenta, o probar Kairo sin registrarte— están exceptuadas, y son las únicas que usamos.",
      "Una ventana que solo puede decirte «acepto» no es una elección: es un trámite. Preferimos contarte lo que hay, que es esta página.",
      "**Y desde el 6 de noviembre Kairo sí cuenta lo que pasa, así que hay que decir por qué eso no cambia nada.** Cuenta en su propia base de datos, no en un servicio de fuera, y cuenta **sucesos y no personas**: qué pasó —una visita, una prueba, un registro—, en qué página, y de qué sitio venías, solo el dominio. **Sin tu dirección IP, sin identificador de visitante y sin ninguna cookie.** Nada de eso permite seguirte de una página a otra ni saber quién eres, así que no hay dato personal que guardar y no hay permiso que pedir.",
      "**Lo que sí obligaría a esa ventana** es otra cosa: analítica que te identifique o que te siga, o cualquier pieza de un tercero —un píxel, publicidad, un botón que carga de otra empresa—. Nada de eso hay hoy. El día que lo haya, la ventana se pone **antes** de encenderlo, y esta página se cambia el mismo día.",
    ],

    s3: "3. Lo que Kairo guarda en tu navegador y no es una cookie",
    s3intro:
      "La ley trata igual a las cookies y a cualquier otro almacenamiento parecido, así que lo contamos también. Son cinco cosas, todas preferencias tuyas, y **ninguna sale de tu navegador**: no se envían a Kairo ni a nadie.",
    s3cabeceras: ["Qué se guarda", "Para qué", "Cuánto dura"],
    s3filas: [
      ["kairo.theme", "Si prefieres el tema claro u oscuro", "Hasta que borres los datos del navegador"],
      ["kairo.lang", "Si quieres la web en español o en inglés", "Hasta que borres los datos del navegador"],
      ["kairo.buscar", "Si quieres que Kairo busque en internet", "Hasta que borres los datos del navegador"],
      ["kairo.sonido", "Si los avisos suenan o no", "Hasta que borres los datos del navegador"],
      ["kairo.borrador", "El mensaje que estabas escribiendo, para no perderlo al cambiar de pantalla", "Se borra al cerrar la pestaña"],
    ],

    s4: "4. Lo que ven otras empresas cuando abres Kairo",
    s4intro:
      "Ninguna pone cookies en Kairo, pero por el hecho de que la web funcione reciben algo, y es justo decirlo. La última de la lista no es una empresa: está ahí porque la pregunta que más se hace al leer una política de cookies es justo esa.",
    s4filas: [
      [
        "Vercel",
        "Es donde está alojada la web. Como atiende la petición, ve tu dirección IP y tu navegador en los registros del servidor.",
      ],
      [
        "Supabase",
        "Es donde están las cuentas y los datos. Es quien emite la cookie de sesión de la que habla el punto 1.",
      ],
      [
        "Google Fonts",
        "Las dos tipografías se cargan desde fonts.googleapis.com, así que al abrir cualquier página Google recibe tu dirección IP. No pone cookies ni te identifica con un nombre.",
      ],
      [
        "Y una que no está en la lista, a propósito: la analítica",
        "No hay ninguna empresa de analítica. Lo que Kairo cuenta lo cuenta en su propia base de datos, la de Supabase, que ya está arriba. Nadie más lo ve.",
      ],
    ],
    s4pie:
      "Una cosa más de las tuyas que Kairo mira sin guardarla: al probar desde la portada, el servidor cuenta las preguntas por dirección IP durante una hora para que nadie agote la prueba de los demás. Ese contador vive en la memoria del servidor, se borra solo y no se escribe en ninguna parte. Y qué se guarda de tus conversaciones, de tu memoria y de los papeles que subes no es cosa de las cookies: eso va en la política de privacidad, que todavía no está publicada. Mientras no lo esté, lo que hay escrito sobre ello es lo que Kairo te contesta si se lo preguntas en el chat.",

    s5: "5. Cómo borrarlas o bloquearlas, y qué pasa si lo haces",
    s5cuerpo: [
      "**La forma limpia**: cerrar sesión. Eso borra la cookie de sesión en el momento.",
      "**Desde el navegador**: en los ajustes de privacidad de cualquier navegador puedes ver las cookies de un sitio y borrarlas, o bloquearlas para este sitio. En Chrome y Edge está en Configuración → Privacidad y seguridad; en Firefox, en Ajustes → Privacidad y seguridad; en Safari, en Preferencias → Privacidad.",
      "**Qué pasa si bloqueas la de sesión**: puedes seguir leyendo las páginas públicas, pero no puedes mantener la cuenta abierta. En la práctica, Kairo te pedirá entrar otra vez en cada página, que es lo mismo que no poder usarla.",
      "Las cinco preferencias del punto 3 se borran con los datos del sitio, y lo único que pierdes es la preferencia: la web vuelve a su estado de partida.",
      "**Y la de la prueba**: si la borras, la prueba de la portada vuelve a empezar. No la bloqueamos ni la volvemos a poner por otro camino; el tope por dirección IP sigue ahí, que es lo que evita que nadie se la quede entera.",
    ],

    s6: "6. Si esto cambia",
    s6cuerpo:
      "Este documento se revisa cuando cambie lo que Kairo guarda en tu navegador, y la fecha de arriba es la de la última revisión. Si se añade algo que necesite tu permiso, no se enciende antes de pedirlo.",

    s7: "7. Quién responde de esto",
    s7pendiente:
      "**Este apartado está pendiente y no lo vamos a rellenar a medias.** Los datos del titular del servicio —nombre o razón social, NIF, domicilio, correo de contacto y la ley aplicable— los publica aquí el responsable de Kairo antes del lanzamiento. Publicar un titular inventado en un documento legal sería peor que decir que falta, así que decimos que falta.",
    s7faltan: "Lo que falta por publicar:",
    s7campos: {
      nombre: "nombre o razón social",
      nif: "NIF",
      domicilio: "domicilio",
      email: "correo de contacto",
      fuero: "ley aplicable y fuero",
    } as Record<string, string>,
    s7etiquetas: {
      nombre: "Titular",
      nif: "NIF",
      domicilio: "Domicilio",
      email: "Contacto",
      fuero: "Ley aplicable",
    } as Record<string, string>,
    volver: "Volver a información legal",
  },
  en: {
    migas: "Legal information",
    h1: "Cookie policy",
    actualizado: "Last updated: 7 November 2026",
    resumenTitulo: "In one sentence",
    resumen:
      "Kairo uses three cookies, and all three are strictly necessary: two to keep you signed in as you move between pages, and one so you can try it without signing up. There are no advertising cookies and no third-party cookies. Kairo does count what happens — visits, trials, sign-ups — but in its own database and without your IP, without an identifier and without cookies: it counts events, not people. That is why you will not see a window asking for your consent.",

    s1: "1. The cookies Kairo uses",
    s1cabeceras: ["Cookie", "What it does", "How long it lasts"],
    s1filas: [
      [
        "sb-<reference>-auth-token (and its .0, .1… chunks)",
        "Keeps your session open. It is what saves you from signing in again every time you change screen.",
        "400 days, or until you sign out or clear your browser data",
      ],
      [
        "sb-<reference>-auth-token-code-verifier (one per sign-in attempt)",
        "Only while you are signing in: it checks that whoever finishes signing in is who started it.",
        "Deleted as soon as sign-in finishes",
      ],
      [
        "kairo_probar",
        "Counts how many trial questions you have used from the home page, so you get three without an account or an email. The value is a number from 1 to 3: it holds nothing of yours.",
        "30 days",
      ],
    ],
    s1notas: [
      "**All three are Kairo's own cookies**: they are set and read from this site and are not sent to any other company. The two session ones are issued by Supabase Auth, the service that holds the accounts, and «reference» is that project's identifier, which is part of the name. The third one, the trial cookie, is set by Kairo.",
      "**The trial cookie is the only one that touches someone without an account**, and it exists precisely so that we do not have to ask for one: without it, letting you try without signing up could not be limited. It does not identify you — it holds a number — and it can be deleted like any other, the only effect being that the trial starts over.",
      "Technically: site-wide scope (path=/) and SameSite=Lax, which stops them travelling when another site links to Kairo. The session cookie is split into several numbered cookies when it is too long for one; they are the same thing.",
      "**And that is all.** Kairo writes no other cookie, its own or anyone else's. There were two until 6 November, when the no-account trial was added.",
    ],

    s2: "2. Why there is no cookie window",
    s2cuerpo: [
      "Because the law does not require one for these three cookies. Article 22.2 of Spain's Act 34/2002 (the LSSI) requires your consent for cookies that are not strictly necessary; those needed to provide a service you asked for yourself — signing into your account, or trying Kairo without signing up — are exempt, and they are the only ones we use.",
      "A window whose only option is «I accept» is not a choice, it is a formality. We would rather tell you what there is, which is this page.",
      "**And since 6 November Kairo does count what happens, so we have to say why that changes nothing.** It counts in its own database, not in an outside service, and it counts **events, not people**: what happened — a visit, a trial, a sign-up —, on which page, and which site you came from, the domain only. **No IP address, no visitor identifier and no cookie.** None of that allows following you from page to page or knowing who you are, so there is no personal data to store and no consent to ask for.",
      "**What would require that window** is something else: analytics that identifies or tracks you, or any third-party piece — a pixel, advertising, a button loaded from another company. There is none of that today. The day there is, the window goes up **before** it is switched on, and this page changes the same day.",
    ],

    s3: "3. What Kairo stores in your browser that is not a cookie",
    s3intro:
      "The law treats cookies and any similar storage the same way, so we list those too. There are five, all of them your own preferences, and **none of them leaves your browser**: they are not sent to Kairo or to anyone else.",
    s3cabeceras: ["What is stored", "What for", "How long it lasts"],
    s3filas: [
      ["kairo.theme", "Whether you prefer the light or dark theme", "Until you clear your browser data"],
      ["kairo.lang", "Whether you want the site in Spanish or English", "Until you clear your browser data"],
      ["kairo.buscar", "Whether you want Kairo to search the web", "Until you clear your browser data"],
      ["kairo.sonido", "Whether notifications make a sound", "Until you clear your browser data"],
      ["kairo.borrador", "The message you were writing, so you do not lose it when changing screen", "Deleted when you close the tab"],
    ],

    s4: "4. What other companies see when you open Kairo",
    s4intro:
      "None of them sets cookies on Kairo, but the site working at all means they receive something, and it is fair to say so. The last entry is not a company: it is there because it is the question people most often have when reading a cookie policy.",
    s4filas: [
      [
        "Vercel",
        "This is where the site is hosted. Because it serves the request, it sees your IP address and your browser in its server logs.",
      ],
      [
        "Supabase",
        "This is where accounts and data live. It is what issues the session cookie described in point 1.",
      ],
      [
        "Google Fonts",
        "The two typefaces are loaded from fonts.googleapis.com, so opening any page means Google receives your IP address. It sets no cookies and does not identify you by name.",
      ],
      [
        "And one that is deliberately not on this list: analytics",
        "There is no analytics company. What Kairo counts, it counts in its own database — the Supabase one already listed above. Nobody else sees it.",
      ],
    ],
    s4pie:
      "One more thing of yours that Kairo looks at without keeping it: when you try it from the home page, the server counts questions per IP address for one hour so that nobody uses up everyone else's trial. That counter lives in the server's memory, clears itself and is not written anywhere. And what is stored from your conversations, your memory and the documents you upload is not a cookie matter: that belongs in the privacy policy, which is not published yet. Until it is, what exists on the subject is what Kairo itself tells you if you ask it in the chat.",

    s5: "5. How to delete or block them, and what happens if you do",
    s5cuerpo: [
      "**The clean way**: sign out. That deletes the session cookie there and then.",
      "**From your browser**: any browser's privacy settings let you see a site's cookies and delete them, or block them for this site. In Chrome and Edge it is under Settings → Privacy and security; in Firefox, Settings → Privacy & Security; in Safari, Preferences → Privacy.",
      "**What happens if you block the session cookie**: you can still read the public pages, but you cannot stay signed in. In practice Kairo will ask you to sign in on every page, which amounts to not being able to use it.",
      "The five preferences in point 3 are cleared along with the site's data, and all you lose is the preference: the site goes back to its starting state.",
      "**And the trial cookie**: if you delete it, the home-page trial starts over. We do not block that or set it again by another route; the per-IP limit is still there, and that is what stops anyone from using up the whole trial.",
    ],

    s6: "6. If this changes",
    s6cuerpo:
      "This document is reviewed whenever what Kairo stores in your browser changes, and the date above is the last review. If anything requiring your consent is added, it will not be switched on before asking for it.",

    s7: "7. Who is responsible for this",
    s7pendiente:
      "**This section is pending, and we are not going to half-fill it.** The service owner's details — name or company name, tax number, address, contact email and the applicable law — will be published here by whoever is responsible for Kairo before launch. Publishing an invented owner in a legal document would be worse than saying it is missing, so we say it is missing.",
    s7faltan: "Still to be published:",
    s7campos: {
      nombre: "name or company name",
      nif: "tax number",
      domicilio: "address",
      email: "contact email",
      fuero: "applicable law and jurisdiction",
    } as Record<string, string>,
    s7etiquetas: {
      nombre: "Owner",
      nif: "Tax number",
      domicilio: "Address",
      email: "Contact",
      fuero: "Applicable law",
    } as Record<string, string>,
    volver: "Back to legal information",
  },
};

export function CookiesContenido() {
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
            <Tabla cabeceras={t.s1cabeceras} filas={t.s1filas} />
            <div className="mt-4 space-y-3">
              {t.s1notas.map((n) => (
                <p key={n} className="text-[14.5px] leading-relaxed text-muted">
                  <Fuerte texto={n} />
                </p>
              ))}
            </div>
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
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
              <Fuerte texto={t.s3intro} />
            </p>
            <Tabla cabeceras={t.s3cabeceras} filas={t.s3filas} />
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
            <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{t.s4pie}</p>
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
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t.s6cuerpo}</p>
          </Seccion>

          <Seccion titulo={t.s7}>
            {completo ? (
              <dl className="mt-4 space-y-2 text-[14.5px]">
                {(Object.keys(TITULAR) as (keyof typeof TITULAR)[]).map((k) => (
                  <div key={k} className="flex gap-2">
                    <dt className="font-semibold">{t.s7etiquetas[k]}:</dt>
                    <dd className="text-muted">{TITULAR[k]}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  <Fuerte texto={t.s7pendiente} />
                </p>
                <p className="mt-3 text-[14px] text-muted">{t.s7faltan}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-muted">
                  {faltan.map((k) => (
                    <li key={k}>{t.s7campos[k]}</li>
                  ))}
                </ul>
              </>
            )}
          </Seccion>

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
