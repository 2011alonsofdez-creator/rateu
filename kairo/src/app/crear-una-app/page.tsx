import type { Metadata } from "next";
import { CREDITOS_NIVEL } from "@/lib/planes";
import { CrearUnaAppContenido } from "./contenido";

/* Cuarta página de intención, misma estructura que /multas,
 * /cartas-de-hacienda y /contratos: servidor para el title y la
 * description, cliente para el texto en dos idiomas.
 *
 * Esta se adelantó en la cola, y con una medición detrás (informe de
 * mercado del 26-10): la que tocaba era /resumir-video, y resulta que
 * "resumir un vídeo de YouTube" lo hacen nueve herramientas gratis y
 * varias sin registro, así que esa página tendría que ganarles mandando
 * al visitante a registrarse. Esta, en cambio, habla de algo que Kairo
 * estrenó el 25-10 y que en español solo se cuenta apuntando a
 * suscripciones de 20-25 € al mes.
 *
 * Y lleva tres prohibiciones escritas en el backlog, porque es la página
 * más fácil de exagerar que tiene Kairo:
 *   1. NO dice "crea tu app" ni "crea tu SaaS". Es UN archivo: sin base
 *      de datos, sin cuentas y sin despliegue.
 *   2. NO se compara con Lovable, v0 ni Bolt. Hacen otra cosa y cuestan
 *      otro dinero.
 *   3. NO dice que sea única: Claude Artifacts hace esto en su plan
 *      gratuito y DeepSite saca el mismo archivo autónomo.
 * Lo que sí dice es lo que se puede sostener leyendo el código: un
 * archivo, doble clic, sin instalar, funciona sin internet, va en el
 * móvil y cuesta lo que cuesta un nivel normal.
 *
 * Y EL PRECIO SE LEE DEL CÓDIGO DESDE EL 24-11, PORQUE ESCRITO A MANO YA
 * MINTIÓ.
 *
 * Esta página decía "cuesta 4 créditos" en la `description` y en la de
 * Open Graph, o sea en las dos que enseña Google. Cuatro era el precio de
 * un nivel normal ANTES de que la escala se doblara el 06-11: desde
 * entonces son 8, y la página se quedó publicando la mitad **dieciocho
 * días**. Nadie se enteró porque el verificador de cifras no mira las
 * páginas de intención —eso se arregla el mismo día, en `cifras.py`— y
 * porque la pantalla de Code, que sí lee `CREDITOS_NIVEL.normal`
 * (`(app)/code/page.tsx:403`), decía 8 mientras la puerta de entrada
 * decía 4.
 *
 * El nivel con el que se genera una app está en `(app)/code/page.tsx:39`
 * (`const NIVEL = "normal"`), así que la cifra de aquí sale de ahí y no de
 * la memoria de nadie. Si mañana se genera en forja, esto cambia solo. */
export const metadata: Metadata = {
  title: "Pídele una herramienta y te la escribe — Kairo Código",
  description:
    `Dile a Kairo qué herramienta necesitas y la ves escribirse y funcionar. Sale un archivo que te descargas y se abre con doble clic: sin instalar nada, sin cuenta y sin internet. Cuesta ${CREDITOS_NIVEL.normal} créditos.`,
  alternates: { canonical: "/crear-una-app" },
  openGraph: {
    title: "Pídele una herramienta y te la escribe",
    description:
      `Un archivo que se abre con doble clic, funciona sin internet y cuesta ${CREDITOS_NIVEL.normal} créditos. No es un proyecto: es una herramienta pequeña que te hace falta hoy.`,
    url: "/crear-una-app",
    type: "article",
  },
};

export default function CrearUnaAppPage() {
  return <CrearUnaAppContenido />;
}
