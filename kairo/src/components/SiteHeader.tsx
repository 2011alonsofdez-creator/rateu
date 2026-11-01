"use client";

import Link from "next/link";
import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { Logo } from "./Logo";
import { LangToggle, ThemeToggle } from "./Toggles";
import { Close, Menu } from "./Icons";

export function SiteHeader() {
  const { t } = useUi();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link href="/#features" className="text-muted transition hover:text-fg" onClick={() => setOpen(false)}>
        {t("nav.product")}
      </Link>
      <Link href="/precios" className="text-muted transition hover:text-fg" onClick={() => setOpen(false)}>
        {t("nav.pricing")}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Kairo">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-[14px] font-medium md:flex">{links}</nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <LangToggle />
            <ThemeToggle />
          </div>
          <Link
            href="/chat"
            className="hidden rounded-lg px-3 py-2 text-[14px] font-medium text-muted transition hover:text-fg sm:block"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/chat"
            className="brand-grad rounded-lg px-3.5 py-2 text-[14px] font-semibold text-on-accent transition hover:opacity-90"
          >
            {t("nav.start")}
          </Link>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("menu.close") : t("menu.open")}
            aria-expanded={open}
          >
            {open ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-bg px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4 text-[15px] font-medium">
            {links}
            <div className="flex items-center gap-2 pt-1">
              <LangToggle />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useUi();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-[13px] text-faint">{t("footer.tagline")}</p>
        </div>
        {/* DOS COLUMNAS DESDE EL 01-11, Y LA PRIMERA NO EXISTÍA.

            Las cinco páginas de intención llevaban veintiún días en el
            `sitemap.xml` sin un solo enlace desde la web: se llegaba a
            ellas desde Google y desde ningún otro sitio. Cuatro tardes de
            trabajo que no recibían una visita propia.

            Y los cuatro enlaces legales iban los cuatro a `/legal` a
            secas, así que tres de los cuatro mentían sobre a dónde
            llevan. Ahora cada uno cae en su tarjeta, con el `id` que se
            le ha puesto en esa página. */}
        <div className="flex flex-wrap gap-x-10 gap-y-6">
          <nav className="flex flex-col gap-2 text-[13px] text-muted">
            <p className="text-[12px] font-medium text-faint">{t("footer.solves")}</p>
            <Link href="/multas" className="transition hover:text-fg">{t("footer.multas")}</Link>
            <Link href="/cartas-de-hacienda" className="transition hover:text-fg">{t("footer.cartas")}</Link>
            <Link href="/contratos" className="transition hover:text-fg">{t("footer.contratos")}</Link>
            <Link href="/crear-una-app" className="transition hover:text-fg">{t("footer.app")}</Link>
            <Link href="/sin-suscripcion" className="transition hover:text-fg">{t("footer.sinSuscripcion")}</Link>
          </nav>
          <nav className="flex flex-col gap-2 text-[13px] text-muted">
            <p className="text-[12px] font-medium text-faint">{t("footer.legalTitle")}</p>
            <Link href="/legal#aviso" className="transition hover:text-fg">{t("footer.legal")}</Link>
            <Link href="/legal#privacidad" className="transition hover:text-fg">{t("footer.privacy")}</Link>
            <Link href="/legal#cookies" className="transition hover:text-fg">{t("footer.cookies")}</Link>
            <Link href="/legal#terminos" className="transition hover:text-fg">{t("footer.terms")}</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-[12px] text-faint">
        © {year} Kairo. {t("footer.rights")}
      </div>
    </footer>
  );
}
