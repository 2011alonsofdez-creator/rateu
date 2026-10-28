import { Bolt, Capas, Martillo, Renglones, Varita } from "./Icons";
import type { Level } from "@/lib/mock";

/* QUÉ DIBUJO LE TOCA A CADA NIVEL.
 *
 * En un solo sitio porque lo usan tres pantallas —el selector, la
 * espera y la portada— y un nivel que se dibuja distinto según dónde
 * mires deja de ser reconocible, que es justo para lo que está el
 * dibujo.
 *
 * "auto" no es un nivel de verdad (no está en `Level`): es dejar que
 * elija Kairo. Por eso va aparte y por eso lleva varita.
 */
const DIBUJOS = {
  auto: Varita,
  fast: Bolt,
  normal: Renglones,
  forja: Martillo,
  mega: Capas,
} as const;

export function IconoNivel({
  nivel,
  className,
  style,
}: {
  nivel: Level | "auto";
  className?: string;
  style?: React.CSSProperties;
}) {
  const Dibujo = DIBUJOS[nivel];
  return <Dibujo className={className} style={style} />;
}
