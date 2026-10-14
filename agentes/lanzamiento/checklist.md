# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-14 | Indirecto: el workflow `kairo-coworks.yml` hace `exit 1` con cualquier código que no sea 200, y su última ejecución (14-10 00:12 UTC) salió en verde, así que Kairo devolvió 200 al runner de GitHub |
| ✅ | No está en modo privado de Vercel | 2026-10-14 | Mismo motivo: el workflow detecta y distingue el 401 de Vercel. En verde ⇒ no hay portero delante |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-14 | 74 ejecuciones, ninguna fallida. **Pero suena 4 veces en 24 h en vez de 24**, peor hueco 8 h 13 min (ayer fueron 3 y 10 h 14 min). Mismo problema, sin arreglar |
| ⚪ | `/api/estado` sin variables que falten | — | Esta máquina no alcanza el dominio (ENOTFOUND / 403 del proxy) |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-14 | Sin coincidencias de `sk-`, `AIza`, `service_role` con valor ni JWT en `kairo/src`, `supabase/` y `docs/`. `main` no ha cambiado desde ayer |
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
| ✅ | Los agentes se ejecutan | 2026-10-14 | Comprobado por lo que dejaron escrito, que es más fuerte que el registro de la Rutina: ayer corrieron los cuatro y cada uno entregó (ejemplos, parte, informe del radar). El de crecimiento estrena hoy a las 10:21; ninguno ha perdido turno |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
