import type { Lang } from "./i18n";

/* EL SALUDO DE LA PORTADA.
 *
 * Era una frase fija. Una frase fija que ves veinte veces al día deja de
 * leerse a la semana: está ahí, pero ya no dice nada.
 *
 * Así que cambia, y cambia por dos cosas a la vez. Por la hora, porque
 * "buenos días" a las tres de la madrugada es un saludo escrito por
 * alguien que no estaba; y al azar dentro del tramo, para que dos
 * mañanas seguidas no sean la misma mañana.
 *
 * Cortas a propósito. El saludo no es el contenido de la pantalla: lo es
 * la caja que tiene debajo. Una línea de dos palabras se lee sin querer;
 * una de quince hay que leerla, y para eso no has abierto Kairo.
 */

export type Saludo = {
  es: string;
  en: string;
  /* Solo para quien ya tiene chats. "¿Seguimos?" a alguien que acaba de
     registrarse le suena a que se ha perdido algo que no ha pasado. */
  vuelta?: boolean;
};

export type Tramo = "madrugada" | "manana" | "tarde" | "noche";

/* Los tramos son los de la calle, no los del reloj de 24 horas partido
   en cuatro: a las 13:00 en España se dice "buenas tardes" aunque falte
   media jornada, y la noche empieza cuando se cena, no a las doce. */
export function tramoDe(hora: number): Tramo {
  if (hora < 6) return "madrugada";
  if (hora < 13) return "manana";
  if (hora < 21) return "tarde";
  return "noche";
}

const SALUDOS: Record<Tramo, Saludo[]> = {
  madrugada: [
    { es: "¿Aún despierto, {n}?", en: "Still up, {n}?" },
    { es: "Buenas noches, {n}.", en: "Good night, {n}." },
    { es: "De madrugada, {n}.", en: "Late one, {n}." },
    { es: "Aquí sigo.", en: "Still here." },
    { es: "Sin ruido a estas horas.", en: "Quiet hours." },
  ],
  manana: [
    { es: "Buenos días, {n}.", en: "Good morning, {n}." },
    { es: "¿Empezamos, {n}?", en: "Shall we, {n}?" },
    { es: "A ello, {n}.", en: "Let's go, {n}." },
    { es: "Lo primero de hoy.", en: "First thing today." },
    { es: "Nuevo día, {n}.", en: "New day, {n}." },
  ],
  tarde: [
    { es: "Buenas tardes, {n}.", en: "Good afternoon, {n}." },
    { es: "¿Qué toca, {n}?", en: "What's next, {n}?" },
    { es: "Cuando quieras, {n}.", en: "Whenever you like, {n}." },
    { es: "¿Seguimos, {n}?", en: "Where were we, {n}?", vuelta: true },
    { es: "Aquí estoy, {n}.", en: "Right here, {n}." },
  ],
  noche: [
    { es: "Buenas noches, {n}.", en: "Good evening, {n}." },
    { es: "¿Lo último, {n}?", en: "One last thing, {n}?", vuelta: true },
    { es: "¿Rematamos, {n}?", en: "Wrapping up, {n}?", vuelta: true },
    { es: "Se acaba el día.", en: "Day's nearly done." },
    { es: "¿Algo rápido, {n}?", en: "Something quick, {n}?" },
  ],
};

/** Todos los saludos de un tramo. Para las pruebas. */
export function saludosDe(tramo: Tramo): Saludo[] {
  return SALUDOS[tramo];
}

/**
 * El saludo de esta vez: uno al azar de los que valen a esta hora.
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
