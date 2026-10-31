# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-10-31 ([informe](informes/2026-10-31-estado.md))
**Semáforo general**: 🔴 **los planes de pago venden lo que Kairo no tiene, y el arreglo está en la rama**

## Métricas

| Métrica | Valor | Anterior (28-10) | Tendencia |
|---|---|---|---|
| Web responde | sí, leído de `/api/estado`: 200 y "TODO CORRECTO" | sí | = |
| **Se entiende en la primera pantalla** | ⚪ **sin datos, séptimo informe**: la sede no abre la web | ⚪ | = y es lo único que ningún agente ha visto nunca |
| Usuarios reales | **4 avisos de personas** (commit `688ecb2`), sin más datos | 4 avisos | = y sin medir |
| Cerebros con clave directa | **1 de 3** | 1 de 3 | = **decimosexto día** |
| **Casas que ficha un MEGA** | **3**: google + openai + deepseek | 1 | ↑ su commit del 30-10, y **Claude se queda fuera por el orden de la variable** |
| Claves de Gemini | **3** | 3 | = |
| Coste del repuesto que entra cada tarde | **$0,10/M + $0,50/M** + ~2 cts/consulta | $0,44/M + $1,32/M + ~2 cts | ↓ **4,4× más barato, y sigue sin tope** |
| Reloj de Co-Works | **suena**, tres días verificado sin medir | 4 de 72 · hueco 6 h 18 | = y ya no se mide a diario, por decisión del 28-10 |
| **Tope real de Co-Works** | **1** en el plan gratis · **10** en los de pago | 10 para todos | ↓ el gratis, por su commit del 29-10 |
| Páginas de intención | **5 de 6**, y **ninguna enlazada** desde la web | 5 de 6, ninguna enlazada | = **veintiún días** sin camino de entrada |
| Banco de pruebas del prompt | 25 de 28 (23-10), **8 días sin pasarse y 8 cambios dentro** | 25 de 28, 5 días sin repasar | ↓ **empeora a la velocidad a la que se entrena** |
| Tamaño del prompt (adulto + buscador) | **201** líneas | 193 | ↑ +8, y −2 hoy por el recorte |
| Checklist de lanzamiento | 13 ✅ · **5** 🟡 · 1 ⚪ · 1 ⬜ de **20** | 13 ✅ · 3 🟡 · 1 ⚪ · 1 ⬜ de 18 | = en ✅, **dos filas nuevas y las dos 🟡** |
| Tareas cerradas (acumulado) | **24** | 18 | ↑ +6 |
| Commits **sin fusionar** en `main` | **87** · veinte días | 73 · dieciocho días | ↑ **lo peor de la tabla** |
| Commits del dueño en 3 días | **17** | 15 | ↑ su mejor racha |
| Commits de los agentes en 3 días | **11** | 9 | ↑ |
| Turnos de agente perdidos | 0 en **21 días** | 0 en 18 | = |
| Decisiones sin contestar | **8**, diecinueve días | 8, dieciséis días | ↑ en días |
| Visitas · conversión · ingresos | sin datos | sin datos | = sin analítica |

Las tres últimas siguen sin datos porque **no hay analítica instalada** (tarea
propia del backlog desde el 19-10). **Y lo que decía aquí hasta hoy era falso**:
decía que el reloj informa de 0 Co-Works y 0 papeles "o sea que todavía no hay
nadie dentro". Eso vale para los Co-Works y los papeles; **no para el chat**. El
commit `688ecb2` del dueño menciona **cuatro personas** que avisaron de que
Kairo daba datos viejos. Hay usuarios: lo que no hay es forma de contarlos.

## Veredicto de la última revisión

**La página de precios de la Kairo publicada miente en las dos direcciones a la
vez, y eso solo se arregla en `main`.** Vende el plan gratuito **peor** de lo
que es —15 créditos y "modelo rápido" cuando son 20 y llega al normal— y los de
pago **mejor** de lo que son: "Co-Works ilimitados" contra un tope de 10,
"Mentes ilimitadas" contra 30, y **conectores que no existen** (la pantalla
sigue con `BotonAunNo`).

Los arreglos de las tres cosas están escritos y comprobados, en la rama de
**87 commits y veinte días**. Así que esto se dice por primera vez con prueba:
**fusionar no es un favor a los agentes**. Lo que bloquea el lanzamiento de los
planes de pago está resuelto y sin publicar.

Y el patrón que lo explica, nuevo en este informe: **él actúa sobre los
hallazgos pero no coge los arreglos.** Quitó el "Próximamente" de Team el mismo
día que se le dijo, cambió el repuesto por uno 4,4× más barato cuando se le
pidió un tope, y puso las tres claves de Gemini al día siguiente. Reimplementa
en `main` en vez de fusionar, así que el hallazgo le llega y el arreglo se
queda.
