import type { Level } from "@/lib/mock";

/* Elegir el nivel por ti.
 *
 * El botón ⚡ obliga a decidir algo que casi nadie sabe decidir: si tu
 * pregunta merece el modelo barato o el bueno. El resultado es que o se
 * deja siempre en Rápido —y las preguntas difíciles salen regular— o se
 * deja siempre arriba, y se queman los créditos preguntando la hora.
 *
 * Esto lo decide solo, y lo decide AQUÍ y no con otra llamada a un
 * modelo: preguntarle a una IA qué nivel usar costaría un segundo y una
 * petición de cuota antes de cada mensaje, para acertar poco más que
 * unas cuantas reglas bien puestas. Las reglas son de cosecha propia,
 * pero están escritas para ser leídas y discutidas, y probadas una a
 * una.
 *
 * Tres cosas que NO hace, a propósito:
 *  - No elige MEGA jamás. Cuesta 120 créditos: eso lo pides tú.
 *  - No se salta tu plan. Si tu plan solo tiene Rápido, es Rápido.
 *  - No gasta más de lo que tienes. Si no llega, baja al que alcance.
 */

export type Motivo =
  | "codigo"
  | "texto_largo"
  | "archivos"
  | "trabajo_a_fondo"
  | "cuentas"
  | "charla"
  | "por_defecto";

export type Eleccion = { nivel: Level; motivo: Motivo };

const palabra = (fuente: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}_])(?:${fuente})(?![\\p{L}\\p{N}_])`, "iu");

/* --------------------------------------------------------------
   Lo que pide el nivel de arriba (Forja)
   -------------------------------------------------------------- */

/** Código: el caso más claro de todos. */
const DE_CODIGO: RegExp[] = [
  palabra("(función|funcion|variable|bucle|array|consulta sql|base de datos)"),
  palabra("(javascript|typescript|python|java|kotlin|swift|rust|golang|php|sql|html|css|react|next\\.?js|node)"),
  palabra("(compila|compilar|depurar|debug|refactor|refactoriza|despliega|desplegar)"),
  palabra("(error|excepción|excepcion|traza|stack trace|no funciona el código)"),
  palabra("(código|codigo|script|programa|repositorio|commit|endpoint|api)"),
  palabra("(function|const |let |import |class |def |return|null pointer)"),
];

/** Trabajo largo: analizar, comparar, planificar, redactar de verdad. */
const A_FONDO: RegExp[] = [
  palabra("(analiza|analízame|analizame|análisis|analisis|desglosa|desmenuza)"),
  palabra("(compara|comparativa|diferencias entre|pros y contras|ventajas e inconvenientes)"),
  palabra("(haz un plan|plan de|planifica|estrategia|hoja de ruta|paso a paso)"),
  palabra("(redacta|redáctame|redactame|escribe un (informe|ensayo|artículo|articulo|trabajo|guion|guión))"),
  palabra("(informe|ensayo|memoria|tesis|trabajo de clase|propuesta|presupuesto detallado)"),
  palabra("(diseña|diséñame|disename|arquitectura|estructura de)"),
  palabra("(revisa|revísame|revisame|corrige a fondo|audita|evalúa|evalua)"),
  palabra("(explica en profundidad|explícame a fondo|explicame a fondo|en detalle|detalladamente)"),
  palabra("(resume este|resúmeme este|resumeme este) (contrato|documento|informe|texto|artículo|articulo)"),
  palabra("(analyse|analyze|compare|write an (essay|report|article)|make a plan)"),
];

/** Cuentas y demostraciones: pensar despacio o fallar. */
const CUENTAS: RegExp[] = [
  palabra("(resuelve|resuélveme|resuelveme|calcula|demuestra|deduce)"),
  palabra("(ecuación|ecuacion|integral|derivada|matriz|probabilidad|estadística|estadistica)"),
  palabra("(problema de (física|fisica|química|quimica|matemáticas|matematicas))"),
  palabra("(cuánto sale|cuanto sale|cuántas horas|préstamo|hipoteca|interés compuesto)"),
];

/* --------------------------------------------------------------
   Lo que se conforma con el nivel de abajo (Rápido)
   -------------------------------------------------------------- */

const CHARLA: RegExp[] = [
  palabra("(hola|buenas|buenos días|buenas tardes|buenas noches|qué tal|que tal|hey)"),
  palabra("(gracias|vale|ok|perfecto|genial|adiós|adios|hasta luego)"),
  palabra("(cómo te llamas|como te llamas|quién eres|quien eres|qué eres|que eres)"),
  palabra("(qué hora es|que hora es|qué día es|que dia es)"),
];

/** Encargos de un tirón: se contestan bien con el modelo rápido. */
const SENCILLO: RegExp[] = [
  palabra("(traduce|tradúceme|traduceme|cómo se dice|como se dice|cómo se escribe|como se escribe)"),
  palabra("(qué significa|que significa|significado de|sinónimo|sinonimo|antónimo|antonimo)"),
  palabra("(dame ideas|dime ideas|lluvia de ideas|sugiéreme|sugiereme|recomiéndame|recomiendame)"),
  palabra("(cuánto es|cuanto es|cuántos|cuantos|cuál es la capital|cual es la capital)"),
  palabra("(receta|cómo se hace|como se hace) "),
  palabra("(translate|what does .{1,30} mean|give me ideas)"),
];

/* Preguntas cortas que NO son charla: piden que te expliquen algo, y
   eso el modelo más rápido lo contesta por encima. "¿Por qué el cielo
   es azul?" cabe en una línea y merece una respuesta de verdad. */
const PIDE_EXPLICACION: RegExp[] = [
  palabra("(por qué|porqué|porque|cómo funciona|como funciona|cómo se|como se)"),
  palabra("(cuéntame|cuentame|explica|explícame|explicame|en qué consiste|en que consiste)"),
  palabra("(qué diferencia|que diferencia|para qué sirve|para que sirve|qué pasa si|que pasa si)"),
  palabra("(why|how does|how do|explain|tell me about)"),
];

/** Señales de que hay código pegado, aunque no lo diga con palabras. */
function pareceCodigo(texto: string): boolean {
  if (/```/.test(texto)) return true;

  const lineas = texto.split("\n");
  if (lineas.length < 3) return false;

  const conPinta = lineas.filter((l) =>
    /[;{}()[\]=<>]/.test(l) && /^\s{2,}|[;{}]\s*$|=>|==|!=|:=/.test(l),
  ).length;

  // Un tercio de las líneas con forma de código ya no es casualidad.
  return conPinta >= 3 && conPinta / lineas.length > 0.3;
}

