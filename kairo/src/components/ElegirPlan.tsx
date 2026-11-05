"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { miles } from "@/lib/formato";
import { plans } from "@/lib/mock";
import { CREDITOS_NIVEL, CREDITOS_PLAN } from "@/lib/planes";
import { HAY_TIENDA, comprar } from "@/lib/pagos/publico";

/* ELEGIR PLAN ARRASTRANDO, EN VEZ DE COMPARANDO TRES TARJETAS.
 *
 * Las tres tarjetas de siempre siguen debajo, y hacen falta: son las
 * que dicen qué incluye cada plan. Pero no contestan la pregunta con
 * la que llega la gente, que no es "¿qué incluye Supreme?" sino
 * "¿cuál me hace falta A MÍ?". Eso se contesta mejor moviendo una
 * bolita que leyendo tres columnas.
 */

/** Un mes de días, para pasar el tope diario del plan gratis a meses. */
const DIAS = 30;

type Parada = { id: "free" | "plus" | "supreme"; creditos: number; precio: number; pos: number };

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
  { id: "free", creditos: CREDITOS_PLAN.free * DIAS, precio: 0, pos: 0 },
  { id: "plus", creditos: CREDITOS_PLAN.plus, precio: plans.find((p) => p.id === "plus")!.monthly, pos: 50 },
  { id: "supreme", creditos: CREDITOS_PLAN.supreme, precio: plans.find((p) => p.id === "supreme")!.monthly, pos: 100 },
];

const NOMBRE = { free: "Free", plus: "Kairo+", supreme: "Supreme" } as const;
const TINTA = { free: "var(--faint)", plus: "var(--acento-2)", supreme: "var(--acento)" } as const;

function creditosEn(pos: number): number {
  const [libre, mas, supremo] = PARADAS;
  const crudo =
    pos <= 50
      ? libre.creditos + (mas.creditos - libre.creditos) * (pos / 50)
      : mas.creditos + (supremo.creditos - mas.creditos) * ((pos - 50) / 50);
  // Redondeado a la decena: un 1.987 en pantalla parece un error de cuentas.
  return Math.round(crudo / 20) * 20;
}

const paradaDe = (creditos: number) => PARADAS.find((p) => creditos <= p.creditos) ?? PARADAS[2];

export function ElegirPlan() {
  const { t, lang } = useUi();
  const [pos, setPos] = useState(50);

  const creditos = creditosEn(pos);
  const plan = paradaDe(creditos);
  const color = TINTA[plan.id];
  const euros = (n: number) =>
    n === 0 ? "0 €" : `${n.toFixed(2).replace(".", lang === "es" ? "," : ".")} €`;

  /* Al soltar cerca de una parada, se pega. Sin esto nadie acierta el
     50 exacto: te quedas en 1.960 créditos leyendo "Kairo+" y parece
     que la cuenta no cuadra. */
  const pegar = () => {
    const cerca = PARADAS.find((p) => Math.abs(p.pos - pos) <= 4);
    if (cerca) setPos(cerca.pos);
  };

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
      <p className="mt-2 text-[14px] text-faint">{t("slider.sub")}</p>

      <p className="mt-8 text-[42px] font-extrabold leading-none tracking-tight sm:text-[48px]">
        {miles(creditos, lang)}
        <span className="ml-2 text-[17px] font-medium tracking-normal text-muted">
          {t("slider.credits")}
        </span>
      </p>

      <div className="relative mt-7 h-8">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          onChange={(e) => setPos(+e.target.value)}
          onMouseUp={pegar}
          onTouchEnd={pegar}
          onKeyUp={pegar}
          aria-label={t("slider.title")}
          aria-valuetext={`${creditos} · ${NOMBRE[plan.id]}`}
          className="carril-plan"
          style={
            {
              "--pista": `linear-gradient(90deg, ${color} ${pos}%, var(--line) ${pos}%)`,
            } as React.CSSProperties
          }
        />
      </div>

      {/* Las paradas son paradas de verdad: se pulsan y la bolita va allí. */}
      <div className="relative h-14">
        {PARADAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPos(p.pos)}
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

      <div className="flex flex-wrap justify-center gap-3">
        {[
          { n: Math.round(creditos / CREDITOS_NIVEL.normal), k: "slider.questions" as const },
          { n: Math.floor(creditos / CREDITOS_NIVEL.mega), k: "slider.councils" as const },
        ].map((c) => (
          <div key={c.k} className="min-w-[168px] rounded-2xl border border-line bg-panel px-5 py-3.5">
            <span className="block text-[24px] font-extrabold tracking-tight">
              {miles(c.n, lang)}
            </span>
            <span className="block text-[12px] text-faint">{t(c.k)}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[34px] font-extrabold tracking-tight sm:text-[38px]">
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
