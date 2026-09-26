"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUi, type Lang, type TKey } from "@/lib/i18n";
import { LEVELS, pick, type Level, type Message } from "@/lib/mock";
import { useCredits } from "@/lib/credits";
import { usePerfil } from "@/lib/perfil-cliente";
import { useHistorial } from "@/lib/historial";
import { callar, hayVozParaLeer, leerEnVozAlta, prepararVoces } from "@/lib/voz";
import { borrarDesde } from "@/app/(app)/actions";
import { esImagen, type Adjunto, type Fuente, type Mente, type MensajeGuardado } from "@/lib/tipos";
import { tamano } from "@/lib/archivos";
import { Composer } from "@/components/Composer";
import { Fuentes } from "@/components/Fuentes";
import { Markdown } from "@/components/Markdown";
import { Pensando } from "@/components/Pensando";
import { Marca } from "@/components/Logo";
import {
  Bolt,
  Brain,
  Chevron,
  Chat as ChatIcon,
  Check,
  Clock,
  Code,
  Copy,
  Altavoz,
  Pencil,
  Stop,
  Image as ImageIcon,
  Refresh,
} from "@/components/Icons";

/* Respuestas de ejemplo. Solo se usan en modo demo, cuando no hay
   Supabase ni clave de Gemini configurados. */
const DEMO: Record<Level, Record<Lang, string>> = {
  fast: {
    es: "Esto es el **modo demo**: no hay ninguna IA detrás todavía, solo un texto de ejemplo.\n\nConfigura Supabase y la clave de Gemini y aquí empezará a responder de verdad.",
    en: "This is **demo mode**: there is no AI behind this yet, just sample text.\n\nSet up Supabase and the Gemini key and this will start answering for real.",
  },
  normal: {
    es: "Modo demo. Con las claves puestas, este nivel usa un modelo mejor y responde de verdad.",
    en: "Demo mode. With the keys in place, this level uses a better model and answers for real.",
  },
  forja: {
    es: "Modo demo. Forja es el nivel para trabajar a fondo: programar, analizar y crear.",
    en: "Demo mode. Forge is the level for deep work: coding, analysis and creation.",
  },
  mega: {
    es: "Modo demo. El Mega-Prompt exprime el modelo al máximo cuando está conectado de verdad.",
    en: "Demo mode. The Mega-Prompt pushes the model to its limit once properly connected.",
  },
};

const CARDS: {
  icon: typeof ChatIcon;
  title: TKey;
  desc: TKey;
  href?: string;
  prompt?: { es: string; en: string };
}[] = [
  {
    icon: ChatIcon,
    title: "card.chat",
    desc: "card.chatDesc",
    prompt: {
      es: "Explícame en 3 frases qué sabes hacer",
      en: "Tell me in 3 sentences what you can do",
    },
  },
  { icon: Brain, title: "card.mentes", desc: "card.mentesDesc", href: "/mentes" },
  { icon: Clock, title: "card.cowork", desc: "card.coworkDesc", href: "/coworks" },
  { icon: Code, title: "card.code", desc: "card.codeDesc", href: "/codigo" },
  { icon: ImageIcon, title: "card.image", desc: "card.imageDesc", href: "/codigo" },
];

/* La página lee la dirección (?c= y ?mente=), y eso obliga a envolverla:
   sin el Suspense, Next no puede adelantar nada del HTML. */
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <Chat />
    </Suspense>
  );
}

