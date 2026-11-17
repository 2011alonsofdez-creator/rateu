/* EL PULPO DE KAIRO, EN PÍXELES Y EN MOVIMIENTO.
 *
 * Es una tira de 24 fotogramas de 32×32 (public/pulpo/*.png) que se va
 * pasando con CSS: flota, mueve los tentáculos y parpadea; el de
 * "saluda" además levanta un tentáculo. Sin JavaScript y sin librerías:
 * una imagen de 5 KB.
 *
 * `image-rendering: pixelated` es lo que lo deja nítido al agrandarlo
 * (sin eso, el navegador lo suaviza y se ve borroso). Quien tenga puesto
 * "reducir movimiento" en su sistema lo ve quieto. */

/* v1: "quieto" y "saluda". v2 (con boca y caras): "v2-contento",
   "v2-saluda", "v2-pensando", "v2-triste", "v2-sorprendido". */
export type PosePulpo =
  | "quieto"
  | "saluda"
  | "v2-contento"
  | "v2-saluda"
  | "v2-pensando"
  | "v2-triste"
  | "v2-sorprendido"
  | "v3-contento"
  | "v3-saluda"
  | "v3-pensando"
  | "v3-triste"
  | "v3-sorprendido";

const archivo = (pose: PosePulpo) =>
  /^v[23]-/.test(pose) ? `pulpo${pose[1]}-${pose.slice(3)}.png` : `pulpo-${pose}.png`;

type Props = {
  pose?: PosePulpo;
  /** Tamaño en píxeles de pantalla (múltiplo de 32 para que quede nítido). */
  tam?: number;
  className?: string;
};

export function PulpoPixel({ pose = "quieto", tam = 64, className = "" }: Props) {
  return (
    <span
      role="img"
      aria-label="Pulpo de Kairo"
      className={`pulpo-pixel inline-block shrink-0 ${className}`}
      style={{
        width: tam,
        height: tam,
        backgroundImage: `url(/pulpo/${archivo(pose)})`,
        backgroundSize: `${tam * 24}px ${tam}px`,
        // La animación necesita saber cuánto mide la tira a este tamaño.
        ["--pulpo-ancho" as string]: `-${tam * 24}px`,
      }}
    />
  );
}
