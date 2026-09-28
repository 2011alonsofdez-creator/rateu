import { cadenaDe, nombreModelo } from "@/lib/ia/config";
import { arrancar, type Trozo } from "@/lib/ia/proveedores";
import { buscarHechos } from "@/lib/ia/buscar";
import { construirPrompt } from "@/lib/ia/prompt";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";

/* El Daily Brief: el agente que trabaja mientras duermes.
 *
 * Es el primer Co-Work de verdad, y tiene una regla que lo gobierna
 * todo: BUSCA PRIMERO Y ESCRIBE DESPUÉS. Nunca al revés.
 *
 * El motivo es el fallo que más caro sale. A un modelo se le puede pedir
 * "cuéntame las novedades de X" y lo hace: escribe cinco viñetas
 * estupendas con cosas que pasaron cuando se entrenó, hace año y medio,
 * y con el tono de quien acaba de leer el periódico. Un resumen diario
 * hecho así no es un resumen malo: es una mentira diaria, puntual y
 * automática. Por eso, si la búsqueda no llega a hacerse, aquí no se
 * escribe nada y el Co-Work se marca como fallido. Es mejor un día sin
 * brief que un día con un brief inventado.
 */

export type Brief = {
  texto: string;
  fuentes: Fuente[];
  busquedas: string[];
  modelo: string;
};

export type EncargoBrief = {
  /** "IA, GTA 6, ofertas de PS5" */
  temas: string;
  /** Cómo se llama, para saludar. */
  duenio?: string;
  modoEdad: ModoEdad | null;
  tono: string;
  zona: string;
  /** Para poder probarlo con una fecha fija. */
  hoy?: Date;
};

/** Lo que se le manda al buscador. */
function preguntaDeBusqueda(temas: string, hoy: Date, zona: string): string {
  const fecha = new Intl.DateTimeFormat("es-ES", {
    timeZone: zona,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(hoy);

  return (
    `Novedades de las últimas 48 horas, a ${fecha}, sobre estos temas: ${temas}.\n` +
    `De cada tema: qué ha pasado, cuándo, y el dato concreto (cifra, fecha, precio, nombre). ` +
    `Si de algún tema no hay nada nuevo, dilo en una línea en vez de rellenar.`
  );
}

const COMO_ESCRIBIRLO = `

## LO QUE ESTÁS ESCRIBIENDO AHORA

Un resumen diario. Nadie te ha preguntado nada: esto se lo encuentra al
despertarse, así que empieza por lo que ha pasado, sin saludar ni
presentarte ni explicar lo que vas a hacer.

Cómo va:
- Una línea de arriba, corta, con lo más gordo del día. Si no hay nada
  gordo, esa línea lo dice.
- Después, un apartado por tema, con su título en negrita y de una a
  tres viñetas. Solo los temas que TENGAN algo; los que no, van juntos
  al final en una línea: "Sin novedades en: X, Y".
- Cada viñeta, una frase o dos. Esto se lee de pie, con el café.
- Las cifras, fechas, precios y nombres, EXACTOS, como aparecen en lo
  que has buscado. Sin redondear.
- Si dos fuentes se contradicen, ponlo: "hay dos versiones".

Lo que no se hace:
- No inventes NADA. Lo que no esté en lo que acabas de buscar, no
  existe. Un resumen diario que se inventa un dato hace más daño que no
  existir, porque se lee cada mañana y se cree.
- No digas "según mis datos" ni "parece que". O lo has encontrado, o no.
- No cierres con resúmenes del resumen, ni con "¿quieres que profundice
  en algo?". Se acaba cuando se acaba.
- No pongas los enlaces en el texto: las fuentes van aparte, debajo, y
  las pone la web.`;

/** Escribe el resumen del día. Devuelve null si no se pudo buscar. */
export async function redactarBrief(encargo: EncargoBrief): Promise<Brief | null> {
  const hoy = encargo.hoy ?? new Date();
  const temas = encargo.temas.trim();
  if (!temas) return null;

  /* 1. Buscar. Y si no se ha buscado de verdad, se acabó: `buscarHechos`
        solo devuelve `busco: true` cuando Google ha dado páginas o
        consultas, así que aquí no cuela un recuerdo disfrazado. */
  const hallazgo = await buscarHechos(
    preguntaDeBusqueda(temas, hoy, encargo.zona),
    "",
    encargo.modoEdad,
  ).catch(() => null);

  if (!hallazgo || !hallazgo.busco) return null;
  if (!hallazgo.hechos.trim()) {
    /* Se buscó y no había nada. Eso NO es un fallo: es la noticia del
       día. Se escribe igual, y sale gratis en modelos porque no hace
       falta llamar a nadie más. */
    return {
      texto: sinNovedades(temas),
      fuentes: hallazgo.fuentes,
      busquedas: hallazgo.busquedas,
      // Con su nombre bonito, igual que el otro camino: el identificador
      // crudo en la etiqueta solo saldría los días sin novedades.
      modelo: nombreModelo(hallazgo.modelo),
    };
  }

  /* 2. Escribirlo, con los hechos delante. */
  const sistema =
    construirPrompt({
      modoEdad: encargo.modoEdad,
      tono: encargo.tono,
      nombre: encargo.duenio,
      nivel: "normal",
      conBusqueda: false,
      zonaHoraria: encargo.zona,
      hechos: hallazgo.hechos,
    }) + COMO_ESCRIBIRLO;

  const cadena = cadenaDe("normal", encargo.modoEdad);
  if (!cadena.length) return null;

  for (const candidato of cadena.slice(0, 4)) {
    try {
      const arranque = await arrancar({
        id: candidato,
        sistema,
        mensajes: [
          {
            rol: "user",
            texto:
              `Escribe el resumen de hoy sobre: ${temas}\n\n` +
              `Usa solo lo que has buscado. Si de un tema no hay nada, dilo.`,
          },
        ],
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
      const vistas = new Set(hallazgo.fuentes.map((f) => f.url));
      const fuentes = [
        ...hallazgo.fuentes,
        ...masFuentes.filter((f) => !vistas.has(f.url)),
      ];

      return {
        texto,
        fuentes,
        busquedas: hallazgo.busquedas,
        modelo: nombreModelo(candidato),
      };
    } catch {
      // Se prueba con el siguiente de la cadena.
    }
  }

  return null;
}

/** El día que no hay nada. Se dice y ya está: es una respuesta válida. */
function sinNovedades(temas: string): string {
  return `He mirado y hoy no hay nada nuevo sobre ${temas}.\n\nMañana vuelvo a mirar.`;
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
