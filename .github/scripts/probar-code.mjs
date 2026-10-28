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

/* CUÁNTO SE LE DEJA PENSAR, Y CUÁNTO SITIO TIENE PARA ESCRIBIR.
 
   Pidiendo un comecocos, DeepSeek se gastó los 8192 tokens de salida
   PENSANDO y devolvió el texto vacío: noventa segundos, créditos
   cobrados y ni una línea del archivo. Lo que piensa sale del mismo
   bolsillo que lo que escribe.
 
   Hay dos palancas y no está claro cuál traga OpenRouter con cada
   modelo, así que se prueban aquí antes de escribirlas en Kairo. */
const TECHO = Number(process.env.TECHO || 8192);
const PENSAR = process.env.PENSAR || "auto";

const razonamiento =
  PENSAR === "bajo"
    ? { effort: "low" }
    : PENSAR === "tope"
      ? { max_tokens: 1500 }
      : PENSAR === "nada"
        ? { enabled: false }
        : undefined;
const CLAVE = process.env.OPENROUTER_KEY;

/* UN ARCHIVO YA HECHO, SIN PASAR POR LA IA.
 
   Para probar la prueba. Una comprobación que nunca ha visto fallar
   nada no se sabe si comprueba: con esto se le dan a mano un juego
   bueno y uno roto y se mira si distingue. Y de paso sirve para
   repasar una app que salió mal sin volver a pagarla. */
const YA_HECHO = process.env.YA_HECHO;

const encargo = await encargoDeKairo();
const texto = encargo(PETICION);

/* La clave solo hace falta para pedirle la app a la IA. Repasando un
   archivo que ya existe no se llama a nadie, y exigirla ahí dejaba la
   prueba sin poder correr en un sitio donde no hay clave —que es justo
   donde se prueba la prueba—. */
if (!YA_HECHO && !CLAVE) {
  console.error("Falta OPENROUTER_KEY (o pasa YA_HECHO=ruta.html para repasar un archivo).");
  process.exit(2);
}

let codigo;

if (YA_HECHO) {
  codigo = await fs.readFile(YA_HECHO, "utf8");
  console.log("═".repeat(60));
  console.log("ARCHIVO YA HECHO:", YA_HECHO);
  console.log(`${codigo.length} caracteres · sin pasar por la IA`);
  console.log("═".repeat(60));
} else {
  console.log("═".repeat(60));
  console.log("PIDO:", PETICION);
  console.log("MODELO:", MODELO);
  console.log(`TECHO: ${TECHO} · PENSAR: ${PENSAR}`);
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
      max_tokens: TECHO,
      ...(razonamiento ? { reasoning: razonamiento } : {}),
    }),
  });

  if (!r.ok) {
    console.error("HTTP", r.status, (await r.text()).slice(0, 400));
    process.exit(1);
  }

  const datos = await r.json();
  const eleccion = datos.choices?.[0];
  const respuesta = eleccion?.message?.content ?? "";

  /* POR QUÉ PARÓ, Y EN QUÉ SE GASTÓ EL SITIO.
 
     Sin esto, una respuesta vacía y una respuesta cortada se leen igual
     —"no ha devuelto archivo"— y se arreglan distinto. `finish_reason:
     length` quiere decir que se quedó sin sitio para escribir, y si
     además casi todo se fue en `reasoning_tokens`, es que se lo gastó
     pensando: el mismo truco que ya nos mordió en Gemini, donde lo que
     el modelo piensa se descuenta del techo de salida. */
  const u = datos.usage ?? {};
  const pensados = u.completion_tokens_details?.reasoning_tokens ?? 0;
  console.log(
    `Escrita en ${((Date.now() - empezo) / 1000).toFixed(1)}s · coste ${u.cost ?? "?"}\n` +
    `Paró porque: ${eleccion?.finish_reason ?? "?"} · salida ${u.completion_tokens ?? "?"} tokens` +
    (pensados ? ` (de los cuales ${pensados} PENSANDO)` : "") +
    `\nTexto: ${respuesta.length} caracteres`,
  );

  /* Algunos modelos mandan lo que piensan en un campo aparte. Si el texto
     viene vacío pero eso tiene contenido, el archivo no se ha perdido:
     está en el sitio equivocado, y eso se arregla en Kairo. */
  const aparte = eleccion?.message?.reasoning ?? "";
  if (!respuesta && aparte) {
    console.log(`¡OJO! El texto viene vacío pero hay ${aparte.length} caracteres en 'reasoning'.`);
    console.log(aparte.slice(0, 600));
  }

  codigo = documentoHtml(respuesta);
  if (!codigo) {
    console.error("!! El extractor NO ha sacado ningún archivo de la respuesta.");
    console.error("Lo que contestó, por el principio:");
    console.error(respuesta.slice(0, 900));
    process.exit(1);
  }
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

// --- A ejecutarla, Y A USARLA ---------------------------------------
/* ABRIRLA NO BASTA, HAY QUE TOCARLA.
 *
 * Esto antes cargaba la página, miraba que hubiera texto y daba el
 * visto bueno. Y por eso daba por buena justo la app que vino a
 * probar: un juego de la galleta que enseñaba su botón de Iniciar y,
 * al pulsarlo, no pintaba nada. El banco no pulsaba, así que no veía
 * el único momento en el que fallaba.
 *
 * Es la tercera vez en este proyecto que una comprobación pasa sin
 * comprobar nada. Así que ahora se pulsa, y lo que se mira después no
 * es si "parece" que pasó algo: se leen los píxeles del lienzo.
 */
const pw = await import("playwright");
const navegador = await pw.chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 420, height: 880 } });

