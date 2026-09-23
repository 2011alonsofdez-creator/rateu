/* La marca de Kairo: tres círculos que se cruzan.
   Cada uno es un modelo (Claude, Gemini, GPT) y el punto del centro
   es donde se solapan: una sola IA. */

export function Marca({
  className = "h-7 w-7",
  solida = false,
}: {
  className?: string;
  /** true = un solo color (para fondos de color). false = degradado de marca. */
  solida?: boolean;
}) {
  const color = solida ? "currentColor" : "url(#kairoGrad)";

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
      {!solida && (
        <defs>
          <linearGradient id="kairoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--acento)" />
            <stop offset="100%" stopColor="var(--acento-2)" />
          </linearGradient>
        </defs>
      )}
      <g stroke={color} strokeWidth="7.5" fill="none">
        <circle cx="50" cy="36" r="23" />
        <circle cx="36" cy="60" r="23" />
        <circle cx="64" cy="60" r="23" />
      </g>
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
