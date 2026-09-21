import { Sparkle } from "./Icons";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="brand-grad grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-on-accent">
        <Sparkle className="h-4 w-4" />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-tight">Kairo</span>
      )}
    </span>
  );
}
