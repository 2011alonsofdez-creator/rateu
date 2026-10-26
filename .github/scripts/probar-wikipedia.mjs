/* LA LLAMADA DE VERDAD A WIKIPEDIA.
 *
 * Esto existe porque la parte que no se puede probar desde dentro es
 * justo la que importa: que la API conteste, que conteste lo que
 * creemos y que nuestro código lo sepa leer. Lo demás —los términos, la
 * dirección, el reparto— se prueba sin red.
 *
 * Carga el módulo de Kairo tal cual está en el repositorio, así que si
 * alguien le cambia algo y deja de funcionar, aquí se ve.
 *
 * Se usa desde Actions -> Probar Wikipedia -> Run workflow.
 */
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../kairo");

const jiti = createJiti(fileURLToPath(import.meta.url), {
  interopDefault: true,
  alias: { "@": path.join(RAIZ, "src") },
});

const w = await jiti.import(path.join(RAIZ, "src/lib/ia/wikipedia.ts"));

const PREGUNTAS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "¿qué pasó en Ceuta?",
      "¿quién es el presidente de España?",
      "¿cuándo son las próximas elecciones generales en España?",
      "¿quién ganó el último Gran Premio de Fórmula 1?",
    ];

let mal = 0;

for (const pregunta of PREGUNTAS) {
  const terminos = w.terminosDe(pregunta);
  console.log(`\n────────────────────────────────────────`);
  console.log(`PREGUNTA:  ${pregunta}`);
  console.log(`BUSCA:     ${terminos}`);

  const empezo = Date.now();
  let articulos = [];
  try {
    articulos = await w.articulosDe(pregunta, "es", 15000);
  } catch (e) {
    console.log(`REVENTÓ:   ${e}`);
    mal++;
    continue;
  }
  const ms = Date.now() - empezo;

  if (!articulos.length) {
    console.log(`SIN NADA   (${ms} ms) — ni artículos ni respuesta`);
    mal++;
    continue;
  }

  console.log(`ENCONTRÓ:  ${articulos.length} artículo(s) en ${ms} ms`);
  for (const a of articulos) {
    console.log(`  · ${a.titulo}`);
    console.log(`    ${a.url}`);
    console.log(`    ${a.extracto.slice(0, 180)}…`);
  }

  /* Lo que de verdad llega al modelo. Si esto sale vacío o sin enlaces,
     la búsqueda "funciona" y la respuesta sigue sin datos. */
  const hechos = w.comoHechos(articulos);
  if (!hechos.includes("http")) {
    console.log("  !! el bloque de hechos sale sin enlaces");
    mal++;
  }
}

console.log(`\n────────────────────────────────────────`);
console.log(mal === 0 ? "TODO BIEN: Wikipedia contesta y se lee bien." : `${mal} pregunta(s) sin respuesta.`);
process.exit(mal === 0 ? 0 : 1);
