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

/* Fuera las tildes, de los dos lados.
 *
 * Nadie escribe "¿cuándo sale el GTA 6?" con la tilde puesta cuando
 * tiene prisa, y hasta ahora "cuando" y "cuándo" eran dos palabras
 * distintas para esto: la lista estaba escrita con tildes y media
 * pregunta real se caía por el camino sin que nadie se enterara. La de
 * "quién es el presidente" no buscaba; la de "quien es el presidente",
 * tampoco, por el motivo contrario.
 *
 * Así que se normaliza lo que entra y se escriben los patrones sin
 * tildes. Un acento de más o de menos deja de decidir si Kairo se
 * entera de lo que ha pasado hoy. */
const sinTildes = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const PISTAS: RegExp[] = [
  // El tiempo, dicho de frente
  palabra("(hoy|ahora|actualmente|hogaño)"),
  palabra("(ayer|anoche|anteayer)"),
  palabra("este (año|mes|verano|invierno|curso)"),
  palabra("esta (semana|temporada)"),
  palabra("(ultim[oa]s?|recient(e|es)|novedad(es)?|de momento|por ahora)"),
  palabra("(acaba de|acaban de|ha salido|han salido|ha sacado|han sacado|va a salir|saldra)"),
  /* "¿Cuándo sale el GTA 6?" — la pregunta más normal del mundo y la que
     no buscaba. Faltaba el presente: la lista tenía "salió" y "saldrá",
     pero no "sale", que es como lo dice todo el mundo. */
  palabra("(cuando|cuanto falta para que) (sale|salen|salga|salgan|saldra|saldran|sacan|estrena|estrenan|estrene|llega|llegan|llegue)"),
  palabra("(ya )?(ha|han) (salido|llegado|estrenado)"),
  palabra("sigue (retrasado|aplazado|sin salir|sin fecha)"),
  palabra("(que se sabe (de|del|sobre)|que hay de nuevo|hay novedades|alguna novedad)"),
  palabra("(datos|informacion|info) (de|del|sobre)"),
  palabra("(sigue|siguen) (siendo|abierto|vivo|en pie)"),
  palabra("(todavia|aun) (existe|esta|vive|funciona)"),
  palabra("(now|today|currently|latest|recent|this year|just (released|launched))"),

  // Dinero y disponibilidad
  palabra("(precio|precios|cuesta|cuestan|vale|valen|tarifa|tarifas|cuota)"),
  palabra("(cuanto (cuesta|vale|sale)|que precio)"),
  palabra("(oferta|ofertas|descuento|rebajas|gratis|de pago)"),
  palabra("(stock|disponible|disponibles|agotado|en venta)"),
  palabra("(price|pricing|how much|cost|free tier)"),

  // Sitios: lo del restaurante inventado vive aquí
  palabra("(donde esta|donde queda|como llego|como se va|cerca de mi|por aqui cerca)"),
  palabra("(restaurante|bar|cafeteria|hotel|tienda|museo|farmacia|gimnasio|supermercado)"),
  palabra("(horario|horarios|a que hora|abre|abren|cierra|cierran|abierto|cerrado)"),
  palabra("(direccion|telefono|reservar|reserva)"),
  palabra("(where is|opening hours|near me|restaurant|address)"),

  // Quién ocupa un puesto, que cambia y nadie avisa
  palabra("(quien es (el|la) (presidente|presidenta|ministro|ministra|entrenador|entrenadora|director|directora|alcalde|alcaldesa|ceo|rey|reina|papa))"),
  palabra("(quien (lidera|dirige|entrena))"),
  palabra("(who is the (president|ceo|prime minister|coach))"),

  // Lo que se estrena, se publica o se actualiza
  palabra("(version|versiones|actualizacion|actualizaciones|parche|lanzamiento)"),
  palabra("(estreno|estrena|estreno|temporada|capitulo|episodio|spin[- ]?off|trailer|trailer)"),
  palabra("(pelicula|serie|disco|album|libro nuevo|videojuego|juego nuevo)"),
  palabra("(salio|saldra|se lanza|se lanzo|fecha de salida)"),
  palabra("(release|version|update|season|episode|premiere)"),

  // Resultados, noticias y tiempo atmosférico
  palabra("(resultado|resultados|marcador|clasificacion|partido|elecciones)"),
  palabra("(noticia|noticias|que ha pasado|que esta pasando)"),
  palabra("(el tiempo|va a llover|temperatura|pronostico)"),
  palabra("(news|weather|score|standings)"),

  // Normas que cambian
  palabra("(ley|leyes|normativa|plazo|multa|impuesto|iva|irpf|subvencion|ayuda)"),

  palabra("(han (puesto|sacado|subido|anunciado|publicado|estrenado)|acaban de)"),

  /* Y cuando se pide la búsqueda con todas las letras. Parece de cajón,
     y no estaba: se podía escribir "búscalo en internet" y Kairo
     contestaba de memoria igualmente. */
  palabra("(busca(lo|me|s)?|buscar|googlea|mira en (internet|la web|google)|en internet|comprueba(lo)?|verifica|confirma|segun (internet|google)|fuentes)"),
  palabra("(search|google it|look it up|check online|sources)"),
];

/* Pistas flojas: solas no bastan si la pregunta habla de un año viejo.
   "¿Qué pasó con el GTA?" hay que buscarlo; "¿qué pasó en la guerra
   civil de 1936?" es historia y buscarlo no añade nada. */
const DEBILES: RegExp[] = [
  palabra("(que paso|que pasaron)"),
  palabra("(quien gano|quien gana|quien va ganando)"),

  /* "¿Sabes lo del capítulo que han puesto en Netflix?" — así es como se
     pregunta de verdad por algo que ha pasado hace poco. Casi nunca
     lleva la palabra "reciente" delante; lleva esto. */
  palabra("(has (visto|oido|escuchado)|habeis visto|te has enterado|sabes lo (de|del)|conoces lo (de|del)|viste lo (de|del))"),

  /* Un sitio donde el catálogo cambia cada semana: lo que se pregunta es
     qué hay AHORA, no qué hubo. */
  palabra("(netflix|hbo|max|disney\\+?|prime video|movistar|filmin|skyshowtime|twitch|youtube|tiktok|spotify|steam|epic games|game ?pass|play ?station|xbox|nintendo)"),

  /* Deporte: un resultado, una plantilla o un calendario de hace dos
     años es igual de inútil que un precio de hace dos años. */
  palabra("(formula ?1|f1|gran premio|gp de|motogp|mundial|eurocopa|champions|la liga|premier|nba|balon de oro|fichaje|fichajes|traspaso|circuito)"),
  palabra("(juega|juegan|gana|ganan|pierde|pierden|clasificad[oa]s?|eliminad[oa]s?)"),
];

/* Por qué estas van en las flojas y no arriba: "¿quién ganó el mundial
   de 1982?" nombra un mundial y no hay nada que buscar, es historia. Las
   flojas se callan en cuanto aparece un año de hace décadas, y las de
   arriba no. Pedir la búsqueda con todas las letras («búscalo») sí es
   fuerte: si la pides, se hace, hables del año que hables. */

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
  palabra("(este codigo|mi codigo|esta funcion|este error|la linea \\d+|mi script)"),
  palabra("(este archivo|el pdf que|la foto que|el documento que|lo que te he pasado|lo que te acabo de)"),
  palabra("(traduce|traduce|traduccion|resume esto|corrige|reescribe|mejora este)"),
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
  const texto = sinTildes(pregunta.trim());
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
