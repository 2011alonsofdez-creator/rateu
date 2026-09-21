"use client";

import { useUi } from "@/lib/i18n";
import { Globe, Moon, Sun } from "./Icons";

const btn =
  "grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-line-hi hover:text-fg";

export function ThemeToggle() {
  const { theme, toggleTheme, t } = useUi();
  return (
    <button className={btn} onClick={toggleTheme} title={t("theme.toggle")} aria-label={t("theme.toggle")}>
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function LangToggle() {
  const { lang, toggleLang, t } = useUi();
  return (
    <button
      className={`${btn} w-auto gap-1.5 px-2.5 text-[13px] font-medium`}
      onClick={toggleLang}
      title={t("lang.toggle")}
      aria-label={t("lang.toggle")}
    >
      <Globe className="h-[18px] w-[18px]" />
      {lang.toUpperCase()}
    </button>
  );
}
