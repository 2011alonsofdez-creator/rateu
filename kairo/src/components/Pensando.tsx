"use client";

import { useEffect, useState } from "react";
import { useUi, type TKey } from "@/lib/i18n";
import { LEVELS, type Level } from "@/lib/mock";
import { Marca } from "./Logo";
import { IconoNivel } from "./IconoNivel";

/* Lo que se ve mientras la IA trabaja.
   Dos cosas a la vez: qué está haciendo, y con qué cerebro. Esa etiqueta
   es el recordatorio constante de por qué Kairo no es un chat más. */

const FASES: Record<Level, TKey[]> = {
  fast: ["pensar.pensando"],
  normal: ["pensar.leyendo", "pensar.pensando", "pensar.redactando"],
  forja: ["pensar.analizando", "pensar.forjando", "pensar.verificando", "pensar.redactando"],
  /* MEGA no adivina por dónde va: el servidor lo dice (`paso`), porque
     es el único que sabe si está esperando a los modelos o juntando lo
     que han escrito. Esto es solo el primer segundo, hasta que llega el
     primer aviso. */
  mega: ["pensar.profundizando"],
};

/* Lo que se enseña en cada paso del Mega-Prompt. Comparar y combinar es
   una sola espera —la del modelo que escribe la respuesta final—, así
   que van juntos y se van pasando solos. */
const PASOS: Record<"consultando" | "comparando", TKey[]> = {
  consultando: ["pensar.consultando"],
  comparando: ["pensar.comparando", "pensar.combinando"],
};

/** Color del punto según la familia del modelo. */
function colorModelo(modelo: string) {
  const m = modelo.toLowerCase();
  if (m.includes("claude")) return "var(--acento)";
  if (m.includes("gpt")) return "var(--green)";
  if (m.includes("gemini")) return "var(--gold)";
  return "var(--muted)";
}

/* LOS TRES PUNTOS DE KAIRO.
 *
 * Cada poco se elige una figura al azar —nunca la misma dos veces
 * seguidas— y qué punto va a qué sitio también al azar, así que no hay
 * una secuencia que se pueda adivinar. Entre las figuras está el
 * triángulo de los tres anillos de la marca y el punto del centro (los
 * tres juntos): es lo que lo hace de Kairo y no de otro. */
type Sitio = [x: number, y: number, escala: number];

const FIGURAS: { nombre: string; sitios: Sitio[]; salta?: boolean }[] = [
  { nombre: "fila", sitios: [[-8, 0, 1], [0, 0, 1], [8, 0, 1]] },
  { nombre: "salto", sitios: [[-8, 0, 1], [0, 0, 1], [8, 0, 1]], salta: true },
  { nombre: "marca", sitios: [[0, -6, 1.15], [-5.5, 4, 1], [5.5, 4, 1]] },
  { nombre: "juntos", sitios: [[0, 0, 1.6], [0, 0, 0.7], [0, 0, 1]] },
  { nombre: "diagonal", sitios: [[-7, 5, 0.85], [0, 0, 1.1], [7, -5, 0.85]] },
  { nombre: "arco", sitios: [[-7, 3, 1], [0, -5, 1.2], [7, 3, 1]] },
  { nombre: "pareja", sitios: [[-6, 0, 1.2], [-2, 0, 0.8], [8, -3, 1]] },
];

const COLORES = ["var(--acento)", "#ff6219", "var(--acento-2)"];