/* --------------------------------------------------------------
   La decisión
   -------------------------------------------------------------- */

export type Contexto = {
  /** Si la pregunta viene con imágenes o PDF. */
  conArchivos?: boolean;
  /** Cuántos mensajes lleva la conversación. */
  mensajes?: number;
};

/** Qué nivel pide esta pregunta, sin mirar plan ni créditos. */
export function elegirNivel(pregunta: string, ctx: Contexto = {}): Eleccion {
  const texto = pregunta.trim();

  // Un archivo casi nunca se sube para preguntar una tontería.
  if (ctx.conArchivos) return { nivel: "forja", motivo: "archivos" };

  if (pareceCodigo(texto) || DE_CODIGO.some((re) => re.test(texto))) {
    return { nivel: "forja", motivo: "codigo" };
  }

  // Un texto pegado es material de trabajo, no una pregunta suelta.
  if (texto.length > 1200) return { nivel: "forja", motivo: "texto_largo" };

  if (A_FONDO.some((re) => re.test(texto))) {
    return { nivel: "forja", motivo: "trabajo_a_fondo" };
  }

  if (CUENTAS.some((re) => re.test(texto))) {
    return { nivel: "forja", motivo: "cuentas" };
  }

  /* Saludos y cortesías: Rápido, y sin pensárselo. Van después de lo
     de arriba porque "hola, analízame este contrato" es un análisis,
     no un saludo. */
  if (texto.length <= 80 && CHARLA.some((re) => re.test(texto))) {
    return { nivel: "fast", motivo: "charla" };
  }

  if (texto.length <= 300 && SENCILLO.some((re) => re.test(texto))) {
    return { nivel: "fast", motivo: "charla" };
  }

  /* Una línea suelta sin nada que la complique. Pero si lo que pide es
     una explicación, no es "suelta" por mucho que sea corta. */
  if (
    texto.length <= 60 &&
    !texto.includes("\n") &&
    !PIDE_EXPLICACION.some((re) => re.test(texto))
  ) {
    return { nivel: "fast", motivo: "charla" };
  }

  /* Lo demás: Normal. Es el nivel que mejor responde a lo que la gente
     pregunta de verdad, y cuesta cuatro créditos, no veinte. */
  return { nivel: "normal", motivo: "por_defecto" };
}

const ORDEN: Level[] = ["fast", "normal", "forja", "mega"];

/** Baja el nivel hasta uno que el plan permita y los créditos paguen. */
export function loQueCabe(
  nivel: Level,
  permitidos: Level[],
  saldo: number,
  coste: Record<Level, number>,
): Level {
  const desde = ORDEN.indexOf(nivel);

  for (let i = desde; i >= 0; i--) {
    const candidato = ORDEN[i];
    if (permitidos.includes(candidato) && coste[candidato] <= saldo) return candidato;
  }

  /* Si no llega ni para el más barato, se devuelve el más barato que
     permita el plan: que sea la base de datos quien diga que no hay
     saldo, con su mensaje de siempre, y no un nivel raro aquí. */
  return permitidos.find((n) => ORDEN.includes(n)) ?? "fast";
}
