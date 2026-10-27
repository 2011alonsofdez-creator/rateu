import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { ajustesSeguridad } from "./seguridad";
import { recolectorDeFuentes } from "./grounding";
import { cadenaDe } from "./config";
import { clavesDeGemini, esDeCuota } from "./claves";
import { limpiarFallo } from "./fallos";
import { partir } from "./proveedores";
import { articulosDe, comoFuentes, comoHechos } from "./wikipedia";
import { hayBuscadorPagado, modeloDeBusqueda, preguntarConBuscador } from "./buscar-web";
import type { ModoEdad } from "@/lib/planes";
import type { Fuente } from "@/lib/tipos";

/* Buscar ANTES de contestar.
 *
 * Darle un buscador a un modelo y esperar que lo use es como dejar un
 * diccionario encima de la mesa: ahí se queda. Esto hace la búsqueda
 * por su cuenta, antes de que el modelo abra la boca, y le pone los
 * resultados delante. A partir de ahí, contestar sin mirar ya no es una
 * opción que tenga.
 *
 * Es una llamada aparte y corta —un modelo rápido, sin pensar, con el
 * buscador puesto— así que cuesta un segundo o dos. Solo se hace cuando
 * la pregunta lo pide (ver `ahora.ts`).
 */

/* EL DIARIO DE LA BÚSQUEDA.
 *
 * Opcional, y solo lo pide la pantalla de revisión. Existe porque este
 * bucle se come todos los fallos en silencio —tiene que hacerlo: si un
 * modelo se cae, se prueba el siguiente y el usuario no tiene por qué
 * enterarse— y eso deja un agujero: cuando NINGUNO funciona, desde
 * fuera se ve exactamente igual que cuando todo va bien y no había nada
 * que encontrar.
 *
 * Con esto, "sigue desactualizado" deja de ser una sospecha y pasa a ser
 * una línea que dice qué modelo, cuánto tardó y en qué falló. */
export type Diario = {
  modelos: string[];
  intentos: { modelo: string; ms: number; resultado: string }[];
};

export type Hallazgo = {
  /** Los hechos encontrados, en viñetas. Vacío si no encontró nada. */
  hechos: string;
  fuentes: Fuente[];
  busquedas: string[];
  modelo: string;
  /** Si llegó a buscar DE VERDAD. Esto no es un detalle: ver abajo. */
  busco: boolean;
};

const SISTEMA = `Eres el buscador de Kairo. No hablas con nadie: recoges datos.

Te dan una pregunta y devuelves SOLO lo que encuentres buscando, así:
- Un dato por línea, empezando por guion.
- Cada línea con su fecha cuando la haya ("a 26/09/2026", "temporada 2026").
- Nombres propios, cifras, direcciones y horarios EXACTOS, como los has
  encontrado. Nada de redondear ni de reescribir.
- Si dos fuentes se contradicen, pon las dos y dilo.

Reglas:
- BUSCA. Siempre, sin excepción, aunque estés convencido de saberlo y
  aunque la pregunta te parezca absurda o creas que la respuesta es "eso
  no existe". Una respuesta tuya sin haber usado el buscador no vale
  para nada y se tira.
- No contestes a la persona, no saludes, no expliques, no resumas por
  encima: solo los datos.
- Si buscas y no hay nada sólido, responde exactamente: NADA ENCONTRADO
- Jamás te inventes un dato para rellenar. Un sitio, un precio o una
  fecha que no aparezcan en los resultados no existen.`;

