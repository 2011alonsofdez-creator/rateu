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

      <div className="mt-8 flex flex-wrap items-end gap-6 text-sm text-muted">
        <span>Tamaños:</span>
        <PulpoPixel tam={32} /> <PulpoPixel tam={64} /> <PulpoPixel pose="saluda" tam={96} />
        <PulpoPixel tam={128} />
      </div>
    </main>
  );
}
