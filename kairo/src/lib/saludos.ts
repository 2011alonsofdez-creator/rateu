import type { Lang } from "./i18n";

/* EL SALUDO DE LA PORTADA.
 *
 * Era una frase fija. Una frase fija que ves veinte veces al día deja de
 * leerse a la semana: está ahí, pero ya no dice nada. Así que cambia con
 * la hora, y dentro de la hora hay dos y sale una.
 *
 * Y nada más. Son cuatro frases en total, no veinte: el saludo no es el
 * contenido de esta pantalla —lo es la caja que tiene debajo— y una
 * frase ingeniosa distinta cada vez acaba cansando antes que la fija.
 */

export type Saludo = {
  es: string;
  en: string;
  /* Solo para quien ya tiene chats. "¿Por dónde seguimos?" a alguien que
     acaba de registrarse le suena a que se ha perdido algo que no ha
     pasado. */
  vuelta?: boolean;
};

export type Tramo = "madrugada" | "manana" | "tarde" | "noche";

/* Los tramos son los de la calle, no los de un reloj partido en cuatro:
   en España se come a las dos y a partir de ahí son tardes, la noche
   empieza cuando se cena, y trasnochar no es quedarse hasta las once. */
export function tramoDe(hora: number): Tramo {
  if (hora < 6) return "madrugada";
  if (hora < 14) return "manana";
  if (hora < 21) return "tarde";
  return "noche";
}

/* "¿Por dónde seguimos?" y compañía: solo para quien ya tiene chats. */
const VUELTA: Saludo[] = [
  { es: "¿Por dónde seguimos, {n}?", en: "Where were we, {n}?", vuelta: true },
  { es: "¿Seguimos con lo de antes, {n}?", en: "Shall we pick up where we left off, {n}?", vuelta: true },
  { es: "Otra vez por aquí, {n}. ¿Qué toca?", en: "Back again, {n}. What's next?", vuelta: true },
];

/* Cada tramo tiene varias para que no salga siempre la misma, y algunas
   solo valen en un trozo concreto del tramo (`desde`/`hasta`, en horas):
   "¿Ya despierto?" a las 7, no a la una; "la sobremesa" después de comer. */
type ConHora = Saludo & { desde?: number; hasta?: number };

const SALUDOS: Record<Tramo, ConHora[]> = {
  madrugada: [
    { es: "Buenas noches, {n}.", en: "Good night, {n}." },
    { es: "¿Trasnochando, {n}?", en: "Still up, {n}?" },
    { es: "A estas horas solo quedamos tú y yo, {n}.", en: "Just you and me at this hour, {n}." },
    { es: "¿No puedes dormir, {n}?", en: "Can't sleep, {n}?" },
    { es: "Noche larga, ¿eh, {n}?", en: "Long night, huh, {n}?" },
    { es: "¿Madrugando o sin dormir, {n}?", en: "Early riser or no sleep yet, {n}?", desde: 4 },
  ],
  manana: [
    { es: "Buenos días, {n}.", en: "Good morning, {n}." },
    { es: "¿Ya despierto, {n}?", en: "Up already, {n}?", hasta: 8 },
    { es: "Buenos días, {n}. ¿Café y a ello?", en: "Morning, {n}. Coffee and let's go?", hasta: 10 },
    { es: "Arrancamos el día, {n}.", en: "Let's get the day going, {n}.", hasta: 11 },
    { es: "¿Qué hay para hoy, {n}?", en: "What's on today, {n}?" },
    { es: "Buena mañana, {n}. ¿En qué te echo una mano?", en: "Good morning, {n}. How can I help?" },
    { es: "Casi la hora de comer, {n}.", en: "Almost lunchtime, {n}.", desde: 13 },
  ],
  tarde: [
    { es: "Buenas tardes, {n}.", en: "Good afternoon, {n}." },
    { es: "¿Qué tal la sobremesa, {n}?", en: "How's the afternoon going, {n}?", hasta: 16 },
    { es: "Buenas tardes, {n}. ¿Qué hacemos?", en: "Good afternoon, {n}. What are we doing?" },
    { es: "La tarde da para mucho, {n}.", en: "Plenty of afternoon left, {n}." },
    { es: "¿Qué tal va el día, {n}?", en: "How's the day going, {n}?" },
    { es: "Ya queda menos para la cena, {n}.", en: "Not long till dinner, {n}.", desde: 19 },
  ],
  noche: [
    { es: "Buenas noches, {n}.", en: "Good evening, {n}." },
    { es: "¿Qué tal ha ido el día, {n}?", en: "How did the day go, {n}?" },
    { es: "¿Última cosa del día, {n}?", en: "One last thing for today, {n}?" },
    { es: "Noche tranquila, {n}. ¿Qué necesitas?", en: "Quiet evening, {n}. What do you need?" },
    { es: "Antes de dormir, ¿qué te ayudo, {n}?", en: "Before bed, what can I help with, {n}?", desde: 23 },
  ],
};

/* Y unas pocas según el día: el lunes pesa, el viernes alegra, y el
   fin de semana no es para hablar de trabajo. */
const POR_DIA: Record<number, ConHora[]> = {
  1: [{ es: "Lunes otra vez, {n}. Vamos a por ello.", en: "Monday again, {n}. Let's go.", desde: 6, hasta: 20 }],
  5: [
    { es: "¡Por fin viernes, {n}!", en: "Finally Friday, {n}!", desde: 6 },
    { es: "Viernes, {n}. ¿Planes para el finde?", en: "Friday, {n}. Weekend plans?", desde: 14 },
  ],
  6: [{ es: "Buen sábado, {n}.", en: "Happy Saturday, {n}.", desde: 8 }],
  0: [
    { es: "Domingo tranquilo, {n}.", en: "Easy Sunday, {n}.", desde: 8 },
    { es: "Domingo, {n}. ¿Preparamos la semana?", en: "Sunday, {n}. Shall we plan the week?", desde: 17 },
  ],
};

const valeAhora = (s: ConHora, hora: number) =>
  (s.desde === undefined || hora >= s.desde) && (s.hasta === undefined || hora <= s.hasta);

/** Los saludos de un tramo. Para las pruebas. */
export function saludosDe(tramo: Tramo): Saludo[] {
  return SALUDOS[tramo];
}

/**
 * El saludo de esta vez: uno de los dos que valen a esta hora.
 *
 * Sin nombre no se queda cojo: "Buenos días, {n}." se convierte en
 * "Buenos días.", no en "Buenos días, ." — por eso se quita también la
 * coma que lo trae.
 */
export function saludarA(
  nombre: string,
  vuelve: boolean,
  lang: Lang,
  ahora: Date = new Date(),
): string {
  const hora = ahora.getHours();
  const tramo = tramoDe(hora);
  const lista = [
    ...SALUDOS[tramo],
    ...(POR_DIA[ahora.getDay()] ?? []),
    // "¿Por dónde seguimos?" no a las 3 de la mañana.
    ...(tramo === "madrugada" ? [] : VUELTA),
  ].filter((s) => valeAhora(s, hora) && (vuelve || !s.vuelta));
  const elegido = lista[Math.floor(Math.random() * lista.length)];
  const texto = lang === "en" ? elegido.en : elegido.es;
  return nombre ? texto.replace("{n}", nombre) : texto.replace(/,?\s*\{n\}/, "");
}
