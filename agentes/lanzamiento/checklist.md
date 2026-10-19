# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-19 | `revisar.yml` lanzado hoy (ejecución 39203453428, 05:13 UTC): HTTP 200 y "TODO CORRECTO · cerebros conectados: gemini, extra" |
| ✅ | No está en modo privado de Vercel | 2026-10-19 | El workflow distingue el 401 de Vercel y hoy ha salido 200. No hay portero delante |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-19 | **Segunda medición, y confirma la de ayer**: 106 ejecuciones sin un fallo y **8 en las últimas 24 h** frente a las 72 que pide el cron (un 11%). Más toques que ayer (7 → 8) pero **peor hueco: 4 h 50**, frente a 4 h 28. Dicho de otra forma, dos días seguidos clavados en una décima parte de lo pedido: el cron no es el arreglo, y ya no hace falta medirlo más para saberlo |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-19 | "TODO CORRECTO", y **tercer día con un cerebro de tres**: Gemini sí, Claude NO, GPT NO. El respaldo de OpenRouter sigue con clave válida y sus 3 modelos existen, de 471 |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-19 | Limpio en `kairo/src`, `supabase/` y `docs/`, con los 42 commits de `main` ya dentro de la rama |
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
| ✅ | Los agentes se ejecutan | 2026-10-19 | Ayer entregaron los tres que tocaban: guardián (medición del reloj), entrenador (recorte) y constructor (la rama al día con `main`). Crecimiento va cada 3 días y le toca mañana. Ocho días sin perder un turno |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
