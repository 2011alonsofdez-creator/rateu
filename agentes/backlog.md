# Backlog de Kairo

La cola priorizada. `kairo-radar` y `kairo-crecimiento` la llenan;
`kairo-constructor` la vacía **de arriba abajo**.

Prioridades: `P1` lo que bloquea o está roto · `P2` lo siguiente ·
`P3` cuando haya hueco. Nada se borra: lo hecho se marca
`[hecho AAAA-MM-DD]` y lo descartado `[descartado AAAA-MM-DD: motivo]`.

> Este archivo lo creó `kairo-guardian` el 2026-10-12 porque no existía,
> aunque `agentes/README.md` lo daba por hecho. Sin él, el constructor no
> tiene de dónde coger trabajo.

## P1

- **🔴 Anoche tocó el "No" de `/precios` y lo reforzó: ahora dice "ni las tuyas ni las de nadie". Sexto día.** `[origen: guardian 2026-11-11 · el hallazgo es del 2026-11-06]`
  En el repaso de honestidad de anoche —14 commits, y casi todo bueno— pasó por
  **esa misma respuesta** y la dejó así:

  > ¿Se usan mis conversaciones para entrenar modelos?
  > **"No. Ni las tuyas ni las de nadie, y tampoco se venden."**

  Antes decía *"No. Y en los perfiles de menores, además, se guardan los datos
  mínimos imprescindibles."* Las dos frases **nuevas** son verdad: no se venden
  y no hay otro destino. **La primera palabra sigue siendo falsa** mientras la
  cuenta de Gemini esté en la capa gratuita —la tabla del proveedor dice *"Used
  to improve our products: **Yes**"* en gratuita y **No** en pago, y la capa de
  Kairo es la gratuita (`CONTEXTO.md`, 25-10, de un commit suyo)—. Y ahora lo
  afirma **más fuerte**, con dos refuerzos que empujan a creerlo.

  **Por qué esto es lo único rojo de un día de buenas noticias**: anoche quitó
  de la web "ilimitado", "modo niños", los conectores que no existen y los
  "1.200 créditos al mes". Es un barrido de honestidad, hecho por iniciativa
  suya, y es exactamente la dirección correcta. Dentro de ese mismo barrido, la
  única frase que **no** se corrigió es la que trata de datos personales, que es
  la que más pesa, en la página donde se decide pagar. No es que no la viera:
  la tocó.

  **No se ha traído a la rama.** `/precios/contenido.tsx` sigue contestando lo
  que se puede comprobar —qué se guarda de lo que le mandas—, y la nota del
  archivo explica por qué, con fecha de hoy.

  **Sigue siendo una decisión suya de una línea**, la misma desde el 06-11:
  paga la capa de la API y el "No." pasa a ser verdad —y lo pongo yo ese día—,
  o dice que se queda la respuesta comprobable y se queda. Lo que no puede
  seguir es publicado tal cual: Kairo **en el chat** se niega a afirmar lo que su
  propia página afirma, porque el bloque `PRIVACIDAD` del prompt está escrito
  desde el 24-10 para no decirlo.

- **🟡 El plan gratis ha dejado de contar su mejor argumento: que trae rápido y normal.** `[origen: guardian 2026-11-11]`
  En el repaso de anoche la tarjeta del plan gratis se rehízo entera y perdió
  una viñeta que pusimos el 30-10: **"Modelos rápido y normal: chat, Paperwork,
  Gist y Código"**. Las seis que tiene ahora son buenas —40 al día que vuelven
  cada mañana, los 300 de regalo, 1 Co-Work, 3 Mentes, historial sin caducidad,
  PDF de cualquier tamaño—, pero ninguna dice **qué puede hacer** con eso.

  **Por qué importa y no es una nostalgia de redacción**: el plan gratis llega
  al nivel `normal` desde el 29-10 (`NIVELES_PLAN.free`), y el nivel normal es
  lo que hace funcionar Paperwork, Gist y Código. O sea que **leer una multa
  gratis y sin tarjeta entra en el plan gratis**, que es justo lo que la portada
  vende y lo que trae a la gente. Hoy la tarjeta no lo dice en ninguna parte.

  **No lo he tocado**: es su tarjeta y la rehizo entera anoche, con un criterio
  —seis viñetas, todas de cuánto— que se respeta. **Lo que hace falta es una
  línea suya**: o se añade una séptima viñeta con lo que se puede hacer, o se
  cambia una de las de cuánto por ella. Diez minutos míos en cuanto diga cuál.

- **🔴 La automatización de los agentes lleva dos días caída, y es la tercera vez en nueve días.** `[origen: guardian 2026-11-10]`
  **08-11 y 09-11: cero commits, cero partes, cero informes.** Los ocho avisos
  —cuatro del 08, tres del 09 y el de hoy— se leyeron el **10-11 a las 06:17**,
  de golpe. No falló ningún agente ni ninguna rutina: **se reinició el proceso de
  esta sesión** y los turnos se quedaron en la cola.

  **El historial, porque ya es un patrón y no un accidente**:

  | Cuándo | Qué se perdió |
  |---|---|
  | 02-11 | el día entero, 4 turnos |
  | 06-11 | el turno del entrenador, y el parte del constructor salió sin correo |
  | 07-11 | el correo del parte, enviado al día siguiente |
  | **08 y 09-11** | **dos días enteros, 7 turnos** |

  **Y el contraste que señala dónde está el problema**: en esos mismos dos días,
  el reloj de Co-Works que vive en GitHub **no perdió un solo toque** —
  ejecuciones 209 a 214, las seis en verde—. Lo que corre en GitHub aguanta; lo
  que corre en esta sesión, no. Van tres veces que se dice.

  **Qué haría yo, y es lo mismo que está pedido desde el 01-11**: cron **diarios**
  para los cinco agentes, y que cada uno decida si le toca leyendo la fecha de su
  último informe. Con cron diario, un turno perdido se recupera al día siguiente
  en vez de desaparecer; hoy, el informe de mercado del 08-11 **no se recupera**
  y el mercado lleva sin mirarse desde el 05-11.

  **Es suyo y no se puede arreglar desde aquí**: son tareas programadas, no viven
  en el repositorio. Dos minutos en la pantalla de rutinas.

- **🔴 El "No" falso de `/precios` cumple cinco días publicado.** `[origen: guardian 2026-11-10 · el hallazgo es del 2026-11-06]`
  Sin novedad, y eso es la novedad: la FAQ de `/precios` sigue diciendo, en
  producción, que las conversaciones **no** se usan para entrenar modelos. En la
  capa gratuita de la API de Gemini eso es falso —la tabla del proveedor dice
  *"Used to improve our products: **Yes**"*— y la cuenta está en esa capa
  (`CONTEXTO.md`, 25-10, de un commit suyo).

  Comprobado hoy en `main`: la pregunta sigue ahí. **Cinco días**, y es una
  afirmación sobre datos personales en la página donde se decide pagar. La
  corrección está escrita en la rama desde el 06-11 y sin publicar, como los
  otros 113 commits.

  **Una línea suya**: paga la capa de la API —y entonces el "No." es verdad y lo
  pongo yo en los dos idiomas— o dice que se queda la respuesta comprobable.

- **~~El verificador de cifras no mira los dos archivos que todo agente lee primero~~ — HECHO, y el arreglo de verdad no era la lista de archivos.** `[origen: radar 2026-11-10 · hecho 2026-11-11]`
  Hecho lo que pedía esta entrada —`CONTEXTO.md`, `ESTADO.md` y el checklist,
  con el histórico de cada línea recortado en el primer `Lo de antes:`— y una
  cosa más que salió al comprobarlo, que es la que importa.

  **La prueba que lo cambió todo**: antes de darlo por bueno se le pasaron los
  paneles **tal y como estaban el 10-11**, con sus cuatro cifras falsas dentro.
  Cazó **dos**. Las otras se le escaparon por la forma: buscaba la frase
  `20 créditos al día` y el panel escribía `` `free` 15 créditos ``; buscaba
  `MEGA 120` y el panel escribía `` `mega` 120 ``. **Añadir archivos a una
  lista de frases prohibidas no cerraba el agujero.**

  Así que lleva una segunda red: busca **un nombre de cifra pegado a un
  número** y lo compara con el código, da igual cómo esté escrito alrededor, y
  mira también cada línea pegada a la siguiente porque la prosa va envuelta a
  76 columnas y una cifra se parte sin avisar. Con ella, los paneles del 10-11
  dan **10 desajustes** y las cuatro cifras salen todas.

  **Y encontró una que no sabíamos**: `ejemplos/2026-10-15-limite-usuario-que-
  insiste.md` decía *"un mensaje normal cuesta 4 créditos y Forja cuesta 20"*,
  **cinco veces en el mismo archivo**, seis días después de la escala nueva y
  **en una carpeta que el script ya miraba desde el 10-11**. Una palabra en
  medio —*cuesta*— y no había coincidencia. Arreglado, con su nota.

  Comprobado en verde y en rojo: los tres paneles cazan una cifra vieja
  metida a mano; una cifra citada detrás de `Lo de antes:` **no** se canta; y
  una falsa dicha antes del marcador, en esa misma línea, **sí**. Dos falsos
  positivos salieron en la primera ejecución y están corregidos con su
  comentario: *Kairo+ 9,99 €* se leía como «Kairo+ 9», y el veredicto del
  panel cita la escala vieja con otras palabras.
  Lo que decía esta entrada, de histórico:
  Ayer se entregó `agentes/comprobar/cifras.py` para que las cifras del material
  no envejezcan solas. Recorre `agentes/ia/conocimiento/`, el banco de pruebas y
  los ejemplos. **No recorre los paneles vivos**, y hoy, buscando a mano para
  este informe, han salido **cuatro cifras en presente y falsas**:

  | Archivo (línea de antes de corregirlo) | Decía | Dice el código |
  |---|---|---|
  | `agentes/CONTEXTO.md:66` | `free` 15 créditos, `plus` 1000, `supreme` 3000 | **40 · 2.000 · 6.000** (`CREDITOS_PLAN`) |
  | `agentes/CONTEXTO.md:67` | "`free` solo alcanza el nivel rápido" | **rápido y normal** (`NIVELES_PLAN.free`) |
  | `agentes/CONTEXTO.md:230` | un Co-Work cuesta 4 créditos, Free trae 15 al día | **8** (`api/coworks/ejecutar/route.ts:49`) y **40** |
  | `lanzamiento/checklist.md` | "Hoy son `fast` 1, `normal` 4, `forja` 20, `mega` 120" | **2 / 8 / 40 / 240** (`CREDITOS_NIVEL`) |

  **Tres** llevaban desde el **05-11**, cuando el dueño dobló la escala: cinco
  días. Y la cuarta —*"`free` solo alcanza el nivel rápido"*— es peor: el plan
  gratis llegó a **normal** el **29-10** (`4a23a57`, *"Let a free account
  actually try Kairo"*), así que llevaba **doce días** falsa, y es la que más
  cambia una decisión: con ella, un agente concluye que en el plan gratis no
  entran Paperwork, Gist ni Código, cuando sí entran. Y está en el archivo que
  el protocolo manda leer **antes de opinar**: no es material de adorno, es la
  entrada con la que razonan cinco agentes.

  **Corregidas hoy** por el radar, con la nota de qué decían y por qué cambió,
  sin borrar nada. Lo que queda es que no vuelva a pasar.

  **Qué haría yo, y está diseñado, no hace falta inventarlo**: añadir
  `agentes/CONTEXTO.md`, `agentes/lanzamiento/checklist.md` y `agentes/ESTADO.md`
  a la lista que recorre `cifras.py`, **cortando cada celda en el primer
  `Lo de antes:` o `Lo de ayer:`**. Ese recorte no es un detalle: esas cadenas
  citan cifras viejas **a propósito** —son el histórico de la fila— y sin
  recortarlas el script cantaría falsos positivos, que es el error (c) de los
  cuatro que ya están escritos en las plantillas de comprobación. Medio día del
  constructor, y cierra la clase entera de errores en el sitio donde más duele.

  **Lo que este hallazgo dice de la rama**: van **cinco** veces en cinco días que
  un cambio del dueño deja falso algo nuestro —la escala en cuatro archivos y el
  caso 7 del banco (06-11), la política de cookies (07-11), el párrafo del
  ejemplo (10-11) y estas cuatro cifras (10-11)—. El verificador cambió quién lo
  encuentra en tres de ellas; en esta lo encontró una persona leyendo, que es
  justo lo que no escala. **116 commits sin fusionar en 30 días** es la causa de
  todas.

- **~~🟡 La política de cookies se quedó incompleta en un día~~ — HECHO el mismo día.** `[origen: guardian 2026-11-07 · hecho 2026-11-07]`
  Ver `## Hecho`. Lo que queda es la regla: **cuando él toque lo que el navegador guarda o lo que se cuenta, la política de cookies se revisa en el mismo turno.**
  Se publicó el 04-11 diciendo dos cosas que ayer dejaron de ser verdad, y las
  dos las cambió él en sus 22 commits del 06 y 07-11:

  1. **Hay una galleta nueva y el documento lista dos.** La prueba sin cuenta
     pone **`kairo_probar`** desde `api/probar/route.ts` —el valor es cuántas
     preguntas ha gastado el visitante—, con `Path=/`, **`Max-Age=2592000`** (30
     días), `SameSite=Lax` y **`HttpOnly`**. Es de Kairo, no de un tercero, y es
     la primera galleta que toca a alguien que **no tiene cuenta**: justo el
     visitante al que el documento le habla.
  2. **Y hay analítica**, cuando el documento dice *"no hay analítica"* y lo usa
     como argumento. La suya está en `lib/rastro.ts` y `0022_rastro.sql`:
     apunta `visita`, `prueba`, `prueba_agotada` y `registro` en una tabla de su
     propia base de datos, **sin IP, sin identificador de visitante y sin
     galleta**, y guardando el dominio de origen.

  **Y el matiz importa más que el dato, porque toca la conclusión del
  documento**: lo que escribí el 04-11 fue *"si algún día Kairo añade analítica
  […] esa ventana pasa a ser obligatoria"*. Leído a secas, hoy exigiría una
  ventana de cookies que **no hace falta**: lo que obliga a pedir permiso es la
  analítica que identifica o que va a un tercero, y la suya no hace ninguna de
  las dos. Así que el documento necesita tres cosas: la galleta nueva en su
  tabla, la analítica contada como lo que es, y esa frase rehecha para que
  distinga **analítica que sigue a una persona** de **contar sucesos sin
  personas**.

  Es del constructor, es de hoy, y **no necesita nada del dueño**.

- **~~🟡 Kairo+ vende 3 Co-Works y la base de datos deja 10~~ — HECHO POR EL DUEÑO el 10-11, y por la salida buena.** `[origen: guardian 2026-11-07 · hecho 2026-11-10, marcado 2026-11-11]`
  De las dos salidas que le dejó esta entrada —aplicar el tope por plan de
  verdad, o escribir 10 en la tarjeta— eligió la primera: `COWORKS_POR_PLAN`
  **1 / 5 / 25** en `planes.ts` y la migración `0023_topes_por_plan.sql`
  cortando los mismos números en el servidor. Kairo+ da **5** y la tarjeta
  dice 5, interpolado. Comprobado hoy en el HTML generado tras la fusión.
  Lo que decía esta entrada, de histórico:
  En su tarjeta nueva de Kairo+ pone **"3 Co-Works activos"**. El tope real
  sigue siendo **10 para todo el mundo** (`limitar_coworks()`,
  `0009_coworks.sql:350`, comprobado hoy en `main`), y en el plan gratuito **1**
  por la API (`api/coworks/route.ts:116`).

  **No lo he tocado y no lo cuento como falso contra el payer**: vender tres y
  dar diez es prometer menos de lo que hay, y eso no le cuesta dinero a nadie.
  Pero es una cifra de la web que el código no aplica, que es exactamente el
  tipo de cosa que esta cola existe para no perder de vista. **Dos salidas, las
  dos suyas**: o el tope por plan se aplica de verdad —y eso es código y
  migración— o la tarjeta dice 10, como Supreme.

- **🔴 Ha vuelto a `/precios` el "No" sobre entrenamiento, y en la capa gratuita de Gemini es falso.** `[origen: guardian 2026-11-06]`
  En su fusión del 05-11, la FAQ de `/precios` recupera la pregunta *"¿Se usan
  mis conversaciones para entrenar modelos?"* con la respuesta **"No."** (y en
  inglés *"No. And on child profiles…"*). Está en `main`, o sea **en
  producción**, en la página donde se decide pagar.

  **Por qué es falso hoy, con las dos piezas puestas una al lado de la otra**:

  1. La tabla de precios del proveedor tiene una fila *"Used to improve our
     products"* que dice **Yes** en la capa gratuita y **No** en la de pago
     (informe de mercado del 05-11).
  2. La cuenta de Kairo está **en la capa gratuita**: lo anotó `CONTEXTO.md` el
     25-10, sacado de un commit suyo que hablaba de *"Gemini's free tier"*.

  Esa frase ya se quitó una vez, el 21-10, por este mismo motivo, y el bloque
  `PRIVACIDAD` del prompt lleva desde el 24-10 escrito para **no** decirla. O
  sea que hoy **Kairo, en el chat, se niega a afirmar lo que su propia página de
  precios afirma**. De las dos, la que se puede comprobar es la del prompt.

  **Qué he hecho y qué no.** En la rama, al resolver el conflicto, **no me he
  llevado esa respuesta**: queda la verificable, la de "qué se guarda". `main`
  es suyo y ahí sigue lo suyo. **Lo que decide esto es una línea suya**: o paga
  la capa de la API —y entonces el "No." es verdad y lo pongo yo en los dos
  idiomas— o se queda la respuesta comprobable. Lo que no puede quedarse es como
  está.

- **~~🟡 La escala de créditos se dobló ayer, y todo el material de entrenamiento enseña la vieja~~ — HECHO el mismo día.** `[origen: guardian 2026-11-06 · hecho 2026-11-06]`
  **Arreglado por el constructor en el turno siguiente**, ver `## Hecho`. Lo que queda de este hallazgo es la regla que ha dejado escrita, no la tarea.
  Su commit del 05-11 (`4d9d13b`, migración `0020_escala_x2.sql`) multiplica por
  dos la escala entera: **rápido 2, normal 8, Forja 40, MEGA 240**; los planes,
  **40 al día** en el gratuito, **2.000** Kairo+ y **6.000** Supreme; y el regalo
  de bienvenida, de 150 a **300**. La proporción se mantiene, así que con la
  misma suscripción salen las mismas preguntas; lo que cambia son todos los
  números que tenemos escritos.

  **El prompt de Kairo no se ha enterado y está bien**, porque interpola
  `CREDITOS_NIVEL` y `CREDITOS_PLAN`. **Lo que está mal es lo nuestro**, que está
  a mano. Comprobado archivo por archivo hoy:

  | Archivo | Qué dice todavía |
  |---|---|
  | `agentes/ia/conocimiento/creditos-y-planes.md` | la tabla entera: 1/4/20/120, 20 al día, los 150 de regalo y la cuenta del primer día |
  | `agentes/ia/ejemplos/2026-11-03-limite-ayer-podia-usar-mega.md` | *"rápido 1, normal 4, Forja 20, MEGA 120"*, los 20 al día y la cuenta de los seis días |
  | `agentes/ia/ejemplos/2026-10-13-cuanto-gasta-mega.md` | *"Un Mega-Prompt gasta 120 créditos"* y *"te dan para ocho"* |
  | `agentes/ia/evals/banco-de-pruebas.md` | el **caso 7** espera como respuesta buena *"120 créditos; con 1.000 al mes son 8"* |

  **Y el último es el que más urge, aunque parezca el más pequeño**: el banco de
  pruebas lleva 14 días sin pasarse y es la tarea que el radar pide desde el
  31-10. Si se pasa hoy tal cual, **el caso 7 va a fallar por la escala vieja del
  banco, no por Kairo**, y eso enseña a desconfiar del banco. Antes de pasarlo
  hay que actualizar lo que el banco espera.

  Es trabajo del entrenador (áreas 3 y 5) y **no necesita nada del dueño**. El
  diario de entrenamiento **no se toca**: es histórico y dice lo que era verdad
  cada día.

- **Ayer se perdió el día entero: ninguno de los cuatro agentes corrió. Y la culpa no es de ningún agente.** `[origen: guardian 2026-11-03]`
  **Veintidós días sin perder un turno, y ayer se rompió la racha.** Lo digo con
  el dato: `git log --since=2026-11-02 --until=2026-11-03` sobre la rama devuelve
  **cero** commits. No hay parte del 02-11, no hay entrada de entrenamiento y no
  hay informe de mercado.

  **Qué pasó, y conviene que quede claro porque no es lo que parece**: los cuatro
  avisos **se dispararon a su hora** —guardián 06:22, entrenador 07:06,
  constructor 07:48 y crecimiento 09:21— y los cuatro **se quedaron en la cola**.
  El proceso de esta sesión se reinició varias veces y los turnos no se
  ejecutaron. Los he leído esta mañana, **entre veinte y veintitrés horas tarde**,
  los cuatro de golpe. O sea: **no falló ningún agente ni ninguna rutina; falló
  la máquina que los ejecuta.**

  **Y lo que sí aguantó, que es la mitad del hallazgo**: el reloj de Co-Works
  **no perdió un solo toque** durante el día perdido —ejecuciones 183 a 187, las
  cinco en verde, incluidas las de ayer a las 05:50, 15:36 y 23:13—. La
  maquinaria que vive en GitHub siguió sola; la que vive en esta sesión, no.
  **Conclusión incómoda y verdadera: lo que corre en GitHub es más fiable que lo
  que corre aquí**, y los cinco agentes viven aquí.

  **Lo que no voy a hacer**: escribir el parte del 02-11 ahora. Un parte con
  fecha de ayer escrito hoy es un registro falso, y este sistema vale justo lo
  que vale su registro. Queda un archivo que dice que el día se perdió y por qué.

  **El daño medible**, que es uno y se arrastra:
  **crecimiento se queda sin mirar el mercado del 29-10 al 05-11, siete días.**
  Su cron son los días 2, 5, 8… del mes, así que el turno perdido de ayer no se
  recupera: el siguiente es el **05-11**. Y esto **compone** con el hallazgo del
  01-11: aquel decía que el cron le deja un hueco de cuatro días cada mes; con el
  día perdido, el hueco de este mes es de **siete**.

  **Qué haría yo, y es lo mismo que ya está pedido**: lo del 01-11 —poner los
  cron **diarios** y que cada agente decida si le toca mirando la fecha de su
  último informe— arregla **las dos cosas a la vez**. Con cron diario, un turno
  perdido se recupera al día siguiente en vez de desplazar la serie o
  desaparecer. Hoy, un reinicio de la máquina borra un informe de mercado
  entero.
  Sigue siendo suyo: son tareas programadas y no están en el repositorio.

