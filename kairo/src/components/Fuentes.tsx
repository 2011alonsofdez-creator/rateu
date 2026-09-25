"use client";

import { useState } from "react";
import { useUi } from "@/lib/i18n";
import { Lupa, Pin } from "@/components/Icons";
import type { Fuente } from "@/lib/tipos";

/* De dónde salió la respuesta.
 *
 * Esto es lo que separa un dato de una suposición que suena bien. Si
 * Kairo ha buscado, aquí está cada página que leyó, con el enlace tal y
 * como lo dio el buscador: nadie tiene que creerse el precio ni la
 * dirección, se puede abrir y comprobar.
 *
 * Solo sale cuando ha buscado de verdad. Un bloque de fuentes vacío
 * debajo de una respuesta de memoria sería peor que no ponerlo. */
export function Fuentes({ fuentes, busquedas }: { fuentes?: Fuente[]; busquedas?: string[] }) {
  const { t } = useUi();
  const [todas, setTodas] = useState(false);
  const lista = fuentes ?? [];
  const buscado = busquedas ?? [];

  if (!lista.length && !buscado.length) return null;

  const VISIBLES = 4;
  const enPantalla = todas ? lista : lista.slice(0, VISIBLES);
  const ocultas = lista.length - enPantalla.length;

  return (
    <div className="mt-4 rounded-xl border border-line bg-bg-soft p-3">
      {/* Sin páginas que enseñar, el título sobra: lo único que hay que
          contar es qué buscó, y eso ya lo dice la fila de abajo. */}
      {Boolean(lista.length) && (
        <div className="mb-2 flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wide text-faint">
          <Lupa className="h-3.5 w-3.5" />
          {t("app.sources")}
        </div>
      )}

      {Boolean(lista.length) && (
        <ol className="space-y-1.5">
          {enPantalla.map((f, i) => (
            <li key={f.url} className="flex items-start gap-2">
              <span className="mt-[3px] w-3.5 shrink-0 text-right text-[11px] tabular-nums text-faint">
                {i + 1}
              </span>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group min-w-0 flex-1 text-[13px] leading-snug"
              >
                <span className="flex items-center gap-1.5 text-faint">
                  {f.tipo === "mapa" ? (
                    <Pin className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <span className="h-1 w-1 shrink-0 rounded-full bg-current" />
                  )}
                  <span className="truncate text-[11.5px]">{f.dominio || f.url}</span>
                </span>
                <span className="block text-muted underline-offset-2 transition group-hover:text-fg group-hover:underline">
                  {f.titulo}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}

      {ocultas > 0 && (
        <button
          onClick={() => setTodas(true)}
          className="mt-2 text-[12px] text-faint transition hover:text-fg"
        >
          {t("app.moreSources").replace("{n}", String(ocultas))}
        </button>
      )}

      {/* Lo que buscó. Va debajo y en pequeño: es el "cómo", no el "de dónde". */}
      {Boolean(buscado.length) && (
        <div
          className={`flex flex-wrap items-center gap-1.5 ${
            lista.length ? "mt-2.5 border-t border-line pt-2.5" : ""
          }`}
        >
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-faint">
            <Lupa className="h-3.5 w-3.5" />
            {t("app.searched")}
          </span>
          {buscado.map((b) => (
            <a
              key={b}
              href={`https://www.google.com/search?q=${encodeURIComponent(b)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-line px-2 py-0.5 text-[11.5px] text-muted transition hover:border-line-hi hover:text-fg"
            >
              {b}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
