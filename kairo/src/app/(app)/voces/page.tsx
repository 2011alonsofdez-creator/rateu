"use client";

import { useRef, useState } from "react";

/* PÁGINA TEMPORAL PARA ELEGIR LA VOZ DE KAIRO.
 * Cada botón lee la misma frase con una voz de Gemini. Cuando elijas,
 * se fija esa en el código y esta página se borra. */

const VOCES = [
  "Achird", "Puck", "Fenrir", "Orus", "Umbriel",
  "Algieba", "Enceladus", "Iapetus", "Sadachbia", "Zubenelgenubi",
];

const FRASE =
  "Hola, soy Kairo. Te he preparado el resumen de hoy: tienes dos cosas pendientes y una buena noticia. ¿Empezamos?";

export default function Voces() {
  const [estado, setEstado] = useState<Record<string, string>>({});
  const audio = useRef<HTMLAudioElement | null>(null);

  const escuchar = async (voz: string) => {
    audio.current?.pause();
    setEstado((e) => ({ ...e, [voz]: "Cargando…" }));
    try {
      const r = await fetch("/api/voz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: FRASE, voz }),
      });
      if (!r.ok) throw new Error();
      const a = new Audio(URL.createObjectURL(await r.blob()));
      audio.current = a;
      a.onended = () => setEstado((e) => ({ ...e, [voz]: "" }));
      await a.play();
      setEstado((e) => ({ ...e, [voz]: "Sonando…" }));
    } catch {
      setEstado((e) => ({ ...e, [voz]: "No ha podido (¿sin cuota?). Prueba en un rato." }));
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-xl font-semibold">Elige la voz de Kairo</h1>
      <p className="mt-1 text-sm opacity-70">
        Pulsa cada una para oír la misma frase. Dime el número que más te guste.
      </p>
      <ol className="mt-6 space-y-2">
        {VOCES.map((v, i) => (
          <li key={v}>
            <button
              onClick={() => escuchar(v)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left hover:bg-white/5"
            >
              <span>
                <b>{i + 1}.</b> {v}
              </span>
              <span className="text-sm opacity-70">{estado[v] || "▶ Escuchar"}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
