/* La marca de Kairo: tres círculos que se cruzan.
   Cada uno es un modelo (Claude, Gemini, GPT) y el punto del centro
   es donde se solapan: una sola IA. */

/* Los tres retardos reparten el ciclo en tres. Son negativos a propósito:
   así los círculos arrancan ya repartidos en vez de encenderse los tres a
   la vez en el primer fotograma. */
const RETARDOS = ["0s", "-0.8s", "-1.6s"];

export function Marca({
  className = "h-7 w-7",
  solida = false,
  animada = false,
}: {
  className?: string;
  /** true = un solo color (para fondos de color). false = degradado de marca. */
  solida?: boolean;
  /** true mientras Kairo está trabajando: los círculos se van encendiendo
   *  por turnos. No es adorno: se ve quién está respondiendo. */
  animada?: boolean;
}) {
  const color = solida ? "currentColor" : "url(#kairoGrad)";

  return (
    <svg
      className={`${className}${animada ? " marca-viva" : ""}`}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
    >
      {!solida && (
        <defs>
          <linearGradient id="kairoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--acento)" />
            <stop offset="100%" stopColor="var(--acento-2)" />
          </linearGradient>
        </defs>
      )}
      <g stroke={color} strokeWidth="7.5" fill="none">
        <circle className="kairo-aro" style={{ animationDelay: RETARDOS[0] }} cx="50" cy="36" r="23" />
        <circle className="kairo-aro" style={{ animationDelay: RETARDOS[1] }} cx="36" cy="60" r="23" />
        <circle className="kairo-aro" style={{ animationDelay: RETARDOS[2] }} cx="64" cy="60" r="23" />
      </g>
      {/* El punto del centro no parpadea: es el ancla, donde los tres se juntan. */}
      <circle cx="50" cy="51" r="7" fill={color} />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Marca className="h-[26px] w-[26px] shrink-0" />
      {!compact && (
        <span className="text-[17px] font-semibold tracking-tight">Kairo</span>
      )}
    </span>
  );
}
