"use client";

import { useEffect, useRef, useState } from "react";
import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { useCredits } from "@/lib/credits";
import { Markdown } from "./Markdown";
import { Marca } from "./Logo";
import { Send } from "./Icons";
import { paraElServidor, type Turno } from "@/lib/charla-ficha";

/* EL CHAT PEQUEÑO DE LA FICHA.
 *
 * Nace de algo que pasaba siempre: acabas de leer el resumen de un
 * vídeo de cuarenta minutos, te queda una duda de dos líneas, y para
 * preguntarla había que irse al chat, pegar el título y explicarle otra
 * vez de qué vídeo hablas. Tres pasos para una duda.
 *
 * Aquí la pregunta se hace donde está el resumen, y el resumen va
 * dentro de la pregunta: no hay que contarle nada.
 *
 * Y no es un chat aparte con su propia memoria. Es el chat de Kairo,
 * abierto desde aquí: la conversación queda guardada y se puede seguir
 * en la pantalla del chat como cualquier otra. Un segundo historial
 * invisible sería justo lo que nadie pide.
 */

export function GistChat({
  ficha,
}: {
  ficha: { id: string; titulo: string; url: string; resumen: string };
}) {
  const { t } = useUi();
  const perfil = usePerfil();
  const { sincronizar } = useCredits();

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState(false);
  /* La conversación se abre con la primera pregunta y las siguientes
     van dentro. Sin esto, cada duda sobre el mismo vídeo abriría una
     conversación nueva y el historial se llenaría de hilos de un
     mensaje. */
  const [conversacion, setConversacion] = useState<string | null>(null);
  const abajo = useRef<HTMLDivElement>(null);

  /* Otra ficha es otra conversación: lo de antes no tiene nada que ver
     con este vídeo. */
  useEffect(() => {
    setTurnos([]);
    setConversacion(null);
    setError(false);
  }, [ficha.id, ficha.url]);

  useEffect(() => {
    if (turnos.length) abajo.current?.scrollIntoView({ block: "nearest" });
  }, [turnos]);

  /* Un intento que no ha salido se deshace entero y la pregunta vuelve
     a la caja. Dejarla a medias en pantalla obliga a volver a
     escribirla, y borrarla sin más es peor todavía. */
  const fallar = (pregunta: string) => {
    setError(true);
    setTurnos((v) => v.slice(0, -2));
    setTexto((v) => v || pregunta);
  };

  const preguntar = async () => {
    const pregunta = texto.trim();
    if (!pregunta || trabajando || perfil.demo) return;

    setError(false);
    setTrabajando(true);

    const { mensajes, paraElModelo } = paraElServidor(turnos, pregunta, ficha);

    setTexto("");
    setTurnos((v) => [
      ...v,
      { rol: "user", texto: pregunta, modelo: paraElModelo },
      { rol: "kairo", texto: "" },
    ]);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nivel: "auto",
          conversacionId: conversacion,
          mensajes,
        }),
      });

      if (!r.ok || !r.body) {
        fallar(pregunta);
        return;
      }

      const lector = r.body.getReader();
      const decoder = new TextDecoder();
      let resto = "";
      let algo = false;

      const anadir = (trozo: string) => {
        algo = true;
        setTurnos((v) => {
          const copia = [...v];
          const ult = copia[copia.length - 1];
          if (ult?.rol !== "kairo") return v;
          copia[copia.length - 1] = { ...ult, texto: ult.texto + trozo };
          return copia;
        });
      };

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decoder.decode(value, { stream: true });
        const lineas = resto.split("\n");
        // La última puede venir partida: se recompone en la vuelta siguiente.
        resto = lineas.pop() ?? "";

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(linea);
          } catch {
            continue;
          }

          if (ev.t === "texto") anadir(String(ev.v ?? ""));
          else if (ev.t === "conversacion") setConversacion(String(ev.id));
          else if (ev.t === "creditos") {
            sincronizar(Number(ev.creditos ?? 0), Number(ev.creditosExtra ?? 0));
          } else if (ev.t === "error") setError(true);
        }
      }

      // Una respuesta vacía no se deja en pantalla como un hueco mudo.
      if (!algo) fallar(pregunta);
    } catch {
      fallar(pregunta);
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-line bg-bg-soft p-4">
      <h3 className="flex items-center gap-2 text-[13.5px] font-semibold">
        <Marca className="h-4 w-4 shrink-0" animada={trabajando} />
        {t("gist.mini")}
      </h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-faint">{t("gist.miniLead")}</p>

      {turnos.length > 0 && (
        <div className="mt-3 space-y-3">
          {turnos.map((x, i) =>
            x.rol === "user" ? (
              <p
                key={i}
                className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-line bg-panel px-3.5 py-2 text-[14px] leading-relaxed"
              >
                {x.texto}
              </p>
            ) : (
              <div key={i} className="max-w-full text-[14.5px]">
                {x.texto ? (
                  <Markdown text={x.texto} />
                ) : (
                  <span className="text-[13.5px] text-faint">…</span>
                )}
              </div>
            ),
          )}
          <div ref={abajo} />
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-gold">{t("gist.miniFailed")}</p>}

      <div className="mt-3 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void preguntar()}
          placeholder={t("gist.miniPlaceholder")}
          aria-label={t("gist.mini")}
          disabled={perfil.demo || trabajando}
          maxLength={2000}
          className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-[14px] outline-none transition placeholder:text-faint focus:border-line-hi disabled:opacity-50"
        />
        <button
          onClick={() => void preguntar()}
          disabled={!texto.trim() || trabajando || perfil.demo}
          aria-label={t("gist.mini")}
          className="brand-grad grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl text-on-accent transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
