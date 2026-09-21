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
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-[13px] text-faint">{t("footer.tagline")}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
          <Link href="/legal" className="transition hover:text-fg">{t("footer.legal")}</Link>
          <Link href="/legal" className="transition hover:text-fg">{t("footer.privacy")}</Link>
          <Link href="/legal" className="transition hover:text-fg">{t("footer.cookies")}</Link>
          <Link href="/legal" className="transition hover:text-fg">{t("footer.terms")}</Link>
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-[12px] text-faint">
        © {year} Kairo. {t("footer.rights")}
      </div>
    </footer>
  );
}
