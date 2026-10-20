# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-20 | `revisar.yml` lanzado hoy (ejecución 39373928375, 05:15 UTC): HTTP 200 y "TODO CORRECTO · cerebros conectados: gemini, extra" |
| ✅ | No está en modo privado de Vercel | 2026-10-20 | 200 limpio: si hubiera portero de Vercel delante, el workflow devolvería 401 y lo distingue |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-20 | **Tercera medición, y la serie se desmiente a sí misma**: **4 toques en 24 h** frente a los 72 del cron, con el peor hueco en **6 h 29** —el peor desde el 15-10—. Ayer eran 8 y 4 h 50. La serie completa va 3 → 4 → 6 → 5 → 7 → 8 → **4**: no está estable en una décima parte, **oscila al doble de un día para otro**. Y eso, para lo que hay que decidir, pesa más que la media: con un proceso que varía así **no se puede prometer una hora**. Las 110 ejecuciones siguen en verde: no falla, no suena |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-20 | "TODO CORRECTO", y **cuarto día con un cerebro de tres**: Gemini sí, Claude NO, GPT NO. Respaldo con clave válida y sus 3 modelos existen, hoy de 470 |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-20 | Limpio en `kairo/src`, `supabase/` y `docs/` |
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
| ✅ | Los agentes se ejecutan | 2026-10-20 | Ayer entregaron los cuatro: guardián, entrenador (listas), constructor (`/multas`) y radar (tercera revisión). Diez días sin perder un turno |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
