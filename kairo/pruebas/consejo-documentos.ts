/* ¿Caben varios documentos, y se dice cuando uno no entra?
 *
 *   npx tsx pruebas/consejo-documentos.ts
 */
import { readFileSync } from "node:fs";
import { revisarDocumentos, DOCUMENTOS } from "@/lib/consejo/documentos";

function pdf(nombre: string) {
  const b = readFileSync("/tmp/ktest/demanda.pdf");
  return { nombre, tipo: "application/pdf", datos: b.toString("base64"), bytes: b.length };
}

let fallos = 0;
const ok = (c: boolean, q: string) => { console.log(`  ${c ? "OK  " : "FALLO"} ${q}`); if (!c) fallos++; };

console.log("\n-- tres PDFs, que es el caso real --");
const tres = revisarDocumentos([pdf("demanda.pdf"), pdf("carta_sancion.pdf"), pdf("nomina.pdf")]);
ok(tres.documentos.length === 3, `entran los tres: ${tres.nombres.join(", ")}`);
ok(tres.rechazados.length === 0, "ninguno rechazado");

console.log("\n-- mezcla de PDF y texto --");
const mezcla = revisarDocumentos([
  pdf("demanda.pdf"),
  { nombre: "notas.txt", tipo: "text/plain", datos: Buffer.from("Mis notas del caso").toString("base64"), bytes: 18 },
]);
ok(mezcla.documentos.length === 1, "el PDF va como documento");
ok(mezcla.texto.includes("Mis notas del caso"), "el texto se pega a la pregunta, no viaja como archivo");

console.log("\n-- lo que NO debe pasar --");
const malos = revisarDocumentos([
  { nombre: "virus.exe", tipo: "application/x-msdownload", datos: "AAAA", bytes: 3 },
  { nombre: "roto.pdf", tipo: "application/pdf", datos: "no-es-base64-válido!!", bytes: 10 },
]);
ok(malos.documentos.length === 0, "no entra ninguno de los dos");
ok(malos.rechazados.length === 2, `y se dice por qué: ${malos.rechazados.map((r) => r.split(":")[0]).join(", ")}`);

console.log("\n-- el tope de cantidad --");
const muchos = revisarDocumentos(Array.from({ length: DOCUMENTOS.max + 3 }, (_, i) => pdf(`doc${i}.pdf`)));
ok(muchos.documentos.length === DOCUMENTOS.max, `entran ${DOCUMENTOS.max}, que es el tope`);
ok(muchos.rechazados.length === 3, "y los 3 que sobran se reportan");

console.log(fallos ? `\n${fallos} FALLOS\n` : "\nTodo correcto\n");
process.exit(fallos ? 1 : 0);
