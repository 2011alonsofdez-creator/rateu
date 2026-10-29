# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-29 | `revisar.yml` lanzado hoy (ejecución 40828189635, 06:16 UTC): HTTP 200 y "TODO CORRECTO", sobre el `main` de anoche (`df1cf15`). El intento directo desde la sede sigue dando `ENOTFOUND`: ⚪, y eso no dice nada de Kairo |
| ✅ | No está en modo privado de Vercel | 2026-10-29 | 200 limpio; el workflow distingue el 401 de Vercel y no ha salido |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-29 | **Hoy no lo he medido, y es lo que dije ayer que iba a hacer.** Lo que sí he comprobado es que *suena*: las tres últimas ejecuciones `schedule` de `kairo-coworks.yml` son la 163 (28-10, 19:53 UTC), la 164 (28-10, 23:58) y la 165 (hoy, 05:35), las tres en verde. Sigue en 🟡 por lo medido quince días, no por lo de hoy. Lo de ayer, que es el diagnóstico que vale: **4 toques programados** en 24 h de los 72, todos en verde, peor hueco cerrado **6 h 18**: el suelo de la banda. Quince días medidos: 3 → 4 → 6 → 5 → 7 → 8 → 4 → 6 → 5 → 6 → 6 → 7 → 7 → 5 → **4**, siempre **entre 4 y 8, nunca 72**. Quince días no han cambiado el diagnóstico ni la varianza, así que **dejo de medirlo a diario**: lo miraré cuando el dueño toque el cron o cuando haya un Co-Work de verdad que perder |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-29 | "TODO CORRECTO", Gemini con **3 claves**, Telegram validado y los 4 modelos de respaldo existen todos. **Nada nuevo hoy, y los dos 🟡 de siempre cumplen un día más**: Claude y GPT sin clave (**decimocuarto día**) y el repuesto de pago que entra cada tarde sin tope de gasto. Las tres líneas de `jq` del 22-10, **octavo día**. Un detalle del log, que no es un problema pero conviene no leerlo mal: el proveedor ofrece hoy **421 modelos** y el 26-10 ofrecía 464. Es su catálogo, que se mueve; los cuatro nuestros siguen ahí. Lo de ayer: | "TODO CORRECTO", Gemini con **3 claves**, Telegram validado, los 4 modelos de respaldo existen (464 en el proveedor) y la escalera de repuestos igual que ayer: web de pago con `deepseek-v4-flash-0731`, Claude sin clave y Wikipedia siempre. **Hoy no hay nada nuevo**: sigue en 🟡 por los dos de siempre —Claude y GPT sin clave (**decimotercer día**) y el repuesto de pago que entra cada tarde sin tope de gasto—. Los precios siguen sin salir en el log: las tres líneas de `jq`, **séptimo día** |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |
| ✅ | **El buscador está encendido** | 2026-10-29 | Hoy otra vez "Búsqueda: encendida, con 10 modelos que pueden buscar", con los tres repuestos por debajo igual que ayer. Lo escrito el 27-10, que no ha cambiado: | "Búsqueda: encendida, con 10 modelos que pueden buscar", tres claves de Gemini, y desde anoche **tres repuestos por debajo** cuando esa cuota se agote: la web de pago, Claude (sin clave) y Wikipedia, que no se agota. Como función, esto ya no se cae; lo que tiene es **precio**, y eso va en el P1, no aquí. Sigue sin medirse la tarde: haría falta comprobarlo dos veces al día |
| 🟡 | Los modelos de respaldo **ya no son todos gratis** | 2026-10-26 | **Cambió, y hoy son cuatro**: `deepseek/deepseek-v4-flash-0731` a **$0,44/M entrada y $1,32/M salida**, `anthropic/claude-haiku-5.5` a $0,10/$0,50, y dos `:free` a $0. Medido con su propio `buscar-modelo.yml`. Puede ser a propósito; el problema es que **no lo canta el log** y que no hay topes de gasto. Y el elegido de deepseek es el más caro de sus cuatro variantes: `-latest` cuesta $0,05/$0,16. Ver el P1 del 26-10 |
| ⬜ | ~~Los tres modelos de respaldo siguen siendo gratis~~ | 2026-10-21 | **Medido hoy**, no supuesto, con el workflow `buscar-modelo.yml` que el dueño añadió ayer: `nvidia/nemotron-3-ultra-550b-a55b:free`, `thinkingmachines/inkling:free` y `poolside/laguna-s-2.1:free` salen los tres a **$0/M de entrada y $0/M de salida**. Ojo al detalle que esto destapa: existen sus gemelos de pago con el id casi idéntico —`thinkingmachines/inkling` a $1/$4,05 y `poolside/laguna-s-2.1` a $0,09/$0,18—, así que **perder el `:free` del nombre no rompe nada: empieza a cobrar** |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-29 | Limpio en todo el repo (`sk-`, `AIza`, `sk-or-v1-`): **cero** coincidencias, y lo único con nombre de `.env` que está en git es `kairo/.env.example`. Mirado también el diff de los **nueve commits** de anoche (Team de verdad, el encargo que busca, los iconos de nivel, `brief.ts`, `recetas.ts`, y las migraciones `0017_team.sql` y `0018_encargo_busca.sql`: 882 líneas añadidas): **cero** |
| ✅ | Ningún secreto detrás de `NEXT_PUBLIC_` | 2026-10-18 | Los aciertos son **nombres** de variables en la página de diagnóstico y en `/api/estado`: URL del proyecto y claves anon/publishable, públicas por diseño |
| ✅ | Título y meta descripción propios | 2026-10-12 | `kairo/src/app/layout.tsx` |
| 🟡 | **Cada página pública con su propio título** | 2026-10-29 | **Las cinco de intención sí, `/precios` y `/legal` no.** Comprobado una por una: las cinco exportan `metadata` con su `canonical`; `/precios` y `/legal` no exportan ninguna, porque las dos empiezan por `"use client"` y Next no deja exportar `metadata` de un componente de cliente. Resultado: en Google salen con el título y la descripción de `layout.tsx` —*"Kairo — La IA que trabaja cuando tú no"*—, los mismos que la portada, y `/precios` está en el `sitemap.xml` con prioridad 0,8. El arreglo ya está inventado en la casa: es el patrón de las cinco de intención, `page.tsx` con los metadatos y `contenido.tsx` con el `"use client"`. Lo dejo en 🟡, no en roto: la página se ve perfectamente, lo que no se ve es en el buscador |
| ✅ | Favicon | 2026-10-12 | `kairo/src/app/icon.svg` |
| ✅ | Imagen de Open Graph | 2026-10-14 | Hecha: `kairo/public/og.png` 1200x630 y `metadataBase` en `layout.tsx`, comprobadas con un `next build` completo. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | `robots.txt` | 2026-10-14 | Hecho, con `sitemap.ts` de propina. El build los sirve en `/robots.txt` y `/sitemap.xml`. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | Enlace visible a los textos legales | 2026-10-12 | `SiteFooter` en `kairo/src/components/SiteHeader.tsx:89-92`, presente en la portada |
| ✅ | Los enlaces de la portada llevan a algún sitio | 2026-10-24 | Botón principal → `/chat`, que existe en `kairo/src/app/(app)/chat`; pie → `/legal` cuatro veces (`SiteHeader.tsx:89-92`). **Lo que no hay es camino de ida a las páginas de intención, y hoy ya son cinco**: `/multas`, `/cartas-de-hacienda`, `/contratos`, `/crear-una-app` y `/sin-suscripcion` están las cinco en el `sitemap.xml` y **ninguna se enlaza desde ninguna parte de la web** (comprobado hoy en `SiteHeader.tsx`: los enlaces que hay son `/#features`, `/precios`, `/chat` y `/legal` cuatro veces). No lo cuento como roto porque es una decisión pendiente del dueño (backlog, P2), pero un visitante no puede llegar a ellas |

## Funciona el sistema de agentes

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Los agentes se ejecutan | 2026-10-29 | Ayer entregaron los **cuatro**: guardián, entrenador (la regla anti-inyección del buscador), constructor (`/sin-suscripcion`) y radar (las dos mitades que se contradicen). **Diecinueve días sin perder un turno** |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
