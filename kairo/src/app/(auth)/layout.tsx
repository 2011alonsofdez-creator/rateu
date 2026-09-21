"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangToggle, ThemeToggle } from "@/components/Toggles";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow relative flex min-h-dvh flex-col">
      <header className="relative z-10 flex items-center justify-between px-4 py-5">
        <Link href="/" aria-label="Kairo">
          <Logo />
        </Link>
        <div className="flex gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
