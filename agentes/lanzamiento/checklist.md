# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-25 | `revisar.yml` lanzado hoy (ejecución 40168377568, 06:14 UTC): HTTP 200 y "TODO CORRECTO". El intento directo desde la sede, `ENOTFOUND`: ⚪ |
| ✅ | No está en modo privado de Vercel | 2026-10-25 | 200 limpio; el workflow distingue el 401 de Vercel y no ha salido |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-25 | **7 toques programados** en 24 h de los 72 del cron, todos en verde, peor hueco cerrado **4 h 23** (y uno abierto de 4 h 28 a esta hora): **su mejor día** de los doce medidos. La serie va 3 → 4 → 6 → 5 → 7 → 8 → 4 → 6 → 5 → 6 → 6 → **7**: doce días **entre 4 y 8, nunca 72**. Lo que sí cambia hoy es el argumento: **ya hay usuarios** —cuatro avisos, según el commit `688ecb2` del dueño—, así que lo de "suena en una casa vacía" vale para los Co-Works y los papeles (0 y 0) pero ya no para Kairo |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-25 | "TODO CORRECTO", y **décimo día con un cerebro de tres**: Gemini sí, Claude NO, GPT NO. Telegram validado y los 3 modelos de respaldo existen (el proveedor ofrece 467). **Nuevo hoy, y lo dice su propio código**: "Gemini: **1 clave(s)** · con una sola, la cuota gratuita se agota a media tarde y deja de buscar". Los precios del respaldo siguen sin salir: faltan las tres líneas de `jq` del 22-10, y ayer tocó ese workflow sin añadirlas |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |
| 🟡 | **El buscador está encendido** | 2026-10-25 | Del log de hoy: "Búsqueda: encendida, con 10 modelos que pueden buscar". **Pero baja a 🟡, y el motivo es mío**: esta comprobación se hace a las 06:14 UTC, con la cuota del día recién puesta, o sea **en el mejor momento posible**. Con una sola clave de Gemini la cuota se agota a media tarde y Kairo contesta de memoria con el bloque `BUSCAS ANTES DE CONTESTAR` puesto (P1 de hoy). Así que lo honesto es: encendido **por la mañana**; por la tarde, sin medir |
| ✅ | Los tres modelos de respaldo **siguen siendo gratis** | 2026-10-21 | **Medido hoy**, no supuesto, con el workflow `buscar-modelo.yml` que el dueño añadió ayer: `nvidia/nemotron-3-ultra-550b-a55b:free`, `thinkingmachines/inkling:free` y `poolside/laguna-s-2.1:free` salen los tres a **$0/M de entrada y $0/M de salida**. Ojo al detalle que esto destapa: existen sus gemelos de pago con el id casi idéntico —`thinkingmachines/inkling` a $1/$4,05 y `poolside/laguna-s-2.1` a $0,09/$0,18—, así que **perder el `:free` del nombre no rompe nada: empieza a cobrar** |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-25 | Limpio en `kairo/src`: ni `sk-`, ni `AIza`, ni un `service_role` con valor |
| ✅ | Ningún secreto detrás de `NEXT_PUBLIC_` | 2026-10-18 | Los aciertos son **nombres** de variables en la página de diagnóstico y en `/api/estado`: URL del proyecto y claves anon/publishable, públicas por diseño |
| ✅ | Título y meta descripción propios | 2026-10-12 | `kairo/src/app/layout.tsx` |
| ✅ | Favicon | 2026-10-12 | `kairo/src/app/icon.svg` |
| ✅ | Imagen de Open Graph | 2026-10-14 | Hecha: `kairo/public/og.png` 1200x630 y `metadataBase` en `layout.tsx`, comprobadas con un `next build` completo. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | `robots.txt` | 2026-10-14 | Hecho, con `sitemap.ts` de propina. El build los sirve en `/robots.txt` y `/sitemap.xml`. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | Enlace visible a los textos legales | 2026-10-12 | `SiteFooter` en `kairo/src/components/SiteHeader.tsx:89-92`, presente en la portada |
| ✅ | Los enlaces de la portada llevan a algún sitio | 2026-10-24 | Botón principal → `/chat`, que existe en `kairo/src/app/(app)/chat`; pie → `/legal` cuatro veces (`SiteHeader.tsx:89-92`). **Lo que no hay es camino de ida a las tres páginas de intención**: `/multas`, `/cartas-de-hacienda` y `/contratos` están en el `sitemap.xml` y **no se enlazan desde ninguna parte de la web**. No lo cuento como roto porque es una decisión pendiente del dueño (backlog, P2), pero un visitante no puede llegar a ellas |

## Funciona el sistema de agentes

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Los agentes se ejecutan | 2026-10-25 | Ayer entregaron los tres que les tocaba: guardián, entrenador (el cable del conocimiento) y constructor (la verdad del reloj en los Co-Works). Al radar le toca hoy. **Quince días sin perder un turno** |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
