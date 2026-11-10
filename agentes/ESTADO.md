# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-11-10 ([informe](informes/2026-11-10-estado.md)),
la décima
**Semáforo general**: 🔴 **noveno rojo, y hoy por dos cosas: el "No." falso de `/precios` cumple cinco días publicado, y los días 8 y 9 no corrió ningún agente —tercera avería en nueve días—**

> **Lo que ha cambiado de verdad esta vez**: el que se ha parado es **el
> sistema**. Dos días en blanco, y él ha pasado de **41 commits en tres días** a
> **2** —un revert del icono de pestaña, el 07-11— y nada desde entonces. Lo que
> sí se hizo: el **verificador de cifras**, pedido en el informe anterior y
> entregado dentro de sus tres días, que encontró un fallo real a la primera. Y
> el hallazgo propio de hoy: **ese verificador no mira los dos archivos que todo
> agente lee primero**, y los dos llevaban cinco días con la escala vieja.

## Métricas

| Métrica | Valor | Anterior (07-11) | Tendencia |
|---|---|---|---|
| **Producción, vista de verdad** | **sí, hoy a las 08:41, y la midió el radar**: ejecución 7 de `probar-portada.yml`, cinco pasos en verde, `{"texto":"FUNCIONA","quedan":2}` y el tope cortando a la tercera (200, 200, 429, 429) | sí, el 07-11, por el guardián | = **dos de dos** |
| **Los agentes se ejecutan** | **🔴 no**: 08-11 y 09-11 sin ninguno. Ocho avisos leídos de golpe hoy a las 06:17. Tercera avería en nueve días | 3 turnos sueltos perdidos | ↓ antes turnos, ahora **días** |
| **Commits suyos desde el informe anterior** | **2**, los dos el 07-11 11:39, y son un revert del icono de pestaña. **0** en los tres días siguientes | **41** en tres días | ↓↓ de su récord a cero |
| Commits de los agentes desde el informe anterior | **3**, los tres de hoy | 16 | ↓ dos días sin ninguno |
| Commits **sin fusionar** en `main` | **116** · 30 días | 112 · 27 días | ↑ lo peor de la tabla, **décima vez** |
| Conflictos de fusión | **0** estos 3 días, y **no por mérito**: no ha publicado nada que chocara | 4 en 4 días | ↓ |
| **Cifras falsas en material nuestro** | **4**, encontradas hoy a mano en `CONTEXTO.md` y el checklist: tres de cinco días y una de **doce**. Corregidas | 1, y la encontró el script | → cambia **quién** lo encuentra |
| **Verificador de cifras** | **existe y pasa en verde** (`agentes/comprobar/cifras.py`), y **no cubre los paneles vivos**: es el P1 de hoy | no existía | ↑ con su punto ciego anotado |
| **Se entiende en la primera pantalla** | ⚪ **sigue sin respuesta**: el workflow comprueba que ciertas palabras están, no cómo se lee | ⚪ | = y haría falta una captura |
| Analítica | instalada el 06-11, suya; cuatro días recogiendo en su Supabase | instalada | = los números siguen siendo suyos de leer |
| Prueba sin cuenta | **funciona, medido hoy**, y desde hoy **habla con el tono de Kairo**: el `SISTEMA` no pegaba ninguno de los cuatro | funciona | ↑ |
| **Puertas de lanzamiento** | **19**: 2 ✅ · 3 🟡 · 1 ⚪ · 13 ⬜ | igual | = **ninguna se ha movido** |
| Checklist de salud | **13 ✅ · 1 🔴 · 4 🟡 · 1 ⚪ · 1 ⬜** de 20 | 14 ✅ · 4 🟡 · 1 ⚪ · 1 ⬜ | ↓ una pasó a 🔴 |
| Reloj de Co-Works | **suena**: 215 toques, los cuatro últimos en verde, y **ninguno perdido los días 8 y 9** | suena: 198 | = y hoy prueba algo |
| `/api/estado` | "TODO CORRECTO", Gemini 3 claves, Telegram válido, búsqueda con 10 modelos (`revisar.yml` 37, hoy 06:18) | igual | = |
| Cerebros con clave directa | **1 de 3** | 1 de 3 | = **25 días** |
| Modelos que ofrece el repuesto | **429** | 424 | ↑ |
| `laguna` retirado y todavía en la cadena | **9 días** (desde el 01-11) | 6 | ↑ dos minutos suyos |
| Documentos legales escritos | **1 de 4** | 1 de 4 | = esperando cinco campos suyos, 6 días |
| Banco de pruebas | **sin puntuar**, quinto informe pidiéndolo | sin puntuar | = |
| Tamaño del prompt (adulto + buscador) | **208** líneas, sin cambio | 208 | = |
| Tareas marcadas `[hecho]` en el backlog | **28** | 27 | ↑ +1 |
| P1 abiertos · el más viejo | **21** · 29 días | 19 · 26 días | ↑ los dos nuevos son de hoy |
| Turnos de agente perdidos | **2 días enteros** (08 y 09-11) | 3 turnos esa semana | ↓ |
| `notas.md` | **vacío, 30 días** | vacío, 27 | ↑ |
| Visitas · conversión · ingresos | **sin datos**, y la analítica lleva cuatro días recogiendo | sin datos | → los números existen y no los vemos |

## Veredicto de la última revisión

**Esta vez el que se ha parado es el sistema, no él.** Dos días seguidos sin que
corriera ningún agente —08 y 09-11, la tercera avería en nueve días— y ocho
avisos leídos de golpe. No falló ninguna rutina: falló el proceso que las
ejecuta. Lo que se pierde no vuelve: el informe de mercado del 08-11 no existe y
el mercado lleva sin mirarse desde el 05-11.

Y el hallazgo del día es nuestro, y se escribe aunque dé vergüenza: **el
verificador que se construyó ayer para que las cifras no envejezcan solas no
mira `CONTEXTO.md` ni el checklist de lanzamiento**, que son los dos paneles que
todo agente lee antes de opinar. Los dos llevaban **cinco días** enseñando la
escala de créditos de antes del 05-11: `free` 15, `plus` 1000, `supreme` 3000, y
los niveles a 1/4/20/120. Y una más, de **doce** días: que el plan gratis "solo
alcanza el nivel rápido", cuando llega a `normal` desde el 29-10. Corregidas hoy. Llevar el script a esos archivos
—recortando las cadenas de `Lo de antes:`, que citan cifras viejas a propósito—
es el P1 que sale de esta revisión.

Lo que bloquea por su parte no ha cambiado en cinco días: el **"No."** de
`/precios`. Y lo que ahora bloquea por la nuestra es la máquina, que también se
arregla con algo suyo: **cron diarios**, pedidos desde el 01-11.
