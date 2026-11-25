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
  /* Sin "vale" a secas: en España es "de acuerdo", y "vale, gracias" se
     ponía a buscar en internet. El precio con "vale" ya lo pilla la de
     abajo ("cuánto vale"), y "vale X euros" casi nunca se pregunta así. */
  palabra("(precio|precios|cuesta|cuestan|tarifa|tarifas|cuota)"),
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
  palabra("(resultado|resultados|marcador|clasificacion|partido|partidos|elecciones)"),
  /* La política cambia con cada encuesta y cada pacto: lo que el modelo
     recuerda de un programa o de un gobierno puede tener años. */
  palabra("(gobierno|congreso|senado|votar|votacion|encuesta|encuestas|programa electoral|pacto|investidura|moción de censura|mocion de censura)"),
  /* "¿Cómo quedó el Madrid-Barça?" es como se pregunta un resultado de
     verdad, y no casaba con nada: la frase no lleva ni "resultado" ni
     "partido", lleva los nombres de los dos equipos, que no están en
     ninguna lista ni pueden estarlo. Lo que sí se repite es el verbo. */
  palabra("(como (quedo|quedaron|queda|quedan|va|van|iba|iban|acabo|acabaron|termino|terminaron))"),
  palabra("(noticia|noticias|que ha pasado|que esta pasando)"),
  /* Creadores de contenido: lo que hacen cambia cada semana. */
  palabra("(youtuber|youtubers|streamer|streamers|tiktoker|influencer|influencers|canal de youtube|en twitch|en kick)"),
  /* Reseñas y críticas: la nota de un juego, una peli o un disco es de
     los medios, y de lo reciente el modelo no sabe nada. */
  palabra("(resena|resenas|review|reviews|critica|criticas|que nota tiene|nota de|notas de|metacritic|opiniones de|que tal esta)"),
  /* Lo que sale en el telediario: pasa hoy y mañana ya es otro. */
  palabra("(huelga|huelgas|manifestacion|manifestaciones|protesta|protestas|paro|paros|retraso|retrasos|cancelad[oa]s?|cortes?|apagon|accidente|incendio|terremoto|inundacion|dana|alerta|evacuacion|atentado|detenid[oa]s?|juicio|condena|dimision|dimite)"),
  /* "el tiempo" estaba; "qué tiempo va a hacer mañana" no, que es como
     lo dice todo el mundo. Y el tiempo de mañana es el caso más claro
     de dato que Kairo no se puede saber de memoria. */
  palabra("(el tiempo|que tiempo|va a llover|temperatura|pronostico)"),
  palabra("(news|weather|score|standings)"),

  // Normas que cambian
  /* "ayuda" sola no: "necesito ayuda con mates" no es una subvención.
     Solo cuando es una ayuda pública. */
  palabra("(ley|leyes|normativa|plazo|multa|impuesto|iva|irpf|subvencion|subvenciones|beca|becas)"),
  palabra("(ayudas?|bono|bonos|prestacion|prestaciones) (de|del|para|al|publicas?|estatal(es)?|por)"),

  palabra("(han (puesto|sacado|subido|anunciado|publicado|estrenado)|acaban de)"),

  /* Y cuando se pide la búsqueda con todas las letras. Parece de cajón,
     y no estaba: se podía escribir "búscalo en internet" y Kairo
     contestaba de memoria igualmente. */
  /* Sin "buscar" a secas: casaba con "quiero buscar trabajo" y encima
     como pista fuerte, que no la apaga ni hablar de 1980. Lo que se
     quería reconocer es la ORDEN, y una orden lleva el qué detrás. */
  palabra("(buscalo|buscame|busca (en|eso|esto|si|cuanto|cuando|quien|que|el|la|los|las)|googlea|mira en (internet|la web|google)|en internet|compruebalo|comprueba si|verifica|confirma|segun (internet|google)|dame fuentes)"),
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
  palabra("(netflix|hbo( ?max)?|disney\\+?|prime video|movistar|filmin|skyshowtime|twitch|youtube|tiktok|spotify|steam|epic games|game ?pass|play ?station|xbox|nintendo)"),

  /* Juegos, móviles, apps y criptos: cambian cada semana —un evento de
     Fortnite, un iPhone nuevo, una función de ChatGPT, el precio del
     bitcoin—, y lo que el modelo recuerda es de hace meses. "¿Qué es el
     token de Fortnite?" contestaba de memoria. */
  palabra("(fortnite|fornite|roblox|minecraft|gta ?(v|vi|\\d{1,2})?|clash royale|clash of clans|brawl stars|valorant|league of legends|fifa|ea fc|call of duty|warzone|pokemon|genshin)"),
  palabra("(iphone|ios|android|samsung|galaxy|xiaomi|pixel|whatsapp|instagram|chatgpt|openai|gemini|claude|grok|tesla|bitcoin|ethereum|cripto|criptomonedas?)"),

  /* Deporte: un resultado, una plantilla o un calendario de hace dos
     años es igual de inútil que un precio de hace dos años. */
  palabra("(formula ?1|f1|gran premio|gp de|motogp|(el |del )mundial|eurocopa|champions|la liga|premier|nba|balon de oro|fichaje|fichajes|traspaso|circuito)"),
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

