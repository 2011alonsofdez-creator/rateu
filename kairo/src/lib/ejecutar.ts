import type { Lenguaje } from "./resaltar";

/* Ejecutar código. En tu navegador, no en un servidor.
 *
 * Esto es lo que hace que Código no cueste dinero ni haga falta
 * conectar nada: JavaScript corre en un trabajador del propio
 * navegador, Python corre de verdad —el intérprete compilado a
 * WebAssembly— y el HTML se pinta en una ventana aislada. Tu código no
 * sale de tu ordenador a menos que se lo preguntes a Kairo.
 *
 * Y va en un trabajador aparte por un motivo muy concreto: un
 * `while (true)` en la página principal cuelga la pestaña y hay que
 * cerrarla. En un trabajador, se le corta y ya está.
 */

export type Salida = { tipo: "log" | "error" | "aviso" | "fin"; texto: string };

/** Lo que se le deja correr antes de cortarlo. */
export const LIMITE_MS = 10_000;

/* El intérprete de Python. Se pide por rango (@0) a propósito: así el
   CDN resuelve él la última versión de esa serie y esto no se queda
   viejo dentro de seis meses. Si algún día hace falta clavarlo, se
   cambia aquí y en ningún sitio más. */
export const PYODIDE = "https://cdn.jsdelivr.net/npm/pyodide@0/";

/* --------------------------------------------------------------
   El trabajador de JavaScript
   -------------------------------------------------------------- */
const OBRERO_JS = `
self.onmessage = async (e) => {
  const ver = (v, vistos) => {
    if (typeof v === "string") return v;
    if (v instanceof Error) return v.name + ": " + v.message;
    if (typeof v === "function") return "[función " + (v.name || "anónima") + "]";
    if (typeof v === "bigint") return v + "n";
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (typeof v === "object") {
      if (vistos.has(v)) return "[referencia circular]";
      vistos.add(v);
      try { return JSON.stringify(v, (k, x) => (typeof x === "bigint" ? String(x) + "n" : x), 2); }
      catch { return String(v); }
    }
    return String(v);
  };

  const escribir = (tipo, args) =>
    self.postMessage({ tipo, texto: args.map((a) => ver(a, new WeakSet())).join(" ") });

  console.log = (...a) => escribir("log", a);
  console.info = (...a) => escribir("log", a);
  console.debug = (...a) => escribir("log", a);
  console.warn = (...a) => escribir("aviso", a);
  console.error = (...a) => escribir("error", a);

  try {
    // Envuelto en una función asíncrona para que se pueda usar await
    // en la primera línea, como en la consola del navegador.
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const devuelto = await new AsyncFunction(e.data)();
    if (devuelto !== undefined) escribir("log", [devuelto]);
  } catch (err) {
    self.postMessage({ tipo: "error", texto: err instanceof Error ? err.name + ": " + err.message : String(err) });
  }
  self.postMessage({ tipo: "fin", texto: "" });
};
`;

/* --------------------------------------------------------------
   El trabajador de Python
   -------------------------------------------------------------- */
const obreroPython = (base: string) => `
importScripts("${base}pyodide.js");

let piton = null;

self.onmessage = async (e) => {
  try {
    if (!piton) {
      piton = await loadPyodide({
        indexURL: "${base}",
        stdout: (t) => self.postMessage({ tipo: "log", texto: t }),
        stderr: (t) => self.postMessage({ tipo: "error", texto: t }),
      });
    }

    const devuelto = await piton.runPythonAsync(e.data);
    if (devuelto !== undefined && devuelto !== null) {
      self.postMessage({ tipo: "log", texto: String(devuelto) });
    }
  } catch (err) {
    self.postMessage({ tipo: "error", texto: String(err && err.message ? err.message : err) });
  }
  self.postMessage({ tipo: "fin", texto: "" });
};
`;

/* --------------------------------------------------------------
   La puerta
   -------------------------------------------------------------- */
/* El trabajador de Python, que sobrevive entre ejecuciones. Vive aquí
   fuera a propósito: es lo que separa "esperar cinco segundos cada vez
   que pulso Ejecutar" de "esperar cinco segundos una sola vez". */
let obreroPiton: Worker | null = null;
let urlPiton: string | null = null;

export type Ejecucion = {
  /** Cortar por lo sano: mata el trabajador. */
  parar: () => void;
};

