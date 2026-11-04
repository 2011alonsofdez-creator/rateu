# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-11-04 ([informe](informes/2026-11-04-estado.md)),
la octava
**Semáforo general**: 🔴 **séptimo rojo seguido. La Kairo publicada sigue vendiendo lo que no tiene, y tu lado de la mesa está a cero: 0 commits en tres días y los 17 P1 abiertos esperan los 17 algo tuyo**

> **Lo bueno del día, y no es pequeño**: Kairo tiene su **primer documento legal
> de verdad**, la política de cookies, completa y en dos idiomas. Y existe por
> **partir una tarea que llevaba tres días marcada como bloqueada**: de los
> cuatro documentos legales, tres necesitan datos del dueño y uno no necesitaba
> nada. Es la primera puerta de lanzamiento que se abre con trabajo hecho en vez
> de con una comprobación.

## Métricas

| Métrica | Valor | Anterior (31-10) | Tendencia |
|---|---|---|---|
| Web responde | sí, leído hoy en `revisar.yml` 33: 200 y "TODO CORRECTO" | sí | = |
| **Se entiende en la primera pantalla** | ⚪ **sin datos, octavo informe**: la sede no abre la web (403 del proxy, comprobado hoy) | ⚪ | = y ya hay plan para cerrarlo: captura con Playwright desde GitHub |
| Usuarios reales | **cuatro avisos** de "me da datos viejos" (commit `688ecb2`), sin más datos | 4 avisos | = y sin medir |
| **Commits tuyos en 3 días** | **0** | 17 | ↓↓ **el dato del informe** |
| Commits **sin fusionar** en `main` | **99** · 24 días | 87 · veinte días | ↑ lo peor de la tabla, octava vez |
| Commits de los agentes en 3 días | **11**, con el 02-11 a cero | 11 | = |
| Cerebros con clave directa | **1 de 3** (hoy: "Gemini 3 clave(s) · Claude NO · GPT NO") | 1 de 3 | = **día 20** |
| Casas que ficha un MEGA | **3**: google + openai + deepseek · Claude entra **tercero** en la variable y se queda fuera | 3 | = |
| Modelos que ofrece el repuesto | **419** | 416 (01-11) | ↑ |
| `laguna` retirado y todavía en la cadena | **4.º día** | 1.º | ↑ y son dos minutos suyos |
| Coste del repuesto que entra cada tarde | $0,10/M + $0,50/M + ~2 cts/consulta | igual | = **y sigue sin tope** |
| Reloj de Co-Works | **suena**: 191 ejecuciones, las 8 últimas en verde, hoy a las 06:05 | suena | = **no falló ni el día que se cayó esta sesión** |
| **Documentos legales escritos** | **1 de 4** (cookies, hoy) | 0 de 4 | ↑ |
| **Puertas de lanzamiento** | **18**: 1 ✅ · **2** 🟡 · 1 ⚪ · **14** ⬜ | 1 ✅ · 1 🟡 · 1 ⚪ · 15 ⬜ | ↑ la primera abierta con trabajo |
| Checklist de salud | 13 ✅ · 5 🟡 · 1 ⚪ · 1 ⬜ de 20 | igual | = |
| Páginas de intención | 5 de 6, **las cinco enlazadas** desde el 01-11 | 5 de 6, ninguna enlazada | ↑ |
| Banco de pruebas del prompt | 25 de 28 (23-10) · **12 días** sin pasarse, 9 cambios dentro | 8 días, 8 cambios | ↓ empeora a la velocidad a la que se entrena |
| Tamaño del prompt (adulto + buscador) | **203** líneas (medido el 01-11; sin cambios desde) | 201 | ↑ +2 |
| Tareas marcadas `[hecho]` en el backlog | **24** | **21** | ↑ +3 |
| Turnos de agente perdidos | **4 el 02-11**; racha actual **2 días** | 0 en 21 días | ↓ se rompió una racha de 22 |
| `notas.md` | **vacío, 24 días** desde que existe | vacío, 19 | ↑ en días |
| Visitas · conversión · ingresos | sin datos | sin datos | = sin analítica |

Las tres últimas siguen sin datos porque **no hay analítica instalada** (en el
backlog desde el 19-10, pedida en nueve informes). Y una corrección de este
panel: donde el 31-10 decía "tareas cerradas: 24", contando como hoy —marcas
`[hecho …]` en el backlog— eran **21**. Una métrica que no se puede recalcular
no es una métrica.

## Veredicto de la última revisión

**"Bloqueado esperándote" no era del todo verdad, y hoy hay prueba.** El P1 de
los textos legales llevaba tres días parado entero por cuatro datos del dueño, y
eso era verdad de **tres** de los cuatro documentos: la política de cookies no
pregunta quién eres, pregunta qué pone Kairo en el navegador de quien la abre.
Escrita hoy, completa, con 30 comprobaciones sobre el HTML generado.

De ahí sale el cambio de método que entra en el backlog: **cada P1 que espere al
dueño lleva de ahora en adelante una línea «el trozo que no te espera»**, o dice
que no hay ninguno. Tres días de parón por no haber mirado la costura.

Lo que no ha cambiado, y es lo que pone el semáforo en rojo: `main` sigue sin
tocar desde el 31-10, así que la Kairo publicada sigue vendiendo *"Mentes
ilimitadas"* contra un tope de 30 y **conectores que no existen**. El arreglo de
la primera está escrito desde el 31-10, en la rama de **99 commits y 24 días**.
La segunda no la arregla ningún agente: es cómo quieres venderlo, y son diez
minutos en cuanto lo digas.

Y el patrón del 31-10 sigue en pie, cuatro días más viejo: **actúa sobre los
hallazgos pero no coge los arreglos.** Reimplementa en `main` en vez de
fusionar, así que el hallazgo le llega y el arreglo se queda en la rama.
