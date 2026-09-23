"use client";

import { useEffect, useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import type { Level } from "@/lib/mock";
import { Marca } from "./Logo";

/* Lo que se ve mientras la IA trabaja.
   Dos cosas a la vez: qué está haciendo, y con qué cerebro. Esa etiqueta
   es el recordatorio constante de por qué Kairo no es un chat más. */

const FASES: Record<Level, TKey[]> = {
  fast: ["pensar.pensando"],
  normal: ["pensar.leyendo", "pensar.pensando", "pensar.redactando"],
  forja: ["pensar.analizando", "pensar.forjando", "pensar.verificando", "pensar.redactando"],
  // Cuando se conecten Claude y GPT, aquí entran "consultando a los tres"
  // y "combinando lo mejor". Mientras haya un solo proveedor sería mentira.
  mega: ["pensar.profundizando", "pensar.analizando", "pensar.redactando"],
};

/** Color del punto según la familia del modelo. */
function colorModelo(modelo: string) {
  const m = modelo.toLowerCase();
  if (m.includes("claude")) return "var(--violet)";
  if (m.includes("gpt")) return "var(--green)";
  if (m.includes("gemini")) return "var(--cyan)";
  return "var(--muted)";
}

export function Pensando({
  nivel,
  modelo,
}: {
  nivel: Level;
  /** Nombre del modelo que está respondiendo. Llega del servidor. */
  modelo?: string;
}) {
  const { t } = useUi();
  const fases = FASES[nivel];
  const [i, setI] = useState(0);

  // Va pasando de fase mientras espera. Se queda en la última.
  useEffect(() => {
    setI(0);
    if (fases.length < 2) return;
    const id = window.setInterval(
      () => setI((v) => (v + 1 < fases.length ? v + 1 : v)),
      1900,
    );
    return () => window.clearInterval(id);
  }, [fases]);

  return (
    <div className="flex gap-3">
      <Marca className="mt-0.5 h-8 w-8 shrink-0" />

      <div className="pt-1">
        <span className="texto-brillo text-[15px] font-medium">
          {t(fases[i])}…
        </span>

        {modelo && (
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[12px] text-muted">
              <i
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: colorModelo(modelo) }}
              />
              {modelo}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
