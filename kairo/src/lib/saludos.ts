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

/* "¿Por dónde seguimos?" vale a cualquier hora del día, así que es la
   misma línea en los tres tramos despiertos. De madrugada no: ahí la
   segunda es la que reconoce la hora que es. */
const SEGUIMOS: Saludo = { es: "¿Por dónde seguimos, {n}?", en: "Where were we, {n}?", vuelta: true };

const SALUDOS: Record<Tramo, Saludo[]> = {
  madrugada: [
    { es: "Buenas noches, {n}.", en: "Good night, {n}." },
    { es: "¿Trasnochando, {n}?", en: "Still up, {n}?" },
  ],
  manana: [{ es: "Buenos días, {n}.", en: "Good morning, {n}." }, SEGUIMOS],
  tarde: [{ es: "Buenas tardes, {n}.", en: "Good afternoon, {n}." }, SEGUIMOS],
  noche: [{ es: "Buenas noches, {n}.", en: "Good evening, {n}." }, SEGUIMOS],
};

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
  const lista = SALUDOS[tramoDe(ahora.getHours())].filter((s) => vuelve || !s.vuelta);
  const elegido = lista[Math.floor(Math.random() * lista.length)];
  const texto = lang === "en" ? elegido.en : elegido.es;
  return nombre ? texto.replace("{n}", nombre) : texto.replace(/,?\s*\{n\}/, "");
}