/** Lanza el código y va soltando lo que imprima. Devuelve con qué pararlo. */
export function ejecutar(
  codigo: string,
  lenguaje: Lenguaje,
  onSalida: (s: Salida) => void,
  limiteMs = LIMITE_MS,
): Ejecucion {
  /* El HTML no se "ejecuta": se pinta. De eso se encarga la vista
     previa, que es un marco aislado, así que aquí no hay nada que
     hacer más que decir que ya está. */
  if (lenguaje === "html") {
    onSalida({ tipo: "fin", texto: "" });
    return { parar: () => {} };
  }

  const esPython = lenguaje === "python";

  /* El intérprete de Python pesa y tarda en arrancar, así que su
     trabajador se queda vivo entre ejecuciones: la primera vez se
     descarga y a partir de ahí responde al momento. También es lo que
     hace que una variable definida en una ejecución siga existiendo en
     la siguiente, como en un cuaderno.
     JavaScript va al revés: trabajador nuevo cada vez, para que ejecutar
     empiece siempre de cero. */
  const primeraDePython = esPython && obreroPiton === null;
  if (primeraDePython) onSalida({ tipo: "aviso", texto: "Descargando Python… (solo la primera vez)" });

  let obrero: Worker;
  let url: string | null = null;

  try {
    if (esPython && obreroPiton) {
      obrero = obreroPiton;
    } else {
      const fuente = esPython ? obreroPython(PYODIDE) : OBRERO_JS;
      url = URL.createObjectURL(new Blob([fuente], { type: "text/javascript" }));
      obrero = new Worker(url);
      if (esPython) {
        obreroPiton = obrero;
        urlPiton = url;
      }
    }
  } catch {
    if (url) URL.revokeObjectURL(url);
    onSalida({ tipo: "error", texto: "Este navegador no deja ejecutar código aquí." });
    onSalida({ tipo: "fin", texto: "" });
    return { parar: () => {} };
  }

  let vivo = true;

  /* Al terminar bien, el de Python se queda esperando la próxima; el de
     JavaScript se tira. Al cortar o al agotarse el tiempo se tiran los
     dos: un trabajador colgado no vuelve en sí solo. */
  const soltar = (matar: boolean) => {
    if (!vivo) return;
    vivo = false;
    clearTimeout(reloj);
    obrero.onmessage = null;
    obrero.onerror = null;

    if (!esPython || matar) {
      obrero.terminate();
      const suUrl = esPython ? urlPiton : url;
      if (suUrl) URL.revokeObjectURL(suUrl);
      if (esPython) {
        obreroPiton = null;
        urlPiton = null;
      }
    }
  };

  const limpiar = () => soltar(true);

  /* El reloj empieza a contar aquí, no al recibir la primera línea:
     un programa que se cuelga antes de imprimir nada es justo el que
     hay que cortar. Descargar Python la primera vez tarda, así que en
     Python el reloj es más generoso. */
  const reloj = setTimeout(
    () => {
      onSalida({ tipo: "error", texto: `⏱ Parado: llevaba más de ${Math.round(limiteMs / 1000)} segundos.` });
      onSalida({ tipo: "fin", texto: "" });
      limpiar();
    },
    lenguaje === "python" ? limiteMs + 50_000 : limiteMs,
  );

  obrero.onmessage = (e: MessageEvent<Salida>) => {
    if (!vivo) return;
    onSalida(e.data);
    if (e.data.tipo === "fin") soltar(false);
  };

  /* Si el trabajador revienta por fuera (no se puede descargar el
     intérprete, por ejemplo), hay que decirlo: si no, el botón se
     queda girando para siempre. */
  obrero.onerror = (e) => {
    if (!vivo) return;
    onSalida({
      tipo: "error",
      texto:
        lenguaje === "python"
          ? "No se ha podido cargar Python. Suele ser la conexión o un bloqueador."
          : e.message || "No se ha podido ejecutar.",
    });
    onSalida({ tipo: "fin", texto: "" });
    limpiar();
  };

  obrero.postMessage(codigo);

  return { parar: limpiar };
}

/** El HTML que se le mete al marco de vista previa. */
export function paraVistaPrevia(codigo: string): string {
  // Un fragmento suelto (sin <html>) también tiene que verse.
  const tieneEsqueleto = /<html[\s>]/i.test(codigo);
  if (tieneEsqueleto) return codigo;

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,sans-serif;margin:16px;color:#121214;background:#fff}</style>
</head><body>${codigo}</body></html>`;
}
