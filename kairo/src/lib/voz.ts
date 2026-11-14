"use client";

/* La voz del navegador, para hablarle y para que te lea.
 *
 * Todo lo de aquí lo trae el navegador de serie: ni servicios de pago ni
 * claves. Funciona en Chrome y en Edge; donde no esté, los botones no
 * aparecen en vez de aparecer y no hacer nada.
 */

// ---------------------------------------------------------------
// Escuchar por el micrófono
// ---------------------------------------------------------------

type Resultado = { transcript: string };
type Alternativas = { 0: Resultado; length: number; isFinal: boolean };
type EventoVoz = { resultIndex: number; results: { [i: number]: Alternativas; length: number } };

type Escucha = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EventoVoz) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type ConVoz = Window & {
  SpeechRecognition?: new () => Escucha;
  webkitSpeechRecognition?: new () => Escucha;
};

const Motor = () => {
  if (typeof window === "undefined") return undefined;
  const w = window as ConVoz;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export const hayMicrofono = () => Boolean(Motor());

/* Arranca el dictado.
 *
 * `onTexto` recibe SIEMPRE el dictado entero desde que empezaste, no el
 * trozo nuevo. Así quien lo use solo tiene que pintar lo que le llega, sin
 * ir pegando cachos: el navegador corrige lo que ya había dicho cuando
 * entiende mejor la frase, y pegando trozos saldrían palabras repetidas.
 */
export function escuchar(
  idioma: "es" | "en",
  onTexto: (texto: string, definitivo: boolean) => void,
  onFin: (motivo?: string) => void,
): (() => void) | null {
  const Motor_ = Motor();
  if (!Motor_) return null;

  const escucha = new Motor_();
  escucha.lang = idioma === "es" ? "es-ES" : "en-US";
  escucha.continuous = true;
  escucha.interimResults = true;

  let firme = "";

  escucha.onresult = (e) => {
    let provisional = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const trozo = e.results[i][0].transcript;
      if (e.results[i].isFinal) firme += trozo;
      else provisional += trozo;
    }
    onTexto((firme + provisional).trim(), provisional === "");
  };

  escucha.onerror = (e) => onFin(e?.error);
  escucha.onend = () => onFin();

  try {
    escucha.start();
  } catch {
    return null;
  }

  return () => {
    try {
      escucha.stop();
    } catch {
      /* ya estaba parada */
    }
  };
}

// ---------------------------------------------------------------
// Leer en voz alta
// ---------------------------------------------------------------

export const hayVozParaLeer = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

/* Las voces tardan un momento en cargarse y la primera vez getVoices()
   devuelve una lista vacía. Se guardan en cuanto aparecen. */
let vocesGuardadas: SpeechSynthesisVoice[] = [];

export function prepararVoces() {
  if (!hayVozParaLeer()) return;
  const recoger = () => {
    const v = window.speechSynthesis.getVoices();
    if (v.length) vocesGuardadas = v;
  };
  recoger();
  window.speechSynthesis.addEventListener("voiceschanged", recoger);
}

/* Elegir voz es la diferencia entre sonar a persona o a robot de los 90.
 *
 * El navegador, si no le dices nada, coge la primera de la lista, que
 * suele ser la vieja del sistema. Las buenas son las de Google: son las
 * mismas que usan sus propias aplicaciones, y se notan a la primera
 * sílaba. Por eso se buscan en este orden:
 *   1. Una de Google en tu idioma.
 *   2. Cualquiera que venga de la red (casi siempre mejores que las
 *      instaladas en el aparato).
 *   3. La que haya, antes que no leer.
 */
/* LA VOZ QUE HAS ELEGIDO TÚ (Ajustes → Voz para leer).
   Se guarda en este navegador: las voces son del aparato, y la que hay
   en tu móvil no tiene por qué existir en tu ordenador. */
const claveVoz = (idioma: "es" | "en") => `kairo-voz-${idioma}`;

export function vozElegida(idioma: "es" | "en"): string | null {
  try {
    return localStorage.getItem(claveVoz(idioma));
  } catch {
    return null;
  }
}

export function elegirVoz(idioma: "es" | "en", nombre: string | null) {
  try {
    if (nombre) localStorage.setItem(claveVoz(idioma), nombre);
    else localStorage.removeItem(claveVoz(idioma));
  } catch {
    /* sin almacenamiento: se usará la automática */
  }
}

/** Las voces de este navegador para un idioma, para elegir en Ajustes. */
export function vocesDe(idioma: "es" | "en"): SpeechSynthesisVoice[] {
  if (!vocesGuardadas.length && hayVozParaLeer()) {
    vocesGuardadas = window.speechSynthesis.getVoices();
  }
  const prefijo = idioma === "es" ? "es" : "en";
  return vocesGuardadas.filter((v) => v.lang?.toLowerCase().startsWith(prefijo));
}

export function mejorVoz(idioma: "es" | "en"): SpeechSynthesisVoice | null {
  const delIdioma = vocesDe(idioma);
  if (!delIdioma.length) return null;

  const elegida = vozElegida(idioma);
  const tuya = elegida ? delIdioma.find((v) => v.name === elegida) : undefined;
  if (tuya && (idioma !== "es" || /^es[-_]ES$/i.test(tuya.lang))) return tuya;

  /* Español DE ESPAÑA primero: Chrome trae también "Google español de
     Estados Unidos", y si se cuela esa suena sudamericana. */
  const deEspana = delIdioma.filter((v) => /^es[-_]ES$/i.test(v.lang));
  const buena = (lista: SpeechSynthesisVoice[]) =>
    lista.find((v) => /google/i.test(v.name)) ??
    lista.find((v) => v.localService === false) ??
    lista.find((v) => /natural|neural|premium|enhanced/i.test(v.name));
  if (idioma === "es") {
    const espanola = buena(deEspana) ?? deEspana[0];
    if (espanola) return espanola;
  }

  return (
    delIdioma.find((v) => /google/i.test(v.name)) ??
    delIdioma.find((v) => v.localService === false) ??
    delIdioma.find((v) => /natural|neural|premium|enhanced/i.test(v.name)) ??
    delIdioma[0]
  );
}

