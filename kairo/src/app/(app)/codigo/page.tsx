"use client";

import { useUi } from "@/lib/i18n";
import { Section } from "@/components/Section";
import { Code } from "@/components/Icons";

export default function CodigoPage() {
  const { t, lang } = useUi();
  const es = lang === "es";

  return (
    <Section
      icon={Code}
      title={t("app.code")}
      lead={
        es
          ? "Editor, ejecución y conexión con tus repositorios, con Kairo al lado leyendo el mismo código que tú. Para programar acompañado, no solo aconsejado."
          : "Editor, execution and repository access, with Kairo beside you reading the same code you are. To code with company, not just advice."
      }
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="rounded-md bg-panel-hi px-2 py-1 font-mono text-[12px]">app/page.tsx</span>
          <span className="font-mono text-[12px] text-faint">lib/router.ts</span>
        </div>
        <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-muted">
{`export async function elegirNivel(peticion: string) {
  // El clasificador lee la petición y decide el modelo
  const { nivel } = await clasificar(peticion);
  return NIVELES[nivel];   // rapido | estandar | maximo
}`}
        </pre>
        <div className="border-t border-line px-5 py-3 text-[13px] text-faint">
          {es ? "▸ Ejecutar · salida vacía" : "▸ Run · no output yet"}
        </div>
      </div>
    </Section>
  );
}
