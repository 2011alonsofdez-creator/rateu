"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { user } from "./mock";

/* Estado compartido de créditos, para que el contador de la barra
   lateral y el del chat no se contradigan. En el Paso 2 esto pasa a
   leerse de Supabase y a descontarse en el servidor. */

type Credits = {
  credits: number;
  total: number;
  spend: (n: number) => boolean;
};

const Ctx = createContext<Credits | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState(user.credits);

  const value = useMemo<Credits>(
    () => ({
      credits,
      total: user.creditsTotal,
      spend: (n) => {
        if (n > credits) return false;
        setCredits((c) => c - n);
        return true;
      },
    }),
    [credits],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCredits() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCredits debe usarse dentro de <CreditsProvider>");
  return ctx;
}
