"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { Clip, Close, Team } from "@/components/Icons";
import { ADJUNTOS, ADJUNTOS_ACEPTADOS, type Adjunto } from "@/lib/tipos";
import {
  ETIQUETA_FIRMA,
  ETIQUETA_VOTO,
  type Evento,
  type Intervencion,
  type Miembro,
  type Modo,
  type Punto,
  type Resultado,
  type Veredicto,
} from "@/lib/consejo/tipos";

/* «CONSEJO»: seis IAs de casas distintas deliberando sobre lo que les
 *  eches.
 *
 *  Vive en su propia pantalla y no dentro del chat, y hay un motivo que
 *  no es estético: el chat promete una respuesta ya, y esto tarda
 *  minutos y tiene mucho que enseñar por el camino —quién ha contestado,
 *  qué se critican, cómo queda cada voto—. Metido en una burbuja de
 *  conversación, todo eso se pierde y solo queda la espera.
 *
 *  Lo que se pinta va llegando trozo a trozo mientras ocurre. No es un
 *  adorno: durante dos minutos sin señales, cualquiera piensa que se ha
 *  colgado y recarga.
 */

const FASES: Record<string, string> = {
  transcribiendo: "Leyendo los archivos",
  ronda1: "Ronda 1 · responden a ciegas",
  sintesis: "El secretario redacta el acta",
  verificando: "El secretario comprueba los datos",
  ronda2: "Ronda 2 · debate anónimo y votación",
  redactando: "El secretario redacta la propuesta",
  ronda3: "Ronda 3 · firma",
};

const SIMBOLO = {
  de_acuerdo: "++",
  matiz: "~",
  en_desacuerdo: "−−",
  abstencion: "·",
} as const;

const VEREDICTO: Record<Resultado["veredicto"], string> = {
  unanime: "Unánime",
  acuerdo_con_matices: "Acuerdo con matices",
  mayoria: "Mayoría",
  sin_acuerdo: "Sin acuerdo",
  sin_votos: "Sin votos",
};

/* Quién contestó y quién no.
 *
 * El motivo del fallo se enseña entero, no escondido en un emergente al
 * pasar el ratón: cuando falta un miembro, lo primero que hace falta
 * saber es por qué, y en el móvil no hay ratón que pasar. */