/* LO QUE ES DE PENSAR, NO DE BUSCAR.
 *
 * Escribir, calcular, programar, aconsejar, explicar algo de siempre o
 * charlar: ahí la respuesta sale de la cabeza y buscar solo hace esperar.
 * Van DESPUÉS de las pistas fuertes, así que "escríbeme un resumen de
 * las noticias de hoy" sigue buscando (lo pilla "hoy"). */
const PENSAR: RegExp[] = [
  // Saludos y charla
  palabra("(hola|holi|buenas|gracias|muchas gracias|vale|ok|okey|perfecto|genial|jaja+|jeje+|adios|buenas noches|buenos dias|que tal( estas)?|como estas)"),
  // Escribir y crear
  palabra("(escribe(me)?|redacta(me)?|hazme|haz un|haz una|crea(me)?|genera(me)?|inventa(te)?|imagina|cuentame un (chiste|cuento|historia)|un (poema|chiste|cuento|rap|cancion|eslogan|slogan)|ponme un nombre|nombres para|ideas (para|de))"),
  // Recetas y cómo se hace algo de casa
  palabra("(receta|como (hago|se hace|preparo|se prepara|cocino|se cocina)|ingredientes para)"),
  // Calcular, razonar, estudiar
  palabra("(calcula|resuelve|cuanto es|cuantos son|ecuacion|derivada|integral|porcentaje de|simplifica|demuestra|razona|ejercicio|problema de)"),
  palabra("(\\d+ ?[-+*/x^] ?\\d+)"),
  // Programar
  palabra("(programa(me)?|codigo (en|de|para)|funcion (en|que|para)|script|javascript|python|html|css|sql|regex|api rest|bug)"),
  // Consejo, opinión y lo personal
  palabra("(que (me )?recomiendas|que opinas|que harias|aconsejame|consejos? (para|de|sobre)|como (puedo|hago para|deberia)|me siento|estoy (triste|agobiad[oa]|nervios[oa]|cansad[oa])|ayudame a (pensar|decidir|organizar))"),
  // Explicar lo que no cambia
  palabra("(explicame|explica(me)? (que|como|por que)|que significa|que diferencia hay|en que consiste|como funciona (el|la|un|una) (cuerpo|corazon|motor|fotosintesis|celula|atomo|cerebro))"),
];

export type Veredicto = "si" | "no" | "duda";

/** Lo que dicen las reglas: buscar, no buscar, o no está claro (y
 *  entonces decide un modelo rápido, ver decidir-busqueda.ts). */
/* PREGUNTAS SOBRE ALGUIEN O ALGO CONCRETO: SIEMPRE SE BUSCA (25-11).
 *
 * "quién es djmario", "q sabes de auronplay", "cuántos subs tiene X":
 * antes caían en "duda", la duda la resolvía un modelo rápido y, cuando
 * ese modelo estaba sin cuota (casi siempre), decidía si había una
 * palabra en MAYÚSCULA. Escribiendo en minúscula, como escribe todo el
 * mundo, no buscaba y contestaba de memoria otra persona. Con estas
 * frases no hay duda posible: se busca. */
const SOBRE_ALGUIEN: RegExp[] = [
  /(^|[^a-z])(quien|quienes) (es|son|era|eran|fue|fueron)\b/,
  /\b(sabes|conoces) (quien|quienes|a|al|de|del)\b/,
  /\b(que|q|k) (sabes|me dices|me cuentas) (de|del|sobre)\b/,
  /\b(hablame|cuentame|dime( cosas)?|info|informacion|biografia) (de|del|sobre|acerca)\b/,
  /\b(cuantos|cuantas) (subs|suscriptores|seguidores|followers|visitas|views|anos|años|hijos|titulos|goles|premios)\b/,
  /\b(que|q|cuanta|cuantos) (edad|anos|años) (tiene|tenia)\b/,
  /\b(donde|de donde) (vive|es|nacio|juega|trabaja)\b/,
  /\b(nombre real|patrimonio|cuanto (gana|cobra|dinero tiene)|novia|novio|pareja de|esposa de|marido de)\b/,
  /\b(a que se dedica|por que es (famoso|famosa|conocido|conocida)|de que (va|trata) (su|el) canal)\b/,
];

