"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Perfil } from "./planes";

/* El perfil cargado en el servidor, disponible para los componentes
   de navegador sin tener que volver a pedirlo. */

const Ctx = createContext<Perfil | null>(null);

export function PerfilProvider({
  perfil,
  children,
}: {
  perfil: Perfil;
  children: ReactNode;
}) {
  return <Ctx.Provider value={perfil}>{children}</Ctx.Provider>;
}

export function usePerfil() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePerfil debe usarse dentro de <PerfilProvider>");
  return ctx;
}
