# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-10-19 ([informe](informes/2026-10-19-estado.md))
**Semáforo general**: 🔴 hay algo que bloquea el lanzamiento, y no es técnico

## Métricas

| Métrica | Valor | Anterior (16-10) | Tendencia |
|---|---|---|---|
| Web responde | sí, leído de `/api/estado`: 200 y "TODO CORRECTO" | sí, leído | = |
| Cerebros con clave en producción | **1 de 3** (+ respaldo válido) | 1 de 3 | = tercer día |
| Reloj de Co-Works | **8 de 72 toques/24 h**, peor hueco 4 h 50 | 5 en 24 h | ↓ el cron triplicó la petición y dio 1,4× |
| Banco de pruebas del prompt | **12 de 12** evaluables | 11 de 12 | ↑ |
| Tamaño del prompt (modo adulto) | 134 líneas | 122 | ↑ con techo medido |
| Checklist de lanzamiento | 12 ✅ · 2 🟡 · 1 ⚪ de 15 | 12 de 15 | = |
| Tareas cerradas (acumulado) | **12** | 8 | ↑ +4 en 3 días |
| Commits **sin fusionar** en `main` | **34** | 19 | ↑ y esto es malo |
| Turnos de agente perdidos | 0 en 9 días | 0 | = |
| Preguntas al dueño sin contestar | 4, **siete días** | 6, cuatro días | ↓ en número, ↑ en días |
| Visitas · usuarios · ingresos | sin datos | sin datos | = sin analítica |

Las tres últimas siguen sin datos porque **no hay analítica instalada**. Desde
el 19-10 eso es una tarea propia del backlog y no una línea escondida dentro de
otra. Qué haría falta está en **Fuentes de datos** de `CONTEXTO.md`.

## Veredicto de la última revisión

**Kairo no se para por falta de trabajo: se para en la última puerta.** Hay 34
commits comprobados que no han llegado a ningún usuario, y entre ellos está
`/multas`, la primera página que podría traer gente desde Google.

El rojo del 16-10 no se ha movido —la portada promete tres cerebros y en
producción hay uno—, y a su lado hay otro más simple: nada de lo construido se
publica.

En estos tres días el sistema cerró 4 tareas, llevó el banco de pruebas a 12 de
12, recortó el prompt y luego cambió una regla incumplible por una comprobable,
y descubrió un competidor español directo que no estaba en el mapa.

**Y una corrección al informe del 16-10**, que escribió que "lo único que no
avanza es lo que depende del dueño": es falso, y la prueba está en el código.
En estos tres días él ha arreglado seis cosas en `kairo/`, incluida la raíz de
un falso positivo del guardián. El dueño construye. Lo que no hace es
**contestar preguntas y fusionar**, dos actos de un minuto que son justo los
que convierten el trabajo en producto.
