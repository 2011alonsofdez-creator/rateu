# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-26 | `revisar.yml` lanzado hoy (ejecución 40278871292, 06:16 UTC): HTTP 200 y "TODO CORRECTO". El intento directo desde la sede, `ENOTFOUND`: ⚪ |
| ✅ | No está en modo privado de Vercel | 2026-10-26 | 200 limpio; el workflow distingue el 401 de Vercel y no ha salido |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-26 | **7 toques programados** en 24 h de los 72, todos en verde, peor hueco cerrado **5 h 34**. Trece días medidos: 3 → 4 → 6 → 5 → 7 → 8 → 4 → 6 → 5 → 6 → 6 → 7 → **7**, siempre **entre 4 y 8, nunca 72**. Sigue en 🟡 por lo mismo de siempre, y con el argumento del 25-10 en pie: **ya hay usuarios**, así que lo de "suena en una casa vacía" vale para los Co-Works y los papeles, no para Kairo |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-26 | "TODO CORRECTO", y **el dueño ha puesto las claves que faltaban de Gemini: el log dice "Gemini: 3 clave(s)"** y el aviso de la cuota agotada ha desaparecido. Sigue en 🟡 porque Claude y GPT siguen sin clave (**undécimo día**) y porque **el respaldo ya no es gratis**: cuatro modelos y dos de pago, el primero a **$0,44/M** (P1 de hoy). Los precios **siguen sin salir en el log**: las tres líneas de `jq` del 22-10 llevan cuatro días sin pegarse, y por eso este cambio lo he tenido que medir a mano |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |
| ✅ | **El buscador está encendido** | 2026-10-26 | "Búsqueda: encendida, con 10 modelos que pueden buscar", y **vuelve a verde**: ayer lo bajé a 🟡 porque con una sola clave la cuota se agotaba a media tarde y esta comprobación se hace de madrugada, en el mejor momento del día. Hoy hay **tres claves**, así que la cuota es el triple y el aviso de su propio código ha desaparecido. Lo que sigue sin medirse es la tarde: para eso haría falta comprobarlo dos veces al día |
| 🟡 | Los modelos de respaldo **ya no son todos gratis** | 2026-10-26 | **Cambió, y hoy son cuatro**: `deepseek/deepseek-v4-flash-0731` a **$0,44/M entrada y $1,32/M salida**, `anthropic/claude-haiku-5.5` a $0,10/$0,50, y dos `:free` a $0. Medido con su propio `buscar-modelo.yml`. Puede ser a propósito; el problema es que **no lo canta el log** y que no hay topes de gasto. Y el elegido de deepseek es el más caro de sus cuatro variantes: `-latest` cuesta $0,05/$0,16. Ver el P1 del 26-10 |
| ⬜ | ~~Los tres modelos de respaldo siguen siendo gratis~~ | 2026-10-21 | **Medido hoy**, no supuesto, con el workflow `buscar-modelo.yml` que el dueño añadió ayer: `nvidia/nemotron-3-ultra-550b-a55b:free`, `thinkingmachines/inkling:free` y `poolside/laguna-s-2.1:free` salen los tres a **$0/M de entrada y $0/M de salida**. Ojo al detalle que esto destapa: existen sus gemelos de pago con el id casi idéntico —`thinkingmachines/inkling` a $1/$4,05 y `poolside/laguna-s-2.1` a $0,09/$0,18—, así que **perder el `:free` del nombre no rompe nada: empieza a cobrar** |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-26 | Limpio en `kairo/src`: ni `sk-`, ni `AIza`, ni un `service_role` con valor. **Mirado también el código nuevo del dueño** (Kairo Code, 1.100 líneas): nada |
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
| ✅ | Los agentes se ejecutan | 2026-10-26 | Ayer entregaron los cuatro que les tocaba: guardián, entrenador (la regla del buscador), constructor (el aviso traducido) y radar (quinta revisión). **Dieciséis días sin perder un turno** |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
