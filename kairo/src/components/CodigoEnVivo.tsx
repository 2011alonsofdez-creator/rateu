"use client";

import { useMemo } from "react";
import { resaltar, type Lenguaje } from "@/lib/resaltar";

/* EL CÓDIGO MIENTRAS SE ESCRIBE, YA EN COLOR.
 *
 * Antes esto era un bloque de texto gris, y al terminar aparecía de
 * golpe el editor con sus colores. Ese salto se notaba y hacía pensar
 * que lo de antes era otra cosa —un registro, un borrador—, cuando es
 * exactamente el mismo archivo.
 *
 * Usa el mismo resaltador que el editor, que no es una librería: son
 * trozos de texto con una clase cada uno, y los pinta React. Un código
 * recién llegado no puede inyectar nada en la página.
 *
 * Esto NO es el editor: aquí no se escribe. Es solo la mirilla por la
 * que se ve llegar el archivo, pegada abajo para que se lea lo último.
 */

/** Los mismos colores que el editor, a propósito: es el mismo archivo
 *  antes y después, y tiene que parecerlo. */
const CLASES: Record<string, string> = {
  llano: "text-fg",
  comentario: "text-faint italic",
  texto: "text-green",
  numero: "text-acento-2",
  clave: "text-acento font-medium",
  etiqueta: "text-acento font-medium",
};

/* Cuánto se enseña. El archivo entero puede ser muy largo, y colorear
   cincuenta mil caracteres veinte veces por segundo sí se nota: se
   colorea solo el final, que es lo único que se está mirando. */
const VENTANA = 2000;

export function CodigoEnVivo({
  texto,
  lenguaje = "html",
}: {
  texto: string;
  lenguaje?: Lenguaje;
}) {
  const trozos = useMemo(
    () => resaltar(texto.slice(-VENTANA), lenguaje),
    [texto, lenguaje],
  );

  return (
    <pre
      aria-hidden
      className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed"
    >
      {trozos.map((t, i) => (
        <span key={i} className={CLASES[t.c] ?? "text-fg"}>
          {t.t}
        </span>
      ))}
    </pre>
  );
}
