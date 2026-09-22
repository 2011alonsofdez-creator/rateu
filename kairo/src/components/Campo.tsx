"use client";

/* Campo de formulario reutilizable: etiqueta, control y ayuda opcional. */
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
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13.5px] font-medium">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-xl border border-line bg-bg-soft px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-faint focus:border-line-hi"
      />
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
