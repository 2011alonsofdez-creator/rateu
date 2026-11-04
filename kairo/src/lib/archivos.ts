import {
  ADJUNTOS,
  esDocumento,
  esImagen,
  esTexto,
  type Adjunto,
} from "./tipos";

/* Preparar un archivo para mandárselo a Kairo. Solo navegador.
 *
 * Tres cosas pasan aquí, y las tres son para que el usuario no se
 * choque con un error después:
 *
 *  1. Se comprueba el tipo ANTES de leer nada. Decirle a alguien que su
 *     archivo no vale cuando ya ha esperado a que suba es de mala
 *     educación.
 *  2. Las fotos se encogen. Una foto del móvil son 4 MB y 4000 píxeles
 *     de ancho; el modelo no ve más detalle por encima de 1600, así que
 *     lo único que aporta ese tamaño es que la petición no quepa.
 *  3. Los .txt, .md y .csv no se mandan como archivo: se leen como
 *     texto y se pegan en la pregunta. Así los entiende cualquier
 *     modelo, incluso los que no saben mirar documentos.
 */

export type FalloArchivo = "tipo" | "grande" | "roto";

export type Preparado =
  | { ok: true; adjunto: Adjunto }
  | { ok: false; motivo: FalloArchivo; nombre: string };

/** Lo que el navegador dice que es, o lo que diga la extensión cuando no
 *  lo sabe (Windows no siempre reconoce .md ni .csv). */
export function tipoDe(archivo: File): string {
  if (archivo.type) return archivo.type;

  const ext = archivo.name.toLowerCase().split(".").pop() ?? "";
  if (ext === "md" || ext === "markdown") return "text/markdown";
  if (ext === "csv") return "text/csv";
  if (ext === "txt") return "text/plain";
  if (ext === "pdf") return "application/pdf";
  return "";
}

export function tipoAceptado(tipo: string): boolean {
  return (
    esImagen(tipo) ||
    esTexto(tipo) ||
    (ADJUNTOS.documentos as readonly string[]).includes(tipo)
  );
}

