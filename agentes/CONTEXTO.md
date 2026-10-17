# Contexto de Kairo

> **Lo primero que lee todo agente.** Lo que hay aquí se da por bueno; lo que
> no esté aquí se comprueba en el código antes de afirmarlo.
>
> Creado por `kairo-constructor` el 2026-10-12 (P1 del backlog). Las fuentes
> son `docs/kairo/ESPECIFICACION.md` y el código de `kairo/`; donde las dos
> cosas no coinciden, manda el código y se dice cuál es la diferencia.

## Qué es Kairo

Un asistente de IA conversacional que por dentro usa **Claude, Gemini y GPT a
la vez** y elige solo el mejor modelo para cada tarea. El usuario no elige
motor: habla con una sola IA.

- **Lema**: "La IA que trabaja cuando tú no."
- **Diferencial**: los **Co-Works**, encargos de IA que se ejecutan a una hora
  fija sin que el usuario esté delante.
- **Para quién**: público general, con tres modos de edad (niño, adolescente,
  adulto).
- **Idiomas**: interfaz en español e inglés; la IA responde en cualquiera.
- **Plataforma**: web responsive. Next.js 16, React 19, Tailwind 4, Supabase.

## Dónde vive

| | |
|---|---|
| Producción | https://kairo-six-lemon.vercel.app |
| Repositorio | `2011alonsofdez-creator/rateu` |
| La aplicación | `kairo/` |
| Documentación del producto | `docs/kairo/` |
| Rama de los agentes | `claude/kairo-agentes` (nunca `main`) |
| Diagnóstico propio | `/api/estado` y la página `/revision` |
| El reloj horario | `.github/workflows/kairo-coworks.yml` |
| El reloj diario | `kairo/vercel.json`, una vez al día a las 06:00 |

**Ojo**: el contenedor donde viven los agentes **no tiene permiso de red** para
abrir esa URL (`ENOTFOUND` / 403 del proxy). Lo que hace falta mirar en la web
de verdad se queda sin comprobar y se marca ⚪, nunca 🔴. Está como P1 en el
backlog.

## Qué está construido (verificado en el código el 2026-10-12)

Rutas de aplicación en `kairo/src/app/(app)/`: `chat`, `coworks`, `mentes`,
`memoria`, `paperwork`, `gist`, `conectores`, `team`, `ajustes`.
Rutas de API en `kairo/src/app/api/`: `chat`, `conversaciones`, `coworks`,
`mentes`, `memoria`, `paperwork`, `gist`, `pagos`, `suscripcion`, `telegram`,
`estado`, `revision`.

- **El router multi-modelo está hecho**: cuatro niveles (Rápido, Normal, Forja,
  MEGA) en `lib/ia/`, con los tres proveedores en `lib/ia/proveedores.ts` y la
  cadena de respaldo en `lib/ia/config.ts`.
- **El prompt maestro** está en `lib/ia/prompt.ts`, 399 líneas, armado por
  piezas. Hay un mapa de sus 16 secciones en
  `agentes/ia/diario-entrenamiento.md`.
- **Buscador conectado** (`lib/ia/buscar.ts`): Google, Maps y lectura de
  páginas, con reglas duras de "lo que no esté en los resultados no existe".
- **Modos de edad**: implementados y coherentes en tres archivos. `null` se
  trata como `nino`, a propósito: ante la duda, el modo más protegido.
- **Pagos montados pero apagados**: existen `api/pagos/` y `api/suscripcion/`,
  y los botones de la tienda están detrás del interruptor
  `NEXT_PUBLIC_TIENDA=1` (`api/estado/route.ts:281`). En el repositorio no
  consta que esté encendido, y desde aquí no se puede comprobar.
- **Base de datos**: 15 migraciones en `kairo/supabase/migrations/`, hasta
  `0015_permisos_del_servidor.sql`.
- **Planes en código** (`lib/planes.ts`): `free` 15 créditos, `plus` ("Kairo+")
  1000 y `supreme` 3000. `free` solo alcanza el nivel rápido.

Según la especificación los precios son Kairo+ 9,99 €/mes y Supreme
24,99 €/mes, con anual de 99 € y 249 €. Eso está en el documento, no en el
código que he mirado: antes de usarlo en un texto de cara al público, que lo
confirme el dueño.

**Una divergencia entre el documento y el código, y toca dinero.** La
especificación da a Kairo+ "Rápido + Estándar" y reserva el nivel Máximo y el
Mega-Prompt para Supreme (sección 3). El código no: en `lib/planes.ts:41-45`,
`plus` y `supreme` tienen exactamente los mismos cuatro niveles, `mega`
incluido. Si eso llega así al día en que se enciendan los pagos, quien pague
9,99 € tendrá lo mismo que quien pague 24,99 € en lo que más cuesta por
mensaje, y el plan de arriba pierde su razón de ser. Ni se ha tocado ni se va
a tocar sin permiso —los créditos y los planes son del dueño—, pero queda
anotado como P1 del backlog.

## Fuentes de datos

**No hay ninguna conectada.** Comprobado el 2026-10-12: ni analítica ni
telemetría en `kairo/src` ni en `package.json` (sin Plausible, PostHog, Google
Analytics, Umami ni `@vercel/analytics`).

