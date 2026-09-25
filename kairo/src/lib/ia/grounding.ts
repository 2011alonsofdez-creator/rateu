import type { GroundingMetadata } from "@google/genai";
import { BUSQUEDAS_MAX, FUENTES_MAX, type Fuente } from "@/lib/tipos";

/* De dónde salió cada dato.
 *
 * Cuando Gemini busca en internet no devuelve solo texto: devuelve
 * también qué páginas leyó. Aquí se recoge eso mientras la respuesta va
 * llegando y se convierte en algo que se pueda enseñar debajo: título,
 * sitio y enlace.
 *
 * Los enlaces NO se reescriben. Google los da a través de su propia
 * redirección, y tocarlos —quitarla, resolverla, cambiarla por el
 * enlace final— se salta lo que el buscador cuenta a quien publica la
 * página. Se guardan tal cual vienen.
 */

/* Ese es el dominio de la redirección de Google, no el de la fuente.
   Si lo enseñáramos, todas las fuentes parecerían ser la misma. */
const REDIRECCION = /(^|\.)vertexaisearch\.cloud\.google\.com$/i;

/** El sitio de una dirección, sin "www." y sin la parte de después. */
export function dominioDe(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return REDIRECCION.test(host) ? "" : host;
  } catch {
    return "";
  }
}

const limpiar = (t: string | undefined, max: number) =>
  (t ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/* El recolector.
 *
 * Los trozos que manda Gemini traen las fuentes repetidas: cada uno
 * puede llegar con la lista entera otra vez, o con una parte. Por eso
 * esto guarda por dirección y no por orden de llegada: la misma página
 * dos veces es una sola fuente. */
export function recolectorDeFuentes() {
  const porUrl = new Map<string, Fuente>();
  const busquedas: string[] = [];

  const anadirFuente = (f: Fuente) => {
    if (!f.url || porUrl.has(f.url)) return;
    if (porUrl.size >= FUENTES_MAX) return;
    porUrl.set(f.url, f);
  };

  return {
    /** Se le va dando lo que trae cada trozo de la respuesta. */
    anadir(meta: GroundingMetadata | undefined) {
      if (!meta) return;

      for (const trozo of meta.groundingChunks ?? []) {
        if (trozo.web?.uri) {
          const url = trozo.web.uri;
          const dominio = limpiar(trozo.web.domain, 80).replace(/^www\./i, "") || dominioDe(url);
          anadirFuente({
            // Sin título, el sitio hace de título: mejor "renfe.com" que un enlace crudo.
            titulo: limpiar(trozo.web.title, 160) || dominio || url,
            url,
            dominio,
            tipo: "web",
          });
        }

        /* Los sitios de Google Maps vienen por otra puerta y son los que
           contestan a "¿dónde está?": llevan la ficha del lugar. */
        if (trozo.maps?.uri) {
          anadirFuente({
            titulo: limpiar(trozo.maps.title, 160) || "Google Maps",
            url: trozo.maps.uri,
            dominio: "Google Maps",
            tipo: "mapa",
          });
        }
      }

      for (const b of meta.webSearchQueries ?? []) {
        const texto = limpiar(b, 120);
        if (!texto || busquedas.includes(texto)) continue;
        if (busquedas.length >= BUSQUEDAS_MAX) break;
        busquedas.push(texto);
      }
    },

    get hayAlgo() {
      return porUrl.size > 0 || busquedas.length > 0;
    },

    get fuentes(): Fuente[] {
      return [...porUrl.values()];
    },

    get busquedas(): string[] {
      return [...busquedas];
    },
  };
}

/* Lo que llega de la base de datos es una columna jsonb, así que puede
   ser cualquier cosa: null, un objeto a medias, o lo que guardó una
   versión anterior. Se valida antes de pintarlo. */
export function fuentesDesdeJson(valor: unknown): Fuente[] {
  if (!Array.isArray(valor)) return [];

  const salida: Fuente[] = [];
  for (const f of valor) {
    if (!f || typeof f !== "object") continue;
    const o = f as Record<string, unknown>;
    if (typeof o.url !== "string" || !o.url) continue;
    salida.push({
      titulo: typeof o.titulo === "string" ? o.titulo : o.url,
      url: o.url,
      dominio: typeof o.dominio === "string" ? o.dominio : dominioDe(o.url),
      tipo: o.tipo === "mapa" ? "mapa" : "web",
    });
    if (salida.length >= FUENTES_MAX) break;
  }
  return salida;
}

export function busquedasDesdeJson(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((b): b is string => typeof b === "string" && Boolean(b.trim()))
    .slice(0, BUSQUEDAS_MAX);
}
