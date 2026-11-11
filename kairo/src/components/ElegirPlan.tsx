"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { miles } from "@/lib/formato";
import { plans } from "@/lib/mock";
import { CREDITOS_NIVEL, CREDITOS_PLAN } from "@/lib/planes";
import { HAY_TIENDA, comprar } from "@/lib/pagos/publico";
import { Check } from "./Icons";

/* ELEGIR PLAN ARRASTRANDO, EN VEZ DE COMPARANDO TRES TARJETAS.
 *
 * Las tres tarjetas de siempre siguen debajo, y hacen falta: son las
 * que dicen qué incluye cada plan. Pero no contestan la pregunta con
 * la que llega la gente, que no es "¿qué incluye Supreme?" sino
 * "¿cuál me hace falta A MÍ?". Eso se contesta mejor moviendo una
 * bolita que leyendo tres columnas.
 */

/* EL PLAN GRATIS SE CUENTA POR DÍAS, Y NO HAY QUE DISIMULARLO.
 *
 * Aquí ponía los 40 del plan gratis multiplicados por 30, y el
 * deslizador anunciaba "1.200 créditos al mes". La cuenta es correcta y
 * la frase es mentira: esos 40 NO se acumulan. Quien llega el día 1 no
 * tiene 1.200 para el fin de semana, tiene 40 hoy y 40 mañana.
 *
 * Lo hice para que los tres tramos se pudieran comparar en la misma
 * unidad, que es una razón de diseño. Pero una unidad cómoda que
 * promete el triple de lo que das no es un apaño, es una reclamación el
 * primer día. Así que cada plan se enseña en SU unidad —el gratis por
 * día, los de pago por mes— aunque comparar cueste un segundo más.
 */

type Parada = {
  id: "free" | "plus" | "supreme";
  creditos: number;
  precio: number;
  pos: number;
  /** true = la cifra es por día, no por mes. */
  diario?: boolean;
};

/* EL CARRIL NO VA EN CRÉDITOS, VA EN SITIOS.
 *
 * Proporcional a los créditos, Kairo+ (2.000 de 6.000) caería a un
 * tercio del carril y los otros dos tercios serían todo Supreme: el
 * plan del medio parecería un pellizco al lado del grande. Así que el
 * carril se parte en dos tramos iguales —de Free a Kairo+ y de Kairo+
 * a Supreme— y cada plan cae donde se le espera: al principio, en
 * medio y al final.
 *
 * Los números siguen siendo los de verdad. Lo único que se reparte a
 * conveniencia es cuánto carril ocupa cada tramo.
 */
const PARADAS: Parada[] = [
  { id: "free", creditos: CREDITOS_PLAN.free, precio: 0, pos: 0, diario: true },
  { id: "plus", creditos: CREDITOS_PLAN.plus, precio: plans.find((p) => p.id === "plus")!.monthly, pos: 50 },
  { id: "supreme", creditos: CREDITOS_PLAN.supreme, precio: plans.find((p) => p.id === "supreme")!.monthly, pos: 100 },
];

const NOMBRE = { free: "Free", plus: "Kairo+", supreme: "Supreme" } as const;
const TINTA = { free: "var(--faint)", plus: "var(--acento-2)", supreme: "var(--acento)" } as const;

