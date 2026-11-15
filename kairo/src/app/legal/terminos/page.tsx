import type { Metadata } from "next";
import { TerminosContenido } from "./contenido";

/* EL TERCERO DE LOS CUATRO DOCUMENTOS LEGALES.
 *
 * Cookies el 04-11, privacidad el 13-11, y estos hoy. Queda el aviso legal,
 * que sigue bloqueado por los cinco campos del titular porque casi no es otra
 * cosa que esos campos.
 *
 * POR QUÉ ESTOS SE PUEDEN ESCRIBIR HOY Y EL AVISO LEGAL NO: unos términos de
 * uso son, sobre todo, **qué hace el servicio, qué puedes hacer tú con él y
 * qué no promete**. Eso está en el código y se puede leer. Lo único que
 * depende del titular es la ley y el fuero aplicables, y eso va en su propio
 * apartado diciendo que falta, igual que en los otros dos documentos.
 *
 * DE DÓNDE SALE CADA AFIRMACIÓN, para que se pueda volver a comprobar sin
 * fiarse de quien lo redactó:
 *
 *   - Edad mínima 13 años, y se comprueba en el registro:
 *     `app/(auth)/registro/page.tsx:57` y la clave `auth.errTooYoung`, que
 *     además explica que los perfiles supervisados están en camino.
 *   - Los créditos de los packs no caducan: es lo que publica la propia
 *     página de precios (`pricing.creditsSub`).
 *   - Lo que se gasta cada nivel y lo que trae cada plan: `CREDITOS_NIVEL` y
 *     `CREDITOS_PLAN` en `lib/planes.ts`. No se escriben a mano aquí: se
 *     interpolan, que es la regla que puso el verificador de cifras.
 *   - Los topes de Co-Works y Mentes por plan: `COWORKS_POR_PLAN` y
 *     `MENTES_POR_PLAN`, cuya autoridad es la migración 0023.
 *   - El cobro lo hace una tienda externa y **Kairo no ve la tarjeta**:
 *     `lib/pagos/publico.ts` solo construye un enlace, `lib/pagos/config.ts`
 *     guarda las direcciones de la tienda en variables de entorno del
 *     servidor, y en todo el repositorio **no hay ni un campo de tarjeta**
 *     (buscado: `cardNumber`, `cvv`, "número de tarjeta": cero).
 *   - Los botones de comprar solo aparecen con la tienda encendida:
 *     `HAY_TIENDA = process.env.NEXT_PUBLIC_TIENDA === "1"`.
 *
 * Y LO QUE ESTE DOCUMENTO NO HACE:
 *
 *   1. No promete disponibilidad. Kairo se apoya hoy en cuotas gratuitas de
 *      terceros, así que un "99,9 %" sería una frase inventada.
 *   2. No promete un botón de borrar la cuenta, porque **no existe**: no hay
 *      ninguna ruta ni componente que borre un perfil. Lo que hay es el
 *      correo de contacto, y el apartado 8 lo dice tal cual en vez de
 *      describir una pantalla que no está.
 *   3. No se inventa el fuero. Vive en `../datos.ts` con los otros cuatro
 *      campos y, mientras esté vacío, el apartado 10 dice qué falta.
 *
 * `robots: index`: unos términos de uso son públicos y que se encuentren es
 * parte de para qué existen. */
export const metadata: Metadata = {
  title: "Términos de uso — Kairo",
  description:
    "Qué hace Kairo y qué no, qué puedes hacer con ella, cómo funcionan los créditos y los planes, qué no se promete y qué pasa si algo falla. Escrito leyendo el código.",
  alternates: { canonical: "/legal/terminos" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Términos de uso de Kairo",
    description:
      "Kairo no es un abogado ni un asesor: te dice qué te piden y para cuándo. Eso, y todo lo demás que conviene saber antes de usarla.",
    url: "/legal/terminos",
    type: "article",
  },
};

export default function TerminosPage() {
  return <TerminosContenido />;
}