function barajar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function PuntosKairo() {
  const [figura, setFigura] = useState(0);
  const [orden, setOrden] = useState([0, 1, 2]);

  useEffect(() => {
    const lento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let reloj = 0;
    let anterior = 0;
    const siguiente = () => {
      let n = anterior;
      while (n === anterior) n = Math.floor(Math.random() * FIGURAS.length);
      anterior = n;
      setFigura(n);
      setOrden(barajar([0, 1, 2]));
      /* Unas veces cambia rápido y otras se queda un poco: también eso
         lo hace menos previsible. */
      const espera = (FIGURAS[n].salta ? 1300 : 650 + Math.random() * 650) * (lento ? 2 : 1);
      reloj = window.setTimeout(siguiente, espera);
    };
    reloj = window.setTimeout(siguiente, 500);
    return () => window.clearTimeout(reloj);
  }, []);

  const actual = FIGURAS[figura];
  return (
    <span
      className={`kairo-puntos relative block h-8 w-8 shrink-0 ${actual.salta ? "salta" : ""}`}
      aria-hidden
    >
      {COLORES.map((color, punto) => {
        const [x, y, escala] = actual.sitios[orden[punto]];
        return (
          <span key={punto} style={{ transform: `translate(${x}px, ${y}px) scale(${escala})` }}>
            <i style={{ background: color }} />
          </span>
        );
      })}
    </span>
  );
}

export function Pensando({
  nivel,
  modelo,
  buscando = false,
  paso = null,
  elegido,
  fases: fasesPropias,
  girando = false,
  puntos = false,
}: {
  nivel: Level;
  /** Nombre del modelo que está respondiendo. Llega del servidor. */
  modelo?: string;
  /** Está buscando en internet antes de contestar. */
  buscando?: boolean;
  /** En qué punto va el Mega-Prompt, si es un Mega-Prompt. */
  paso?: "consultando" | "comparando" | null;
  /** El nivel que ha elegido Kairo solo. Sin esto, no se enseña nada:
   *  decirte "Normal" cuando lo has puesto tú es ruido. */
  elegido?: Level;
  /** Otras frases en vez de las del nivel. Las de aquí hablan de
   *  responder —leyendo, pensando, redactando— y hay pantallas que no
   *  responden: Code escribe un archivo, y "redactando" ahí no dice
   *  nada de lo que está pasando. */
  fases?: TKey[];
  /** Que la marca además gire. Para esperas largas: ver abajo. */
  girando?: boolean;
  /** Tres puntos que saltan en vez de la marca. */
  puntos?: boolean;
}) {
  const { t } = useUi();
  /* Buscar es lo único que no se adivina: si está buscando, se dice, y
     no se va pasando de fase como si estuviera pensando. */
  const fases = fasesPropias
    ? fasesPropias
    : buscando
      ? (["pensar.buscando"] as TKey[])
      : paso
        ? PASOS[paso]
        : FASES[nivel];
  const [i, setI] = useState(0);

  /* Va pasando de fase mientras espera. Se queda en la última.
 
     El reloj se rearma por el CONTENIDO de la lista y no por la lista,
     porque quien llama puede escribirla ahí mismo —`fases={[...]}`— y
     entonces es un array nuevo en cada pintada: el efecto se repetiría
     sin parar, volviendo a poner `i` a cero, y la frase no pasaría de la
     primera nunca. */
  const clave = fases.join("|");
  useEffect(() => {
    setI(0);
    const lista = clave.split("|");
    if (lista.length < 2) return;
    const id = window.setInterval(
      () => setI((v) => (v + 1 < lista.length ? v + 1 : v)),
      1900,
    );
    return () => window.clearInterval(id);
  }, [clave]);

  return (
    <div className="flex gap-3">
      {puntos ? (
        <PuntosKairo />
      ) : (
        <Marca className="mt-0.5 h-8 w-8 shrink-0" animada girando={girando} />
      )}

      <div className={puntos ? "flex min-h-8 flex-col justify-center" : "pt-1"}>
        <span className="texto-brillo text-[15px] font-medium">
          {t(fases[i])}…
        </span>

        {(modelo || elegido) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {elegido && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] text-muted">
                <IconoNivel nivel={elegido} className="h-3 w-3" style={{ color: LEVELS[elegido].color }} />
                {t(`app.${elegido}`)}
                <span className="text-faint">{t("app.autoPicked")}</span>
              </span>
            )}
            {modelo && (
              <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[12px] text-muted">
                <i
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: colorModelo(modelo) }}
                />
                {modelo}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
