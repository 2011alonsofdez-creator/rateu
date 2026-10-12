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

- **Falta `agentes/CONTEXTO.md`.** `[origen: guardian 2026-10-12]`
  Es lo primero que el protocolo manda leer a los cinco agentes, y
  `ESTADO.md` dice que las métricas siguen en blanco hasta que se rellene su
  apartado **Fuentes de datos**. No lo escribe el guardián porque su contenido
  son decisiones del dueño, no datos que se puedan deducir del repositorio.
  Hace falta que diga: qué es Kairo en dos líneas, su URL de producción
  (`https://kairo-six-lemon.vercel.app`), en qué estado está (¿lanzada?,
  ¿usuarios?, ¿cobrando?), los objetivos de este trimestre y de qué fuentes
  salen las métricas (analítica, Supabase, Stripe) o que no hay ninguna.

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

- **El reloj horario de los Co-Works no suena cada hora: suena cada 4-5.** `[origen: guardian 2026-10-12]`
  `kairo-coworks.yml` pide `cron: "5 * * * *"`, pero las 10 últimas ejecuciones
  reales cubren 47 horas, con huecos de **3 h 28 min a 7 h 23 min**. GitHub
  retrasa y se salta las ejecuciones programadas cuando su planificador va
  cargado, y no avisa de ello: todas salen en verde.
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

- **Los cuatro enlaces del pie van todos a `/legal`.** `[origen: guardian 2026-10-12]`
  `SiteHeader.tsx:89-92` enseña "legal", "privacidad", "cookies" y "términos",
  y los cuatro abren la misma página. Es mejor que no tener nada, y por eso no
  es P1, pero quien busque la política de cookies no la va a encontrar.

## P3

- (vacío)

## Hecho

- `agentes/backlog.md` creado, que no existía. `[hecho 2026-10-12]`
- `agentes/lanzamiento/` con `registro-guardian.md` y `checklist.md`. `[hecho 2026-10-12]`
