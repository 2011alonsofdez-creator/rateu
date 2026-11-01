/* ¿Se renegocia hasta que firman todos, y se para cuando no se puede?
 *
 *   npx tsx pruebas/consejo-acuerdo.ts
 *
 * Levanta un servidor que habla como OpenRouter y responde con guiones
 * preparados, así que ejercita el motor ENTERO —rondas, votación,
 * firmas y renegociación— sin red, sin claves y sin gastar nada.
 */
import { createServer } from "node:http";

type Guion = "todos_firman" | "firma_a_la_segunda" | "nunca_firma";

function servidorFalso(guion: Guion, puerto: number) {
  let vueltaDeFirmas = 0;
  const llamadas: string[] = [];

  const servidor = createServer((req, res) => {
    let cuerpo = "";
    req.on("data", (d) => (cuerpo += d));
    req.on("end", () => {
      const pet = JSON.parse(cuerpo || "{}");
      const texto = JSON.stringify(pet.messages ?? "");
      let respuesta = "## Respuesta breve\nMi postura.\n";

      /* El orden importa: varios prompts comparten palabras —el de la
         propuesta cita las críticas de la ronda 2, el de rehacer cita la
         propuesta— así que se mira primero lo más específico de cada uno. */
      if (texto.includes("Rehaz la respuesta")) {
        llamadas.push("rehacer");
        respuesta = "Respuesta rehecha del consejo, ahora con los plazos dentro.";
      } else if (texto.includes("ESTÁS EN LA RONDA 3")) {
        if (llamadas.filter((x) => x === "firma").length % 5 === 0) vueltaDeFirmas++;
        llamadas.push("firma");
        const quienSeNiega = pet.model.includes("grok");
        let firma = "firmo";
        if (quienSeNiega) {
          if (guion === "nunca_firma") firma = "no_firmo";
          else if (guion === "firma_a_la_segunda" && vueltaDeFirmas === 1) firma = "no_firmo";
        }
        respuesta =
          '## Valoracion\nok\n\n## Firma\n```json\n' +
          JSON.stringify({
            firma,
            motivo: firma === "no_firmo" ? "falta el punto de los plazos" : "conforme",
            reservas: [],
            cambio_minimo_para_firmar: firma === "no_firmo" ? "añade los plazos" : "",
          }) +
          "\n```";
      } else if (texto.includes("POSICIÓN DEL CONSEJO")) {
        llamadas.push("propuesta");
        respuesta = "Esta es la respuesta del consejo, con su contenido y su final claro.";
      } else if (texto.includes("ESTÁS EN LA RONDA 2")) {
        llamadas.push("voto");
        respuesta =
          '## Critica\nblah\n\n```json\n{"votos":{"P1":{"voto":"de_acuerdo","motivo":"ok"}}}\n```';
      } else if (texto.includes("destila entre")) {
        llamadas.push("puntos");
        respuesta = 'Verificacion en prosa.\n\n```json\n{"puntos":[{"id":"P1","texto":"Un punto"}]}\n```';
      } else {
        llamadas.push("ronda1");
      }

      /* Kairo pide streaming, así que hay que contestar en SSE: trozos
         `data: {...}` y un `[DONE]` al final. Devolver un JSON normal
         deja al SDK esperando y el motor lo ve como "no dijo nada". */
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      const trozo = (delta: object) =>
        res.write(`data: ${JSON.stringify({ id: "x", model: pet.model, choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`);
      trozo({ role: "assistant", content: respuesta });
      res.write(`data: ${JSON.stringify({ id: "x", model: pet.model, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    });
  });

  return new Promise<{ cerrar: () => void; llamadas: string[] }>((ok) => {
    servidor.listen(puerto, "127.0.0.1", () =>
      ok({ cerrar: () => servidor.close(), llamadas }),
    );
  });
}

async function probar(guion: Guion, puerto: number, esperado: { firmas: number; rehacer: number }) {
  const { cerrar, llamadas } = await servidorFalso(guion, puerto);

  process.env.KAIRO_EXTRA_KEY = "falsa";
  process.env.KAIRO_EXTRA_URL = `http://127.0.0.1:${puerto}`;
  process.env.KAIRO_EXTRA_MODELOS = "x";
  delete process.env.KAIRO_CONSEJO_CLI;
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  const { deliberar } = await import("@/lib/consejo/motor");
  const eventos: string[] = [];
  await deliberar(
    { pregunta: "¿Una pregunta discutible?", material: "", adjuntos: [], modo: "completo" },
    (e) => {
      if (e.t === "veredictos") eventos.push(`veredictos(vuelta ${e.vuelta})`);
      if (e.t === "renegociando") eventos.push(`renegociando(${e.vuelta})`);
      if (e.t === "error") eventos.push(`ERROR: ${e.mensaje}`);
    },
  );
  cerrar();

  if (process.env.DEPURA) console.log("    llamadas:", llamadas.join(", "));
  const vueltas = eventos.filter((x) => x.startsWith("veredictos")).length;
  const rehechas = llamadas.filter((x) => x === "rehacer").length;
  const ok = vueltas === esperado.firmas && rehechas === esperado.rehacer;
  console.log(
    `  ${ok ? "OK  " : "FALLO"} ${guion.padEnd(20)} ${vueltas} votación(es) de firma, ` +
      `${rehechas} renegociación(es)  [esperaba ${esperado.firmas} y ${esperado.rehacer}]`,
  );
  return ok;
}

async function main() {
  console.log("\n-- ¿se renegocia hasta el acuerdo, y se para cuando no lo hay? --");
  const r = [
    await probar("todos_firman", 8731, { firmas: 1, rehacer: 0 }),
    await probar("firma_a_la_segunda", 8732, { firmas: 2, rehacer: 1 }),
    await probar("nunca_firma", 8733, { firmas: 3, rehacer: 2 }),
  ];
  console.log(r.every(Boolean) ? "\nTodo correcto\n" : "\nHAY FALLOS\n");
  process.exit(r.every(Boolean) ? 0 : 1);
}
main();