/** "2,4 MB" / "812 KB". Para enseñárselo a alguien, no para calcular. */
export function tamano(bytes: number, lang: "es" | "en" = "es"): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString(lang, { maximumFractionDigits: 1 })} MB`;
}

const base64De = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binario = "";
  // A trozos: con un archivo grande, pasar el array entero a
  // String.fromCharCode revienta la pila del navegador.
  const PASO = 0x8000;
  for (let i = 0; i < bytes.length; i += PASO) {
    binario += String.fromCharCode(...bytes.subarray(i, i + PASO));
  }
  return btoa(binario);
};

/* Encoger una foto. Devuelve null si el navegador no puede con ella
   (formatos raros, imágenes rotas), y entonces se manda tal cual. */
async function encoger(archivo: File, ladoMax = 1600, calidad = 0.85) {
  if (typeof createImageBitmap !== "function") return null;

  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));

    // Ya es pequeña y no pesa: no se toca. Recomprimir una imagen que
    // está bien solo le quita calidad.
    if (escala === 1 && archivo.size <= 600 * 1024) {
      bitmap.close();
      return null;
    }

    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(bitmap.width * escala);
    lienzo.height = Math.round(bitmap.height * escala);

    const pincel = lienzo.getContext("2d");
    if (!pincel) {
      bitmap.close();
      return null;
    }

    pincel.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
    bitmap.close();

    const trozo: Blob | null = await new Promise((r) =>
      lienzo.toBlob(r, "image/jpeg", calidad),
    );
    if (!trozo || trozo.size >= archivo.size) return null;

    return { blob: trozo, tipo: "image/jpeg" };
  } catch {
    return null;
  }
}


/* EL TEXTO DE UN PDF, SACADO AQUÍ EN EL NAVEGADOR.
 *
 * El motivo no es la elegancia, es un muro: los archivos viajan dentro
 * de la propia petición, en base64 —que abulta un tercio más—, y Vercel
 * corta cualquier petición por encima de 4,5 MB. De ahí salía el tope
 * de 3 MB por archivo, que no es un capricho pero tampoco es defendible:
 * tres apuntes de clase en PDF se pasan de ahí sin esfuerzo, y lo que
 * veía quien los arrastraba era "pesa demasiado" en una app que presume
 * de leer documentos.
 *
 * Un PDF de texto de diez megas son trescientas mil letras. Mandar las
 * letras en vez del archivo quita el problema de raíz: pasa de diez
 * megas a trescientos kilobytes, cabe de sobra, y el modelo lo entiende
 * igual de bien —mejor, de hecho, porque no gasta fichas en mirar el
 * dibujo de cada página—.
 *
 * Lo que SÍ se pierde son las imágenes, los esquemas y los PDFs
 * escaneados, que no llevan letras dentro sino fotos de letras. Por eso
 * esto no sustituye al envío normal: lo intenta primero, y si el PDF no
 * suelta texto de verdad se manda como siempre.
 *
 * La librería se carga solo cuando hace falta (son casi dos megas), así
 * que quien nunca adjunta un PDF no la descarga jamás. */
const LETRAS_MINIMAS = 200;

async function textoDelPdf(archivo: File): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const doc = await pdfjs.getDocument({
      data: new Uint8Array(await archivo.arrayBuffer()),
    }).promise;

    const paginas: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      const contenido = await pagina.getTextContent();
      const linea = contenido.items
        .map((i) => ("str" in i ? i.str : ""))
        .join(" ")
        .replace(/[ \t]+/g, " ")
        .trim();
      if (linea) paginas.push(linea);
    }
    doc.cleanup();

    const texto = paginas.join("\n\n").trim();
    /* Un escaneado devuelve cuatro letras sueltas de los metadatos. Si
       no hay texto de verdad, esto no vale y se manda el archivo. */
    return texto.length >= LETRAS_MINIMAS ? texto : null;
  } catch {
    /* Un PDF roto, protegido o una librería que no carga: no es motivo
       para no dejar adjuntar. Se sigue por el camino de siempre. */
    return null;
  }
}

/** Deja el archivo listo para viajar, o dice por qué no puede. */
export async function prepararArchivo(archivo: File): Promise<Preparado> {
  const tipo = tipoDe(archivo);
  const nombre = archivo.name || "archivo";

  if (!tipoAceptado(tipo)) return { ok: false, motivo: "tipo", nombre };

  try {
    /* Los de texto se leen como texto: no se mandan como archivo, se
       pegan en la pregunta. El contenido va igualmente en base64 para
       que viaje por el mismo sitio que los demás. */
    if (esTexto(tipo)) {
      const texto = await archivo.text();
      const datos = base64De(new TextEncoder().encode(texto).buffer as ArrayBuffer);
      if (datos.length > ADJUNTOS.bytesPorArchivo) {
        return { ok: false, motivo: "grande", nombre };
      }
      return { ok: true, adjunto: { nombre, tipo, datos, bytes: archivo.size } };
    }

    /* Un PDF: primero se intenta por las letras. Si las suelta, viaja
       como texto y el tope de tamaño deja de pintar nada. */
    if (esDocumento(tipo)) {
      const texto = await textoDelPdf(archivo);
      if (texto) {
        const datos = base64De(new TextEncoder().encode(texto).buffer as ArrayBuffer);
        return {
          ok: true,
          adjunto: { nombre, tipo: "text/plain", datos, bytes: archivo.size },
        };
      }
    }

    const encogida = esImagen(tipo) ? await encoger(archivo) : null;
    const fuente: Blob = encogida?.blob ?? archivo;
    const tipoFinal = encogida?.tipo ?? tipo;

    const datos = base64De(await fuente.arrayBuffer());
    if (datos.length > ADJUNTOS.bytesPorArchivo) {
      return { ok: false, motivo: "grande", nombre };
    }

    return {
      ok: true,
      adjunto: { nombre, tipo: tipoFinal, datos, bytes: fuente.size },
    };
  } catch {
    return { ok: false, motivo: "roto", nombre };
  }
}

/** Lo que ocupa todo junto tal y como va a viajar. */
export const pesoTotal = (adjuntos: Adjunto[]) =>
  adjuntos.reduce((n, a) => n + a.datos.length, 0);
