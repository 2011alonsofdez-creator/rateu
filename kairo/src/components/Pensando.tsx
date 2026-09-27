"use client";

import { useEffect, useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import { LEVELS, type Level } from "@/lib/mock";
import { Marca } from "./Logo";
import { Bolt } from "./Icons";

/* Lo que se ve mientras la IA trabaja.
   Dos cosas a la vez: qué está haciendo, y con qué cerebro. Esa etiqueta
   es el recordatorio constante de por qué Kairo no es un chat más. */

const FASES: Record<Level, TKey[]> = {
  fast: ["pensar.pensando"],
  normal: ["pensar.leyendo", "pensar.pensando", "pensar.redactando"],
  forja: ["pensar.analizando", "pensar.forjando", "pensar.verificando", "pensar.redactando"],
  /* MEGA no adivina por dónde va: el servidor lo dice (`paso`), porque
     es el único que sabe si está esperando a los modelos o juntando lo
     que han escrito. Esto es solo el primer segundo, hasta que llega el
     primer aviso. */
  mega: ["pensar.profundizando"],
};

/* Lo que se enseña en cada paso del Mega-Prompt. Comparar y combinar es
   una sola espera —la del modelo que escribe la respuesta final—, así
   que van juntos y se van pasando solos. */
const PASOS: Record<"consultando" | "comparando", TKey[]> = {
  consultando: ["pensar.consultando"],
  comparando: ["pensar.comparando", "pensar.combinando"],
};

/** Color del punto según la familia del modelo. */
function colorModelo(modelo: string) {
  const m = modelo.toLowerCase();
  if (m.includes("claude")) return "var(--acento)";
  if (m.includes("gpt")) return "var(--green)";
  if (m.includes("gemini")) return "var(--gold)";
  return "var(--muted)";
}

export function Pensando({
  nivel,
  modelo,
  buscando = false,
  paso = null,
  elegido,
}: {
  nivel: Level;
  /** Nombre del modelo que está respondiendo. Llega del servidor. */
  modelo?: string;
  /** Está buscando en internet antes de contestar. */
  buscando?: boolean;
  /** En qué punto va el Mega-Prompt, si es un Mega-Prompt. */
  paso?: "consultando" | "comparando" | null;
  /** El nivel que ha elegido Kairo solo. Sin esto, no se enseña nada:
   *  decirte "Normal" cuando lo has puesto tú es ruido. */
  elegido?: Level;
}) {
  const { t } = useUi();
  /* Buscar es lo único que no se adivina: si está buscando, se dice, y
     no se va pasando de fase como si estuviera pensando. */
  const fases = buscando
    ? (["pensar.buscando"] as TKey[])
    : paso
      ? PASOS[paso]
      : FASES[nivel];
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
      <Marca className="mt-0.5 h-8 w-8 shrink-0" animada />

      <div className="pt-1">
        <span className="texto-brillo text-[15px] font-medium">
          {t(fases[i])}…
        </span>

        {(modelo || elegido) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {elegido && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] text-muted">
                <Bolt className="h-3 w-3" style={{ color: LEVELS[elegido].color }} />
                {t(`app.${elegido}`)}
                <span className="text-faint">{t("app.autoPicked")}</span>
              </span>
            )}
            {modelo && (
              <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[12px] text-muted">
                <i
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: colorModelo(modelo) }}
                />
                {modelo}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