/* Lo que como mucho puede tardar la búsqueda entera.
 *
 * Buscar antes de contestar es lo que evita que Kairo te diga que el GTA
 * 6 no tiene fecha. Pero es tiempo que se suma DELANTE de la primera
 * palabra, y una búsqueda lenta se nota más que una respuesta regular.
 *
 * Esto estuvo en nueve segundos y era demasiado poco. Una búsqueda con
 * Google por detrás se va a diez o doce sin que pase nada raro, así que
 * el tope no recortaba las lentas: recortaba las normales, y cada vez
 * que recortaba una, Kairo contestaba de memoria. Es decir: el tope
 * puesto para que fuera más rápido lo que hacía era devolverle el fallo
 * que veníamos de arreglar, y encima en silencio.
 *
 * Dieciocho deja hueco de sobra para las normales y sigue cortando las
 * que se han colgado, que es lo único que tenía que cortar. */
const PLAZO = 18_000;

const conPlazo = <T>(promesa: Promise<T>, ms: number): Promise<T | null> => {
  let reloj: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promesa,
    new Promise<null>((listo) => {
      reloj = setTimeout(() => listo(null), ms);
    }),
  ]).finally(() => {
    if (reloj !== undefined) clearTimeout(reloj);
  });
};

/** Busca en internet lo que haga falta para contestar la pregunta. */
export async function buscarHechos(
  pregunta: string,
  contexto: string,
  modoEdad: ModoEdad | null,
  diario?: Diario,
): Promise<Hallazgo | null> {
  const hoy = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  /* Lo que se devuelve si NINGÚN modelo llega a buscar: hechos vacíos,
     que es lo que hace que Kairo diga "he mirado y no lo he
     encontrado" en vez de soltar lo que recordaba. */
  let sinBuscar: Hallazgo | null = null;

  /* Y lo otro, que no es lo mismo: BUSCÓ Y NO ENCONTRÓ.
   *
   * Durante un tiempo esto se devolvía directamente y ahí se acababa
   * todo. Parecía razonable —ha buscado, no está, se dice y ya— y es
   * justo el caso que dejaba a Kairo peor que cualquier buscador:
   * preguntándole cómo quedó el Madrid ayer, Google le devolvía cuatro
   * noticias de alrededor del partido (una de Mourinho, otra de que el
   * Barça se reagrupa tras el clásico) y ninguna con el resultado. Y
   * Kairo contestaba "lo he buscado y no lo he encontrado", con sus
   * cuatro fuentes debajo, mientras el resultado estaba a un clic.
   *
   * "No está en internet" es una afirmación demasiado grande para
   * sacarla de que un buscador no lo haya visto. Así que esto se guarda
   * y se sigue bajando; solo se devuelve si NINGUNO lo encuentra, que
   * entonces sí es verdad. */
  let vacio: Hallazgo | null = null;

  const claves = clavesDeGemini();

  /* Sin clave de Gemini no se abandona: se baja directo al de repuesto.
     Antes se devolvía null aquí mismo, y eso dejaba una casa montada con
     Claude y sin Gemini completamente ciega —buscador puesto, pagado y
     sin usar— por un `return` colocado demasiado arriba. */
  if (!claves.length) {
    if (diario)
      diario.intentos.push({
        modelo: "—",
        ms: 0,
        resultado: "sin GEMINI_API_KEY",
      });
    /* Aquí Gemini no ha gastado nada, así que el repuesto se lleva el
       plazo entero. Pero se lo lleva CON plazo: una llamada colgada sin
       techo se come el minuto de la función y deja al usuario sin
       respuesta en vez de con una peor. */
    return deRepuesto(pregunta, contexto, hoy, modoEdad, PLAZO, diario);
  }

  /* TODA la cadena de Gemini, no los tres primeros.
   *
   * Los tres primeros era un apaño para no tardar, y el apaño se basaba
   * en que un intento cuesta tiempo. No es verdad: un intento que FALLA
   * cuesta ciento cincuenta milisegundos. Los que cuestan son los que
   * funcionan, y de esos solo hace falta uno.
   *
   * Y falla más de lo que parecía. En la capa gratuita de Gemini la
   * cuota es POR MODELO, así que un día normal hay media cadena agotada;
   * si además alguno ha dejado de existir, con tres intentos se acaban
   * las balas antes de llegar a uno vivo. Y entonces no se busca, y
   * entonces Kairo contesta de memoria.
   *
   * Ocho intentos fallidos son poco más de un segundo. Vale la pena. */
  const modelos = cadenaDe("normal", modoEdad)
    .filter((id) => partir(id).proveedor === "gemini")
    .map((id) => partir(id).modelo)
    .slice(0, 8);

  if (diario) diario.modelos = [...modelos];

  if (!modelos.length) {
    if (diario) {
      diario.intentos.push({
        modelo: "—",
        ms: 0,
        resultado: "ningún modelo de Gemini en la cadena",
      });
    }
    /* Aquí Gemini no ha gastado nada, así que el repuesto se lleva el
       plazo entero. Pero se lo lleva CON plazo: una llamada colgada sin
       techo se come el minuto de la función y deja al usuario sin
       respuesta en vez de con una peor. */
    return deRepuesto(pregunta, contexto, hoy, modoEdad, PLAZO, diario);
  }

  /* Un cliente por clave, creados una vez. Si solo hay una, esto es
     exactamente lo de antes. */
  const motores = claves.map((c) => new GoogleGenAI({ apiKey: c }));

  const seAcaba = Date.now() + PLAZO;

  /* La misma petición, con el motor que se le dé. Está aquí dentro y no
     fuera porque necesita la pregunta, el contexto y el día, que son de
     esta llamada. */
  const preguntarA = (motor: GoogleGenAI, modelo: string) =>
    motor.models.generateContent({
      model: modelo,
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `Hoy es ${hoy}.\n` +
                (contexto ? `De qué venían hablando: ${contexto}\n` : "") +
                `\nUsa el buscador y dime qué encuentras sobre esto:\n${pregunta.slice(0, 1500)}` +
                `\n\nNo contestes de memoria. Busca primero, aunque creas que ya lo sabes.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SISTEMA,
        safetySettings: ajustesSeguridad(modoEdad),
        /* Que piense, pero con la cuenta hecha.
 
               Aquí hay una trampa de Gemini que cuesta cara: lo que el
               modelo PIENSA se descuenta de `maxOutputTokens`. No son dos
               presupuestos, es uno. Así que "que piense lo que quiera"
               (-1) junto a un techo corto es una forma elegante de pedir
               una respuesta vacía: se gasta el techo entero pensando,
               llega al límite y devuelve cero texto. Sin error, sin
               excepción, sin nada. Solo vacío.
 
               Y vacío aquí significa "he buscado y no he encontrado
               nada", que es mentira: no ha encontrado nada porque no le
               han dejado escribirlo. La respuesta sale de memoria y con
               aplomo, que es justo lo que esto venía a impedir.
 
               Con el presupuesto a cero tampoco vale —sin pensar ni
               siquiera usa el buscador—, así que se le pone una cifra:
               suficiente para decidir buscar, corta para no eternizarse,
               y un techo que la deja muy atrás para que lo que escriba
               quepa entero. */
        thinkingConfig: { thinkingBudget: 512 },
        maxOutputTokens: 2500,
        tools: [{ googleSearch: {} }],
      },
    });

  /* Y probándola con cada clave.
 
     Solo se cambia de clave si el fallo es de CUOTA: un 404 —ese modelo
     ya no existe— o un 400 —la petición está mal— van a fallar igual con
     todas, y recorrerlas enteras solo sirve para tardar cinco veces más
     en dar el mismo error. */
  const conLasClaves = async (modelo: string, plazo: number) => {
    let fallo: unknown = null;

    for (let k = 0; k < motores.length; k++) {
      try {
        return {
          respuesta: await conPlazo(preguntarA(motores[k], modelo), plazo),
          clave: k,
        };
      } catch (e) {
        fallo = e;
        if (!esDeCuota(e) || k === motores.length - 1) break;
        if (diario) {
          diario.intentos.push({
            modelo,
            ms: 0,
            resultado: `clave ${k + 1} sin cuota, probando con la ${k + 2}`,
          });
        }
      }
    }

    throw fallo;
  };

  for (const modelo of modelos) {
    const queda = seAcaba - Date.now();
    // Menos de dos segundos no da ni para empezar: mejor contestar ya.
    if (queda < 2000) {
      if (diario)
        diario.intentos.push({
          modelo,
          ms: 0,
          resultado: "sin tiempo para empezar",
        });
      break;
    }

    const empezo = Date.now();
    try {
      const fuentes = recolectorDeFuentes();

      const { respuesta, clave: queClave } = await conLasClaves(modelo, queda);

      // Se acabó el tiempo: mejor sin datos que tarde.
      if (!respuesta) {
        if (diario) {
          diario.intentos.push({
            modelo,
            ms: Date.now() - empezo,
            resultado: `se acabó el plazo de ${PLAZO / 1000}s`,
          });
        }
        break;
      }

      fuentes.anadir(respuesta.candidates?.[0]?.groundingMetadata);
      const texto = (respuesta.text ?? "").trim();

      /* ¿Buscó de verdad? La prueba no es lo que diga, es si Google
         devolvió algo: páginas consultadas o consultas hechas. Si no
         hay ni una cosa ni la otra, ha contestado de memoria.
         Y eso NO se puede dar por bueno: su texto llega al prompt
         anunciado como "lo que acabas de buscar en internet", así que
         pasarlo tal cual convertiría un recuerdo viejo en un hecho
         recién comprobado. Es peor que no buscar: es blanquearlo.
         Se prueba con otro modelo, y si ninguno busca, se dice que no
         se ha encontrado nada, que es la verdad. */
      const busco = fuentes.fuentes.length > 0 || fuentes.busquedas.length > 0;

      if (!busco) {
        if (diario) {
          diario.intentos.push({
            modelo,
            ms: Date.now() - empezo,
            resultado: texto
              ? "NO buscó: contestó de memoria (se descarta)"
              : "NO buscó y encima devolvió texto vacío",
          });
        }
        sinBuscar = {
          hechos: "",
          fuentes: [],
          busquedas: [],
          modelo,
          busco: false,
        };
        continue;
      }

      if (diario) {
        diario.intentos.push({
          modelo,
          ms: Date.now() - empezo,
          resultado: !texto
            ? /* Buscó (hay rastro en Google) pero no escribió nada. Casi
                 siempre es el techo de tokens: lo que piensa se descuenta
                 de ahí, y si se lo gasta pensando no le queda para
                 escribir. Se distingue de "no hay nada" a propósito,
                 porque se arreglan de forma distinta. */
              "buscó pero devolvió texto VACÍO (¿techo de tokens?)"
            : /^NADA ENCONTRADO/i.test(texto)
              ? "buscó y no encontró nada"
              : `OK · ${fuentes.fuentes.length} fuentes · ${texto.length} caracteres` +
                (motores.length > 1 ? ` · clave ${queClave + 1}` : ""),
        });
      }

      const hechos =
        !texto || /^NADA ENCONTRADO/i.test(texto) ? "" : texto.slice(0, 6000);

      /* Vacío: se guarda y se corta la cadena de Gemini. Cortarla es a
         propósito —si este modelo ha buscado de verdad y no ha salido,
         el siguiente de la misma casa va a buscar lo mismo y va a
         tardar otro tanto—. Lo que puede cambiar algo es un buscador
         distinto, y ésos están más abajo. */
      if (!hechos) {
        vacio = {
          hechos: "",
          fuentes: fuentes.fuentes,
          busquedas: fuentes.busquedas,
          modelo,
          busco: true,
        };
        break;
      }

      return {
        hechos,
        fuentes: fuentes.fuentes,
        busquedas: fuentes.busquedas,
        modelo,
        busco: true,
      };
    } catch (e) {
      /* Se prueba con el siguiente modelo de la cadena. El fallo se
         apunta si alguien está mirando: un identificador de modelo que
         ya no existe, o una cuenta sin buscador, fallan aquí los tres y
         desde fuera se ve igual que "no he encontrado nada". */
      if (diario) {
        diario.intentos.push({
          modelo,
          ms: Date.now() - empezo,
          resultado: `ERROR · ${limpiarFallo(e)}`,
        });
      }
    }
  }

  /* Y si Gemini no ha podido, Claude.
   *
   * Esto existe por un día concreto: los tres modelos de Gemini
   * contestaron 429 y 404, no se buscó nada, y Kairo contestó de memoria
   * como si tal cosa. La capa gratuita de Gemini tiene un tope y el tope
   * se acaba; un buscador que depende de una sola casa se queda mudo el
   * día que esa casa dice basta.
   *
   * Y entran en DOS casos, no en uno: cuando Gemini no ha llegado a
   * buscar (sin cuota, sin clave, caído) y cuando ha buscado y ha
   * vuelto vacío. El segundo faltaba, y era el más frecuente de los
   * dos: la cuota se agota una tarde, pero una búsqueda que no da con
   * el dato pasa cualquier día. */
  if (!sinBuscar || !sinBuscar.busco || vacio) {
    /* Con lo que quede del plazo, y con un mínimo: el repuesto también
       tiene techo. Sin esto, el plazo de dieciocho segundos gobernaba
       solo a Gemini y Claude arrancaba después sin ninguno —tres
       búsquedas de servidor más la redacción se van a treinta segundos
       de sobra—, así que entre las dos se podían comer el minuto entero
       de la función ANTES de llamar al modelo que contesta. El usuario
       no recibía una respuesta peor: se quedaba sin respuesta. */
    const queda = Math.max(seAcaba - Date.now(), 0);
    const repuesto = await deRepuesto(
      pregunta,
      contexto,
      hoy,
      modoEdad,
      queda,
      diario,
    );
    /* Solo si trae algo. Un repuesto que tampoco encuentra nada no
       mejora lo que ya teníamos de Gemini —que al menos trae las
       fuentes que leyó—, así que en ese caso se devuelve aquello. */
    if (repuesto?.hechos) return repuesto;
  }

  /* El orden importa: primero lo que buscó y no encontró (es verdad y
     trae fuentes), y solo si no hubo ni eso, lo que ni llegó a buscar. */
  return vacio ?? sinBuscar;
}

/* LOS REPUESTOS, EN ORDEN.
 *
 * Primero OpenRouter con el buscador puesto: busca en la web de verdad,
 * igual que Google, así que contesta a lo de anoche. Cuesta unos 0,007 $
 * la búsqueda, que es poco pero no es nada, y por eso va aquí y no
 * arriba: solo cuando lo gratis ya ha dicho que no.
 *
 * Después Claude, que busca igual de bien y cuesta bastante más. Va
 * detrás por eso, y porque hace falta una clave de Anthropic aparte.
 *
 * Y detrás Wikipedia, que es la que no se acaba nunca: sin clave, sin
 * tarjeta y sin cupo diario. Cubre menos —lo asentado sí, lo de hace
 * cuatro horas no— y por eso va la última y no la primera. No viene a
 * ser el buscador bueno: viene a que "no he podido mirar" deje de ser
 * la única salida cuando se agota todo lo demás.
 *
 * El orden importa en un caso que no se ve desde fuera: con modo niño
 * no entra ninguno de los dos de pago —a los menores les contesta la
 * cadena de Gemini, que es la única con filtro de contenido por
 * petición, y esa decisión no se amplía por la puerta de atrás—, así
 * que para ellos Wikipedia no es la tercera red: es la única. Hasta
 * ahora un niño con la cuota de Gemini agotada se quedaba sin ninguna.
 *
 * Y entra para ellos aunque Claude no, porque lo que se decidió allí es
 * QUIÉN ESCRIBE la respuesta, no de dónde salen los datos: aquí no
 * escribe ningún modelo. Lo que se trae son entradillas de enciclopedia
 * y la respuesta la sigue redactando Gemini con su filtro puesto.
 */
async function deRepuesto(
  pregunta: string,
  contexto: string,
  hoy: string,
  modoEdad: ModoEdad | null,
  plazo: number,
  diario?: Diario,
): Promise<Hallazgo | null> {
  /* Menos de dos segundos y medio no da ni para la llamada a Wikipedia,
     que es la más corta de las dos. */
  if (plazo < 2500) {
    if (diario) {
      diario.intentos.push({
        modelo: "repuestos",
        ms: 0,
        resultado: "sin tiempo para los repuestos",
      });
    }
    return null;
  }

  const empezo = Date.now();

  /* Los de pago solo si da tiempo a algo más que a empezar: una búsqueda
     más la redacción no cabe en cuatro segundos, y una llamada que se
     corta a la mitad cuesta dinero y no devuelve nada. */
  if (plazo >= 4000) {
    const conWeb = await conPlazo(
      buscarEnLaWeb(pregunta, contexto, hoy, modoEdad, diario),
      plazo,
    );
    if (conWeb?.busco) return conWeb;

    const sobra = plazo - (Date.now() - empezo);
    if (sobra >= 4000) {
      const conClaude = await conPlazo(
        buscarConClaude(pregunta, contexto, hoy, modoEdad, diario),
        sobra,
      );
      if (conClaude?.busco) return conClaude;
    }
  }

  const queda = plazo - (Date.now() - empezo);
  if (queda < 1500) {
    if (diario) {
      diario.intentos.push({
        modelo: "wikipedia",
        ms: 0,
        resultado: "sin tiempo después de Claude",
      });
    }
    return null;
  }

  const antes = Date.now();
  const articulos = await articulosDe(pregunta, "es", queda);

  /* Sin artículos se devuelve null, y no un hallazgo vacío. La
     diferencia la nota el usuario: un hallazgo vacío hace que Kairo diga
     "he mirado y no lo he encontrado", y eso aquí sería mentira. Que no
     haya artículo en Wikipedia no quiere decir que no esté en internet;
     quiere decir que no hemos podido mirar en internet. Devolver null
     deja que lo diga tal cual. */
  if (!articulos.length) {
    if (diario) {
      diario.intentos.push({
        modelo: "wikipedia",
        ms: Date.now() - antes,
        resultado: "sin artículos (o Wikipedia no contestó)",
      });
    }
    return null;
  }

  if (diario) {
    diario.intentos.push({
      modelo: "wikipedia",
      ms: Date.now() - antes,
      resultado: `OK · ${articulos.length} artículo(s)`,
    });
  }

  return {
    hechos: comoHechos(articulos),
    fuentes: comoFuentes(articulos),
    busquedas: articulos.map((a) => a.titulo),
    modelo: "wikipedia",
    busco: true,
  };
}

/* EL BUSCADOR DE PAGO, QUE ES EL QUE SABE LO DE AYER.
 *
 * OpenRouter le engancha un buscador al modelo y devuelve, aparte del
 * texto, las páginas que ha leído. Esas páginas son la prueba: si no
 * viene ninguna, no ha buscado, por muy seguro que suene lo que diga. Y
 * entonces no cuela, igual que no cuela en Gemini ni en Claude. Su
 * texto llega al prompt anunciado como "lo que acabas de buscar en
 * internet"; darlo por bueno sin haber buscado sería blanquear un
 * recuerdo viejo y presentarlo como comprobado.
 */
async function buscarEnLaWeb(
  pregunta: string,
  contexto: string,
  hoy: string,
  modoEdad: ModoEdad | null,
  diario?: Diario,
): Promise<Hallazgo | null> {
  if (!hayBuscadorPagado()) {
    if (diario) {
      diario.intentos.push({
        modelo: "buscador web",
        ms: 0,
        resultado: "no configurado (o apagado con KAIRO_SIN_BUSCADOR_PAGADO)",
      });
    }
    return null;
  }

  /* Lo mismo que con Claude: a los menores les contesta la cadena de
     Gemini porque es la única que acepta un filtro de contenido por
     petición, y meter aquí otro modelo sería vaciar esa decisión sin
     que nadie la revise. */
  if (modoEdad === "nino" || modoEdad === null) return null;

  const modelo = modeloDeBusqueda();
  const empezo = Date.now();

  try {
    const salida = await preguntarConBuscador(
      SISTEMA,
      `Hoy es ${hoy}.\n` +
        (contexto ? `De qué venían hablando: ${contexto}\n` : "") +
        `\nBusca en internet y dime qué encuentras sobre esto:\n${pregunta.slice(0, 1500)}` +
        `\n\nNo contestes de memoria. Busca primero, aunque creas que ya lo sabes.`,
    );

    if (!salida) return null;

    if (!salida.fuentes.length) {
      if (diario) {
        diario.intentos.push({
          modelo,
          ms: Date.now() - empezo,
          resultado: "NO buscó: contestó de memoria (se descarta)",
        });
      }
      return { hechos: "", fuentes: [], busquedas: [], modelo, busco: false };
    }

    if (diario) {
      diario.intentos.push({
        modelo,
        ms: Date.now() - empezo,
        resultado: `OK · ${salida.fuentes.length} fuentes · ${salida.texto.length} caracteres`,
      });
    }

    return {
      hechos:
        !salida.texto || /^NADA ENCONTRADO/i.test(salida.texto)
          ? ""
          : salida.texto.slice(0, 6000),
      fuentes: salida.fuentes,
      /* Aquí no se sabe qué escribió en el buscador —OpenRouter no lo
         devuelve—, así que se enseñan los sitios leídos y ya. Inventar
         una consulta para rellenar el hueco sería enseñar algo que no
         ha pasado. */
      busquedas: [],
      modelo,
      busco: true,
    };
  } catch (e) {
    if (diario) {
      diario.intentos.push({
        modelo,
        ms: Date.now() - empezo,
        resultado: `ERROR · ${limpiarFallo(e)}`,
      });
    }
    return null;
  }
}

/* EL BUSCADOR DE REPUESTO.
 *
 * Claude busca de otra forma: en Gemini se hace una llamada y se le mira
 * el rastro para saber si buscó de verdad; aquí la búsqueda es una
 * herramienta del servidor de Anthropic, así que el rastro viene en la
 * propia respuesta, en bloques aparte. Si no hay ni un bloque de
 * resultados, no ha buscado, y se trata igual que allí: no cuela.
 */
async function buscarConClaude(
  pregunta: string,
  contexto: string,
  hoy: string,
  modoEdad: ModoEdad | null,
  diario?: Diario,
): Promise<Hallazgo | null> {
  const clave = process.env.ANTHROPIC_API_KEY?.trim();
  if (!clave) return null;

  /* A los menores no se les cambia de casa por la puerta de atrás: la
     cadena de Gemini se eligió para ellos porque es la única que acepta
     un filtro de contenido por petición (ver config.ts), y saltárselo
     aquí sería vaciar esa decisión sin que nadie la revise. */
  if (modoEdad === "nino" || modoEdad === null) return null;

  const modelo = "claude-sonnet-5-5";
  const empezo = Date.now();

  try {
    const cliente = new Anthropic({ apiKey: clave });

    const respuesta = await cliente.messages.create({
      model: modelo,
      max_tokens: 2000,
      system: SISTEMA,
      // Bajo a propósito: esto recoge datos, no razona sobre ellos.
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content:
            `Hoy es ${hoy}.\n` +
            (contexto ? `De qué venían hablando: ${contexto}\n` : "") +
            `\nBusca en internet y dime qué encuentras sobre esto:\n${pregunta.slice(0, 1500)}` +
            `\n\nNo contestes de memoria. Busca primero, aunque creas que ya lo sabes.`,
        },
      ],
      /* `max_uses` es el freno de mano: cada búsqueda se factura, y una
         pregunta abierta puede irse a diez sin darse cuenta. */
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    } as never);

    const { texto, fuentes, busquedas } = leerLoDeClaude(respuesta);

    if (!busquedas.length && !fuentes.length) {
      if (diario) {
        diario.intentos.push({
          modelo,
          ms: Date.now() - empezo,
          resultado: "NO buscó: contestó de memoria (se descarta)",
        });
      }
      return { hechos: "", fuentes: [], busquedas: [], modelo, busco: false };
    }

    if (diario) {
      diario.intentos.push({
        modelo,
        ms: Date.now() - empezo,
        resultado: `OK · ${fuentes.length} fuentes · ${texto.length} caracteres`,
      });
    }

    return {
      hechos:
        !texto || /^NADA ENCONTRADO/i.test(texto) ? "" : texto.slice(0, 6000),
      fuentes,
      busquedas,
      modelo,
      busco: true,
    };
  } catch (e) {
    if (diario) {
      diario.intentos.push({
        modelo,
        ms: Date.now() - empezo,
        resultado: `ERROR · ${limpiarFallo(e)}`,
      });
    }
    return null;
  }
}

/** Lo que viene en la respuesta de Claude, ordenado.
 *
 *  Tres tipos de bloque interesan: el texto (los datos), el resultado de
 *  cada búsqueda (las páginas) y la llamada a la herramienta (lo que
 *  escribió en el buscador). El resto se ignora. */
function leerLoDeClaude(respuesta: unknown): {
  texto: string;
  fuentes: Fuente[];
  busquedas: string[];
} {
  const bloques = (respuesta as { content?: unknown[] })?.content ?? [];
  let texto = "";
  const fuentes: Fuente[] = [];
  const busquedas: string[] = [];
  const vistas = new Set<string>();

  const meter = (b: unknown) => {
    const bloque = b as {
      type?: string;
      text?: string;
      name?: string;
      input?: { query?: string };
      content?: unknown;
    };

    if (bloque.type === "text" && bloque.text) texto += bloque.text;

    if (bloque.type === "server_tool_use" && bloque.name === "web_search") {
      const q = bloque.input?.query;
      if (q && !busquedas.includes(q)) busquedas.push(q);
    }

    if (bloque.type === "web_search_tool_result") {
      /* Cuando la búsqueda falla, `content` es UN objeto de error en vez
         de una lista. Recorrer un objeto como si fuera lista no da error:
         da cero fuentes en silencio, que es peor. */
      const lista = Array.isArray(bloque.content) ? bloque.content : [];
      for (const r of lista) {
        const res = r as { type?: string; url?: string; title?: string };
        if (res.type !== "web_search_result" || !res.url || vistas.has(res.url))
          continue;
        vistas.add(res.url);

        let dominio = "";
        try {
          dominio = new URL(res.url).hostname.replace(/^www\./, "");
        } catch {
          dominio = "";
        }

        fuentes.push({
          titulo: (res.title || dominio || res.url).slice(0, 160),
          url: res.url,
          dominio,
          tipo: "web",
        });
      }
    }

    /* Con el filtrado dinámico, las búsquedas van DENTRO de bloques de
       ejecución de código, así que hay que bajar un piso a buscarlas. */
    if (Array.isArray(bloque.content)) {
      for (const dentro of bloque.content) {
        const d = dentro as { type?: string };
        if (d?.type && d.type !== "web_search_result") meter(dentro);
      }
    }
  };

  for (const b of bloques) meter(b);

  return { texto: texto.trim(), fuentes: fuentes.slice(0, 12), busquedas };
}
