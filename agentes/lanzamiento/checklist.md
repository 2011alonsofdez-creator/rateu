# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-27 | `revisar.yml` lanzado hoy (ejecución 40459907603, 06:14 UTC): HTTP 200 y "TODO CORRECTO". El intento directo desde la sede, `ENOTFOUND`: ⚪ |
| ✅ | No está en modo privado de Vercel | 2026-10-27 | 200 limpio; el workflow distingue el 401 de Vercel y no ha salido |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-27 | **5 toques programados** en 24 h de los 72, todos en verde, peor hueco cerrado **6 h 17**: baja desde los 7 de ayer. Catorce días medidos: 3 → 4 → 6 → 5 → 7 → 8 → 4 → 6 → 5 → 6 → 6 → 7 → 7 → **5**, siempre **entre 4 y 8, nunca 72**. Catorce días de medición dicen lo mismo con la misma varianza: es un reloj de unas 5 horas, y no se puede prometer una hora con él |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-27 | "TODO CORRECTO", Gemini con **3 claves**, Telegram validado y los 4 modelos de respaldo existen (el proveedor ofrece 464). **Nuevo hoy en el log**: la escalera de repuestos de búsqueda que montó anoche —*"Repuesto 1 (web de pago, la que sabe lo de ayer): SÍ, con `deepseek/deepseek-v4-flash-0731`"*, Repuesto 2 Claude (falta clave, opcional) y *"Repuesto 3 (Wikipedia): siempre"*—. Sigue en 🟡 porque Claude y GPT no tienen clave (**duodécimo día**) y porque **ese repuesto 1 es de pago y entra cada tarde** (P1). Los precios siguen sin salir en el log: las tres líneas de `jq` llevan **seis días** |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |
| ✅ | **El buscador está encendido** | 2026-10-27 | "Búsqueda: encendida, con 10 modelos que pueden buscar", tres claves de Gemini, y desde anoche **tres repuestos por debajo** cuando esa cuota se agote: la web de pago, Claude (sin clave) y Wikipedia, que no se agota. Como función, esto ya no se cae; lo que tiene es **precio**, y eso va en el P1, no aquí. Sigue sin medirse la tarde: haría falta comprobarlo dos veces al día |
| 🟡 | Los modelos de respaldo **ya no son todos gratis** | 2026-10-26 | **Cambió, y hoy son cuatro**: `deepseek/deepseek-v4-flash-0731` a **$0,44/M entrada y $1,32/M salida**, `anthropic/claude-haiku-5.5` a $0,10/$0,50, y dos `:free` a $0. Medido con su propio `buscar-modelo.yml`. Puede ser a propósito; el problema es que **no lo canta el log** y que no hay topes de gasto. Y el elegido de deepseek es el más caro de sus cuatro variantes: `-latest` cuesta $0,05/$0,16. Ver el P1 del 26-10 |
| ⬜ | ~~Los tres modelos de respaldo siguen siendo gratis~~ | 2026-10-21 | **Medido hoy**, no supuesto, con el workflow `buscar-modelo.yml` que el dueño añadió ayer: `nvidia/nemotron-3-ultra-550b-a55b:free`, `thinkingmachines/inkling:free` y `poolside/laguna-s-2.1:free` salen los tres a **$0/M de entrada y $0/M de salida**. Ojo al detalle que esto destapa: existen sus gemelos de pago con el id casi idéntico —`thinkingmachines/inkling` a $1/$4,05 y `poolside/laguna-s-2.1` a $0,09/$0,18—, así que **perder el `:free` del nombre no rompe nada: empieza a cobrar** |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-27 | Limpio en `kairo/src`, y mirado también el diff de los **seis commits** que el dueño publicó anoche (`buscar-web.ts`, `wikipedia.ts`, `buscar.ts`, 659 líneas): **cero** coincidencias de `sk-` o `AIza` |
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
| ✅ | Los agentes se ejecutan | 2026-10-27 | Ayer entregaron los cuatro que les tocaba: guardián, entrenador (Kairo Code en el prompt), constructor (el panel del respaldo) y crecimiento (mercado del 26-10). **Diecisiete días sin perder un turno** |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
