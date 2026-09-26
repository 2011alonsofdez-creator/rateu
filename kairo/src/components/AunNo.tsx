"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { Close } from "./Icons";

/* El botón que todavía no hace lo que promete.
 *
 * Media app está en pie y media está por levantar, y en medio quedan
 * botones que se pulsan y no pasa nada. Eso es lo peor de las dos
 * opciones: parece roto y encima no explica nada.
 *
 * Aquí se pulsan y contestan: qué van a hacer cuando estén, y qué se
 * puede hacer hoy en su lugar. No se disimula que falta —lo dice la
 * etiqueta "Pronto"— pero tampoco se deja al usuario dando clics
 * contra una pared.
 */
export function BotonAunNo({
  children,
  className,
  titulo,
  explica,
  mientras,
  enlace,
  enlaceTexto,
}: {
  children: React.ReactNode;
  className?: string;
  /** Qué es esto que todavía no está. */
  titulo: string;
  /** Qué hará cuando esté. Sin promesas de fecha. */
  explica: string;
  /** Qué se puede hacer hoy en su lugar. */
  mientras?: string;
  enlace?: string;
  enlaceTexto?: string;
}) {
  const { t } = useUi();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button onClick={() => setAbierto(true)} className={className}>
        {children}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setAbierto(false)}
            aria-label={t("menu.close")}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-[var(--shadow)]"
          >
            <button
              onClick={() => setAbierto(false)}
              aria-label={t("menu.close")}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-faint transition hover:bg-panel-hi hover:text-fg"
            >
              <Close className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center rounded-full border border-acento/40 bg-acento/10 px-2 py-0.5 text-[11.5px] font-medium text-acento">
              {t("app.soon")}
            </span>
            <h2 className="mt-3 text-[17px] font-semibold">{titulo}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{explica}</p>
            {mientras && (
              <p className="mt-3 rounded-xl border border-line bg-bg-soft p-3 text-[13px] leading-relaxed text-muted">
                {mientras}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl px-3 py-2 text-[13.5px] text-faint transition hover:text-fg"
              >
                {t("app.later")}
              </button>
              {enlace && enlaceTexto && (
                <Link
                  href={enlace}
                  className="rounded-xl bg-acento px-3.5 py-2 text-[13.5px] font-medium text-on-accent transition hover:opacity-90"
                >
                  {enlaceTexto}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** La etiqueta suelta, para las tarjetas que aún no llevan botón. */
export function Pronto() {
  const { t } = useUi();
  return (
    <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-faint">
      {t("app.soon")}
    </span>
  );
}
