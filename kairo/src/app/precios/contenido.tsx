"use client";

/* El cuerpo de `/precios`, tal cual estaba, con una sola diferencia: ya no
 * es la página, es su contenido. La página (`page.tsx`) es ahora de
 * servidor y existe para poder exportar `metadata`, que un componente de
 * cliente no puede.
 *
 * Por qué se partió, el 05-11: `/precios` salía en Google con el título y
 * la descripción de la portada —"Kairo — La IA que trabaja cuando tú no"—
 * porque empezaba por `"use client"`. Estaba en 🟡 en el checklist desde el
 * 29-10 y es la página donde se decide pagar. El patrón es el de las cinco
 * páginas de intención, que ya lo hacían así desde el 17-10.
 *
 * Nada de aquí abajo se ha tocado: la FAQ, su comentario sobre la pregunta
 * de los datos y el maquetado son los de antes, línea a línea. */

import { useUi } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import { CREDITOS_NIVEL } from "@/lib/planes";

/* EL 06-11, DOS COSAS DE LA FUSIÓN DEL DUEÑO, Y UNA NO LA HE COGIDO.
 *
 * Él dobló la escala de créditos el 05-11 (1/4/20/120 → 2/8/40/240,
 * `CREDITOS_NIVEL` en `lib/planes.ts`, migración `0020_escala_x2.sql`) y
 * en su versión de esta FAQ interpoló la constante en la respuesta
 * española. Aquí está hecho igual **y además en la inglesa**, que él dejó
 * con "1 credit, a normal one 4, and a Mega-Prompt 120" escrito a mano:
 * con la escala nueva eso es falso, y una clave sin su traducción —o con
 * una traducción vieja— rompe la otra lengua, que es la regla de la casa.
 *
 * Lo que NO he cogido de su versión: volvió a poner la pregunta
 * "¿Se usan mis conversaciones para entrenar modelos?" con un **"No."**.
 * Esa frase se quitó el 21-10 con un motivo que sigue en pie y que el
 * 05-11 quedó confirmado por la tabla del propio proveedor: en la capa
 * gratuita de la API de Gemini los datos **sí** se usan para mejorar los
 * productos de Google —la fila "Used to improve our products" dice Yes—, y
 * la cuenta de Kairo está en esa capa (`CONTEXTO.md`, 25-10, de un commit
 * suyo). Mientras eso no cambie, ese "No." es falso en la página donde se
 * decide pagar. Está preguntado en el parte del día, en una línea que se
 * contesta con un sí: si paga la capa, el "No." vuelve y lo pongo yo.
 *
 * ACTUALIZACIÓN 11-11, y es lo que hay que saber antes de tocar este
 * archivo: anoche (10-11, 14 commits) tocó esa misma respuesta en SU
 * `page.tsx` y la **reforzó** en vez de resolverla. Ahora dice *"No. Ni las
 * tuyas ni las de nadie, y tampoco se venden."* Las dos frases nuevas son
 * verdad —no vendemos nada y no hay otro destino—, pero la primera sigue
 * siendo falsa mientras la cuenta de Gemini esté en la capa gratuita, y
 * ahora lo afirma con más fuerza. Sexto día. No se ha traído aquí: esta
 * página sigue contestando lo que se puede comprobar. La decisión sigue
 * siendo suya, de una línea, y está en el aviso de hoy.
 *
 * Y de ese mismo repaso suyo **sí** se ha traído, el 11-11, su respuesta
 * nueva de "¿mis hijos pueden usarlo?": de 13 a 17 sí, por debajo de 13
 * todavía no. La de antes —"sí, creando un perfil hijo desde tu cuenta"—
 * prometía algo que no se puede hacer, y era nuestra tanto como suya. Su
 * lado gana porque es el que dice la verdad. De paso se ha quitado la cola
 * de "en los perfiles de menores se guardan los datos mínimos", por lo
 * mismo: no existen todavía.
 *
 * La pregunta de los datos dice lo que se puede comprobar, y nada más.
 *
 * Hasta el 21-10 esta FAQ contestaba "¿se usan mis conversaciones para
 * entrenar modelos?" con un "No." a secas. El informe de mercado del
 * 20-10 encontró el problema: Kairo funciona hoy con un solo motor,
 * Gemini, y en la CAPA GRATUITA de esa API los datos pueden usarse para
 * mejorar los productos de Google —en la de pago, no—. Nadie ha
 * comprobado todavía en qué capa está la cuenta, así que ese "No" era
 * una promesa que esta casa no podía sostener, en la página donde se
 * decide pagar.
 *
 * Así que la pregunta cambia a la que de verdad hace la gente —qué se
 * guarda— y la respuesta solo dice cosas verificables en el código:
 * api/paperwork/route.ts:94-108 guarda lo leído y el NOMBRE del
 * archivo, sin ninguna columna con su contenido; route.ts:160 lo borra;
 * api/chat/route.ts:171-205 guarda las conversaciones; y en `recuerdos`
 * solo entra lo que la persona pide. Eso es más útil que un "No" y es
 * cierto en las dos capas.
 *
 * El "No" vuelve el día que se confirme que la cuenta es de pago, y
 * entonces se añade como una frase más, no como toda la respuesta. */
