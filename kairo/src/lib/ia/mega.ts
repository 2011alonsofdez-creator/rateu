import { arrancar, partir, type Peticion, type Trozo } from "./proveedores";
import { nombreModelo } from "./config";
import type { ModoEdad } from "@/lib/planes";
import type { Adjunto, Fuente } from "@/lib/tipos";

/* El Mega-Prompt, de verdad.
 *
 * Hasta ahora MEGA era el nivel Forja con el modelo más caro y el techo
 * de salida más alto: una sola opinión, mejor pagada. La portada
 * prometía otra cosa —«lanza los tres modelos a la vez y combina lo
 * mejor de cada respuesta»— y eso es lo que hace esto.
 *
 * Cómo funciona:
 *
 *   1. Se elige un equipo: hasta tres modelos, y de casas distintas
 *      siempre que se pueda. Tres respuestas del mismo sitio se parecen
 *      demasiado entre sí para que compararlas sirva de algo.
 *   2. Se les pregunta A LA VEZ. En paralelo tarda lo que tarde el más
 *      lento, no la suma; en serie no cabría en el tiempo que tiene una
 *      función de servidor para responder.
 *   3. El que llegue tarde se queda fuera. Con dos respuestas ya hay algo
 *      que comparar, y es mejor que esperar a la tercera hasta que la
 *      petición se caiga entera.
 *   4. Uno de ellos recibe las respuestas sin nombre y escribe la
 *      definitiva. Esa última sí va en streaming: es la que se lee.
 *
 * Y si solo contesta uno, se enseña la suya tal cual. Combinar una sola
 * respuesta es pagar un modelo más por reescribir lo que ya estaba bien.
 */

export type Mensaje = { rol: "user" | "kairo"; texto: string; adjuntos?: Adjunto[] };

export type PasoMega =
  /** Quiénes van a contestar, con su nombre bonito. */
  | { t: "equipo"; modelos: string[]; combina: string }
  /** En qué va: preguntando, comparando o combinando. */
  | { t: "paso"; v: "consultando" | "comparando" }
  | { t: "fuentes"; fuentes: Fuente[]; busquedas: string[] }
  | { t: "texto"; v: string };

export type OpcionesMega = {
  /** La cadena del nivel, ya filtrada por claves y por edad. */
  cadena: string[];
  /** El prompt de sistema para un modelo concreto (cambia si sabe buscar). */
  prompt: (id: string) => string;
  mensajes: Mensaje[];
  modoEdad: ModoEdad | null;
  /** Cuánto se espera a los candidatos antes de seguir sin los que falten. */
  msParaCandidatos?: number;
  /** Techo de salida de la respuesta final. */
  maxSalida?: number;
  /* Aviso de que un modelo ha fallado, con el error tal cual.
   *
   * Aquí los fallos no paran nada —para eso se pregunta a varios—, pero
   * quien llama sí necesita enterarse: es quien aparta al modelo un rato
   * (la cuarentena) y quien sabe traducir un 429 a "vuelve mañana". Sin
   * esto, un modelo con la cuota del día agotada se lleva un sitio del
   * equipo en CADA mensaje y el usuario nunca sabe por qué. */
  alFallar?: (id: string, error: unknown) => void;
};

/* Lo que se le dice al que combina. Va pegado al prompt de siempre, así
   que conserva el tono, la edad, la fecha y las Mentes: esto solo añade
   el encargo nuevo. */
const COMBINAR = `

## LO QUE ESTÁS HACIENDO AHORA

Al final de la conversación tienes varias respuestas a la misma pregunta,
escritas por separado y sin decir quién escribió cada una. Van sin nombre
a propósito: ninguna vale más por venir primero.

Tu trabajo es escribir LA respuesta, una sola:

- Quédate con lo que esté bien de cada una y tira el resto.
- Un dato concreto que solo tenga una —una cifra, una fecha, un nombre,
  una dirección, un enlace— se queda, copiado exactamente igual.
- Si se contradicen en algo que importa, dilo en una línea ("hay dos
  versiones: ...") en vez de elegir a escondidas.
- Lo que afirme una sola y las demás no sostengan, fuera. Inventarse algo
  es el fallo que esto viene a evitar.
- Si todas dicen lo mismo, no lo repitas tres veces: dilo una, mejor.
- No hables de las respuestas, ni de que eran varias, ni de modelos, ni
  de que estás combinando nada. Quien lee solo ve lo que escribas tú.
- En el idioma de la pregunta.`;

/** Lo que devolvió un modelo, entero. */
type Respuesta = {
  id: string;
  texto: string;
  fuentes: Fuente[];
  busquedas: string[];
};

/* El equipo: de casas distintas mientras las haya.
 *
 * Preguntarle tres veces a la misma casa da tres respuestas parecidas, y
 * comparar respuestas parecidas no descubre nada. Cuando solo hay una
 * casa —o en modo niño, donde solo entra Gemini— se completa con modelos
 * distintos de esa misma casa, que al menos no son el mismo. */
