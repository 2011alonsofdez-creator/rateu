import { spawn } from "node:child_process";

/* Llamar a un miembro ejecutando SU programa, en vez de pagar su API.
 *
 * Es lo que hace que un consejo de seis no cueste dinero: codex entra
 * con la suscripción de ChatGPT, gemini con la cuota de la cuenta de
 * Google, qwen con la suya. Son los mismos modelos; cambia quién paga.
 *
 * SOLO FUNCIONA EN LOCAL, y no es un descuido: los programas están en
 * tu ordenador, no en el servidor que sirve la web. Con Kairo publicado
 * en Vercel no hay ningún `codex` que ejecutar, así que esta puerta se
 * abre únicamente cuando tú la enciendes con KAIRO_CONSEJO_CLI=1.
 *
 * Los comandos salen de una tabla fija de aquí dentro. Nunca de lo que
 * escriba nadie en la página: un servidor que ejecuta texto venido del
 * navegador es un agujero, y no hace falta ninguno para esto.
 */

/** Los programas que sabemos invocar, y cómo. */
const PROGRAMAS: Record<string, { casa: string; comando: string[] }> = {
  codex: { casa: "OpenAI", comando: ["codex", "exec", "--skip-git-repo-check", "-"] },
  /* gemini y qwen leen la entrada estándar cuando se les canaliza algo,
     y no llevan argumento. Poner "-p -" les pasaba un guion COMO
     pregunta, que es lo que hacía que salieran con código 1. */
  gemini: { casa: "Google", comando: ["gemini"] },
  qwen: { casa: "Qwen", comando: ["qwen"] },
  claude: { casa: "Anthropic", comando: ["claude", "-p"] },
};

/** ¿Está encendida la puerta de los programas locales? */
export function cliActivo(): boolean {
  return process.env.KAIRO_CONSEJO_CLI === "1";
}

/** Los nombres que puedes usar, ya filtrados por lo que hayas encendido. */
export function programasCli(): string[] {
  if (!cliActivo()) return [];
  const elegidos = (process.env.KAIRO_CONSEJO_CLI_PROGRAMAS ?? "codex,gemini,qwen")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return elegidos.filter((x) => x in PROGRAMAS);
}

export const casaDelPrograma = (nombre: string): string | null =>
  PROGRAMAS[nombre]?.casa ?? null;

/** Un identificador de miembro que apunta a un programa local. */
export const refCli = (nombre: string): string => `cli:${nombre}`;
export const esRefCli = (ref: string): boolean => ref.startsWith("cli:");

/* Ejecuta el programa y devuelve lo que escriba.
 *
 * El prompt va por la entrada estándar y no como argumento. Con un PDF
 * dentro pasa de los 100.000 caracteres y el sistema corta la línea de
 * comandos mucho antes, fallando con un «Argument list too long» que no
 * se parece en nada al problema real. */
export function preguntarCli(
  ref: string,
  texto: string,
  timeoutMs: number,
): Promise<{ ok: true; texto: string } | { ok: false; error: string }> {
  const nombre = ref.slice("cli:".length);
  const prog = PROGRAMAS[nombre];

  if (!prog) {
    return Promise.resolve({ ok: false, error: `programa desconocido: ${nombre}` });
  }
  if (!cliActivo()) {
    return Promise.resolve({
      ok: false,
      error: "los programas locales están apagados (KAIRO_CONSEJO_CLI no vale 1)",
    });
  }

  return new Promise((resolver) => {
    const [cmd, ...args] = prog.comando;
    let hijo;
    try {
      hijo = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    } catch (e) {
      resolver({ ok: false, error: `no se pudo lanzar ${cmd}: ${e}` });
      return;
    }

    let salida = "";
    let errores = "";
    let cerrado = false;

    const corte = setTimeout(() => {
      if (!cerrado) {
        hijo.kill("SIGKILL");
        cerrado = true;
        resolver({ ok: false, error: `${cmd} no contestó en ${Math.round(timeoutMs / 1000)}s` });
      }
    }, timeoutMs);

    hijo.stdout.on("data", (d) => (salida += d.toString()));
    hijo.stderr.on("data", (d) => (errores += d.toString()));

    hijo.on("error", (e) => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(corte);
      const falta = (e as NodeJS.ErrnoException).code === "ENOENT";
      resolver({
        ok: false,
        error: falta ? `no encuentro el programa '${cmd}'. Instálalo primero.` : String(e),
      });
    });

    hijo.on("close", (codigo) => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(corte);
      const limpio = salida.trim();
      if (limpio) {
        resolver({ ok: true, texto: limpio });
      } else {
        resolver({
          ok: false,
          error: `${cmd} salió con código ${codigo} y no escribió nada: ${errores.trim().slice(0, 200) || "sin mensaje"}`,
        });
      }
    });

    hijo.stdin.on("error", () => {
      /* El programa puede cerrar su entrada antes de que acabemos de
         escribir. No es un fallo: lo que importa es lo que devuelva. */
    });
    hijo.stdin.write(texto);
    hijo.stdin.end();
  });
}