/* LO QUE SE CONTESTA AL MOMENTO, SIN BUSCAR (25-11).
 *
 * "5x5", "raíz de 144", "cómo se dice perro en inglés", "qué día es
 * hoy", "capital de Francia": buscar aquí solo añade segundos. La fecha
 * y la hora ya las tiene el prompt; lo demás es cálculo o conocimiento
 * de siempre. Va ANTES que las pistas, porque "hoy" en "qué día es hoy"
 * no pide noticias. */
const AL_MOMENTO: RegExp[] = [
  // Cuentas: "5x5", "12*7", "cuanto es 30/4", "15% de 240", "raiz de 144"
  /^[\s\d.,+\-*/x×÷^()=%?¿]+$/,
  /\b(cuanto|q|que) (es|son|da|sale)\s*[\d(]/,
  /\b(raiz|potencia|cuadrado|cubo|factorial|logaritmo|porcentaje|por ciento|mitad|doble|triple) (de|del)\b/,
  /\d+\s*(%|por ciento) de \d/,
  /\b(calcula|calculame|resuelve|suma|resta|multiplica|divide|deriva|integra|simplifica)\b/,
  // Idioma
  /\b(como se dice|como se escribe|como se pronuncia|traduce|traduceme|traduccion de|en ingles|en frances|en aleman|en italiano|en portugues)\b/,
  /\b(sinonimo|sinonimos|antonimo|antonimos|plural de|femenino de|conjuga|conjugacion|se escribe con)\b/,
  // Fecha y hora (ya van en el prompt)
  /^(y )?(q|que|k) (dia|fecha|hora|mes|ano|año) (es|son|estamos|tenemos)( hoy)?\b/,
  /^(q|que|k) dia de la semana (es|cae|fue)\b/,
  // Saber de siempre
  /\b(capital de|cuantos dias tiene|cuantas patas|cuantos huesos|cuantos planetas|cuantos continentes|formula del|formula de la|tabla del)\b/,
  /^(hola|holi|buenas|hey|ey|gracias|vale|ok|okey|perfecto|genial|jaja\w*|xd|adios|chao|buenas noches|buenos dias)\b/,
];

export function veredicto(pregunta: string, hoy = new Date()): Veredicto {
  const texto = sinTildes(pregunta.trim());
  if (texto.length < 3) return "no";
  // Una pregunta larguísima suele ser un texto pegado para trabajar con
  // él, no una pregunta sobre el mundo.
  if (texto.length > 2000) return "no";

  if (NUNCA.some((re) => re.test(texto))) return "no";
  if (AL_MOMENTO.some((re) => re.test(texto.toLowerCase()))) return "no";
  if (llevaAnioReciente(texto, hoy)) return "si";
  if (PISTAS.some((re) => re.test(texto))) return "si";
  if (SOBRE_ALGUIEN.some((re) => re.test(texto.toLowerCase()))) return "si";

  // Las flojas valen solo si no estamos hablando de hace décadas.
  if (!llevaAnioViejo(texto, hoy) && DEBILES.some((re) => re.test(texto))) return "si";

  if (PENSAR.some((re) => re.test(texto))) return "no";
  return "duda";
}

/** ¿Hay que buscar en internet antes de contestar esto? (solo reglas) */
export function esDeAhora(pregunta: string, hoy = new Date()): boolean {
  return veredicto(pregunta, hoy) === "si";
}

/** Para cuando el modelo no contesta a tiempo: ¿nombra algo concreto?
 *  Una palabra en mayúscula que no abre la frase ("¿Quién es Ibai?",
 *  "¿Qué es Kick?") suele ser una persona, una marca o un sitio: cosas
 *  que se buscan, no que se piensan. */
export function nombraAlgoConcreto(pregunta: string): boolean {
  /* Una o dos palabras sueltas que no son charla ni un encargo ("djmario",
     "ibai", "kick streamer") casi siempre son un nombre: se busca. */
  const limpias = pregunta.replace(/[¿?¡!.,;:()"«»]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (limpias.length > 0 && limpias.length <= 3) return true;
  const palabras = pregunta.replace(/[¿?¡!.,;:()"«»]/g, " ").split(/\s+/).filter(Boolean);
  if (palabras.slice(1).some((w) => /^\p{Lu}[\p{L}\d]{2,}/u.test(w) && !/^(Kairo|Yo|Tú|Tu)$/.test(w))) return true;
  // Un modelo con número: "rtx 5070", "galaxy s24", "ryzen 9800x3d".
  return /(?<![\p{L}\d])[a-z]{1,8} ?\d{2,5}[a-z\d]*(?![\p{L}\d])/iu.test(pregunta);
}
