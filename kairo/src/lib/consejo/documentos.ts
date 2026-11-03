import { ADJUNTOS, esImagen, esTexto, type Adjunto } from "@/lib/tipos";

/* Los documentos que se le echan al consejo, con sus propios límites.
 *
 * El chat usa los de `ADJUNTOS`: cuatro archivos y 4 MB en total, que es
 * lo que aguanta el servidor de Vercel en una petición. Al consejo se le
 * quedan cortos, porque un expediente son varios papeles —la demanda, la
 * carta de sanción, la nómina— y vienen de uno en uno.
 *
 * Aquí caben más por una razón concreta: el PDF **no viaja entero** a
 * ningún modelo. Se le saca el texto en el servidor y lo que se manda
 * son caracteres, así que diez PDFs ocupan en la deliberación lo que
 * ocupa su texto, no lo que pesan sus imágenes.
 *
 * El tope de la petición sigue existiendo cuando Kairo corre publicado
 * en Vercel. En local no hay ninguno, y es donde se usa el consejo con
 * expedientes de verdad.
 */
export const DOCUMENTOS = {
  /** Cuántos archivos por deliberación. */
  max: 10,
  /** Lo que puede pesar cada uno, ya en base64 (que es lo que viaja). */
  bytesPorArchivo: 12 * 1024 * 1024,
  /** Y todos juntos. Por encima de esto, el navegador tarda en subirlo y
   *  el servidor publicado lo rechaza, así que se para antes y se dice. */
  bytesTotal: 40 * 1024 * 1024,
} as const;

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/* Qué es esto de verdad, mirando los primeros bytes.
 *
 * El tipo lo declara el navegador a partir de la extensión, y a veces no
 * lo sabe: llega vacío y el archivo se caía con un «no se acepta el tipo
 * desconocido» que no decía nada. Pasa con extensiones en mayúsculas o
 * raras —`Sentencia..PDF`— y con archivos arrastrados desde sitios que
 * no registran el tipo. Los bytes de cabecera no se equivocan y son
 * cuatro comparaciones, así que manda la firma y el navegador es solo
 * una pista.
 */
function tipoReal(datos: string, declarado: string): string {
  // 16 bytes bastan para cualquiera de estas firmas; 24 caracteres de base64.
  const cabeza = Buffer.from(datos.slice(0, 24), "base64");
  const ascii = cabeza.toString("latin1");

  if (ascii.startsWith("%PDF-")) return "application/pdf";
  if (ascii.startsWith("\x89PNG\r\n\x1a\n")) return "image/png";
  if (ascii.startsWith("\xff\xd8\xff")) return "image/jpeg";
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return "image/gif";
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";

  return declarado;
}

/** Un nombre que se pueda enseñar sin que rompa nada al pintarlo. */
function nombreLimpio(valor: unknown): string {
  const limpio = String(valor ?? "")
    .replace(/[\r\n"<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return limpio.slice(0, 160) || "documento";
}

export type Revisados = {
  /** Los que pasan, listos para leerles el texto. */
  documentos: Adjunto[];
  /** Los de texto plano, ya convertidos en algo que pegar a la pregunta. */
  texto: string;
  nombres: string[];
  /** Por qué se cayó alguno, para poder decírselo a quien pregunta. */
  rechazados: string[];
};

const VACIO: Revisados = { documentos: [], texto: "", nombres: [], rechazados: [] };

/* Revisar lo que llega. Solo servidor.
 *
 * Lo comprueba todo otra vez aunque el navegador ya lo haya hecho: el
 * navegador es de quien pregunta y la petición se puede escribir a mano.
 * Lo que decide de verdad es esto.
 */
export function revisarDocumentos(crudo: unknown): Revisados {
  if (!Array.isArray(crudo) || !crudo.length) return VACIO;

  const documentos: Adjunto[] = [];
  const nombres: string[] = [];
  const trozosDeTexto: string[] = [];
  const rechazados: string[] = [];
  let total = 0;

  for (const cualquiera of crudo) {
    const a = cualquiera as Partial<Adjunto>;
    const nombre = nombreLimpio(a?.nombre);

    if (documentos.length + trozosDeTexto.length >= DOCUMENTOS.max) {
      rechazados.push(`${nombre}: pasa de ${DOCUMENTOS.max} archivos`);
      continue;
    }

    const datos = String(a?.datos ?? "");

    if (!datos || !BASE64.test(datos)) {
      rechazados.push(`${nombre}: el contenido no llegó bien`);
      continue;
    }

    const tipo = tipoReal(datos, String(a?.tipo ?? ""));

    // El tamaño real, no el que diga quien envía.
    const bytes = Math.floor((datos.length * 3) / 4);
    if (bytes > DOCUMENTOS.bytesPorArchivo) {
      rechazados.push(
        `${nombre}: pesa ${Math.round(bytes / 1024 / 1024)} MB y el tope por archivo es ` +
          `${DOCUMENTOS.bytesPorArchivo / 1024 / 1024} MB`,
      );
      continue;
    }
    if (total + bytes > DOCUMENTOS.bytesTotal) {
      rechazados.push(`${nombre}: entre todos pasan de ${DOCUMENTOS.bytesTotal / 1024 / 1024} MB`);
      continue;
    }

    const aceptado =
      esImagen(tipo) ||
      esTexto(tipo) ||
      (ADJUNTOS.documentos as readonly string[]).includes(tipo);
    if (!aceptado) {
      rechazados.push(`${nombre}: no se acepta el tipo ${tipo || "desconocido"}`);
      continue;
    }

    total += bytes;
    nombres.push(nombre);

    if (esTexto(tipo)) {
      /* Un archivo de texto no se manda como archivo: se lee aquí y se
         pega en la pregunta entre delimitadores. Así lo entiende
         cualquier modelo —también los que no saben mirar documentos— y
         queda claro dónde empieza y acaba algo escrito por otro. */
      let contenido = Buffer.from(datos, "base64").toString("utf-8");
      const TOPE = 60000;
      if (contenido.length > TOPE) {
        contenido =
          `${contenido.slice(0, TOPE)}\n[...recortado: el archivo tenía ${contenido.length} caracteres]`;
      }
      trozosDeTexto.push(`--- ${nombre} ---\n${contenido}`);
    } else {
      documentos.push({ nombre, tipo, datos, bytes });
    }
  }

  return { documentos, texto: trozosDeTexto.join("\n\n"), nombres, rechazados };
}
