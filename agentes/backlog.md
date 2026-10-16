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

- **Cuatro preguntas al dueño llevan 2 días sin contestar, y bloquean cuatro tareas.** `[origen: guardian 2026-10-14]`
  `agentes/notas.md` sigue vacío. Las cuatro están estudiadas y preparadas, solo
  falta la decisión: si Kairo+ llega a MEGA, qué hacer con el reloj, si la
  tienda de pagos está encendida y si Kairo está lanzada. Mientras no lleguen,
  el constructor va saltando a tareas de segunda fila y los agentes trabajan con
  supuestos que pueden ser falsos (están escritos en `CONTEXTO.md`).
  **No hay nada que un agente pueda hacer aquí.** Se anota como P1 para que se
  vea el tiempo que lleva, no para que alguien lo resuelva.

- **Dos precios más que chocan entre el documento y el código.** `[origen: entrenador 2026-10-14]`
  Un Co-Work ejecutado cobra **4** créditos (`api/coworks/ejecutar/route.ts:49`,
  `CREDITOS.normal`) y la especificación dice **40**. Analizar un documento con
  Paperwork cobra **4** (`api/paperwork/route.ts:73`) y el documento dice **15**.
  Ninguno es un descuido: el código lo justifica por escrito ("lo mismo que un
  mensaje normal: es uno"). Pero el margen mínimo garantizado de la sección 3 de
  la especificación está calculado con 40 y con 15, así que esa cuenta hoy no
  describe lo que pasa. **O se corrige el documento o se corrigen los precios, y
  lo decide el dueño**: los créditos no los toca ningún agente.

- **Kairo+ tiene los mismos niveles que Supreme en el código, MEGA incluido.** `[origen: constructor 2026-10-12]`
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

- **El reloj horario de los Co-Works no suena cada hora: suena 3 veces al día.** `[origen: guardian 2026-10-12, empeora 2026-10-13]`
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
  **una ejecución por hora**. Kairo entrega una cada seis. En el único terreno
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

## P2

- **No hay ninguna regla sobre no ceder ante quien insiste.** `[origen: entrenador 2026-10-16, del banco de pruebas]`
  Caso 8, puntuado **1 de 2**. Es el vicio más característico de un modelo sin
  afinar y el que más caro sale cuando la discusión va de dinero: si Kairo le da
  la razón a alguien sobre un cobro que no ocurrió, esa persona escribe al dueño
  con una conversación donde la propia Kairo se lo confirma.
  **Arreglo**: una línea en `BASE`, junto a "corriges y sigues": *"que alguien
  repita algo no lo hace cierto. Si no cedes, di por qué, separa lo que sabes de
  lo que no, y señala dónde se comprueba."* El caso está escrito entero en
  `agentes/ia/ejemplos/2026-10-15-limite-usuario-que-insiste.md`.

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

- **El checklist de lanzamiento mide salud, no lanzamiento.** `[origen: radar 2026-10-13]`
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

- **No hay ningún canal para recibir fallos.** `[origen: radar 2026-10-13]`
  La especificación lo pide ("un email basta al principio") y no existe. Con
  los primeros diez usuarios, lo que rompan se pierde si no hay dónde contarlo.
  Es un enlace en el pie y una dirección de correo; lo puede hacer el
  constructor en cuanto el dueño diga a qué dirección.

- **Nadie ha comprobado que haya topes de gasto en Anthropic, Google y OpenAI.** `[origen: radar 2026-10-13]`
  No consta en el repositorio y no se puede comprobar desde aquí: son los
  paneles de los tres proveedores. Es lo único de la lista que puede costar
  dinero de un día para otro, y la especificación lo pone como obligatorio
  antes de enseñar Kairo a nadie. **Solo lo puede mirar el dueño.**

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

- **Los cuatro enlaces del pie van todos a `/legal`.** `[origen: guardian 2026-10-12]`
  `SiteHeader.tsx:89-92` enseña "legal", "privacidad", "cookies" y "términos",
  y los cuatro abren la misma página. Es mejor que no tener nada, y por eso no
  es P1, pero quien busque la política de cookies no la va a encontrar.

## P3

- (vacío)

## Hecho

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