/** La zona horaria de este navegador, o nada si no se puede saber. */
function zonaDelNavegador(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/* Saca el texto a ritmo constante en vez de a ráfagas.
 *
 * El modelo no manda el texto letra a letra: llega a trompicones, y a
 * veces un párrafo entero de golpe. Pintarlo tal cual da esa sensación de
 * tirones. Esto guarda lo que llega y lo va soltando; si se acumula
 * mucho, acelera, para no quedarse por detrás de lo que ya está dicho. */
function suavizado(anadir: (v: string) => void, alVaciarse: () => void) {
  let pendiente = "";
  let animando = false;
  let terminado = false;

  const soltar = () => {
    if (!pendiente) {
      animando = false;
      if (terminado) alVaciarse();
      return;
    }

    let n = Math.max(3, Math.ceil(pendiente.length / 25));
    // Sin partir un emoji por la mitad: ocupa dos posiciones.
    const codigo = pendiente.charCodeAt(n - 1);
    if (codigo >= 0xd800 && codigo <= 0xdbff) n += 1;

    anadir(pendiente.slice(0, n));
    pendiente = pendiente.slice(n);
    requestAnimationFrame(soltar);
  };

  return {
    encolar(v: string) {
      if (!v) return;
      pendiente += v;
      if (animando) return;
      animando = true;
      requestAnimationFrame(soltar);
    },
    cerrar() {
      terminado = true;
      if (!animando) alVaciarse();
    },
  };
}

function Chat() {
  const { t, lang } = useUi();
  const router = useRouter();
  const params = useSearchParams();
  const perfil = usePerfil();
  const historial = useHistorial();
  const { credits, spend, sincronizar } = useCredits();

  const [messages, setMessages] = useState<Message[]>([]);
  const [level, setLevel] = useState<Level>("fast");
  const [busy, setBusy] = useState(false);
  const [modelo, setModelo] = useState<string>();
  const [mente, setMente] = useState<Mente | null>(null);
  /* Id del mensaje que se está escribiendo ahora mismo. Hace falta aparte
     de `busy`, porque `busy` se apaga con la primera palabra y el logo
     tiene que seguir vivo hasta la última. */
  const [escribiendo, setEscribiendo] = useState<string>();
  /* En qué conversación estamos. Null = todavía no existe; se creará
     con el primer mensaje. */
  const [conversacion, setConversacion] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<TKey>();
  const [detalle, setDetalle] = useState<string>();
  /** Segundos que el proveedor pide esperar, cuando los dice. */
  const [espera, setEspera] = useState<number>();
  const [noCredits, setNoCredits] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  /* ¿Está el usuario pegado al final? Mientras lo esté, la conversación
     baja sola con cada palabra que llega. En cuanto sube a releer algo,
     deja de arrastrarle: antes el chat le devolvía abajo cada pocas
     décimas y era imposible leer nada mientras Kairo escribía. */
  const pegado = useRef(true);
  const [abajo, setAbajo] = useState(true);
  /* Cuál está ya en pantalla. Sin esto, cambiar la dirección al crear una
     conversación volvería a cargarla y borraría lo que se está escribiendo. */
  const puesta = useRef<string | null>(null);

  const mirarPosicion = () => {
    const el = caja.current;
    if (!el) return;
    // 80 píxeles de margen: si casi está abajo, cuenta como abajo.
    const cerca = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    pegado.current = cerca;
    setAbajo(cerca);
  };

  const bajarDelTodo = () => {
    pegado.current = true;
    setAbajo(true);
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!pegado.current) return;
    /* Mientras se escribe, el salto es instantáneo: con "smooth" sesenta
       veces por segundo el navegador se pelea consigo mismo y da tirones.
       Cuando no se escribe, suave, que es cuando se nota bonito. */
    bottom.current?.scrollIntoView({ behavior: escribiendo ? "auto" : "smooth" });
  }, [messages, busy, escribiendo]);

  /* Al llegar desde "Usar en el chat" la Mente viene en la dirección.
     Solo preselecciona; quien decide de verdad qué Mente se usa es el
     servidor, que la busca por su identificador. */
  useEffect(() => {
    const id = params.get("mente");
    if (!id) return;

    fetch("/api/mentes")
      .then((r) => r.json())
      .then((j) => {
        const m = (j?.mentes as Mente[] | undefined)?.find((x) => x.id === id);
        if (m) setMente(m);
      })
      .catch(() => {
        /* sin Mentes: el chat funciona igual */
      });
  }, [params]);

  /* Abrir una conversación guardada, o empezar una limpia si no hay ?c=.
     Es lo que hace que "Nuevo chat" vacíe la pantalla: cambia la
     dirección, y esto se entera. */
  useEffect(() => {
    const c = params.get("c");
    if (c === puesta.current) return; // ya está en pantalla
    puesta.current = c;

    if (!c) {
      setMessages([]);
      setConversacion(null);
      setMente(null);
      setError(undefined);
      return;
    }

    setCargando(true);
    fetch(`/api/conversaciones/${c}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("404"))))
      .then((j) => {
        const guardados = (j?.mensajes ?? []) as MensajeGuardado[];
        setMessages(
          guardados.map((m) => ({
            id: m.id,
            // Al venir de la base de datos, el identificador ES el suyo.
            dbId: m.id,
            role: m.rol,
            content: { es: m.contenido, en: m.contenido },
            model: m.modelo ?? undefined,
            level: (m.nivel as Level | null) ?? undefined,
            credits: m.rol === "kairo" ? m.creditos : undefined,
            fuentes: m.fuentes.length ? m.fuentes : undefined,
            busquedas: m.busquedas.length ? m.busquedas : undefined,
          })),
        );
        setConversacion(c);

        // Si la conversación se abrió con una Mente, se sigue con ella.
        const menteId = j?.conversacion?.menteId as string | null | undefined;
        if (!menteId) return setMente(null);
        return fetch("/api/mentes")
          .then((r) => r.json())
          .then((jm) => {
            const m = (jm?.mentes as Mente[] | undefined)?.find((x) => x.id === menteId);
            setMente(m ?? null);
          });
      })
      .catch(() => {
        // Borrada, o de otra persona: se vuelve a un chat en blanco.
        setMessages([]);
        setConversacion(null);
        puesta.current = null;
      })
      .finally(() => setCargando(false));
  }, [params]);

  /* Responder de mentira, para el modo demo. Escribe igual que la web de
     verdad: si aquí saliera de golpe, estaríamos enseñando algo que no
     se parece al producto. */
  const responderDemo = async (coste: number) => {
    await spend(coste, `demo ${level}`);
    const idK = `k${Date.now()}`;

    window.setTimeout(() => {
      setBusy(false);
      setEscribiendo(idK);
      setMessages((m) => [
        ...m,
        { id: idK, role: "kairo", level, credits: coste, model: "demo",
          content: { es: "", en: "" } },
      ]);

      const flujo = suavizado(
        (v) =>
          setMessages((m) => {
            const copia = [...m];
            const ult = copia[copia.length - 1];
            if (ult?.id !== idK) return m;
            copia[copia.length - 1] = {
              ...ult,
              content: { es: ult.content.es + v, en: ult.content.en + v },
            };
            return copia;
          }),
        () => setEscribiendo(undefined),
      );
      flujo.encolar(DEMO[level][lang]);
      flujo.cerrar();
    }, 700);
  };

  /* Pone la pantalla en modo "estoy trabajando" y lanza la respuesta,
     con IA de verdad o con la de ejemplo. Lo usan enviar, editar y
     regenerar: los tres acaban en el mismo sitio. */
  const arrancarRespuesta = async (lista: Message[], esReintento: boolean) => {
    const coste = LEVELS[level].credits;
    pegado.current = true;
    setAbajo(true);
    setBusy(true);
    setModelo(undefined);

    if (perfil.demo) return responderDemo(coste);
    await pedir(lista, esReintento);
  };

  /* Los archivos ya enviados dejan de hacer falta enteros: el modelo
     ya los vio. Se queda la miniatura de las fotos pequeñas, para que
     la conversación siga teniendo sentido al mirarla, y del resto solo
     el nombre. Un PDF de tres megas por mensaje, multiplicado por una
     tarde de preguntas, es memoria del navegador tirada. */
  const aligerar = (lista: Message[]): Message[] =>
    lista.map((m) =>
      m.adjuntos?.length
        ? {
            ...m,
            adjuntos: m.adjuntos.map((a) =>
              esImagen(a.tipo) && a.datos.length <= 300_000 ? a : { ...a, datos: "" },
            ),
          }
        : m,
    );

  const send = async (texto: string, adjuntos: Adjunto[] = []) => {
    const coste = LEVELS[level].credits;
    setError(undefined);
    setDetalle(undefined);

    // Comprobación rápida para no molestar al servidor en vano.
    // La que decide de verdad está en la base de datos.
    if (coste > credits) {
      setNoCredits(true);
      return;
    }

    const bi = { es: texto, en: texto };
    const conElMio: Message[] = [
      ...aligerar(messages),
      {
        id: `u${Date.now()}`,
        role: "user",
        content: bi,
        adjuntos: adjuntos.length ? adjuntos : undefined,
      },
    ];
    setMessages(conElMio);
    await arrancarRespuesta(conElMio, false);
  };

  /* Editar una pregunta ya enviada.
   *
   * Te has equivocado escribiendo y la respuesta ya no vale: contesta a
   * lo que escribiste, no a lo que querías decir. Así que la pregunta
   * se cambia y se vuelve a preguntar desde ahí, y todo lo que venía
   * después se va. También de la base de datos: si se quedara, al
   * reabrir la conversación aparecerían la pregunta vieja y la nueva
   * una detrás de otra, como si hubieras preguntado dos veces. */
  const editar = async (id: string, nuevo: string) => {
    if (busy) return;

    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0) return;

    const original = messages[idx];
    const texto = nuevo.trim();
    if (!texto || texto === pick(original.content, lang)) return;

    const coste = LEVELS[level].credits;
    if (coste > credits) return setNoCredits(true);

    setError(undefined);
    setDetalle(undefined);

    if (conversacion && original.dbId && !perfil.demo) {
      await borrarDesde(conversacion, original.dbId);
    }

    /* Los archivos que llevaba siguen con la pregunta corregida: has
       cambiado lo que preguntas, no lo que le enseñas. Solo los que
       todavía están enteros en memoria; de los viejos se soltó el
       contenido y volver a mandarlos sería mandar un archivo vacío. */
    const conservados = original.adjuntos?.filter((a) => a.datos);

    const lista: Message[] = [
      ...messages.slice(0, idx),
      {
        id: `u${Date.now()}`,
        role: "user",
        content: { es: texto, en: texto },
        adjuntos: conservados?.length ? conservados : undefined,
      },
    ];
    setMessages(lista);
    await arrancarRespuesta(lista, false);
  };

  /* Volver a pedir la última respuesta. La pregunta sigue donde estaba
     —en pantalla y en la base de datos—, así que no se vuelve a guardar;
     lo que se tira es la respuesta que no te ha servido. */
  const regenerar = async (id: string) => {
    if (busy) return;

    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0 || messages[idx].role !== "kairo") return;

    const coste = LEVELS[level].credits;
    if (coste > credits) return setNoCredits(true);

    setError(undefined);
    setDetalle(undefined);

    const dbId = messages[idx].dbId;
    if (conversacion && dbId && !perfil.demo) {
      await borrarDesde(conversacion, dbId);
    }

    const lista = messages.slice(0, idx);
    setMessages(lista);
    await arrancarRespuesta(lista, true);
  };

  /* Habla con el servidor con la lista de mensajes que se le dé.
     Separado de `send` para poder reintentar sin volver a añadir tu
     pregunta: en un reintento ya está en pantalla y en la base de datos. */
  const pedir = async (lista: Message[], esReintento: boolean) => {
    const coste = LEVELS[level].credits;
    setError(undefined);
    setDetalle(undefined);
    setEspera(undefined);

    // Si la respuesta ni empieza, no hay cola que cerrar.
    let cerrarFlujo = () => setEscribiendo(undefined);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nivel: level,
          reintento: esReintento,
          /* Tu huso horario. Sin esto, Kairo no sabe qué día es hoy para
             ti y acaba contestando "mi conocimiento llega hasta 2024". */
          zona: zonaDelNavegador(),
          // Solo el identificador. Las instrucciones las lee el servidor
          // de la base de datos: si viajaran en la petición, cualquiera
          // podría colar el texto que quisiera en el system prompt.
          menteId: mente?.id ?? null,
          conversacionId: conversacion,
          /* Los archivos van SOLO con la última pregunta. En el resto
             sobran: el modelo ya los vio en su momento y repetirlos en
             cada mensaje haría la petición más grande cada vez, hasta
             que dejara de caber. */
          mensajes: lista.map((m, i) => ({
            rol: m.role,
            texto: pick(m.content, lang),
            ...(i === lista.length - 1 && m.adjuntos?.length
              ? { adjuntos: m.adjuntos }
              : {}),
          })),
        }),
      });

      if (!res.ok || !res.body) {
        setBusy(false);
        if (res.status === 402) return setNoCredits(true);
        if (res.status === 403) return setError("err.nivel");
        if (res.status === 401) return setError("err.sesion");
        if (res.status === 503) {
          const j = await res.json().catch(() => null);
          if (j?.error === "sin_modelo_archivos") return setError("err.archivos");
        }
        return setError("err.modelo");
      }

      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      const idK = `k${Date.now()}`;
      let resto = "";
      let abierto = false;

      /* El logo deja de moverse cuando se acaba el texto EN PANTALLA, no
         cuando se acaba el que viene por el cable. */
      const flujo = suavizado(
        (v) => anadirTexto(v),
        () => setEscribiendo(undefined),
      );
      cerrarFlujo = () => flujo.cerrar();

      const anadirTexto = (v: string) => {
        setMessages((m) => {
          if (!abierto) return m;
          const copia = [...m];
          const ult = copia[copia.length - 1];
          if (ult?.id !== idK) return m;
          copia[copia.length - 1] = {
            ...ult,
            content: { es: ult.content.es + v, en: ult.content.en + v },
          };
          return copia;
        });
      };

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decoder.decode(value, { stream: true });
        const lineas = resto.split("\n");
        resto = lineas.pop() ?? "";

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(linea);
          } catch {
            continue; // línea partida a medias: se recompone en la siguiente vuelta
          }

          if (ev.t === "meta") {
            setModelo(String(ev.modelo ?? ""));
          } else if (ev.t === "conversacion") {
            const id = String(ev.id);
            setConversacion(id);
            puesta.current = id;

            /* La base de datos ya tiene tu pregunta y acaba de decirnos
               con qué identificador. Sin él no se podría editar: editar
               es rehacer la conversación desde ese mensaje, y para eso
               hay que saber cuál es. */
            const idPregunta = ev.mensajeUsuario;
            if (typeof idPregunta === "string") {
              setMessages((m) => {
                const ultimo = [...m].reverse().find((x) => x.role === "user");
                return ultimo && !ultimo.dbId
                  ? m.map((x) => (x.id === ultimo.id ? { ...x, dbId: idPregunta } : x))
                  : m;
              });
            }
            // La dirección pasa a apuntar a esta conversación, para que
            // recargar o compartir el enlace la abra. Sin salto de página.
            if (ev.nueva) {
              router.replace(`/chat?c=${id}`, { scroll: false });
              router.refresh(); // que salga ya en la barra lateral
            }
          } else if (ev.t === "creditos") {
            sincronizar(Number(ev.creditos ?? 0), Number(ev.creditosExtra ?? 0));
          } else if (ev.t === "texto") {
            if (!abierto) {
              abierto = true;
              setBusy(false);
              setEscribiendo(idK);
              setMessages((m) => [
                ...m,
                {
                  id: idK,
                  role: "kairo",
                  level,
                  credits: coste,
                  model: modelo,
                  content: { es: "", en: "" },
                },
              ]);
            }
            flujo.encolar(String(ev.v ?? ""));
          } else if (ev.t === "fuentes") {
            /* Llegan al final, cuando el modelo ya ha dicho lo que tenía
               que decir. Se cuelgan del mensaje que se está escribiendo;
               si no llegó a abrirse ninguno, no hay nada que adornar. */
            const lista = Array.isArray(ev.v) ? (ev.v as Fuente[]) : [];
            const buscado = Array.isArray(ev.busquedas) ? (ev.busquedas as string[]) : [];
            if (abierto && (lista.length || buscado.length)) {
              setMessages((m) =>
                m.map((x) =>
                  x.id === idK
                    ? {
                        ...x,
                        fuentes: lista.length ? lista : undefined,
                        busquedas: buscado.length ? buscado : undefined,
                      }
                    : x,
                ),
              );
            }
          } else if (ev.t === "guardado") {
            // Lo mismo para la respuesta: es lo que "Regenerar" reemplaza.
            const idRespuesta = String(ev.id ?? "");
            if (idRespuesta) {
              setMessages((m) =>
                m.map((x) => (x.id === idK ? { ...x, dbId: idRespuesta } : x)),
              );
            }
          } else if (ev.t === "error") {
            setBusy(false);
            const v = String(ev.v);
            setError(
              v === "cuota_dia"
                ? "err.cuotaDia"
                : v === "cuota_minuto"
                  ? "err.cuotaMinuto"
                : v === "cuota_agotada"
                ? "err.cuota"
                : v === "sobrecargado"
                  ? "err.sobrecargado"
                : v === "bloqueado"
                  ? "err.bloqueado"
                  : v === "clave_invalida"
                    ? "err.clave"
                    : "err.modelo",
            );
            if (ev.detalle) setDetalle(String(ev.detalle));
            if (ev.espera) setEspera(Number(ev.espera));
            if (v === "sin_creditos") setNoCredits(true);
          }
        }
      }
    } catch {
      setError("err.red");
    } finally {
      setBusy(false);
      // Si no queda nada por soltar se apaga ya; si queda, lo apaga el
      // propio bucle al vaciar la cola.
      cerrarFlujo();
    }
  };

  /* Reintentar solo tiene sentido si la última palabra la tienes tú: si
     Kairo llegó a escribir algo antes de fallar, volver a pedirlo dejaría
     dos respuestas a medias una detrás de otra. */
  const ultimo = messages[messages.length - 1];
  const puedeReintentar = Boolean(error) && !busy && ultimo?.role === "user" && !perfil.demo;

  const reintentar = () => {
    if (!puedeReintentar) return;
    pedir(messages, true);
  };

  const empty = messages.length === 0;

  /* El saludo lleva tu nombre, y cambia según quién seas: a quien ya
     tiene chats se le pregunta por dónde sigue; a quien llega hoy, en
     qué trabaja. Solo el nombre de pila: el apellido suena a carta del
     banco. */
  const pila = (perfil.nombre || "").trim().split(/\s+/)[0];
  const saludo = pila
    ? t(historial.length ? "app.greetingBack" : "app.greetingName").replace("{n}", pila)
    : t("app.greeting");

  return (
    <div className="flex h-full flex-col">
      <div ref={caja} onScroll={mirarPosicion} className="relative min-h-0 flex-1 overflow-y-auto">
        {cargando ? (
          <div className="grid h-full place-items-center">
            <Marca className="h-10 w-10 opacity-60" animada />
          </div>
        ) : empty ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-12">
            <Marca className="h-12 w-12" />
            <h1 className="mt-5 text-balance text-center text-[26px] font-semibold tracking-tight sm:text-[30px]">
              {saludo}
            </h1>
            <p className="mt-2 text-[14.5px] text-muted">{t("app.greetingSub")}</p>

            {mente && (
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-acento/40 bg-acento/10 px-3 py-1.5 text-[13px]">
                <span className="text-[15px] leading-none">{mente.emoji}</span>
                <span className="text-faint">{t("mente.talkingTo")}</span>
                <span className="font-medium">{mente.nombre}</span>
              </span>
            )}

            <div className="mt-9 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {CARDS.map((c) => {
                const Icon = c.icon;
                const inner = (
                  <>
                    <Icon className="h-5 w-5 text-acento" />
                    <span className="mt-2.5 block text-[13.5px] font-medium">{t(c.title)}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-faint">
                      {t(c.desc)}
                    </span>
                  </>
                );
                const cls =
                  "rounded-xl border border-line bg-panel p-3.5 text-left transition hover:border-line-hi hover:bg-panel-hi";

                return c.prompt ? (
                  <button key={c.title} className={cls} onClick={() => send(c.prompt![lang])}>
                    {inner}
                  </button>
                ) : (
                  <Link key={c.title} href={c.href ?? "/chat"} className={cls}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-7 px-4 py-8">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <UserMessage
                  key={m.id}
                  m={m}
                  puedeEditar={!busy && !escribiendo}
                  onEditar={(texto) => editar(m.id, texto)}
                />
              ) : (
                <KairoMessage
                  key={m.id}
                  m={m}
                  viva={m.id === escribiendo}
                  /* Regenerar solo la última: rehacer una de en medio
                     tiraría también todo lo que viniera después, y eso
                     no es lo que nadie espera de un botón que pone
                     "Regenerar". */
                  onRegenerar={
                    i === messages.length - 1 && !busy && !escribiendo
                      ? () => regenerar(m.id)
                      : undefined
                  }
                />
              ),
            )}

            {busy && <Pensando nivel={level} modelo={modelo} />}

            {error && (
              <div className="flex gap-3">
                <Marca className="mt-0.5 h-8 w-8 shrink-0" />
                <div className="rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2.5">
                  <p className="text-[14px] leading-relaxed text-gold">
                    {t(error)}
                    {espera ? ` ${t("err.espera").replace("{s}", String(espera))}` : ""}
                  </p>
                  {detalle && (
                    // Detalle técnico: te lo enseña para que puedas
                    // arreglarlo, porque de momento el único usuario eres tú.
                    <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-faint">
                      {detalle}
                    </p>
                  )}

                  {/* Tu pregunta ya está guardada, así que reintentar no la
                      duplica ni te obliga a volver a escribirla. */}
                  {puedeReintentar && (
                    <button
                      onClick={reintentar}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-gold/40 px-2.5 py-1.5 text-[12.5px] font-medium text-gold transition hover:bg-gold/10"
                    >
                      <Refresh className="h-3.5 w-3.5" />
                      {t("chat.retry")}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div ref={bottom} />
          </div>
        )}
      </div>

      <div className="pointer-events-none relative flex justify-center">
        {/* Solo aparece si te has ido hacia arriba: te devuelve al final
            sin tener que arrastrar media conversación. */}
        {!abajo && messages.length > 0 && (
          <button
            onClick={bajarDelTodo}
            title={t("chat.toBottom")}
            aria-label={t("chat.toBottom")}
            className="pointer-events-auto absolute bottom-0 right-4 grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-muted shadow-[var(--shadow)] transition hover:border-line-hi hover:text-fg"
          >
            <Chevron className="h-4 w-4" />
          </button>
        )}

        <span className="pointer-events-auto -mb-1 inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-[12px] text-muted shadow-[var(--shadow)]">
          <Bolt className="h-3 w-3 text-gold" />
          {credits.toLocaleString(lang)} {t("app.credits")}
        </span>
      </div>

      <Composer
        level={level}
        setLevel={setLevel}
        mente={mente}
        setMente={setMente}
        onSend={send}
        busy={busy}
      />

      {noCredits && <NoCreditsModal onClose={() => setNoCredits(false)} />}
    </div>
  );
}

/* Quita el formato de Markdown para que la voz no lea los asteriscos ni
   se ponga a deletrear un bloque de código entero. */
function paraLeer(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, ". Aquí hay un bloque de código. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\*\*|__|\*|_|~~/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\n{2,}/g, ". ")
    .trim();
}

/* Tu pregunta, con la posibilidad de arreglarla.
 *
 * Mandas la pregunta, la lees ya enviada y ves la errata: has escrito
 * otra cosa, y Kairo te está contestando a lo que escribiste. Hasta
 * ahora la única salida era volver a escribirla entera debajo y dejar
 * la conversación con las dos. Ahora se edita y se pregunta otra vez
 * desde ahí. */
function UserMessage({
  m,
  puedeEditar,
  onEditar,
}: {
  m: Message;
  puedeEditar: boolean;
  onEditar: (texto: string) => void;
}) {
  const { t, lang } = useUi();
  const original = pick(m.content, lang);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(original);
  const area = useRef<HTMLTextAreaElement>(null);

  /* Al abrir: el cursor al final (no al principio, que obliga a
     recorrer lo escrito) y la caja con la altura justa del texto. */
  useEffect(() => {
    const caja = area.current;
    if (!editando || !caja) return;
    caja.style.height = "auto";
    caja.style.height = `${caja.scrollHeight}px`;
    caja.focus();
    caja.setSelectionRange(caja.value.length, caja.value.length);
  }, [editando]);

  const abrir = () => {
    setTexto(original);
    setEditando(true);
  };

  const guardar = () => {
    setEditando(false);
    onEditar(texto);
  };

  if (editando) {
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-[90%] rounded-2xl border border-line-hi bg-panel p-2.5">
          <textarea
            ref={area}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") return setEditando(false);
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                guardar();
              }
            }}
            rows={1}
            className="block max-h-64 w-full resize-none bg-transparent px-1.5 text-[15px] leading-relaxed outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto pl-1.5 text-[11.5px] text-faint">{t("app.editHint")}</span>
            <button
              onClick={() => setEditando(false)}
              className="rounded-lg px-2.5 py-1 text-[12.5px] text-muted transition hover:text-fg"
            >
              {t("app.cancel")}
            </button>
            <button
              onClick={guardar}
              disabled={!texto.trim()}
              className="rounded-lg bg-acento px-2.5 py-1 text-[12.5px] font-medium text-on-accent transition hover:opacity-90 disabled:opacity-40"
            >
              {t("app.saveAsk")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-end gap-1.5">
      {puedeEditar && (
        <button
          onClick={abrir}
          title={t("app.edit")}
          aria-label={t("app.edit")}
          /* En el móvil no hay ratón por encima de nada, así que ahí se
             ve siempre, discreto. En el escritorio aparece al pasar. */
          className="mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint opacity-70 transition hover:bg-panel-hi hover:text-fg focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex max-w-[85%] flex-col items-end gap-1.5">
        {Boolean(m.adjuntos?.length) && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {m.adjuntos!.map((a, i) => (
              <span
                key={`${a.nombre}-${i}`}
                className="inline-flex max-w-[200px] items-center gap-1.5 rounded-xl border border-line bg-bg-soft py-1 pl-1 pr-2"
              >
                {esImagen(a.tipo) && a.datos ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${a.tipo};base64,${a.datos}`}
                    alt={a.nombre}
                    className="h-7 w-7 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line text-[9.5px] font-semibold text-faint">
                    {(a.nombre.split(".").pop() ?? "?").slice(0, 4).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[12px] leading-tight">{a.nombre}</span>
                  <span className="block text-[10.5px] leading-tight text-faint">
                    {tamano(a.bytes, lang)}
                  </span>
                </span>
              </span>
            ))}
          </div>
        )}

        {Boolean(original) && (
          <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-panel-hi px-4 py-2.5 text-[15px] leading-relaxed">
            {original}
          </p>
        )}
      </div>
    </div>
  );
}

