/* ¿Llega el texto de los PDFs al consejo sin pasar por ningún modelo?
 *
 *   npx tsx pruebas/consejo-adjuntos.ts demanda.pdf carta.pdf sentencia.pdf
 *
 * Es la prueba que faltaba. Dos deliberaciones enteras se gastaron en
 * debatir sobre un «no he recibido ningún adjunto» porque nadie
 * comprobaba este paso.
 *
 * Usa `revisarDocumentos`, que es la puerta del consejo, y no la del
 * chat: el consejo admite expedientes de varios papeles y archivos más
 * pesados, y probar con los límites del chat daba un falso fallo con
 * cualquier escaneo.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { revisarDocumentos } from "@/lib/consejo/documentos";
import { componerMaterial, type Pieza } from "@/lib/consejo/recuento";
import { MATERIAL_MAX } from "@/lib/consejo/tipos";

async function main() {
  const rutas = process.argv.slice(2);
  if (!rutas.length) {
    console.error("Uso: npx tsx pruebas/consejo-adjuntos.ts <ruta.pdf> [más rutas...]");
    process.exit(1);
  }

  /* El tipo se manda vacío a propósito: es lo que da el navegador con
     una extensión en mayúsculas o un nombre raro, y el servidor tiene
     que sacarlo de los bytes. */
  const crudos = rutas.map((r) => {
    const b = readFileSync(r);
    return { nombre: basename(r), tipo: "", datos: b.toString("base64"), bytes: b.length };
  });

  const rev = revisarDocumentos(crudos);
  console.log(`\n1. validación del consejo: ${rev.documentos.length} de ${crudos.length}`);
  for (const r of rev.rechazados) console.log(`   RECHAZADO ${r}`);
  if (!rev.documentos.length) {
    console.error("   FALLO: no pasa ningún archivo");
    process.exit(1);
  }

  const { extractText, getDocumentProxy } = await import("unpdf");
  const piezas: Pieza[] = [];
  const escaneados: string[] = [];

  console.log("\n2. extracción de texto, archivo a archivo:");
  for (const a of rev.documentos) {
    if (a.tipo !== "application/pdf") {
      escaneados.push(`${a.nombre} (${a.tipo})`);
      console.log(`   ${a.nombre}: no es PDF, lo tiene que mirar un modelo`);
      continue;
    }
    const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(a.datos, "base64")));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    const limpio = String(text ?? "").trim();

    if (limpio.length < Math.max(80, totalPages * 40)) {
      escaneados.push(a.nombre);
      console.log(
        `   ${a.nombre}: ${limpio.length} caracteres en ${totalPages} páginas — ` +
          "escaneado, hace falta un modelo que lo mire",
      );
      continue;
    }
    console.log(`   ${a.nombre}: ${limpio.length} caracteres de ${totalPages} páginas`);
    piezas.push({ nombre: `${a.nombre} (${totalPages} páginas)`, texto: limpio });
  }

  const m = componerMaterial(piezas, MATERIAL_MAX);
  console.log(`\n3. material que verían los seis: ${m.letras} de ${MATERIAL_MAX} caracteres`);
  for (const r of m.recortados) {
    console.log(`   RECORTADO ${r.nombre}: entran ${r.a} de ${r.de} caracteres`);
  }
  if (escaneados.length) {
    console.log(`\n   Sin capa de texto: ${escaneados.join(", ")}.`);
    console.log("   Eso lo transcribe un miembro que sepa ver archivos (Gemini, Claude o GPT nativos).");
  }

  const fallo = !m.letras && !escaneados.length;
  console.log(
    fallo
      ? "\n   FALLO: no hay material ni nada que transcribir.\n"
      : "\n   OK: el consejo recibiría esto, igual para los seis.\n",
  );
  process.exit(fallo ? 1 : 0);
}
main();
