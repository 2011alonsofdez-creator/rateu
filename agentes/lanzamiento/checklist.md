# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-18 | `revisar.yml` lanzado hoy (ejecución 39099818094, 05:13 UTC): HTTP 200 y "TODO CORRECTO · cerebros conectados: gemini, extra" |
| ✅ | No está en modo privado de Vercel | 2026-10-18 | El workflow distingue el 401 de Vercel y hoy ha salido 200. No hay portero delante |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-18 | **Medido, y el veredicto está**: 98 ejecuciones sin un fallo, pero **7 en las últimas 24 h frente a las 72 que pide el cron** (`7,27,47 * * * *` en `main`). Peor hueco cerrado **4 h 28**; el hueco abierto ahora mismo va por 4 h 20. El cambio del dueño ha mejorado algo (5 → 7 al día, peor hueco 5 h 22 → 4 h 28), pero pedir el triple ha dado 1,4 veces más: **el cron no es el arreglo** |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-18 | "TODO CORRECTO", y **sigue con un cerebro de tres**: Gemini sí, Claude NO, GPT NO. El respaldo de OpenRouter tiene clave válida y sus 3 modelos existen, de 471 |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-18 | Limpio en `kairo/src`. Los dos únicos aciertos de `service_role` son comentarios que explican que esa clave no sale del servidor |
| ✅ | Ningún secreto detrás de `NEXT_PUBLIC_` | 2026-10-18 | Los aciertos son **nombres** de variables en la página de diagnóstico y en `/api/estado`: URL del proyecto y claves anon/publishable, públicas por diseño |
| ✅ | Título y meta descripción propios | 2026-10-12 | `kairo/src/app/layout.tsx` |
| ✅ | Favicon | 2026-10-12 | `kairo/src/app/icon.svg` |
| ✅ | Imagen de Open Graph | 2026-10-14 | Hecha: `kairo/public/og.png` 1200x630 y `metadataBase` en `layout.tsx`, comprobadas con un `next build` completo. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | `robots.txt` | 2026-10-14 | Hecho, con `sitemap.ts` de propina. El build los sirve en `/robots.txt` y `/sitemap.xml`. **Comprobado hoy 18-10: sigue sin estar en `main`** |
| ✅ | Enlace visible a los textos legales | 2026-10-12 | `SiteFooter` en `kairo/src/components/SiteHeader.tsx:89-92`, presente en la portada |
| ✅ | Los enlaces de la portada llevan a algún sitio | 2026-10-12 | Botón principal → `/chat`, que existe en `(app)/chat`. Secundario → `#features`, que existe en `page.tsx:176` |

## Funciona el sistema de agentes

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Los agentes se ejecutan | 2026-10-18 | Ayer entregaron los cuatro: guardián, entrenador (tono), constructor (no ceder ante quien insiste) y crecimiento (mercado). Ningún turno perdido en siete días |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
