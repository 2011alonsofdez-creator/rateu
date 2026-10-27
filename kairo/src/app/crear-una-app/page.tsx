import type { Metadata } from "next";
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
 * móvil y cuesta 4 créditos. */
export const metadata: Metadata = {
  title: "Pídele una herramienta y te la escribe — Kairo Código",
  description:
    "Dile a Kairo qué herramienta necesitas y la ves escribirse y funcionar. Sale un archivo que te descargas y se abre con doble clic: sin instalar nada, sin cuenta y sin internet. Cuesta 4 créditos.",
  alternates: { canonical: "/crear-una-app" },
  openGraph: {
    title: "Pídele una herramienta y te la escribe",
    description:
      "Un archivo que se abre con doble clic, funciona sin internet y cuesta 4 créditos. No es un proyecto: es una herramienta pequeña que te hace falta hoy.",
    url: "/crear-una-app",
    type: "article",
  },
};

export default function CrearUnaAppPage() {
  return <CrearUnaAppContenido />;
}
