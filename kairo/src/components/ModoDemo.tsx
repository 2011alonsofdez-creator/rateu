"use client";

import Link from "next/link";
import { useUi } from "@/lib/i18n";

/* Lo que se ve en las pantallas de acceso cuando Supabase todavía no
   está configurado. Mejor decirlo claro que dejar un formulario que
   falla sin explicar por qué. */
export function ModoDemo() {
  const { t } = useUi();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gold/30 bg-gold/10 p-4">
        <p className="text-[14px] font-medium text-gold">{t("auth.demoTitle")}</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{t("auth.demoSub")}</p>
      </div>

      <Link
        href="/chat"
        className="brand-grad block rounded-xl px-4 py-2.5 text-center text-[14.5px] font-semibold text-on-accent transition hover:opacity-90"
      >
        {t("auth.demoCta")}
      </Link>

      <p className="text-center text-[12.5px] text-faint">
        supabase/README.md
      </p>
    </div>
  );
}