const errores = [];
pagina.on("console", (m) => { if (m.type() === "error") errores.push(m.text().slice(0, 200)); });
pagina.on("pageerror", (e) => errores.push("REVIENTA: " + String(e).slice(0, 200)));

/* Un diálogo abierto (un alert, un confirm) congela la página y deja
   la prueba esperando hasta que se acabe el tiempo. Se cierran solos. */
pagina.on("dialog", (d) => d.dismiss().catch(() => {}));

await pagina.goto(`file://${archivo}`);
await pagina.waitForTimeout(1200);

/* ¿HAY ALGO DIBUJADO EN EL LIENZO?
 
   Leyendo los píxeles, no suponiendo. Un juego que no arranca deja el
   lienzo de un solo color —casi siempre negro o transparente— y desde
   fuera eso se ve exactamente igual que uno que va bien y aún no ha
   empezado. La diferencia está en los datos, así que se miran. */
const miraLienzos = () => pagina.evaluate(() => {
  const salida = [];
  for (const c of document.querySelectorAll("canvas")) {
    const ctx = c.getContext("2d");
    if (!ctx || !c.width || !c.height) { salida.push({ tipo: "sin 2d o sin tamaño" }); continue; }
    try {
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const vistos = new Set();
      // Uno de cada doscientos píxeles: de sobra para saber si hay dibujo.
      for (let i = 0; i < d.length; i += 4 * 200) {
        vistos.add(`${d[i]},${d[i+1]},${d[i+2]},${d[i+3]}`);
        if (vistos.size > 6) break;
      }
      salida.push({ ancho: c.width, alto: c.height, colores: vistos.size });
    } catch (e) {
      salida.push({ tipo: "no se ha podido leer: " + String(e).slice(0, 60) });
    }
  }
  return salida;
});

const retrato = () => pagina.evaluate(() => ({
  texto: (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 700),
  botones: [...document.querySelectorAll("button")].map((b) => b.innerText.trim()).filter(Boolean).slice(0, 12),
  campos: [...document.querySelectorAll("input,select,textarea")].map((c) => c.getAttribute("placeholder") || c.getAttribute("aria-label") || c.id || c.type).slice(0, 12),
}));

const visto = await retrato();
const lienzosAntes = await miraLienzos();
await pagina.screenshot({ path: path.join(SALIDA, "app-1-al-abrir.png"), fullPage: true });

console.log("\n── Al abrirla ──");
console.log(visto.texto || "(la página está EN BLANCO)");
console.log("Botones:", visto.botones.join(" · ") || "(ninguno)");
console.log("Campos :", visto.campos.join(" · ") || "(ninguno)");
if (lienzosAntes.length) console.log("Lienzos:", JSON.stringify(lienzosAntes));

if (!visto.texto && !lienzosAntes.length) pegas.push("la página sale en blanco");
if (errores.length) pegas.push(`${errores.length} error(es) de JavaScript al abrir`);

/* AHORA SE PULSA.
 
   El botón que de verdad arranca la cosa: se busca por lo que pone, y
   si no hay nada que lo parezca, el primero que haya. Teclas también,
   que en un juego el botón a veces solo da paso al teclado. */
const CUAL = /empezar|empieza|iniciar|inicio|start|jugar|juega|comenzar|comienza|play/i;
const antesDePulsar = errores.length;

const botones = await pagina.locator("button:visible").all();
let pulsado = null;
for (const b of botones) {
  const txt = ((await b.innerText().catch(() => "")) || "").trim();
  if (CUAL.test(txt)) { pulsado = { b, txt }; break; }
}
if (!pulsado && botones.length) {
  pulsado = { b: botones[0], txt: ((await botones[0].innerText().catch(() => "")) || "(sin texto)").trim() };
}

console.log("\n── Al usarla ──");
if (!pulsado) {
  console.log("No hay ningún botón que pulsar.");
} else {
  console.log(`Pulso: "${pulsado.txt}"`);
  await pulsado.b.click({ timeout: 4000 }).catch((e) => console.log("  no se ha dejado pulsar:", String(e).slice(0, 90)));
  await pagina.waitForTimeout(600);

  // Y un par de teclas, que muchos juegos esperan eso.
  for (const tecla of ["Space", "ArrowUp", "ArrowRight"]) {
    await pagina.keyboard.press(tecla).catch(() => {});
    await pagina.waitForTimeout(250);
  }
  await pagina.waitForTimeout(900);

  const despues = await retrato();
  const lienzosDespues = await miraLienzos();
  await pagina.screenshot({ path: path.join(SALIDA, "app-2-al-usarla.png"), fullPage: true });

  if (lienzosDespues.length) console.log("Lienzos:", JSON.stringify(lienzosDespues));
  if (despues.texto !== visto.texto) console.log("La pantalla ha cambiado.");
  else if (!lienzosDespues.length) console.log("La pantalla NO ha cambiado en nada.");

  const nuevos = errores.length - antesDePulsar;
  if (nuevos > 0) pegas.push(`${nuevos} error(es) de JavaScript AL PULSAR`);

  /* Un lienzo de un solo color después de darle a empezar es
     exactamente lo que se ve como "le doy y no sale nada". */
  const muertos = lienzosDespues.filter((l) => l.colores !== undefined && l.colores <= 1);
  if (muertos.length) {
    pegas.push(`el lienzo sigue EN BLANCO después de pulsar (${muertos.length} de ${lienzosDespues.length})`);
  }

  /* Y si no hay lienzo ni cambió nada, tampoco ha pasado nada. */
  if (!lienzosDespues.length && despues.texto === visto.texto && despues.texto) {
    pegas.push("pulsar el botón no cambia nada en la pantalla");
  }
}

await navegador.close();

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
