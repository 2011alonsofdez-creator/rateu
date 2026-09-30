"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUi } from "@/lib/i18n";
import { usePerfil } from "@/lib/perfil-cliente";
import { Markdown } from "@/components/Markdown";
import { Fuentes } from "@/components/Fuentes";
import { Marca } from "@/components/Logo";
import { Section } from "@/components/Section";
import { Chat as ChatIcon, Clock, Pencil, Play, Plus, Trash } from "@/components/Icons";
import { esTipo, type Tipo } from "@/lib/coworks/recetas";
import type { Fuente } from "@/lib/tipos";

/* Co-Works: los encargos que se ejecutan solos.
 *
 * Esta pantalla tuvo durante semanas tres ejemplos de mentira y un botón
 * que decía "Próximamente". Ahora los Co-Works son de verdad: se
 * guardan, tienen hora, y un reloj los despierta sin que haya nadie
 * delante.
 *
 * Lo que más importa aquí no es el formulario, es el botón de "Probar
 * ahora". Un encargo que se ejecuta mañana a las siete es un acto de fe;
 * poder verlo funcionar ahora mismo es lo que hace que te fíes de
 * dejarlo encendido.
 */

type Cowork = {
  id: string;
  nombre: string;
  tipo: string;
  temas: string;
  hora: number;
  zona: string;
  activo: boolean;
  ultima_vez: string | null;
  creado_el: string;
};

type Resultado = {
  id: string;
  cowork_id: string;
  dia: string;
  estado: "ejecutando" | "ok" | "sin_creditos" | "error";
  contenido: string;
  fuentes: Fuente[] | null;
  modelo: string | null;
  conversacion_id: string | null;
  creado_el: string;
};

/* QUÉ SE PUEDE MANDAR HACER.
 *
 * Esto es lo que se ve; las instrucciones que recibe el modelo están en
 * recetas.ts, y están separadas a propósito: se puede cambiar cómo se
 * explica un Co-Work sin tocar cómo lo hace.
 *
 * Y lo que NO hay, con su nombre, porque preguntarlo es lo primero que
 * hace todo el mundo: leer tu Gmail, tu Drive o tu calendario. Eso no
 * necesita una receta, necesita permiso para entrar en tu cuenta, y
 * hasta que no se conecte (pantalla Conectores) no hay nada que leer.
 * Un encargo que dijera "he mirado tu correo" sin haberlo mirado sería
 * lo peor que puede hacer esta pantalla.
 */
type TipoUi = {
  id: Tipo;
  gratis?: boolean;
  es: { n: string; d: string; ph?: string; ay?: string };
  en: { n: string; d: string; ph?: string; ay?: string };
};