Consecuencia directa, y no es negociable: **mientras esto siga así, toda
métrica de uso se escribe "sin datos"**. Ningún agente estima visitas,
usuarios, conversiones ni ingresos. Un número inventado con cara de real es el
peor daño que puede hacer este sistema.

Para que dejen de estar en blanco hace falta, por orden de lo que menos cuesta:

| Métrica | De dónde saldría | Qué falta |
|---|---|---|
| Visitas y registros | Analítica web (Plausible o `@vercel/analytics`) | Instalarla; decisión del dueño |
| Usuarios y conversaciones | Supabase, contando filas | Una consulta de solo lectura, y que los agentes alcancen la red |
| Ingresos y suscripciones | La tienda de pagos | Que esté dada de alta y encendida |
| Salud de la web | `/api/estado` y `/revision`, ya hechos | Permiso de red para el contenedor |

## Lo que solo sabe el dueño

Tres cosas no se pueden deducir del repositorio, y mientras no estén
contestadas los agentes trabajan con el supuesto que se indica. Se contestan
en `agentes/notas.md`, en una línea.

1. **¿Está Kairo lanzada y usándola alguien?** Supuesto de trabajo: montada y
   en pie, sin usuarios reales todavía.
2. **¿Está la tienda de pagos dada de alta y encendida?** Supuesto: montada en
   el código pero apagada, así que nadie puede pagar aún.
3. **¿Cuál es el objetivo de este trimestre?** Supuesto: terminar el checklist
   de lanzamiento de `agentes/lanzamiento/checklist.md` y conseguir los diez
   primeros usuarios de los que habla la especificación.

En cuanto haya respuesta, se corrige aquí con la fecha y se deja constancia del
supuesto que sustituye.

## Con quién compite (primera foto, 2026-10-14)

Del primer informe de `kairo-crecimiento`. Cifras de resultados de búsqueda,
sin abrir ninguna web: confirmar antes de usarlas en público.

- **ChatGPT Go**, 8 €/mes en España, "puede incluir anuncios". Plus 23 €.
  Tiene tareas programadas, pero su guía dice que se ejecutan como mucho una
  vez por hora, no admiten archivos y **informan en vez de ejecutar**.
- **Google AI Pro**, 21,99 €/mes, con Scheduled Actions para Pro y Ultra.
  Ojo: Google es a la vez proveedor de Kairo y competidor.
- **Álex (Legálitas)**, gratis, en español, >600.000 usuarios declarados.
  Ocupa el sitio mental de "IA legal gratis".

~~**Nadie vende créditos recargables sin suscripción en español.** Ese hueco
existe de verdad y es el mejor sitio de Kairo.~~
**Corregido el 2026-10-17: medio falso.** Créditos recargables genéricos sigue
sin venderlos nadie, pero el hueco que importaba —usar esto sin suscribirse a
nada— ya está ocupado en el nicho exacto de Kairo. Ver abajo.

Kairo+ a 9,99 € queda por encima de ChatGPT Go (8 €) sin tener su marca.

## Con quién compite de verdad (2026-10-17)

La foto del 14-10 miraba a quien hace ruido. Buscando por el problema del
usuario —"cómo recurrir una multa"— salen otros tres, que hacen lo mismo que
Kairo y son españoles. Cifras de resultados de búsqueda, sin abrir ninguna web.

- **GovEasy** (`es.goveasy.eu`) — **el más cercano, y no estaba en el mapa.**
  Trámites con la Administración: una página por trámite, extensión de
  navegador que detecta el trámite en AEAT, Seguridad Social y DGT, IA propia
  ("Tramití") y gestores humanos. Hace **las tres cosas que Kairo considera
  suyas**: lee y además **rellena** papeles oficiales (modelo EX-10 con IA,
  4,99 €), **vigila plazos sola y avisa** (Radar de Citas, recordatorios de
  DNI/ITV/renta, vigilancia de convocatorias) y cobra **sin suscripción
  obligatoria**: trámites sueltos **desde 2,99 €**, Plus 4,99 €/mes,
  vigilancia 9,99 € de **pago único** por ciudad. Sale **primero** en la
  búsqueda con intención de usuario; Kairo no sale.
- **Lexlyia** (`lexlyia.com`) — asesor legal con IA en español. Particular
  **9,90 €/mes** (a un céntimo de Kairo+), autónomos 29 €, pyme 79 €.
- **Lexly** (App Store ES, Lend Power SL) — analiza documentos legales **con
  una foto**, fiscal y laboral en España, **gratis**. Hace gratis el gancho de
  Paperwork.

**Dónde gana Kairo**: amplitud. Es un asistente completo —Gist, Mentes,
memoria, cuatro niveles— y no cobra por trámite. **Dónde pierde**: en la
puerta. Kairo tiene **tres páginas públicas** (`/`, `/precios`, `/legal`) y
ninguna responde a quien busca su problema.

## Los tres números que importan al lanzar

De la especificación, sección 8. Se miran cuando haya datos, no antes:

1. **Coste de API por usuario activo** — si pasa de 1 €/mes en usuarios free,
   hay fuga.
2. **Conversión de free a pago** — por debajo del 2% hay que revisar el plan
   gratuito.
3. **Cuántos vuelven al día siguiente** — si nadie vuelve, ningún precio lo
   arregla.
