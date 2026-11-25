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
  { es: "¿Seguimos, {n}?", en: "Shall we continue, {n}?", vuelta: true },
  { es: "De vuelta, {n}.", en: "Welcome back, {n}.", vuelta: true },
];

/* CORTOS a propósito: van encima de la caja de texto y una frase larga
   se parte en dos líneas y empuja la caja. Tres o cuatro palabras y el
   nombre. Algunos solo valen en un trozo del tramo (`desde`/`hasta`). */
type ConHora = Saludo & { desde?: number; hasta?: number };

const SALUDOS: Record<Tramo, ConHora[]> = {
  madrugada: [
    { es: "Buenas noches, {n}.", en: "Good night, {n}." },
    { es: "¿Trasnochando, {n}?", en: "Still up, {n}?" },
    { es: "¿Sin sueño, {n}?", en: "Can't sleep, {n}?" },
    { es: "Noche larga, {n}.", en: "Long night, {n}." },
    { es: "¿Madrugando, {n}?", en: "Up early, {n}?", desde: 4 },
  ],
  manana: [
    { es: "Buenos días, {n}.", en: "Good morning, {n}." },
    { es: "¿Ya despierto, {n}?", en: "Up already, {n}?", hasta: 8 },
    { es: "¿Café y a ello, {n}?", en: "Coffee time, {n}?", hasta: 10 },
    { es: "¿Qué toca hoy, {n}?", en: "What's on today, {n}?" },
    { es: "Buena mañana, {n}.", en: "Good morning, {n}." },
    { es: "Casi hora de comer, {n}.", en: "Almost lunchtime, {n}.", desde: 13 },
  ],
  tarde: [
    { es: "Buenas tardes, {n}.", en: "Good afternoon, {n}." },
    { es: "¿Qué tal la sobremesa, {n}?", en: "Good lunch, {n}?", hasta: 16 },
    { es: "¿Qué hacemos, {n}?", en: "What are we doing, {n}?" },
    { es: "¿Qué tal el día, {n}?", en: "How's your day, {n}?" },
  ],
  noche: [
    { es: "Buenas noches, {n}.", en: "Good evening, {n}." },
    { es: "¿Qué tal el día, {n}?", en: "How was your day, {n}?" },
    { es: "¿Lo último del día, {n}?", en: "One last thing, {n}?" },
    { es: "Noche tranquila, {n}.", en: "Quiet evening, {n}." },
  ],
};

/* Y unas pocas según el día. */
const POR_DIA: Record<number, ConHora[]> = {
  1: [{ es: "Lunes otra vez, {n}.", en: "Monday again, {n}.", desde: 6, hasta: 20 }],
  5: [{ es: "¡Por fin viernes, {n}!", en: "Finally Friday, {n}!", desde: 6 }],
  6: [{ es: "Buen sábado, {n}.", en: "Happy Saturday, {n}.", desde: 8 }],
  0: [{ es: "Buen domingo, {n}.", en: "Happy Sunday, {n}.", desde: 8 }],
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