- **Los cuatro textos legales no existen, y el checklist los lleva en verde veinte días.** `[origen: constructor 2026-11-01]`
  Esto ha salido de anclar los cuatro enlaces del pie: al abrir `/legal` para
  ponerle los `id`, resulta que la página **dice de sí misma que está sin
  escribir**, en los dos idiomas: *"Pendiente de redactar antes del
  lanzamiento. Estos son los cuatro documentos necesarios."* Lo que hay son
  cuatro tarjetas con **una línea de descripción cada una** —"Titular del
  servicio, datos de contacto y condiciones de uso"— y nada más. Buscado en
  todo el repositorio: los cuatro textos **no están en ninguna parte**; lo que
  aparece en `docs/kairo/ESPECIFICACION.md` es la lista de los que hacen falta.

  **Y el problema de medición, que es la mitad del hallazgo**: el checklist de
  lanzamiento tiene la fila *"Enlace visible a los textos legales"* en **✅
  desde el 2026-10-12**, porque lo que comprobó —y lo dice su propia
  casilla— es que el **enlace** existe. **Veinte días en verde midiendo el
  enlace en vez del documento.** No es culpa del guardián: la fila está escrita
  así desde el primer día, y es exactamente lo que el radar lleva siete
  informes diciendo —que el checklist mide salud y no lanzamiento—. Pero
  conviene que quede claro: **hoy el checklist no tiene ninguna fila que
  pregunte si Kairo puede lanzarse legalmente.**

  **Por qué esto es P1 y no una mejora**: un servicio con cuentas, cobros,
  datos de menores y lectura de documentos con DNI dentro **no se puede lanzar
  en España sin aviso legal, política de privacidad, política de cookies y
  términos**. No es una casilla de calidad: es la condición para abrir.
  **Y hay dos cosas que lo hacen más urgente de lo que parecía**: la propia
  página promete un *"apartado específico para perfiles de menores"* —y el modo
  de edad existe de verdad en el código—, y el bloque `PRIVACIDAD` del prompt
  manda a Kairo decir, cuando alguien pregunta qué se hace con sus datos, que
  *"está en los textos legales y en la página de precios"*. **Hoy Kairo manda a
  leer unos documentos que no existen.**

  **Qué puedo hacer yo y qué no.** Puedo escribir los cuatro borradores: el
  constructor tiene permiso explícito sobre "los cuatro documentos legales"
  (ficha, apartado *Qué puedes tocar*), y la mayor parte sale del código
  —qué se guarda y qué no está medido en `agentes/ia/conocimiento/datos-y-privacidad.md`
  y en el bloque `PRIVACIDAD`—. **Lo que no puedo poner, y sin eso no valen**:
  el **titular del servicio** (nombre o razón social, NIF, domicilio y correo
  de contacto), el **encargado del tratamiento** y la **ley aplicable y el
  fuero**. Eso son datos suyos, no decisiones de redacción.
  **Es un día de trabajo en cuanto me dé esos cuatro datos**, y hasta entonces
  cualquier cosa que escriba lleva un hueco que es justo el que los hace
  legalmente válidos. **Lo pregunto en el parte de hoy.**

  **Partida el 2026-11-04, y el primer trozo está hecho.** Resulta que los
  cuatro no están igual de bloqueados: **la política de cookies se podía
  escribir entera hoy**, porque lo que Kairo pone en el navegador de quien la
  abre está en el código y se cuenta con los dedos —dos cookies de sesión de
  Supabase y cinco preferencias—. Escrita y publicada en `/legal/cookies`, en
  los dos idiomas (ver `## Hecho`, 04-11).

  Lo que queda, y es lo que sigue esperándote:

  - **Aviso legal** — es el que más datos tuyos necesita: casi todo él es la
    identificación del titular.
  - **Política de privacidad** — se puede escribir el 80% desde el código (qué
    se guarda, dónde, cuánto, cómo se borra, el apartado de menores), pero sin
    los **encargados del tratamiento** y sin el titular no vale.
  - **Términos del servicio** — planes, créditos y cancelaciones están medidos;
    falta la **ley aplicable y el fuero**, y una decisión tuya sobre qué pasa
    con los créditos comprados si cierras la cuenta.

  **Y el hueco se ha dejado de forma que rellenarlo sea un minuto**: los cinco
  datos viven ahora en un solo archivo, `kairo/src/app/legal/datos.ts`, vacíos.
  Se escriben ahí una vez y los cuatro documentos los usan. Mientras estén
  vacíos, cada documento **dice en su último apartado que faltan** en lugar de
  inventarse un titular; el de cookies ya lo hace, y dice exactamente cuáles.

- **El proveedor ha retirado `poolside/laguna-s-2.1:free`, y es la primera vez que esa comprobación salta.** `[origen: guardian 2026-11-01]`
  El log de hoy dice, literal: **"OJO, estos no existen en el proveedor:
  poolside/laguna-s-2.1:free"**. Es exactamente para lo que se escribieron esas
  líneas de `jq` el 22-10 —*"un nombre retirado o mal escrito no da error,
  simplemente nunca contesta"*— y en diez días es la primera vez que encuentran
  algo.
  **Medido, no supuesto**: lancé `buscar-modelo.yml` con "laguna"
  (ejecución 41280045642) y devuelve **cero modelos** con esa palabra en el
  nombre. Así que **no es la trampa del gemelo de pago** del 21-10: no es que
  haya desaparecido el `:free` y quede el de pago al lado esperando a que
  alguien borre el sufijo. **La familia entera se ha ido del catálogo.**
  **Qué hacer**: quitarlo de `KAIRO_EXTRA_MODELOS` en Vercel. Es variable de
  entorno, así que es suyo.
  **Qué importa y qué no**: es el **quinto de cinco**, o sea que solo entra
  cuando los cuatro de encima han fallado. No se cae nada hoy. Lo que se gana
  arreglándolo es que la cadena acabe donde dice acabar: hoy su último eslabón
  no existe, así que el día que de verdad se llegue hasta el final, el fallo
  será otro del que nadie se acuerda.
  **Y un detalle que anoto porque afecta a cómo se eligen los sustitutos**: a la
  misma hora, `/api/estado` dice que el proveedor ofrece **416** modelos y
  `buscar-modelo.yml` dice **452**. La diferencia es que el primero pregunta
  **con la clave** y el segundo al catálogo público. No sé a qué se debe el hueco
  de 36 —desde aquí no se ve— pero sí sé lo que significa en la práctica: **un
  modelo puede estar en el catálogo público y no existir para la cuenta de
  Kairo**, así que el veredicto que vale es el de `/api/estado`, que es el que
  compara contra lo que Kairo alcanza de verdad. Para lo de hoy da igual: cero
  en el público es cero en los dos.

- **~~Arregló el plan gratis él mismo en `main`, y eso creó el primer conflicto de fusión~~ — HECHO.** `[origen: guardian 2026-11-01 · hecho 2026-11-01, marcado 2026-11-03]`
  Lo resolvió el entrenador el mismo 01-11 al traer `main` (`3e31aa4`),
  aplicando la resolución que el guardián había dejado escrita esa mañana: de
  cada lado lo que el otro no tenía —suya la viñeta de los **150 de regalo**,
  nuestras la cifra leída de `CREDITOS_PLAN` y la del **1 Co-Work**—.
  **Lo marco hoy porque llevaba dos días hecho y sin marcar**, que es justo lo
  que el 29-10 mandó al constructor a repetir trabajo. Y la nota que importa:
  **el conflicto se resolvió sin que nadie decidiera con prisa**, porque un
  agente dejó escrito por la mañana lo que otro iba a necesitar por la tarde.
  Anoche publicó **`493c45c Stop the pricing page selling less free plan than
  there is`**, y con él contesta dos cosas que llevaban días preguntadas:
  - **Sí a los 150 de bienvenida.** El constructor preguntó el 30-10 si se
    anunciaban; él ha añadido la viñeta "**150 de regalo al registrarte**". La
    pregunta queda contestada, en commit y no en `notas.md`.
  - Y corrige lo que el guardián encontró el 30-10: 20 créditos y los dos
    modelos, con un comentario que dice *"vender MENOS de lo que das es un error
    más tonto que el contrario, porque lo paga la página de precios"*.

  **Pero lo hizo sobre las mismas líneas que el constructor ya había arreglado
  el 30-10**, así que ahora las dos versiones chocan. **Comprobado, no
  predicho**: `git merge --no-commit --no-ff origin/main` da
  `CONFLICT (content): kairo/src/lib/mock.ts`, y lo aborté sin tocar nada.
  Es el **primer conflicto en veintiún días**, y es la factura del patrón que el
  radar describió ayer: *actúa sobre los hallazgos pero no coge los arreglos*.

  **La resolución, escrita para que no se decida con prisa**, porque cada lado
  tiene algo que el otro no:
  - **Suyo**: la viñeta de los **150 de regalo** (es su decisión, y es la
    correcta) y el orden en que las puso.
  - **Nuestro**: que la cifra **salga del código** —`` `${CREDITOS_PLAN.free}
    créditos al día` `` en vez de `"20 créditos al día"`—. Su versión vuelve a
    escribir el número a mano, que es **exactamente lo que causó el fallo**: el
    15 estuvo mal cinco días en cinco sitios por eso.
  - **Nuestro también**: la viñeta "**1 Co-Work**", que es el tope real del plan
    gratis (`api/coworks/route.ts`, `solo_uno_gratis`) y que él no puso.

  Así que las seis líneas que deberían quedar son:
  ```ts
  es: [
    `${CREDITOS_PLAN.free} créditos al día`,
    "150 de regalo al registrarte",
    "Modelos rápido y normal: chat, Paperwork, Gist y Código",
    "1 Co-Work, que trabaja solo a su hora",
    …
  ```
  y su gemela inglesa igual, con `credits per day`, "150 free credits to start",
  "Fast and standard models: chat, Paperwork, Gist and Code" y "1 Co-Work,
  working on its own at its hour".
  **Para el primero que fusione hoy** —el entrenador a las 07:05 o el
  constructor a las 07:48—: es esto, y no hay que pensarlo.

- **Fusionar la rama de agentes. Ocho informes de ocho, 24 días, y hoy el segundo conflicto en cuatro días.** `[origen: radar 2026-10-31 · al día 2026-11-05]`
  **Lo del 05-11, que es un argumento nuevo y no una repetición.** Anoche
  entró con **12 commits** —la pantalla de inicio nueva, el PDF leído en el
  navegador, el saludo por horas, el semáforo de créditos— y esta mañana la
  rama ya no se fusionaba sola: **segundo conflicto del proyecto**, en
  `prompt.ts` y `mock.ts`. Resuelto hoy línea a línea y comprobado con `tsc`,
  `next build` y doce comprobaciones del contenido.

  **Y lo que ese conflicto ha enseñado, que es lo que vale la pena leer**: no
  es solo que nuestros arreglos no lleguen. **Es que también se pudren.** Una
  de las tres viñetas en conflicto la teníamos mal **nosotros**: decíamos
  "Archivos hasta 100 MB" cuando el tope real son **3 MB por archivo**
  (`ADJUNTOS.bytesPorArchivo`, `lib/tipos.ts:94`), y ha hecho falta su cambio
  de ayer para que saliera a la luz. Cuanto más tiempo pasa sin fusionar, más
  trozos de la rama describen una Kairo que ya no es la que hay.

  Cada día de retraso cuesta ahora dos cosas, no una: los arreglos que no se
  publican y las afirmaciones que envejecen sin que nadie las mire. **100
  commits**, 24 días.
  Esto no tenía entrada propia y debería haberla tenido desde el primer informe:
  estaba repartido dentro de otras tareas. Hoy va solo, porque hoy se puede
  demostrar qué cuesta.
  **87 commits, y el primero es del 11-10.** Lo que hay dentro y no lo lee nadie:
  - El **plan gratuito bien vendido**: el "15" perseguido por los cinco sitios
    donde vivía, incluida la página de registro y lo que ve Google. Producción
    sigue ofreciendo 15 créditos y "modelo rápido" cuando son 20 y llega al
    normal.
  - **"Co-Works ilimitados" y "Mentes ilimitadas", fuera.** Producción sigue
    vendiendo las dos a 24,99 €.
  - Las **dos frases falsas de `/sin-suscripcion`**, en la sección que se llama
    "Lo que no te vamos a contar".
  - **Team y Kairo Código en `CAPACIDADES`**, sin lo cual Kairo niega dos
    botones de su propia barra lateral.
  - `/memoria` en dos idiomas, los cuatro tonos medibles, el canje del 50% de
    las multas, la regla anti-inyección que ya no pelea con su Wikipedia.
  **Así que la frase que llevo siete informes diciendo mal, dicha bien**:
  fusionar no es un favor a los agentes. **Lo que hoy impide lanzar los planes
  de pago está arreglado y sin publicar.**
  **La versión mínima, por si el tamaño da miedo**: fusionar **solo `kairo/`** y
  dejar `agentes/` para otro día. Son los archivos de producto y **ninguno toca
  pagos, autenticación ni migraciones existentes** —eso está en el apartado 5
  del protocolo y los agentes no lo tocan nunca—. El `main` de anoche ya está
  dentro de la rama y los dos últimos merges entraron limpios.

- **~~Dos topes por plan que la web vende y el código no aplica, y una función que se vende y no existe~~ — HECHO POR EL DUEÑO el 10-11, las dos partes.** `[origen: constructor 2026-10-31 · hecho 2026-11-10, marcado 2026-11-11]`
  **Las Mentes por plan**: ahora se aplican, `MENTES_POR_PLAN` **3 / 30 / 150**
  con la 0023 cortando igual. Eligió la salida (a), la de código y migración,
  no la de retocar el texto. **Los conectores**: las dos viñetas que vendían
  una función que es un `BotonAunNo` **han desaparecido** de las tarjetas;
  comprobado hoy en el HTML de `/precios`, donde ya no aparece la palabra.
  Esta entrada tenía 11 días y decía, de histórico:
  Salieron de barrer la palabra "ilimitado" por todo el código, que es lo que
  faltaba por hacer después de arreglar la de Supreme. Las tres son suyas
  porque las tres son "cómo se vende", no un dato falso contra quien paga.

  **1. Las Mentes por plan no se aplican.** El tope real es **30 para todo el
  mundo** (`limitar_mentes()`, `TODO_DE_UNA_VEZ.sql:82-93`), no consulta el plan,
  y **no hay ningún otro tope en ninguna parte**: ni en `api/mentes/route.ts`,
  ni en `lib/mentes.ts`, ni en las acciones. Lo confirma el propio producto: el
  aviso que ve el usuario es "Has llegado al máximo de **30** Mentes"
  (`mente.errLimit`).
  La web vende: Free "**1 Mente propia**", Kairo+ "**10 Mentes**", Supreme
  "~~Mentes ilimitadas~~ → **30**" (esa la he corregido hoy, porque era falsa
  contra quien paga).
  **Las otras dos no las toco**, y el motivo es el mismo que el de ayer con los
  150 de bienvenida: poner 30 en el plan gratuito es **regalar lo que nadie
  decidió regalar**, y puede que esos topes por plan estén pensados y solo falte
  implementarlos. **Dos salidas**: (a) se aplican de verdad —y entonces hace
  falta un tope por plan, que es código y migración suyos—, o (b) se corrige el
  texto a 30 en los tres, y eso lo hago yo en diez minutos.

  **2. Los conectores se venden y no existen.** Kairo+ (9,99 €) dice "**5
  conectores**" y Supreme (24,99 €) "**Todos los conectores**". Y
  `(app)/conectores/page.tsx` sigue siendo un escaparate con `BotonAunNo`
  (líneas 6 y 40). Lo dice hasta la propia pantalla de Team: *"todavía no puede
  abrir tus archivos —eso llegará con Conectores—"*.
  **Esto no es un número mal copiado: es una función que alguien que paga hoy no
  tiene.** Y no la arreglo yo porque las tres salidas son decisiones suyas:
  decir "cuando lleguen", quitar la viñeta, o dejarla como promesa de hoja de
  ruta con esa palabra dentro. **Lo que no se puede dejar es sin marcar**, que es
  como está: un plan de pago que lista una función como si ya estuviera.
  **Si dice "márcalas como que llegan"**, son dos viñetas y diez minutos.

- **El repuesto de búsqueda cambió anoche y ahora cuesta entre 2,6 y 4,4 veces menos. Medido.** `[origen: guardian 2026-10-31]`
  No está en ningún commit suyo: la lista de modelos de respaldo es una
  **variable de entorno de Vercel** (`KAIRO_EXTRA_MODELOS`), así que esto solo
  se ve en el log de `revisar.yml`. Hoy la cadena tiene **cinco** modelos y
  **manda uno nuevo**:

  | | Antes (desde el 26-10) | Desde anoche |
  |---|---|---|
  | Repuesto 1, el que entra cada tarde | `deepseek/deepseek-v4-flash-0731` | **`openai/gpt-6-luna`** |
  | Entrada / salida por millón | $0,44 / $1,32 | **$0,10 / $0,50** |

  **Medido hoy con su propio `buscar-modelo.yml`** (ejecución 41175776203), no
  supuesto: `openai/gpt-6-luna` sale a **$0,1/M de entrada y $0,5/M de salida**,
  con 1.050K de contexto. O sea **4,4 veces más barato de entrada y 2,6 de
  salida** que el que estaba. Es la primera vez en esta historia que el coste
  baja, y bajó sin que nadie lo pidiera por escrito.

  **Lo que sigue abierto, y por eso esto no cierra el P1 del 26-10**:
  1. **No hay tope de gasto en OpenRouter.** Sexto día pidiéndolo. Que el
     modelo sea más barato no acota nada: solo mueve la pendiente.
  2. **La mitad de la factura no depende del modelo.** El plugin web de
     OpenRouter se cobra **por resultado** —unos 2 céntimos por consulta con 5
     resultados, `(sin confirmar para 2026)`— y eso es igual con luna que con
     deepseek.
  3. **`deepseek-v4-flash-0731` sigue en la lista**, ahora en segundo lugar, así
     que el de $0,44/$1,32 continúa siendo alcanzable.

  **Y una trampa que conviene no pisar al "optimizar"**: hay cuatro modelos con
  `gpt-6-luna` en el nombre, y los dos `:batch` son más baratos —$0,05/$0,25—
  pero el propio workflow los marca **NO SIRVE PARA CHATEAR**. Es la misma
  trampa que los gemelos `:free` del 21-10: el nombre casi igual y el
  comportamiento distinto.

- **Me corrijo: "la portada promete tres cerebros y en producción solo hay uno" ya no es verdad en MEGA.** `[origen: guardian 2026-10-31, corrige el P1 del 2026-10-16]`
  Lo he comprobado leyendo el código de anoche, y cambia un hallazgo que llevo
  **dieciséis días** repitiendo.

  El dueño publicó *"Count a gateway model's real house when picking the MEGA
  team"*. Lo que hace es `casaDe()` en `mega.ts:128`: de `extra:openai/gpt-6-luna`
  saca la casa **openai**, y de `claude:claude-opus-5-5` y
  `extra:anthropic/claude-haiku-5.5` saca **anthropic** en los dos, "que lo son:
  si tienes las dos puertas abiertas". Antes contaba por proveedor, así que todo
  lo que entraba por la pasarela era "la misma casa" y **MEGA fichaba a uno y
  rellenaba con Geminis** —su propio comentario lo dice—.

  **Qué equipo sale hoy, siguiendo la cadena a mano**: `cadenaDe("mega")` es
  `CADENAS.mega` + `modelosExtra()` filtrado por claves
  (`config.ts:144-147`). Sin clave de Claude ni de GPT, de `CADENAS.mega`
  sobreviven solo los Gemini; detrás van los cinco de la pasarela **en el orden
  de la variable**, que `modelosExtra()` conserva (`proveedores.ts:131-137`) y
  que el log imprime. `elegirEquipo()` recorre y coge una casa de cada:

  > **google** (`gemini-pro-latest`) + **openai** (`gpt-6-luna`) + **deepseek**

  **Tres casas de verdad, y dos no son Google.** Así que lo que vengo diciendo
  desde el 16-10 era cierto hasta anteanoche y hoy ya no lo es del todo: en los
  niveles normales sigue siendo Gemini con repuestos, pero **un Mega-Prompt ya
  pregunta a tres casas distintas**.

  **Y de aquí sale lo mejor de hoy, que es una palanca de un minuto**:
  `anthropic/claude-haiku-5.5` es el **cuarto** de la variable, detrás de
  deepseek, así que **no entra en el equipo**. Si en `KAIRO_EXTRA_MODELOS` se
  pone **Claude delante de deepseek**, el equipo de un MEGA pasa a ser
  **Gemini + GPT + Claude**, que es *literalmente* lo que promete la portada
  —"Claude · Gemini · GPT, en una sola suscripción"—, **sin comprar ninguna
  clave nueva y sin tocar una línea de código**. Es reordenar una variable en
  Vercel.
  **Lo que seguiría sin ser verdad, y hay que decirlo**: la portada dice que
  Kairo "usa los tres mejores modelos del mundo y elige el adecuado para cada
  tarea", y eso describe el enrutador, no el MEGA. Rápido, Normal y Forja
  seguirían siendo Gemini. La frase honesta sería que **el Mega-Prompt** usa
  tres casas; el resto, una.

- **Anoche mejoró el plan gratis en el código, y la página seguía vendiendo el de antes** — **lo mío, hecho**; queda lo suyo. `[origen: guardian 2026-10-30 · hecho en parte 2026-10-30]`
  **Hecho hoy por el constructor** (detalle en `## Hecho`): el 15 estaba en
  **cinco** sitios, no en dos —el guardián encontró dos—, y los cinco leen ya
  `CREDITOS_PLAN.free`, salvo uno que no puedo tocar. Corregidas también las
  dos viñetas falsas del plan gratuito y añadido el tope real de 1 Co-Work.
  **Lo que sigue siendo suyo, y son dos líneas**:
  1. **¿Se anuncian los 150 créditos de bienvenida?** Existen en el código
     (`nivelesDe()` en `planes.ts`) y abren Forja y MEGA mientras duran, o sea
     que dan para probar **un MEGA**. Yo no lo he puesto porque anunciar un
     regalo es decidir cómo se vende, no corregir un dato. Se contesta con un sí.
  2. **Una línea en `(auth)/registro/page.tsx`**, que es zona prohibida del
     apartado 5. El texto de la página de registro —el sitio exacto donde
     alguien decide— sigue con la cifra escrita a mano; hoy la he puesto en 20
     para que al menos sea verdad, pero para que la lea del código hace falta
     cambiar `t("auth.registerSub")` por `t("auth.registerSub").replace("{n}", …)`
     ahí dentro. Lo hago yo en diez segundos con su permiso.

  Esto es lo contrario del P1 de ayer y es el mismo problema: **la copia de los
  planes y el código se han separado**, y hoy va en contra de Kairo, no del
  usuario. El dueño publicó anoche *"Let a free account actually try Kairo, and
  taste the best of it once"*, y es un cambio bueno y grande. Lo que no cambió
  es lo que se lee en la web.

  | Lo que vende `lib/mock.ts` (Free) | Lo que hace el código |
  |---|---|
  | "15 créditos al día" | **20** (`planes.ts:10` y `0019_plan_gratis.sql`: `set creditos = 20`) |
  | "Modelo rápido" | **rápido Y normal** (`planes.ts`: `free: ["fast", "normal"]`), o sea que **Code, Gist y Paperwork ya funcionan gratis** |
  | nada | **150 créditos de bienvenida que no caducan**, y mientras duran abren **Forja y MEGA**: dan para probar **un MEGA**, que cuesta 120 (`nivelesDe()` en `planes.ts`) |
  | nada | el tope real de Co-Works en gratis es **1** (`api/coworks/route.ts`: `if (perfil.plan === "free") … >= 1 → 409 solo_uno_gratis`) |

  **Lo que esto le cuesta hoy**: la puerta de Kairo es mejor de lo que su propia
  página dice. Quien entre en `/precios` lee que gratis son 15 créditos y el
  modelo rápido, y por tanto que **no puede probar Paperwork ni Código**, que es
  justo lo que acaba de abrirse. Es la mejora mejor contada del mes y no está
  contada en ninguna parte.

  **Y una parte es culpa mía, así que la digo primero**:
  `kairo/src/app/sin-suscripcion/contenido.tsx:13` tiene
  `const GRATIS_AL_DIA = 15;` **escrito a mano**, en la página que el
  constructor publicó el 28-10 presentándola como *"la primera que lee sus
  cifras del código"*. Leía `plans`, `creditPacks` y `CREDITOS`, y dejó fuera
  justo la cifra más importante. **Un día después ya estaba mal.** El arreglo es
  el que esa página decía que hacía: leerlo de `CREDITOS_PLAN.free`.

  **Lo que sí funcionó, y es el argumento de cómo arreglar lo demás**: el bloque
  de precios del prompt lee `CREDITOS_PLAN` de verdad, así que **Kairo ya está
  diciendo 20 sin que nadie haya tocado nada**. El código no envejece; el texto
  copiado a mano, sí.

  **Qué hacer, y casi todo es del constructor**: las tres viñetas del Free y la
  del tope de 1 son texto de `mock.ts`; el `GRATIS_AL_DIA` es una línea. Lo
  único que no es mío ni suyo es si el plan gratis debe anunciar los 150 de
  bienvenida y el tope de 1 —eso es decidir cómo se vende—, y se contesta con un
  sí.

