/* AVISAR ANTES DE QUE VENZA UN PAPEL.
 *
 * Una multa de tráfico pierde el descuento. Una beca cierra el plazo. La
 * ITV caduca y el seguro se renueva solo si no dices nada. Nadie te lo
 * recuerda, y despistarse cuesta dinero de verdad.
 *
 * Paperwork ya sabía qué papeles tienes y para cuándo son; lo que no
 * hacía era decírtelo a tiempo. Esto es esa parte, y es la que convierte
 * a Kairo en algo que no hace ninguna IA generalista: no te contesta
 * mejor, te evita un recargo.
 *
 * El texto se escribe aquí, fuera del reloj, porque es lo que hay que
 * poder leer de un vistazo en la pantalla de bloqueo de un móvil y lo
 * que hay que poder probar sin base de datos delante.
 */

export type PapelConPlazo = {
  id: string;
  perfil_id: string;
  titulo: string;
  que_quieren: string;
  importe: string;
  consecuencias: string;
  fecha_limite: string;
  /** Días que faltan, en la zona horaria de quien lo recibe. */
  dias: number;
  /** El cajón del aviso: 7, 3, 1 o 0. Lo decide la base de datos. */
  hito: number;
  telegram_chat_id: string | null;
};

/** Cuánto queda, dicho como se dice.
 *
 *  "Quedan 0 días" no lo dice nadie, y "quedan 1 días" menos. */
export function cuantoQueda(dias: number): string {
  if (dias <= 0) return "Vence HOY";
  if (dias === 1) return "Vence mañana";
  return `Quedan ${dias} días`;
}

/** El aviso, entero.
 *
 *  Lo importante va delante: en el móvil se lee la primera línea y poco
 *  más. Primero cuánto queda, después qué es, y al final lo que pasa si
 *  no haces nada —que es lo que hace que lo abras—. */
export function textoDelAviso(p: PapelConPlazo): string {
  const trozo = (v: string) => v.trim().replace(/\s+/g, " ");

  const titulo = trozo(p.titulo) || "Un papel sin título";
  const quieren = trozo(p.que_quieren);
  const importe = trozo(p.importe);

  /* El importe y lo que piden, en la misma línea cuando hay las dos
     cosas: son la misma idea ("200 € de multa"), no dos avisos. */
  const segunda = [importe, quieren].filter(Boolean).join(" · ");
  const pasa = trozo(p.consecuencias);

  return [
    `${cuantoQueda(p.dias)}: ${titulo}`,
    segunda,
    pasa ? `Si no haces nada: ${pasa}` : "",
    "",
    "Lo tienes entero en Kairo, en Paperwork.",
  ]
    .filter((l, i, todas) => l !== "" || (todas[i + 1] ?? "") !== "")
    .join("\n")
    .trim();
}

/** El título de la conversación que se deja cuando no hay Telegram. */
export function tituloDelAviso(p: PapelConPlazo): string {
  return `${cuantoQueda(p.dias)}: ${p.titulo.trim() || "un papel"}`.slice(0, 120);
}

/* --------------------------------------------------------------
   El reparto
   -------------------------------------------------------------- */

/** Lo que hace falta de la base de datos, y nada más: así esto se puede
 *  probar sin una base de datos delante. */
export type Puerta = {
  pendientes: (limite: number) => Promise<PapelConPlazo[]>;
  /** Apunta el aviso ANTES de mandarlo. Devuelve si lo ha cogido este
   *  reloj; el que llega segundo recibe false y no manda nada. */
  coger: (papel: string, hito: number) => Promise<boolean>;
  /** Al móvil. */
  porTelegram: (chat: string, texto: string) => Promise<boolean>;
  /** Y si no hay Telegram, al chat, que es donde se mira. */
  porChat: (papel: PapelConPlazo, texto: string) => Promise<void>;
};

export type Reparto = { mirados: number; avisados: number; sinSitio: number; fallidos: number };

/** Cuántos avisos como mucho por vuelta de reloj. El reloj suena cada
 *  hora: lo que no quepa hoy, cabe en la siguiente. */
export const AVISOS_DE_UNA_VEZ = 30;

/** Avisa de lo que venza pronto. No lanza nunca: un fallo aquí no puede
 *  tumbar el reparto de Co-Works que viene detrás. */
export async function avisarDePlazos(
  puerta: Puerta,
  plazo: () => boolean = () => true,
): Promise<Reparto> {
  const cuenta: Reparto = { mirados: 0, avisados: 0, sinSitio: 0, fallidos: 0 };

  let lista: PapelConPlazo[];
  try {
    lista = await puerta.pendientes(AVISOS_DE_UNA_VEZ);
  } catch {
    // Sin la migración 0014 esto no existe todavía. No es una avería.
    return cuenta;
  }

  cuenta.mirados = lista.length;

  for (const p of lista) {
    if (!plazo()) break;

    try {
      /* Se coge PRIMERO y se manda después. Al revés, un fallo entre las
         dos cosas repetiría el aviso dentro de una hora. Y si se pierde
         uno por mandarlo y no apuntarlo, el papel sigue en pantalla y en
         rojo: se pierde el aviso, no el papel. */
      if (!(await puerta.coger(p.id, p.hito))) continue;

      const texto = textoDelAviso(p);

      if (p.telegram_chat_id) {
        if (await puerta.porTelegram(p.telegram_chat_id, texto)) cuenta.avisados++;
        else cuenta.fallidos++;
      } else {
        await puerta.porChat(p, texto);
        cuenta.sinSitio++;
      }
    } catch {
      cuenta.fallidos++;
    }
  }

  return cuenta;
}
