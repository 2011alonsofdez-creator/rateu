"use client";

import { useUi } from "@/lib/i18n";

export function Section({
  icon: Icon,
  title,
  lead,
  soon = true,
  children,
}: {
  icon: (p: { className?: string }) => React.ReactElement;
  title: string;
  lead: string;
  soon?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useUi();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-violet">
          <Icon className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">{title}</h1>
        {soon && (
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11.5px] font-medium text-gold">
            {t("app.soon")}
          </span>
        )}
      </div>

      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{lead}</p>

      <div className="mt-8">{children}</div>
    </div>
  );
}
