/* ¿Se puede leer lo que falla?
 *
 *   npx tsx pruebas/consejo-errores.ts
 *
 * Un 429 de Google son cuatro mil caracteres de JSON, y la cadena de
 * suplentes lo pide cinco veces. En pantalla eso salió como una pared de
 * mil caracteres repetidos que tapaba el resto del consejo y acababa
 * cortada a mitad de una URL. Estas son funciones puras, y son justo las
 * que se rompen sin que nadie se entere: un aviso ilegible no revienta
 * nada, solo hace que no lo leas.
 */
import { agruparFallos, resumirError } from "@/lib/consejo/motor";

let fallos = 0;
const ok = (c: boolean, q: string) => {
  console.log(`  ${c ? "OK  " : "FALLO"} ${q}`);
  if (!c) fallos++;
};

/* El 429 real de Google, tal como llegó. */
const CUOTA = JSON.stringify({
  error: {
    code: 429,
    message:
      "You exceeded your current quota, please check your plan and billing details. " +
      "For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. " +
      "To monitor your current usage, head to: https://console.cloud.google.com/billing",
    status: "RESOURCE_EXHAUSTED",
    details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "47880s" }],
  },
});

console.log("\n-- un error suelto --");
const uno = resumirError(CUOTA);
ok(uno.length < 140, `cabe en una línea: ${uno.length} caracteres de ${CUOTA.length}`);
ok(uno.includes("exceeded your current quota"), "y sigue diciendo qué pasó");
ok(!uno.includes("http"), "sin las URLs de ayuda, que no dicen nada");
ok(uno.includes("13 h 18 min"), `la espera en horas, no en segundos: «${uno.slice(-24)}»`);

console.log("\n-- la cadena entera caída por lo mismo --");
const modelos = [
  "gemini-pro-latest",
  "gemini-3.1-pro-preview",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-flash-lite-latest",
];
const cadena = agruparFallos(modelos.map((m) => `${m}: ${resumirError(CUOTA)}`));
ok(cadena.length < 200, `una sola causa, no cinco: ${cadena.length} caracteres`);
ok(cadena.includes("5 modelos probados"), "y se dice cuántos se intentaron");

console.log("\n-- la misma causa con y sin espera también se agrupa --");
/* Esto era el fallo: dos variantes del mismo 429 bastaban para que no se
   agrupara ninguna y se imprimieran las cinco líneas enteras. */
const mezclado = agruparFallos([
  "gemini-pro: sin cuota (reintentar en 13 h)",
  "gemini-flash: sin cuota",
  "gemini-lite: sin cuota (reintentar en 2 h)",
]);
ok(
  (mezclado.match(/sin cuota/g) ?? []).length === 1,
  `la causa aparece una vez: «${mezclado}»`,
);

console.log("\n-- causas distintas de verdad sí se cuentan todas --");
const distintas = agruparFallos([
  "a: sin cuota",
  "b: el modelo no existe",
  "c: sin cuota",
]);
ok(distintas.includes("sin cuota") && distintas.includes("no existe"), "las dos se ven");

console.log("\n-- un error que no es JSON no se pierde --");
ok(resumirError("connect ETIMEDOUT 142.250.1.1:443").includes("ETIMEDOUT"), "pasa tal cual");
ok(resumirError("").length === 0, "y uno vacío no inventa nada");

console.log(fallos ? `\n${fallos} FALLOS\n` : "\nTodo correcto\n");
process.exit(fallos ? 1 : 0);
