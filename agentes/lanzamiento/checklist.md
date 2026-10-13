# Checklist de lanzamiento de Kairo

Lo marca el guardián **solo con lo que ha verificado de verdad ese día**.
Nada marcado de memoria ni por lo que diga un README.

Leyenda: ✅ verificado · ⚪ no comprobable desde la sede · ⬜ sin verificar aún

## Está viva

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | La web responde | 2026-10-13 | Indirecto: el workflow `kairo-coworks.yml` hace `exit 1` con cualquier código que no sea 200, y su última ejecución (13-10 00:14 UTC) salió en verde, así que Kairo devolvió 200 al runner de GitHub |
| ✅ | No está en modo privado de Vercel | 2026-10-13 | Mismo motivo: el workflow detecta y distingue el 401 de Vercel. En verde ⇒ no hay portero delante |
| 🟡 | El reloj de Co-Works sigue sonando | 2026-10-13 | 70 ejecuciones, las 8 últimas correctas. **Pero suena 3 veces al día en vez de 24**, con un hueco de 10 h 14 min. Verde no es puntual |
| ⚪ | `/api/estado` sin variables que falten | — | Esta máquina no alcanza el dominio (ENOTFOUND / 403 del proxy) |
| ⚪ | `/revision` sin migraciones pendientes | — | Igual |

## Está sana

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Sin claves en el código | 2026-10-13 | Sin coincidencias de `sk-`, `AIza`, `service_role` con valor ni JWT en `kairo/src`, `supabase/` y `docs/`. Revisado también el código nuevo que entró en `main` el 12-10 (`f44d0a8`): limpio |
| ✅ | Ningún secreto detrás de `NEXT_PUBLIC_` | 2026-10-12 | Las 6 variables públicas son URL del proyecto y claves anon/publishable, que son públicas por diseño |
| ✅ | Título y meta descripción propios | 2026-10-12 | `kairo/src/app/layout.tsx` |
| ✅ | Favicon | 2026-10-12 | `kairo/src/app/icon.svg` |
| 🟡 | Imagen de Open Graph | 2026-10-12 | **Falta.** Hay `openGraph` con título y descripción, pero sin `images` ni `metadataBase` |
| 🟡 | `robots.txt` | 2026-10-12 | **Falta.** No hay `robots.ts` ni `robots.txt`, ni carpeta `public/` |
| ✅ | Enlace visible a los textos legales | 2026-10-12 | `SiteFooter` en `kairo/src/components/SiteHeader.tsx:89-92`, presente en la portada |
| ✅ | Los enlaces de la portada llevan a algún sitio | 2026-10-12 | Botón principal → `/chat`, que existe en `(app)/chat`. Secundario → `#features`, que existe en `page.tsx:176` |

## Funciona el sistema de agentes

| | Qué | Verificado | Cómo |
|---|---|---|---|
| ✅ | Los agentes se ejecutan | 2026-10-13 | Comprobado en las Rutinas, no supuesto: los 5 están activas, y guardián, entrenador y constructor dispararon ayer con `SUCCEEDED`. El radar estrena hoy a las 09:38 y el de crecimiento el 14; ninguno ha perdido turno |
| ✅ | Parte diario del constructor | 2026-10-13 | El del 12-10 está en `agentes/diario/2026-10-12.md`, con la sección del entrenador conservada |