const TIPOS_UI: TipoUi[] = [
  {
    id: "brief",
    es: {
      n: "Resumen de tus temas",
      d: "Cada día busca las novedades de lo que le digas y te las deja escritas.",
      ph: "IA, GTA 6, ofertas de PS5",
      ay: "Separa los temas con comas. Cuanto más concreto, mejor.",
    },
    en: {
      n: "Your topics, daily",
      d: "Every day it looks up what is new on your topics and writes it down.",
      ph: "AI, GTA 6, PS5 deals",
      ay: "Separate topics with commas. The more specific, the better.",
    },
  },
  {
    id: "repaso",
    es: {
      n: "Repaso de estudio",
      d: "Un trozo de lo que estás estudiando cada día, con tres preguntas y las respuestas al final.",
      ph: "la Segunda Guerra Mundial, ecuaciones de segundo grado",
      ay: "Pon las asignaturas o los temas. Coge uno distinto cada día, no te lo suelta todo de golpe.",
    },
    en: {
      n: "Study revision",
      d: "One piece of what you are studying each day, with three questions and the answers at the end.",
      ph: "World War II, quadratic equations",
      ay: "List the subjects or topics. It takes a different one each day instead of dumping everything.",
    },
  },
  {
    id: "idioma",
    es: {
      n: "Inglés cada día",
      d: "Ocho frases que se dicen de verdad, un ejercicio y el fallo típico de los españoles.",
      ph: "inglés nivel medio, para viajar y para el trabajo",
      ay: "Di el idioma y más o menos tu nivel. Si no pones idioma, será inglés.",
    },
    en: {
      n: "A language every day",
      d: "Eight phrases people actually say, one exercise and the mistake your language makes you make.",
      ph: "intermediate English, for travel and work",
      ay: "Say the language and roughly your level. With no language given, it is English.",
    },
  },
  {
    id: "precio",
    es: {
      n: "Chivato de precios",
      d: "Mira lo que cuestan hoy las cosas que le digas y te avisa si algo ha bajado.",
      ph: "PS5 Slim, Nintendo Switch 2, AirPods Pro",
      ay: "Pon el nombre exacto del producto, con el modelo. «Un portátil» no sirve.",
    },
    en: {
      n: "Price watch",
      d: "Checks what your things cost today and tells you when something has dropped.",
      ph: "PS5 Slim, Nintendo Switch 2, AirPods Pro",
      ay: "Use the exact product name, with the model. \"A laptop\" will not do.",
    },
  },
  {
    id: "salud",
    gratis: true,
    es: {
      n: "Vigilante",
      d: "Mira cada día que Kairo siga en pie y solo te escribe cuando algo va mal.",
    },
    en: {
      n: "Watchdog",
      d: "Checks every day that Kairo is still standing, and only writes when something is wrong.",
    },
  },
];

const tipoUi = (id: string): TipoUi => TIPOS_UI.find((x) => x.id === id) ?? TIPOS_UI[0];

/** Los de mentira, solo para que en modo demo se vea de qué va esto. */
const EJEMPLOS: Cowork[] = [
  {
    id: "demo-1",
    nombre: "Daily Brief",
    tipo: "brief",
    temas: "IA, GTA 6, ofertas de PS5",
    hora: 7,
    zona: "Europe/Madrid",
    activo: true,
    ultima_vez: null,
    creado_el: "",
  },
  {
    id: "demo-3",
    nombre: "Vigilante",
    tipo: "salud",
    temas: "",
    hora: 6,
    zona: "Europe/Madrid",
    activo: true,
    ultima_vez: null,
    creado_el: "",
  },
  {
    id: "demo-4",
    nombre: "Repaso",
    tipo: "repaso",
    temas: "la Segunda Guerra Mundial, ecuaciones de segundo grado",
    hora: 17,
    zona: "Europe/Madrid",
    activo: true,
    ultima_vez: null,
    creado_el: "",
  },
  {
    id: "demo-2",
    nombre: "Lo de mis oposiciones",
    tipo: "brief",
    temas: "convocatorias administrativo Andalucía, fechas de examen",
    hora: 21,
    zona: "Europe/Madrid",
    activo: false,
    ultima_vez: null,
    creado_el: "",
  },
];

const zonaDelNavegador = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";
  } catch {
    return "Europe/Madrid";
  }
};

