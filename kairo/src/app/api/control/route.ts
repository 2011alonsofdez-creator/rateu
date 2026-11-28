import { timingSafeEqual } from "node:crypto";
import { buscarHechos, type Diario } from "@/lib/ia/buscar";
import { decidirBusqueda } from "@/lib/ia/decidir-busqueda";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

/* EL CONTROL DIARIO DE LA BÚSQUEDA (25-11).
 *
 * Cada mañana GitHub (control-diario.yml) llama aquí con la contraseña
 * de los relojes (CRON_SECRET) y Kairo se hace a sí misma unas
 * preguntas de control: ¿decide buscar cuando toca? ¿lo que encuentra
 * habla de lo preguntado? Si alguna falla, la ejecución sale en rojo y
 * GitHub manda un correo. Así un "no busca" o un "trae otra persona" se
 * ve el mismo día, sin esperar a que lo pille alguien en el chat.
 *
 * No contesta con ningún modelo (eso gastaría cuota): mira lo que llega
 * ANTES de contestar, que es donde estaban los fallos de verdad. */

type Control = { pregunta: string; busca: boolean; debe?: RegExp };

const CONTROLES: Control[] = [
  { pregunta: "quién es djmario", busca: true, debe: /djmar+i+o/i },
  { pregunta: "q sabes de ibai", busca: true, debe: /ibai/i },
  { pregunta: "cuántos subs tiene auronplay", busca: true, debe: /auron/i },
  { pregunta: "reseñas gta 6", busca: true, debe: /gta|grand theft/i },
  { pregunta: "quién ganó el último gran premio de fórmula 1", busca: true, debe: /f(ó|o)rmula|gran premio|\bgp\b/i },
  { pregunta: "precio del euríbor hoy", busca: true, debe: /eur(í|i)bor/i },
  { pregunta: "plazo para presentar la declaración de la renta", busca: true, debe: /renta/i },
  { pregunta: "escríbeme un poema corto sobre el otoño", busca: false },
  { pregunta: "calcula el 15% de 240", busca: false },
  { pregunta: "5x5", busca: false },
  { pregunta: "como se dice perro en ingles", busca: false },
  { pregunta: "q dia es hoy", busca: false },
];

function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) return Response.json({ error: "sin_cron_secret" }, { status: 503 });
  const recibida = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!igual(recibida, secreto)) return Response.json({ error: "no_autorizado" }, { status: 401 });

  const resultados = await Promise.all(
    CONTROLES.map(async (c) => {
      const t = Date.now();
      const busca = await decidirBusqueda(c.pregunta).catch(() => false);
      let encontrado = false;
      let fuentes: string[] = [];
      let modelo = "";
      let intentos: Diario["intentos"] = [];
      if (busca && c.busca) {
        const diario: Diario = { modelos: [], intentos: [] };
        const h = await buscarHechos(c.pregunta, "", "adulto", diario).catch(() => null);
        encontrado = Boolean(h && c.debe?.test(h.hechos));
        fuentes = (h?.fuentes ?? []).map((f) => f.dominio).slice(0, 8);
        modelo = h?.modelo ?? "";
        intentos = diario.intentos.map((i) => ({ ...i, resultado: i.resultado.slice(0, 160) }));
      }
      const ok = busca === c.busca && (!c.busca || encontrado);
      return { pregunta: c.pregunta, ok, busca, deberia_buscar: c.busca, encontrado, fuentes, modelo, ms: Date.now() - t, intentos };
    }),
  );

  const fallos = resultados.filter((r) => !r.ok).length;
  /* Qué buscadores con clave ve el servidor (solo si están, nunca el valor). */
  const buscadores = {
    tavily: Boolean(process.env.TAVILY_API_KEY?.trim()),
    brave: Boolean(process.env.BRAVE_SEARCH_KEY?.trim()),
  };
  return Response.json({ ok: fallos === 0, fallos, total: resultados.length, buscadores, resultados });
}