export function elegirEquipo(cadena: string[], maximo = 3): string[] {
  const equipo: string[] = [];
  const casas = new Set<string>();

  for (const id of cadena) {
    const { proveedor } = partir(id);
    if (casas.has(proveedor)) continue;
    casas.add(proveedor);
    equipo.push(id);
    if (equipo.length >= maximo) return equipo;
  }

  for (const id of cadena) {
    if (equipo.includes(id)) continue;
    equipo.push(id);
    if (equipo.length >= maximo) break;
  }

  return equipo;
}

/* Le pregunta a un modelo y espera a que termine del todo.
 *
 * `rendirse` es el interruptor común: cuando el que llama ya no espera a
 * nadie más, el que iba tarde deja de leer y CIERRA su flujo. Sin eso, el
 * proveedor sigue generando —y cobrando— una respuesta que ya nadie va a
 * mirar, y la función de servidor sigue despierta aguantándola. */
async function recoger(pet: Peticion, rendirse: { ya: boolean }): Promise<Respuesta> {
  const arranque = await arrancar(pet);

  let texto = "";
  const fuentes: Fuente[] = [];
  const busquedas: string[] = [];

  const tratar = (trozo: Trozo | undefined) => {
    if (!trozo) return;
    if ("fuentes" in trozo) {
      fuentes.push(...trozo.fuentes);
      busquedas.push(...trozo.busquedas);
    } else if (trozo.texto) {
      texto += trozo.texto;
    }
  };

  tratar(arranque.primero);
  while (!rendirse.ya) {
    const siguiente = await arranque.resto.next();
    if (siguiente.done) break;
    tratar(siguiente.value as Trozo);
  }

  if (rendirse.ya) {
    try {
      await arranque.resto.return?.(undefined);
    } catch {
      /* ya se había cerrado por su cuenta */
    }
  }

  return { id: pet.id, texto: texto.trim(), fuentes, busquedas };
}

/* Se rinde al cabo de un rato. Al que llega tarde se le deja atrás.
 *
 * El temporizador se apaga en cuanto se decide la carrera: si no, queda
 * armado hasta el final aunque los tres hayan contestado en tres
 * segundos, y en una función de servidor eso es tenerla despierta
 * esperando a nada. */
function conPrisa<T>(promesa: Promise<T>, ms: number): Promise<T | null> {
  let reloj: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promesa,
    new Promise<null>((listo) => {
      reloj = setTimeout(() => listo(null), ms);
    }),
  ]).finally(() => {
    if (reloj !== undefined) clearTimeout(reloj);
  });
}

/** Las respuestas, sin nombre y numeradas, para el que las combina. */
function dossier(respuestas: Respuesta[]): string {
  const partes = respuestas.map(
    (r, i) => `### Respuesta ${i + 1}\n\n${r.texto}`,
  );

  return (
    `[Material de trabajo, no es un mensaje de la persona]\n\n` +
    `Estas son las ${respuestas.length} respuestas a la pregunta anterior. ` +
    `Escribe ahora la definitiva siguiendo lo que se te ha dicho.\n\n` +
    partes.join("\n\n---\n\n")
  );
}

/** Junta fuentes de varios sitios sin repetir la misma dirección. */
function unir(respuestas: Respuesta[]) {
  const fuentes: Fuente[] = [];
  const vistas = new Set<string>();
  const busquedas = new Set<string>();

  for (const r of respuestas) {
    for (const f of r.fuentes) {
      if (vistas.has(f.url)) continue;
      vistas.add(f.url);
      fuentes.push(f);
    }
    for (const b of r.busquedas) busquedas.add(b);
  }

  return { fuentes, busquedas: [...busquedas] };
}

