# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-10-22 ([informe](informes/2026-10-22-estado.md))
**Semáforo general**: 🔴 nada de lo construido llega a nadie

## Métricas

| Métrica | Valor | Anterior (19-10) | Tendencia |
|---|---|---|---|
| Web responde | sí, leído de `/api/estado`: 200 y "TODO CORRECTO" | sí | = |
| Cerebros con clave en producción | **1 de 3** | 1 de 3 | = séptimo día |
| Reloj de Co-Works | **5 de 72** toques/24 h · peor hueco 10 h 39 · **0 encargos perdidos** | 8 de 72 · 4 h 50 | ↓ en toques, **y no cuesta nada**: suena en vacío |
| Telegram | el token está puesto **y Telegram lo acepta** | sin medir | ↑ primera medición |
| Buscador | **encendido**, 10 modelos | sin medir | ↑ primera medición |
| Respaldo de OpenRouter | 3 modelos, **los 3 a $0/M**, medido | solo "existen" | ↑ mejor prueba |
| Banco de pruebas del prompt | 12 de 12 (sin repasar desde el 17-10) | 12 de 12 | = envejeciendo |
| Casos de ejemplo escritos | **12**, de los que **0 medidos** | 6 | ↑ en material, = en medida |
| Checklist de lanzamiento | 14 ✅ · 2 🟡 · 1 ⚪ de 17 | 12 ✅ de 15 | ↑ en filas, = en fondo |
| Tareas cerradas (acumulado) | **14** | 12 | ↑ |
| Commits **sin fusionar** en `main` | **47** | 34 | ↑ y esto es malo |
| Turnos de agente perdidos | 0 en 12 días | 0 | = |
| Preguntas al dueño sin contestar | 4, **diez días** | 4, siete días | ↑ en días |
| Visitas · usuarios · ingresos | sin datos | sin datos | = sin analítica |

Las tres últimas siguen sin datos porque **no hay analítica instalada** (tarea
propia del backlog desde el 19-10). Y hay una prueba más de lo mismo desde otro
ángulo: el reloj informa de **0 Co-Works y 0 papeles**, o sea que todavía no hay
nadie dentro.

## Veredicto de la última revisión

**Esta semana el sistema ha dejado de buscar averías y ha empezado a encontrar
fallos de honestidad**: los dos hallazgos que importan estaban en **lo que Kairo
promete**, no en lo que hace, y los dos están arreglados sin esperar ninguna
decisión.

1. `/precios` ya no afirma que no se entrena con tus conversaciones —dependía de
   la capa de la cuenta de Gemini, sin comprobar— y dice en su lugar lo que sí
   es verificable: **el archivo que subes no se guarda**.
2. El respaldo de OpenRouter ya se vigila **en euros**: de cada modelo gratuito
   existe un gemelo de pago con el id casi igual, así que perder el `:free` no
   rompe nada, **empieza a cobrar**.

**El rojo sigue por lo mismo que el 16 y el 19**: 47 commits sin fusionar, doce
días, y la portada prometiendo tres cerebros con uno en producción. Nada de lo
construido llega a nadie, y eso incluye la corrección de `/precios`, que en
producción sigue sin aplicarse.

**Y de las nueve cosas pendientes, siete se contestan en menos de cinco
minutos.** No son tareas: son respuestas.
