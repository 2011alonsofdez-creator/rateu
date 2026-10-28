# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-10-28 ([informe](informes/2026-10-28-estado.md))
**Semáforo general**: 🔴 **las dos mitades de Kairo se contradicen en producción**

## Métricas

| Métrica | Valor | Anterior (25-10) | Tendencia |
|---|---|---|---|
| Web responde | sí, leído de `/api/estado`: 200 y "TODO CORRECTO" | sí | = |
| Usuarios reales | **4 avisos de personas** (commit `688ecb2`), sin más datos | 4 avisos | = y sin medir |
| Cerebros con clave en producción | **1 de 3** | 1 de 3 | = **decimotercer día** |
| Claves de Gemini | **3** | 1 | ↑ pedido el 25-10, puesto el 26-10 |
| Repuestos de búsqueda | **3**: web de pago, Claude (sin clave) y Wikipedia | 0 | ↑ el arreglo del fallo de los usuarios |
| Coste del repuesto que entra cada tarde | **$0,44/M + $1,32/M + ~2 cts/consulta** | no existía | ↓ **y sin tope de gasto** |
| Reloj de Co-Works | **4 de 72** · peor hueco 6 h 18 | 7 de 72 · 4 h 23 | ↓, y ya **no se mide a diario**: 15 días sin cambiar el diagnóstico |
| Páginas de intención | **5 de 6**, y **ninguna enlazada** desde la web | 3 de 6 | ↑ +2 |
| Banco de pruebas del prompt | 25 de 28 (23-10), **sin repasar en 5 días** | 25 de 28 | = y envejeciendo con 4 cambios de prompt dentro |
| Tamaño del prompt (adulto + buscador) | **193** líneas · 226 con resultados | 182 | ↑ |
| Checklist de lanzamiento | 13 ✅ · 3 🟡 · 1 ⚪ · 1 ⬜ de 18 | 13 ✅ · 3 🟡 · 1 ⚪ de 17 | = en fondo |
| Tareas cerradas (acumulado) | **18** | 16 | ↑ +2 |
| Commits **sin fusionar** en `main` | **73** | 59 | ↑ **lo peor de la tabla** |
| Commits del dueño en 3 días | **15** | 2 | ↑ ×7,5 |
| Turnos de agente perdidos | 0 en **18 días** | 0 en 15 | = |
| Decisiones sin contestar | **8**, dieciséis días | 8, trece días | ↑ en días |
| Visitas · conversión · ingresos | sin datos | sin datos | = sin analítica |

Las tres últimas siguen sin datos porque **no hay analítica instalada** (tarea
propia del backlog desde el 19-10). **Y lo que decía aquí hasta hoy era falso**:
decía que el reloj informa de 0 Co-Works y 0 papeles "o sea que todavía no hay
nadie dentro". Eso vale para los Co-Works y los papeles; **no para el chat**. El
commit `688ecb2` del dueño menciona **cuatro personas** que avisaron de que
Kairo daba datos viejos. Hay usuarios: lo que no hay es forma de contarlos.

## Veredicto de la última revisión

**Las dos mitades de Kairo se están separando, y ya produce fallos concretos en
la Kairo publicada.** Ha sido el ciclo más productivo por los dos lados —15
commits del dueño en tres días, nueve de los agentes— pero él publica en `main`
y los agentes en una rama con **73 commits y dieciocho días sin fusionar**. Y
eso ya no es un retraso abstracto:

- **Kairo Code vive en producción desde el 25-10 y el prompt de producción no
  sabe que existe**, así que Kairo niega poder hacer una app con un botón en su
  barra lateral que la hace. Arreglado el 26-10, en la rama.
- **Su buscador de Wikipedia vive, y la regla del prompt que manda ignorar su
  cabecera también.** Arreglado el 28-10, en la rama.
- **Paperwork no avisa de que alegar una multa quema el descuento del 50%.**
  Arreglado el 27-10, en la rama.

Lo que sí ha ido muy bien: el dueño puso las tres claves de Gemini al día
siguiente de pedírselas, y el sistema se corrigió a sí mismo cuatro veces en
tres días —la premisa de que no había usuarios, la fila del buscador medida en
el mejor momento del día, el reloj que se dejó de medir, y un P1 cerrado que
seguía abierto en el backlog—.
