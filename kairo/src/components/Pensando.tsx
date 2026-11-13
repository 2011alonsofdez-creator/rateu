"use client";

import { useEffect, useRef, useState } from "react";
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
  { nombre: "diagonal2", sitios: [[-7, -5, 0.85], [0, 0, 1.1], [7, 5, 0.85]] },
  { nombre: "marca2", sitios: [[0, 6, 1.15], [-5.5, -4, 1], [5.5, -4, 1]] },
];

/* Las seis formas de repartir tres puntos entre tres sitios. */
const REPARTOS = [
  [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
];

const COLORES = ["var(--acento)", "#ff6219", "var(--acento-2)"];

/* A qué sitio va cada punto: al que le pille más cerca. Si se reparten
   al azar, se cruzan en línea recta y parece un fallo. Así el orden
   solo cambia cuando se juntan y se vuelven a separar (ahí todos los
   repartos están igual de cerca y se elige uno al azar). */
function repartir(desde: Sitio[], hacia: Sitio[]): number[] {
  let mejor = REPARTOS[0];
  let menor = Infinity;
  for (const r of [...REPARTOS].sort(() => Math.random() - 0.5)) {
    let d = 0;
    for (let p = 0; p < 3; p++) {
      const [x1, y1] = desde[p];
      const [x2, y2] = hacia[r[p]];
      d += (x1 - x2) ** 2 + (y1 - y2) ** 2;
    }
    if (d < menor - 0.01) {
      menor = d;
      mejor = r;
    }
  }
  return mejor;
}

/* QUÉ HACEN LOS PUNTOS EN CADA ETAPA. Cada etapa tiene su baile, así
   se ve por dónde va sin leer: al arrancar saltan, montando la pantalla
   giran en el triángulo de la marca, con la lógica se juntan y se
   separan, y al final se cierran en el punto del centro. Dentro de cada
   etapa, la figura sigue saliendo al azar entre las suyas. */
export type EtapaPuntos =
  | "piensa"
  | "empieza"
  | "estilo"
  | "pantalla"
  | "logica"
  | "casi"
  | "arreglando"
  | "libre";

const BAILES: Record<EtapaPuntos, string[]> = {
  piensa: ["salto"], // saltan sin parar
  empieza: ["fila", "arco", "salto"],
  estilo: ["arco", "diagonal", "diagonal2"],
  pantalla: ["marca", "marca2"],
  logica: ["juntos", "fila", "juntos", "diagonal"],
  casi: ["marca", "juntos"],
  arreglando: ["diagonal", "diagonal2", "juntos"],
  libre: FIGURAS.map((f) => f.nombre),
};

const indice = (nombre: string) => FIGURAS.findIndex((f) => f.nombre === nombre);

function PuntosKairo({ etapa = "libre" }: { etapa?: EtapaPuntos }) {
  const [figura, setFigura] = useState(0);
  const [orden, setOrden] = useState([0, 1, 2]);
  /* Dónde está cada punto ahora. Va en una ref para que, al cambiar de
     etapa, el siguiente movimiento salga de donde están y no de cero. */
  const donde = useRef<Sitio[]>(FIGURAS[0].sitios);
  const siempreSalta = etapa === "piensa";

  useEffect(() => {
    const lento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lista = (BAILES[etapa] ?? BAILES.libre).map(indice).filter((i) => i >= 0);
    let reloj = 0;
    let anterior = -1;

    const ir = (n: number) => {
      const nuevo = repartir(donde.current, FIGURAS[n].sitios);
      donde.current = nuevo.map((i) => FIGURAS[n].sitios[i]);
      setFigura(n);
      setOrden(nuevo);
    };

    /* Saltando sin parar no hay nada que elegir: a la fila y a botar. */
    if (siempreSalta) {
      ir(indice("salto"));
      return;
    }

    const siguiente = () => {
      let n = lista[Math.floor(Math.random() * lista.length)];
      if (lista.length > 1) {
        while (n === anterior) n = lista[Math.floor(Math.random() * lista.length)];
      }
      anterior = n;
      ir(n);
      /* El salto dura lo que dura (dos botes y el desfase del tercero:
         1,34 s) y no se le corta a medias, que daba un tirón. El resto
         se queda entre 0,7 y 1,4 s: también eso lo hace menos
         previsible. */
      const espera = (FIGURAS[n].salta ? 1500 : 700 + Math.random() * 700) * (lento ? 2 : 1);
      reloj = window.setTimeout(siguiente, espera);
    };
    siguiente();
    return () => window.clearTimeout(reloj);
  }, [etapa, siempreSalta]);

  const actual = FIGURAS[figura];
  return (
    <span
      className={`kairo-puntos relative block h-8 w-8 shrink-0 ${
        siempreSalta ? "salta-siempre" : actual.salta ? "salta" : ""
      }`}
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
  etapa,
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
  /** En qué etapa va, para que los puntos bailen según eso. */
  etapa?: EtapaPuntos;
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
        <PuntosKairo etapa={etapa} />
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
