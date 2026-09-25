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
export function mejorVoz(idioma: "es" | "en"): SpeechSynthesisVoice | null {
  if (!vocesGuardadas.length && hayVozParaLeer()) {
    vocesGuardadas = window.speechSynthesis.getVoices();
  }

  const prefijo = idioma === "es" ? "es" : "en";
  const delIdioma = vocesGuardadas.filter((v) => v.lang?.toLowerCase().startsWith(prefijo));
  if (!delIdioma.length) return null;

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

export function callar() {
  if (!hayVozParaLeer()) return;
  window.clearInterval(empujon);
  empujon = undefined;
  window.speechSynthesis.cancel();
}

export function leerEnVozAlta(texto: string, idioma: "es" | "en", alTerminar: () => void) {
  if (!hayVozParaLeer() || !texto.trim()) return alTerminar();

  callar();

  const voz = mejorVoz(idioma);
  const trozos = trocear(texto);
  let i = 0;

  const siguiente = () => {
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