export function ElegirPlan() {
  const { t, lang } = useUi();
  /* TRES SITIOS, NO CIEN.
   *
   * El carril iba de 0 a 100 y la bolita paraba donde la soltaras, así
   * que se podía quedar en 1.960 créditos: un número que no se puede
   * comprar, pegado al nombre de un plan que no es el que te cobran. Un
   * selector de planes no tiene estados intermedios porque el producto
   * tampoco los tiene.
   *
   * Ahora el carril tiene tres paradas y ya está: la arrastras y se va
   * entera a la siguiente, hacia donde la lleves. Y de paso las flechas
   * del teclado funcionan solas, que antes movían de uno en uno y hacían
   * falta cincuenta pulsaciones para cambiar de plan. */
  const [i, ponI] = useState(1);

  const plan = PARADAS[i];
  const creditos = plan.creditos;
  /* La lista es la misma que la de /precios: sale de `plans`, no copiada
     aquí. Dos listas de lo que incluye un plan acaban diciendo cosas
     distintas el día que se cambia una. */
  const incluye = plans
    .find((p) => p.id === plan.id)!
    .bullets[lang === "es" ? "es" : "en"]
    /* Fuera la línea de los créditos: el número ya está ahí arriba en
       grande, y repetido en letra pequeña tres centímetros más abajo no
       informa dos veces, hace dudar de si son dos cosas distintas. */
    .filter((b) => !/cr[ée]dit/i.test(b));
  const color = TINTA[plan.id];
  const euros = (n: number) =>
    n === 0 ? "0 €" : `${n.toFixed(2).replace(".", lang === "es" ? "," : ".")} €`;

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-line bg-bg px-6 py-10 text-center sm:px-12">
      {/* El ascua de detrás, la misma de la portada. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/5 right-1/5 h-80 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse, color-mix(in oklab, var(--acento) 16%, transparent), transparent 70%)",
        }}
      />

      <h3 className="text-[22px] font-bold tracking-tight sm:text-[26px]">{t("slider.title")}</h3>

      <p className="mt-8 text-[42px] font-extrabold leading-none tracking-tight sm:text-[48px]">
        {/* La `key` hace que React lo pinte de nuevo al cambiar de plan,
            y al pintarse de nuevo la animación vuelve a empezar: el
            número salta en vez de cambiar de golpe, que es lo que hace
            que se note que se ha movido algo. */}
        <span key={i} className="salta">
          {miles(creditos, lang)}
        </span>
        <span className="ml-2 text-[17px] font-medium tracking-normal text-muted">
          {t(plan.diario ? "slider.creditsDay" : "slider.credits")}
        </span>
      </p>

      <div className="relative mt-7 h-8">
        <input
          type="range"
          min={0}
          max={PARADAS.length - 1}
          step={1}
          value={i}
          onChange={(e) => ponI(+e.target.value)}
          aria-label={t("slider.title")}
          aria-valuetext={`${NOMBRE[plan.id]} · ${creditos}`}
          className="carril-plan"
          style={
            {
              "--pista": `linear-gradient(90deg, ${color} ${plan.pos}%, var(--line) ${plan.pos}%)`,
            } as React.CSSProperties
          }
        />
      </div>

      {/* Las paradas son paradas de verdad: se pulsan y la bolita va allí. */}
      <div className="relative h-14">
        {PARADAS.map((p, n) => (
          <button
            key={p.id}
            onClick={() => ponI(n)}
            className="absolute -translate-x-1/2 px-2 pt-2 text-center"
            style={{ left: `${p.pos === 0 ? 3 : p.pos === 100 ? 97 : p.pos}%` }}
          >
            <span
              aria-hidden
              className="absolute -top-5 left-1/2 h-3 w-px -translate-x-1/2 bg-line-hi"
            />
            <span
              className="block text-[13px] font-bold transition"
              style={{ color: TINTA[p.id], textShadow: plan.id === p.id ? `0 0 22px ${TINTA[p.id]}` : "none" }}
            >
              {NOMBRE[p.id]}
            </span>
            <span className="block text-[11px] text-faint">{euros(p.precio)}</span>
          </button>
        ))}
      </div>

      {/* EN GRATIS NO SE CUENTAN CONSEJOS, PORQUE NO LOS HAY.
 
          Decía "5 consejos de las 3 IAs" dividiendo créditos entre lo
          que cuesta un MEGA, y la cuenta salía bien pero la frase era
          mentira: el plan gratis solo tiene Rápido y Estándar (ver
          `NIVELES_POR_PLAN`), así que esos cinco consejos no se pueden
          pedir. Encima lo desmentía el aviso de dos líneas más abajo.
 
          Así que en gratis el segundo contador cuenta otra cosa que sí
          puede hacer, y los consejos aparecen cuando de verdad entran
          en el plan. */}
      <div className="flex flex-wrap justify-center gap-3">
        {[
          {
            n: Math.round(creditos / CREDITOS_NIVEL.normal),
            k: plan.diario ? ("slider.questionsDay" as const) : ("slider.questions" as const),
          },
          plan.diario
            ? { n: Math.round(creditos / CREDITOS_NIVEL.fast), k: "slider.fastDay" as const }
            : { n: Math.floor(creditos / CREDITOS_NIVEL.mega), k: "slider.councils" as const },
        ].map((c) => (
          <div key={c.k} className="min-w-[168px] rounded-2xl border border-line bg-panel px-5 py-3.5">
            <span className="block text-[24px] font-extrabold tracking-tight">
              {miles(c.n, lang)}
            </span>
            <span className="block text-[12px] text-faint">{t(c.k)}</span>
          </div>
        ))}
      </div>

      {/* LO QUE INCLUYE, AQUÍ DENTRO.
 
          Estaba en las tarjetas de debajo, y las tarjetas se fueron
          porque eran un segundo selector de plan en la misma pantalla.
          Pero lo que se llevaron con ellas no era un selector: era la
          única respuesta a "¿y qué me llevo por eso?". Un precio sin esa
          lista al lado es un número suelto.
 
          Va dentro del mismo panel y cambia con la bolita, así que al
          arrastrar no cambia solo el número: cambia lo que te llevas.
          Que es justo lo que se está decidiendo. */}
      <ul className="mx-auto mt-7 grid max-w-md gap-2 text-left sm:grid-cols-2">
        {incluye.map((linea) => (
          <li key={linea} className="flex items-start gap-2 text-[13.5px] leading-snug text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" />
            <span>{linea}</span>
          </li>
        ))}
      </ul>

      <p className="mt-7 text-[34px] font-extrabold tracking-tight sm:text-[38px]">
        {plan.precio === 0 ? (
          <>
            <span style={{ color }}>Free</span>
            <span className="ml-2 text-[15px] font-medium text-faint">· {t("slider.freePrice")}</span>
          </>
        ) : (
          <>
            {euros(plan.precio)}
            <span className="ml-2 text-[15px] font-medium text-faint">
              {t("slider.perMonth").replace("{p}", NOMBRE[plan.id])}
            </span>
          </>
        )}
      </p>

      <Link
        href={HAY_TIENDA && plan.id !== "free" ? comprar(plan.id) : "/chat"}
        className="brand-grad mt-6 inline-block rounded-xl px-9 py-3.5 text-[15.5px] font-bold text-on-accent transition hover:opacity-90"
      >
        {plan.id === "free"
          ? t("slider.start")
          : t("slider.choose").replace("{p}", NOMBRE[plan.id])}
      </Link>

      {/* LO QUE EL NÚMERO NO DICE.
 
          Sin esta línea, alguien arrastra hasta mil y pico, lee
          "gratis" y se registra pensando que los tiene de golpe para el
          sábado. Y se encuentra con cuarenta. Mejor decirlo aquí que
          tenerlo cabreado el primer día. */}
      <p className="mt-4 min-h-[18px] text-[12px] leading-relaxed text-faint">
        {plan.precio === 0
          ? t("slider.freeNote").replace("{n}", String(CREDITOS_PLAN.free))
          : ""}
      </p>
    </div>
  );
}