- **~~Supreme vende "Co-Works ilimitados" y la base de datos para a 10~~ — HECHO.** `[origen: crecimiento 2026-10-29 · hecho 2026-10-31]`
  Hecho por la vía que avisé en el parte del 30-10: pedí la decisión —corregir
  el texto o subir el tope—, dije que sin respuesta hoy pondría el texto, y
  `notas.md` sigue vacío. **Supreme y Kairo+ dicen ahora "10 Co-Works
  activos"**, que es lo que hace `limitar_coworks()`. Detalle en `## Hecho`.
  **Si prefiere la otra salida**, subir el tope para Supreme sigue en pie: es
  una migración suya y las dos cosas no se estorban, solo habría que volver a
  tocar esa viñeta —y entonces deja de ser un número fijo y pasa a depender
  del plan, que es otro trabajo, no un retoque—.
  Medido en el repositorio, no buscado fuera, y los dos sitios se contradicen.
  Lo que vende `kairo/src/lib/mock.ts` (`plans`):
  - Free, 0 €: **no los menciona**.
  - Kairo+, 9,99 €/mes: "**3 Co-Works activos**" / "3 active Co-Works".
  - Supreme, 24,99 €/mes: "**Co-Works ilimitados**" / "Unlimited Co-Works".

  Lo que hace `limitar_coworks()`:
  ```sql
  select count(*) into cuantos from public.coworks where perfil_id = new.perfil_id;
  if cuantos >= 10 then
    raise exception 'Has llegado al máximo de 10 Co-Works.' using errcode = 'P0001';
  ```
  **Diez, para todo el mundo, sin consultar el plan.** Idéntico en las dos
  migraciones que lo definen (`TODO_DE_UNA_VEZ.sql:1058-1080` y
  `0009_coworks.sql:339-361`), y es un `trigger before insert`, así que no hay
  API que lo esquive. Buscado un `plan` en `api/coworks/` y `lib/coworks/`: el
  único que aparece viaja para armar el prompt, no para el tope.
  **Por qué es P1 y no una errata**: es la única cosa de todo el informe de hoy
  que puede acabar en una devolución. Quien paga 24,99 € por "ilimitados" se
  choca con el número diez. Y de propina, el de 9,99 € está usando un tercio de
  lo que compró porque la página le dijo que tenía 3.
  **No lo toco yo**: los planes y lo que cobran están en el apartado 5 del
  protocolo. **La decisión es de una línea y tiene dos salidas**:
  1. **Se corrige el texto** —Supreme pasa a "10 Co-Works", igual que los
     demás— y eso lo hace el constructor en diez minutos, porque es texto de
     `mock.ts`. Pero deja a Supreme sin nada que lo distinga aquí.
  2. **Se sube el tope para Supreme**, y entonces hay que tocar la función de la
     base de datos para que mire el plan. Eso es una migración nueva y es suya.
  **Y mientras se decide, lo que no se puede dejar es la frase "ilimitados"**,
  porque es la única de las tres que es falsa en contra del que paga.
  Detalle y cuentas en `agentes/mercado/2026-10-29-mercado.md`.

- **~~Team contrata de verdad desde anoche, y el prompt no sabe qué es un Team~~ — HECHO.** `[origen: guardian 2026-10-29 · hecho 2026-10-29]`
  Lo cerró el entrenador el mismo día, dos horas después de encontrarlo: viñeta
  **Team** en `CAPACIDADES` (`kairo/src/lib/ia/prompt.ts`), escrita desde el
  código y no desde el titular —un miembro es un Co-Work de tipo `encargo`, de
  ahí salen el tope de diez, el no buscar de fábrica y el precio—. Comprobado
  en tres capas (estructural 9/9, arnés 40/40, `tsc` y `next build` a 0).
  Commit `701e6eb`. El detalle queda en `agentes/ia/diario-entrenamiento.md`.
  Lo que **no** entró, a propósito, es lo de las cláusulas abusivas: eso es el
  P1 de abajo y lo decide el dueño.
  Es la tercera vez que pasa lo mismo en el mismo sitio, y esta vez lo dice el
  propio comentario del bloque.
  Anoche el dueño publicó nueve commits, y dos cambian lo que Kairo **es**:
  *"Make Team hire for real, as a Co-Work the owner writes himself"* y *"Let a
  hired job look things up, if its owner says so"*. Con ellos van dos
  migraciones nuevas, `0017_team.sql` y `0018_encargo_busca.sql`.
  **Qué he comprobado**, no supuesto:
  - `git show origin/main:kairo/src/app/(app)/team/page.tsx | grep -c BotonAunNo`
    da **0**. Hasta ayer esa pantalla era un escaparate con botones de "aún
    no"; hoy el botón de Contratar lleva a
    `/coworks?puesto=…&contratar=…` con el encargo ya escrito
    (`team/page.tsx:114`). Contratar a alguien **crea un Co-Work de verdad**.
  - `grep -in "team\|equipo" kairo/src/lib/ia/prompt.ts` no devuelve **nada**.
    `CAPACIDADES` habla de Co-Works (línea 126) y no menciona Team.
  **La regla que esto rompe la escribió el propio archivo**, en el comentario
  de `CAPACIDADES` (líneas 103-105): *"una capacidad que no esté escrita es una
  capacidad que Kairo negará tener"*. Y tres líneas más abajo está contado el
  26-10, cuando pasó con Kairo Código y lo encontró el guardián. Hoy es igual:
  hay un botón en su propia barra lateral que contrata a un abogado, y si
  alguien le escribe *"¿qué es el Team?"* o *"quiero contratar a alguien"*,
  Kairo dirá que eso no existe.
  **Para el entrenador**, y lo que se escriba sale de leer el código, no el
  titular: Team **no es una Mente** —lo dice el comentario del archivo: una
  Mente cambia *cómo* responde, un miembro del Team se encarga de *un trabajo*,
  es un puesto—; contratar **crea un Co-Work** que se ejecuta a la hora
  elegida y deja el trabajo hecho en un chat; y **todavía no puede abrir tus
  archivos**, eso llega con Conectores (`team/page.tsx:149`). Hay cuatro
  puestos: Abogado, Contable, Comercial y Administrativo. Antes de escribirlo,
  leer `(app)/team/page.tsx` y `lib/coworks/recetas.ts`.
  Las dos migraciones están en `main`, así que la tabla existe; si están
  aplicadas en producción no lo puedo ver desde aquí (`/revision` pide cuenta):
  ⚪, no 🔴.

