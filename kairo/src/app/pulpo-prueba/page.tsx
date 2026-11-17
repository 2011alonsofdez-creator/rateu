import Link from "next/link";
import { PulpoPixel } from "@/components/PulpoPixel";

/* PÁGINA DE PRUEBA DEL PULPO (temporal).
 * Enseña cómo quedaría en los tres sitios propuestos, sin tocar las
 * pantallas de verdad. Cuando se decida, se pone donde toque y esta
 * página se borra. */

export const metadata = { title: "Prueba del pulpo · Kairo" };

function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-acento">{titulo}</h2>
      <div className="relative flex min-h-[420px] flex-1 flex-col rounded-2xl border border-line bg-bg p-5">
        {children}
      </div>
    </section>
  );
}

export default function PruebaPulpo() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">El pulpo en Kairo · prueba</h1>
      <p className="mt-1 text-sm text-muted">
        Así quedaría en los tres sitios. Todavía no está puesto en la app de verdad.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Marco titulo="1 · Chat vacío">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <PulpoPixel pose="saluda" tam={96} />
            <p className="mt-3 text-[22px] font-semibold">Buenas noches, Alonso.</p>
            <div className="mt-5 w-full rounded-2xl border border-line bg-panel px-4 pb-10 pt-3 text-left text-muted">
              Pregunta a Kairo
            </div>
          </div>
        </Marco>

        <Marco titulo="2 · Cuando falla una respuesta">
          <div className="ml-auto max-w-[80%] rounded-2xl bg-panel-hi px-4 py-2.5 text-[15px]">
            q es el token d fornite
          </div>
          <div className="mt-6 flex gap-3">
            <PulpoPixel pose="quieto" tam={64} />
            <div className="text-[15px] leading-relaxed">
              Uy, se me ha liado algo y no he podido contestar. No has gastado créditos.
              <div className="mt-2">
                <span className="inline-block rounded-lg border border-line px-3 py-1.5 text-[13px]">↻ Reintentar</span>
              </div>
            </div>
          </div>
        </Marco>

        <Marco titulo="3 · Página que no existe (404)">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <PulpoPixel pose="quieto" tam={128} />
            <p className="mt-4 text-5xl font-bold">404</p>
            <p className="mt-2 text-muted">
              Esta página se ha escapado nadando.
              <br />
              No existe o la han movido.
            </p>
            <Link href="/chat" className="mt-5 rounded-xl bg-acento px-5 py-2.5 font-semibold text-black">
              Volver al chat
            </Link>
          </div>
        </Marco>
      </div>

      <h2 className="mt-12 text-xl font-semibold">Versión 2 · con boca y caras</h2>
      <p className="mt-1 text-sm text-muted">
        Simétrico, ojos iguales, tentáculos ordenados y cinco caras para cada momento.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {(
          [
            ["quieto", "v1 (la de ahora)"],
            ["v2-contento", "Contento · normal"],
            ["v2-saluda", "Saludando · chat vacío"],
            ["v2-pensando", "Pensando · mientras responde"],
            ["v2-triste", "Triste · error"],
            ["v2-sorprendido", "Sorprendido · 404"],
          ] as const
        ).map(([pose, texto]) => (
          <div key={pose} className="flex flex-col items-center rounded-2xl border border-line bg-panel p-4 text-center">
            <PulpoPixel pose={pose} tam={96} />
            <span className="mt-2 text-[13px] text-muted">{texto}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold">Versión 3 · sobria, estilo Kairo</h2>
      <p className="mt-1 text-sm text-muted">
        Sin boca ni mejillas: las caras solo con los ojos, y colores más planos, como el logo.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {(
          [
            ["v3-contento", "Normal"],
            ["v3-saluda", "Saludando · chat vacío"],
            ["v3-pensando", "Pensando · mientras responde"],
            ["v3-triste", "Error"],
            ["v3-sorprendido", "404"],
          ] as const
        ).map(([pose, texto]) => (
          <div key={pose} className="flex flex-col items-center rounded-2xl border border-line bg-panel p-4 text-center">
            <PulpoPixel pose={pose} tam={96} />
            <span className="mt-2 text-[13px] text-muted">{texto}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-6 text-sm text-muted">
        <span>Tamaños:</span>
        <PulpoPixel tam={32} /> <PulpoPixel tam={64} /> <PulpoPixel pose="saluda" tam={96} />
        <PulpoPixel tam={128} />
      </div>
    </main>
  );
}
