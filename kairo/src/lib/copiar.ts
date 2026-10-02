/* COPIAR AL PORTAPAPELES, Y QUE SE ENTERE QUIEN PULSA.
 *
 * Parece una línea y no lo es. El camino moderno —`navigator.clipboard`—
 * necesita conexión segura y permiso del navegador, y en algunos móviles
 * directamente no va; a veces ni falla, se queda esperando un permiso
 * que nadie va a conceder. Un botón que no contesta nunca se lee como
 * un botón roto.
 *
 * Así que: el moderno con plazo, el de siempre de repuesto, y una
 * respuesta clara en los dos casos.
 */

/** Cuánto se espera al camino moderno antes de tirar por el de siempre.
 *
 *  Corto a propósito. El camino de repuesto solo funciona mientras dura
 *  el "permiso" que da el navegador al pulsar un botón, y ese permiso se
 *  agota esperando: cuanto más se espere al moderno, menos posibilidades
 *  quedan de que el otro llegue a tiempo. */
const PLAZO = 600;

export async function copiarTexto(texto: string): Promise<boolean> {
  if (!texto) return false;

  try {
    await Promise.race([
      navigator.clipboard.writeText(texto),
      new Promise((_, no) => setTimeout(() => no(new Error("tarda")), PLAZO)),
    ]);
    return true;
  } catch {
    /* ahora el de siempre */
  }

  const caja = document.createElement("textarea");
  try {
    caja.value = texto;
    // Fuera de la pantalla, pero no oculta: lo oculto no se puede copiar.
    caja.style.position = "fixed";
    caja.style.left = "-9999px";
    caja.setAttribute("readonly", "");
    document.body.appendChild(caja);

    /* Seleccionar de las dos formas: `select()` a secas no hace nada en
       Safari del iPhone, que es justo uno de los sitios donde hace falta
       este camino. */
    caja.select();
    caja.setSelectionRange(0, texto.length);

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    /* Y la caja se quita PASE LO QUE PASE. Si `select()` o la copia
       fallaban, antes se quedaba pegada al final de la página para
       siempre, invisible pero ahí. */
    caja.remove();
  }
}

/** El título convertido en un nombre de archivo que el navegador acepte.
 *
 *  Y acepta menos de lo que parece. Un nombre con acentos —«Así queda un
 *  vídeo…»— hace que Chrome se salte el nombre entero y guarde el
 *  archivo llamado «download», sin extensión y sin pista de qué es. No
 *  da ningún error: simplemente aparece eso en la carpeta de descargas.
 *
 *  Como aquí casi todos los títulos llevan acento o eñe, se quitan las
 *  tildes en vez de rendirse: «Así» pasa a «Asi», que se lee igual de
 *  bien y sí llega al disco. */
export function nombreDeArchivo(titulo: string): string {
  const limpio = titulo
    /* Separar cada letra de su tilde (NFD) para poder quitar solo la
       tilde: así la ñ se queda en n y la í en i, en vez de perderse. */
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Y fuera todo lo que no sea letra, número o separador corriente.
    .replace(/[^A-Za-z0-9 ._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
    .trim();

  return limpio || "apuntes";
}

/** Guarda un texto como archivo. Para llevarse los apuntes a otro sitio. */
export function descargarTexto(nombre: string, texto: string) {
  const limpio = nombreDeArchivo(nombre);

  const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${limpio}.txt`;
  document.body.appendChild(a);
  a.click();

  /* El enlace se quita después de que la descarga haya arrancado, no en
     la misma línea del clic: no hay prisa por quitarlo y sí hay prisa
     por no interrumpirla. Y con él se suelta la memoria del archivo,
     que si no se queda ocupada hasta recargar la página. */
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}
