# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-10-16 ([informe](informes/2026-10-16-estado.md))
**Semáforo general**: 🔴 hay algo que bloquea el lanzamiento, y no es técnico

## Métricas

| Métrica | Valor | Anterior (13-10) | Tendencia |
|---|---|---|---|
| Web responde | sí, **leído directo** de `/api/estado` | sí, indirecto | ↑ mejor prueba |
| Cerebros con clave en producción | **1 de 3** (+ respaldo) | sin datos | primera medición |
| Reloj de Co-Works | 5 en 24 h · 85 ejecuciones sin un fallo | 3 en 24 h | ↑ |
| Banco de pruebas del prompt | **11 de 12** | no existía | primera medición |
| Checklist de lanzamiento | 12 de 15 verificados | 10 de 15 | ↑ |
| Tareas cerradas (acumulado) | 6 | 3 | ↑ |
| Turnos de agente perdidos | 0 en 6 días | 0 | = |
| Preguntas al dueño sin contestar | **6, cuatro días** | 4, un día | ↓ |
| Visitas · usuarios · ingresos | sin datos | sin datos | = |

Las tres últimas siguen sin datos porque **no hay analítica instalada**. Qué
haría falta para cada una está en **Fuentes de datos** de `CONTEXTO.md`.

## Veredicto de la última revisión

Los agentes han cerrado en tres días las dos recomendaciones que eran suyas y
han llevado el prompt de "no medido" a 11 de 12 en un banco de pruebas que
antes no existía. También se cerró el punto ciego de cinco días: ya se puede
leer la salud de Kairo desde fuera.

**El rojo no es una avería.** La portada dice "Claude · Gemini · GPT" y "Tres
cerebros. Una sola IA.", y en producción solo Gemini tiene clave. Nada está
caído y se arregla con dos claves o una tarde de textos, pero mientras siga
así, lanzar significa decir algo que no es verdad.

Y el patrón de fondo, que ya apuntaba el informe anterior y ahora está claro:
**lo único que no avanza es lo que requiere una decisión del dueño**, y son
decisiones de una línea. Seis preguntas sin contestar desde el 12-10, y seis
días de trabajo comprobado esperando un merge.
