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

- **La sede no tiene permiso de red para llegar a la web de Kairo.** `[origen: guardian 2026-10-12]`
  `curl` y `WebFetch` a `kairo-six-lemon.vercel.app` fallan con
  `getaddrinfo ENOTFOUND` y con un 403 del proxy al hacer CONNECT. Por eso las
  comprobaciones 1, 2, 3, 5 y 7 del guardián se quedan a medias: lo que dicen
  `/api/estado` y `/revision` (qué variables de entorno faltan, qué migraciones
  no están aplicadas) no hay forma de leerlo desde aquí, y es justo lo que
  avisaría de una avería antes de que se note.
  Se arregla en los ajustes del entorno de Claude → **Network access** →
  añadir `kairo-six-lemon.vercel.app` a los dominios permitidos.
  **Anotado una sola vez**: mientras no esté abierto es una limitación
  conocida, no un hallazgo nuevo, y no se repite cada día.

- **El reloj horario de los Co-Works no suena cada hora: suena 3 veces al día.** `[origen: guardian 2026-10-12, empeora 2026-10-13]`
  `kairo-coworks.yml` pide `cron: "5 * * * *"`, pero las ejecuciones reales van
  muy por detrás. GitHub retrasa y se salta las ejecuciones programadas cuando
  su planificador va cargado, y no avisa: todas salen en verde.

  | Medido | Ejecuciones | Peor hueco |
  |---|---|---|
  | 12-10 (10 últimas, 47 h) | 1 cada 4,7 h | 7 h 23 min |
  | 13-10 (últimas 24 h) | **3 en 24 h**, no 24 | **10 h 14 min** (12-10 de 07:13 a 17:27 UTC) |

  Va a peor, no a mejor. Con un hueco de diez horas, un Co-Work de las 21:00
  puede salir al día siguiente.
  Importa porque es exactamente lo que ese workflow existe para evitar, según
  su propio comentario: *"es el que hace que un Co-Work puesto a las 21:00
  salga de verdad a las 21:00"*. Con huecos de 7 horas, un Co-Work puede salir
  con medio día de retraso y un aviso de plazo de Paperwork llegar tarde.
  El cron de Vercel (`kairo/vercel.json`) no cubre el hueco: es uno al día a
  las 06:00. Hay que decidir: o un reloj externo de verdad (cron-job.org,
  Upstash QStash, una Scheduled Function), o aceptar el retraso y decírselo al
  usuario en la interfaz al programar un Co-Work, que es lo honesto si no se
  va a pagar por un reloj.

- **Al compartir Kairo no sale tarjeta: falta la imagen de Open Graph.** `[origen: guardian 2026-10-12]`
  `kairo/src/app/layout.tsx` tiene `openGraph` con título y descripción, pero
  sin `images` y sin `metadataBase`. Sin `metadataBase`, Next no sabe construir
  la URL absoluta de la imagen aunque se añada. Un enlace a Kairo pegado en
  WhatsApp, X o LinkedIn sale como texto desnudo, que es lo que más baja el
  número de clics.

- **No hay `robots.txt`.** `[origen: guardian 2026-10-12]`
  No existe `robots.ts`, ni `robots.txt`, ni carpeta `public/`. Los buscadores
  entran sin instrucciones y rastrean también las rutas de aplicación
  (`/chat`, `/ajustes`, `/revision`), que no tienen nada que indexar. De paso
  conviene un `sitemap.ts` con las páginas públicas: portada, `/precios`,
  `/legal`.

## P2

> Los dos de hoy van aquí y no en P1 a propósito: son reales, pero ponerlos por
> delante de un reloj que falla sería mentir sobre lo que importa.

- **La rama de los agentes está 2 commits por detrás de `main`.** `[origen: guardian 2026-10-13]`
  El dueño fusionó `f44d0a8` el 12-10 a las 17:35 (cambios en `gist`, `i18n` y
  `markdown.ts`). `claude/kairo-agentes` no los tiene, así que los agentes
  trabajan sobre una copia que ya no es la de producción. Lo arregla un
  `git merge origin/main` desde la rama de agentes —eso no toca `main`— y le
  toca al constructor, no al guardián. Si se deja correr, acabará en un
  conflicto el día que el dueño quiera fusionar.

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

- **`agentes/CONTEXTO.md` escrito.** `[hecho 2026-10-12]` Qué es Kairo, dónde
  vive, qué está construido verificado en el código (no en el README), el
  apartado **Fuentes de datos** que `ESTADO.md` esperaba —ninguna conectada,
  así que toda métrica de uso se escribe "sin datos"— y los tres supuestos de
  trabajo que solo el dueño puede confirmar. Entregado en `agentes/CONTEXTO.md`.

- `agentes/backlog.md` creado, que no existía. `[hecho 2026-10-12]`
- `agentes/lanzamiento/` con `registro-guardian.md` y `checklist.md`. `[hecho 2026-10-12]`