export default function CoworksPage() {
  const { t, lang } = useUi();
  const es = lang === "es";
  /** Lo que se enseña de un tipo, en el idioma de quien mira. */
  const texto = (id: string) => tipoUi(id)[es ? "es" : "en"];
  const perfil = usePerfil();
  const router = useRouter();

  const [coworks, setCoworks] = useState<Cowork[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [falta, setFalta] = useState(false);
  const [aviso, setAviso] = useState<string>();
  /* El servidor sabe QUÉ archivo falta; la traducción de aquí no, y
     nombraba siempre el 0009. Cuando manda una pista, manda ella. */
  const [pista, setPista] = useState<string>();

  // El formulario: vacío = cerrado, "nuevo" = creando, un id = editando.
  const [editando, setEditando] = useState<"" | "nuevo" | string>("");
  const [nombre, setNombre] = useState("");
  const [temas, setTemas] = useState("");
  const [hora, setHora] = useState(7);
  const [tipo, setTipo] = useState<Tipo>("brief");
  const [guardando, setGuardando] = useState(false);

  const [probando, setProbando] = useState("");
  const [abierto, setAbierto] = useState<string>("");

  useEffect(() => {
    if (perfil.demo) {
      setCoworks(EJEMPLOS);
      setCargando(false);
      return;
    }
    fetch("/api/coworks")
      .then((r) => r.json())
      .then((j) => {
        setCoworks(Array.isArray(j?.coworks) ? j.coworks : []);
        setResultados(Array.isArray(j?.resultados) ? j.resultados : []);
        setFalta(Boolean(j?.falta));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [perfil.demo]);

  const abrirNuevo = () => {
    setEditando("nuevo");
    setNombre("");
    setTemas("");
    setHora(7);
    setTipo("brief");
    setAviso(undefined);
    setPista(undefined);
  };

  const abrirEditar = (c: Cowork) => {
    setEditando(c.id);
    setNombre(c.nombre);
    setTemas(c.temas);
    setHora(c.hora);
    setTipo(esTipo(c.tipo) ? c.tipo : "brief");
    setAviso(undefined);
  };

  const guardar = async () => {
    // El vigilante mira siempre lo mismo, así que no se le piden temas.
    if ((tipo !== "salud" && !temas.trim()) || guardando) return;
    setGuardando(true);
    setAviso(undefined);

    const creando = editando === "nuevo";
    const cuerpo = {
      ...(creando ? { tipo } : { id: editando }),
      /* Al CREAR, si lo dejas en blanco se le pone el nombre del tipo.
         Al EDITAR no se manda: el servidor deja el que ya tenía. Antes
         se mandaba siempre, así que cambiarle la hora a un Co-Work que
         habías llamado "Lo de mis oposiciones" se lo renombraba a
         "Resumen de tus temas" de paso. */
      ...(creando
        ? { nombre: nombre.trim() || tipoUi(tipo)[es ? "es" : "en"].n }
        : nombre.trim()
          ? { nombre: nombre.trim() }
          : {}),
      ...(tipo === "salud" ? {} : { temas: temas.trim() }),
      hora,
      zona: zonaDelNavegador(),
    };

    try {
      const r = await fetch("/api/coworks", {
        method: creando ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const j = await r.json().catch(() => null);

      if (!r.ok) {
        setAviso(
          j?.error === "demasiados"
            ? "cw.limit"
            : j?.error === "falta_migracion"
              ? "cw.needsMigration"
              : "cw.failed",
        );
        setPista(typeof j?.pista === "string" ? j.pista : undefined);
        if (j?.error === "falta_migracion") setFalta(true);
        return;
      }

      const guardado = j?.cowork as Cowork | null | undefined;
      // Un 200 sin el Co-Work dentro no es un éxito: meterlo en la lista
      // rompería la pantalla entera al pintarlo.
      if (!guardado?.id) {
        setAviso("cw.failed");
        return;
      }
      setCoworks((v) =>
        creando ? [...v, guardado] : v.map((c) => (c.id === guardado.id ? guardado : c)),
      );
      setEditando("");
    } catch {
      setAviso("err.red");
    } finally {
      setGuardando(false);
    }
  };

  /* El interruptor se mueve antes de preguntar, porque esperar medio
     segundo a que conteste el servidor se nota. Pero si el servidor dice
     que no, hay que devolverlo a su sitio: dejarlo encendido cuando en la
     base de datos sigue apagado es la peor mentira posible en esta
     pantalla —el encargo no se ejecutará y nada lo insinúa. */
  const encender = async (c: Cowork) => {
    const activo = !c.activo;
    const poner = (v: boolean) =>
      setCoworks((lista) => lista.map((x) => (x.id === c.id ? { ...x, activo: v } : x)));

    poner(activo);
    try {
      const r = await fetch("/api/coworks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: c.id, activo }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      poner(c.activo);
      setAviso("cw.failed");
    }
  };

  const borrar = async (c: Cowork) => {
    setCoworks((v) => v.filter((x) => x.id !== c.id));
    setResultados((v) => v.filter((r) => r.cowork_id !== c.id));
    if (abierto === c.id) setAbierto("");
    await fetch(`/api/coworks?id=${c.id}`, { method: "DELETE" }).catch(() => {});
  };

  const probar = async (c: Cowork) => {
    if (probando) return;
    setProbando(c.id);
    setAviso(undefined);
    setAbierto(c.id);

    try {
      const r = await fetch("/api/coworks/probar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const j = await r.json().catch(() => null);

      if (!r.ok) {
        setAviso(
          j?.error === "sin_creditos"
            ? "cw.noCredits"
            : j?.error === "sin_clave"
              ? "cw.needsKey"
              : j?.error === "falta_migracion"
                ? "cw.needsMigration"
                : "cw.failed",
        );
        setPista(typeof j?.pista === "string" ? j.pista : undefined);
        return;
      }

      // Ya lo está haciendo el reloj. Si no se dice, el botón parece roto.
      if (j?.en_marcha) {
        setAviso("cw.inProgress");
        return;
      }

      if (j?.ya_hecho) setAviso("cw.alreadyToday");

      const suelto = j?.resultado;
      if (suelto) {
        const nuevo: Resultado = {
          id: suelto.id ?? `local-${c.id}`,
          cowork_id: c.id,
          /* El día lo dice el servidor, que lo cuenta en la zona del
             Co-Work. Calcularlo aquí en UTC dejaría dos filas del mismo
             día a quien viva lejos de Greenwich. */
          dia: suelto.dia ?? new Date().toISOString().slice(0, 10),
          estado: suelto.estado ?? "ok",
          contenido: suelto.contenido ?? "",
          fuentes: suelto.fuentes ?? null,
          modelo: suelto.modelo ?? null,
          conversacion_id: suelto.conversacion_id ?? null,
          creado_el: new Date().toISOString(),
        };
        setResultados((v) => [nuevo, ...v.filter((x) => x.cowork_id !== c.id || x.dia !== nuevo.dia)]);
        setCoworks((v) =>
          v.map((x) => (x.id === c.id ? { ...x, ultima_vez: new Date().toISOString() } : x)),
        );
      }

      // Los créditos han bajado y hay una conversación nueva en la barra.
      router.refresh();
    } catch {
      setAviso("err.red");
    } finally {
      setProbando("");
    }
  };

  const ultimoDe = (id: string) => resultados.find((r) => r.cowork_id === id);

  const fecha = (iso: string | null) => {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  const ESTADOS: Record<Resultado["estado"], { texto: string; color: string }> = {
    ok: { texto: "cw.stateOk", color: "text-green" },
    error: { texto: "cw.stateError", color: "text-gold" },
    sin_creditos: { texto: "cw.stateNoCredits", color: "text-gold" },
    ejecutando: { texto: "cw.stateRunning", color: "text-muted" },
  };

  /* `soon={false}`: la etiqueta de "Próximamente" se va, porque esto ya
     no lo es. Dejarla puesta sería seguir mintiendo justo en la pantalla
     donde acabas de crear algo que funciona. */
  return (
    <Section icon={Clock} title={t("app.coworks")} lead={t("cw.lead")} soon={false}>
      {perfil.demo && (
        <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] text-gold">
          {t("cw.demo")}
        </p>
      )}

      {falta && !perfil.demo && (
        <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] leading-relaxed text-gold">
          {t("cw.needsMigration")}
        </p>
      )}

      {aviso && (
        <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[13.5px] leading-relaxed text-gold">
          {t(aviso as "cw.failed")}
          {pista && <span className="mt-1 block text-gold/80">{pista}</span>}
        </p>
      )}

      <div className="space-y-3">
        {coworks.map((c) => {
          const ultimo = ultimoDe(c.id);
          const estaAbierto = abierto === c.id;

          return (
            <div key={c.id} className="rounded-2xl border border-line bg-panel">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${c.activo ? "bg-green" : "bg-faint"}`}
                  aria-hidden
                />

                <button
                  onClick={() => setAbierto(estaAbierto ? "" : c.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <h2 className="truncate text-[15px] font-medium">{c.nombre}</h2>
                  <p className="mt-0.5 truncate text-[13px] text-muted">
                    {c.tipo === "salud" ? t("cw.saludWatches") : c.temas}
                  </p>
                  <p className="mt-1 text-[12px] text-faint">
                    {t("cw.everyDayAt").replace("{h}", String(c.hora))}
                    {" · "}
                    {c.ultima_vez
                      ? t("cw.lastRun").replace("{f}", fecha(c.ultima_vez))
                      : t("cw.never")}
                    {" · "}
                    {t(tipoUi(c.tipo).gratis ? "cw.free" : "cw.cost")}
                  </p>
                </button>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => probar(c)}
                    disabled={Boolean(probando) || perfil.demo}
                    title={t("cw.test")}
                    aria-label={`${t("cw.test")}: ${c.nombre}`}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition enabled:hover:bg-panel-hi enabled:hover:text-fg disabled:opacity-40"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => abrirEditar(c)}
                    disabled={perfil.demo}
                    title={t("cw.edit")}
                    aria-label={`${t("cw.edit")}: ${c.nombre}`}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition enabled:hover:bg-panel-hi enabled:hover:text-fg disabled:opacity-40"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => borrar(c)}
                    disabled={perfil.demo}
                    title={t("cw.delete")}
                    aria-label={`${t("cw.delete")}: ${c.nombre}`}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition enabled:hover:bg-red/10 enabled:hover:text-red disabled:opacity-40"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => encender(c)}
                    disabled={perfil.demo}
                    role="switch"
                    aria-checked={c.activo}
                    aria-label={`${c.nombre}: ${t(c.activo ? "cw.on" : "cw.off")}`}
                    className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition disabled:opacity-40 ${
                      c.activo ? "brand-grad" : "bg-panel-hi"
                    }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-bg transition ${
                        c.activo ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {estaAbierto && (
                <div className="border-t border-line p-4">
                  {probando === c.id ? (
                    <div className="flex items-center gap-2.5">
                      <Marca className="h-5 w-5 shrink-0" animada />
                      <p className="text-[13.5px] text-muted">{t("cw.testing")}</p>
                    </div>
                  ) : ultimo ? (
                    <>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-medium uppercase tracking-wide text-faint">
                          {t("cw.result")}
                        </span>
                        <span className={`text-[12px] ${ESTADOS[ultimo.estado].color}`}>
                          {t(ESTADOS[ultimo.estado].texto as "cw.stateOk")}
                        </span>
                        <span className="text-[12px] text-faint">{fecha(ultimo.creado_el)}</span>
                        {ultimo.modelo && (
                          <span className="rounded-full border border-line px-2 py-0.5 text-[11.5px] text-faint">
                            {ultimo.modelo}
                          </span>
                        )}
                      </div>

                      <div className="text-[14.5px] leading-relaxed">
                        <Markdown text={ultimo.contenido} />
                      </div>

                      <Fuentes fuentes={ultimo.fuentes ?? undefined} />

                      {ultimo.conversacion_id && (
                        <button
                          onClick={() => router.push(`/chat?c=${ultimo.conversacion_id}`)}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-[13.5px] text-muted transition hover:bg-panel-hi hover:text-fg"
                        >
                          <ChatIcon className="h-4 w-4" />
                          {t("cw.openChat")}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-[13.5px] text-faint">{t("cw.noResult")}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!cargando && !coworks.length && (
          <p className="py-6 text-center text-[14px] text-faint">{t("cw.empty")}</p>
        )}

        {/* El formulario */}
        {editando ? (
          <div className="rounded-2xl border border-line-hi bg-panel p-4">
            {/* El tipo solo se elige al crear: cambiarlo a mitad de vida
                dejaría el encargo con los datos del otro. */}
            {editando === "nuevo" && (
              <>
                <span className="mb-1.5 block text-[13px] font-medium">{t("cw.type")}</span>
                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  {TIPOS_UI.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setTipo(op.id)}
                      aria-pressed={tipo === op.id}
                      className={`rounded-xl border p-3 text-left transition ${
                        tipo === op.id
                          ? "border-acento bg-panel-hi"
                          : "border-line hover:bg-panel-hi"
                      }`}
                    >
                      <span className="block text-[14px] font-medium">{texto(op.id).n}</span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">
                        {texto(op.id).d}
                      </span>
                      <span className="mt-1.5 block text-[12px] text-faint">
                        {t(op.gratis ? "cw.free" : "cw.cost")}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="mb-1.5 block text-[13px] font-medium" htmlFor="cw-nombre">
              {t("cw.name")}
            </label>
            <input
              id="cw-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("cw.namePh")}
              maxLength={120}
              className="w-full rounded-xl border border-line bg-bg-soft px-3.5 py-2.5 text-[14.5px] outline-none transition placeholder:text-faint focus:border-line-hi"
            />

            {tipo === "salud" ? (
              <p className="mt-4 rounded-xl border border-line bg-bg-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-muted">
                {texto("salud").d}
              </p>
            ) : (
              <>
                <label className="mb-1.5 mt-4 block text-[13px] font-medium" htmlFor="cw-temas">
                  {t("cw.topics")}
                </label>
                <textarea
                  id="cw-temas"
                  value={temas}
                  onChange={(e) => setTemas(e.target.value)}
                  /* El ejemplo es el del tipo elegido: «IA, GTA 6» no
                     ayuda nada si lo que estás creando es un repaso. */
                  placeholder={texto(tipo).ph ?? t("cw.topicsPh")}
                  rows={2}
                  maxLength={600}
                  className="w-full resize-none rounded-xl border border-line bg-bg-soft px-3.5 py-2.5 text-[14.5px] outline-none transition placeholder:text-faint focus:border-line-hi"
                />
                <p className="mt-1.5 text-[12.5px] text-faint">
                  {texto(tipo).ay ?? t("cw.topicsHelp")}
                </p>
              </>
            )}

            <label className="mb-1.5 mt-4 block text-[13px] font-medium" htmlFor="cw-hora">
              {t("cw.hour")}
            </label>
            <select
              id="cw-hora"
              value={hora}
              onChange={(e) => setHora(Number(e.target.value))}
              className="rounded-xl border border-line bg-bg-soft px-3.5 py-2.5 text-[14.5px] outline-none transition focus:border-line-hi"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>

            <div className="mt-5 flex gap-2">
              <button
                onClick={guardar}
                disabled={(tipo !== "salud" && !temas.trim()) || guardando}
                className="brand-grad rounded-xl px-4 py-2.5 text-[14px] font-semibold text-on-accent transition enabled:hover:opacity-90 disabled:opacity-40"
              >
                {editando === "nuevo" ? t("cw.create") : t("cw.save")}
              </button>
              <button
                onClick={() => setEditando("")}
                className="rounded-xl border border-line px-4 py-2.5 text-[14px] text-muted transition hover:bg-panel-hi hover:text-fg"
              >
                {t("cw.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={abrirNuevo}
            disabled={perfil.demo}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-hi p-4 text-[14px] font-medium text-muted transition enabled:hover:bg-panel enabled:hover:text-fg disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {t("cw.new")}
          </button>
        )}
      </div>

      {/* Quién lo despierta: si no se explica, parece magia y nadie se fía. */}
      <div className="mt-8 rounded-2xl border border-line bg-bg-soft p-4">
        <h3 className="text-[14px] font-medium">{t("cw.howTitle")}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{t("cw.how")}</p>
      </div>
    </Section>
  );
}
