/* CUÁNDO UNA PREGUNTA ES EN REALIDAD UN ENCARGO.
 *
 * Hay gente que escribe en el chat "avísame cuando baje el precio" o
 * "todos los lunes hazme un resumen de la semana". Eso no es una
 * pregunta: es un Co-Work descrito con palabras. Pero el chat lo
 * contesta una vez y se olvida, y el que lo pidió no sabe que existe
 * una pantalla donde eso se hace solo cada día.
 *
 * Esto detecta esa intención y nada más. No llama a ningún modelo:
 * unas expresiones regulares bastan para "cada lunes", y gastar
 * créditos en adivinar si alguien dijo "todos los días" sería absurdo.
 *
 * Es a propósito conservador. Una sugerencia que salta donde no toca
 * se ignora a los tres días, y entonces ese sitio de la pantalla está
 * perdido para siempre. Mejor no saltar en diez casos dudosos que
 * saltar mal en uno.
 */

const DIAS = "lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo";

/** Cada patrón lleva cómo se dice la cadencia en la sugerencia. */
const PATRONES: { re: RegExp; cuando: string; tipo: "repite" | "vigila" }[] = [
  { re: new RegExp(`\\b(todos|cada)\\s+(los\\s+)?(${DIAS})\\b`, "i"), cuando: "cada semana", tipo: "repite" },
  { re: /\b(todos los d[ií]as|cada d[ií]a|a diario|diariamente|cada ma[ñn]ana|todas las ma[ñn]anas|cada noche|todas las noches)\b/i, cuando: "cada día", tipo: "repite" },
  { re: /\b(cada semana|todas las semanas|semanalmente|una vez a la semana)\b/i, cuando: "cada semana", tipo: "repite" },
  { re: /\b(cada mes|todos los meses|mensualmente|una vez al mes|a principios de mes|a final de mes)\b/i, cuando: "cada mes", tipo: "repite" },
  { re: /\b(av[ií]same|avisadme|dime|notif[ií]came|ent[eé]rate)\s+(cuando|si|en cuanto)\b/i, cuando: "cuando pase", tipo: "vigila" },
  { re: /\b(recu[eé]rdame|recordarme)\b/i, cuando: "cuando toque", tipo: "vigila" },
  { re: /\b(vigila|vigilar|controla|est[aá]te atento|pendiente de|monitoriza)\b/i, cuando: "cada día", tipo: "repite" },
];

export type Encargo = {
  /** "cada día", "cada semana", "cada mes", "cuando pase"… */
  cuando: string;
  /** Algo que se repite ("cada lunes") o algo que hay que vigilar y
   *  avisar ("cuando baje el precio"). Cambia cómo se pregunta. */
  tipo: "repite" | "vigila";
  /** Un nombre corto para el Co-Work, sacado de la propia frase. */
  nombre: string;
};

/** Un nombre de hasta seis palabras, sin la parte que dice cuándo. */
function nombrar(texto: string): string {
  const limpio = texto
    .replace(/\s+/g, " ")
    .replace(/^(hola|oye|por favor|kairo)[,!]?\s*/i, "")
    .replace(new RegExp(`\\b(todos|cada)\\s+(los\\s+|las\\s+)?(${DIAS}|d[ií]as?|semanas?|mes(es)?|ma[ñn]anas?|noches?)\\b,?`, "gi"), "")
    .replace(/\b(a diario|diariamente|semanalmente|mensualmente)\b,?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  /* Seis palabras, y si la sexta es un "de" o un "que" se quita: un
     nombre que acaba en preposición parece cortado por un fallo. */
  const palabras = limpio.split(" ").filter(Boolean).slice(0, 6);
  while (palabras.length > 2 && /^(de|del|la|el|lo|los|las|que|en|a|al|y|o|un|una|mi|tu|su|se|no|me|te|le)$/i.test(palabras[palabras.length - 1])) {
    palabras.pop();
  }
  const nombre = palabras.join(" ").replace(/[.,;:!?]+$/, "");
  return nombre ? nombre[0].toUpperCase() + nombre.slice(1) : "Encargo";
}

/** Si la frase describe algo repetido o algo que hay que vigilar,
 *  devuelve cómo sugerirlo. Si no, nada. */
export function detectarEncargo(texto: string): Encargo | null {
  const limpio = texto.trim();
  // Muy corto no es un encargo; muy largo es un documento pegado.
  if (limpio.length < 12 || limpio.length > 600) return null;

  for (const p of PATRONES) {
    if (p.re.test(limpio)) return { cuando: p.cuando, tipo: p.tipo, nombre: nombrar(limpio) };
  }
  return null;
}
