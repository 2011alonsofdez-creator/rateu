/* Comprueba que el texto de un PDF llega al consejo sin pasar por ningún
 * modelo:  npx tsx pruebas/consejo-adjuntos.ts <ruta.pdf>
 *
 * Es la prueba que faltaba. Dos deliberaciones enteras se gastaron en
 * debatir sobre un «no he recibido ningún adjunto» porque nadie
 * comprobaba este paso. */
import { readFileSync } from "node:fs";
import { revisarAdjuntos } from "@/lib/ia/adjuntos";

async function main() {
  const ruta = process.argv[2];
  if (!ruta) {
    console.error("Uso: npx tsx pruebas/consejo-adjuntos.ts <ruta.pdf>");
    process.exit(1);
  }

  const bytes = readFileSync(ruta);
  const adjunto = {
    nombre: ruta.split("/").pop()!,
    tipo: "application/pdf",
    datos: bytes.toString("base64"),
    bytes: bytes.length,
  };

  const revisados = revisarAdjuntos([adjunto]);
  console.log(`1. validación de Kairo : ${revisados.adjuntos.length} aceptado(s), ${revisados.nombres.join(", ")}`);
  if (!revisados.adjuntos.length) {
    console.error("   FALLO: el archivo no pasa la validación");
    process.exit(1);
  }

  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(revisados.adjuntos[0].datos, "base64")));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const limpio = String(text ?? "").trim();

  console.log(`2. extracción de texto : ${limpio.length} caracteres de ${totalPages} páginas`);
  const escaneado = limpio.length < Math.max(80, totalPages * 40);
  console.log(`3. ¿necesita un modelo? : ${escaneado ? "SÍ (parece escaneado)" : "no, el texto está dentro"}`);

  if (!escaneado) {
    console.log(`4. primeras palabras   : ${limpio.slice(0, 120).replace(/\s+/g, " ")}…`);
    console.log("\n   OK: el consejo recibiría este texto, igual para los seis.");
  } else {
    console.log("\n   El PDF no tiene capa de texto: haría falta un modelo que lo mire.");
  }
}
main();
