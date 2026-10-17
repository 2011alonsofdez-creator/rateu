# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-17 | `revisar.yml` lanzado hoy a las 05:13 UTC: HTTP 200 y "TODO CORRECTO" |
| ✅ | No está en modo privado de Vercel | 2026-10-17 | El workflow detecta y distingue el 401 de Vercel. En verde ⇒ no hay portero delante |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-17 | 91 ejecuciones, ninguna fallida. **El dueño cambió el cron anoche**, de cada hora a cada 20 minutos. Con el cron nuevo solo han caído 2 ejecuciones y el hueco sigue en 4 h 16 min: **demasiado pronto para saber si ha servido**. Se mide mañana |
| 🟡 | `/api/estado` sin variables que falten | 2026-10-17 | "TODO CORRECTO", pero **sigue con un solo cerebro**: Gemini sí, Claude NO, GPT NO. El respaldo ahora dice "clave puesta y válida" y sus 3 modelos existen, de 469 |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-17 | Limpio en `kairo/src`, `supabase/` y `docs/`, incluidos los commits nuevos de `main` |
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
| ✅ | Los agentes se ejecutan | 2026-10-17 | Ayer entregaron los cuatro: guardián, entrenador (banco de pruebas), constructor (capacidades) y radar (segunda revisión). Ningún turno perdido en seis días |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
