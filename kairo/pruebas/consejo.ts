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

import { contar, leerVotacion, sacarJson, barajar, leerFirma } from "@/lib/consejo/recuento";
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

console.log(fallos ? `\n${fallos} FALLOS\n` : "\nTodo correcto\n");
process.exit(fallos ? 1 : 0);
