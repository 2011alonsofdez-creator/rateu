import { cadenaDe, nombreModelo } from "@/lib/ia/config";
import { arrancar, type Trozo } from "@/lib/ia/proveedores";
import { buscarHechos } from "@/lib/ia/buscar";
import { construirPrompt } from "@/lib/ia/prompt";
import { loDeLosDiasAnteriores, recetaDe, type Tipo } from "@/lib/coworks/recetas";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";

/* EL MOTOR DE LOS CO-WORKS: el agente que trabaja mientras duermes.
 *
 * Aquí está lo que hacen todos igual. Lo que cambia de un tipo a otro
 * —qué se busca, cómo se escribe— está en recetas.ts, y esto no sabe
 * cuántos tipos hay: le dan uno y lo hace.
 *
 * Y tiene una regla que lo gobierna todo: LOS QUE BUSCAN, BUSCAN PRIMERO
 * Y ESCRIBEN DESPUÉS. Nunca al revés.
 *
 * El motivo es el fallo que más caro sale. A un modelo se le puede pedir
 * "cuéntame las novedades de X" y lo hace: escribe cinco viñetas
 * estupendas con cosas que pasaron cuando se entrenó, hace año y medio,
 * y con el tono de quien acaba de leer el periódico. Un resumen diario
 * hecho así no es un resumen malo: es una mentira diaria, puntual y
 * automática. Por eso, si la búsqueda no llega a hacerse, aquí no se
 * escribe nada y el Co-Work se marca como fallido. Es mejor un día sin
 * brief que un día con un brief inventado.
 *
 * Los que NO buscan (el repaso, el idioma) son otra cosa: no hay nada
 * que comprobar en internet sobre las ecuaciones de segundo grado, y ahí
 * lo que el modelo sabe es exactamente lo que hace falta.
 */

export type Brief = {
  texto: string;
  fuentes: Fuente[];
  busquedas: string[];
  modelo: string;
};

export type EncargoBrief = {
  /** Qué tipo de Co-Work es. Si no se dice, el resumen de siempre. */
  tipo?: Tipo;
  /** "IA, GTA 6, ofertas de PS5" */
  temas: string;
  /** Cómo se llama, para saludar. */
  duenio?: string;
  modoEdad: ModoEdad | null;
  tono: string;
  zona: string;
  /** Lo que se le mandó los días anteriores, para no repetirse. */
  anteriores?: string[];
  /** Para poder probarlo con una fecha fija. */
  hoy?: Date;
};

/** El día del año. Sirve para que los que no buscan roten de tema sin
 *  tener que acordarse de nada. */
function vueltaDelDia(hoy: Date, zona: string): number {
  const dia = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(hoy);

  const [a, m, d] = dia.split("-").map(Number);
  return Math.round(
    (Date.UTC(a, (m || 1) - 1, d || 1) - Date.UTC(a, 0, 1)) / 86_400_000,
  );
}

/** Escribe lo de hoy. Devuelve null si no se pudo (o no se debió). */
export async function redactarBrief(encargo: EncargoBrief): Promise<Brief | null> {
  const hoy = encargo.hoy ?? new Date();
  const temas = encargo.temas.trim();
  if (!temas) return null;

  const receta = recetaDe(encargo.tipo);

  const contexto = {
    temas,
    fecha: new Intl.DateTimeFormat("es-ES", {
      timeZone: encargo.zona,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(hoy),
    anteriores: encargo.anteriores,
    vuelta: vueltaDelDia(hoy, encargo.zona),
  };

  /* 1. Buscar, si este tipo busca. Y si busca y no se ha buscado de
        verdad, se acabó: `buscarHechos` solo devuelve `busco: true`
        cuando Google ha dado páginas o consultas, así que aquí no cuela
        un recuerdo disfrazado. */
  let hallazgo: Awaited<ReturnType<typeof buscarHechos>> = null;

  if (receta.busca) {
    hallazgo = await buscarHechos(
      receta.pregunta?.(contexto) ?? temas,
      "",
      encargo.modoEdad,
    ).catch(() => null);

    if (!hallazgo || !hallazgo.busco) return null;

    if (!hallazgo.hechos.trim()) {
      /* Se buscó y no había nada. Eso NO es un fallo: es la noticia del
         día. Se escribe igual, y sale gratis en modelos porque no hace
         falta llamar a nadie más. */
      return {
        texto: receta.sinNada?.(temas) ?? `He mirado y hoy no hay nada nuevo sobre ${temas}.`,
        fuentes: hallazgo.fuentes,
        busquedas: hallazgo.busquedas,
        // Con su nombre bonito, igual que el otro camino: el identificador
        // crudo en la etiqueta solo saldría los días sin novedades.
        modelo: nombreModelo(hallazgo.modelo),
      };
    }
  }

  /* 2. Escribirlo, con los hechos delante si los hay. */
  const sistema =
    construirPrompt({
      modoEdad: encargo.modoEdad,
      tono: encargo.tono,
      nombre: encargo.duenio,
      nivel: "normal",
      conBusqueda: false,
      zonaHoraria: encargo.zona,
      hechos: hallazgo?.hechos,
    }) +
    receta.comoEscribirlo +
    loDeLosDiasAnteriores(encargo.anteriores);

  const cadena = cadenaDe("normal", encargo.modoEdad);
  if (!cadena.length) return null;

  for (const candidato of cadena.slice(0, 4)) {
    try {
      const arranque = await arrancar({
        id: candidato,
        sistema,
        mensajes: [{ rol: "user", texto: receta.encargo(contexto) }],
        maxSalida: 4000,
        esfuerzo: "medio",
        modoEdad: encargo.modoEdad,
        pensar: -1,
      });

      let texto = "";
      const trozos: Trozo[] = [];
      if (arranque.primero) trozos.push(arranque.primero);
      while (true) {
        const siguiente = await arranque.resto.next();
        if (siguiente.done) break;
        if (siguiente.value) trozos.push(siguiente.value as Trozo);
      }

      const masFuentes: Fuente[] = [];
      for (const t of trozos) {
        if ("fuentes" in t) masFuentes.push(...t.fuentes);
        else texto += t.texto;
      }

      texto = texto.trim();
      if (!texto) continue;

      // Las de la búsqueda y las que haya añadido el que escribe, sin repetir.
      const deLaBusqueda = hallazgo?.fuentes ?? [];
      const vistas = new Set(deLaBusqueda.map((f) => f.url));
      const fuentes = [...deLaBusqueda, ...masFuentes.filter((f) => !vistas.has(f.url))];

      return {
        texto,
        fuentes,
        busquedas: hallazgo?.busquedas ?? [],
        modelo: nombreModelo(candidato),
      };
    } catch {
      // Se prueba con el siguiente de la cadena.
    }
  }

  return null;
}

/** El título de la conversación que queda en la barra lateral. */
export function tituloDelBrief(nombre: string, hoy: Date, zona: string): string {
  const dia = new Intl.DateTimeFormat("es-ES", {
    timeZone: zona,
    day: "numeric",
    month: "short",
  }).format(hoy);

  return `${nombre || "Daily Brief"} · ${dia}`;
}
