"use client";

import { useState, type ReactNode } from "react";
import { useUi } from "@/lib/i18n";
import { Check, Copy } from "./Icons";
import { enlaceSeguro, titulo } from "@/lib/markdown";

/* Renderizador de markdown mínimo: títulos, negrita, código en línea,
   enlaces, listas y bloques de código. Nada de innerHTML — todo se pinta
   como texto, así que un mensaje no puede inyectar HTML en la página.
   Como el contenido lo escribe un modelo, eso no es un detalle.

   Los títulos y los enlaces llegaron tarde, y mientras no estuvieron
   cualquier respuesta con un "## Apartado" o un enlace se leía con los
   símbolos a la vista. Se notó al enseñar un vídeo contado por partes,
   donde cada parte es un título con el minuto enlazado, pero pasaba en
   cualquier respuesta larga. */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  /* El enlace va el primero: su texto puede llevar negrita o código
     dentro, y si se partiera antes se quedaría a medias. */
  const re = /(\[[^\]\n]*\]\([^)\s]*\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];

    if (tok.startsWith("[")) {
      const corte = tok.lastIndexOf("](");
      const etiqueta = tok.slice(1, corte);
      const destino = enlaceSeguro(tok.slice(corte + 2, -1));

      if (!destino) {
        // Un enlace que no se puede abrir se queda como texto normal.
        out.push(...inline(etiqueta || tok, `${keyBase}-x${i}`));
      } else {
        const fuera = destino.startsWith("http");
        out.push(
          <a
            key={`${keyBase}-a${i}`}
            href={destino}
            /* Una dirección de fuera se abre en otra pestaña y sin poder
               tocar la de Kairo. Una página de Kairo, aquí mismo. */
            target={fuera ? "_blank" : undefined}
            rel={fuera ? "noreferrer noopener" : undefined}
            className="text-acento underline decoration-acento/40 underline-offset-2 transition hover:decoration-acento"
          >
            {inline(etiqueta, `${keyBase}-a${i}t`)}
          </a>,
        );
      }
    } else if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold text-fg">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <code
          key={`${keyBase}-c${i}`}
          className="rounded-[5px] border border-line bg-panel-hi px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* Lo grande que se pinta cada nivel de título. Un "######" no puede
   quedar más pequeño que el texto de al lado: entonces no es un título,
   es un renglón raro. */
const TITULOS = [
  "text-[21px] font-semibold tracking-tight text-fg",
  "text-[19px] font-semibold tracking-tight text-fg",
  "text-[17px] font-semibold text-fg",
  "text-[15.5px] font-semibold text-fg",
  "text-[15px] font-semibold text-fg",
  "text-[15px] font-semibold text-fg",
] as const;

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const { t } = useUi();
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* el portapapeles puede estar bloqueado: no rompemos nada */
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-line bg-bg-soft">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
          {lang || "code"}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted transition hover:bg-panel-hi hover:text-fg"
        >
          {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {done ? t("app.copied") : t("app.copy")}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3">
        <code className="font-mono text-[13px] leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}

/* UN BLOQUE ES VARIAS COSAS SEGUIDAS.
   Los modelos escriben "### PSOE" y justo debajo, sin línea en blanco,
   la lista de lo que propone; o un párrafo y debajo una tabla. Si el
   bloque entero se trata como una sola cosa, la lista sale como un
   párrafo con los guiones a la vista. Así que se trocea por tipo de
   línea, y cada trozo se pinta como lo que es. */
type Grupo =
  | { tipo: "titulo"; nivel: number; texto: string }
  | { tipo: "ul" | "ol" | "tabla" | "p"; lineas: string[] };

const esUl = (l: string) => /^\s*[-*•]\s+/.test(l);
const esOl = (l: string) => /^\s*\d+[.)]\s+/.test(l);
const esFila = (l: string) => /^\s*\|.*\|\s*$/.test(l);

