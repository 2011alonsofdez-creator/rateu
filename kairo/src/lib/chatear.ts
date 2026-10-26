import type { Level } from "./mock";

/* Hablar con Kairo desde fuera del chat.
 *
 * La página del chat tiene su propio lector, con fuentes, conversación,
 * créditos y suavizado. Esto es la versión corta, para las pantallas
 * que solo necesitan una respuesta: Código, y las que vengan.
 * La ruta es la misma —/api/chat—, así que se aplican los mismos
 * límites, los mismos créditos y la misma cadena de modelos.
 */

export type Respuesta = {
  /** Va llegando trozo a trozo. */
  onTexto: (t: string) => void;
  /** Qué modelo ha contestado, para enseñarlo. */
  onModelo?: (m: string) => void;
  /** Algo ha ido mal: se recibe la clave del error, no la excusa. */
  onError?: (clave: string, detalle?: string) => void;
  /** Se acabó: ni llega más texto ni va a llegar.
   *
   *  Hace falta para cualquier pantalla que tenga que HACER algo con la
   *  respuesta entera en vez de irla pintando —sacar el bloque de
   *  código, guardar una ficha, apagar un cargando—. Sin esto, el que
   *  llama se inventa un final, y el final inventado siempre llega
   *  antes o después de tiempo.
   *
   *  Se llama una sola vez y SIEMPRE, también cuando hubo error o
   *  cuando se cortó: un `finally` que no se ejecuta en el caso malo no
   *  sirve para apagar nada. `motivo` dice cuál de los tres fue. */
  onFin?: (motivo: "ok" | "error" | "cortado") => void;
};

export type Fallo =
  | "sin_creditos"
  | "sin_sesion"
  | "nivel"
  | "red"
  | "modelo"
  | "sobrecargado"
  | "cuota";

/** Manda una pregunta y va soltando la respuesta. Devuelve cómo cortarla. */
export function preguntar(
  texto: string,
  nivel: Level,
  { onTexto, onModelo, onError, onFin }: Respuesta,
): () => void {
  const corte = new AbortController();

  /* Una vez y no más: el final puede llegar por tres caminos y los tres
     pasan por aquí. Avisar dos veces sería peor que no avisar. */
  let acabado = false;
  const acabar = (motivo: "ok" | "error" | "cortado") => {
    if (acabado) return;
    acabado = true;
    onFin?.(motivo);
  };

  (async () => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: corte.signal,
        body: JSON.stringify({
          nivel,
          mensajes: [{ rol: "user", texto }],
          zona: zonaDelNavegador(),
        }),
      });

      if (!res.ok || !res.body) {
        const clave: Fallo =
          res.status === 402
            ? "sin_creditos"
            : res.status === 401
              ? "sin_sesion"
              : res.status === 403
                ? "nivel"
                : "modelo";
        onError?.(clave);
        acabar("error");
        return;
      }

      /* Un error que llega DENTRO del flujo no corta la lectura, así
         que hay que acordarse de él para no decir "ok" al final. */
      let fallo = false;

      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      let resto = "";

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decoder.decode(value, { stream: true });
        const lineas = resto.split("\n");
        resto = lineas.pop() ?? "";

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(linea);
          } catch {
            continue; // línea partida: se recompone en la vuelta siguiente
          }

          if (ev.t === "texto") onTexto(String(ev.v ?? ""));
          else if (ev.t === "meta") onModelo?.(String(ev.modelo ?? ""));
          else if (ev.t === "error") {
            onError?.(String(ev.v), ev.detalle ? String(ev.detalle) : undefined);
            fallo = true;
          }
        }
      }

      acabar(fallo ? "error" : "ok");
    } catch (e) {
      // Abortar no es un fallo: es que el usuario ha cambiado de idea.
      if ((e as Error)?.name === "AbortError") return acabar("cortado");
      onError?.("red");
      acabar("error");
    }
  })();

  return () => corte.abort();
}

/** La zona horaria de este navegador. Sin ella, Kairo no sabe qué día es. */
export function zonaDelNavegador(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** El primer bloque de código de una respuesta, para el botón de
 *  "ponlo en el editor". Sin bloque, no hay botón. */
export function primerBloque(texto: string): string | null {
  const m = texto.match(/```[a-z]*\n([\s\S]*?)```/i);
  return m ? m[1].replace(/\n$/, "") : null;
}
