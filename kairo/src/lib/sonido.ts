"use client";

/* Los dos pitidos del micrófono.
 *
 * Sin archivos de sonido y sin descargar nada: el navegador sabe
 * fabricar un tono. Dos notas cortas y bajitas, una subiendo al abrir y
 * bajando al cerrar, que es lo que hace que sepas si te está oyendo sin
 * tener que mirar la pantalla —que es justo para lo que sirve dictar—.
 *
 * Tres cosas que lo hacen soportable:
 *  - Se puede apagar (Ajustes → Idioma y apariencia).
 *  - Es corto y flojo: 0,2 segundos y a un diez por ciento del volumen.
 *  - Si algo falla, no falla nada: el botón sigue funcionando igual.
 */

const RECUERDO = "kairo.sonido";

/** ¿Están los pitidos encendidos? Por defecto, sí. */
export function haySonido(): boolean {
  try {
    return localStorage.getItem(RECUERDO) !== "0";
  } catch {
    // Ventana privada o cookies bloqueadas: que suene, que es lo normal.
    return true;
  }
}

export function ponerSonido(encendido: boolean) {
  try {
    localStorage.setItem(RECUERDO, encendido ? "1" : "0");
  } catch {
    /* no se puede recordar: vale para esta sesión y ya está */
  }
}

/* El navegador no deja crear audio hasta que el usuario ha tocado algo.
   Como esto siempre sale de un clic en el micro, llega tarde y bien; se
   guarda entre pitidos porque abrir uno nuevo cada vez acaba petando. */
let contexto: AudioContext | null = null;

function motor(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Constructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return null;

    contexto ??= new Constructor();
    // Si el navegador lo había dormido, se despierta.
    if (contexto.state === "suspended") void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

/** Un pitido de dos notas: hacia arriba al empezar, hacia abajo al acabar. */
export function pitido(cual: "empieza" | "termina") {
  if (!haySonido()) return;

  const audio = motor();
  if (!audio) return;

  try {
    const notas = cual === "empieza" ? [660, 990] : [880, 587];
    const inicio = audio.currentTime;

    notas.forEach((frecuencia, i) => {
      const onda = audio.createOscillator();
      const volumen = audio.createGain();

      onda.type = "sine";
      onda.frequency.value = frecuencia;

      const t = inicio + i * 0.085;
      /* La subida y la bajada son lo que evita el chasquido: un tono que
         empieza de golpe suena a error, no a aviso. */
      volumen.gain.setValueAtTime(0.0001, t);
      volumen.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
      volumen.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      onda.connect(volumen).connect(audio.destination);
      onda.start(t);
      onda.stop(t + 0.09);
    });
  } catch {
    /* sin sonido; lo importante del botón no era el pitido */
  }
}
