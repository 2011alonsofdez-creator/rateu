"use client";

import { Suspense, useState } from "react";
import { useUi } from "@/lib/i18n";
import { CreditsProvider } from "@/lib/credits";
import { PerfilProvider } from "@/lib/perfil-cliente";
import { HistorialProvider } from "@/lib/historial";
import type { Perfil } from "@/lib/planes";
import type { Conversacion } from "@/lib/tipos";
import { gastarCreditos } from "@/app/(app)/actions";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";
import { Menu } from "@/components/Icons";

export function AppShell({
  perfil,
  conversaciones,
  children,
}: {
  perfil: Perfil;
  conversaciones: Conversacion[];
  children: React.ReactNode;
}) {
  const { t } = useUi();
  const [open, setOpen] = useState(false);

  return (
    <PerfilProvider perfil={perfil}>
      <HistorialProvider conversaciones={conversaciones}>
      <CreditsProvider
        creditos={perfil.creditos}
        creditosExtra={perfil.creditosExtra}
        plan={perfil.plan}
        demo={perfil.demo}
        gastar={perfil.demo ? undefined : gastarCreditos}
      >
        <div className="flex h-dvh overflow-hidden bg-bg">
          {/* Barra lateral fija en escritorio */}
          <aside className="hidden lg:block">
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
          </aside>

          {/* Barra lateral deslizante en móvil */}
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                className="absolute inset-0 bg-black/60"
                onClick={() => setOpen(false)}
                aria-label={t("menu.close")}
              />
              <div className="absolute inset-y-0 left-0">
                <Suspense fallback={null}>
                  <Sidebar onClose={() => setOpen(false)} />
                </Suspense>
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Cabecera solo de móvil */}
            <div className="flex items-center gap-3 border-b border-line px-3 py-2.5 lg:hidden">
              <button
                onClick={() => setOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted"
                aria-label={t("menu.open")}
              >
                <Menu className="h-5 w-5" />
              </button>
              <Logo />
            </div>

            <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </CreditsProvider>
      </HistorialProvider>
    </PerfilProvider>
  );
}
