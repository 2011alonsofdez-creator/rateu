import type { Metadata } from "next";
import { SinSuscripcionContenido } from "./contenido";
import { CREDITOS_PLAN } from "@/lib/planes";

/* Quinta página de intención. Responde a "asistente de IA en español sin
 * suscripción", que es la intención número 6 de la tabla del 17-10 y la
 * única que `/precios` contestaba a medias: esa página explica los
 * planes, pero la pregunta de la gente no es "qué planes hay", es "¿me
 * vas a cobrar todos los meses?".
 *
 * Las cifras NO están escritas a mano: salen de `lib/mock.ts`, que es de
 * donde las saca la página de precios (`plans` y `creditPacks`), y los
 * créditos del plan gratuito de `CREDITOS_PLAN`. Si mañana cambia un
 * precio, cambia aquí también sin que nadie tenga que acordarse.
 *
 * **Y el 30-10 esto se quedó a medias y se vio en un día**: la página se
 * publicó el 28-10 diciendo justo esta frase, y los créditos del día
 * estaban escritos a mano —aquí en los metadatos y en un
 * `GRATIS_AL_DIA = 15` en `contenido.tsx`—. El dueño subió el plan
 * gratis a 20 el 29 y esta página siguió diciendo 15, incluido lo que
 * ve Google. Ahora los tres sitios leen `CREDITOS_PLAN.free`. Es la misma regla que sigue el bloque de precios del
 * prompt maestro, y existe porque un número copiado a mano envejece sin
 * que nadie se entere.
 *
 * Y dos cosas que esta página NO dice, a propósito:
 *   1. NO dice que Kairo sea la única que vende créditos sin
 *      suscripción. No lo es: LexScan vende 5 análisis gratis y luego 9 $
 *      por 50 (informe del 23-10), y GovEasy tiene plan gratuito y
 *      trámites sueltos desde 2,99 € (23-10). Lo que Kairo tiene no es
 *      novedad, es amplitud por el mismo dinero.
 *   2. NO promete que se pueda comprar hoy. Los botones de compra
 *      dependen de `NEXT_PUBLIC_TIENDA` (`lib/pagos/publico.ts:7`) y
 *      desde la sede no se puede comprobar si están encendidos, así que
 *      la página manda a `/precios` a ver lo que cuesta cada cosa en vez
 *      de decir "cómpralo ahora". */
export const metadata: Metadata = {
  title: "Una IA en español sin suscripción — Kairo se paga por uso",
  description: `Kairo te da ${CREDITOS_PLAN.free} créditos cada día sin pagar nada y sin tarjeta. Si un mes necesitas más, compras un paquete que no caduca en vez de una cuota mensual. Sin suscripción obligatoria.`,
  alternates: { canonical: "/sin-suscripcion" },
  openGraph: {
    title: "Una IA en español sin suscripción",
    description: `${CREDITOS_PLAN.free} créditos al día gratis, y paquetes que no caducan si necesitas más. Sin cuota mensual obligatoria.`,
    url: "/sin-suscripcion",
    type: "article",
  },
};

export default function SinSuscripcionPage() {
  return <SinSuscripcionContenido />;
}
