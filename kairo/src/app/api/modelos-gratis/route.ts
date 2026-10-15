/* LOS MODELOS GRATIS DE HOY, PREGUNTADOS A OPENROUTER.
 *
 * Esta lista cambia cada pocas semanas: entran modelos, salen otros, y
 * alguno deja de ser gratis sin avisar. Un nombre retirado no da un
 * error que se entienda —no dice "esto ya no existe"—, simplemente
 * falla, y quien lo montó se pasa la tarde revisando la clave.
 *
 * Por eso no hay ninguna lista escrita a mano en Kairo, ni aquí ni en
 * la documentación: se pregunta. El catálogo de OpenRouter es público y
 * NO hace falta clave para leerlo, así que esto no toca ningún secreto
 * ni gasta cuota de nadie.
 */

export const runtime = "nodejs";

const CATALOGO = "https://openrouter.ai/api/v1/models";

/* Quince minutos. La lista no cambia cada minuto, y así abrir la
   pantalla de revisión tres veces seguidas no son tres viajes. */
export const revalidate = 900;

type Modelo = {
  id: string;
  nombre: string;
  /** Cuánto texto le cabe de una vez, en miles. Para elegir con criterio. */
  memoria: number | null;
};

/** Lo que llega de OpenRouter, mirado con pinzas: es de fuera. */
type Crudo = {
  id?: unknown;
  name?: unknown;
  context_length?: unknown;
  pricing?: { prompt?: unknown; completion?: unknown } | null;
};

const cero = (v: unknown): boolean => {
  const n = Number(typeof v === "string" || typeof v === "number" ? v : NaN);
  return Number.isFinite(n) && n === 0;
};

/** ¿Este modelo es gratis de verdad?
 *
 *  Dos pruebas, y basta con una: el identificador acaba en ":free" —que
 *  es la convención de OpenRouter— o el precio de entrada y salida es
 *  cero. La segunda caza a los que son gratis sin llevar el sufijo. */
export function esGratis(m: Crudo): boolean {
  const id = typeof m.id === "string" ? m.id : "";
  if (!id) return false;
  if (id.endsWith(":free")) return true;
  return cero(m.pricing?.prompt) && cero(m.pricing?.completion);
}

export function ordenar(a: Modelo, b: Modelo): number {
  /* Primero los que más texto admiten: para resumir un papel largo o un
     vídeo, la memoria es lo que decide si cabe o se corta. */
  const da = a.memoria ?? 0;
  const db = b.memoria ?? 0;
  if (da !== db) return db - da;
  return a.id.localeCompare(b.id);
}

export function leerCatalogo(json: unknown): Modelo[] {
  const lista = (json as { data?: unknown })?.data;
  if (!Array.isArray(lista)) return [];

  return lista
    .filter((m): m is Crudo => Boolean(m) && typeof m === "object")
    .filter(esGratis)
    .map((m) => ({
      id: String(m.id),
      nombre: typeof m.name === "string" && m.name.trim() ? m.name.trim() : String(m.id),
      memoria:
        typeof m.context_length === "number" && Number.isFinite(m.context_length)
          ? Math.round(m.context_length / 1000)
          : null,
    }))
    .sort(ordenar);
}

export async function GET() {
  try {
    const r = await fetch(CATALOGO, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      next: { revalidate },
    });

    if (!r.ok) {
      return Response.json(
        { error: "no_contesta", detalle: `OpenRouter ha respondido ${r.status}` },
        { status: 502 },
      );
    }

    const modelos = leerCatalogo(await r.json());

    /* Cero modelos no es un error de red, pero tampoco es una respuesta
       útil: se dice, para que la pantalla no enseñe una lista vacía sin
       explicación. */
    if (!modelos.length) {
      return Response.json({ error: "ninguno", modelos: [] }, { status: 502 });
    }

    return Response.json({ modelos }, { headers: { "cache-control": "no-store" } });
  } catch {
    /* Sin detalles del fallo: de aquí no sale nada que no sea público, y
       un mensaje de red en crudo no le dice nada a nadie. */
    return Response.json({ error: "sin_conexion" }, { status: 502 });
  }
}
