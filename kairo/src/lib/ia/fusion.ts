import type { Level } from "@/lib/mock";

/* FUSIÓN POR MODOS, CON INTERRUPTOR.
 *
 * MEGA ya pregunta a los tres mejores y junta las respuestas. La idea
 * (25-11) es que la fusión sea lo que distingue a Kairo en TODOS los
 * modos, cada uno con su tamaño de equipo:
 *
 *   Rápido   → 1 modelo siempre (tiene que ser instantáneo).
 *   Normal   → 2 modelos: contestan los dos y uno junta lo mejor.
 *   Forja    → 3 modelos, pensando a fondo.
 *   MEGA     → lo de siempre: los 3 mejores.
 *
 * Cada fusión gasta 3-4 veces la cuota de una respuesta normal, así que
 * va APAGADA hasta que haya cuota de pago. Se enciende sin tocar código,
 * en Vercel:
 *
 *   KAIRO_FUSION         = normal:2,forja:3
 *   KAIRO_FUSION_PLANES  = plus,supreme        (por defecto, solo de pago)
 *
 * Con "free" en KAIRO_FUSION_PLANES, el plan gratis también fusiona en
 * Normal. Sin KAIRO_FUSION, todo funciona como hasta ahora. */

/** Cuántos modelos fusionar en este nivel y plan. 0 o 1 = sin fusión. */
export function tamanoFusion(nivel: Level, plan: string | null | undefined): number {
  if (nivel === "mega" || nivel === "fast") return 0;
  const conf = (process.env.KAIRO_FUSION ?? "").trim();
  if (!conf) return 0;

  const planes = (process.env.KAIRO_FUSION_PLANES ?? "plus,supreme")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (!planes.includes((plan ?? "free").toLowerCase())) return 0;

  for (const parte of conf.split(",")) {
    const [n, cuantos] = parte.split(":").map((x) => x.trim().toLowerCase());
    if (n === nivel) {
      const k = Number(cuantos);
      return Number.isFinite(k) ? Math.max(0, Math.min(3, Math.floor(k))) : 0;
    }
  }
  return 0;
}
