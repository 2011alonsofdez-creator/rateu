# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-23 | `revisar.yml` lanzado hoy (ejecución 39904621589, 05:14 UTC): HTTP 200 y "TODO CORRECTO". El intento directo desde la sede, 403 del proxy: ⚪ |
| ✅ | No está en modo privado de Vercel | 2026-10-23 | 200 limpio; el workflow distingue el 401 de Vercel y no ha salido |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-23 | **6 toques programados** en 24 h de los 72 del cron, peor hueco **5 h 44**: vuelve a la banda de siempre después del 10 h 39 de ayer. La serie va 3 → 4 → 6 → 5 → 7 → 8 → 4 → 6 → 5 → **6**, o sea **entre 4 y 8, nunca 72**. Y lo que de verdad cambió ayer sigue en pie: suena en vacío (0 Co-Works, 0 papeles), así que ningún hueco ha costado un encargo todavía |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-23 | "TODO CORRECTO", y **octavo día con un cerebro de tres**: Gemini sí, Claude NO, GPT NO. Telegram validado contra Telegram y buscador encendido con 10 modelos, igual que ayer |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |
| ✅ | **El buscador está encendido** | 2026-10-22 | Del log de hoy: "Búsqueda: encendida, con 10 modelos que pueden buscar". Importa para el prompt: el bloque que se aplica en producción es `CON INTERNET`, no `SIN INTERNET` |
| ✅ | Los tres modelos de respaldo **siguen siendo gratis** | 2026-10-21 | **Medido hoy**, no supuesto, con el workflow `buscar-modelo.yml` que el dueño añadió ayer: `nvidia/nemotron-3-ultra-550b-a55b:free`, `thinkingmachines/inkling:free` y `poolside/laguna-s-2.1:free` salen los tres a **$0/M de entrada y $0/M de salida**. Ojo al detalle que esto destapa: existen sus gemelos de pago con el id casi idéntico —`thinkingmachines/inkling` a $1/$4,05 y `poolside/laguna-s-2.1` a $0,09/$0,18—, así que **perder el `:free` del nombre no rompe nada: empieza a cobrar** |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-23 | Limpio en `kairo/src`, `supabase/` y `docs/` |
| ✅ | Ningún secreto detrás de `NEXT_PUBLIC_` | 2026-10-18 | Los aciertos son **nombres** de variables en la página de diagnóstico y en `/api/estado`: URL del proyecto y claves anon/publishable, públicas por diseño |
| ✅ | Título y meta descripción propios | 2026-10-12 | `kairo/src/app/layout.tsx` |
| ✅ | Favicon | 2026-10-12 | `kairo/src/app/icon.svg` |
| ✅ | Imagen de Open Graph | 2026-10-14 | Hecha: `kairo/public/og.png` 1200x630 y `metadataBase` en `layout.tsx`, comprobadas con un `next build` completo. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | `robots.txt` | 2026-10-14 | Hecho, con `sitemap.ts` de propina. El build los sirve en `/robots.txt` y `/sitemap.xml`. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | Enlace visible a los textos legales | 2026-10-12 | `SiteFooter` en `kairo/src/components/SiteHeader.tsx:89-92`, presente en la portada |
| ✅ | Los enlaces de la portada llevan a algún sitio | 2026-10-19 | Comprobado otra vez tras el merge: botón principal → `/chat` (`page.tsx:73`), secundario → `#features` (`page.tsx:80`). Los dos destinos existen |

## Funciona el sistema de agentes

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Los agentes se ejecutan | 2026-10-23 | Ayer entregaron los cuatro: guardián, entrenador (casos límite), constructor (precios del respaldo) y radar (cuarta revisión). **Trece días sin perder un turno** |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
