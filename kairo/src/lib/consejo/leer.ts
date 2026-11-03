import type { Adjunto } from "@/lib/tipos";

/* Abrir un PDF y decir si trae texto. Solo servidor.
 *
 * Vive aparte del motor por una razón concreta: la página necesita saber
 * esto ANTES de gastar nada. Antes se enteraba después de pagar quince
 * llamadas, cuando el aviso de «nadie ha podido mirarlo» llegaba ya con
 * la deliberación hecha, y eso es dinero tirado por algo que se puede
 * comprobar gratis en medio segundo.
 *
 * El criterio de «esto es un escaneo» tiene que ser el mismo en los dos
 * sitios. Si el aviso previo dijera que un PDF está bien y luego el
 * motor lo mandara al modelo, el aviso sería peor que no tenerlo.
 */

export type Lectura = {
  nombre: string;
  /** texto: se puede leer aquí · escaneo: hace falta un modelo que mire ·
   *  imagen: lo mismo, pero nunca tuvo texto · roto: no se pudo abrir. */
  estado: "texto" | "escaneo" | "imagen" | "roto";
  paginas: number;
  caracteres: number;
  /** El texto ya extraído, para no volver a sacarlo en el motor. */
  texto: string;
  motivo?: string;
};

/** ¿Tan poco texto que es un escaneo?
 *
 *  Un PDF escaneado no da cero caracteres siempre: da los cuatro de un
 *  sello o un número de página. Por eso el umbral va por páginas y no es
 *  un simple «está vacío». */
export function pareceEscaneo(caracteres: number, paginas: number): boolean {
  return caracteres < Math.max(80, paginas * 40);
}

export async function leerPdf(datos: string): Promise<{ paginas: number; texto: string }> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(datos, "base64")));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return { paginas: totalPages, texto: String(text ?? "").trim() };
}

/** Pasa por todos los adjuntos y dice qué se puede leer de cada uno. */
export async function leerTodo(adjuntos: Adjunto[]): Promise<Lectura[]> {
  const salida: Lectura[] = [];

  for (const a of adjuntos) {
    if (a.tipo !== "application/pdf") {
      salida.push({
        nombre: a.nombre,
        estado: "imagen",
        paginas: 0,
        caracteres: 0,
        texto: "",
      });
      continue;
    }

    try {
      const { paginas, texto } = await leerPdf(a.datos);
      const escaneo = pareceEscaneo(texto.length, paginas);
      salida.push({
        nombre: a.nombre,
        estado: escaneo ? "escaneo" : "texto",
        paginas,
        caracteres: texto.length,
        texto: escaneo ? "" : texto,
      });
    } catch (e) {
      salida.push({
        nombre: a.nombre,
        estado: "roto",
        paginas: 0,
        caracteres: 0,
        texto: "",
        motivo: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return salida;
}
