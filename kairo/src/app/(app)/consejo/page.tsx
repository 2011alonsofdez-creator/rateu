"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { Clip, Close, Team } from "@/components/Icons";
import { ADJUNTOS_ACEPTADOS, type Adjunto } from "@/lib/tipos";
import { DOCUMENTOS } from "@/lib/consejo/documentos";
import {
  ETIQUETA_FIRMA,
  ETIQUETA_VOTO,
  MATERIAL_MAX,
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
  refirma: "Vuelven a votar la respuesta rehecha",
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

/* Un miembro de la mesa, con su estado a la vista.
 *
 * El punto que late mientras piensa no es decoración: una deliberación
 * tarda minutos, y sin señal de vida cualquiera cree que se ha colgado
 * y recarga la página a mitad. */
function Puesto({
  miembro,
  pensando,
  hecho,
}: {
  miembro: Miembro;
  pensando: boolean;
  hecho?: Intervencion;
}) {
  const gratis = miembro.refs?.[0]?.startsWith("cli:");
  const caido = hecho && !hecho.ok;

  const borde = pensando
    ? "border-acento/50 bg-acento/5"
    : caido
      ? "border-red-500/30 bg-red-500/5"
      : hecho
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-line bg-panel";

  return (
    <div
      title={miembro.refs?.[0] ?? miembro.modelo}
      className={`flex items-center gap-2.5 rounded-xl border p-3 transition-colors ${borde}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pensando && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acento opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            pensando
              ? "bg-acento"
              : caido
                ? "bg-red-400"
                : hecho
                  ? "bg-emerald-400"
                  : "bg-line-hi"
          }`}
        />
      </span>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">{miembro.casa}</p>
        <p className="truncate text-[11.5px] text-muted">
          {pensando
            ? "pensando…"
            : caido
              ? "no contestó"
              : hecho
                ? "ha respondido"
                : miembro.secretario
                  ? "secretario · no vota"
                  : gratis
                    ? "gratis"
                    : "en espera"}
        </p>
      </div>
    </div>
  );
}

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

/* Cuánto va a costar esto, antes de pulsar.
 *
 * No es un presupuesto cerrado: los precios varían por modelo y el
 * consejo no sabe cuánto va a escribir cada uno. Es un orden de
 * magnitud, que es justo lo que hace falta para decidir entre Rápido y
 * las 3 rondas sin llevarse un susto al final del mes. */
function estimar(
  caracteres: number,
  modo: Modo,
  votantesDePago: number,
): { llamadas: number; euros: string } {
  // ~4 caracteres por token, y la ronda 2 lleva además el dossier con las
  // respuestas de los otros cinco, que multiplica lo que entra.
  const tokensEntrada = Math.ceil(caracteres / 4);
  const miembros = votantesDePago + 1; // el secretario también cuenta

  const llamadas = modo === "rapido" ? miembros + 1 : miembros * 3 + 2;

  // Entrada: cada llamada lleva el material. La ronda 2 lleva, además, las
  // respuestas de los demás: se cuenta por lo alto, multiplicando por tres.
  const entrada = modo === "rapido" ? tokensEntrada * llamadas : tokensEntrada * llamadas * 3;
  const salida = llamadas * 1200; // lo que suele escribir cada uno

  // Precios medios de los modelos de la plantilla, por millón de tokens.
  const eur = (entrada * 2.2 + salida * 9) / 1_000_000;
  const euros = eur < 0.01 ? "menos de un céntimo" : `unos ${eur.toFixed(2)} $`;
  return { llamadas, euros };
}

function Caja({
  children,
  titulo,
  soloPantalla,
  soloPdfLargo,
}: {
  children: React.ReactNode;
  titulo?: string;
  /** Lo que sirve para seguir la deliberación en vivo, pero no para el papel. */
  soloPantalla?: boolean;
  /** El cómo se llegó ahí: va en el PDF con todo, no en el de la respuesta. */
  soloPdfLargo?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-panel p-5${soloPantalla ? " no-imprimir" : ""}${
        soloPdfLargo ? " solo-pdf-largo" : ""
      }`}
    >
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
  /* Quién está pensando ahora mismo. Sin esto, la pantalla se quedaba
     quieta uno o dos minutos y luego aparecían todos de golpe: no se
     veía que el consejo estaba trabajando ni quién iba quedando. */
  const [pensando, setPensando] = useState<Set<string>>(new Set());
  const [verificacion, setVerificacion] = useState("");
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [propuesta, setPropuesta] = useState("");
  const [veredictos, setVeredictos] = useState<Veredicto[]>([]);
  /* Las firmas llegan de una vez al final de la ronda 3; para la mesa se
     convierten en intervenciones, que es lo que la tarjeta entiende. */
  const r3: Intervencion[] = veredictos.map((v) => ({
    miembro: v.miembro,
    texto: "",
    ok: v.firma !== "sin_respuesta",
  }));
  const [sintesis, setSintesis] = useState("");
  const [segundos, setSegundos] = useState<number | null>(null);

  /* Qué se va a llevar el PDF. "no" es lo normal: no se está imprimiendo.
     "respuesta" saca solo lo que el consejo contestó, que es lo que uno
     se lleva a un despacho; "todo" añade la verificación, la votación y
     las firmas, para cuando hay que poder defender de dónde sale. */
  const [modoPdf, setModoPdf] = useState<"no" | "respuesta" | "todo">("no");

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

  /* Abrir el diálogo de imprimir cuando ya está pintado lo que toca.
   *
   * Llamar a print() en el mismo tick que se cambia el estado imprime la
   * página como estaba: el navegador hace la captura antes de que React
   * haya pintado. Un cuadro de margen basta y no se nota.
   *
   * De paso se cambia el título del documento, porque es de ahí de donde
   * el navegador saca el nombre del archivo: sin esto, el PDF se guardaba
   * como «Consejo — Kairo» y a la tercera vez ya no sabes cuál es cuál. */
  useEffect(() => {
    if (modoPdf === "no") return;

    const antes = document.title;
    const hoy = new Date().toISOString().slice(0, 10);
    const asunto = pregunta.replace(/\s+/g, " ").trim().slice(0, 60) || "deliberación";
    document.title = `Consejo ${hoy} — ${asunto}`;

    const t = window.setTimeout(() => {
      window.print();
      document.title = antes;
      setModoPdf("no");
    }, 80);

    return () => {
      window.clearTimeout(t);
      document.title = antes;
    };
  }, [modoPdf, pregunta]);

  const nombre = useCallback(
    (id: string) => {
      const m = miembros.find((x) => x.id === id);
      return m ? m.casa : id;
    },
    [miembros],
  );

  async function añadir(lista: FileList | null) {
    if (!lista?.length) return;

    const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;
    const hueco = DOCUMENTOS.max - archivos.length;
    if (hueco <= 0) {
      setError(`Ya hay ${DOCUMENTOS.max} archivos, que es el máximo por deliberación.`);
      return;
    }

    const nuevos: Adjunto[] = [];
    /* El tope de todos juntos se comprueba también aquí, no solo en el
       servidor: enterarse de que no cabe después de subir ocho megas por
       una línea de casa es peor que enterarse al elegirlo. */
    let total = archivos.reduce((n, a) => n + a.bytes, 0);

    for (const f of Array.from(lista).slice(0, hueco)) {
      if (f.size > DOCUMENTOS.bytesPorArchivo) {
        setError(
          `"${f.name}" pesa ${mb(f.size)} y el máximo por archivo es ` +
            `${mb(DOCUMENTOS.bytesPorArchivo)}.`,
        );
        continue;
      }
      if (total + f.size > DOCUMENTOS.bytesTotal) {
        setError(
          `"${f.name}" no cabe: entre todos pasarían de ${mb(DOCUMENTOS.bytesTotal)}.`,
        );
        continue;
      }
      const datos = await new Promise<string>((ok) => {
        const lector = new FileReader();
        lector.onload = () => ok(String(lector.result).split(",")[1] ?? "");
        lector.readAsDataURL(f);
      });
      total += f.size;
      nuevos.push({ nombre: f.name, tipo: f.type, datos, bytes: f.size });
    }
    if (nuevos.length) setArchivos((a) => [...a, ...nuevos].slice(0, DOCUMENTOS.max));
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
    setPensando(new Set());
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
          if (e.fase === "ronda1") setPensando(new Set(miembros.map((m) => m.id)));
          else if (e.fase === "ronda2" || e.fase === "ronda3") {
            setPensando(new Set(miembros.filter((m) => !m.secretario).map((m) => m.id)));
          } else setPensando(new Set());
        }
        break;
      case "transcrito":
        setMaterial({ letras: e.letras, de: e.de });
        break;
      case "intervencion":
        setPensando((x) => {
          const y = new Set(x);
          y.delete(e.v.miembro);
          return y;
        });
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
      case "renegociando":
        /* Una propuesta rechazada no es el final: el secretario la rehace
           atendiendo las objeciones y se vuelve a votar. Se cuenta en
           pantalla porque es la parte que más se parece a negociar. */
        setVeredictos([]);
        setAvisos((x) => [
          ...x,
          `Vuelta ${e.vuelta}: no firmaron todos, así que el secretario rehace la ` +
            `respuesta atendiendo a ${e.motivos.join(" · ")}`,
        ]);
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

  const hayRespuesta = Boolean(sintesis || propuesta);

  return (
    <main
      className={`mx-auto max-w-3xl px-4 py-8 sm:py-10${
        modoPdf === "respuesta" ? " pdf-corto" : ""
      }`}
    >
      {/* Al imprimir se queda la deliberación y se va la aplicación.
          Chrome imprime a PDF de serie, así que no hace falta ninguna
          librería: el PDF sale con el texto seleccionable y buscable,
          que es justo lo que quiere quien se lo lleva a un despacho. */}
      <style>{`
        @media print {
          /* Fuera todo lo que no es el documento: barra lateral, botones,
             y los recuadros de colores, que en papel solo gastan tinta. */
          aside, nav, .no-imprimir { display: none !important; }
          main { max-width: none !important; padding: 0 !important; }
          :root, body, main { background: #fff !important; color: #000 !important; }
          * { color: #000 !important; border-color: #bbb !important; background: transparent !important; }
          a { text-decoration: underline; }
          /* Que no parta una tabla ni una firma por la mitad de una página. */
          section, table, li { break-inside: avoid; }
          h1 { font-size: 20pt; }
          h2 { font-size: 13pt; margin-top: 14pt; }
          .solo-impreso { display: block !important; }
          /* El PDF corto: solo lo que el consejo contestó. Lo demás —cómo
             se llegó ahí, los votos, las firmas— es para el PDF largo. */
          .pdf-corto .solo-pdf-largo { display: none !important; }
        }
        .solo-impreso { display: none; }
        @page { margin: 18mm 16mm; }
      `}</style>
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-acento">
          <Team className="h-5 w-5" />
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight">Consejo</h1>
      </div>

      {/* En pantalla sobra, en papel hace falta: sin la pregunta y la
          fecha, el documento impreso no se sostiene solo. */}
      <div className="solo-impreso mt-4 border-b pb-3 text-[11pt]">
        <p>
          <strong>Pregunta:</strong> {pregunta || "—"}
        </p>
        <p className="mt-1">
          <strong>Consejo:</strong> {miembros.map((m) => m.casa).join(", ")}
        </p>
        <p className="mt-1">
          <strong>Fecha:</strong>{" "}
          {new Date().toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}
          {segundos !== null ? ` · deliberación de ${segundos} s` : ""}
        </p>
        {archivos.length > 0 && (
          <p className="mt-1">
            <strong>Documentos:</strong> {archivos.map((a) => a.nombre).join(", ")}
          </p>
        )}
      </div>

      <p className="no-imprimir mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">
        Varias IAs de fabricantes distintos responden por separado, se critican sin
        saber quién es quién y votan. Un secretario comprueba los datos y redacta.
        Sirve para lo que un solo modelo no puede hacer: contradecirse a sí mismo.
      </p>

      {/* La mesa. Cada miembro es una tarjeta que cambia de estado según
          va la deliberación: esperando, pensando, ha contestado, se cayó.
          Es lo que convierte dos minutos de pantalla quieta en algo que
          se puede mirar. */}
      {miembros.length > 0 && (
        <section className="no-imprimir mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {miembros.map((m) => (
            <Puesto
              key={m.id}
              miembro={m}
              pensando={pensando.has(m.id)}
              hecho={[...r3, ...r2, ...r1].find((v) => v.miembro === m.id)}
            />
          ))}
        </section>
      )}

      {aviso && (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] leading-relaxed text-amber-200">
          {aviso}
        </p>
      )}

      {/* La pregunta */}
      <div className="no-imprimir mt-6 space-y-3">
        <textarea
          value={pregunta}
          onChange={(ev) => setPregunta(ev.target.value)}
          rows={5}
          disabled={corriendo}
          placeholder="¿Qué sometes al consejo? Funciona mejor con decisiones discutibles, donde quepa más de una respuesta defendible."
          className="w-full resize-y rounded-2xl border border-line bg-panel p-4 text-[14.5px] leading-relaxed outline-none placeholder:text-muted focus:border-line-hi disabled:opacity-60"
        />

        {/* Pedirle el PDF al consejo es tirar una deliberación entera.
            Ninguno de los seis puede escribir un archivo en tu ordenador:
            lo único que hacen es devolver texto. El PDF lo hace el botón
            de abajo con lo que hayan contestado, sea lo que sea. */}
        {/\bpdf\b/i.test(pregunta) && (
          <p className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-[13px] leading-relaxed text-sky-200">
            El PDF no se lo pidas a ellos: no pueden escribir archivos, solo devolver
            texto. Pide lo que quieras que digan y, cuando contesten, lo descargas con
            el botón <strong>PDF de la respuesta</strong>. Saldrá en PDF sea lo que sea
            —un análisis, un escrito, un cuadro de argumentos—.
          </p>
        )}

        {archivos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {archivos.map((a, i) => (
              <span
                key={`${a.nombre}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-line bg-panel-hi px-2.5 py-1 text-[12.5px]"
              >
                {a.nombre}
                <span className="text-muted">{(a.bytes / 1024 / 1024).toFixed(1)} MB</span>
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

        {(() => {
          const votantesDePago = miembros.filter(
            (m) => !m.secretario && !m.refs?.[0]?.startsWith("cli:"),
          ).length;
          /* Lo que pesa un PDF no dice casi nada de lo que ocupa su
             texto: un escaneo de dos páginas puede pesar seis megas y
             traer cuatro párrafos. Y de todas formas el material está
             topado, así que el cálculo se topa igual: por encima de
             MATERIAL_MAX no se paga más, se recorta. */
          const delDocumento = Math.min(
            archivos.reduce((n, a) => n + a.bytes * 0.5, 0),
            MATERIAL_MAX,
          );
          const caracteres = pregunta.length + delDocumento;
          const { llamadas, euros } = estimar(caracteres, modo, votantesDePago);
          if (!votantesDePago) return null;
          return (
            <p className="text-[12.5px] leading-relaxed text-muted">
              Coste aproximado: <span className="text-current">{euros}</span> · {llamadas}{" "}
              llamadas de pago
              {archivos.length > 0 && modo === "completo" ? (
                <span className="text-amber-300">
                  {" "}
                  · con documentos, las 3 rondas salen mucho más caras: el texto viaja en
                  cada llamada
                </span>
              ) : null}
            </p>
          );
        })()}

        {/* Los expedientes escaneados pesan, y publicado en Vercel la
            petición se corta a 4,5 MB. En local no hay tope, que es donde
            se usa esto con papeles de verdad: mejor decirlo antes que
            dejar un error de servidor sin explicación. */}
        {archivos.reduce((n, a) => n + a.bytes, 0) > 4 * 1024 * 1024 && (
          <p className="text-[12.5px] leading-relaxed text-amber-300">
            Son{" "}
            {(archivos.reduce((n, a) => n + a.bytes, 0) / 1024 / 1024).toFixed(1)} MB de
            documentos: funciona en local, pero la versión publicada en Vercel corta las
            peticiones de más de 4,5 MB.
          </p>
        )}

        <p className="text-[12.5px] leading-relaxed text-muted">
          {modo === "rapido"
            ? "Rápido: todos responden a la vez y el secretario te devuelve una sola respuesta con lo mejor de las seis, señalando en qué no se ponen de acuerdo. Menos de un minuto."
            : "Las 3 rondas: responden a ciegas, se critican en anonimato, votan punto por punto y firman la respuesta acordada. Varios minutos y bastantes llamadas, para cuando la decisión lo merece."}
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
          {Number(material.de) === 1 ? "Documento leído" : `${material.de} documentos leídos`}:{" "}
          {material.letras.toLocaleString("es")} caracteres. Es lo que han visto los seis,
          igual para todos.
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

      {/* Llevárselo en PDF.
          El navegador imprime a PDF de serie, así que no hace falta
          ninguna librería y el texto sale seleccionable y buscable, que es
          lo que quiere quien se lo lleva a un despacho. Dos botones y no
          un selector: lo que decide cuál quieres es a quién se lo das. */}
      {hayRespuesta && !corriendo && (
        <div className="no-imprimir mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModoPdf("respuesta")}
            className="rounded-lg border border-line-hi bg-panel-hi px-3.5 py-1.5 text-[13.5px] font-medium transition hover:border-acento"
          >
            PDF de la respuesta
          </button>
          <button
            onClick={() => setModoPdf("todo")}
            className="rounded-lg border border-line px-3.5 py-1.5 text-[13.5px] font-medium transition hover:bg-panel-hi"
          >
            PDF con todo
          </button>
          <span className="text-[12.5px] leading-relaxed text-muted">
            En el diálogo que se abre, elige «Guardar como PDF».
          </span>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {/* Quién ha ido contestando en la ronda 1 */}
        {sintesis && (
          <Caja titulo="Respuesta del consejo">
            <div className="text-[14.5px] leading-relaxed">
              <Markdown text={sintesis} />
            </div>
          </Caja>
        )}

        {propuesta && (
          <Caja titulo="Respuesta acordada del consejo">
            <div className="text-[14.5px] leading-relaxed">
              <Markdown text={propuesta} />
            </div>
          </Caja>
        )}

        {(r1.length > 0 || resultados.length > 0) && (
          <p className="no-imprimir solo-pdf-largo pt-2 text-[12.5px] font-medium uppercase tracking-wide text-muted">
            Cómo se llegó a esa respuesta
          </p>
        )}

        {r1.length > 0 && (
          <Caja titulo="Ronda 1 · respuestas a ciegas" soloPantalla>
            <Asistencia lista={r1} nombre={nombre} />
          </Caja>
        )}

        {verificacion && (
          <Caja titulo="Verificación de los datos" soloPdfLargo>
            <div className="text-[14px] leading-relaxed">
              <Markdown text={verificacion} />
            </div>
          </Caja>
        )}

        {r2.length > 0 && (
          <Caja titulo="Ronda 2 · debate anónimo" soloPantalla>
            <Asistencia lista={r2} nombre={nombre} />
          </Caja>
        )}

        {/* La votación */}
        {resultados.length > 0 && (
          <Caja titulo="Votación" soloPdfLargo>
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

        {/* Las firmas */}
        {veredictos.length > 0 && (
          <Caja titulo="Firmas" soloPdfLargo>
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