/* Chrome tiene una manía vieja: si le mandas un texto largo, se calla a
   los quince segundos y te deja la frase a medias. El apaño conocido es
   partirlo en trozos cortos y darle un empujón cada poco. */
export function trocear(texto: string, max = 200): string[] {
  const frases = texto.match(/[^.!?…\n]+[.!?…]*\s*/g) ?? [texto];
  const trozos: string[] = [];
  let actual = "";

  for (const frase of frases) {
    if ((actual + frase).length > max && actual) {
      trozos.push(actual.trim());
      actual = "";
    }
    actual += frase;
  }
  if (actual.trim()) trozos.push(actual.trim());

  return trozos.filter(Boolean);
}

let empujon: number | undefined;
/* Cada lectura tiene su número. PARAR NO PARABA por esto: `cancel()`
   corta la frase que suena, pero el navegador lo cuenta como "frase
   terminada" y dispara su `onend`/`onerror`, que leía LA SIGUIENTE. Con
   el número, una lectura cancelada sabe que ya no es la de ahora y no
   sigue. */
let lectura = 0;

/* LA VOZ DE KAIRO: una de Gemini (masculina, joven, natural), la que
   suena como cuando Gemini te lee algo. Si no llega —sin cuota, sin red,
   modo demo—, se lee con la voz del navegador, como antes. */
let sonando: HTMLAudioElement | null = null;

/* Si Gemini no ha podido (sin cuota, sin red), no se le vuelve a
   preguntar en un rato: así el siguiente "Leer" suena al instante con la
   voz del navegador en vez de quedarse unos segundos callado. */
let sinVozHasta = 0;
const ESPERA_VOZ = 8000;

/** Pide a Kairo el audio de un trozo con esa voz. null si no se puede. */
export async function audioDe(texto: string, espera = ESPERA_VOZ): Promise<string | null> {
  if (Date.now() < sinVozHasta) return null;
  const corte = new AbortController();
  const reloj = window.setTimeout(() => corte.abort(), espera);
  try {
    const r = await fetch("/api/voz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texto }),
      signal: corte.signal,
    });
    if (!r.ok) throw new Error(String(r.status));
    const blob = await r.blob();
    if (!blob.size) throw new Error("vacío");
    return URL.createObjectURL(blob);
  } catch {
    sinVozHasta = Date.now() + 10 * 60_000;
    return null;
  } finally {
    window.clearTimeout(reloj);
  }
}

export function callar() {
  lectura++;
  if (sonando) {
    sonando.pause();
    sonando = null;
  }
  if (!hayVozParaLeer()) return;
  window.clearInterval(empujon);
  empujon = undefined;
  window.speechSynthesis.cancel();
}

async function leerConKairo(trozos: string[], idioma: "es" | "en", alTerminar: () => void) {
  const esta = lectura;
  let siguiente = audioDe(trozos[0]);
  for (let i = 0; i < trozos.length; i++) {
    const url = await siguiente;
    if (esta !== lectura) return;
    if (!url) return leerConNavegador(trozos.slice(i).join(" "), idioma, alTerminar);
    if (i + 1 < trozos.length) siguiente = audioDe(trozos[i + 1], 25_000);
    const audio = new Audio(url);
    sonando = audio;
    const ok = await new Promise<boolean>((fin) => {
      audio.onended = () => fin(true);
      audio.onerror = () => fin(false);
      audio.play().catch(() => fin(false));
    });
    URL.revokeObjectURL(url);
    if (esta !== lectura) return;
    if (!ok) return leerConNavegador(trozos.slice(i).join(" "), idioma, alTerminar);
  }
  sonando = null;
  alTerminar();
}

export function leerEnVozAlta(texto: string, idioma: "es" | "en", alTerminar: () => void) {
  if (!texto.trim()) return alTerminar();
  callar();
  /* El primer trozo, corto: cuanto menos texto, antes lo tiene Gemini y
     antes empieza a sonar. Los demás, largos, se preparan mientras. */
  const [primero, ...resto] = trocear(texto, 220);
  void leerConKairo([primero, ...trocear(resto.join(" "), 600)].filter(Boolean), idioma, alTerminar);
}

function leerConNavegador(texto: string, idioma: "es" | "en", alTerminar: () => void) {
  if (!hayVozParaLeer() || !texto.trim()) return alTerminar();
  const esta = lectura;

  const voz = mejorVoz(idioma);
  const trozos = trocear(texto);
  let i = 0;

  const siguiente = () => {
    // La han parado (o ha empezado otra): no se lee nada más.
    if (esta !== lectura) return;
    if (i >= trozos.length) {
      window.clearInterval(empujon);
      empujon = undefined;
      return alTerminar();
    }

    const frase = new SpeechSynthesisUtterance(trozos[i++]);
    if (voz) frase.voice = voz;
    frase.lang = voz?.lang ?? (idioma === "es" ? "es-ES" : "en-US");
    // Un pelín más rápido que por defecto: leído a 1.0 suena a dictado.
    frase.rate = 1.04;
    frase.pitch = 1;
    frase.onend = siguiente;
    frase.onerror = siguiente;
    window.speechSynthesis.speak(frase);
  };

  // El empujón contra el bug de los quince segundos.
  empujon = window.setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10_000);

  siguiente();
}
