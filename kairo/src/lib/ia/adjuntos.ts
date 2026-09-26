import { ADJUNTOS, esImagen, esTexto, esDocumento, type Adjunto } from "@/lib/tipos";

/* Revisar los archivos que llegan con una pregunta. Solo servidor.
 *
 * Todo lo que hay aquí ya lo comprueba el navegador antes de mandarlo.
 * Da igual: el navegador es del usuario y la petición se puede escribir
 * a mano. Lo que decide de verdad es esto.
 *
 * Y hay una segunda cosa, menos obvia: un archivo de texto NO se manda
 * como archivo. Se lee aquí y se pega dentro de la pregunta, entre
 * delimitadores. Así lo entiende cualquier modelo —también los que no
 * saben mirar documentos— y, sobre todo, queda claro dónde empieza y
 * dónde acaba algo que ha escrito otro.
 */

/** Lo que se le deja meter a un archivo de texto dentro de la pregunta.
 *  Un .csv de veinte mil líneas no cabe en ningún modelo, y truncarlo
 *  diciéndolo es mejor que reventar la petición. */
const LETRAS_POR_ARCHIVO = 20000;

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

export type Revisados = {
  /** Imágenes y PDFs: van como archivo al modelo que sepa mirarlos. */
  adjuntos: Adjunto[];
  /** Los de texto, ya convertidos en algo que pegar a la pregunta. */
  texto: string;
  /** Los nombres de todos, para dejar constancia en el historial. */
  nombres: string[];
  /** Cuántos se han caído por no cumplir. */
  rechazados: number;
};

const VACIO: Revisados = { adjuntos: [], texto: "", nombres: [], rechazados: 0 };

/** Un nombre de archivo que se pueda enseñar sin estropear nada:
 *  sin saltos de línea y sin comillas que rompan el delimitador. */
function nombreLimpio(valor: unknown): string {
  if (typeof valor !== "string") return "archivo";
  const limpio = valor.replace(/[\r\n"<>]/g, " ").replace(/\s+/g, " ").trim();
  return limpio.slice(0, 120) || "archivo";
}

export function revisarAdjuntos(crudo: unknown): Revisados {
  if (!Array.isArray(crudo) || !crudo.length) return VACIO;

  const adjuntos: Adjunto[] = [];
  const nombres: string[] = [];
  const trozosDeTexto: string[] = [];
  let rechazados = 0;
  let total = 0;

  for (const cualquiera of crudo) {
    if (adjuntos.length + trozosDeTexto.length >= ADJUNTOS.max) {
      rechazados++;
      continue;
    }

    const a = cualquiera as Record<string, unknown> | null;
    const tipo = typeof a?.tipo === "string" ? a.tipo : "";
    const datos = typeof a?.datos === "string" ? a.datos : "";

    const valido =
      (esImagen(tipo) || esDocumento(tipo) || esTexto(tipo)) &&
      datos.length > 0 &&
      datos.length <= ADJUNTOS.bytesPorArchivo &&
      BASE64.test(datos) &&
      total + datos.length <= ADJUNTOS.bytesTotal;

    if (!valido) {
      rechazados++;
      continue;
    }

    total += datos.length;
    const nombre = nombreLimpio(a?.nombre);
    nombres.push(nombre);

    if (esTexto(tipo)) {
      /* Se lee aquí y se pega en la pregunta. Va entre delimitadores y
         anunciado como lo que es: texto de un archivo, no una orden.
         Lo de dentro lo ha escrito cualquiera, incluido quien quisiera
         colarle instrucciones al modelo. */
      let contenido = Buffer.from(datos, "base64").toString("utf8").replace(/\u0000/g, "");
      let recortado = false;

      if (contenido.length > LETRAS_POR_ARCHIVO) {
        contenido = contenido.slice(0, LETRAS_POR_ARCHIVO);
        recortado = true;
      }

      trozosDeTexto.push(
        `<<<ARCHIVO ${nombre}\n${contenido}\n${
          recortado ? "[…el archivo sigue, pero se ha cortado aquí por tamaño]\n" : ""
        }FIN DEL ARCHIVO>>>`,
      );
      continue;
    }

    adjuntos.push({
      nombre,
      tipo,
      datos,
      bytes: typeof a?.bytes === "number" && a.bytes > 0 ? Math.round(a.bytes) : datos.length,
    });
  }

  return {
    adjuntos,
    texto: trozosDeTexto.length ? `\n\n${trozosDeTexto.join("\n\n")}` : "",
    nombres,
    rechazados,
  };
}

/** La coletilla que se guarda con la pregunta, para que al reabrir la
 *  conversación se vea qué llevaba adjunto. El archivo no se guarda
 *  —ni el suyo ni el de nadie—, pero su nombre sí. */
export function marcaDeArchivos(nombres: string[]): string {
  if (!nombres.length) return "";
  return `\n\n[Archivos adjuntos: ${nombres.join(", ")}]`;
}