- **La ficha del Abogado promete señalar cláusulas abusivas; `/contratos` dice que Kairo no hace eso.** `[origen: guardian 2026-10-29 · la decisión la pidió crecimiento el 2026-10-23]`
  Las dos frases están hoy en producción, a la vez. Literales:
  - `(app)/team/page.tsx:21` — *"Revisa contratos, señala cláusulas abusivas y
    te las explica sin latinajos"*. Y el encargo que se le manda al Co-Work
    (línea 20) le pide explicar *"cuándo es abusiva"*, **cada día**.
  - `/contratos`, la página de intención escrita el 23-10, dice que Kairo
    **no** juzga si un contrato es bueno, malo o abusivo.
  **No es un desliz de redacción, es la decisión que quedó sin tomar.**
  Crecimiento la planteó el 23-10, la página pública la contestó de una manera
  y el producto por dentro la contesta de la otra. Mientras eran una página y
  un escaparate, la contradicción no llegaba a nadie. Desde anoche el
  escaparate contrata.
  **Y pesa más de lo que parece**: "abusiva" es una calificación jurídica, y
  `/contratos` la evita a propósito. Si la ficha la promete, el Co-Work la
  entrega **todos los días a la hora elegida y por escrito**, que es bastante
  más difícil de desdecir que una respuesta en un chat.
  **No la decido yo. Hay dos salidas, y la única que no vale es dejar las dos:**
  1. Kairo **sí** señala cláusulas abusivas, y entonces hay que reescribir
     `/contratos` y decir con qué límites.
  2. Kairo **no** lo hace, y entonces hay que reescribir la ficha del Abogado
     y su encargo —que es lo que ya dice la página.
  Una línea en `agentes/notas.md` basta: "el abogado sí señala abusivas" o "no".

  **Hay una tercera, y me corrijo: es mejor que las dos que escribí yo**
  `[crecimiento 2026-10-29]`. No hace falta elegir entre prometerlo y callarse:
  **Kairo te dice qué dice tu cláusula y qué exige la ley, señala lo que falta y
  lo que no cuadra, y no te pone una nota de riesgo ni te firma que algo es
  abusivo.** Sostiene las dos cosas a la vez, no contradice a `/contratos`, y la
  ficha del Abogado puede prometerlo sin mentir.
  **Y no es un invento mío para salir del paso**: una de las comparativas del
  propio sector advierte de que estas herramientas detectan **cláusulas
  ausentes e incoherencias** pero **no juzgan si un trato es bueno**, y
  recomienda llevar sus alertas a un abogado en los contratos que importan
  ([kissmyskills](https://kissmyskills.com/es/blogs/news/ai-contract-review-tools-compared)).
  Para calibrar: una revisión legal básica con abogado se cita en **150-400 €**.
  **Lo que cambia si se elige la primera salida**, y conviene saberlo antes: ahí
  compiten Prudencia AI (riesgos **por gravedad y con la norma**), ClausIA (**3
  análisis gratis sin registro**) y precioalquiler (**9,99 € el análisis**), y
  arriba Maite.ai a 99-120 €/mes con derecho español nativo —los tres últimos
  `(sin verificar)`—. Donde **nadie** compite es en lo otro: ninguna es un
  abogado que **vuelve solo cada día**. Detalle en
  `agentes/mercado/2026-10-29-mercado.md`.

- **El respaldo ya no es gratis, y desde hoy se dispara cada tarde: el repuesto de búsqueda cuesta tokens + unos 2 céntimos por consulta.** `[origen: guardian 2026-10-26 · agravado 2026-10-27]`
  **Lo de hoy, y cambia lo que ayer era una sospecha de coste en un gasto
  diario.** El dueño publicó anoche seis commits que arreglan justo lo que
  notaron los cuatro usuarios —que Kairo contesta de memoria cuando se agota
  la cuota—, y para eso ha montado una escalera de repuestos de búsqueda. El
  log de hoy la enseña por primera vez:
  - **Repuesto 1 (web de pago, "la que sabe lo de ayer"): SÍ, con
    `deepseek/deepseek-v4-flash-0731`.**
  - Repuesto 2 (Claude): no, falta `ANTHROPIC_API_KEY`, y es opcional.
  - Repuesto 3 (Wikipedia): siempre, no se agota, pero solo sabe de lo
    asentado.
  **Por qué esto es peor que lo de ayer**: ese `-0731` es el modelo que medí
  ayer a **$0,44/M de entrada y $1,32/M de salida**, el más caro de las cuatro
  variantes de su familia. Ayer solo era el respaldo del chat, que entra
  cuando todo lo demás falla. **Hoy es el buscador de repuesto, y ese entra
  cada tarde**, en cuanto se acaba la cuota gratuita de Gemini: no es un caso
  raro, es la segunda mitad de cada día.
  **Y encima no paga solo tokens.** Su propio código llama al plugin web de
  OpenRouter con `plugins: [{ id: "web", max_results: 5 }]`
  (`kairo/src/lib/ia/buscar-web.ts:516` en su rama). Ese plugin se cobra
  **aparte de los tokens, por resultado**: la referencia que he encontrado es
  de **$4 por 1.000 resultados, o sea unos 2 céntimos por consulta con 5
  resultados**, y está servido por Exa
  ([Simon Willison, marzo 2025](https://simonwillison.net/2025/Mar/10/llm-openrouter-04)).
  **`(sin confirmar para 2026)`**: no he podido abrir la página de precios de
  OpenRouter desde aquí, así que el orden de magnitud vale y la cifra exacta
  hay que verla en su panel. El plugin ofrece varios motores (`auto`,
  `native`, `exa`, `firecrawl`, `parallel`) y el precio puede depender del que
  se use ([docs de TanStack](https://tanstack.com/ai/v0/docs/adapters/openrouter)).
  **Lo que yo haría hoy, por orden**: (1) un **tope de gasto en OpenRouter**,
  que es de dos minutos y es lo único que acota esto; (2) mirar si el `-0731`
  es a propósito, porque `deepseek/deepseek-v4-flash-latest` cuesta **$0,05/M
  y $0,16/M** —nueve veces menos— y para resumir cinco resultados de búsqueda
  da igual de bien; (3) las tres líneas de `jq` del 22-10, que llevan seis
  días y que habrían cantado esto sin que nadie lo midiera a mano.
  **Y lo que no voy a decir**: que esto esté mal hecho. Es lo contrario: es el
  arreglo del fallo que reportaron los usuarios, y además deja Wikipedia
  debajo como red que no se agota. Lo que falta no es el diseño, es **el
  tope**.
  La cadena de respaldo de OpenRouter ha cambiado. Leído del log de
  `revisar.yml` de hoy (ejecución 40278871292, 06:16 UTC), los configurados son
  ahora **cuatro** y **dos no llevan `:free`**:

  | Modelo | Precio, medido hoy | |
  |---|---|---|
  | `deepseek/deepseek-v4-flash-0731` | **$0,44/M entrada · $1,32/M salida** | **el primero de la cadena** |
  | `anthropic/claude-haiku-5.5` | **$0,10/M · $0,50/M** | de pago |
  | `nvidia/nemotron-3-ultra-550b-a55b:free` | $0 | gratis |
  | `poolside/laguna-s-2.1:free` | $0 | gratis |

  Medido con **su propio** `buscar-modelo.yml` (ejecuciones 40278943938 y
  40278972899), no de memoria. Y sale del `thinkingmachines/inkling:free` que
  estaba el 21-10.
  **Esto puede ser a propósito**: un respaldo de pago responde mejor que uno
  gratis, y él tiene saldo en OpenRouter. No lo marco como roto. Lo marco como
  **invisible**, que es distinto y es nuestro problema:
  1. **El log no dice los precios.** El 22-10 se construyó en `/api/estado` que
     los devuelva y se le pidieron **tres líneas de `jq`** para que el guardián
     los viera cada mañana. Siguen sin pegarse (cuarto día), **así que este
     cambio no lo ha cantado el sistema: lo he tenido que medir a mano**. Con
     esas tres líneas, mañana sale solo.
  2. **No hay topes de gasto** en ningún proveedor (sexto informe del radar, 12
     días). Un respaldo de pago sin tope es justo lo único que puede costar
     dinero de un día para otro.
  3. **Y hay un dato que conviene mirar antes de dejarlo así**: de los cuatro
     `deepseek-v4-flash` del catálogo, el elegido —`-0731`— es **el más caro de
     los cuatro**. `deepseek/deepseek-v4-flash-latest` cuesta **$0,05/M y
     $0,16/M**: nueve veces menos de entrada y ocho de salida. Si lo que se
     quería era un deepseek flash de pago, el `-latest` hace lo mismo por una
     novena parte. **Eso sí que parece un descuido de nombre**, del mismo tipo
     que el `:free` que destapamos el 21-10.

  **Hecha la parte nuestra el 26-10: el panel del respaldo ya no dice que sea
  gratis.** `/revision` es la página que Kairo tiene para contarle al dueño qué
  le pasa a su instalación, y ese panel estaba escrito entero suponiendo un
  respaldo gratuito: se titulaba **🆓**, decía *"modelos gratis de OpenRouter,
  que no cuestan nada"* y su aviso final hablaba solo de los límites de los
  gratuitos. Con dos modelos de pago en la cadena, **ese panel describía una
  instalación que no es la que corre**. Cambiado en
  `kairo/src/app/revision/page.tsx`:
  - El título pierde el 🆓, que afirmaba el precio.
  - Donde ya hay respaldo puesto, dice que **que cueste dinero o no depende de
    qué modelos haya**, que solo son gratis los que acaban en `:free`, y
    **dónde mirarlo**: `cerebros.extra` de `/api/estado` trae los configurados
    con su precio por millón, y `buscar-modelo.yml` saca el nombre y el precio
    exactos de cualquiera.
  - La nota de la instalación lleva ahora **la trampa escrita**: copia el
    nombre entero con el `:free`, porque casi todos tienen un gemelo de pago
    con el nombre idéntico menos ese sufijo, y perderlo **no da ningún error,
    empieza a cobrar**. Es lo que medimos el 21-10 y lo que ha vuelto a pasar.
  - Y el aviso final cubre los dos casos: los gratuitos van lentos y con topes
    duros; los de pago responden mejor **y el respaldo tiene factura**, así que
    conviene un tope de gasto en OpenRouter antes de dejarlo así.
  Comprobado con `tsc --noEmit` 0, `next build` 0 y **leyendo el bundle del
  cliente**, que es donde tiene que estar porque el panel solo se pinta cuando
  `/api/revision` ha contestado: las cuatro frases nuevas viajan y las viejas
  ya no. (La frase "que no cuestan nada" sigue en el bundle a propósito: está
  en la rama de "todavía no hay respaldo", donde invita a poner los gratuitos y
  es verdad.)
  **Lo que queda y es suyo**: las tres líneas de `jq` para que el guardián vea
  el precio cada mañana sin medirlo a mano, y un tope de gasto en OpenRouter.

- **~~Kairo Code existe en producción y el prompt no sabe que existe~~ — HECHO.** `[origen: guardian 2026-10-26 · hecho 2026-10-26]`
  Lo cerró el entrenador el mismo día: `CAPACIDADES` ya describe Código —un
  archivo, se ejecuta en el navegador, JS/Python/HTML, el error vuelve solo— con
  los límites copiados de la cabecera que escribió el dueño, y el bloque de
  precios dice que cuesta 4 créditos y que **cada arreglo cuesta otros 4**.
  Comprobado con el arnés: la capacidad no es condicional y sale en las tres
  configuraciones. **Quedaba sin marcar aquí**, que es un fallo de libro mío:
  un backlog que enseña como abierto algo cerrado hace perder el tiempo al
  siguiente que lo lea. Marcado el 27-10.
  El dueño ha publicado ayer una función nueva entera: *"Add Kairo Code: ask for
  an app, watch it written, see it run"* (`c52031d`), con su ruta
  `kairo/src/app/(app)/code/page.tsx` y unas **1.100 líneas** nuevas
  (`Editor.tsx`, `ejecutar.ts`, `despliegue.ts`, `resaltar.ts`).
  **El problema**: el bloque `CAPACIDADES` de `kairo/src/lib/ia/prompt.ts` **no
  la menciona**, y ese bloque dice de sí mismo, literalmente, que *"una
  capacidad que no esté escrita es una capacidad que Kairo negará tener"*. Así
  que hoy, si alguien le pide a Kairo que le haga una app, **Kairo contesta que
  no sabe hacer eso** mientras hay un botón en su propia barra lateral que lo
  hace.
  **Arreglo**: dos o tres líneas en `CAPACIDADES`, del entrenador, en cuanto la
  rama tenga el código delante. Hace falta **mirar `/code` y `ejecutar.ts`
  primero** para describir lo que hace de verdad —y sobre todo sus límites— y no
  prometer de más, que es el error contrario y peor.
  **Y una consecuencia para el constructor**: la rama va **8 commits por detrás
  de `main`** y uno de ellos toca `i18n.tsx`, que es donde el constructor ha
  trabajado el 24 y el 25. Toca traer `main` antes de seguir, como el 18-10 y el
  22-10: lo que se comprueba con `next build` sobre una rama vieja se comprueba
  contra una app que ya no existe.

- **~~Kairo deja de buscar cada día a media tarde~~ — HECHO POR EL DUEÑO, en menos de 24 h.** `[origen: guardian 2026-10-25 · hecho 2026-10-26]`
  **El log de hoy dice `Gemini: 3 clave(s)`** y el aviso de "con una sola, la
  cuota gratuita se agota a media tarde" ha desaparecido, porque el código solo
  lo saca cuando hay una. Pidió el 25-10 a las 06:14 y estaba puesto el 26-10 a
  las 06:16: **es la primera vez que algo que pedimos se arregla en el mismo
  día**, y vale la pena decirlo tan alto como se dicen los retrasos. Lo que
  sigue abierto de este asunto es solo la mitad del entrenador, ya hecha el
  25-10: que Kairo avise cuando contesta de memoria.
  Lo de abajo queda como estaba, para que se vea de dónde venía.
  Lo dice el propio dueño en el commit `688ecb2` de ayer (*"Say how many Gemini
  keys are in use"*), y hoy lo confirma el log de `revisar.yml`:
  **"Gemini: 1 clave(s) · con una sola, la cuota gratuita se agota a media tarde
  y deja de buscar"**.
  Su mensaje de commit explica el mecanismo y añade dos cosas que nadie de este
  sistema sabía: *"Gemini's free tier counts quota per key **and per model**, so
  with a single key there is an hour of the day when the search stops working
  and Kairo answers from memory instead — which is exactly what happened today,
  and what **four "it gives me old data" reports** were really about"*, y
  *"the code has taken **up to five keys** for a long time"*.
  **Por qué es P1**: hay una parte de cada día en la que Kairo contesta de
  memoria mientras el prompt lleva el bloque `BUSCAS ANTES DE CONTESTAR`
  —o sea, el prompt le dice que tiene buscador cuando ya no lo tiene—, y eso
  es justo el fallo del que se queja la gente.
  **El arreglo es de dos minutos y no cuesta nada**: el código ya lee
  `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` y `GEMINI_API_KEYS` (separadas por
  comas) — `kairo/src/lib/ia/claves.ts:41-46` y `kairo/src/lib/coworks/salud.ts:360-363`—.
  Dos claves más de AI Studio en Vercel, volver a desplegar, y la cuota se
  triplica. **Son gratis**: no es lo mismo que pedir las de Claude y GPT.
  **Es suyo** (variables de entorno, apartado 5 del protocolo). Lo único que
  podríamos hacer aquí es que el prompt no prometa buscador cuando la cuota se
  haya agotado, y eso ya lo decide `conBusqueda`, que mira las claves, no la
  cuota; queda anotado para el entrenador.

  **Y dos correcciones de contexto que salen del mismo commit, y nos tocan:**
  1. **Kairo tiene usuarios.** Cuatro personas han avisado de que da datos
     viejos. Llevamos desde el 22-10 razonando con que "el reloj suena en una
     casa vacía" y que por eso no es urgente. Eso era verdad para los Co-Works
     y los papeles —0 y 0—, pero **no para el chat**. Lo escribí yo, así que lo
     corrijo yo: **ya hay gente usando Kairo y notando sus fallos.**
  2. **La cuenta de Gemini está en la capa gratuita.** Su commit habla de
     *"Gemini's free tier"* como lo que le pasa a Kairo hoy. Eso contesta la
     pregunta del P1 del 20-10 **en el sentido malo**: el "No" sobre
     entrenamiento **no puede volver a `/precios`**, y el bloque que escribió
     ayer el entrenador —que prohíbe a Kairo negar que se entrene con los datos
     del usuario— era necesario, no precaución de más.

- **`/precios` promete que no se entrena con tus conversaciones, y eso depende de un ajuste que nadie ha mirado.** `[origen: crecimiento 2026-10-20]`
  La FAQ de la página de precios dice, en los dos idiomas
  (`kairo/src/app/precios/page.tsx:26-27` y `48-49`): *"¿Se usan mis
  conversaciones para entrenar modelos? **No.**"*
  Y buscando hoy los límites de la API de Gemini sale que **en la capa gratuita
  los datos pueden usarse para mejorar los productos de Google**, y en la de
  pago no. Kairo funciona hoy **con un solo cerebro, Gemini**, así que ese "No"
  es verdad **si y solo si la cuenta de Gemini es de pago**.
  Y hay indicios de que podría no serlo: `kairo/src/lib/ia/config.ts` habla de
  "la capa gratuita" cuatro veces en sus comentarios y dice que los Pro
  "salieron de la capa gratuita", algo que según las fuentes de hoy pasó el 1
  de abril de 2026.
  **Por qué es P1 y no P2**: es la promesa más delicada que hace el producto,
  sobre una app que lee **multas, cartas de Hacienda y contratos** y que tiene
  **modo para menores**; la comprueba cualquiera leyendo las condiciones de
  Google; y si es falsa, no se arregla con una disculpa.
  **Qué hace falta, y son dos cosas pequeñas**: (1) el dueño mira en Google AI
  Studio si el proyecto tiene facturación activada —un minuto, la página de
  límites está en `aistudio.google.com/rate-limit`—; (2) según la respuesta, o
  no se toca nada, o el constructor cambia esa FAQ en diez minutos para que
  diga la verdad. **El texto lo puede escribir un agente; el dato solo lo
  puede mirar él.** Detalle y fuentes en `agentes/mercado/2026-10-20-mercado.md`.

  **Hecho lo que era nuestro, el 21-10, y sin esperar la respuesta.** Resulta
  que la mitad del arreglo no necesitaba el dato: **la página ya no hace la
  afirmación**. La pregunta pasa de *"¿se usan mis conversaciones para entrenar
  modelos?"* —contestada con un "No." a secas— a **"¿qué se guarda de lo que le
  mando a Kairo?"**, y la respuesta solo dice cosas comprobables en el código:
  de un papel se guarda lo leído y el **nombre** del archivo, **el archivo no**,
  el papel se puede borrar, las conversaciones sí se guardan para poder volver a
  ellas, y en la memoria solo entra lo que la persona pide. Eso es **más útil
  que un "No"** y es cierto en las dos capas, así que la página es honesta hoy
  sin saber en cuál está.
  **Contestado de rebote el 24-10, y no por `notas.md`**: su commit `688ecb2`
  habla de *"Gemini's free tier"* como lo que le está pasando a Kairo, así que
  **la cuenta es gratuita**. Consecuencia: el "No" sobre entrenamiento **no
  vuelve** a `/precios`, la página se queda como está —honesta— y el bloque
  `PRIVACIDAD` del prompt se queda con su prohibición. Si algún día pasa la
  cuenta a pago, se revisan las dos cosas. Queda pendiente solo que él lo
  confirme con una línea, porque esto es deducción de un mensaje de commit,
  no la pantalla de facturación.
  **Lo que sigue siendo suyo**: el minuto en AI Studio. Si la cuenta es de pago,
  el "No" vuelve, pero **como una frase más y no como toda la respuesta**, y lo
  pongo en diez minutos. Si es gratuita, no hay nada que deshacer. En los dos
  casos, el riesgo de prometer algo sin sostener **ya está fuera de la web**.

- **La portada promete tres cerebros y en producción solo hay uno.** `[origen: guardian 2026-10-16]`
  Leído hoy de `/api/estado` en producción, a las 05:14 UTC:
  **Gemini: clave sí · Claude: clave NO · GPT: clave NO**, más el respaldo de
  OpenRouter. Es decir, de los tres motores que dan nombre al producto, uno.

  No está roto, y es a propósito: `kairo/.env.example` dice que con una sola de
  las tres Kairo funciona y que "los proveedores sin clave desaparecen de las
  cadenas y no se nota nada". El problema es que **sí se nota en lo que
  promete la web**. La portada, comprobada el 13-10, dice *"Claude · Gemini ·
  GPT, en una sola suscripción"* y *"Tres cerebros. Una sola IA."*, y el
  Mega-Prompt se vende como los tres en paralelo más síntesis, que con una
  clave no puede ocurrir.

  Hay dos arreglos y los dos son del dueño: **poner las otras dos claves**
  (cuesta dinero desde el primer mensaje, lo dice el propio `.env.example`), o
  **cambiar lo que promete la portada** hasta que estén. Lo segundo lo puede
  hacer el constructor en una tarde si se le dice que sí, y encaja con el
  cambio de textos que ya pidió el de crecimiento.

- **Las preguntas al dueño llevan 16 días sin contestar, y bloquean cuatro tareas.** `[origen: guardian 2026-10-14 · edad revisada 2026-10-28]`
  `agentes/notas.md` sigue vacío. Las cuatro están estudiadas y preparadas, solo
  falta la decisión: si Kairo+ llega a MEGA, qué hacer con el reloj, si la
  tienda de pagos está encendida y si Kairo está lanzada. Mientras no lleguen,
  el constructor va saltando a tareas de segunda fila y los agentes trabajan con
  supuestos que pueden ser falsos (están escritos en `CONTEXTO.md`).
  **No hay nada que un agente pueda hacer aquí.** Se anota como P1 para que se
  vea el tiempo que lleva, no para que alguien lo resuelva.
  **Repaso del guardián del 24-10**: `notas.md` sigue vacío (doce días), y la
  lista de lo que espera decisión ya es de nueve cosas, no de cuatro: las
  cuatro de `notas.md`, el merge (51 commits, trece días), el minuto de AI
  Studio, las claves o los textos de la portada (noveno día con un cerebro),
  las tres líneas de `jq` del 22-10, los enlaces a las tres páginas de
  intención, la dirección para los fallos de usuarios y, desde ayer, qué dice
  Kairo de las cláusulas abusivas. Siete de ellas se contestan en menos de
  cinco minutos.
  **Repaso del 28-10**: `notas.md` sigue vacío (dieciséis días). Pero hay que
  decir lo otro también, porque si no esta línea miente: **el dueño contesta
  con commits, no con notas**. Desde el 24-10 ha puesto las tres claves de
  Gemini que le pedimos (en menos de 24 h), ha publicado Kairo Code, ha montado
  tres repuestos de búsqueda y lleva doce commits más afinando Código. Lo que
  no contesta son **las decisiones**: las claves de Claude y GPT o los textos de
  la portada, los enlaces a las páginas de intención, la dirección para fallos y
  el tope de gasto. Eso es lo que sigue bloqueado, y es más honesto decirlo así
  que decir que no contesta.

- **Dos precios más que chocan entre el documento y el código.** `[origen: entrenador 2026-10-14]`
  Un Co-Work ejecutado cobra **4** créditos (`api/coworks/ejecutar/route.ts:49`,
  `CREDITOS.normal`) y la especificación dice **40**. Analizar un documento con
  Paperwork cobra **4** (`api/paperwork/route.ts:73`) y el documento dice **15**.
  Ninguno es un descuido: el código lo justifica por escrito ("lo mismo que un
  mensaje normal: es uno"). Pero el margen mínimo garantizado de la sección 3 de
  la especificación está calculado con 40 y con 15, así que esa cuenta hoy no
  describe lo que pasa. **O se corrige el documento o se corrigen los precios, y
  lo decide el dueño**: los créditos no los toca ningún agente.

- **~~Kairo+ tiene los mismos niveles que Supreme en el código, MEGA incluido~~ — CONTESTADO por el dueño el 10-11, y en contra del documento.** `[origen: constructor 2026-10-12 · contestado 2026-11-10, marcado 2026-11-11]`
  Treinta días abierto, y la respuesta no ha venido en una línea: ha venido
  escrita en la página. Las tarjetas de Kairo+ y Supreme dicen ahora **"Los
  cuatro niveles, Mega-Prompt incluido"** las dos, así que el código no era
  un despiste: es la decisión. **La especificación es la que se ha quedado
  atrás**, no `planes.ts`.
  Y la pregunta que esta entrada hacía de rebote —si el tope de Mega-Prompts
  al mes existe— también está contestada por la vía de los hechos: **no hay
  tope**; los "8 al mes" y "25 al mes" de las tarjetas son la división de los
  créditos del plan entre los 240 que cuesta un MEGA (2.000/240 = 8,
  6.000/240 = 25), no un contador. Eso está bien dicho: es lo que da el saldo.
  **Lo que Supreme sí tiene de propio**, después del repaso de anoche: el
  triple de créditos, **25 Co-Works contra 5**, **150 Mentes contra 30** y el
  soporte. Esa es la respuesta a "¿y entonces para qué pago el de arriba?",
  y ahora tiene una.
  **Queda una cosa para `docs/kairo/ESPECIFICACION.md`**, que ningún agente
  toca sin permiso: su sección 3 sigue diciendo lo contrario. Mientras siga
  así, cualquiera que lea el documento antes que el código se equivoca, y es
  justo lo que le pasó a este sistema durante treinta días.
  Lo que decía esta entrada, de histórico:
  `kairo/src/lib/planes.ts:41-45` da a `plus` y a `supreme` los cuatro niveles
  (`fast`, `normal`, `forja`, `mega`). La especificación, sección 3, da a
  Kairo+ solo "Rápido + Estándar" y reserva el Máximo y el Mega-Prompt para
  Supreme. El Mega-Prompt es lo más caro por uso (~0,36 € según la propia
  especificación), así que el día que se enciendan los pagos quien pague
  9,99 € tendría lo mismo que quien paga 24,99 € justo en lo que más cuesta, y
  el plan de arriba se queda sin argumento.
  **No lo arregla ningún agente**: los planes y los créditos son del dueño
  (protocolo, apartado 5). Hacen falta dos decisiones suyas: cuáles son los
  niveles de cada plan de verdad, y si el tope de Mega-Prompt al mes (8 y 25
  según el documento) está puesto en algún sitio o no existe.

- **La sede no tiene permiso de red, pero ya hay forma de rodearlo.** `[origen: guardian 2026-10-12, resuelto en la práctica 2026-10-16]`
  Sigue sin alcanzarse `kairo-six-lemon.vercel.app` desde el contenedor
  (`ENOTFOUND` / 403 del proxy), y abrir el dominio en **Network access** sigue
  siendo la solución limpia.
  **Pero ya no es un punto ciego.** El 15-10 el dueño añadió
  `.github/workflows/revisar.yml`, que lee `/api/estado` desde un runner de
  GitHub y escribe el resultado en el log. El guardián puede lanzarlo y leerlo,
  y lo hizo hoy por primera vez: ahí salió lo de las claves que falta. Queda
  incorporado a la revisión diaria.
  Lo que sigue sin poder leerse es la página `/revision` renderizada y la
  portada tal y como la ve un visitante.

- **El reloj: medido, y el cron nuevo no basta. La verdad ya está en la interfaz (24-10); queda decidir si se paga un reloj externo.** `[origen: guardian 2026-10-12 · el dueño actúa 2026-10-16 · medido 2026-10-18 · mitad honesta hecha 2026-10-24]`
  **Resuelto por su parte**: el commit `67cb15e` ("Ring the clock three times an
  hour, not five times a day") pasa el cron de cada hora a cada 20 minutos, y
  su comentario añade algo que ningún agente había dicho: **un hueco no es un
  retraso**. Un Co-Work de las 23:00 solo sale si el reloj suena antes de
  medianoche; si el siguiente toque cae a las 02:00, ese encargo no se
  ejecuta, se pierde entero y en silencio.
  **Medido el 18-10, con 24 horas enteras de datos. El veredicto: no basta.**
  El cron de `main` pide 72 toques al día (`7,27,47 * * * *`) y GitHub ha
  entregado **7 en las últimas 24 h**: un 10%. Peor hueco cerrado **4 h 28
  min**; el hueco abierto a las 05:13 iba por 4 h 20.

  | Medido | Ejecuciones/24 h | Peor hueco | Cron pedido |
  |---|---|---|---|
  | 15-10 | 6 | 5 h 28 | 24/día |
  | 16-10 | 5 | 5 h 22 | 24/día |
  | **18-10** | **7** | **4 h 28** | **72/día** |
  | **19-10** | **8** | **4 h 50** | **72/día** |
  | **20-10** | **4** | **6 h 29** | **72/día** |
  | **21-10** | 6 | 5 h 00 | 72/día |
  | **22-10** | 5 | **10 h 39** | 72/día |

  Ha mejorado algo —5 → 7 al día, peor hueco 5 h 22 → 4 h 28—, pero **pedir el
  triple ha dado 1,4 veces más**, que es exactamente lo que avisaba el
  comentario del dueño en ese commit: pedírselo tres veces no obliga a GitHub a
  nada. Las 98 ejecuciones siguen todas en verde: el reloj no falla, **no
  suena**.

  Y con la regla que él mismo escribió —un hueco no es un retraso, un Co-Work de
  las 23:00 se pierde entero si el siguiente toque cae después de medianoche—,
  un hueco de 4 h 28 significa que **se pierde en silencio aproximadamente uno
  de cada cinco encargos nocturnos**. Eso ya no es una medición pendiente: es la
  decisión que queda, y es del dueño. **Un reloj externo** (cron-job.org,
  Upstash QStash, una Scheduled Function de Vercel) **o decírselo al usuario en
  la interfaz al programar un Co-Work.** Lo segundo lo puede hacer el
  constructor en una tarde si se le dice que sí.

  **Segunda medición, 19-10: confirmada.** Un toque más (8) y un hueco peor
  (4 h 50). Dos días seguidos clavados en una décima parte de lo pedido, así
  que esto ya no necesita más mediciones: necesita la decisión. El guardián
  deja de medirlo a diario y lo mirará solo si cambia algo.

  **Cambió, y a peor: 20-10, cuatro toques y 6 h 29 de hueco.** La serie va
  3 → 4 → 6 → 5 → 7 → 8 → 4. **No está estable en una décima parte: oscila al
  doble de un día para otro**, y eso cambia el argumento de la decisión. La
  media daba para decir "va lento"; la varianza dice algo peor: **con un
  proceso que varía así no se puede prometer una hora a nadie**, ni en la
  portada ni en la interfaz. Si se elige la vía de "decírselo al usuario", el
  texto honesto no es "puede tardar un rato": es que el encargo **puede no
  salir ese día**.

  **22-10: el dato que cambia la urgencia, no el diagnóstico.** El dueño añadió
  el 21-10 que el reloj diga **qué hizo** en cada toque, y lo primero que dice
  es: *"Co-Works mirados: **0**. Papeles que tocaba avisar hoy: **0**"*. O sea
  que **el reloj suena en una casa vacía**: no hay Co-Works programados ni
  papeles con fecha, así que el hueco de **10 h 39** de ese mismo día —el peor
  en nueve días— **no ha costado ni un encargo**.
  Eso obliga a corregir cómo lo hemos contado nueve días seguidos, y lo corrige
  quien más lo ha repetido: el problema es real y hay que arreglarlo, **pero no
  es urgente hoy; es urgente antes del primer Co-Work de verdad**. Mientras no
  haya usuarios, el reloj puede fallar todo lo que quiera y no se pierde nada.
  Delante de esto van el merge y las dos claves.
  **Y una corrección de método**: desde hoy solo se cuentan las ejecuciones
  `schedule`. El 21-10 hubo además tres a mano del dueño, y contarlas habría
  dado 8 toques en vez de 5.
  `kairo-coworks.yml` pide `cron: "5 * * * *"`, pero las ejecuciones reales van
  muy por detrás. GitHub retrasa y se salta las ejecuciones programadas cuando
  su planificador va cargado, y no avisa: todas salen en verde.

  | Medido | Ejecuciones | Peor hueco |
  |---|---|---|
  | 12-10 (10 últimas, 47 h) | 1 cada 4,7 h | 7 h 23 min |
  | 13-10 (últimas 24 h) | **3 en 24 h**, no 24 | **10 h 14 min** (12-10 de 07:13 a 17:27 UTC) |
  | 14-10 (últimas 24 h) | 4 en 24 h, no 24 | 8 h 13 min (13-10 de 07:25 a 15:38 UTC) |
  | 15-10 (últimas 24 h) | 6 en 24 h, no 24 | 5 h 28 min |

  **Va mejorando solo** (3 → 4 → 6 al día, y el peor hueco de 10 h 14 a 5 h 28),
  así que parte de esto era carga puntual del planificador de GitHub y no un
  problema fijo. Aun así sigue a una cuarta parte de lo pedido, y el competidor
  documenta una ejecución por hora, así que la decisión sigue en pie.

  Va a peor, no a mejor. Con un hueco de diez horas, un Co-Work de las 21:00
  puede salir al día siguiente.

  **Y desde el 14-10 esto ya no es solo técnico, es competitivo**
  `[crecimiento 2026-10-14]`: ChatGPT Tasks documenta como su límite
  **una ejecución por hora**. Kairo entrega una cada seis.

  **Y desde el 17-10, con precio de mercado encima** `[crecimiento 2026-10-17]`:
  GovEasy, español, **cobra 9,99 € de pago único** por vigilar convocatorias y
  avisar, y vende su Radar de Citas como producto. Es decir, la vigilancia
  continua **no es un extra que se regala: es lo que alguien ya cobra**. Kairo
  la incluye y la entrega con cinco horas de retraso. En el único terreno
  donde dice ganar, hoy va seis veces por detrás del que puede copiarle el
  argumento con una frase.
  Importa porque es exactamente lo que ese workflow existe para evitar, según
  su propio comentario: *"es el que hace que un Co-Work puesto a las 21:00
  salga de verdad a las 21:00"*. Con huecos de 7 horas, un Co-Work puede salir
  con medio día de retraso y un aviso de plazo de Paperwork llegar tarde.
  El cron de Vercel (`kairo/vercel.json`) no cubre el hueco: es uno al día a
  las 06:00. Hay que decidir: o un reloj externo de verdad (cron-job.org,
  Upstash QStash, una Scheduled Function), o aceptar el retraso y decírselo al
  usuario en la interfaz al programar un Co-Work, que es lo honesto si no se
  va a pagar por un reloj.

  **Hecha la mitad honesta, el 24-10, y sin esperar la respuesta** —como el
  21-10 con `/precios`—. De las dos vías, una costaba dinero y era suya; la
  otra eran textos de interfaz y era mía, y llevaba doce días sin hacerse
  mientras la interfaz prometía algo que la medición desmiente. Cambiado en
  `kairo/src/lib/i18n.tsx` y `kairo/src/app/(app)/coworks/page.tsx`, **en los
  dos idiomas**:
  - **La promesa falsa, fuera.** `cw.how` decía *"con el de GitHub activado,
    sale a la hora exacta que hayas puesto"*. Ahora dice que el reloj pasa
    varias veces al día pero no a horas fijas, que el encargo sale **desde** la
    hora puesta y nunca antes, y que de noche puede saltar al día siguiente.
  - **`cw.everyDayAt`**: "Todos los días **a las** {h}:00" → "Todos los días
    **a partir de** las {h}:00".
  - **Ayuda nueva bajo el selector de hora** (`cw.hourHelp`), y una versión
    distinta **a partir de las 20:00** (`cw.hourHelpLate`) que dice lo que el
    propio backlog fijó el 20-10 como estándar: a esas horas el encargo no se
    retrasa, **se salta el día**, y si se quiere todos los días sin falta, por
    la mañana. El umbral sale de la medición: con huecos de unas 5 horas, desde
    las 20:00 la siguiente pasada puede caer después de medianoche.
  Comprobado con `npx tsc --noEmit` salida 0, `npx next build` salida 0, un
  recuento de que las cuatro claves tocadas siguen definidas **dos veces** (una
  por idioma) y **leyendo lo generado**: el bloque "¿Y quién lo despierta?" sale
  pre-renderizado con el texto nuevo en `.next/server/app/coworks.html`, la
  frase "hora exacta" ya no aparece en ese HTML, y las dos ayudas del selector
  viajan en el bundle del cliente (el formulario solo se pinta al pulsar "Nuevo
  Co-Work", así que ahí es donde tienen que estar).
  **Lo que queda, y es suyo**: pagar un reloj externo (cron-job.org, Upstash
  QStash, una Scheduled Function) o no pagarlo. Si lo paga, se deshacen estos
  textos en diez minutos y el P1 se cierra entero. Si no, **la interfaz ya no
  miente** y el P1 se queda abierto solo por el reloj.

## P2

- **Kairo nunca ha dicho su mejor argumento de precio: que "trabaja mientras no estás" se puede probar sin tarjeta.** `[origen: crecimiento 2026-11-11]`
  **Verificado hoy con los precios de este mes**, que es lo que lo convierte en
  tarea y no en opinión: el suelo del mercado para tener una IA que trabaja sola
  es **~8 €/mes** (ChatGPT Go, tareas programadas en todos los planes de pago) y
  **21,99 €/mes** en Google —su plan nuevo de 4,99 € **no** trae Scheduled
  Actions—. El tope de los dos es **10** tareas.

  Kairo da **1 Co-Work que se ejecuta cada día en el plan gratuito, sin
  tarjeta**. Ninguno de los dos da eso a 0 €.

  **Y la portada no lo dice en ninguna parte.** Vende *"La IA que trabaja cuando
  tú no"* —que es la promesa correcta— y deja al visitante sin saber que puede
  comprobarla sin pagar. Es la única frase que convierte esa promesa en un motivo
  para registrarse hoy.

  **Qué haría yo**: un bloque corto en la portada y una línea en `/precios`, en
  los dos idiomas, con la cifra interpolada de `COWORKS_POR_PLAN.free` para que
  no envejezca sola. **Sin nombrar marcas**: "los asistentes generales piden
  suscripción para esto" dice lo mismo y no mete a nadie en un pleito.
  **Medio día** del constructor.

  **Lo que no voy a prometer**: no podré medir si funciona. La analítica está en
  su Supabase y ningún agente la lee.

- **Los 25 Co-Works de Supreme son un argumento y están enterrados como una viñeta de seis.** `[origen: crecimiento 2026-11-11]`
  Anoche los topes pasaron a ser por plan y Supreme quedó en **25 encargos a la
  vez**. Los dos grandes están en **10**, y Google cobra **21,99 €** por llegar
  ahí. Es **la primera cifra en la que Supreme gana al mercado**, y hoy está
  escrita igual que "PDF de cualquier tamaño".

  Es además la respuesta a la pregunta que el propio comentario de `planes.ts` se
  hacía anoche —*"dos de los cinco argumentos de venta de Supreme no lo
  diferenciaban en nada"*—: ahora sí lo diferencian, y hay que decirlo donde se
  decide pagar.

  **Qué haría yo**: una línea de comparación en `/precios`, en los dos idiomas
  —"25 encargos a la vez; los asistentes generales se quedan en 10"—, sin marcas
  y con la cifra leída de `COWORKS_POR_PLAN.supreme`. **Una tarde** del
  constructor.

- **El prompt no sabe en qué plan está quien pregunta, así que recita los tres topes.** `[origen: entrenador 2026-11-11]`
  Desde hoy el prompt dice los topes de Co-Works y Mentes por plan —1 / 5 / 25 y
  3 / 30 / 150, interpolados de `COWORKS_POR_PLAN` y `MENTES_POR_PLAN`—, y tiene
  que decir los tres porque **`construirPrompt` no recibe el plan**: le llegan
  tono, nombre, nivel, Mente, zona horaria, adjuntos, hechos y recuerdos
  (`prompt.ts`, la firma), y el plan no.

  **Qué cambia si entra**: hoy, a "¿cuántos encargos puedo tener?", lo mejor que
  Kairo puede contestar es los tres números y "mira tus ajustes". Con el plan
  dentro contesta **"cinco"**, que es lo que la persona ha preguntado. Y el
  bloque se acorta, porque deja de tener que enumerar.

  **Por qué no lo he hecho hoy**: toca una firma que usan el chat, los Co-Works
  y Paperwork, y el día del entrenador es para un cambio pequeño. No es difícil
  —quien llama ya tiene el perfil delante para cobrar los créditos—, pero es un
  cambio de los que se hacen mirando los tres sitios que llaman, no uno.

  **Y el mismo viaje sirve para dos cosas más** que hoy se contestan con "no lo
  sé": si los créditos de la persona dan para lo que está pidiendo, y qué
  niveles tiene disponibles. Las dos son del plan.

- **La prueba de la portada no sabe qué no puede hacer.** `[origen: radar 2026-11-10 · lo vio el entrenador el mismo día y lo dejó anotado]`
  Desde hoy el `SISTEMA` de `/api/probar` lleva tono —el `cercano`, importado de
  `TONOS`—, así que la primera respuesta que lee un desconocido ya suena a Kairo.
  Lo que sigue sin tener es **límites**: nada le dice que no tiene cuenta, ni
  memoria, ni Paperwork, ni Co-Works.

  **Por qué importa más que un detalle de redacción**: la portada vende leer
  multas y cartas de Hacienda, así que *"léeme esta multa"* es **la pregunta más
  probable** que va a recibir esa caja. Hoy no hay instrucción sobre qué
  contestar, y las dos salidas malas son fáciles: prometer que lo hace —y
  entonces el registro empieza con una promesa incumplida— o soltar un "no
  puedo" seco en la pantalla donde se decide si alguien se queda.

  **Qué haría yo**: dos o tres líneas en ese `SISTEMA`, con el mismo criterio del
  bloque de capacidades del prompt grande (`[hecho 2026-10-16]`): decir qué sí se
  puede aquí mismo, decir que lo de subir papeles necesita cuenta **gratis**, y
  ofrecer seguir contestando la parte que sí cabe en una respuesta de texto.
  Importado del mismo sitio si se puede, no copiado: es la lección de hoy.
  Medio día del entrenador, y se comprueba con el mismo arnés de 12 puntos que
  ya existe para esa ruta.

- **~~Un verificador de cifras que no haya que recordar~~ — HECHO, y encontró algo en su primera ejecución.** `[origen: radar 2026-11-07 · hecho 2026-11-10]`
  Ver `## Hecho`.
  Tres veces en tres días un cambio del dueño dejó **falso** material nuestro, y
  las tres veces se arregló a mano al día siguiente:

  | Cuándo | Qué quedó falso | Por qué |
  |---|---|---|
  | 06-11 | la escala de créditos en cuatro archivos de `agentes/ia/` | dobló `CREDITOS_NIVEL` |
  | 06-11 | el caso 7 del banco de pruebas, que esperaba 120 y 1.000 | lo mismo |
  | 07-11 | la política de cookies, que decía "no hay analítica" | puso analítica y una galleta nueva |

  Y la respuesta de las tres veces fue la misma: **dejar escrita una regla**.
  "Cuando cambie `planes.ts`, revísalo en el mismo turno" está hoy en la
  cabecera del conocimiento de créditos, en la del banco de pruebas y en el
  parte del 07-11. **Tres copias de una regla que hay que acordarse de leer no
  son una regla: son tres sitios donde queda escrito que se nos olvidó.**

  **Lo que hay que hacer, y está medio hecho**: el script que compara las cifras
  del material con `CREDITOS_NIVEL` y `CREDITOS_PLAN` **ya lo escribí el 06-11**
  para comprobar aquel arreglo —lee la constante del fuente con una expresión
  regular y falla si el material dice otra cosa—, y vive en un directorio
  temporal. Falta: dejarlo en `agentes/`, añadirle las cifras que han aparecido
  desde entonces (el regalo de 300, los topes de Co-Works y Mentes, las cookies
  de la política) y ponerlo en la lista de comprobaciones del guardián, que es
  quien mira cada mañana.

  **Trabajo**: medio día. **Ganancia**: mata una clase entera de errores, la que
  más veces ha mordido esta semana, y la mata sin que nadie tenga que acordarse
  de nada.

- **Falta `/avisos-de-plazos`, que es la única página de intención que no compite contra nadie.** `[origen: crecimiento 2026-11-05]`
  De las seis intenciones de la tabla del 17-10, cuatro tienen página y faltan
  dos: `/resumir-video` y esta, que aquella tabla ya llamaba *"el argumento
  propio de Kairo"*.

  **Lo que la búsqueda de hoy añade, y es el motivo de que entre ahora**: en las
  dos intenciones que he mirado —"recurrir una multa" y "requerimiento de
  Hacienda"— **los diez primeros resultados explican el plazo y ninguno lo
  vigila**. La primera es la propia sede de la DGT; detrás, Legalitas y Zurich;
  y en la de Hacienda, **siete de los diez son blogs de programas de facturación
  para autónomos** (declarando, billin, billeo, Holded, Quipu, Xolo, Sage), o
  sea equipos de contenidos financiados. Contra eso no se gana escribiendo más
  páginas. Se gana ofreciendo lo que ellos no hacen, y lo que no hace ninguno es
  **avisar**.

  **Trabajo**: un día. El patrón está engrasado —`page.tsx` de servidor con
  metadatos y `contenido.tsx` bilingüe— y desde el 05-11 las ocho páginas
  públicas lo cumplen. Hay que añadirla al `sitemap.ts` y al pie.
  **Y una condición de honradez**: la página vende los avisos de plazos, que
  hoy salen por Telegram y dependen del reloj de GitHub. Lo que diga tiene que
  ser lo que el código hace, no lo que la especificación promete.

- **Una multa tiene tres caminos y Kairo solo conoce dos.** `[origen: crecimiento 2026-11-05]`
  `papeles.ts` avisa desde el 27-10 de que pagar con la reducción del 50% y
  alegar son incompatibles, y el caso límite del 05-11 trabaja esas dos ramas.
  **Falta la tercera, que es la que más gente toma sin querer: no hacer nada.**
  Según las fuentes de hoy, si no pagas ni alegas en los 20 días naturales, el
  procedimiento ordinario abre **45 días más para pagar, ya al 100%, y durante
  ese tiempo no se puede alegar**; y recurrir una resolución ya dictada es otro
  plazo, **un mes**.

  **Antes de escribir una línea, verificarlo en fuente oficial**: hoy los 45
  días salen de resultados de búsqueda (Legalitas y guías), no de la sede de la
  DGT abierta, porque desde aquí no se abre ninguna web.

  **Y en el mismo paquete, otro plazo que puede estar mal**: en los
  requerimientos de Hacienda son 10 días hábiles, pero varias guías avisan de
  que **el reloj arranca cuando descargas la notificación de la DEHú**, no
  cuando se pone a disposición. Si es así, el plazo que Paperwork pone en grande
  puede estar equivocado por días, y es el dato por el que alguien sube su
  carta. Verificar en la AEAT.

  **Trabajo**: una tarde, y la mayor parte es leer las dos fuentes oficiales.
  **Ganancia**: el número más importante que da Paperwork deja de depender de
  una guía comercial.

- **~~`/precios` y `/legal` salen en Google con el título de la portada~~ — HECHO.** `[origen: radar 2026-11-04 · hecho 2026-11-05]`
  **Hecho el 05-11**, al día siguiente de entrar en la cola. Ver `## Hecho`.
  Lleva en 🟡 en el checklist desde el **29-10** (6 días) y no estaba en esta
  cola, así que entra ahora. Las dos páginas empiezan por `"use client"`, y Next
  no deja exportar `metadata` de un componente de cliente: comprobado hoy, las
  dos tienen **cero** `export const metadata`. Resultado: en el buscador salen
  con el título y la descripción de `layout.tsx` —*"Kairo — La IA que trabaja
  cuando tú no"*—, y una de las dos es **la página de precios**, que además está
  en el `sitemap.xml` con prioridad 0,8.

  **El arreglo ya está en la casa y se usó hoy delante**: el patrón de las cinco
  páginas de intención, `page.tsx` de servidor con los metadatos y
  `contenido.tsx` con el `"use client"`. `/legal/cookies` nació así esta mañana.
  Es mecánico, son dos páginas, y **no espera nada del dueño**.

- **Ningún agente ha visto nunca la portada, y GitHub sí puede verla.** `[origen: radar 2026-11-04]`
  Octavo informe con *"¿se entiende qué es Kairo en la primera pantalla?"* en ⚪.
  El motivo es conocido: esta máquina no tiene permiso de red (403 del proxy al
  hacer CONNECT, comprobado otra vez hoy). Lo que no se había dicho es que
  **ese agujero se puede cerrar sin abrir la red de aquí**: los workflows de
  GitHub sí tienen salida, y es lo que ya usa `revisar.yml` para saber que Kairo
  está viva.

  **La forma concreta**: un workflow que lance Playwright contra la portada,
  haga una captura a 1280×800 y otra de móvil, y las suba como **artefacto** de
  la ejecución. Con eso, cualquier agente puede leer el veredicto de la propia
  ejecución y el dueño puede abrir la imagen. Playwright y Chromium ya vienen
  instalados en el contenedor, así que el `.yml` es corto.

  **Qué puedo hacer yo y qué no**: el archivo va en `.github/workflows/`, y eso
  no lo instala ningún agente (apartado 5 del protocolo: los workflows son
  suyos). Lo que sí puedo es **dejarlo escrito entero** para que lo pegue, y eso
  es un día del constructor. Si lo pega, se cae el ⚪ más viejo del panel.

- **La cola no distingue "bloqueado del todo" de "bloqueado en parte".** `[origen: radar 2026-11-04]`
  Hoy ha salido con prueba: el P1 de los textos legales llevaba tres días parado
  **entero** porque le faltaban cuatro datos del dueño, y resulta que eso era
  verdad de tres de los cuatro documentos. El cuarto —la política de cookies— no
  necesitaba nada de nadie y se ha escrito hoy en una mañana.

  **Qué cambia, y es de método, no de producto**: de ahora en adelante, cada P1
  que espere al dueño lleva una línea **«el trozo que no te espera»** con lo que
  se puede hacer sin él, o dice explícitamente que no hay ninguno. Hoy lo he
  repasado a mano con los 17 abiertos; lo que falta es que sea el formato y no
  un repaso de un día. Lo escribe quien abre el hallazgo, que es quien mejor
  sabe dónde está la costura.

- **Las tipografías vienen de Google, así que Google ve la IP de cada visitante.** `[origen: constructor 2026-11-04]`
  Salió al escribir la política de cookies, que obliga a mirar una por una las
  peticiones que hace la web al abrirse. `layout.tsx:73-77` carga Inter y
  JetBrains Mono desde `fonts.googleapis.com` con un `preconnect` delante. No
  pone cookies —Google Fonts no las pone—, pero **la petición lleva la IP y el
  navegador de quien abre cualquier página de Kairo, incluida la portada y sin
  haber entrado en ninguna cuenta**.

  **Por qué es P2 y no P1**: no está roto y ya no está oculto —la política de
  cookies lo dice con todas las letras desde hoy—. Pero es una transferencia a
  un tercero que se puede quitar entera, y mientras esté, cualquier documento de
  privacidad tiene que mencionarla.

  **El arreglo**: `next/font/google`, que descarga las tipografías en el
  despliegue y las sirve desde el propio dominio. Cero peticiones a Google, y
  además la web carga antes porque se ahorra la conexión a otro servidor. Es
  tocar `layout.tsx` —la plantilla de toda la web— y comprobar que las dos
  familias siguen pintando igual en los dos temas, así que es un día de trabajo
  propio y no un añadido de paso. **Mío, no suyo**: no hace falta ningún dato ni
  ningún permiso, solo que no haya nada más urgente delante.


- **~~El pie de la web: cinco enlaces que faltan y cuatro que van todos al mismo sitio~~ — HECHO.** `[origen: radar 2026-10-31 · hecho 2026-11-01]`
  Hecho a la tercera, y el radar tenía razón en por qué se caía: no tenía
  entrada propia. Detalle en `## Hecho`.
  **Esto no tenía entrada propia y por eso lleva dos días cayéndose de la cola.**
  Vivía dentro de la tarea de las páginas de intención y dentro de otra P2 de
  los enlaces legales, así que cada vez que alguien metía un P1 nuevo —y ayer y
  hoy metimos tres— el pie bajaba un puesto. El constructor lo anunció para
  "mañana" en los partes del **30-10 y del 31-10** y las dos veces se lo comió
  un P1 más urgente, con razón las dos veces. Ahora va solo y va primero.
  **Las dos mitades, que son el mismo archivo** (`components/SiteHeader.tsx`):
  1. **Las cinco páginas de intención no se enlazan desde ninguna parte.**
     `/multas`, `/cartas-de-hacienda`, `/contratos`, `/crear-una-app` y
     `/sin-suscripcion` están las cinco en el `sitemap.xml` y **a ninguna se
     llega desde la web**: existen para Google y no para un visitante.
     Comprobado hoy: los únicos `href` del pie son `/#features`, `/precios`,
     `/chat` y `/legal`.
  2. **Los cuatro enlaces legales van los cuatro a `/legal`.** "Aviso legal",
     "Privacidad", "Cookies" y "Términos" apuntan al mismo sitio
     (`SiteHeader.tsx:89-92`), así que tres de los cuatro mienten sobre a dónde
     llevan. `/legal` tiene los cuatro bloques dentro, así que basta con
     anclarlos.
  **Trabajo**: una mañana, y todo es interfaz y texto. **No depende de ninguna
  decisión del dueño**: lo único que se le preguntó el 23-10 fue si quería los
  enlaces en el pie, y a los nueve días sin respuesta la decisión por defecto es
  ponerlos, igual que se hizo con la frase de Supreme.
  **Qué se gana**: hoy las cinco páginas son trabajo de cuatro tardes que no
  recibe una sola visita que no venga de Google.

- **El banco de pruebas lleva 12 días sin pasarse, y el prompt ha cambiado 9 veces dentro.** `[origen: radar 2026-10-31 · 8 → 12 días el 2026-11-04]`
  **Al día 10-11, y con una decisión que explico**: el banco **se pasó el 07-11**
  tras quince días, y la pasada fue **parcial a propósito** —encontró en diez
  minutos que en producción Kairo decía *"cuesta 2 crédito"* y el turno se fue en
  arreglarlo—. Así que lo que queda no es pasarlo: es **puntuar los catorce
  casos**, con las cifras y los criterios ya al día desde ese mismo día. **Quinto
  informe pidiéndolo (18 días).** Mi ficha dice que lo que lleva más de cuatro
  informes sin tocarse baje a P3 o se descarte, y **aquí no aplico esa regla, y
  digo por qué**: no es que nadie la quiera hacer —se hizo la mitad el 07-11—, es
  que los turnos del entrenador se los han llevado hallazgos más urgentes y
  **dos días de avería** (08 y 09-11). Se queda en P2, en lo alto de la cola del
  entrenador.

  **Al día 04-11**: la última pasada sigue siendo la del 23-10 y los commits
  sobre `prompt.ts` y `papeles.ts` desde entonces son **nueve** (el noveno es
  el tope de Co-Works del 01-11). Tercer informe pidiéndolo, y es de los pocos
  P2 que **no espera nada del dueño**: es un día del entrenador. Lo de abajo
  se escribió el 31-10 y sigue valiendo igual.
  La última pasada es del **23-10**: 25 de 28 en 14 casos, con tres unos sin
  cerrar (`agentes/ia/evals/resultados/2026-10-23.md`). Desde entonces,
  **ocho commits** sobre `prompt.ts` y `papeles.ts`: el canje del 50%, Team en
  `CAPACIDADES`, Código, la anti-inyección del buscador, los cuatro tonos, el
  recorte y el bloque de privacidad.
  **Cada uno de los ocho se comprobó con su propio arnés, y ninguno contra el
  banco.** Un arnés dice "la regla está donde tiene que estar"; el banco dice
  "la respuesta es mejor que ayer". Son dos preguntas distintas y la segunda
  lleva ocho días sin contestar.
  **El riesgo concreto no es teórico**: la ficha del entrenador dice que si la
  puntuación baja hay que **revertir el último cambio del prompt**, y con ocho
  cambios encima ya no se sabría cuál revertir.
  **Trabajo**: un día del entrenador, y es su área 5. La rotación vuelve a
  empezar mañana por el área 1, así que le toca en cuatro días. **Yo lo
  adelantaría**: es la única cosa que puede decir si la semana ha mejorado a
  Kairo o solo la ha movido.
  **Y al constructor: esta no es tuya, sáltala.** Pasar el banco es del
  entrenador, que es quien sabe qué cambió en el prompt y qué hay que revertir
  si baja la nota. Está aquí para que se vea, no para que la coja la cola.

- **~~Kairo no sabe que alegar una multa quema el descuento del 50%~~ — HECHO.** `[origen: crecimiento 2026-10-23 · hecho 2026-10-27, marcado 2026-10-29]`
  Entregado por el entrenador el 27-10 en `kairo/src/lib/ia/papeles.ts`: regla
  nueva en `SISTEMA` que obliga a avisar en CONSECUENCIAS, cuando el papel
  ofrezca las dos cosas, de que **son dos caminos y no se pueden tomar los
  dos**, sin elegir por el usuario. Y con el cuidado que pedía esta ficha: el
  porcentaje y el plazo salen del papel, no de memoria, porque los 20 días y el
  50% son de la DGT y una multa municipal puede tener otros.
  **Un cambio sobre lo que decía esta ficha**: no fue por `conocimiento/`, fue
  derecho al prompt de Paperwork. Es lo correcto —esa carpeta no viaja al
  producto, que es el fallo del 21-10— y además `papeles.ts` es donde se
  escriben las CONSECUENCIAS.
  Lo marco hoy porque llevaba dos días hecho y sin marcar, y un backlog que no
  se marca manda al constructor a repetir trabajo.
  Lo dice la sede electrónica de la DGT en su página de alegaciones: hay **20
  días naturales desde el día siguiente** a la notificación para alegar, y *"con
  la presentación de una alegación renunciarás a cualquier derecho a la
  reducción del 50% del importe de la multa"*
  ([sede.dgt.gob.es](https://sede.dgt.gob.es/es/multas/presentacion-de-alegacion-o-recurso-a-una-multa/)).
  **Dónde está hoy, mirado en el código**: `/multas` sí lo advierte
  (`kairo/src/app/multas/contenido.tsx:37`, "casi siempre implica renunciar a
  recurrir"), pero `grep` de "descuento", "50%" y "pronto pago" en
  `kairo/src/lib/ia/prompt.ts` y `kairo/src/lib/ia/papeles.ts` da **cero
  coincidencias**. O sea: lo sabe la página y no lo sabe el producto, y
  Paperwork tiene una etiqueta `PASOS` que es exactamente donde va a salir ese
  consejo.
  **Por qué importa más que un matiz**: es una disyuntiva con dinero dentro y va
  en sentido contrario al que ayuda un asistente. Quien alega sin saberlo y
  pierde —la mayoría pierden— paga el doble de lo que habría pagado callándose.
  **Arreglo**: el hecho va a `agentes/ia/conocimiento/` y de ahí al prompt por
  el cable que el entrenador construye el 24-10 (anotado en
  `agentes/diario/2026-10-23.md`). Es una tarde suya y no toca nada prohibido.
  **Cuidado al escribirlo**: el plazo de 20 días naturales es **de la DGT**; una
  multa municipal puede tener otro, así que el hecho que entra es el canje
  (alegar pierde el 50%) y "la fecha y el plazo salen de tu notificación", nunca
  un número recitado de memoria.

- **Kairo no tiene ni una página que responda a quien busca su problema.** `[origen: crecimiento 2026-10-17]`
  Contado en el código: `kairo/src/app` solo tiene **tres páginas públicas**
  —`/`, `/precios` y `/legal`—, y el `sitemap.ts` lista esas tres. Todo lo demás
  está detrás del registro, y con razón. Así que de las seis búsquedas con
  intención real que resuelve Kairo ("me ha llegado una multa, ¿qué hago?", "qué
  significa esta carta de Hacienda", "app para que no se me pase un plazo",
  "resumir un vídeo de YouTube"…), **ninguna tiene hoy una página de Kairo
  detrás**. El competidor español más cercano, GovEasy, tiene **una página por
  trámite** y por eso sale primero en esa misma búsqueda.
  **Arreglo**: seis páginas estáticas, una por intención, empezando por
  `/multas`, `/cartas-de-hacienda` y `/avisos-de-plazos`. Una tarde cada una.
  Es trabajo de textos y páginas estáticas, así que **cabe entero dentro de lo
  que un agente puede tocar** (protocolo, apartado 5) y no depende de ninguna
  decisión del dueño. Es el único canal de captación con esa propiedad.
  Dos cosas que **no** se pueden escribir sin mentir hasta que estén
  arregladas: `/avisos-de-plazos` necesita el reloj (P1), y las páginas de
  multas y Hacienda **no pueden dar plazos de memoria** —las fuentes no
  coinciden en si los 20 días del recurso de multa son naturales o hábiles—,
  así que dicen qué lee Kairo y mandan a comprobar el dato en la notificación.
  La tabla entera, con las seis intenciones y sus fuentes, en
  `agentes/mercado/2026-10-17-mercado.md`.

  **Partida el 19-10. Van cinco de seis**: `/multas` (19-10),
  `/cartas-de-hacienda` (20-10), `/contratos` (23-10), `/crear-una-app`
  (27-10) y `/sin-suscripcion` (28-10), las cinco enteras y en los dos
  idiomas (abajo, en Hecho). **Queda una**: `/avisos-de-plazos`, y va la
  última porque necesita el reloj. Y el orden viejo decía
  `/resumir-video`,
  una sobre el "sin suscripción" que `/precios` solo responde a medias, y
  `/avisos-de-plazos`, **que va la última a propósito**: es la única que
  necesita el reloj arreglado (P1), y el guardián midió hoy que el reloj no
  solo va lento, **va a saltos** —entre 4 y 8 toques al día de los 72
  pedidos—, así que prometer avisos a su hora sería mentir dos veces. Una
  tarde cada una.

  **Cola reordenada el 26-10, y con medición detrás** `[crecimiento 2026-10-26]`:
  la siguiente **ya no es `/resumir-video`**. Buscando hoy, "resumir un vídeo de
  YouTube" devuelve **nueve herramientas que lo hacen gratis y varias sin
  registro** (SummarizeYou, Felo, Noteey, NoteGPT, SlideSpeak, RecCloud,
  VideoTranscriber, Monica…), así que esa página tendría que ganarles **mandando
  al visitante a registrarse**: es la peor relación esfuerzo/entrada de las
  tres. Y el 25-10 el dueño publicó **Kairo Código**, que abre una intención que
  no estaba en la tabla del 17-10 —*"crear una app sin saber programar"*— con
  **demanda española documentada** (tres guías de javadex, unavidaonline, skilzy,
  iaempresa) y en la que **todas esas guías mandan a herramientas de
  suscripción** de 20-25 €/mes.
  **El orden nuevo**: (1) `/crear-una-app`, (2) la del "sin suscripción" —que
  ahora tiene dos argumentos: los créditos **y** que Código no pide 20 € al
  mes—, (3) `/avisos-de-plazos` cuando el reloj deje de dar 4-8 pasadas de 72,
  y (4) `/resumir-video` la última; y si se escribe, no como "te resumo el
  vídeo" sino como "y después del resumen, qué", que es lo que las nueve no
  tienen.
  **Y la restricción de redacción de `/crear-una-app`, que va dentro de la
  tarea y no aparte, porque es cómo se escribe y no un trabajo más**: Kairo
  Código **no** compite con Lovable, v0 ni Bolt —hacen otra cosa y cuestan otro
  dinero— y **no es único**: Claude Artifacts hace lo mismo **en su plan
  gratuito** y DeepSite (Hugging Face) saca literalmente el mismo archivo HTML
  autónomo. Así que la página **no** puede decir "crea tu app", ni "crea tu
  SaaS", ni "los únicos que…". Lo que sí puede decir, y es bastante: **una
  herramienta pequeña, en un archivo, que se abre con doble clic, funciona sin
  internet después, va en el móvil y cuesta 4 créditos en vez de una
  suscripción** — y lo que no hace: ni base de datos, ni cuentas, ni despliegue,
  tal y como lo escribió el dueño en la cabecera de `code/page.tsx`. Detalle y
  fuentes en `agentes/mercado/2026-10-26-mercado.md`.

  **Y una segunda decisión suya, que no bloquea escribirlas pero sí que sirvan
  de algo** `[radar 2026-10-28]`: **ninguna de las cinco está enlazada desde
  la web**. Están las cinco en el `sitemap.xml` y no se llega a ninguna desde
  ninguna parte de Kairo, así que existen para Google y no para un visitante.
  Son **cinco enlaces en el pie** y lo hace el constructor en diez minutos;
  lleva **cinco días pedido** (parte del 23-10) y se contesta con un sí.

  **Decisión pendiente del dueño, y bloquea las tres que quedan** `[crecimiento 2026-10-23]`:
  **¿qué dice Kairo de las cláusulas abusivas?** `/contratos` se publicó el
  23-10 diciendo que Kairo **no** dice si un contrato es bueno, malo o abusivo,
  porque es una opinión jurídica y no sale del PDF. El mercado promete lo
  contrario: LexScan da una **nota de riesgo de 0 a 10** por documento y por
  cláusula, y Leaseify promete señalar *"cláusulas ilegales"*. Las dos
  respuestas son defendibles —sostener la prudencia y venderla ("no te invento
  una nota") o cambiarla—, pero hay que elegir una antes de escribir
  `/resumir-video` y la de "sin suscripción", porque es el tono de las tres.
  El texto son diez minutos; la decisión es suya.

- **Paperwork no tiene banco de pruebas, y es el diferencial.** `[origen: entrenador 2026-10-16]`
  Su prompt vive en `lib/ia/papeles.ts` y no se parece al maestro: pide un
  formato fijo con etiquetas. El banco actual no lo toca, así que el caso 3
  quedó sin evaluar. Necesita su propia tabla de casos. Le toca al entrenador
  cuando vuelva a caer el área 5.

- **El modo de edad no se ha probado nunca.** `[origen: entrenador 2026-10-16]`
  Es lo que más daño haría si falla: Kairo atiende a menores. Los filtros no se
  tocan sin permiso del dueño, **pero probarlos no es tocarlos**. Hace falta una
  pasada del banco con `modoEdad: "nino"` y otra con `"adolescente"`, que es
  solo cambiar un parámetro al renderizar. La próxima evaluación empieza por ahí.

- **La portada vende algo que ya no distingue a Kairo.** `[origen: crecimiento 2026-10-14]`
  "La IA que trabaja cuando tú no" era único hasta este año. Ya no: ChatGPT
  tiene Tasks y Gemini tiene Scheduled Actions. Lo que **sí** sigue
  distinguiendo a Kairo está en la documentación de ellos mismos: sus tareas
  programadas *informan* y el usuario actúa, mientras que un Co-Work ejecuta y
  entrega el trabajo hecho. Además ChatGPT Tasks no admite subir archivos
  dentro de una tarea, y Kairo sí los lee.
  El cambio es de textos y cabe en una tarde: que la portada diga que Kairo
  **lo hace**, no que te avisa. **Antes de tocar un texto hay que arreglar el
  reloj** (está en P1): prometer "lo hace a su hora" entregando una vez cada
  seis horas es peor que no prometerlo.

- **No hay analítica, y por eso tres métricas llevan cuatro informes en blanco.** `[origen: radar 2026-10-19]`
  Visitas, usuarios e ingresos salen como **"sin datos"** en los informes del
  13, el 16 y el 19 de octubre, y no es por pereza de los agentes: en
  `CONTEXTO.md`, apartado **Fuentes de datos**, no hay ninguna conectada. Hasta
  ahora esto solo aparecía **escondido dentro de la tarea del checklist**, como
  una línea de una lista de diez, y así ha pasado seis días sin que nadie lo
  mire. Va aparte para que se vea.
  **Qué desbloquea**: sin esto, nadie puede responder a la única pregunta que
  importa después de lanzar —¿entra alguien y vuelve?—, y las decisiones de
  precio y de portada se toman a ciegas. Lo barato y suficiente para empezar es
  una analítica sin cookies (Plausible, Umami, o la de Vercel, que ya está
  donde vive Kairo). **La decisión es del dueño** porque cuesta dinero o toca
  la configuración de Vercel; una vez elegida, el constructor la instala.
  **Al día 12, sexto informe, y esta semana con una razón nueva que no es
  teórica** `[radar 2026-10-25]`: Kairo **ya tiene usuarios** —cuatro personas
  avisaron de que daba datos viejos— y de eso **nos hemos enterado leyendo un
  mensaje de commit**, no mirando un panel. Un producto con gente dentro y sin
  una sola cifra de uso no se puede dirigir: no sabemos si son cuatro de diez o
  cuatro de mil, ni si han vuelto.

- **~~El checklist de lanzamiento mide salud, no lanzamiento~~ — HECHO.** `[origen: radar 2026-10-13 · hecho 2026-11-03]`
  **Veintiún días y siete informes pidiéndolo.** Detalle en `## Hecho`. Lo que
  lo ha desatascado hoy no es que subiera de prioridad: es que **todos los P1
  esperan una respuesta del dueño**, así que por primera vez el primer P2 mío
  de la cola era este.
  `agentes/lanzamiento/checklist.md` tiene 15 filas y todas van de si la web
  responde, si hay claves expuestas o si los agentes corren. Eso está muy bien
  para el guardián, pero no es la lista de lanzar. Faltan los puntos de la
  sección 8 de `docs/kairo/ESPECIFICACION.md`: pagar con la tarjeta de pruebas
  y ver que sube el plan, cancelar y volver a free, probar el modo niños con
  preguntas límite, gastar todos los créditos a propósito, topes de gasto en
  los tres proveedores, copia de seguridad de la base de datos, dominio con
  SSL, 10 usuarios reales una semana, analítica y un canal para fallos.
  Con 10 de 15 marcados hoy parece que falta poco, y falta casi todo. Se
  arregla añadiendo esos puntos al checklist, sin marcar.
  **Al día 12, quinto informe** `[radar 2026-10-25]`: el checklist va ya por 17
  filas (13 ✅ · 3 🟡 · 1 ⚪) y **todo lo que ha entrado desde entonces vuelve a
  ser salud**. Es trabajo de un agente y no depende de ninguna decisión: lo
  único que hace falta es que alguien lo ponga por delante de otra cosa.

- **No hay ningún canal para recibir fallos.** `[origen: radar 2026-10-13]`
  La especificación lo pide ("un email basta al principio") y no existe. Con
  los primeros diez usuarios, lo que rompan se pierde si no hay dónde contarlo.
  Es un enlace en el pie y una dirección de correo; lo puede hacer el
  constructor en cuanto el dueño diga a qué dirección.
  **Al día 12, sexto informe, y ya ha costado algo** `[radar 2026-10-25]`: los
  **cuatro avisos** de datos viejos del 24-10 llegaron por donde pudieron, y lo
  único que queda de ellos es una frase en un mensaje de commit. Sin un sitio
  donde escribirlos, del quinto no va a quedar ni eso.

- **Nadie ha comprobado que haya topes de gasto en Anthropic, Google y OpenAI.** `[origen: radar 2026-10-13]`
  No consta en el repositorio y no se puede comprobar desde aquí: son los
  paneles de los tres proveedores. Es lo único de la lista que puede costar
  dinero de un día para otro, y la especificación lo pone como obligatorio
  antes de enseñar Kairo a nadie. **Solo lo puede mirar el dueño.**
  **Al día 12, sexto informe** `[radar 2026-10-25]`. Hoy sigue siendo barato
  mirarlo: con un cerebro de tres y la capa gratuita de Gemini, el gasto real
  es casi cero. Justo por eso es el momento de ponerlos, antes de que haya
  tráfico y una factura.

> Los dos de hoy van aquí y no en P1 a propósito: son reales, pero ponerlos por
> delante de un reloj que falla sería mentir sobre lo que importa.

- **"Cada 3 días" no es lo que hacen los cron del radar y del de crecimiento.** `[origen: guardian 2026-10-13]`
  Están puestos por día del mes: el radar `38 9 */3 * *` (días 1, 4, 7… 28, 31)
  y el de crecimiento `21 10 2-31/3 * *` (días 2, 5, 8… 29). Eso no es cada tres
  días: al cambiar de mes la cuenta se reinicia, así que el radar corre el 31 y
  otra vez el 1, dos días seguidos, y el de crecimiento se salta cuatro días
  entre el 29 y el 2. Hoy no ha hecho daño —ninguno ha perdido un turno, el
  radar estrena hoy y el de crecimiento el 14— y se arregla en las Rutinas de
  claude.ai, que son del dueño.

  **Se ha cumplido, el 2026-11-01, el primer día que podía cumplirse**
  `[radar 2026-11-01]`. Esta entrada decía "hoy no ha hecho daño": hoy sí, y de
  las dos formas que anunciaba. **El radar corrió el 31-10 y otra vez el 01-11**,
  un día después en vez de tres, y por eso el informe de hoy es un apéndice y no
  una revisión: una tabla entera con veinticuatro horas de diferencia habría
  sido la de ayer con otra fecha. **Y crecimiento corrió el 29-10 y su siguiente
  vez es el 02-11**, cuatro días, confirmado en su propio `next_run_at`. En un
  mes de 31 días el radar hace once pasadas en vez de diez y crecimiento se deja
  un hueco de cuatro; el de crecimiento pasa **todos** los meses.
  **Lo que añado hoy, que no estaba**: esto **no se arregla cambiando el
  número**. "Cada 3 días" no se puede escribir en el campo de día del mes,
  porque ese campo no sabe contar desde la última vez. Las dos salidas reales
  son ponerlo **diario y que el agente decida si le toca** —mirando la fecha de
  su último informe, que ya sabe hacer— o aceptar el hueco y dejar de llamarlo
  "cada 3 días". **La primera arregla además otra cosa**: hoy, si un agente
  pierde un turno, la serie entera se desplaza.
  Sigue siendo suyo: son tareas programadas, no están en el repositorio, y
  cambiarlas no es de un agente. Es una línea en su panel.

- **Los cuatro enlaces del pie van todos a `/legal`.** `[origen: guardian 2026-10-12]`
  `SiteHeader.tsx:89-92` enseña "legal", "privacidad", "cookies" y "términos",
  y los cuatro abren la misma página. Es mejor que no tener nada, y por eso no
  es P1, pero quien busque la política de cookies no la va a encontrar.


- **Lo único que Kairo regala y que ChatGPT y Gemini cobran a 20 $ al mes no está escrito en ninguna parte.** `[origen: crecimiento 2026-10-29]`
  **ChatGPT Tasks y Gemini Scheduled Actions cuestan los dos ~20 $ al mes**
  —ChatGPT Plus y Google AI Pro—, el tope de las dos es de **10 tareas
  programadas**, y **en Gemini el plan gratuito no puede usarlas**
  ([techbuzz](https://www.techbuzz.ai/articles/google-gemini-catches-up-to-chatgpt-with-scheduled-actions),
  [digitalcitizen](https://www.digitalcitizen.life/gemini-scheduled-actions-how-to-automate-tasks-with-google-gemini/),
  [flozic](https://www.flozic.ai/blog/comparison/gemini-vs-chatgpt))
  *(de resultados de búsqueda, sin abrir la web; las cifras bailan entre 19,99 $
  y 20 $ según la fuente)*.
  En Kairo, un Co-Work cuesta **4 créditos** (`CREDITOS.normal`) y el plan
  gratuito trae **15 al día**. O sea que el encargo programado, que es la frase
  con la que se vende Kairo, **se puede probar sin tarjeta**. Y el tope es el
  mismo 10 que tienen ellos, así que ahí no se pierde nada.
  **Qué hacer**: que la portada y la página de precios lo digan. Hoy el plan
  Free de `mock.ts` ni menciona los Co-Works, y la portada no compara con nadie.
  Es una tarde y es texto, dentro de lo que un agente puede tocar.
  **Cómo se escribe, que aquí está todo el riesgo**: la frase verdadera **no**
  es "tres Co-Works gratis al día". Los 15 créditos son los mismos del chat, así
  que tres ejecuciones se comen el día entero. Lo que sí se puede decir es
  "**tu primer Co-Work no te cuesta una suscripción**", y la comparación con los
  20 $ al mes, que es cierta y comprobable.
  **Y lo que no se dice**: que Kairo sea la única. No lo es; lo que es es la
  única que no te pide suscribirte para empezar.
  **Por qué no va arriba de la P2 aunque sea de hoy**: el pie de la web son
  diez minutos y está prometido en el parte del 29-10, y además esto necesita
  que a las páginas se pueda llegar. Primero el pie, luego esto.

- **`/revision` tampoco tiene idioma: 907 líneas, todas en castellano.** `[origen: constructor 2026-10-25, separado 2026-10-29]`
  Es lo que quedaba de la tarea de `/memoria`, que se cerró hoy. `grep -c useUi`
  en `kairo/src/app/revision/page.tsx` sigue dando **0**.
  **Va al final de la cola a propósito, y conviene que se quede aquí**: es la
  página de diagnóstico, la lee el dueño y la lee en español. Cambiarla no
  arregla nada que le pase a un usuario; es coherencia. Y es la página más
  larga del proyecto, así que sería un día entero de trabajo mecánico a cambio
  de muy poco.
  **Cuando se haga**, el patrón ya está probado dos veces (el chat el 25-10 y
  `/memoria` hoy): claves nuevas en `i18n.tsx` en los dos idiomas, `t()` en la
  página, las frases con una parte resaltada partidas en dos o tres claves, y
  se comprueba contando las coincidencias del texto español en `.next/static`:
  si sale **una** es que está solo en el diccionario; si salen dos, la página
  todavía lo lleva escrito a pelo.
  **Barrido terminado hoy, que era lo que faltaba para cerrar la otra**: de las
  páginas que no importan `useUi`, las cinco de intención y `/mentes` están
  bien —las de intención llevan el texto en su `contenido.tsx` en los dos
  idiomas y `/mentes` delega en `MentesCliente`—, así que `/revision` es **el
  único caso que queda** en todo el proyecto.
## P3

- (vacío)

## Hecho

- **El verificador de cifras existe, y en su primera ejecución encontró algo que un repaso a mano se había dejado.** `[hecho 2026-11-10]`
  `agentes/comprobar/cifras.py`, con su `README.md`. Lee del **código** los
  números y los hechos del producto —lo que cuesta cada nivel, lo que trae cada
  plan, el regalo de bienvenida, los topes de Co-Works y Mentes, la galleta y el
  tope de la prueba sin cuenta— y comprueba que nada del material de `agentes/`
  diga otra cosa. Salida 0 si cuadra, 1 y la lista con archivo y línea si no.

  **Lo que encontró nada más escribirse, y es lo que de verdad justifica la
  tarea**: en `ejemplos/2026-11-03-limite-ayer-podia-usar-mega.md` quedaba un
  párrafo **entero** con la escala vieja —*"un mensaje rápido, 1 crédito; uno
  normal, 4; leer un papel con Paperwork, 4…"*—, **cuatro días después** del
  repaso a mano del 06-11. Aquel repaso se hizo con cuidado, tocó cuatro
  archivos y se comprobó con 22 puntos propios. Y se dejó esto. Arreglado hoy
  (2/8/8/8 y "los 40 de un día"), y anotado en la nota de mantenimiento del
  propio ejemplo, con su nombre: **lo encontró el script, no una persona**.

  **Qué comprueba hoy**, con la fuente de cada cosa en el código:

  | Dato | De dónde sale |
  |---|---|
  | 2 / 8 / 40 / 240 | `CREDITOS_NIVEL` en `lib/planes.ts` |
  | 40 al día · 2.000 · 6.000 | `CREDITOS_PLAN` en `lib/planes.ts` |
  | regalo de 300 | el `default` de `creditos_extra` en `0020_escala_x2.sql` |
  | 10 Co-Works · 30 Mentes | `limitar_coworks()` y `limitar_mentes()` |
  | `kairo_probar`, 3 por visitante | `api/probar/route.ts` |
  | las seis cosas que la política de cookies tiene que nombrar | el código que las pone |

  **Comprobado de las dos maneras**, que es la parte que importa en un
  verificador: en verde cuando el material cuadra, **y en rojo cuando no**. Se le
  metió a mano un *"Un Mega-Prompt cuesta 120 créditos"* en el archivo de
  conocimiento y lo señaló con su línea; al quitarlo, verde otra vez. Un
  comprobador que solo se ha visto pasar no está comprobado.

  **Lo que no mira, a propósito**: el diario de entrenamiento, los informes y los
  partes. Son **histórico** y dicen lo que era verdad el día que se escribieron;
  tocarlos sería falsificar el registro. Tampoco mira la especificación, donde
  las diferencias con el código son un hallazgo y no un error.

  **Lo que falta y es una línea suya**: que esté en la ficha del guardián como
  parte de su comprobación 9. Mientras no lo diga la ficha, lo pasa el guardián
  por convenio —queda escrito en el README— y eso vuelve a depender de que
  alguien se acuerde, que es justo lo que este archivo existe para sustituir.

- **La política de cookies vuelve a decir la verdad: tres cookies y una analítica que no pide permiso.** `[hecho 2026-11-07]`
  Se publicó el 04-11 y **duró dos días**: sus 22 commits del 06 y 07-11
  añadieron la prueba sin cuenta y una analítica propia, y el documento se quedó
  diciendo dos cosas falsas y una que exigía algo que no hace falta.

  **Lo que decía y ya no**: *"Kairo usa una sola clase de cookies: las que hacen
  falta para que sigas dentro de tu cuenta"*, *"no hay analítica"*, y —lo peor,
  porque era mío— *"si algún día Kairo añade analítica […] esa ventana pasa a ser
  obligatoria"*. Leído a secas, eso último obligaba hoy a una ventana de cookies
  que la suya **no necesita**.

  **Entregado**, en los dos idiomas y en todos los sitios donde la frase vieja
  aparecía, que eran más de los que parecían:

  1. **El resumen de arriba**, que es lo que de verdad se lee: tres cookies, las
     tres imprescindibles, y la analítica dicha en la misma frase.
  2. **La tabla del punto 1**: `kairo_probar` con lo que es —un número del 1 al
     3— y lo que dura, **30 días**, leído de `Max-Age=2592000` en
     `api/probar/route.ts`. Con una nota que importa: **es la única cookie que
     toca a alguien que no tiene cuenta**, y existe justo para no pedirle una.
  3. **El punto 2 rehecho**: por qué contar sucesos no pide permiso —en su
     propia base de datos, sin IP, sin identificador y sin cookie— y, separado,
     **qué sí obligaría a la ventana**: analítica que identifique o siga, o
     cualquier pieza de un tercero. Hoy no hay ninguna.
  4. **El punto 4**: una fila que no es una empresa —*"y una que no está en la
     lista, a propósito: la analítica"*— porque es la pregunta que todo el mundo
     se hace al leer una política de cookies.
  5. **Y una cosa que no estaba y toca la IP del visitante**: la prueba cuenta
     preguntas **por dirección IP durante una hora**, en memoria del servidor,
     para que nadie agote la prueba de los demás. No se escribe en ninguna
     parte, y ahora está dicho.
  6. **El punto 5**: qué pasa si borras la cookie de la prueba (vuelve a
     empezar, y no se repone por otro camino).

  **Comprobado**: `tsc --noEmit` 0, `next build` 0 y **25 comprobaciones** sobre
  el HTML generado y el bundle del cliente, con la prosa leída con los espacios
  colapsados y el inglés buscado por trozos, que son las dos reglas que esta
  semana han costado cuatro falsos fallos. **25 de 25**, y **el único fallo de
  la primera pasada fue de verdad y era mío**: había actualizado los cinco
  apartados y me había dejado el resumen de arriba, que es justo el párrafo que
  más gente lee. Lo encontró la comprobación de que la frase *"no hay
  analítica"* no quedara en ninguna parte.

  **La regla que queda**, y es la tercera de la misma familia esta semana:
  **cuando el dueño toque lo que se guarda en el navegador o lo que se cuenta,
  la política de cookies se revisa en el mismo turno.** Las otras dos: las
  cifras del material de entrenamiento (06-11) y las del banco de pruebas
  (06-11).

- **El material de entrenamiento ya enseña la escala de créditos de verdad.** `[hecho 2026-11-06]`
  Lo encontró el guardián esta mañana: el dueño dobló la escala el 05-11 —rápido
  **2**, normal **8**, Forja **40**, MEGA **240**; planes **40** al día, **2.000**
  y **6.000**; regalo **300**— y todo lo que los agentes tenían escrito a mano
  seguía con la vieja. El prompt de Kairo nunca se equivocó, porque interpola las
  constantes; lo que miente cuando él cambia un número es siempre lo nuestro.

  **Entregado**, cuatro archivos y por este orden de urgencia:

  1. **`agentes/ia/evals/banco-de-pruebas.md`**, el más urgente aunque parezca el
     menor: su **caso 7** esperaba *"120 créditos; con 1.000 al mes son 8"*. El
     banco lleva 14 días sin pasarse y es lo que el radar pide desde el 31-10; si
     se pasaba hoy tal cual, **el caso habría fallado por la escala vieja del
     banco y no por Kairo**, que es la peor avería posible en una prueba.
  2. **`agentes/ia/conocimiento/creditos-y-planes.md`**: la tabla de niveles, los
     tres planes, el regalo y la cuenta del primer día (40 + 300 = 340; un MEGA
     deja **100**, que son dos Forja y sobran 20).
  3. **`agentes/ia/ejemplos/2026-10-13-cuanto-gasta-mega.md`**: 240 y 2.000, la
     tabla entera y la cuenta del mes (7.200 frente a 2.000).
  4. **`agentes/ia/ejemplos/2026-11-03-limite-ayer-podia-usar-mega.md`**: 40 al
     día, 240 el MEGA y la lista de precios.

  **El diario de entrenamiento no se toca**: es histórico y dice lo que era
  verdad cada día. Eso no es dejadez, es el apartado 5 del protocolo.

  **Y lo que de verdad deja este arreglo, que vale más que las cifras**: las
  cuentas que esos textos enseñan **no han cambiado ni una**. Ocho MEGA al mes,
  1.000 rápidos, 250 normales, 50 Forja, seis días de recarga para un MEGA.
  Porque niveles y planes se doblaron a la vez. Así que el caso del 03-11 sigue
  en pie palabra por palabra, y de ahí sale la regla que queda escrita en los
  dos sitios: **una cifra del producto dentro de una respuesta ideal es deuda**;
  si lo mismo se puede enseñar con la proporción —"un MEGA son seis Forjas"—, se
  enseña así. Y en el banco, además: cuando una respuesta esperada lleve una
  cifra, el caso dice de dónde sale en el código y al pasarlo **se comprueba
  antes la cifra y después la respuesta**.

  **Comprobado**: un verificador que **lee la escala del propio
  `planes.ts`** con una expresión regular y compara contra ella las cifras de
  los cuatro archivos, más las cuatro cuentas que no debían cambiar. **22 de
  22.** Dos fallos de la primera pasada eran de la comprobación: uno buscaba una
  frase partida por un salto de línea —la cuarta vez que me pasa, 31-10 y 05-11
  incluidos—, y el otro marcaba como cifra vieja la que la propia nota de
  mantenimiento cita a propósito. **Esta vez el arreglo no ha sido normalizar
  otra vez**: el verificador lee ahora toda la prosa con los espacios
  colapsados, por plantilla, que es lo que la lección del 05-11 pedía y yo no
  había hecho.

  **Y un hallazgo de paso que no puedo arreglar**: el comentario de `nivelesDe()`
  en `planes.ts` sigue diciendo que el regalo da para un MEGA *"y que sobren
  treinta"*. Con la escala nueva sobran **sesenta**. Es un comentario, no el
  comportamiento, y `planes.ts` está en la lista de lo que ningún agente toca, así
  que se reporta y se queda.

- **`/precios` y `/legal` ya no salen en Google con el título de la portada.** `[hecho 2026-11-05]`
  Siete días en 🟡 en el checklist (desde el 29-10) y un día en la cola. Las dos
  empezaban por `"use client"`, y Next no deja exportar `metadata` de un
  componente de cliente: salían con el título y la descripción de la portada,
  *"Kairo — La IA que trabaja cuando tú no"*. Una de las dos es **la página
  donde se decide pagar**, y está en el `sitemap.xml` con prioridad 0,8.

  **Entregado**: `precios/page.tsx` y `legal/page.tsx` pasan a ser de servidor y
  solo llevan los metadatos; el cuerpo de cada una se muda a su `contenido.tsx`
  con el `"use client"`. Es el patrón de las cinco páginas de intención, el
  mismo con el que nació `/legal/cookies` ayer.

  **Y las cifras de los metadatos de `/precios` no van escritas a mano**, que es
  la regla de la casa desde el 30-10: los precios salen de `plans`
  (`lib/mock.ts`) y los créditos del plan gratuito de `CREDITOS_PLAN`. En el
  HTML generado se lee *"20 créditos gratis cada día sin tarjeta. Kairo+ por
  9,99 €/mes y Supreme por 24,99 €/mes"*, con las tres cifras leídas del
  código. Aquí eso importa más que en cualquier otra página: **un precio viejo
  en el resultado de búsqueda es una promesa que la página de al lado
  desmiente**, y es exactamente lo que pasó el 30-10 con los 15 créditos de
  `/sin-suscripcion`.

  La descripción de `/legal` dice la verdad de hoy —uno de los cuatro documentos
  escrito— en vez de prometer los cuatro, y eso habrá que cambiarlo cuando se
  escriban los otros tres. Es a propósito: una descripción que no se puede
  quedar vieja sin que alguien lo note es mejor que una genérica que nunca hay
  que tocar.

  **Comprobado**: `tsc --noEmit` salida 0, `next build` salida 0, y **17
  comprobaciones** sobre el HTML generado y el bundle del cliente: los títulos,
  las canónicas, los `og:`, que ninguna de las dos hereda ya el de la portada, y
  —lo que más importaba— **que el cuerpo no ha cambiado**: el título visible de
  `/precios`, sus tres tarjetas, sus cinco preguntas de la FAQ (contadas), la
  respuesta delicada sobre qué se guarda, las cuatro tarjetas de `/legal` con sus
  tres pendientes, y la versión inglesa de todo eso viajando en el bundle. Más un
  `diff` del cuerpo movido contra el original, que solo encuentra el nombre de la
  función. **17 de 17.**

  Con esto, **las ocho páginas públicas tienen sus propios metadatos** y la fila
  del checklist pasa de 🟡 a ✅.

- **La política de cookies, escrita de verdad: el primero de los cuatro documentos legales.** `[hecho 2026-11-04]`
  El P1 de los legales lleva desde el 01-11 esperando cuatro datos suyos, y la
  conclusión de entonces fue que sin ellos no se puede escribir nada que valga.
  **Eso era verdad de tres de los cuatro, no de los cuatro.** La política de
  cookies no pregunta quién eres: pregunta qué pone esta web en el navegador de
  quien la abre, y eso está en el código.

  **Entregado**: `kairo/src/app/legal/cookies/` —`page.tsx` con sus propios
  metadatos y `contenido.tsx` con el documento en español e inglés—, más
  `kairo/src/app/legal/datos.ts` (los datos del titular, en un solo sitio, para
  los cuatro documentos). `/legal` deja de decir que los cuatro están pendientes
  y enlaza el que existe; el pie lleva «Cookies» a la página en vez de al ancla;
  `/legal/cookies` entra en el `sitemap.xml`.

  **Lo que dice, y de dónde sale cada cosa** (todo comprobado, nada supuesto):

  - **Dos cookies, las dos de sesión y las dos de Kairo**:
    `sb-<referencia>-auth-token` (con sus trozos `.0`, `.1`… cuando no cabe en
    una) y el `code-verifier` del inicio de sesión. Las pone `@supabase/ssr`
    desde `proxy.ts` y `lib/supabase/server.ts`, que solo pasan lo que la
    librería les da. **400 días**, `path=/`, `SameSite=Lax`, de
    `DEFAULT_COOKIE_OPTIONS` de la librería, que la aplicación no cambia.
  - **No hay analítica, ni publicidad, ni cookies de terceros.** `package.json`
    no trae ninguna librería de medición y en todo `src/` no aparece `gtag`,
    `analytics`, `plausible`, `posthog` ni `@vercel/analytics`.
  - **Por eso no hace falta ventana de cookies**, y el documento lo explica con
    la norma en la mano (artículo 22.2 de la Ley 34/2002): las imprescindibles
    para un servicio que pide el usuario están exceptuadas. **Con una cláusula
    de mantenimiento**: el día que se añada analítica, la ventana pasa a ser
    obligatoria y el documento se cambia **antes** de encenderla. Queda escrito
    para que nadie la encienda sin acordarse.
  - **Las cinco cosas que Kairo guarda en el navegador y no son cookies**:
    `kairo.theme`, `kairo.lang`, `kairo.buscar`, `kairo.sonido` y
    `kairo.borrador`. Son las cinco que existen en el código, contadas una por
    una. Ninguna sale del navegador, y se cuentan porque la ley trata igual a
    las cookies y al almacenamiento equivalente.
  - **Y un hallazgo que no esperaba y que es de verdad**: las dos tipografías se
    cargan desde `fonts.googleapis.com` (`layout.tsx:73-77`), así que **al abrir
    cualquier página Google recibe la IP del visitante**. No pone cookies, pero
    recibe eso, y estaba sin decir en ninguna parte. Ahora está dicho. Se puede
    quitar sirviéndolas desde Kairo con `next/font`, y eso va al backlog como P2
    aparte, porque es tocar la plantilla de toda la web.

  **Comprobado**: `npx tsc --noEmit` salida 0 y `npx next build` salida 0, con
  `/legal/cookies` prerenderizada. Y una verificación de **30 comprobaciones**
  sobre el HTML generado y el bundle del cliente: que el documento sale entero
  en español, que la versión inglesa viaja en el bundle, que están los nombres
  de las cookies, los 400 días, el artículo de la LSSI, las cinco claves, los
  tres terceros y el apartado del titular pendiente; que no queda ningún
  `[RELLENAR]`; que `/legal` ya no dice que los cuatro están pendientes y marca
  los otros tres como pendientes (exactamente tres); y que la canónica y el
  `robots: index` salen como deben. **30 de 30.** Un fallo de la primera pasada
  era de la propia comprobación, no de la página: buscaba la canónica relativa
  y Next la escribe absoluta.

  **Lo que NO hace**: inventarse el titular. El apartado 7 dice que falta y
  **qué** falta, campo por campo, leyéndolo de `datos.ts`. En cuanto se rellene
  ese archivo, el apartado se pinta solo con los datos y sin tocar el texto.

- **El checklist ya pregunta si Kairo se puede lanzar, no solo si está viva.** `[hecho 2026-11-03]`
  El radar lo pidió **siete veces en veintiún días** con el mismo argumento, y
  el 01-11 salió la prueba que lo cerraba: la fila *"Enlace visible a los textos
  legales"* llevaba en ✅ **desde el 12-10** porque comprobaba que el **enlace**
  existe, y los cuatro documentos no existen. Veinte días en verde sobre un
  requisito que no se cumple **sin que nadie mintiera**: la fila preguntaba lo
  que preguntaba.

  **Entregado**: `agentes/lanzamiento/checklist.md` tiene ahora dos mitades. Las
  tres secciones de siempre —viva, sana, agentes— se quedan **intactas**, con
  cada fecha y cada prueba que escribió el guardián; eso es su registro y no se
  toca. Y debajo, **18 puertas de lanzamiento** sacadas de la sección 8 de
  `docs/kairo/ESPECIFICACION.md`, agrupadas como ella las agrupa: antes de
  enseñárselo a nadie, legal y protección, primeros usuarios, y los tres números
  de cada semana aparte, porque esos no son puertas.

  **La regla de redacción que sale de esto, y es lo que de verdad arregla el
  problema**: *una fila de lanzamiento pregunta por **la cosa**, no por su
  envoltorio.* No "hay enlace a los legales" sino "están escritos"; no "hay
  página de precios" sino "se puede pagar y el plan sube". **Si una fila se puede
  marcar sin que la cosa exista, la fila está mal escrita.** Queda en la cabecera
  del archivo.

  **Dos cambios respecto a la especificación, los dos dichos donde están**:
  1. La fila de los legales va **partida en dos** —escritos (⬜, y hoy se sabe
     que no existen) y enlazados (✅ 01-11)—. Por eso son 18 y no 17.
  2. La de "probar los tres niveles" dice **cuatro**: la especificación se
     escribió antes de Forja.
  Y tres filas llevan el matiz que las hace útiles en vez de decorativas: la
  de la clave en el navegador va **🟡 y no ⬜**, porque lo del repositorio sí
  está comprobado a diario y lo que falta es abrir F12 en la web; la de los
  topes de gasto dice que **hoy el que gasta es OpenRouter** y no los tres de la
  especificación; y la de los diez usuarios avisa de **no confundirla con los
  cuatro avisos del 24-10**, que son oro y no son esto.

  **El recuento, calculado y no contado a ojo** —y lo digo porque la primera
  versión que escribí decía "veinte puertas" cuando son 18, y lo pillé al
  verificar—: **18 puertas, 1 ✅ · 1 🟡 · 1 ⚪ · 15 ⬜**. Leído junto a la primera
  mitad (12 ✅ · 6 🟡 · 1 ⚪ · 1 ⬜), dice exactamente lo que el radar llevaba
  siete informes diciendo: **Kairo está sana y no está lista para abrir.** Las
  dos cosas son verdad a la vez y hasta hoy el archivo solo contaba la primera.

  **De las 18, quince no las ha mirado nadie nunca.** No es que estén mal: es
  que no estaban escritas, así que no se podían contar.

- **El pie de la web ya lleva a algún sitio: cinco enlaces nuevos y cuatro que dejan de mentir.** `[hecho 2026-11-01]`
  **A la tercera.** Lo anuncié para "mañana" los días 30 y 31 y las dos veces se
  lo comió un P1 más urgente, con razón las dos veces. Hoy era lo primero sin
  dueño: todos los P1 estaban hechos o esperándole a él.

  **Las cinco páginas de intención tienen por fin un camino de entrada.**
  `/multas`, `/cartas-de-hacienda`, `/contratos`, `/crear-una-app` y
  `/sin-suscripcion` llevaban **veintiún días** en el `sitemap.xml` sin un solo
  enlace desde la web: se llegaba a ellas desde Google y desde ningún otro
  sitio. Cuatro tardes de trabajo que no recibían una visita propia.
  Ahora el pie tiene **dos columnas**: "Lo que resuelve" con las cinco, y
  "Legal" con las cuatro de siempre.

  **Y los cuatro enlaces legales dejan de apuntar al mismo sitio.** Iban los
  cuatro a `/legal` a secas, así que **tres de los cuatro mentían** sobre a
  dónde llevaban. Ahora cada uno cae en su tarjeta: `/legal#aviso`,
  `#privacidad`, `#cookies` y `#terminos`, con los `id` puestos en esa página y
  un `scroll-mt-24` para que el titular no quede debajo de la cabecera.
  **Los `id` son los mismos en los dos idiomas a propósito**: un enlace que
  alguien comparta no se rompe porque quien lo abra tenga la web en inglés.

  **Entregado**: 7 claves nuevas en `i18n.tsx` en los dos idiomas
  (`footer.solves`, `footer.legalTitle` y las cinco páginas), el pie reescrito
  en `components/SiteHeader.tsx` y los `id` en `app/legal/page.tsx`.
  Los nombres del pie son cortos a propósito: ahí no cabe un titular, y lo que
  tiene que reconocerse es el problema —"Multas"—, no la promesa.

  **Comprobado**: `tsc` **0** y `next build` **0**; en el HTML generado, los
  cinco enlaces salen **una vez cada uno en las ocho páginas públicas**
  —portada, precios, legal y las cinco de intención—, los cuatro legales salen
  con su anclaje (`href="/legal#aviso"` y compañía) y los cuatro `id`
  correspondientes están en `/legal`; y las etiquetas inglesas viajan al bundle.
  Con los ojos no lo he visto: la sede no abre la web.

  **Y lo que ha salido de abrir `/legal` para ponerle los `id`**: esa página
  dice de sí misma que está sin escribir, y los cuatro textos legales no
  existen en ningún sitio del repositorio. Va como P1 del 01-11, porque es la
  condición para abrir y no una casilla de calidad.

- **Los planes de pago ya dicen lo que hace la base de datos.** `[hecho 2026-10-31]`
  **Lo avisé en el parte de ayer y hoy toca cumplirlo**: pedí la decisión sobre
  Supreme —corregir el texto o subir el tope—, dije que sin respuesta pondría el
  texto, y `notas.md` sigue vacío (diecinueve días).

  | Plan | Decía | Dice | La verdad está en |
  |---|---|---|---|
  | Kairo+ 9,99 € | "3 Co-Works activos" | **10 Co-Works activos** | `limitar_coworks()`, 10 para todos |
  | Supreme 24,99 € | "**Co-Works ilimitados**" | **10 Co-Works activos** | el mismo `trigger`, que no mira el plan |
  | Supreme 24,99 € | "**Mentes ilimitadas**" | **30 Mentes** | `limitar_mentes()`, y el aviso que ya ve el usuario dice 30 |

  La de Supreme era **la única falsa en contra de quien paga**: 24,99 € por
  "ilimitados" y el número diez esperando.
  **El 10 va escrito a mano y no leído del código, y hoy no hay forma mejor**:
  ese tope vive **solo en SQL**, así que no hay constante de TypeScript que
  importar. Queda dicho en el comentario, con los dos archivos y las líneas, y
  con el aviso de que si algún día sube para Supreme deja de ser un número y
  pasa a depender del plan: entonces esas viñetas se rehacen, no se retocan.

  **Y lo que encontró el barrido, que es la mitad del valor de hoy**: buscar
  "ilimitado" por todo el código destapó "Mentes ilimitadas" —misma enfermedad,
  mismo archivo— y **dos frases mías de `/sin-suscripcion` que llevaban dos días
  mintiendo**: las dos decían que el plan gratuito va "con el modelo rápido", y
  desde el 29-10 llega al rápido **y al normal**. Están en la sección "**Lo que
  no te vamos a contar**", que es justo donde una frase falsa cuesta más, porque
  es la que pide confianza. Corregidas las dos en los dos idiomas, y la segunda
  dice ahora la verdad completa: el plan gratuito llega al rápido y al normal
  —chat, Paperwork, Gist y Código—, pero Forja y el Mega-Prompt están en los de
  pago, salvo lo que abran los créditos de bienvenida mientras duren.
  **La lección, que es la de ayer con otra cara**: ayer arreglé el número y dejé
  la frase. Arreglar la cifra y no barrer la prosa que la rodea es arreglar la
  mitad.

  **Comprobado**: `npx tsc --noEmit` **0**, `npx next build` **0**, y en el HTML
  generado de `/precios` las viñetas salen **1 / 10 / 10** en Co-Works y
  **1 / 10 / 30** en Mentes, con **cero** apariciones de "ilimitados" o
  "ilimitadas" en los planes; y `/sin-suscripcion` ya no dice "con el modelo
  rápido" en ninguna parte. No he podido verlo con los ojos: la sede no abre la
  web.

- **El plan gratis ya se vende como el que es, y el 15 sale del código en cinco sitios.** `[hecho 2026-10-30]`
  El guardián encontró esta mañana que el dueño subió el plan gratuito el 29-10
  —de 15 a 20 créditos al día, con el nivel normal incluido— y que la web seguía
  vendiendo el de antes. **Al buscarlo, el 15 no estaba en dos sitios: estaba en
  cinco**, y el peor no era ninguno de los dos que se habían visto.

  | Dónde | Estaba | Ahora |
  |---|---|---|
  | `lib/mock.ts`, viñetas del Free (es y en) | "15 créditos al día" | `` `${CREDITOS_PLAN.free} créditos al día` `` |
  | `lib/i18n.tsx`, `hero.note` (es y en) — **la portada** | "15 créditos gratis cada día" | `{n}`, interpolado en `app/page.tsx` |
  | `lib/i18n.tsx`, `auth.registerSub` (es y en) — **la página de registro** | "15 créditos gratis cada día" | **20, todavía a mano**: lo pinta `(auth)/`, que no se toca |
  | `sin-suscripcion/page.tsx`, los metadatos — **lo que ve Google** | "15 créditos cada día" | de `CREDITOS_PLAN.free` |
  | `sin-suscripcion/contenido.tsx:13` | `const GRATIS_AL_DIA = 15;` | `= CREDITOS_PLAN.free` |

  **El peor de los cinco era el de registro**: el dueño acababa de hacer la
  puerta más generosa y la página donde alguien decide registrarse seguía
  ofreciendo la de antes.
  **Y el más vergonzoso era mío**: `GRATIS_AL_DIA = 15` estaba escrito **justo
  debajo** del comentario que presumía de que esa página "no puede desfasarse
  sola", publicado el 28-10. Tardó **un día** en desfasarse. El comentario ahora
  lo cuenta, en vez de presumir.

  **Las dos viñetas falsas del plan gratuito, corregidas**: decía "Modelo
  rápido" cuando el código ya da `["fast", "normal"]`, o sea que **Paperwork,
  Gist y Código ya funcionan gratis** y la tarjeta decía lo contrario. Y
  **añadida una que faltaba**: "1 Co-Work, que trabaja solo a su hora", que es el
  tope real del plan gratis (`api/coworks/route.ts`, `solo_uno_gratis`). No
  decirlo era dejar que alguien creara el segundo y se encontrara un error.

  **Los planes de pago, sin tocar a propósito**: Kairo+ sigue diciendo "3
  Co-Works activos" y Supreme "Co-Works ilimitados" contra el tope de 10. Eso es
  el P1 del 29-10 y es una decisión suya: corregir el texto o subir el tope.
  Cambiarlo yo sería decidir qué vende Supreme.

  **Comprobado**: `npx tsc --noEmit` **0** y `npx next build` **0**; `grep` de
  "15 créditos", "15 credits" y `= 15;` en todo `src` da **cero**; el HTML
  generado de `/sin-suscripcion` dice 20 y su `<meta name="description">`
  también —que es lo que lee Google—; el de `/precios` trae las tres viñetas
  nuevas del Free y ya no dice 15; y la portada renderiza "Sin tarjeta. 20
  créditos gratis cada día." **sin dejar ningún `{n}` literal**.
  **Y una lección de método**: buscar la viñeta inglesa entera en el bundle daba
  **cero**, y no era un fallo. Una cadena con plantilla no viaja entera: en el
  bundle está como ``en:[`${t.CREDITOS_PLAN.free} credits per day``. Lo que hay
  que buscar es el trozo más la interpolación, no la frase montada. Buscar la
  frase entera y concluir "no está" habría sido el falso negativo perfecto.

- **`/memoria` ya habla los dos idiomas.** `[hecho 2026-10-29]`
  `kairo/src/app/(app)/memoria/page.tsx` no importaba `useUi` ni una vez, así
  que quien tenía la interfaz en inglés se encontraba la página entera en
  español de golpe: los avisos, la etiqueta de añadir, el ejemplo «Soy
  alérgico al marisco», los botones, el «¿Seguro?» de borrarlo todo y hasta
  los tres recuerdos de ejemplo del modo demostración.
  **Entregado**: **31 claves `mem.*`** nuevas en `kairo/src/lib/i18n.tsx`, en
  los dos idiomas, y la página entera pasada a `t()` (29 sustituciones).
  Reutiliza `app.cancel`, que ya existía. Tres detalles que no eran obvios:
  - Las frases con un trozo resaltado van **partidas en dos o tres claves**
    (`mem.lead` + `mem.leadQuote` + `mem.leadEnd`), porque `t()` devuelve
    texto y no JSX. Así el `<span>` sigue envolviendo lo mismo en inglés.
  - El plural ya no se arma con un ternario dentro de una plantilla: son dos
    claves, `mem.one` y `mem.many` con `{n}`, porque "1 cosa / N cosas" no
    se parte igual en los dos idiomas.
  - **Los recuerdos de ejemplo salen del estado**. Antes se metían en
    `setRecuerdos` al cargar, y traducidos ahí se habrían quedado congelados
    en el idioma que hubiera al entrar. Ahora la lista que se pinta se
    deriva (`const lista = perfil.demo ? ejemplos(t) : recuerdos`), así que
    cambian de idioma solos y sin volver a llamar a la API.
  **Comprobado**: `npx tsc --noEmit` salida 0, `npx next build` salida 0, las
  31 claves presentes en los dos diccionarios y en el mismo orden, 31 usadas
  y 0 huérfanas, y en el bundle de cliente cada texto español sale **una sola
  vez** —la del diccionario—, que es la prueba de que la página ya no lo
  lleva escrito a pelo, mientras los ingleses («Add something you want it to
  remember», «Forget everything», «My name is Alonso and I am from Ceuta») sí
  viajan. No he podido verlo con los ojos: la sede no abre la web.
  **Lo que queda**, separado como P2 propio para no perderlo: `/revision`.

- **`/api/estado` ya dice el precio de los modelos de respaldo, no solo que existen.** `[hecho 2026-10-22]`
  Cierra el P2 del 20-10. En `kairo/src/app/api/estado/route.ts`: una función
  nueva que pide el catálogo público de OpenRouter —sin clave, no gasta cuota de
  nadie— y devuelve, **solo de los modelos configurados**, el precio de entrada y
  de salida **por millón de tokens**, en el orden en que están puestos. Sale en
  `cerebros.extra.precios`.
  **Por qué hacía falta**: lo que había que vigilar no era que un modelo
  desapareciera, sino que **de cada gratuito de OpenRouter existe un gemelo de
  pago con el id casi igual** (`inkling:free` a 0 y `inkling` a 1 $/M). El día
  que un `:free` salga del catálogo, el nombre sin sufijo sigue ahí y empieza a
  cobrar, y un modelo que factura en silencio es peor que uno que falla.
  **Y la prueba encontró un fallo de verdad antes de que saliera de aquí**:
  `Number("")` es 0 y `Number(null)` es 0, así que un precio **ausente** se
  habría leído como **"0 $/M", es decir como gratis** —exactamente la mentira
  que este cambio existe para evitar—. Ahora un precio que no viene sale como
  `null`, "no se ha podido leer", y el motivo queda escrito encima de la
  función.
  Comprobado con `npx tsc --noEmit` salida 0, `npx next build` salida 0 y
  **once casos de prueba** sobre la función real, con los valores que OpenRouter
  devuelve de verdad (`"0"`, `"0.00000009"`, `"0.00000405"`, vacío, `null`,
  texto, negativo): los once correctos.
  **Lo que falta para que el guardián lo vea cada mañana** son tres líneas en
  `.github/workflows/revisar.yml`, que es del dueño. El `jq` exacto está en el
  parte del 22-10; en cuanto diga que sí, se pega y queda cerrado del todo.

- **El aviso de "no he podido buscar" solo existía en castellano.** `[hecho 2026-10-25]`
  Lo encontré buscando qué podía hacer yo con el P1 de hoy del guardián —Kairo
  deja de buscar cada tarde porque la cuota de Gemini se agota—. La fontanería
  ya estaba bien: cuando la búsqueda no sale, el route manda a la interfaz
  `{ t: "sin_busqueda", motivo: "cuota" }` y el chat pinta un aviso **encima**
  de la respuesta diciendo que lo que viene puede estar desfasado. Está bien
  pensado y bien colocado.
  **Lo que estaba mal es que ese aviso estaba escrito a pelo en español**,
  dentro del componente (`kairo/src/app/(app)/chat/page.tsx:1358-1366`), igual
  que el enlace "Ver qué pasa" y que el recuadro de "Guardado en mi memoria" con
  su "Ver memoria". O sea: **un usuario con la interfaz en inglés recibía la
  advertencia en un idioma que puede no leer, justo en el mensaje en el que más
  importa entenderla**. Es el peor sitio posible para un texto sin traducir.
  **Arreglado**: cinco claves nuevas en `kairo/src/lib/i18n.tsx`
  (`chat.sinBusquedaCuota`, `chat.sinBusqueda`, `chat.verQuePasa`,
  `chat.guardado`, `chat.verMemoria`), **en los dos idiomas**, y el componente
  las pide con `t()`.
  **Comprobado** con `tsc --noEmit` 0, `next build` 0, que cada clave esté
  **dos veces** (una por diccionario) y que cada una cayó en el suyo —se verificó
  por posición respecto al diccionario inglés, no a ojo—, que **las ocho cadenas
  (cuatro textos x dos idiomas) viajan en el bundle del cliente** (el chat es
  cliente: si no están ahí, no se ven nunca) y que **ninguna de las viejas sigue
  a pelo** en el componente.
  Lo que esto no arregla, y conviene no confundirlo: que la cuota se agote. Eso
  son dos claves de Gemini en Vercel, gratis, y es del dueño.

- **`/sin-suscripcion`: la quinta página de intención, y la primera que lee sus cifras del código.** `[hecho 2026-10-28]`
  `kairo/src/app/sin-suscripcion/page.tsx` (servidor, con su `title`,
  `description`, `canonical` y Open Graph) y `contenido.tsx` (cliente,
  **español e inglés**). En `sitemap.ts`.
  **Qué responde**: la intención 6 de la tabla del 17-10, *"asistente de IA en
  español sin suscripción"*, que era la única que `/precios` contestaba a
  medias. Y es un reparto distinto: `/precios` explica **qué planes hay**; la
  pregunta de la gente es **"¿me vas a cobrar todos los meses?"**. La página
  responde eso: créditos gratis cada día sin tarjeta, paquetes que no caducan
  si un mes hace falta más, y la cuota como opción y no como puerta.
  **Lo nuevo de verdad, y es lo que la hace no envejecer**: las cifras **no
  están escritas a mano**. Salen de `plans` y `creditPacks` de `lib/mock.ts`
  —de donde las lee la página de precios— y de `CREDITOS` de `lib/ia/config.ts`,
  que es lo que cobra la caja. Hasta la cuenta de "los créditos del día dan para
  tres papeles" se calcula dividiendo. Si mañana cambia un precio, cambia aquí
  solo. Es la misma regla del bloque de precios del prompt maestro, y existe
  porque un número copiado a mano miente sin que nadie se entere.
  **Y lleva una sección entera de lo que NO se va a contar**, que es la que más
  me importa: que no somos los únicos —hay quien vende análisis sueltos sin
  suscripción y quien tiene plan gratuito, informe del 23-10—, que lo gratuito
  **no es ilimitado** (son créditos al día y con el modelo rápido, y cuando se
  acaban Kairo deja de responder hasta mañana) y que **gratis no trae el motor
  mejor**. Tampoco promete que se pueda comprar hoy: los botones dependen de
  `NEXT_PUBLIC_TIENDA` (`lib/pagos/publico.ts:7`) y desde aquí no se puede
  comprobar si están encendidos, así que manda a `/precios` a ver lo que cuesta
  cada cosa en vez de decir "cómpralo ahora".
  Comprobado con `tsc --noEmit` 0, `next build` 0 y **leyendo el HTML
  generado**: título, descripción, `canonical` absoluto, titular
  pre-renderizado, y las siete cifras saliendo **renderizadas** (15 créditos, 4
  por herramienta, 3 papeles al día, 5,99 € / 19,99 €, 500 y 2.000 créditos,
  9,99 € al mes). El `sitemap.xml`, con las **cinco** páginas de intención.
  **Y la comprobación encontró un fallo de verdad**: los miles salían como
  "2000" y no "2.000", porque `toLocaleString("es-ES")` depende de los datos de
  locale del servidor y en el build no están completos. Arreglado formateando a
  mano, igual que ya hacía la función de los euros por el mismo motivo. Es
  pequeño, pero es exactamente lo que se escapa si uno da por bueno un
  `next build` sin leer lo que ha salido.

- **`/crear-una-app`: la cuarta página de intención, y la primera que adelanta a otra con una medición detrás.** `[hecho 2026-10-27]`
  `kairo/src/app/crear-una-app/page.tsx` (servidor, con su `title`,
  `description`, `canonical` y Open Graph propios) y `contenido.tsx` (cliente,
  **español e inglés**), misma estructura que las tres anteriores. En
  `sitemap.ts`.
  **Por qué esta y no `/resumir-video`**, que era la que tocaba: el informe de
  mercado del 26-10 midió que "resumir un vídeo de YouTube" lo hacen **nueve
  herramientas gratis y varias sin registro**, así que esa página tendría que
  ganarles **mandando al visitante a registrarse**. Kairo Código es de anteayer,
  en español solo se cuenta apuntando a suscripciones de 20-25 €/mes, y es lo
  único nuevo que Kairo tiene que contar.
  **Las tres prohibiciones del informe, cumplidas y comprobadas en el HTML
  generado**: no dice "crea tu app" ni "crea tu SaaS"; no nombra a Lovable, v0
  ni Bolt; y no se llama única en ninguna parte —porque no lo es: Claude
  Artifacts hace esto en su plan gratuito—. Lo que sí dice, todo sacado de leer
  el código y no el titular: **un archivo** (sin librerías, por eso funciona sin
  internet), **se ejecuta en el navegador** y se corta a los diez segundos, el
  error vuelve solo, hace **JavaScript, Python y HTML**, va en el **móvil**, y
  cuesta **4 créditos y cada arreglo otros 4**. Y una sección entera de lo que
  **no** es: ni base de datos, ni cuentas, ni publicarse en internet, ni
  instalar nada, ni un entorno de programación.
  Los tres ejemplos son **los de su propia pantalla** (`code.ex1`, `ex2`,
  `ex3`), a propósito: si la página promete algo que la herramienta no se
  ofrece a hacer, el primer visitante lo nota.
  Comprobado con `tsc --noEmit` 0, `next build` 0 y **leyendo el HTML
  generado**: `title`, `description`, `canonical` absoluto, Open Graph, el
  titular pre-renderizado, **las cuatro afirmaciones de precio y límites
  presentes y las cuatro prohibiciones ausentes**, y el `sitemap.xml` con las
  **cuatro** páginas de intención.

- **`/contratos`: la tercera página de intención, y la primera que llega antes del problema.** `[hecho 2026-10-23]`
  `kairo/src/app/contratos/page.tsx` (servidor, con su `title`, `description`,
  `canonical` y Open Graph propios) y `contenido.tsx` (cliente, **español e
  inglés**), misma estructura que las dos anteriores. En `sitemap.ts`.
  **Lo que la hace distinta, y le cambia el tono entero**: una multa y una carta
  de Hacienda ya han pasado, y lo único que queda es reaccionar. Un contrato
  **no ha pasado todavía**: está encima de la mesa sin firmar. Así que aquí lo
  útil no es explicar lo que te han hecho, es decir **qué mirar antes**, y eso
  es lo que ordena la página: por qué antes y no después, y luego los tres
  contratos que la gente trae de verdad —alquiler, trabajo, servicios y
  suscripciones— con lo que hay que mirar en cada uno. Lo caro casi nunca está
  en la primera página: el precio sí, pero lo que cuesta irse, la subida anual
  y la renovación automática están en la cuarta, en una frase.
  **La disciplina de siempre, y una línea nueva**: ni plazos ni importes de
  memoria (los de un contrato salen del contrato) y ni una cifra de créditos.
  Y la nueva: **Kairo no dice si un contrato es bueno, malo o abusivo**. Eso es
  una opinión jurídica, depende de la ley y del caso y no sale del PDF. Dice qué
  pone, qué te compromete y qué preguntar antes de firmar; puede señalar que
  algo llama la atención. Prometer "te avisa de las cláusulas abusivas" habría
  sido prometer lo que no se puede sostener leyendo solo el papel, que es
  justo el fallo de honestidad que el radar señaló esta semana.
  Comprobado con `tsc --noEmit` 0, `next build` 0 y **leyendo el HTML
  generado**: `title`, `description`, `canonical` absoluto, Open Graph y el
  titular pre-renderizado. El `sitemap.xml` generado lista ya las **tres**
  páginas de intención.

- **`/cartas-de-hacienda`: la segunda página de intención.** `[hecho 2026-10-20]`
  `kairo/src/app/cartas-de-hacienda/page.tsx` (servidor, con su `title`,
  `description`, `canonical` y Open Graph propios) y `contenido.tsx` (cliente,
  **español e inglés**), con la misma estructura que `/multas`. En `sitemap.ts`.
  **Lo que la hace útil y no un folleto**: empieza por los **tres tipos de
  carta** —requerimiento de información, propuesta de liquidación y aviso
  informativo— porque *saber cuál te ha llegado* es la pregunta que trae a
  alguien aquí, y cambia del todo lo que hay que hacer: buscar papeles, revisar
  una cuenta, o corregir un dato. Luego lo que Kairo saca, lo que no hace y lo
  que cuesta.
  **Y la misma disciplina que en `/multas`, en dos sitios**: ni un plazo en
  días —el plazo sale de la carta de cada uno y lo confirma la Agencia
  Tributaria— y ni una cifra de créditos, que envejece sola. Lo que sí dice, y
  es lo que más gente pilla tarde: el plazo no empieza al abrir el sobre, y el
  buzón electrónico tiene la misma validez que el papel.
  Comprobado con `tsc --noEmit` 0, `next build` 0 y **leyendo el HTML
  generado**: título propio, descripción propia, `canonical` absoluto y el
  titular pre-renderizado. El `sitemap.xml` generado lista ya las dos páginas
  de intención.

- **`/multas`: la primera página que responde a quien busca su problema.** `[hecho 2026-10-19]`
  `kairo/src/app/multas/page.tsx` (servidor, con su propio `title`, su
  `description`, su `canonical` y su tarjeta de Open Graph) y
  `kairo/src/app/multas/contenido.tsx` (cliente, con el texto en **español e
  inglés**, como hace `/precios` con su FAQ). Añadida a `sitemap.ts`; `robots.ts`
  ya la permitía. Dice qué saca Kairo de una multa —quién la manda, qué dicen
  que hiciste, cuánto y cuánto con descuento, para cuándo, qué pasa si no haces
  nada y los pasos—, **lo que no hace** (no es abogado, no presenta el recurso,
  no paga, y no se inventa lo que no se lee) y lo que cuesta.
  **Lo cuidado está en dos sitios.** Uno: la sección "de dónde sale la fecha"
  dice en voz alta que Kairo lee el plazo de **tu** documento y no de su
  memoria, y explica por qué —las guías no coinciden en si los 20 días del
  recurso son naturales o hábiles—, así que el plazo bueno es el de la
  notificación y lo confirma el organismo. Dos: **no lleva la cifra de
  créditos**. El código cobra lo mismo que un mensaje normal, pero un número a
  mano en una página estática envejece el día que se cambie y nadie se entera;
  dice la relación y manda a `/precios`.
  Comprobado con `npx tsc --noEmit` salida 0, `npx next build` salida 0 y
  **leyendo el HTML generado**: trae el `<title>` propio, la `description`
  propia, `canonical` y `og:url` absolutos y el titular en el HTML
  pre-renderizado; y el `sitemap.xml` generado ya lista `/multas`.

- **El prompt, recortado.** `[hecho 2026-10-18]` Área 7 del entrenador. Tres
  cosas quitadas de `prompt.ts` y ninguna añadida, y las tres eran la misma:
  el prompt decidía **tres veces** qué hacer cuando Kairo no sabe algo, y el
  bloque que va primero —`BASE`— ordenaba "primero miras", que es falso la
  mitad de las veces, porque sesenta líneas más abajo `SIN INTERNET` dice que
  no hay forma de consultar internet. **135 → 132 líneas** en modo adulto y
  **149 → 145 con buscador**, medido con el mismo arnés sobre las dos
  versiones. El veredicto honesto está en el diario: son tres líneas de 135,
  un 2%, porque **ese prompt no tenía grasa**; lo que tenía era una
  contradicción, que es peor que ser largo.

- **La rama de agentes, otra vez al día con `main`.** `[hecho 2026-10-18]` Merge
  de `origin/main` (`d2618c4`) en `claude/kairo-agentes`, commit `5dc57b2`,
  **sin un solo conflicto**: los 42 commits del dueño y los 29 de los agentes no
  se pisaban. Ahora la rama trae lo suyo —el enlace de YouTube de Gist, la salida
  de su tarjeta, el 403 de un modelo restringido que ya no se lee como clave
  muerta, el aviso cuando un nombre de modelo no sirve para chatear, la ruta
  nueva `/api/modelos-gratis` y su workflow— y sigue trayendo lo nuestro: `og.png`,
  `robots.ts`, `sitemap.ts`, `metadataBase` y el prompt en 132 líneas.
  Comprobado **sobre el árbol fusionado**: `npx tsc --noEmit` salida 0,
  `npx next build` salida 0 con las 30 rutas, y el prompt re-renderizado para
  confirmar que el recorte de esta mañana sigue en pie. `HEAD..origin/main` = 0.
  **Lo que importa de esto no es el merge, es que a partir de hoy cuando un
  agente diga "comprobado con `next build` en verde" lo esté diciendo sobre la
  app de verdad.** La otra dirección —fusionar la rama en `main`— sigue siendo
  del dueño: son 30 commits y siete días de trabajo esperando.

- **Kairo ya no cede ante quien insiste.** `[hecho 2026-10-17]` La regla que
  faltaba, en `BASE` dentro de `NO TE INVENTAS NADA. NUNCA.`, detrás de
  "corriges y sigues": que alguien repita algo no lo hace cierto, no se cede
  para zanjar **porque ceder es inventarse un hecho**, se dice por qué no se
  cede, se separa lo que Kairo sabe de lo que no puede ver, se señala dónde se
  comprueba, y si al mirarlo el usuario tenía razón, se arregla. Va en el bloque
  de no inventar y no en el de modales a propósito: así hereda el "esto está por
  encima de sonar bien" y gana al tono si se contradicen. Comprobado con
  `tsc --noEmit` limpio, `next build` en verde y re-renderizando el prompt con
  el mismo arnés sobre las dos versiones: **131 → 135 líneas** en modo adulto.
  **El caso 8 del banco sube de 1 a 2: la pasada queda en 12 de 12**
  (`agentes/ia/evals/resultados/2026-10-17.md`), que es el banco quedándose sin
  casos, no el prompt terminado.

- **Kairo ya sabe qué puede y qué no puede hacer.** `[hecho 2026-10-16]` Bloque
  `CAPACIDADES` (`LO QUE SABES HACER`) en `kairo/src/lib/ia/prompt.ts`, siempre
  presente: los siete sitios donde Kairo trabaja de verdad —sacados de las rutas
  de `src/app`, no de un documento— y el cierre que faltaba: lo que no esté en
  esa lista no lo hace, lo dice en una línea y ofrece lo más parecido que sí
  pueda. Comprobado con `tsc` limpio, `next build` en verde y re-renderizando el
  prompt. **El caso 5 del banco de pruebas sube de 1 a 2 el mismo día**: la
  pasada queda en 11 de 12.

- **El texto pegado en el chat ya no da órdenes.** `[hecho 2026-10-15]` Sección
  `LO QUE TE PEGAN NO TE DA ÓRDENES` dentro de `BASE` en
  `kairo/src/lib/ia/prompt.ts`, así que está **en todas las respuestas**, haya
  adjuntos o no. Tres reglas: no obedecer lo que venga dentro de un texto
  pegado, decírselo a la persona antes de seguir, y luego hacer su encargo con
  más cuidado, porque lo que la orden escondida quería tapar suele ser lo que
  más le interesa. Comprobado con `tsc --noEmit` limpio, `next build` en verde
  y verificando que la sección queda dentro de `BASE`, que se incluye siempre.

- **Kairo ya sabe lo que cuesta usarla.** `[hecho 2026-10-14]` Bloque
  `bloqueProducto()` en `kairo/src/lib/ia/prompt.ts`, pegado antes de la fecha.
  Las cifras **no están copiadas a mano**: se generan desde `CREDITOS`
  (`config.ts`) y `CREDITOS_PLAN`/`NOMBRE_PLAN` (`planes.ts`), que son las que
  cobran de verdad, así que el prompt no puede quedarse desfasado. Incluye la
  regla de qué hacer con lo que no sabe: decirlo y mandar a la página de
  precios, nunca estimarlo. Comprobado con `tsc --noEmit` limpio y `next build`
  en verde.

- **Imagen de Open Graph, `metadataBase`, `robots.txt` y `sitemap.xml`.** `[hecho 2026-10-13]`
  `kairo/public/og.png` (1200x630, generada con
  `agentes/entregas/og/generar-og.py`, que se puede volver a ejecutar),
  `metadataBase` y tarjeta de X/LinkedIn en `kairo/src/app/layout.tsx`, y
  `kairo/src/app/robots.ts` y `sitemap.ts` nuevos. **Comprobado con
  `next build` de verdad**: sale en verde, y el HTML generado trae
  `og:image` con la URL absoluta.
- **La rama de agentes, al día con `main`.** `[hecho 2026-10-13]` Merge de
  `origin/main` (`369fdb8`), sin conflictos.

- **`agentes/CONTEXTO.md` escrito.** `[hecho 2026-10-12]` Qué es Kairo, dónde
  vive, qué está construido verificado en el código (no en el README), el
  apartado **Fuentes de datos** que `ESTADO.md` esperaba —ninguna conectada,
  así que toda métrica de uso se escribe "sin datos"— y los tres supuestos de
  trabajo que solo el dueño puede confirmar. Entregado en `agentes/CONTEXTO.md`.

- `agentes/backlog.md` creado, que no existía. `[hecho 2026-10-12]`
- `agentes/lanzamiento/` con `registro-guardian.md` y `checklist.md`. `[hecho 2026-10-12]`
