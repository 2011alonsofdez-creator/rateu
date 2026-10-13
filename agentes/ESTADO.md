# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-10-13 ([informe](informes/2026-10-13-estado.md))
**Semáforo general**: 🟡 avanza, pero el cuello de botella se ha movido

## Métricas

| Métrica | Valor | Anterior | Tendencia |
|---|---|---|---|
| Web responde | sí (indirecto: workflow en verde 13-10 00:14 UTC) | — | primera medición |
| Reloj de Co-Works | verde, pero 3 ejecuciones en 24 h, no 24 | — | primera medición |
| Visitas (7 días) | sin datos | — | — |
| Usuarios registrados | sin datos | — | — |
| Conversaciones (7 días) | sin datos | — | — |
| Ingresos | sin datos | — | — |
| Checklist de lanzamiento | 10 de 15 filas, pero mide salud, no lanzamiento | — | primera medición |
| Tareas cerradas (últimos 3 días) | 3 | 0 | ↑ |
| Turnos de agente perdidos | 0 de 6 | — | primera medición |

Las cuatro "sin datos" no son un descuido: **no hay ninguna analítica
instalada**, comprobado en `kairo/src` y en `package.json`. Qué haría falta
para cada una está en la tabla de **Fuentes de datos** de `CONTEXTO.md`.

## Veredicto de la última revisión

Kairo está sana y el sistema de agentes produce de verdad: 9 commits y 3 tareas
cerradas en 3 días, sin perder un turno. Lo que falta para poder lanzar ya no
lo pueden hacer los agentes: son cuatro decisiones del dueño —los niveles de
cada plan, qué hacer con el reloj, si la tienda está encendida y si Kairo está
lanzada— que llevan un día pedidas y bloquean trabajo ya preparado.

Lo más feo que hay hoy, por orden: el reloj suena 3 veces al día en vez de 24 y
nadie se entera porque sale verde; Kairo no conoce sus propios precios y se los
inventaría; y Kairo+ incluye MEGA igual que Supreme, lo que deja al plan de
24,99 € sin argumento el día que se enciendan los pagos.
