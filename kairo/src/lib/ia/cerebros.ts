/* QUÉ CEREBROS TIENE KAIRO PUESTOS, PARA ENSEÑARLO EN PANTALLA.
 *
 * Esto no decide nada: solo cuenta lo que hay. Vive aquí fuera porque
 * lo que tiene que hacer bien es DELICADO, y lo delicado se prueba.
 *
 * Lo delicado es esto: de una clave no sale nada, ni su longitud ni un
 * trozo. Pero del nombre del modelo sí tiene que salir el valor, porque
 * el fallo que hay que cazar es justo ese —un nombre mal escrito, o una
 * clave pegada en la casilla equivocada— y sin ver lo que pone no hay
 * forma de cazarlo. Ya pasó una vez con la dirección de Supabase: la
 * clave estaba pegada en la casilla de la dirección, y hasta que la
 * pantalla no dijo QUÉ PINTA tenía lo que había dentro, nadie lo vio.
 *
 * Así que el valor del modelo se enseña solo si tiene pinta de nombre
 * de modelo. Si tiene pinta de clave, o de cualquier otra cosa, se dice
 * eso mismo y no se enseña: que es, además, la pista que hacía falta.
 */

/** Los proveedores que Kairo entiende delante de los dos puntos. */
const PROVEEDORES = ["gemini", "claude", "gpt", "extra"] as const;

/* Lo que empieza así es un secreto, se llame como se llame la variable.
   Va primero y manda sobre todo lo demás. */
const PINTA_DE_CLAVE = /^(aiza|sk-|sk_|eyj|sb_|sbp_|sbs_|ghp_|gho_|xox|hf_|AKIA)/i;

/** ¿Se puede enseñar este valor sin riesgo de publicar un secreto?
 *
 *  Solo lo que tenga pinta de nombre de modelo: corto, con guiones, y
 *  como mucho con un proveedor delante. Todo lo demás, no. */
export function seguroDeEnsenar(valor: string): boolean {
  const v = valor.trim();
  if (!v || v.length > 45) return false;
  if (PINTA_DE_CLAVE.test(v)) return false;

  const corte = v.indexOf(":");
  const cabeza = corte === -1 ? "" : v.slice(0, corte).toLowerCase();
  const cola = corte === -1 ? v : v.slice(corte + 1);

  if (corte === -1) {
    /* Sin proveedor delante, Kairo entiende Gemini. Así que un nombre
       suelto solo se enseña si empieza por "gemini-", y cualquier otra
       cosa se marca como rara.
 
       Parece exagerado y no lo es. Sin esta línea, algo como
       "mi-contrasena-de-la-base-de-datos" pasaría el filtro —letras y
       guiones, igual que un nombre de modelo— y acabaría escrito en una
       pantalla que se abre sin sesión.
 
       Y de paso caza el error más probable de todos: escribir
       "claude-sonnet-5-5" olvidándose del "claude:" de delante, que no
       es un modelo de Claude sino un modelo de Gemini que no existe. */
    return /^gemini-[a-z0-9.]+(-[a-z0-9.]+)*$/i.test(v);
  }

  // Con dos puntos, delante tiene que ir un proveedor de los de verdad.
  if (!PROVEEDORES.includes(cabeza as (typeof PROVEEDORES)[number])) return false;

  /* Y el nombre del modelo lleva guiones. Ninguno no los lleva, y
     pedirlo deja fuera de un plumazo casi todo lo que no es un modelo. */
  return /^[a-z][a-z0-9.]*(-[a-z0-9.]+)+$/i.test(cola);
}

export type Modelo = {
  /** Cómo se llama la variable, para poder buscarla en el panel. */
  variable: string;
  /** Para qué nivel es, en castellano. */
  nivel: string;
  /** Lo que pone, si se puede enseñar. */
  valor: string | null;
  /** Hay algo puesto. */
  puesta: boolean;
  /** Hay algo puesto, pero no tiene pinta de nombre de modelo. */
  sospechosa: boolean;
};

export type Cerebros = {
  /** Cuántas claves de Gemini hay. La cuota gratuita va por clave. */
  gemini: number;
  claude: boolean;
  gpt: boolean;
  extra: boolean;
  modelos: Modelo[];
};

const hay = (v: string | undefined) => (v ?? "").trim().length > 0;

/** Qué hay puesto. Nunca el contenido de una clave. */
export function mirarCerebros(env: Record<string, string | undefined> = process.env): Cerebros {
  const deGemini = [
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_2,
    env.GEMINI_API_KEY_3,
    ...(env.GEMINI_API_KEYS ?? "").split(","),
  ].filter((v) => {
    const t = (v ?? "").trim();
    return t.length > 0 && !/\s/.test(t);
  });

  const modelo = (variable: string, nivel: string): Modelo => {
    const crudo = (env[variable] ?? "").trim();
    const seguro = seguroDeEnsenar(crudo);
    return {
      variable,
      nivel,
      valor: seguro ? crudo : null,
      puesta: crudo.length > 0,
      sospechosa: crudo.length > 0 && !seguro,
    };
  };

  return {
    gemini: new Set(deGemini).size,
    claude: hay(env.ANTHROPIC_API_KEY),
    gpt: hay(env.OPENAI_API_KEY),
    extra: hay(env.KAIRO_EXTRA_KEY),
    modelos: [
      modelo("KAIRO_MODELO_RAPIDO", "Rápido"),
      modelo("KAIRO_MODELO_ESTANDAR", "Estándar"),
      modelo("KAIRO_MODELO_FORJA", "Forja"),
      modelo("KAIRO_MODELO_MAXIMO", "Máximo"),
    ],
  };
}