function Asistencia({
  lista,
  nombre,
}: {
  lista: Intervencion[];
  nombre: (id: string) => string;
}) {
  const caidos = lista.filter((v) => !v.ok);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {lista.map((v) => (
          <span
            key={v.miembro}
            title={v.modelo}
            className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${
              v.ok
                ? "border-line bg-panel-hi text-muted"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {nombre(v.miembro)} {v.ok ? "✓" : "✕"}
          </span>
        ))}
      </div>

      {caidos.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-muted">
          {caidos.map((v) => (
            <li key={v.miembro}>
              <span className="text-red-300">{nombre(v.miembro)}</span> no contestó:{" "}
              <code className="break-all">{v.error}</code>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Caja({ children, titulo }: { children: React.ReactNode; titulo?: string }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      {titulo ? <h2 className="text-[15px] font-semibold">{titulo}</h2> : null}
      <div className={titulo ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

export default function Consejo() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const [pregunta, setPregunta] = useState("");
  const [modo, setModo] = useState<Modo>("rapido");
  const [archivos, setArchivos] = useState<Adjunto[]>([]);

  const [corriendo, setCorriendo] = useState(false);
  const [fase, setFase] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /* Los avisos se acumulan y no se pisan. Antes vivían en `detalle`, que
     la fase siguiente machaca: el aviso de que el documento no se pudo
     leer duraba medio segundo y el consejo seguía adelante sin él,
     aparentemente sin incidencias. */
  const [avisos, setAvisos] = useState<string[]>([]);
  const [material, setMaterial] = useState<{ letras: number; de: string } | null>(null);

  const [r1, setR1] = useState<Intervencion[]>([]);
  const [r2, setR2] = useState<Intervencion[]>([]);
  const [verificacion, setVerificacion] = useState("");
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [propuesta, setPropuesta] = useState("");
  const [veredictos, setVeredictos] = useState<Veredicto[]>([]);
  const [sintesis, setSintesis] = useState("");
  const [segundos, setSegundos] = useState<number | null>(null);

  const corte = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/consejo")
      .then((r) => r.json())
      .then((d) => {
        setMiembros(d.miembros ?? []);
        setAviso(d.aviso ?? null);
        setListo(Boolean(d.listo));
      })
      .catch(() => setAviso("No se pudo consultar quién está en el consejo."));
  }, []);

  const nombre = useCallback(
    (id: string) => {
      const m = miembros.find((x) => x.id === id);
      return m ? m.casa : id;
    },
    [miembros],
  );

  async function añadir(lista: FileList | null) {
    if (!lista?.length) return;
    const nuevos: Adjunto[] = [];
    for (const f of Array.from(lista).slice(0, ADJUNTOS.max - archivos.length)) {
      if (f.size > ADJUNTOS.bytesPorArchivo) {
        setError(`"${f.name}" pasa del tamaño máximo por archivo.`);
        continue;
      }
      const datos = await new Promise<string>((ok) => {
        const lector = new FileReader();
        lector.onload = () => ok(String(lector.result).split(",")[1] ?? "");
        lector.readAsDataURL(f);
      });
      nuevos.push({ nombre: f.name, tipo: f.type, datos, bytes: f.size });
    }
    setArchivos((a) => [...a, ...nuevos].slice(0, ADJUNTOS.max));
  }

  function limpiar() {
    setR1([]);
    setR2([]);
    setVerificacion("");
    setPuntos([]);
    setResultados([]);
    setPropuesta("");
    setVeredictos([]);
    setSintesis("");
    setSegundos(null);
    setError(null);
    setFase(null);
    setDetalle(null);
    setAvisos([]);
    setMaterial(null);
  }

  async function deliberar() {
    if (!pregunta.trim() || corriendo) return;
    limpiar();
    setCorriendo(true);
    corte.current = new AbortController();

    try {
      const r = await fetch("/api/consejo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pregunta, modo, adjuntos: archivos }),
        signal: corte.current.signal,
      });

      if (!r.ok || !r.body) {
        const d = await r.json().catch(() => ({}));
        setError(d.error ?? "El consejo no pudo reunirse.");
        return;
      }

      /* NDJSON: un evento por línea. Se guarda lo que queda a medias
         entre dos trozos, porque una línea puede partirse por el medio
         y entonces el JSON.parse falla sin motivo aparente. */
      const lector = r.body.getReader();
      const dec = new TextDecoder();
      let resto = "";

      for (;;) {
        const { value, done } = await lector.read();
        if (done) break;
        resto += dec.decode(value, { stream: true });
        const lineas = resto.split("\n");
        resto = lineas.pop() ?? "";
        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let e: Evento;
          try {
            e = JSON.parse(linea) as Evento;
          } catch {
            continue;
          }
          aplicar(e);
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Se cortó la conexión.");
      }
    } finally {
      setCorriendo(false);
      setFase(null);
    }
  }

  function aplicar(e: Evento) {
    switch (e.t) {
      case "consejo":
        setMiembros(e.miembros);
        break;
      case "fase":
        if (e.fase === "aviso") {
          if (e.detalle) setAvisos((x) => (x.includes(e.detalle!) ? x : [...x, e.detalle!]));
        } else {
          setFase(e.fase);
          setDetalle(e.detalle ?? null);
        }
        break;
      case "transcrito":
        setMaterial({ letras: e.letras, de: e.de });
        break;
      case "intervencion":
        if (e.ronda === 1) setR1((x) => [...x, e.v]);
        else if (e.ronda === 2) setR2((x) => [...x, e.v]);
        break;
      case "verificacion":
        setVerificacion(e.texto);
        break;
      case "puntos":
        setPuntos(e.puntos);
        break;
      case "resultados":
        setResultados(e.resultados);
        break;
      case "propuesta":
        setPropuesta(e.texto);
        break;
      case "veredictos":
        setVeredictos(e.veredictos);
        break;
      case "sintesis":
        setSintesis(e.texto);
        break;
      case "fin":
        setSegundos(e.segundos);
        break;
      case "error":
        setError(e.mensaje);
        break;
    }
  }

  const votantes = miembros.filter((m) => !m.secretario);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <Team className="h-5 w-5" />
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight">Consejo</h1>
      </div>

      <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">
        Varias IAs de fabricantes distintos responden por separado, se critican sin
        saber quién es quién y votan. Un secretario comprueba los datos y redacta.
        Sirve para lo que un solo modelo no puede hacer: contradecirse a sí mismo.
      </p>

      {/* Quién está en la mesa, antes de preguntar nada. */}
      {miembros.length > 0 && (
        <section className="mt-6 flex flex-wrap gap-2">
          {miembros.map((m) => (
            <span
              key={m.id}
              title={m.modelo}
              className="rounded-lg border border-line bg-panel px-2.5 py-1 text-[12.5px] text-muted"
            >
              {m.casa}
              {m.secretario ? " · secretario, no vota" : ""}
            </span>
          ))}
        </section>
      )}

      {aviso && (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] leading-relaxed text-amber-200">
          {aviso}
        </p>
      )}

      {/* La pregunta */}
      <div className="mt-6 space-y-3">
        <textarea
          value={pregunta}
          onChange={(ev) => setPregunta(ev.target.value)}
          rows={5}
          disabled={corriendo}
          placeholder="¿Qué sometes al consejo? Funciona mejor con decisiones discutibles, donde quepa más de una respuesta defendible."
          className="w-full resize-y rounded-2xl border border-line bg-panel p-4 text-[14.5px] leading-relaxed outline-none placeholder:text-muted focus:border-line-hi disabled:opacity-60"
        />

        {archivos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {archivos.map((a, i) => (
              <span
                key={`${a.nombre}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-line bg-panel-hi px-2.5 py-1 text-[12.5px]"
              >
                {a.nombre}
                <button
                  onClick={() => setArchivos((x) => x.filter((_, j) => j !== i))}
                  className="text-muted transition hover:text-red-400"
                  aria-label={`Quitar ${a.nombre}`}
                >
                  <Close className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium transition hover:bg-panel-hi">
            <Clip className="h-4 w-4" />
            Adjuntar
            <input
              type="file"
              multiple
              accept={ADJUNTOS_ACEPTADOS}
              disabled={corriendo}
              onChange={(ev) => {
                void añadir(ev.target.files);
                ev.target.value = "";
              }}
              className="hidden"
            />
          </label>

          {/* Rápido o completo. El rápido existe porque si lo único que hay
              es el completo, de tres minutos, se acaba no usando nunca. */}
          <div className="flex rounded-lg border border-line p-0.5">
            {(["rapido", "completo"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                disabled={corriendo}
                className={`rounded-md px-3 py-1 text-[13px] font-medium transition ${
                  modo === m ? "bg-panel-hi text-acento" : "text-muted hover:text-current"
                }`}
              >
                {m === "rapido" ? "Rápido" : "Las 3 rondas"}
              </button>
            ))}
          </div>

          <button
            onClick={() => void deliberar()}
            disabled={corriendo || !pregunta.trim() || !listo}
            className="ml-auto rounded-lg border border-line-hi bg-panel-hi px-4 py-1.5 text-[13.5px] font-medium transition hover:border-acento disabled:opacity-40"
          >
            {corriendo ? "Deliberando…" : "Reunir al consejo"}
          </button>
        </div>

        <p className="text-[12.5px] leading-relaxed text-muted">
          {modo === "rapido"
            ? "Rápido: todos responden a la vez y el secretario destila en qué coinciden, en qué no y qué cifras no se sostienen. Menos de un minuto."
            : `Las 3 rondas: responden a ciegas, se critican en anonimato y votan ${
                puntos.length || "varios"
              } puntos, y firman la propuesta. Varios minutos y bastantes llamadas.`}
        </p>
      </div>

      {/* Lo que va pasando */}
      {(corriendo || fase || detalle) && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          {corriendo && (
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-acento" />
          )}
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium">
              {fase ? (FASES[fase] ?? fase) : corriendo ? "Reuniendo al consejo" : "Listo"}
            </p>
            {detalle && <p className="mt-0.5 text-[12.5px] text-muted">{detalle}</p>}
          </div>
          {segundos !== null && (
            <span className="ml-auto shrink-0 text-[12.5px] text-muted">{segundos}s</span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="text-[14px] font-medium text-red-400">No se pudo completar</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{error}</p>
        </div>
      )}

      {/* Si había archivos, lo primero que hace falta saber es si se
          leyeron. Un consejo deliberando sobre un documento que nadie
          abrió es el peor resultado posible, y hasta ahora no se veía. */}
      {material && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] leading-relaxed text-emerald-200">
          Documento leído por {material.de}: {material.letras.toLocaleString("es")} caracteres.
          Es lo que han visto los seis, igual para todos.
        </div>
      )}

      {avisos.length > 0 && (
        <ul className="mt-4 space-y-2">
          {avisos.map((a, i) => (
            <li
              key={i}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] leading-relaxed text-amber-200"
            >
              {a}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-4">
        {/* Quién ha ido contestando en la ronda 1 */}
        {r1.length > 0 && (
          <Caja titulo="Ronda 1 · respuestas a ciegas">
            <Asistencia lista={r1} nombre={nombre} />
          </Caja>
        )}

        {sintesis && (
          <Caja titulo="Acta del secretario">
            <div className="text-[14.5px] leading-relaxed">
              <Markdown text={sintesis} />
            </div>
          </Caja>
        )}

        {verificacion && (
          <Caja titulo="Verificación de los datos">
            <div className="text-[14px] leading-relaxed">
              <Markdown text={verificacion} />
            </div>
          </Caja>
        )}

        {r2.length > 0 && (
          <Caja titulo="Ronda 2 · debate anónimo">
            <Asistencia lista={r2} nombre={nombre} />
          </Caja>
        )}

        {/* La votación */}
        {resultados.length > 0 && (
          <Caja titulo="Votación">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-muted">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Punto</th>
                    {votantes.map((m) => (
                      <th key={m.id} className="pb-2 px-1.5 text-center font-medium">
                        {m.casa}
                      </th>
                    ))}
                    <th className="pb-2 pl-3 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r) => (
                    <tr key={r.punto.id} className="border-t border-line align-top">
                      <td className="py-2.5 pr-3 leading-relaxed">
                        <span className="text-muted">{r.punto.id}. </span>
                        {r.punto.texto}
                      </td>
                      {votantes.map((m) => {
                        const v = r.votos[m.id];
                        return (
                          <td
                            key={m.id}
                            title={v ? `${ETIQUETA_VOTO[v.voto]}${v.motivo ? `: ${v.motivo}` : ""}` : "sin voto"}
                            className="px-1.5 py-2.5 text-center font-mono"
                          >
                            {v ? SIMBOLO[v.voto] : "?"}
                          </td>
                        );
                      })}
                      <td className="py-2.5 pl-3 whitespace-nowrap">
                        {VEREDICTO[r.veredicto]}
                        <span className="text-muted">
                          {" "}
                          ({r.deAcuerdo + r.matiz}/{r.emitidos})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-muted">
              ++ de acuerdo · ~ matiz · −− en desacuerdo · · abstención · ? sin voto.
              Pasa el ratón por un voto para ver su motivo.
            </p>
          </Caja>
        )}

        {propuesta && (
          <Caja titulo="Propuesta final">
            <div className="text-[14.5px] leading-relaxed">
              <Markdown text={propuesta} />
            </div>
          </Caja>
        )}

        {/* Las firmas */}
        {veredictos.length > 0 && (
          <Caja titulo="Firmas">
            <ul className="space-y-3">
              {veredictos.map((v) => (
                <li key={v.miembro} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <p className="text-[13.5px]">
                    <span className="font-medium">{nombre(v.miembro)}</span>
                    <span className="text-muted"> — {ETIQUETA_FIRMA[v.firma]}</span>
                  </p>
                  {v.motivo && (
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{v.motivo}</p>
                  )}
                  {v.reservas.length > 0 && (
                    <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed text-muted">
                      {v.reservas.map((r, i) => (
                        <li key={i}>· {r}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Caja>
        )}
      </div>
    </main>
  );
}
