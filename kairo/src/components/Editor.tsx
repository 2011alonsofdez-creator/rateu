"use client";

import { useEffect, useRef } from "react";
import { resaltar, type Lenguaje } from "@/lib/resaltar";

/* Un editor de código de verdad, sin librería.
 *
 * El truco es viejo y funciona: dos capas exactamente encima la una de
 * la otra. Debajo, el código coloreado. Encima, el <textarea> de
 * siempre con el texto invisible y el cursor visible. Tú escribes en el
 * textarea —con su cursor, su selección, su corrector, su deshacer— y
 * ves los colores de debajo.
 *
 * Para que no se note, las dos capas tienen que compartir EXACTAMENTE
 * la misma tipografía, el mismo tamaño, el mismo interlineado y el
 * mismo relleno. Si se desalinean, se nota al instante, y por eso el
 * resaltador está probado carácter a carácter.
 */

const CLASES: Record<string, string> = {
  llano: "text-fg",
  comentario: "text-faint italic",
  texto: "text-green",
  numero: "text-acento-2",
  clave: "text-acento font-medium",
  etiqueta: "text-acento font-medium",
};

/* La tipografía compartida por las dos capas. Tocar esto sin tocar la
   otra capa es la única forma de romper el editor. */
const LETRA = "font-mono text-[13.5px] leading-[1.6] tracking-normal";
const RELLENO = "px-4 py-3";

export function Editor({
  valor,
  onCambio,
  lenguaje,
  etiqueta,
}: {
  valor: string;
  onCambio: (v: string) => void;
  lenguaje: Lenguaje;
  etiqueta: string;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const pintado = useRef<HTMLPreElement>(null);
  const numeros = useRef<HTMLDivElement>(null);

  /* Al desplazar el textarea hay que desplazar lo de debajo en el mismo
     píxel, o los colores se quedan atrás. */
  const seguir = () => {
    const a = area.current;
    if (!a) return;
    if (pintado.current) {
      pintado.current.scrollTop = a.scrollTop;
      pintado.current.scrollLeft = a.scrollLeft;
    }
    if (numeros.current) numeros.current.scrollTop = a.scrollTop;
  };

  useEffect(seguir, [valor]);

  /* El tabulador mete una indentación en vez de saltar al siguiente
     botón. Es lo que espera cualquiera que haya escrito código. */
  const teclas = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const a = e.currentTarget;

    if (e.key === "Tab") {
      e.preventDefault();
      const ini = a.selectionStart;
      const fin = a.selectionEnd;
      const nuevo = `${valor.slice(0, ini)}  ${valor.slice(fin)}`;
      onCambio(nuevo);
      requestAnimationFrame(() => a.setSelectionRange(ini + 2, ini + 2));
      return;
    }

    if (e.key === "Enter") {
      // Mantener la indentación de la línea anterior, y abrir una más
      // después de {, [, ( o :  —lo que hace cualquier editor.
      const ini = a.selectionStart;
      if (ini !== a.selectionEnd) return;

      const lineaPrevia = valor.slice(0, ini).split("\n").pop() ?? "";
      const sangria = lineaPrevia.match(/^[ \t]*/)?.[0] ?? "";
      const abre = /[{[(:]\s*$/.test(lineaPrevia);
      if (!sangria && !abre) return;

      e.preventDefault();
      const extra = abre ? "  " : "";
      const nuevo = `${valor.slice(0, ini)}\n${sangria}${extra}${valor.slice(a.selectionEnd)}`;
      const donde = ini + 1 + sangria.length + extra.length;
      onCambio(nuevo);
      requestAnimationFrame(() => a.setSelectionRange(donde, donde));
    }
  };

  const lineas = valor.split("\n").length;
  const trozos = resaltar(valor, lenguaje);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {/* Números de línea */}
      <div
        ref={numeros}
        aria-hidden="true"
        className={`${LETRA} shrink-0 select-none overflow-hidden border-r border-line bg-bg-soft py-3 pl-3 pr-2 text-right text-faint`}
      >
        {Array.from({ length: lineas }, (_, i) => (
          <div key={i} className="tabular-nums">
            {i + 1}
          </div>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        {/* Capa de abajo: el color */}
        <pre
          ref={pintado}
          aria-hidden="true"
          className={`${LETRA} ${RELLENO} pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre break-normal`}
        >
          {trozos.map((t, i) => (
            <span key={i} className={CLASES[t.c] ?? CLASES.llano}>
              {t.t}
            </span>
          ))}
          {/* Un salto final para que la última línea vacía se vea. */}
          {"\n"}
        </pre>

        {/* Capa de arriba: donde escribes de verdad */}
        <textarea
          ref={area}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          onScroll={seguir}
          onKeyDown={teclas}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={etiqueta}
          className={`${LETRA} ${RELLENO} absolute inset-0 m-0 block h-full w-full resize-none overflow-auto whitespace-pre break-normal bg-transparent text-transparent caret-acento outline-none`}
        />
      </div>
    </div>
  );
}
