/* ¿Esta pregunta va de ahora mismo?
 *
 * Kairo tiene buscador desde hace días y aun así contestaba con datos
 * viejos, y una vez se inventó un restaurante. El motivo no es el
 * buscador: es que usarlo era decisión del modelo, y un modelo rápido
 * casi siempre decide que no hace falta. Cree que se acuerda.
 *
 * Así que la decisión se le quita. Si la pregunta huele a "ahora
 * mismo", se busca ANTES de contestar y la respuesta se escribe con lo
 * encontrado delante. Preferimos una búsqueda de más —que cuesta un
 * segundo— a un dato de hace dos años, que cuesta la confianza.
 */

/* Las pistas, en español y en inglés porque la web funciona en los dos.
 *
 * Se compilan con `palabra()` y no con \b, y eso NO es un detalle: para
 * una expresión regular de JavaScript, "á" no es una letra, así que
 * "dónde está\b" no casa nunca —la palabra acaba en "á" y ahí no hay
 * frontera—. Media lista en español habría estado muerta en silencio. */
const palabra = (fuente: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}_])(?:${fuente})(?![\\p{L}\\p{N}_])`, "iu");

const PISTAS: RegExp[] = [
  // El tiempo, dicho de frente
  palabra("(hoy|ahora|actualmente|hogaño)"),
  palabra("(ayer|anoche|anteayer)"),
  palabra("este (año|mes|verano|invierno|curso)"),
  palabra("esta (semana|temporada)"),
  palabra("(últim[oa]s?|recient(e|es)|novedad(es)?|de momento|por ahora)"),
  palabra("(acaba de|acaban de|ha salido|han salido|ha sacado|han sacado|va a salir|saldrá)"),
  palabra("(sigue|siguen) (siendo|abierto|vivo|en pie)"),
  palabra("(todavía|aún) (existe|está|vive|funciona)"),
  palabra("(now|today|currently|latest|recent|this year|just (released|launched))"),

  // Dinero y disponibilidad
  palabra("(precio|precios|cuesta|cuestan|vale|valen|tarifa|tarifas|cuota)"),
  palabra("(cuánto (cuesta|vale|sale)|qué precio)"),
  palabra("(oferta|ofertas|descuento|rebajas|gratis|de pago)"),
  palabra("(stock|disponible|disponibles|agotado|en venta)"),
  palabra("(price|pricing|how much|cost|free tier)"),

  // Sitios: lo del restaurante inventado vive aquí
  palabra("(dónde está|dónde queda|cómo llego|cómo se va|cerca de mí|por aquí cerca)"),
  palabra("(restaurante|bar|cafetería|hotel|tienda|museo|farmacia|gimnasio|supermercado)"),
  palabra("(horario|horarios|a qué hora|abre|abren|cierra|cierran|abierto|cerrado)"),
  palabra("(dirección|teléfono|reservar|reserva)"),
  palabra("(where is|opening hours|near me|restaurant|address)"),

  // Quién ocupa un puesto, que cambia y nadie avisa
  palabra("(quién es (el|la) (presidente|presidenta|ministro|ministra|entrenador|entrenadora|director|directora|alcalde|alcaldesa|ceo|rey|reina|papa))"),
  palabra("(quién (lidera|dirige|entrena))"),
  palabra("(who is the (president|ceo|prime minister|coach))"),

  // Lo que se estrena, se publica o se actualiza
  palabra("(versión|versiones|actualización|actualizaciones|parche|lanzamiento)"),
  palabra("(estreno|estrena|estrenó|temporada|capítulo|episodio|spin[- ]?off|tráiler|trailer)"),
  palabra("(película|serie|disco|álbum|libro nuevo|videojuego|juego nuevo)"),
  palabra("(salió|saldrá|se lanza|se lanzó|fecha de salida)"),
  palabra("(release|version|update|season|episode|premiere)"),

  // Resultados, noticias y tiempo atmosférico
  palabra("(resultado|resultados|marcador|clasificación|partido|elecciones)"),
  palabra("(noticia|noticias|qué ha pasado|qué está pasando)"),
  palabra("(el tiempo|va a llover|temperatura|pronóstico)"),
  palabra("(news|weather|score|standings)"),

  // Normas que cambian
  palabra("(ley|leyes|normativa|plazo|multa|impuesto|iva|irpf|subvención|ayuda)"),
];

/* Pistas flojas: solas no bastan si la pregunta habla de un año viejo.
   "¿Qué pasó con el GTA?" hay que buscarlo; "¿qué pasó en la guerra
   civil de 1936?" es historia y buscarlo no añade nada. */
const DEBILES: RegExp[] = [
  palabra("(qué pasó|qué pasaron)"),
  palabra("(quién ganó|quién gana|quién va ganando)"),
];

/* Un año reciente escrito a mano ("¿qué pasó en 2026?") también cuenta.
   Los años viejos no: "la guerra de 1936" no necesita buscador. */
function llevaAnioReciente(texto: string, hoy: Date): boolean {
  const anioHoy = hoy.getFullYear();
  for (const m of texto.matchAll(/\b(19|20)\d{2}\b/g)) {
    const anio = Number(m[0]);
    if (anio >= anioHoy - 1 && anio <= anioHoy + 2) return true;
  }
  return false;
}

/* Y estas son las que NO deben disparar una búsqueda aunque suenen
   parecido: el usuario está hablando de su propio código, de su
   propio texto o de lo que acaba de subir, y ahí internet no pinta
   nada. Van primero y ganan. */
const NUNCA: RegExp[] = [
  palabra("(este código|mi código|esta función|este error|la línea \\d+|mi script)"),
  palabra("(este archivo|el pdf que|la foto que|el documento que|lo que te he pasado|lo que te acabo de)"),
  palabra("(tradúce|traduce|traducción|resume esto|corrige|reescribe|mejora este)"),
  palabra("(this code|my code|this function|this error|translate|rewrite)"),
];

/** Un año de hace mucho: señal de que la pregunta es de historia. */
function llevaAnioViejo(texto: string, hoy: Date): boolean {
  const anioHoy = hoy.getFullYear();
  for (const m of texto.matchAll(/\b(1[5-9]\d{2}|20\d{2})\b/g)) {
    if (Number(m[0]) <= anioHoy - 10) return true;
  }
  return false;
}

/** ¿Hay que buscar en internet antes de contestar esto? */
export function esDeAhora(pregunta: string, hoy = new Date()): boolean {
  const texto = pregunta.trim();
  if (texto.length < 3) return false;
  // Una pregunta larguísima suele ser un texto pegado para trabajar con
  // él, no una pregunta sobre el mundo.
  if (texto.length > 2000) return false;

  if (NUNCA.some((re) => re.test(texto))) return false;
  if (llevaAnioReciente(texto, hoy)) return true;

  if (PISTAS.some((re) => re.test(texto))) return true;

  // Las flojas valen solo si no estamos hablando de hace décadas.
  return !llevaAnioViejo(texto, hoy) && DEBILES.some((re) => re.test(texto));
}