function grupos(lineas: string[]): Grupo[] {
  const out: Grupo[] = [];
  for (const l of lineas) {
    const cab = titulo(l);
    if (cab) {
      out.push({ tipo: "titulo", nivel: cab.nivel, texto: cab.texto });
      continue;
    }
    const tipo = esFila(l) ? "tabla" : esUl(l) ? "ul" : esOl(l) ? "ol" : "p";
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.tipo === tipo) ultimo.lineas.push(l);
    else out.push({ tipo, lineas: [l] });
  }
  return out;
}

const celdas = (fila: string) =>
  fila.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const esSeparador = (fila: string) => celdas(fila).every((c) => /^:?-{2,}:?$/.test(c));

function pintarGrupo(g: Grupo, key: string): ReactNode {
  if (g.tipo === "titulo") {
    const Etiqueta = `h${Math.min(g.nivel + 1, 6)}` as "h2";
    return (
      <Etiqueta key={key} className={`mt-5 mb-2 first:mt-0 ${TITULOS[g.nivel - 1]}`}>
        {inline(g.texto, `${key}-h`)}
      </Etiqueta>
    );
  }

  if (g.tipo === "tabla") {
    const filas = g.lineas.filter((f) => !esSeparador(f)).map(celdas);
    const conCabecera = g.lineas.length > 1 && esSeparador(g.lineas[1]);
    const [cabecera, ...cuerpo] = conCabecera ? filas : [null, ...filas];
    return (
      /* Con scroll de lado a lado: en el móvil una tabla de tres columnas
         no cabe, y apretada se lee peor que deslizando. */
      <div key={key} className="my-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-left text-[14px] leading-relaxed">
          {cabecera && (
            <thead className="bg-panel-hi">
              <tr>
                {cabecera.map((c, ci) => (
                  <th key={ci} className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-fg">
                    {inline(c, `${key}-th${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {cuerpo.map((fila, fi) => (
              <tr key={fi} className="border-t border-line align-top">
                {(fila ?? []).map((c, ci) => (
                  <td key={ci} className={`px-3.5 py-2.5 ${ci === 0 ? "text-fg" : ""}`}>
                    {inline(c, `${key}-${fi}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (g.tipo === "ul") {
    return (
      <ul key={key} className="my-3 space-y-1.5 pl-1">
        {g.lineas.map((l, li) => (
          <li key={li} className="flex gap-2.5">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-acento" />
            <span>{inline(l.replace(/^\s*[-*•]\s+/, ""), `${key}-${li}`)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (g.tipo === "ol") {
    return (
      <ol key={key} className="my-3 space-y-1.5">
        {g.lineas.map((l, li) => (
          <li key={li} className="flex gap-2.5">
            <span className="mt-0.5 font-mono text-[13px] text-acento">
              {l.match(/^\s*(\d+)/)?.[1] ?? li + 1}.
            </span>
            <span>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${key}-${li}`)}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p key={key} className="my-3 first:mt-0 last:mb-0">
      {inline(g.lineas.join("\n"), key)}
    </p>
  );
}

export function Markdown({ text }: { text: string }) {
  const parts = text.split(/```/);

  return (
    <div className="text-[15px] leading-[1.7] text-muted">
      {parts.map((part, idx) => {
        // Los índices impares son bloques de código (van entre ```)
        if (idx % 2 === 1) {
          const nl = part.indexOf("\n");
          const lang = nl > 0 ? part.slice(0, nl).trim() : "";
          const code = (nl > 0 ? part.slice(nl + 1) : part).replace(/\n$/, "");
          return <CodeBlock key={idx} code={code} lang={lang} />;
        }

        return part
          .split(/\n{2,}/)
          .filter((b) => b.trim())
          .flatMap((block, bi) =>
            grupos(block.split("\n").filter((l) => l.trim())).map((g, gi) =>
              pintarGrupo(g, `${idx}-${bi}-${gi}`),
            ),
          );
      })}
    </div>
  );
}
