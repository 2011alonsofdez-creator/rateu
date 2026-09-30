"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Shield } from "@/components/Icons";

/* «REVISIÓN»: la pantalla que dice qué está roto y qué hay que pulsar.
 *
 * Nace de una queja justa: para saber por qué la web estaba en modo demo
 * había que escribir «/api/estado» a mano en la barra del navegador y
 * saber leer un JSON de cien líneas. Nadie tiene por qué hacer eso en su
 * propia web.
 *
 * Aquí se entra pulsando, sale en castellano, y cada cosa que va mal
 * viene con la única frase que importa: qué hay que hacer para
 * arreglarla. Abajo hay un botón que lo copia todo, para poder pegarlo y
 * que otro lo mire sin tener que explicar nada.
 *
 * Y no sale ninguna clave: solo si está puesta o si falta.
 *
 * Vive FUERA de la carpeta de la aplicación, y no es por orden: las
 * pantallas de dentro mandan a la de entrar cuando no hay sesión, y el
 * día que hace falta esta es justamente el día que no se puede entrar.
 * Tampoco es privada por lo mismo, y no pasa nada: lo único que dice de
 * las claves es si están puestas.
 */

type Punto = {
  que: string;
  gravedad: "bien" | "aviso" | "roto";
  detalle: string;
  arreglo?: string;
};

type Variable = { nombre: string; pinta: string };

type Prueba = {
  pregunta: string;
  dispara_busqueda: boolean;
  ms: number;
  modelos: string[];
  intentos: { modelo: string; ms: number; resultado: string }[];
  busco: boolean;
  modelo: string | null;
  fuentes: string[];
  busquedas: string[];
  hechos: string;
};

type Revision = {
  gravedad: "bien" | "aviso" | "roto";
  puntos: Punto[];
  arreglado: string[];
  demo: boolean;
  dominio: string | null;
  con_sesion: boolean;
  variables?: Variable[];
  de_donde?: { url: string; clave: string };
  commit: string | null;
  cuando: string;
};

/* Los nombres que la web sabe leer. Lo que aparezca puesto y no esté
   aquí, por muy parecido que se vea, es una variable que no se lee. */
const NOMBRES_BUENOS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  "NEXT_PUBLIC_SUPABASE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

/* Qué le pasa a una variable, si es que le pasa algo.
 *
 * El nombre correcto no basta, y eso costó días de averiguar: la caja
 * de la dirección puede llevar dentro una clave, que es lo mismo que
 * no tener dirección, pero en el panel se ve una variable puesta y
 * parece que está todo bien. */
function queLePasa(v: Variable): string | null {
  if (!NOMBRES_BUENOS.includes(v.nombre)) return "este nombre no se lee";
  if (v.pinta === "VACÍA") return "está vacía";

  const pideUrl = /_URL$/.test(v.nombre);
  if (pideUrl && v.pinta === "una clave") return "aquí va la DIRECCIÓN, no una clave";
  if (!pideUrl && v.pinta === "una dirección") return "aquí va la CLAVE, no la dirección";

  return null;
}

const ICONO = { bien: "✅", aviso: "⚠️", roto: "❌" } as const;

const TITULO = {
  bien: "Todo en orden",
  aviso: "Nada grave, pero conviene mirarlo",
  roto: "Hay algo roto",
} as const;

const COLOR = {
  bien: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  aviso: "border-gold/30 bg-gold/10 text-gold",
  roto: "border-red-500/30 bg-red-500/10 text-red-400",
} as const;

