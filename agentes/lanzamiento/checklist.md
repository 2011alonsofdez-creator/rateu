# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-16 | **Directo por fin.** El workflow `revisar.yml`, que el dueño añadió el 15-10, lee `/api/estado` desde un runner de GitHub. Lanzado hoy a las 05:14: HTTP 200 y "TODO CORRECTO" |
| ✅ | No está en modo privado de Vercel | 2026-10-15 | Mismo motivo: el workflow detecta y distingue el 401 de Vercel. En verde ⇒ no hay portero delante |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-16 | 85 ejecuciones, ninguna fallida. 5 en 24 h, peor hueco 5 h 22 min. Se ha estabilizado ahí tras subir de 3 a 6; ya no mejora ni empeora |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-16 | Leído hoy: responde "TODO CORRECTO", pero **solo Gemini tiene clave**. Claude: NO. GPT: NO. El respaldo de OpenRouter sí, con 3 modelos que existen los tres |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-16 | Limpio en `kairo/src`, `supabase/` y `docs/`. Revisados también los 19 commits que el dueño metió en `main` el 15-10, incluido el `.env.example` nuevo: solo huecos y ejemplos |
| ✅ | Ningún secreto detrás de `NEXT_PUBLIC_` | 2026-10-12 | Las 6 variables públicas son URL del proyecto y claves anon/publishable, que son públicas por diseño |
| ✅ | Título y meta descripción propios | 2026-10-12 | `kairo/src/app/layout.tsx` |
| ✅ | Favicon | 2026-10-12 | `kairo/src/app/icon.svg` |
| ✅ | Imagen de Open Graph | 2026-10-14 | Hecha: `kairo/public/og.png` 1200x630 y `metadataBase` en `layout.tsx`, comprobadas con un `next build` completo. **Ojo: está en la rama de agentes, no en producción.** `main` no la tiene todavía |
| ✅ | `robots.txt` | 2026-10-14 | Hecho, con `sitemap.ts` de propina. El build los sirve en `/robots.txt` y `/sitemap.xml`. **También pendiente de fusionar a `main`** |
| ✅ | Enlace visible a los textos legales | 2026-10-12 | `SiteFooter` en `kairo/src/components/SiteHeader.tsx:89-92`, presente en la portada |
| ✅ | Los enlaces de la portada llevan a algún sitio | 2026-10-12 | Botón principal → `/chat`, que existe en `(app)/chat`. Secundario → `#features`, que existe en `page.tsx:176` |

## Funciona el sistema de agentes

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Los agentes se ejecutan | 2026-10-16 | Ayer entregaron los tres que tocaban: guardián, entrenador (casos límite) y constructor (el arreglo del texto pegado). Ningún turno perdido desde que se instaló el sistema |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
