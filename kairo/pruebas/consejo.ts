/* Pruebas del recuento del Consejo.
 *
 *   npx tsx pruebas/consejo.ts
 *
 * Aquí no hay red ni claves: son funciones puras. Y son justo las que
 * pueden fallar sin que nadie se entere, porque un voto mal leído no
 * revienta nada: solo cambia el resultado en silencio.
 *
 * Para ver cómo se forma el consejo según las claves que haya puestas:
 *   npx tsx pruebas/consejo-composicion.ts
 */

import {
  barajar,
  componerMaterial,
  contar,
  leerFirma,
  leerVotacion,
  sacarJson,
} from "@/lib/consejo/recuento";
import type { Punto } from "@/lib/consejo/tipos";

let fallos = 0;
const ok = (c: boolean, q: string) => { console.log(`  ${c ? "OK  " : "FALLO"} ${q}`); if (!c) fallos++; };

console.log("\n-- sacar el JSON de respuestas sucias --");
ok(sacarJson('bla\n```json\n{"a":1}\n```\nfin')?.a === 1, "envuelto en ```json con texto alrededor");
ok(sacarJson('```\n{"firma":"firmo"}\n```')?.firma === "firmo", "fence sin etiqueta");
ok(sacarJson('texto {"firma":"no_firmo"} mas')?.firma === "no_firmo", "JSON suelto sin fence");
ok(sacarJson('```json\n{"a":1}\n``` luego ```json\n{"a":2}\n```')?.a === 2, "dos bloques: gana el ultimo");
ok(sacarJson("no hay json") === null, "sin JSON devuelve null");
ok(sacarJson('```json\n{roto,}\n```') === null, "JSON roto devuelve null, no revienta");

console.log("\n-- leer votos tolerando formatos raros --");
const P: Punto[] = [{id:"P1",texto:"uno"},{id:"P2",texto:"dos"},{id:"P3",texto:"tres"}];
const v = leerVotacion('```json\n{"votos":{"P1":{"voto":"DE ACUERDO","motivo":"m"},"P2":"matiz","P3":{"voto":"inventado"}}}\n```', P);
ok(v.P1?.voto === "de_acuerdo", "mayusculas y espacio se normalizan");
ok(v.P2?.voto === "matiz", "voto como texto suelto, sin objeto");
ok(v.P3 === undefined, "voto inventado NO se cuenta (no se adivina)");
ok(Object.keys(leerVotacion("prosa sin json", P)).length === 0, "respuesta sin JSON = cero votos");

console.log("\n-- el recuento no exagera el acuerdo --");
const todos = { A:{voto:"de_acuerdo",motivo:""}, B:{voto:"de_acuerdo",motivo:""}, C:{voto:"de_acuerdo",motivo:""}, D:{voto:"de_acuerdo",motivo:""}, E:{voto:"de_acuerdo",motivo:""} } as any;
ok(contar(P[0], todos, 5).veredicto === "unanime", "5 de 5 a favor = unanime");

const tres = { A:{voto:"de_acuerdo",motivo:""}, B:{voto:"de_acuerdo",motivo:""}, C:{voto:"de_acuerdo",motivo:""} } as any;
const r = contar(P[0], tres, 5);
ok(r.veredicto !== "unanime", "3 de 5 NO es unanime aunque los 3 coincidan");
ok(r.veredicto === "acuerdo_con_matices" && r.emitidos === 3, `se declara como acuerdo de los ${r.emitidos} que votaron`);

const conMatiz = { A:{voto:"de_acuerdo",motivo:""}, B:{voto:"matiz",motivo:""}, C:{voto:"de_acuerdo",motivo:""}, D:{voto:"matiz",motivo:""}, E:{voto:"de_acuerdo",motivo:""} } as any;
ok(contar(P[0], conMatiz, 5).veredicto === "acuerdo_con_matices", "con matices no se llama unanime");

const partido = { A:{voto:"de_acuerdo",motivo:""}, B:{voto:"en_desacuerdo",motivo:""}, C:{voto:"en_desacuerdo",motivo:""}, D:{voto:"en_desacuerdo",motivo:""}, E:{voto:"abstencion",motivo:""} } as any;
ok(contar(P[0], partido, 5).veredicto === "sin_acuerdo", "mayoria en contra = sin acuerdo");
ok(contar(P[0], {}, 5).veredicto === "sin_votos", "nadie voto = sin votos, no acuerdo");

console.log("\n-- firmas --");
ok(leerFirma("FIRMO CON RESERVAS") === "firmo_con_reservas", "firma con mayusculas y espacios");
ok(leerFirma("quiza") === null, "firma inventada = null");

console.log("\n-- los alias se barajan --");
const base = ["A","B","C","D","E","F"];
const distintos = new Set(Array.from({length:40}, () => barajar(base).join("")));
ok(distintos.size > 5, `40 barajadas dan ${distintos.size} ordenes distintos`);
ok(barajar(base).slice().sort().join("") === base.join(""), "barajar no pierde ni duplica elementos");

console.log("\n-- el material se reparte entre los documentos, no por orden de llegada --");
const corto = { nombre: "carta", texto: "C".repeat(500) };
const largo = { nombre: "sentencia", texto: "S".repeat(40000) };
const medio = { nombre: "demanda", texto: "D".repeat(7000) };

const holgado = componerMaterial([corto, medio], 60000);
ok(holgado.recortados.length === 0, "si cabe todo, no se recorta nada");
ok(holgado.texto.includes("--- carta ---"), "cada documento entra con su nombre");
ok(holgado.texto.includes("D".repeat(7000)), "y con su texto entero");

const apretado = componerMaterial([corto, medio, largo], 20000);
ok(
  apretado.texto.includes("C".repeat(500)),
  "el documento corto entra ENTERO aunque el total no quepa",
);
ok(
  apretado.recortados.length === 1 && apretado.recortados[0].nombre === "sentencia",
  `solo se recorta el que se pasa: ${apretado.recortados.map((r) => r.nombre).join(", ") || "ninguno"}`,
);
ok(apretado.texto.includes("--- demanda ---"), "ninguno desaparece del material");
ok(apretado.letras <= 20000, `y el total respeta el tope: ${apretado.letras} caracteres`);

const tresGordos = componerMaterial([largo, largo, largo], 9000);
ok(tresGordos.recortados.length === 3, "si todos se pasan, se recortan los tres");
ok(
  new Set(tresGordos.recortados.map((r) => r.a)).size === 1,
  "a partes iguales: el mismo cupo para cada uno",
);
ok(tresGordos.letras <= 9000, `tope respetado con tres gordos: ${tresGordos.letras}`);

const vacio = componerMaterial([{ nombre: "nada", texto: "   " }], 60000);
ok(vacio.texto === "" && vacio.letras === 0, "un documento sin texto no monta cabecera vacia");

console.log(fallos ? `\n${fallos} FALLOS\n` : "\nTodo correcto\n");
process.exit(fallos ? 1 : 0);