export default function RevisionPage() {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // La prueba de la búsqueda, que es otra cosa y va aparte.
  const [pregunta, setPregunta] = useState("¿cuándo sale el GTA 6?");
  const [prueba, setPrueba] = useState<Prueba | null>(null);
  const [probando, setProbando] = useState(false);
  const [falloPrueba, setFalloPrueba] = useState("");

  const revisar = useCallback(async () => {
    setCargando(true);
    setError(false);
    try {
      const r = await fetch("/api/revision", { cache: "no-store" });
      if (!r.ok) throw new Error("mal");
      setRevision((await r.json()) as Revision);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  // Se revisa al entrar: si hubiera que pulsar un botón para empezar,
  // sería un paso más en el peor momento para pedir pasos.
  useEffect(() => {
    void revisar();
  }, [revisar]);

  /* Lo que se copia. Es lo que hace falta para que alguien lo mire de
     lejos, y nada más: ni claves, ni correos, ni nada de nadie. */
  const paraCopiar = (r: Revision) =>
    [
      `KAIRO · revisión ${new Date(r.cuando).toLocaleString("es-ES")}`,
      `Estado: ${TITULO[r.gravedad]}`,
      `Modo demo: ${r.demo ? "SÍ" : "no"}`,
      `Supabase: ${r.dominio ?? "sin configurar"}`,
      `Sesión iniciada: ${r.con_sesion ? "sí" : "no"}`,
      r.commit ? `Versión: ${r.commit}` : "",
      "",
      ...r.puntos.map(
        (p) => `${ICONO[p.gravedad]} ${p.que}: ${p.detalle}${p.arreglo ? `\n   → ${p.arreglo}` : ""}`,
      ),
      ...(r.variables?.length
        ? [
            "",
            "Variables que le han llegado al servidor:",
            ...r.variables.map((v) => {
              const fallo = queLePasa(v);
              return `${fallo ? "!!" : "·"} ${v.nombre} = ${v.pinta}${fallo ? ` ← ${fallo}` : ""}`;
            }),
          ]
        : []),
      ...(r.arreglado.length ? ["", "Arreglado solo:", ...r.arreglado.map((a) => `- ${a}`)] : []),
    ]
      /* Las líneas en blanco se quedan: son los huecos entre apartados,
         puestos a mano. El filtro estaba para quitar el hueco que deja
         la versión cuando no la hay, así que se quita SOLO ese: uno al
         final, no todos. */
      .filter((l, i, todas) => l !== "" || (todas[i + 1] ?? "") !== "")
      .join("\n");

  const copiar = async (r: Revision) => {
    const texto = paraCopiar(r);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* Sin permiso para el portapapeles (pasa en algún navegador del
         móvil): se selecciona el texto de abajo y se copia a mano. */
      setCopiado(false);
    }
  };

  const probarBusqueda = async () => {
    if (!pregunta.trim() || probando) return;
    setProbando(true);
    setFalloPrueba("");
    setPrueba(null);
    try {
      const r = await fetch("/api/revision/buscar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pregunta }),
      });
      const j = await r.json();
      if (!r.ok) {
        setFalloPrueba(
          j?.error === "espera"
            ? `Espera ${j.segundos ?? 8} segundos entre pruebas.`
            : j?.error === "sin_sesion"
              ? "Hay que haber iniciado sesión para probar la búsqueda."
              : "No se ha podido probar.",
        );
      } else {
        setPrueba(j as Prueba);
      }
    } catch {
      setFalloPrueba("No se ha podido probar.");
    } finally {
      setProbando(false);
    }
  };

  const malos = revision?.puntos.filter((p) => p.gravedad !== "bien") ?? [];
  const buenos = revision?.puntos.filter((p) => p.gravedad === "bien") ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <Shield className="h-5 w-5" />
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">Revisión</h1>
      </div>

      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">
        Qué está funcionando y qué no, con lo que hay que hacer al lado. No sale ninguna clave:
        solo si está puesta o si falta.
      </p>

      <Link
        href="/chat"
        className="mt-4 inline-block text-[13.5px] font-medium text-acento underline-offset-4 hover:underline"
      >
        Volver a Kairo
      </Link>

      <div className="mt-8 space-y-4">
        {cargando && (
          <div className="rounded-2xl border border-line bg-panel p-5 text-[14px] text-muted">
            Mirándolo…
          </div>
        )}

        {error && !cargando && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-[14px] font-medium text-red-400">No se ha podido hacer la revisión.</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
              Si esto falla, lo más probable es que la web no esté desplegada del todo. Prueba a
              recargar en un minuto.
            </p>
            <button
              onClick={() => void revisar()}
              className="mt-3 rounded-lg border border-line-hi px-3 py-1.5 text-[13px] font-medium transition hover:bg-panel-hi"
            >
              Volver a mirar
            </button>
          </div>
        )}

        {revision && !cargando && (
          <>
            {/* El veredicto, grande y arriba. */}
            <div className={`rounded-2xl border p-5 ${COLOR[revision.gravedad]}`}>
              <p className="text-[16px] font-semibold">
                {ICONO[revision.gravedad]} {TITULO[revision.gravedad]}
              </p>
              {revision.demo && (
                <p className="mt-1.5 text-[13.5px] leading-relaxed">
                  La web está en <strong>modo demo</strong>: no hay base de datos detrás, así que
                  nada de lo que escribas se guarda y quien «entra» es un usuario de ejemplo.
                </p>
              )}
            </div>

            {/* Lo que va mal, con el arreglo. Primero, porque es para lo
                que se ha entrado aquí. */}
            {malos.map((p) => (
              <div key={p.que} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">
                  {ICONO[p.gravedad]} {p.que}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.detalle}</p>
                {p.arreglo && (
                  <p className="mt-3 rounded-xl border border-line bg-panel-hi p-3 text-[13.5px] leading-relaxed">
                    <span className="font-medium">Qué hacer: </span>
                    {p.arreglo}
                  </p>
                )}
              </div>
            ))}

            {/* Los nombres de verdad. Es la única forma de ver un nombre
                mal escrito: en el panel de Vercel se lee lo que uno
                espera leer, no lo que pone. */}
            {revision.variables && revision.variables.length > 0 && (
              <div className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">Lo que le ha llegado al servidor</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  Los nombres y qué pinta tiene lo que hay dentro, nunca el contenido. Si alguna
                  sale en rojo, ahí está el fallo.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {revision.variables.map((v) => {
                    const fallo = queLePasa(v);
                    return (
                      <li key={v.nombre} className="text-[13px] leading-relaxed">
                        <code className={fallo ? "font-medium text-red-400" : "font-medium"}>
                          {v.nombre}
                        </code>{" "}
                        <span className="text-muted">— {v.pinta}</span>
                        {fallo && <span className="ml-1 text-red-400">← {fallo}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {revision.arreglado.length > 0 && (
              <div className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">Esto ya lo he arreglado yo</p>
                <ul className="mt-2 space-y-1">
                  {revision.arreglado.map((a) => (
                    <li key={a} className="text-[13.5px] leading-relaxed text-muted">
                      · {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {buenos.length > 0 && (
              <div className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-[15px] font-semibold">En orden</p>
                <ul className="mt-2 space-y-1">
                  {buenos.map((p) => (
                    <li key={p.que} className="text-[13.5px] leading-relaxed text-muted">
                      ✅ <span className="text-fg">{p.que}</span> — {p.detalle}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => void copiar(revision)}
                className="rounded-xl border border-line-hi px-4 py-2 text-[14px] font-medium transition hover:bg-panel-hi"
              >
                {copiado ? "Copiado" : "Copiar la revisión"}
              </button>
              <button
                onClick={() => void revisar()}
                className="rounded-xl border border-line-hi px-4 py-2 text-[14px] font-medium transition hover:bg-panel-hi"
              >
                Volver a mirar
              </button>
              {revision.commit && (
                <span className="text-[12.5px] text-faint">versión {revision.commit}</span>
              )}
            </div>

            {/* PROBAR LA BÚSQUEDA.
                Va después de todo porque no es parte de la revisión: es
                para cuando Kairo contesta con datos viejos, que es un
                síntoma con cuatro causas que desde fuera se ven igual. */}
            <div className="rounded-2xl border border-line bg-panel p-5">
              <p className="text-[15px] font-semibold">¿Contesta con datos viejos?</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Escribe aquí la pregunta que te ha salido mal. Se busca de verdad, delante de ti, y
                te dice qué ha pasado por dentro.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={pregunta}
                  onChange={(e) => setPregunta(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void probarBusqueda()}
                  maxLength={500}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-bg-soft px-3.5 py-2 text-[14px] outline-none transition placeholder:text-faint focus:border-line-hi"
                  placeholder="¿cuándo sale el GTA 6?"
                />
                <button
                  onClick={() => void probarBusqueda()}
                  disabled={probando || !pregunta.trim()}
                  className="rounded-xl border border-line-hi px-4 py-2 text-[14px] font-medium transition enabled:hover:bg-panel-hi disabled:opacity-40"
                >
                  {probando ? "Buscando…" : "Probar"}
                </button>
              </div>

              {falloPrueba && <p className="mt-3 text-[13px] text-red-400">{falloPrueba}</p>}

              {prueba && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  {/* Lo primero, porque es lo que más veces falla: si la
                      pregunta ni siquiera dispara la búsqueda, lo demás
                      da igual. */}
                  <p className="text-[13.5px] leading-relaxed">
                    {prueba.dispara_busqueda ? (
                      <span className="text-emerald-400">
                        ✅ Esta pregunta SÍ hace que Kairo busque.
                      </span>
                    ) : (
                      <span className="text-red-400">
                        ❌ Esta pregunta NO hace que Kairo busque en el chat. Aquí se ha buscado a
                        la fuerza para ver si al menos la búsqueda funciona.
                      </span>
                    )}
                  </p>

                  <p className="text-[13.5px] leading-relaxed">
                    {prueba.busco ? (
                      <span className="text-emerald-400">
                        ✅ Ha buscado de verdad ({prueba.fuentes.length} fuentes, {prueba.ms} ms)
                      </span>
                    ) : (
                      <span className="text-red-400">❌ No ha llegado a buscar ({prueba.ms} ms)</span>
                    )}
                  </p>

                  {prueba.intentos.length > 0 && (
                    <div>
                      <p className="text-[13px] font-medium">Lo que ha intentado</p>
                      <ul className="mt-1 space-y-1">
                        {prueba.intentos.map((i, n) => (
                          <li key={n} className="text-[12.5px] leading-relaxed text-muted">
                            <code>{i.modelo}</code> — {i.resultado}{" "}
                            <span className="text-faint">({i.ms} ms)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prueba.busquedas.length > 0 && (
                    <p className="text-[12.5px] leading-relaxed text-muted">
                      Buscó: {prueba.busquedas.slice(0, 5).join(" · ")}
                    </p>
                  )}

                  {prueba.hechos ? (
                    <div>
                      <p className="text-[13px] font-medium">Lo que ha encontrado</p>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-muted">
                        {prueba.hechos}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted">No ha traído ningún dato.</p>
                  )}
                </div>
              )}
            </div>

            {/* Y el texto a la vista, para el móvil donde el botón de
                copiar no siempre tiene permiso: se selecciona y se copia. */}
            <details className="rounded-2xl border border-line bg-panel p-5">
              <summary className="cursor-pointer text-[14px] font-medium">
                Ver la revisión como texto
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-muted">
                {paraCopiar(revision)}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
