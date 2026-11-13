"use client";

/* LAS PIEZAS COMUNES DE LOS DOCUMENTOS LEGALES.
 *
 * Nacen el 13-11, al escribir el segundo de los cuatro (privacidad). En la
 * política de cookies estas tres funciones estaban dentro del propio archivo,
 * que es lo correcto cuando hay una: copiarlas al segundo documento habría
 * creado dos sitios donde arreglar la misma negrita, y quedan dos documentos
 * por escribir.
 *
 * No son componentes de diseño: son lo mínimo para que un texto legal se lea
 * —negritas, tablas y títulos de apartado— sin traerse un motor de Markdown
 * entero para cuatro páginas que cambian dos veces al año. */

/** Las negritas de `**así**` dentro de un texto, sin traerse un motor de Markdown. */
export function Fuerte({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/\*\*(.+?)\*\*/g).map((trozo, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-fg">
            {trozo}
          </strong>
        ) : (
          <span key={i}>{trozo}</span>
        ),
      )}
    </>
  );
}

export function Tabla({ cabeceras, filas }: { cabeceras: string[]; filas: string[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="bg-panel">
            {cabeceras.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila[0]} className="border-t border-line align-top">
              {fila.map((celda, i) => (
                <td
                  key={i}
                  className={
                    i === 0
                      ? "px-4 py-3 font-mono text-[12.5px] leading-relaxed"
                      : "px-4 py-3 leading-relaxed text-muted"
                  }
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[18px] font-semibold tracking-tight">{titulo}</h2>
      {children}
    </section>
  );
}
