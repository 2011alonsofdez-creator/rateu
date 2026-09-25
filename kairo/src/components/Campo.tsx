"use client";

import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { Ojo, OjoTachado } from "./Icons";

/* Campo de formulario reutilizable: etiqueta, control y ayuda opcional.
 *
 * Si el campo es de contraseña se le pone solo el botón de ver/ocultar.
 * Va aquí y no en cada formulario a propósito: así lo tienen todos los
 * que haya y los que vengan, sin que nadie tenga que acordarse. */
export function Campo({
  id,
  label,
  ayuda,
  ...props
}: {
  id: string;
  label: string;
  ayuda?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useUi();
  const [visible, setVisible] = useState(false);

  const esContrasena = props.type === "password";
  // Empieza siempre oculta. Verla es algo que decides tú cada vez.
  const tipo = esContrasena && visible ? "text" : props.type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13.5px] font-medium">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          {...props}
          type={tipo}
          className={`w-full rounded-xl border border-line bg-bg-soft py-2.5 pl-3.5 text-[15px] outline-none transition placeholder:text-faint focus:border-line-hi ${
            esContrasena ? "pr-12" : "pr-3.5"
          }`}
        />

        {esContrasena && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            title={visible ? t("auth.hidePass") : t("auth.showPass")}
            aria-label={visible ? t("auth.hidePass") : t("auth.showPass")}
            // tabIndex -1: al tabular desde el correo quieres ir a Entrar,
            // no pararte en un botón que no vas a usar casi nunca.
            tabIndex={-1}
            className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-faint transition hover:bg-panel hover:text-fg"
          >
            {visible ? <OjoTachado className="h-[18px] w-[18px]" /> : <Ojo className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>

      {ayuda && <p className="mt-1.5 text-[12.5px] text-faint">{ayuda}</p>}
    </div>
  );
}

export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-red/30 bg-red/10 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-red">
      {children}
    </p>
  );
}

export function BotonPrincipal({
  cargando,
  children,
  ...props
}: { cargando?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={cargando || props.disabled}
      className="brand-grad w-full rounded-xl px-4 py-2.5 text-[14.5px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
