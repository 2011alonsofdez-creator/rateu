"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Conversacion } from "./tipos";

/* El historial que cargó el servidor, disponible para toda la app sin
   volver a pedirlo. Lo usan la barra lateral (para pintarlo) y el chat
   (para saber si eres alguien que vuelve o alguien que empieza). */

const Ctx = createContext<Conversacion[]>([]);

export function HistorialProvider({
  conversaciones,
  children,
}: {
  conversaciones: Conversacion[];
  children: ReactNode;
}) {
  return <Ctx.Provider value={conversaciones}>{children}</Ctx.Provider>;
}

export function useHistorial() {
  return useContext(Ctx);
}