function KairoMessage({
  m,
  viva = false,
  onRegenerar,
}: {
  m: Message;
  viva?: boolean;
  /** Solo la última respuesta se puede regenerar; a las demás no les
   *  llega esta función y no enseñan el botón. */
  onRegenerar?: () => void;
}) {
  const { t, lang } = useUi();
  const [copied, setCopied] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const texto = pick(m.content, lang);

  /* La voz la pone el navegador, no un servicio de pago: no cuesta nada
     y funciona sin conexión. Si el navegador no la trae, el botón no sale.
     Se comprueba después de pintar, no durante: preguntarlo al pintar da
     un HTML en el servidor y otro distinto en el navegador. */
  const [hayVoz, setHayVoz] = useState(false);

  useEffect(() => {
    setHayVoz(hayVozParaLeer());
    prepararVoces(); // las voces buenas tardan un instante en cargarse
    return () => callar(); // si te vas a media lectura, que no siga hablando
  }, []);

  const leer = () => {
    if (!hayVoz) return;
    if (leyendo) {
      callar();
      return setLeyendo(false);
    }
    setLeyendo(true);
    leerEnVozAlta(paraLeer(texto), lang, () => setLeyendo(false));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* portapapeles no disponible */
    }
  };

  return (
    <div className="flex gap-3">
      <Marca className="mt-0.5 h-8 w-8 shrink-0" animada={viva} />

      <div className="min-w-0 flex-1">
        <Markdown text={texto} />

        <Fuentes fuentes={m.fuentes} busquedas={m.busquedas} />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted transition hover:border-line-hi hover:text-fg"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("app.copied") : t("app.copy")}
          </button>
          {hayVoz && (
            <button
              onClick={leer}
              title={leyendo ? t("app.stopRead") : t("app.read")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px] transition ${
                leyendo
                  ? "border-acento/50 bg-acento/10 text-fg"
                  : "border-line text-muted hover:border-line-hi hover:text-fg"
              }`}
            >
              {leyendo ? <Stop className="h-3.5 w-3.5" /> : <Altavoz className="h-3.5 w-3.5" />}
              {leyendo ? t("app.stopRead") : t("app.read")}
            </button>
          )}

          {onRegenerar && (
            <button
              onClick={onRegenerar}
              title={t("app.regenWarn")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[12px] text-muted transition hover:border-line-hi hover:text-fg"
            >
              <Refresh className="h-3.5 w-3.5" />
              {t("app.regen")}
            </button>
          )}

          {m.model && m.model !== "demo" && (
            <span className="rounded-lg border border-line px-2 py-1 text-[11.5px] text-faint">
              {m.model}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoCreditsModal({ onClose }: { onClose: () => void }) {
  const { t } = useUi();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label={t("app.later")} />
      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-panel p-6 text-center shadow-[var(--shadow)]">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <Bolt className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold">{t("app.noCredits")}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{t("app.noCreditsSub")}</p>
        <div className="mt-6 space-y-2">
          <Link
            href="/precios"
            className="brand-grad block rounded-xl px-4 py-2.5 text-center text-[14px] font-semibold text-on-accent transition hover:opacity-90"
          >
            {t("app.upgrade")}
          </Link>
          <button
            onClick={onClose}
            className="block w-full rounded-xl px-4 py-2 text-[13.5px] text-faint transition hover:text-fg"
          >
            {t("app.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
