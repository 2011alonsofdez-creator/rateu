"use client";

import { useState, type ReactNode } from "react";
import { useUi } from "@/lib/i18n";
import { Check, Copy } from "./Icons";

/* Renderizador de markdown mínimo: negrita, código en línea, listas y
   bloques de código. Nada de innerHTML — todo se pinta como texto, así
   que un mensaje no puede inyectar HTML en la página. En el Paso 3,
   cuando el contenido venga del modelo, esto pasa a ser importante. */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
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
          .map((block, bi) => {
            const lines = block.split("\n").filter((l) => l.trim());
            const key = `${idx}-${bi}`;

            if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
              return (
                <ul key={key} className="my-3 space-y-1.5 pl-1">
                  {lines.map((l, li) => (
                    <li key={li} className="flex gap-2.5">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-violet" />
                      <span>{inline(l.replace(/^\s*[-*]\s+/, ""), `${key}-${li}`)}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
              return (
                <ol key={key} className="my-3 space-y-1.5">
                  {lines.map((l, li) => (
                    <li key={li} className="flex gap-2.5">
                      <span className="mt-0.5 font-mono text-[13px] text-violet">
                        {li + 1}.
                      </span>
                      <span>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${key}-${li}`)}</span>
                    </li>
                  ))}
                </ol>
              );
            }

            return (
              <p key={key} className="my-3 first:mt-0 last:mb-0">
                {inline(block, key)}
              </p>
            );
          });
      })}
    </div>
  );
}
