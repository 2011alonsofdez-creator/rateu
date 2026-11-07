"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useUi } from "@/lib/i18n";
import { apuntar } from "@/lib/rastro";
import { REGALO_BIENVENIDA } from "@/lib/planes";
import { Marca } from "./Logo";
import { Arrow } from "./Icons";

/* LA CAJA DE LA PORTADA, QUE AHORA FUNCIONA.
 *
 * Aquí había una conversación de pega dentro de una ventana dibujada:
 * una pregunta inventada, una respuesta inventada y una caja de escribir
 * que no escribía. Bonita y muerta.
 *
 * Nadie decide probar una IA porque le enseñen una captura de otra
 * persona usándola. La prueba y entonces decide. Así que la misma
 * ventana, el mismo sitio, pero con una pregunta de verdad y una
 * respuesta de verdad, sin registrarse y sin tarjeta.
 *
 * Tres respuestas por visitante. Lo que cuesta cada una es del orden de
 * una milésima de euro; lo que costaba no tenerlo era todo el mundo que
 * llegaba, no podía probar nada y se iba.
 */

type Turno = { mia: string; suya?: string };

export function Probar() {
  const { t } = useUi();
  const [texto, setTexto] = useState("");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pensando, setPensando] = useState(false);
  const [quedan, setQuedan] = useState<number | null>(null);
  const [fallo, setFallo] = useState<string>();
  const caja = useRef<HTMLTextAreaElement>(null);

  const sugerencias = [t("try.s1"), t("try.s2"), t("try.s3")];
  const agotado = quedan === 0;

  const mandar = async (pregunta: string) => {
    const limpia = pregunta.trim();
    if (!limpia || pensando || agotado) return;

    setTexto("");
    setFallo(undefined);
    setPensando(true);
    setTurnos((t) => [...t, { mia: limpia }]);

    try {
      const r = await fetch("/api/probar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: limpia }),
      });
      const j = (await r.json()) as { texto?: string; quedan?: number; error?: string };

      if (!r.ok || !j.texto) {
        setQuedan(j.quedan ?? null);
        const seAcabo = j.error === "se_acabaron" || j.error === "muchas_pruebas";
        if (seAcabo) apuntar("prueba_agotada");
        setFallo(seAcabo ? "try.none" : "try.error");
        /* La pregunta sin contestar no se queda colgando: se quita, que
           si no parece que Kairo te ha ignorado. */
        setTurnos((t) => t.slice(0, -1));
        return;
      }

      apuntar("prueba");
      setQuedan(j.quedan ?? null);
      setTurnos((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, suya: j.texto } : x)));
    } catch {
      setFallo("try.error");
      setTurnos((t) => t.slice(0, -1));
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto mt-14 max-w-2xl">
      <p className="mb-3 text-center text-[13px] text-faint">{t("try.hint")}</p>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--shadow)]">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green/60" />
          <span className="ml-2 text-[12px] text-faint">kairo.app</span>
        </div>

        <div className="min-h-[190px] space-y-4 px-5 py-6 text-left">
          {turnos.length === 0 && !pensando && (
            /* Sin nada escrito, las tres sugerencias hacen de ejemplo y
               de botón a la vez: enseñan para qué sirve y se pulsan. */
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((s) => (
                <button
                  key={s}
                  onClick={() => void mandar(s)}
                  className="rounded-xl border border-line bg-bg-soft px-3 py-2 text-left text-[13px] text-muted transition hover:border-line-hi hover:text-fg"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {turnos.map((turno, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-panel-hi px-4 py-2.5 text-[14px]">
                  {turno.mia}
                </p>
              </div>
              {turno.suya && (
                <div className="flex gap-3">
                  <Marca className="mt-0.5 h-7 w-7 shrink-0" />
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted">
                    {turno.suya}
                  </p>
                </div>
              )}
            </div>
          ))}

          {pensando && (
            <div className="flex items-center gap-3">
              <Marca className="h-7 w-7 shrink-0" animada />
              <span className="text-[14px] text-faint">{t("try.busy")}</span>
            </div>
          )}

          {fallo && (
            <p className="text-[13.5px] leading-relaxed text-gold">
              {t(fallo === "try.none" ? "try.none" : "try.error").replace(
                "{n}",
                String(REGALO_BIENVENIDA),
              )}
            </p>
          )}
        </div>

        <div className="border-t border-line px-5 py-3">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft px-3.5 py-2.5">
            <textarea
              ref={caja}
              rows={1}
              value={texto}
              disabled={agotado}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void mandar(texto);
                }
              }}
              placeholder={t("app.placeholder")}
              className="flex-1 resize-none bg-transparent text-[14px] outline-none placeholder:text-faint disabled:opacity-50"
            />
            <button
              onClick={() => void mandar(texto)}
              disabled={!texto.trim() || pensando || agotado}
              aria-label={t("app.send")}
              className="brand-grad grid h-7 w-7 shrink-0 place-items-center rounded-lg text-on-accent transition enabled:hover:opacity-90 disabled:opacity-40"
            >
              <Arrow className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cuando ya ha visto que funciona es cuando tiene sentido pedirle
          que se registre, y no antes. */}
      {(quedan !== null || agotado) && (
        <div className="mt-4 text-center">
          {quedan !== null && quedan > 0 && (
            <p className="text-[13px] text-faint">
              {t("try.left").replace("{n}", String(quedan))}
            </p>
          )}
          <Link
            href="/registro"
            className="brand-grad mt-3 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-on-accent transition hover:opacity-90"
          >
            {t("try.cta").replace("{n}", String(REGALO_BIENVENIDA))}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
