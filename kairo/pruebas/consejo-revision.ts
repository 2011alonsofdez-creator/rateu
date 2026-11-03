/* ¿Avisa ANTES de gastar de que un documento no se va a poder leer?
 *
 *   npx tsx pruebas/consejo-revision.ts <pdf> [más pdfs...]
 *
 * Tres deliberaciones enteras se pagaron sobre un expediente cuya carta
 * de sanción era un escaneo que nadie podía abrir, y el aviso llegaba al
 * final. Esta es la comprobación que lo impide, y no cuesta nada: ningún
 * modelo interviene.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { revisarDocumentos } from "@/lib/consejo/documentos";
import { leerTodo, pareceEscaneo } from "@/lib/consejo/leer";

let fallos = 0;
const ok = (c: boolean, q: string) => {
  console.log(`  ${c ? "OK  " : "FALLO"} ${q}`);
  if (!c) fallos++;
};

async function main() {
  console.log("\n-- el umbral de «esto es un escaneo» --");
  ok(pareceEscaneo(0, 2), "0 caracteres en 2 páginas = escaneo");
  ok(pareceEscaneo(60, 2), "60 caracteres en 2 páginas (un sello) = escaneo");
  ok(!pareceEscaneo(7394, 4), "7.394 en 4 páginas = tiene texto");
  ok(pareceEscaneo(200, 40), "200 caracteres en 40 páginas = escaneo");

  const rutas = process.argv.slice(2);
  if (!rutas.length) {
    console.log("\n  (pásale PDFs para probarlo con archivos de verdad)");
  } else {
    console.log("\n-- archivos de verdad --");
    const crudos = rutas.map((r) => {
      const b = readFileSync(r);
      return { nombre: basename(r), tipo: "", datos: b.toString("base64"), bytes: b.length };
    });
    const rev = revisarDocumentos(crudos);
    const lecturas = await leerTodo(rev.documentos);

    for (const l of lecturas) {
      const marca = l.estado === "texto" ? "✓" : l.estado === "roto" ? "✕" : "!";
      console.log(
        `  ${marca} ${l.nombre}: ${l.estado}` +
          (l.estado === "texto"
            ? ` · ${l.caracteres} caracteres de ${l.paginas} páginas`
            : l.estado === "escaneo"
              ? ` · ${l.paginas} páginas sin texto`
              : ""),
      );
    }
    ok(lecturas.length === rev.documentos.length, "se revisan todos los que pasan el filtro");
    ok(
      lecturas.every((l) => (l.estado === "texto") === l.texto.length > 0),
      "solo los que tienen texto traen texto, y los escaneos vienen vacíos",
    );
  }

  console.log(fallos ? `\n${fallos} FALLOS\n` : "\nTodo correcto\n");
  process.exit(fallos ? 1 : 0);
}
main();
