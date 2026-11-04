/* LOS DATOS DEL TITULAR, EN UN SOLO SITIO.
 *
 * Los cuatro documentos legales (aviso legal, privacidad, cookies y
 * términos) necesitan los mismos datos de identificación, y son datos
 * del dueño, no decisiones de redacción: nombre o razón social, NIF,
 * domicilio, correo de contacto, y la ley y el fuero aplicables.
 *
 * Por eso no van escritos dentro de cada documento con un hueco en
 * medio: viven aquí. Rellenar este archivo es rellenar los cuatro a la
 * vez, y mientras esté vacío cada documento **lo dice** en lugar de
 * inventarse un titular o de dejar un "[RELLENAR]" a la vista.
 *
 * Cómo se rellena: se escriben los cinco campos de abajo y nada más.
 * No hay que tocar ningún documento.
 *
 * Escrito por `kairo-constructor` el 2026-11-04, al redactar la política
 * de cookies, que es el primero de los cuatro.
 */

export type DatosTitular = {
  /** Nombre y apellidos, o razón social. */
  nombre: string;
  /** NIF, NIE o CIF. */
  nif: string;
  /** Domicilio a efectos de notificaciones. */
  domicilio: string;
  /** Correo de contacto público, el que se publica en los documentos. */
  email: string;
  /** Ley aplicable y fuero, p. ej. "la ley española, con los juzgados de Madrid". */
  fuero: string;
};

export const TITULAR: DatosTitular = {
  nombre: "",
  nif: "",
  domicilio: "",
  email: "",
  fuero: "",
};

/** true cuando los cinco campos están rellenos. */
export function titularCompleto(d: DatosTitular = TITULAR): boolean {
  return (
    d.nombre.trim() !== "" &&
    d.nif.trim() !== "" &&
    d.domicilio.trim() !== "" &&
    d.email.trim() !== "" &&
    d.fuero.trim() !== ""
  );
}

/** Los campos que faltan, para poder decir exactamente cuáles. */
export function faltanDelTitular(d: DatosTitular = TITULAR): (keyof DatosTitular)[] {
  return (Object.keys(d) as (keyof DatosTitular)[]).filter(
    (k) => d[k].trim() === "",
  );
}