const FAQ = {
  es: [
    {
      q: "¿Qué es un crédito?",
      a: `La unidad con la que se mide lo que gastas. Un mensaje rápido cuesta ${CREDITOS_NIVEL.fast} créditos, uno normal ${CREDITOS_NIVEL.normal}, y un Mega-Prompt ${CREDITOS_NIVEL.mega}. Siempre ves el coste antes de pulsar enviar.`,
    },
    {
      q: "¿Qué pasa si me quedo sin créditos?",
      a: "Kairo deja de responder hasta que se renueven. En el plan Free se renuevan cada día; en los de pago, cada mes. También puedes comprar un pack, y esos no caducan.",
    },
    {
      q: "¿Puedo cancelar cuando quiera?",
      a: "Sí, desde Ajustes, en dos clics. Sigues teniendo el plan hasta que termine el periodo que ya has pagado.",
    },
    {
      q: "¿Mis hijos pueden usarlo?",
      a: "De 13 a 17 años sí: se registran con su fecha de nacimiento real y Kairo les aplica una moderación bastante más estricta que la de un adulto. Por debajo de 13 todavía no — los perfiles que crea y supervisa un adulto están en camino, y mientras no estén preferimos decirlo a prometerlo.",
    },
    {
      q: "¿Qué se guarda de lo que le mando a Kairo?",
      a: "De un papel que subes a Paperwork se guarda lo que Kairo ha leído —de qué va, el importe, la fecha límite, los pasos— y el nombre del archivo. El archivo en sí no se guarda, y el papel lo puedes borrar cuando quieras. Las conversaciones sí se guardan, para que puedas volver a ellas. Y en la memoria solo entra lo que tú le pidas que recuerde.",
    },
  ],
  en: [
    {
      q: "What is a credit?",
      a: `The unit that measures your usage. A fast message costs ${CREDITOS_NIVEL.fast} credits, a normal one ${CREDITOS_NIVEL.normal}, and a Mega-Prompt ${CREDITOS_NIVEL.mega}. You always see the cost before you hit send.`,
    },
    {
      q: "What happens if I run out of credits?",
      a: "Kairo stops replying until they reset. On Free they reset daily; on paid plans, monthly. You can also buy a pack, and those never expire.",
    },
    {
      q: "Can I cancel any time?",
      a: "Yes, from Settings, in two clicks. You keep your plan until the period you already paid for ends.",
    },
    {
      q: "Can my kids use it?",
      a: "Between 13 and 17, yes: they sign up with their real date of birth and Kairo applies considerably stricter moderation than an adult's. Under 13 not yet — profiles created and supervised by an adult are on the way, and until they exist we would rather say so than promise it.",
    },
    {
      q: "What does Kairo keep of what I send it?",
      a: "From a document you upload to Paperwork it keeps what Kairo read — what it is about, the amount, the deadline, the steps — plus the file name. The file itself is not kept, and you can delete the document whenever you like. Conversations are kept, so you can come back to them. And memory only holds what you ask it to remember.",
    },
  ],
};

export function PreciosContenido() {
  const { t, lang } = useUi();

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-[36px] font-bold tracking-tight sm:text-[46px]">
              {t("pricing.title")}
            </h1>
            <p className="mt-4 text-[16px] text-muted">{t("pricing.sub")}</p>
          </div>

          <div className="mt-12">
            <PricingCards />
          </div>

          <div className="mx-auto mt-16 max-w-2xl">
            <div className="divide-y divide-line rounded-2xl border border-line bg-panel">
              {FAQ[lang].map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-[15px] font-medium marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-faint transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