/** Lanza el Mega-Prompt y va soltando lo que pasa. */
export async function* correrMega(op: OpcionesMega): AsyncGenerator<PasoMega> {
  const equipo = elegirEquipo(op.cadena);
  if (!equipo.length) throw new Error("mega: no hay ningún modelo disponible");

  const maxSalida = op.maxSalida ?? 16000;

  /* Un modelo solo: no hay nada que combinar, así que MEGA se comporta
     como el nivel de siempre con el mejor modelo que haya. */
  if (equipo.length === 1) {
    yield { t: "equipo", modelos: [nombreModelo(equipo[0])], combina: nombreModelo(equipo[0]) };
    yield* soloUno(equipo[0], op, maxSalida);
    return;
  }

  yield {
    t: "equipo",
    modelos: equipo.map(nombreModelo),
    combina: nombreModelo(equipo[0]),
  };
  yield { t: "paso", v: "consultando" };

  /* En cuanto se sabe quién ha llegado, al que no se le deja de esperar y
     se le cierra el grifo. Se comparte entre los tres encargos. */
  const rendirse = { ya: false };
  /* El último error de verdad, para poder subirlo si no contesta nadie. */
  let ultimoFallo: unknown;

  /* A los candidatos se les pide una respuesta completa pero no
     interminable: lo que escriban no se enseña, se funde. El espacio
     largo se lo queda la respuesta final, que es la que se lee. */
  const encargos = equipo.map((id) =>
    conPrisa(
      recoger(
        {
          id,
          sistema: op.prompt(id),
          mensajes: op.mensajes,
          maxSalida: 6000,
          esfuerzo: "alto",
          modoEdad: op.modoEdad,
          pensar: 8192,
        },
        rendirse,
      ),
      op.msParaCandidatos ?? 32_000,
    ).catch((e) => {
      /* Que uno falle no para el Mega-Prompt, pero quien llama tiene que
         saberlo: es el que aparta al modelo un rato y el que sabe decir
         "cuota agotada" en vez de "algo ha ido mal". */
      op.alFallar?.(id, e);
      ultimoFallo = e;
      return null;
    }),
  );

  const llegadas = await Promise.all(encargos);
  rendirse.ya = true;
  const respuestas = llegadas.filter((r): r is Respuesta => Boolean(r?.texto));

  /* Ninguno ha contestado. Se sube el error de verdad del último que
     falló, no uno inventado: dentro va el código de estado, y es lo que
     convierte "algo ha ido mal" en "se ha agotado la cuota del día". */
  if (!respuestas.length) {
    throw ultimoFallo ?? new Error("mega: ningún modelo ha contestado a tiempo");
  }

  const { fuentes, busquedas } = unir(respuestas);
  if (fuentes.length || busquedas.length) yield { t: "fuentes", fuentes, busquedas };

  /* Solo ha llegado uno: se enseña lo suyo. Pasarlo por el combinador
     sería pagar otro modelo para que reescriba una respuesta que ya
     está escrita, y de paso arriesgarse a que la empeore. */
  if (respuestas.length === 1) {
    yield { t: "texto", v: respuestas[0].texto };
    return;
  }

  /* De aquí al final hay una sola espera —la del que combina— y dentro
     de ella pasan dos cosas: leer las respuestas y escribir la buena.
     Se avisa una vez y es la pantalla la que va pasando de "comparando"
     a "combinando", en vez de mandar dos avisos con nada en medio. */
  yield { t: "paso", v: "comparando" };

  /* Quién combina: uno de los que SÍ han contestado, y por el orden de la
     cadena. Pedírselo al primero del equipo sin mirar era el fallo gordo:
     si ese es justo el que acaba de devolver un 429, se le vuelve a
     preguntar, vuelve a fallar, y se tira a la basura el trabajo bueno de
     los otros dos. Si el primero tampoco puede ahora, lo intenta el
     siguiente. Las respuestas le llegan numeradas y sin firma, así que no
     puede reconocer la suya para protegerla. */
  const jueces = equipo.filter((id) => respuestas.some((r) => r.id === id));
  const conversacion: Mensaje[] = [
    ...op.mensajes,
    { rol: "user", texto: dossier(respuestas) },
  ];

  for (const juez of jueces) {
    let final;
    try {
      final = await arrancar({
        id: juez,
        sistema: op.prompt(juez) + COMBINAR,
        mensajes: conversacion,
        maxSalida,
        esfuerzo: "maximo",
        modoEdad: op.modoEdad,
        pensar: 16384,
      });
    } catch (e) {
      op.alFallar?.(juez, e);
      continue;
    }

    yield* soltar(final);
    return;
  }

  /* Nadie puede combinar. Antes que perder tres respuestas buenas por no
     tener quien las junte, se enseña la del primero de la cadena que
     contestó: es peor que la combinada, y muchísimo mejor que un error. */
  yield { t: "texto", v: respuestas[0].texto };
}

/** Va soltando lo que escribe un modelo, trozo a trozo. */
async function* soltar(arranque: Awaited<ReturnType<typeof arrancar>>): AsyncGenerator<PasoMega> {
  const tratar = function* (trozo: Trozo | undefined) {
    if (!trozo) return;
    if ("fuentes" in trozo) {
      if (trozo.fuentes.length || trozo.busquedas.length) {
        yield { t: "fuentes", fuentes: trozo.fuentes, busquedas: trozo.busquedas } as PasoMega;
      }
    } else if (trozo.texto) {
      yield { t: "texto", v: trozo.texto } as PasoMega;
    }
  };

  yield* tratar(arranque.primero);
  while (true) {
    const siguiente = await arranque.resto.next();
    if (siguiente.done) return;
    yield* tratar(siguiente.value as Trozo);
  }
}

/** Con un solo cerebro conectado, MEGA es el de siempre a todo trapo. */
async function* soloUno(id: string, op: OpcionesMega, maxSalida: number): AsyncGenerator<PasoMega> {
  const arranque = await arrancar({
    id,
    sistema: op.prompt(id),
    mensajes: op.mensajes,
    maxSalida,
    esfuerzo: "maximo",
    modoEdad: op.modoEdad,
    pensar: 24576,
  });

  yield* soltar(arranque);
}
