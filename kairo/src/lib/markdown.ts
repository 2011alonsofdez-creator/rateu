/* LAS DECISIONES DEL RENDERIZADOR, FUERA DEL RENDERIZADOR.
 *
 * Viven aquí y no dentro del componente porque son las que hay que poder
 * probar de una en una, y un componente con JSX dentro no se puede
 * cargar en una prueba suelta.
 *
 * Y una de ellas es seria. El texto que se pinta lo escribe un modelo, y
 * un modelo puede escribir `[pulsa aquí](javascript:...)` sin ninguna
 * mala intención, porque lo ha leído en algún sitio. En cuanto eso se
 * convierte en un enlace de verdad, ya no es una cuestión de estilo.
 */

/** ¿Se puede pinchar este enlace sin peligro?
 *
 *  No se descarta lo malo conocido —esa lista nunca está completa, y el
 *  día que aparezca un esquema nuevo ya es tarde—: se admite SOLO lo
 *  bueno conocido. Una dirección web normal, o una página de Kairo.
 *
 *  Devuelve la dirección limpia, o null si no se puede abrir. */
export function enlaceSeguro(url: string): string | null {
  const limpio = url.trim();

  // Ni vacío, ni con espacios o signos que partan el atributo.
  if (!limpio || /[\s<>"'`]/.test(limpio)) return null;

  // Una dirección web normal.
  if (/^https?:\/\//i.test(limpio)) return limpio;

  /* Una página de Kairo. Y `//otro-sitio.com` NO lo es: empieza por
     barra, pero es otra web escrita de otra forma —el navegador le pone
     delante el mismo protocolo y se va fuera—. */
  if (limpio.startsWith("/") && !limpio.startsWith("//")) return limpio;

  return null;
}

/** Si esta línea es un título de markdown, su nivel y su texto. */
export function titulo(linea: string): { nivel: number; texto: string } | null {
  /* Hasta tres espacios delante, como manda el markdown, y un espacio
     obligatorio detrás de las almohadillas: sin él, "#kairo" es una
     etiqueta, no un título. */
  const m = linea.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
  if (!m) return null;

  return {
    nivel: m[1].length,
    // Algunos escriben "## Título ##": las de atrás sobran.
    texto: m[2].replace(/\s+#+\s*$/, "").trim(),
  };
}
