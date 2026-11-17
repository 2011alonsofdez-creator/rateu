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

type Props = {
  pose?: "quieto" | "saluda";
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
        backgroundImage: `url(/pulpo/pulpo-${pose}.png)`,
        backgroundSize: `${tam * 24}px ${tam}px`,
        // La animación necesita saber cuánto mide la tira a este tamaño.
        ["--pulpo-ancho" as string]: `-${tam * 24}px`,
      }}
    />
  );
}
