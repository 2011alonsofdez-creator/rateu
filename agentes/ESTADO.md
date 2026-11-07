# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-11-07 ([informe](informes/2026-11-07-estado.md)),
la novena
**Semáforo general**: 🔴 **octavo rojo, y el primero que no es por su inacción: lleva tres días publicada una frase falsa sobre datos personales en `/precios`, y 112 commits nuestros sin fusionar**

> **Lo que ha cambiado de verdad esta semana**: él ha hecho **41 commits en tres
> días** —su récord— y ha abierto **las dos puertas de lanzamiento que se han
> movido**: la **analítica**, que este panel llevaba nueve informes pidiendo, y
> una **prueba sin cuenta** que funciona en producción. Y por primera vez un
> agente ha **medido producción**: su propio `probar-portada.yml`, lanzado por
> el guardián, devuelve que un desconocido pregunta y Kairo contesta.

## Métricas

| Métrica | Valor | Anterior (04-11) | Tendencia |
|---|---|---|---|
| Web responde | sí, leído hoy en `revisar.yml` 36: 200 y "TODO CORRECTO" | sí | = |
| **Producción, vista de verdad** | **sí, el 07-11**: la portada carga, trae la caja de probar y **un desconocido sin cuenta recibe respuesta** (`probar-portada.yml`, log del día) | ⚪ ocho informes seguidos | ↑ **el agujero más viejo del panel, abierto** |
| **Se entiende en la primera pantalla** | ⚪ **sigue sin respuesta**: el workflow comprueba que ciertas palabras están, no cómo se lee | ⚪ | = y haría falta una captura |
| **Analítica** | **instalada el 06-11, suya**: sucesos en su propia base de datos, **sin IP, sin identificador y sin cookie**. Los números, suyos de leer | ninguna | ↑ **nueve informes pidiéndola** |
| **Prueba sin cuenta** | **existe y funciona**: tres preguntas por visitante, tope de casa de 300 al día | no existía | ↑ |
| **Commits suyos en 3 días** | **41** | 0 | ↑↑ su récord; el anterior eran 17 |
| Commits de los agentes en 3 días | **16** | 11 | ↑ |
| Commits **sin fusionar** en `main` | **112** · 27 días | 99 · 24 días | ↑ lo peor de la tabla, novena vez |
| **Conflictos de fusión** | **4 en 4 días**, los cuatro resueltos | 1 en total | ↑ consecuencia de la fila de arriba |
| Cerebros con clave directa | **1 de 3** | 1 de 3 | = **22 días** |
| Modelos que ofrece el repuesto | **424** | 419 | ↑ |
| `laguna` retirado y todavía en la cadena | **7.º día** | 4.º | ↑ dos minutos suyos |
| Reloj de Co-Works | **suena**: 198 ejecuciones, las últimas en verde | suena | = |
| **Puertas de lanzamiento** | **19**: 2 ✅ · 3 🟡 · 1 ⚪ · **13** ⬜ | 18: 1 ✅ · 2 🟡 · 1 ⚪ · 14 ⬜ | ↑ **las dos que se movieron las abrió él** |
| Checklist de salud | 14 ✅ · 4 🟡 · 1 ⚪ · 1 ⬜ de 20 | igual | = |
| Documentos legales escritos | **1 de 4**, y el publicado ya se corrigió una vez | 1 de 4 | = |
| Banco de pruebas | **pasado el 07-11, parcial**: encontró y arregló un fallo de producción; los 14 casos sin puntuar | 12 días sin pasarse | ↑ con asterisco |
| Tamaño del prompt (adulto + buscador) | **208** líneas, medido el 07-11 | 203 (medido el 01-11) | ↑ +5 |
| Tareas marcadas `[hecho]` en el backlog | **27** | 24 | ↑ +3 |
| P1 abiertos · el más viejo | **19** · 26 días | 17 · 24 días | ↑ en los dos |
| Turnos de agente perdidos | **3 esta semana**, por reinicios de la sesión | 4 el 02-11 | ↑ |
| `notas.md` | **vacío, 27 días** | vacío, 24 | ↑ |
| Visitas · conversión · ingresos | **sin datos, y por primera vez hay de dónde sacarlos** | sin datos | → |

Las tres últimas siguen sin datos, **pero por un motivo distinto desde el
06-11**: ya no es que no haya analítica —la hay—, es que **la tabla está en su
Supabase y ningún agente tiene acceso**. O las lee él, o las expone por alguna
vía. Lo que ya no se puede decir es "no hay de dónde".

## Veredicto de la última revisión

**El cuello de botella se ha movido de sitio.** En tres días él ha hecho **41
commits** y ha abierto las dos puertas de lanzamiento que se han movido esta
semana: la analítica —pedida nueve veces— y la prueba sin cuenta. Lo que queda
bloqueando ya no es que no actúe.

Lo que queda bloqueando son dos cosas concretas. **Una frase falsa sobre datos
personales, publicada desde el 05-11**: la FAQ de `/precios` dice que las
conversaciones no se usan para entrenar modelos, y en la capa gratuita de Gemini
—que es donde está la cuenta— eso es falso. Se arregla con una línea suya. **Y
112 commits sin fusionar en 27 días**, que esta semana han empezado a costar
algo nuevo y medido: **la rama se pudre**. Tres veces en tres días un cambio
suyo dejó falso material nuestro —la escala de créditos, el banco de pruebas y
la política de cookies— y las tres veces hubo que arreglarlo a mano al día
siguiente.

De ahí sale la primera de las tres cosas del próximo tramo, y es nuestra: **un
verificador que compare las cifras de nuestro material con el código**, fijo y
en el protocolo, porque la regla "revísalo en el mismo turno" ya está escrita
tres veces en tres archivos distintos y una regla que hay que recordar no es una
regla.
