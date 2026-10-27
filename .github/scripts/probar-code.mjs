/* KAIRO CODE, DE PUNTA A PUNTA.
 *
 * Pide una app igual que la pide la pantalla de Code —con el MISMO
 * encargo y el MISMO extractor, cargados del repositorio, no copiados—,
 * la guarda, la abre en un navegador de verdad y cuenta qué pasa.
 *
 * Existe porque Code no se puede probar de otra forma. Lo que falla en
 * una app generada no falla al compilar: falla al usarla, y hasta ahora
 * el único que la usaba era Alonso, en su casa, después de pagar los
 * créditos. Si la cuenta sale mal, queremos enterarnos aquí.
 *
 * Y se prueba el encargo, no el modelo. Si tres apps seguidas salen con
 * la misma manía, la manía está en lo que les pedimos.
 */
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../../kairo");
const SALIDA = process.env.SALIDA ?? path.resolve(AQUI, "../../salida-code");

const jiti = createJiti(fileURLToPath(import.meta.url), {
  interopDefault: true,
  alias: { "@": path.join(RAIZ, "src") },
});

/* El encargo vive dentro de la pantalla de Code, que es un componente de
   React y no se puede importar desde Node. Así que se lee el archivo y
   se saca la función tal cual está escrita: si alguien la cambia, esto
   prueba la nueva, que es justo lo que tiene que pasar. */
async function encargoDeKairo() {
  const fuente = await fs.readFile(
    path.join(RAIZ, "src/app/(app)/code/page.tsx"),
    "utf8",
  );

  const i = fuente.indexOf("function encargo(");
  if (i === -1) throw new Error("no encuentro encargo() en code/page.tsx");

  // Hasta el cierre de la función, que está a principio de línea.
  const fin = fuente.indexOf("\n}", i);
  if (fin === -1) throw new Error("no encuentro el final de encargo()");

  const cuerpo = fuente
    .slice(i, fin + 2)
    .replace(/^function encargo\([^)]*\)\s*:\s*string\s*{/, "")
    .replace(/}\s*$/, "");

  return new Function("peticion", "corta = false", cuerpo);
}

const { documentoHtml } = await jiti.import(path.join(RAIZ, "src/lib/chatear.ts"));

const PETICION = process.argv[2] ?? "Una calculadora de notas: añado asignaturas con su nota y sus créditos y me da la media ponderada.";
const MODELO = process.env.MODELO || "deepseek/deepseek-v4-flash-0731";
const CLAVE = process.env.OPENROUTER_KEY;
if (!CLAVE) {
  console.error("Falta OPENROUTER_KEY.");
  process.exit(2);
}

const encargo = await encargoDeKairo();
const texto = encargo(PETICION);

console.log("═".repeat(60));
console.log("PIDO:", PETICION);
console.log("MODELO:", MODELO);
console.log("═".repeat(60));

const empezo = Date.now();
const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${CLAVE}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://kairo.app",
    "X-Title": "Kairo",
  },
  body: JSON.stringify({
    model: MODELO,
    messages: [{ role: "user", content: texto }],
    max_tokens: 8192,
  }),
});

if (!r.ok) {
  console.error("HTTP", r.status, (await r.text()).slice(0, 400));
  process.exit(1);
}

const datos = await r.json();
const respuesta = datos.choices?.[0]?.message?.content ?? "";
console.log(`Escrita en ${((Date.now() - empezo) / 1000).toFixed(1)}s · coste ${datos.usage?.cost ?? "?"}`);

const codigo = documentoHtml(respuesta);
if (!codigo) {
  console.error("!! El extractor NO ha sacado ningún archivo de la respuesta.");
  console.error("Lo que contestó, por el principio:");
  console.error(respuesta.slice(0, 900));
  process.exit(1);
}

await fs.mkdir(SALIDA, { recursive: true });
const archivo = path.join(SALIDA, "app.html");
await fs.writeFile(archivo, codigo, "utf8");
console.log(`Código: ${codigo.length} caracteres → ${archivo}`);

/* LO QUE PROMETE LA PANTALLA, COMPROBADO.
   Cada una de éstas es una regla del encargo. Si falla, la app no hace
   lo que se le dijo a quien la pidió. */
const pegas = [];
if (!/<html/i.test(codigo)) pegas.push("no parece un HTML entero");
if (/<script[^>]+src\s*=\s*["']https?:/i.test(codigo))
  pegas.push("carga un script de internet (no funcionará sin conexión)");
if (/<link[^>]+href\s*=\s*["']https?:/i.test(codigo))
  pegas.push("carga una hoja de estilos de internet");
if (/\b(fetch|XMLHttpRequest)\s*\(/.test(codigo))
  pegas.push("llama a internet desde el JavaScript");

// --- A ejecutarla ---------------------------------------------------
const pw = await import("playwright");
const navegador = await pw.chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 420, height: 880 } });

const errores = [];
pagina.on("console", (m) => { if (m.type() === "error") errores.push(m.text().slice(0, 200)); });
pagina.on("pageerror", (e) => errores.push("REVIENTA: " + String(e).slice(0, 200)));

await pagina.goto(`file://${archivo}`);
await pagina.waitForTimeout(1200);

const visto = await pagina.evaluate(() => ({
  texto: (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 700),
  botones: [...document.querySelectorAll("button")].map((b) => b.innerText.trim()).filter(Boolean).slice(0, 12),
  campos: [...document.querySelectorAll("input,select,textarea")].map((c) => c.getAttribute("placeholder") || c.getAttribute("aria-label") || c.id || c.type).slice(0, 12),
}));

await pagina.screenshot({ path: path.join(SALIDA, "app.png"), fullPage: true });
await navegador.close();

console.log("\n── Se ve esto ──");
console.log(visto.texto || "(la página está EN BLANCO)");
console.log("\nBotones:", visto.botones.join(" · ") || "(ninguno)");
console.log("Campos :", visto.campos.join(" · ") || "(ninguno)");

if (!visto.texto) pegas.push("la página sale en blanco");
if (errores.length) pegas.push(`${errores.length} error(es) de JavaScript`);

console.log("\n── Qué tal ──");
if (errores.length) for (const e of errores) console.log("  JS:", e);
if (pegas.length) {
  for (const p of pegas) console.log("  PEGA:", p);
} else {
  console.log("  Arranca, se ve y no da errores.");
}

/* El JavaScript entero, para poder leer las cuentas a mano. Una media
   ponderada mal hecha no da error ni sale en blanco: da un número
   equivocado con toda la tranquilidad del mundo, y eso solo se ve
   leyendo la fórmula. */
console.log("\n── El JavaScript de la app ──");
const guiones = [...codigo.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const js = guiones.join("\n/* --- otro <script> --- */\n");
console.log(js.length > 14000 ? js.slice(0, 14000) + "\n…(cortado)" : js);

process.exit(pegas.length ? 1 : 0);
