/* Colorear código sin traerse una librería de 300 KB.
 *
 * Esto no es un analizador de verdad: es un reconocedor de trozos que
 * sabe distinguir un comentario de un texto de una palabra reservada, y
 * con eso basta para leer código cómodamente.
 *
 * Hay una regla que NO se puede romper, y por eso está probada: la suma
 * de todos los trozos tiene que ser exactamente el código original, sin
 * perder ni añadir un carácter. El editor pinta el color por debajo y
 * el texto que escribes por encima, así que si aquí se cuela o se cae
 * una letra, las dos capas se desalinean y el editor parece roto.
 *
 * Y se devuelven trozos, no HTML. Los pinta React como texto, así que
 * un código pegado no puede inyectar nada en la página.
 */

export type Lenguaje = "js" | "python" | "html";

export type Clase = "llano" | "comentario" | "texto" | "numero" | "clave" | "etiqueta";

export type Trozo = { t: string; c: Clase };

const CLAVES: Record<Lenguaje, Set<string>> = {
  js: new Set([
    "const", "let", "var", "function", "return", "if", "else", "for", "while", "do",
    "break", "continue", "class", "extends", "new", "this", "super", "import", "export",
    "from", "default", "async", "await", "try", "catch", "finally", "throw", "typeof",
    "instanceof", "in", "of", "delete", "void", "yield", "switch", "case", "null",
    "undefined", "true", "false", "NaN",
  ]),
  python: new Set([
    "def", "return", "if", "elif", "else", "for", "while", "break", "continue", "class",
    "import", "from", "as", "pass", "raise", "try", "except", "finally", "with", "lambda",
    "global", "nonlocal", "assert", "del", "yield", "and", "or", "not", "in", "is",
    "None", "True", "False", "async", "await", "self", "print", "len", "range",
  ]),
  html: new Set([]),
};

/* Cada lenguaje se reconoce con una sola expresión, y el ORDEN de las
   alternativas es lo que hace que funcione: un comentario que contiene
   comillas tiene que ganarle a las comillas, y un texto que contiene //
   tiene que ganarle al comentario. Quien va primero, manda. */
const PATRONES: Record<Lenguaje, RegExp> = {
  js: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^\\`])*`|"(?:\\.|[^\\"\n])*"|'(?:\\.|[^\\'\n])*')|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b)|([A-Za-z_$][\w$]*)/gi,
  python: /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^\\"\n])*"|'(?:\\.|[^\\'\n])*')|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b)|([A-Za-z_][\w]*)/gi,
  /* En HTML el cuarto grupo son las etiquetas, no las palabras: tiene
     que ocupar la MISMA posición que en los otros dos, porque quien lee
     los grupos es el mismo código para los tres. */
  html: /(<!--[\s\S]*?-->)|("(?:[^"\n])*"|'(?:[^'\n])*')|(\b\d[\d.]*\b)|(<\/?[A-Za-z][\w-]*)/g,
};

/** Parte el código en trozos con su color. */
export function resaltar(codigo: string, lenguaje: Lenguaje): Trozo[] {
  const trozos: Trozo[] = [];
  const patron = new RegExp(PATRONES[lenguaje].source, PATRONES[lenguaje].flags);
  const claves = CLAVES[lenguaje];

  let ultimo = 0;
  let m: RegExpExecArray | null;

  const llano = (texto: string) => {
    if (!texto) return;
    const anterior = trozos[trozos.length - 1];
    // Dos llanos seguidos se juntan: menos nodos que pintar.
    if (anterior?.c === "llano") anterior.t += texto;
    else trozos.push({ t: texto, c: "llano" });
  };

  while ((m = patron.exec(codigo)) !== null) {
    // Una alternativa que casa con la cadena vacía colgaría el bucle.
    if (m[0] === "") {
      patron.lastIndex++;
      continue;
    }

    llano(codigo.slice(ultimo, m.index));

    const [entero, comentario, texto, numero, palabra] = m;

    if (comentario) trozos.push({ t: entero, c: "comentario" });
    else if (texto) trozos.push({ t: entero, c: "texto" });
    else if (numero) trozos.push({ t: entero, c: "numero" });
    else if (palabra && lenguaje === "html") trozos.push({ t: entero, c: "etiqueta" });
    else if (palabra && claves.has(palabra)) trozos.push({ t: entero, c: "clave" });
    else llano(entero);

    ultimo = m.index + entero.length;
  }

  llano(codigo.slice(ultimo));
  return trozos;
}

/** El lenguaje a partir del nombre del archivo, para el selector. */
export function lenguajeDe(nombre: string): Lenguaje {
  const ext = nombre.toLowerCase().split(".").pop() ?? "";
  if (ext === "py") return "python";
  if (ext === "html" || ext === "htm") return "html";
  return "js";
}
