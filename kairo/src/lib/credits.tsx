"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CREDITOS_PLAN, type PlanId } from "./planes";
import type { ResultadoGasto } from "./tipos";

/* Estado de créditos compartido por la barra lateral y el chat.
   En modo demo descuenta en memoria. Con Supabase, el descuento real
   lo hace la función gastar_creditos en la base de datos, dentro de una
   transacción: aquí solo reflejamos lo que devuelve el servidor. */

type Credits = {
  /** Créditos utilizables ahora mismo: los del plan más los comprados. */
  credits: number;
  /** Los que incluye el plan, para la barra de progreso. */
  total: number;
  gastando: boolean;
  spend: (n: number, motivo?: string) => Promise<boolean>;
};

const Ctx = createContext<Credits | null>(null);

export function CreditsProvider({
  children,
  creditos,
  creditosExtra,
  plan,
  demo,
  gastar,
}: {
  children: ReactNode;
  creditos: number;
  creditosExtra: number;
  plan: PlanId;
  demo: boolean;
  /** Acción de servidor. En demo no se pasa. */
  gastar?: (n: number, motivo: string) => Promise<ResultadoGasto>;
}) {
  const [plan_, setPlan] = useState(creditos);
  const [extra, setExtra] = useState(creditosExtra);
  const [gastando, setGastando] = useState(false);

  const value = useMemo<Credits>(() => {
    const disponibles = plan_ + extra;

    return {
      credits: disponibles,
      total: CREDITOS_PLAN[plan],
      gastando,
      spend: async (n, motivo = "") => {
        // Comprobación optimista para no ir al servidor en vano.
        // La de verdad, la que cuenta, está en la base de datos.
        if (n > disponibles) return false;

        if (demo || !gastar) {
          const delPlan = Math.min(plan_, n);
          setPlan((c) => c - delPlan);
          setExtra((c) => c - (n - delPlan));
          return true;
        }

        setGastando(true);
        try {
          const res = await gastar(n, motivo);
          if (!res.ok) return false;
          setPlan(res.creditos);
          setExtra(res.creditosExtra);
          return true;
        } catch {
          return false;
        } finally {
          setGastando(false);
        }
      },
    };
  }, [plan_, extra, plan, demo, gastar, gastando]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCredits() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCredits debe usarse dentro de <CreditsProvider>");
  return ctx;
}
