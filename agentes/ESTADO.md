# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-11-25 ([informe](informes/2026-11-25-estado.md)),
la decimoquinta
**Semáforo general**: 🔴 **decimocuarto rojo, y por primera vez el motivo no son preguntas sin contestar sino UNA SOLA ACCIÓN sin hacer. El retroceso de ayer está deshecho —las puertas vuelven a 2 de 22 porque Kairo contesta otra vez— y lo más viejo del backlog quedó cerrado anoche. Lo que bloquea el lanzamiento es que producción no tiene ni un documento legal publicado, no tiene la defensa contra inyección, y su propia FAQ de anoche manda a una política de privacidad que en producción NO EXISTE. Las tres se arreglan con una fusión que desde hoy no tiene conflictos**
Lo de antes: 🔴 decimotercer rojo, y por primera vez en catorce revisiones Kairo ha ido HACIA ATRÁS: una puerta de lanzamiento que estaba abierta se ha cerrado. Las puertas pasan de 2 a 1 de 22, porque la que medía que un desconocido recibe su primera respuesta —la única que mide lo que convierte— lleva cuatro días en rojo**
Lo de antes: 🔴 duodécimo rojo, y el motivo ya no se puede decir más corto: no falta trabajo, falta él. Todo lo que los agentes pueden tocar se está arreglando; todo lo que necesita una decisión suya está congelado, y lo más viejo lleva diecinueve días**
Lo de antes: 🔴 undécimo rojo, por tres documentos legales terminados y cero publicados (sigue igual, quince días la política de cookies)

> **Lo que ha cambiado de verdad, y hoy sí es bueno**: volvió tras cinco días
> sin empujar una línea y en **tres commits** cerró el 🔴 del desconocido, el
> *"No."* de `/precios` (**19 días**), la contradicción sobre datos personales
> (12) y el tope de Mentes (11). Kairo **contesta otra vez**: `probar-portada`
> 22 pasa los cinco pasos. Y los agentes dejaron la fusión **sin un solo
> conflicto**: `main` es ya ancestro de la rama, así que fusionarla es un
> *fast-forward*.
>
> **Y el hallazgo del día nace de algo bien hecho**: su FAQ nueva acaba en *"lo
> tienes explicado en la política de privacidad"*, y en producción esa política
> **no existe** —`/legal` dice "Pendiente de redactar"—. Su cambio está a medias
> en producción y la otra mitad la tiene presa la fusión.
>
> Lo de antes (24-11), que ya no es verdad: en cinco días
> (la revisión llega dos días tarde, con el aviso tres días en la cola),
> **5 commits de agentes —2 tocando el producto— y 2 suyos en `main`, los dos
> del 19-11 a las 23:56**. O sea: **lleva 4 días y 7 horas sin empujar una línea
> de código**, el hueco más largo que ha registrado este panel. Vivo está: cambió
> la cadena de modelos **en Vercel**, con `main` quieto.
>
> Y mientras esperaba, **el producto empeoró**: un desconocido no recibe
> respuesta desde el 20-11, los agentes perdieron tres días enteros (21, 22 y
> 23-11, sexta avería de entrega) y resultó que vendíamos Kairo Código a **mitad
> de precio** desde el 06-11, en cinco sitios y dos idiomas. Los dos únicos
> arreglos del periodo son errores nuestros, no mejoras del producto.
>
> Lo de antes (19-11): en tres días, **10 commits de agentes —6 de
> ellos tocando el producto— y 19 suyos en `main`**, incluida la revisión de
> seguridad que cerró el agujero más grave que ha tenido Kairo. Se arregló el
> fallo que daba a un niño una tabla de precios, los tres suspensos del banco de
> pruebas, la caja de probar en las tres páginas de papeles y la viñeta que le
> faltaba al plan gratis. **Y las puertas de lanzamiento siguen en 2 de 22,
> símbolo por símbolo iguales que el 16-11.** Quince días sin que se abra
> ninguna.
>
> Lo de antes (16-11): los tres días más productivos del sistema, y Kairo igual
> de lejos del lanzamiento. Sigue siendo verdad, y ahora con quince días.

## Métricas

| Métrica | Valor | Anterior (24-11) | Tendencia |
|---|---|---|---|
| **Puertas de lanzamiento** | **2 ✅ · 4 🟡 · 1 ⚪ · 15 ⬜** de 22 | 1 ✅ · 4 🟡 · 1 🔴 · 1 ⚪ · 15 ⬜ | ↑ **el retroceso, deshecho** |
| Checklist de salud | **15 ✅ · 3 🟡 · 1 ⚪ · 1 ⬜** de 20 | 14 ✅ · 3 🟡 · 1 🔴 | ↑ |
| **Días que Kairo lleva sin contestar** | **0** | 4 | ↑ |
| **Banco de pruebas en PRODUCCIÓN** | **20 / 30** | sin medir | **nuevo, y es la cifra que importa** |
| **Conflictos de la fusión** | **0** · `main` es ancestro | 5 archivos | ↑ **hecho hoy** |
| Rama sin fusionar | **165 commits, 25 días** | 153, 24 días | ↓ |
| Documentos legales escritos / **publicados** | **3 de 4 / 0 de 4** | 3 / 0 | = cookies, **21 días** |
| Visitas, registros, usuarios | **sin datos** | sin datos | = **quince informes** |

Lo de antes (24-11):

| Métrica | Valor | Anterior (19-11) | Tendencia |
|---|---|---|---|
| **Puertas de lanzamiento** | **1 ✅ · 4 🟡 · 1 🔴 · 1 ⚪ · 15 ⬜** de 22 | 2 ✅ · 4 🟡 · 1 ⚪ · 15 ⬜ | ↓ **primera vez que una se CIERRA en catorce revisiones** |
| Checklist de salud | **14 ✅ · 3 🟡 · 1 🔴 · 1 ⚪ · 1 ⬜** de 20 | 15 ✅ · 3 🟡 · 1 ⚪ · 1 ⬜ | ↓ |
| **Días que Kairo lleva sin contestar a un desconocido** | **4** | 0 | ↓ **lo más grave del periodo** |
| **Commits suyos en `main`** | **2 en 5 días**, los dos del 19-11 | 19 en 3 días | ↓ **0 en los últimos 4 días y 7 h** |
| Commits de agentes | **5 en 5 días**, 2 al producto | 10 en 3 días, 6 al producto | ↓ |
| Rama sin fusionar | **153 commits, 24 días** | 149, 19 días | ↓ |
| **El reloj, toques al día** | **3,29** (últimos 7 días), con el cron pidiendo 72 | sin medir | ↓ **nuevo** |
| **Huecos del reloj > 8 h** | **16 en 38 días, 12 en los últimos 14**, peor 11,9 h | sin medir | ↓ **nuevo** |
| Archivos vigilados por el verificador de cifras | **14** | 4 | ↑ |
| Visitas, registros, usuarios | **sin datos** | sin datos | = **catorce informes** |

Lo de antes (19-11):

| Métrica | Valor | Anterior (16-11) | Tendencia |
|---|---|---|---|
| **Puertas de lanzamiento** | **2 ✅ · 4 🟡 · 1 ⚪ · 15 ⬜** de 22 | igual, símbolo por símbolo | = **quince días sin abrirse ninguna** |
| Checklist de salud | **15 ✅ · 3 🟡 · 1 ⚪ · 1 ⬜** de 20 | igual | = |
| Documentos legales escritos / **publicados** | **3 de 4 / 0 de 4** | 3 / 0 | = la política de cookies lleva **15 días** escrita y sin publicar |
| **Producción, vista de verdad** | **sí, hoy 06:13**: `revisar.yml` 47 (200, "TODO CORRECTO") y `probar-portada` 17 | sí, el 16-11 | ↑ **décimo día seguido** |
| **Señales de salud que ya no se pueden ver** | **3**, desde el 16-11, con la causa encontrada el 19-11 | 0 | ↓ nuevo |
| Commits de agentes en 3 días | **10**, de los que **6 tocan el producto** | 8 | ↑ |
| **Commits suyos en `main` en 3 días** | **19** | 33 | ↓ |
| **Camino de una búsqueda a una respuesta** | **existe**, en las tres páginas de papeles | no existía | ↑ lo mejor de estos tres días |
| Banco de pruebas | 25 / 28, y sus tres suspensos ya arreglados | 25 / 28 | = la nota la pone la próxima área 5 |
| Visitas, registros, usuarios | **sin datos** | sin datos | = trece informes |
## Veredicto de la última revisión

**El retroceso de ayer está deshecho y lo más viejo del backlog está cerrado. Lo
que queda es una sola acción, y hoy además su propio arreglo de anoche depende
de ella.** Volvió tras cinco días y cerró cuatro cosas; los agentes dejaron la
fusión sin conflictos. Y apareció lo que nadie buscaba: su FAQ veraz de
`/precios` manda a una política de privacidad que en producción no existe,
porque lleva doce días escrita en esta rama.

Lo de antes (24-11):

**Por primera vez en catorce revisiones, Kairo ha ido hacia atrás: una puerta de
lanzamiento que estaba abierta se ha cerrado.** El 19-11 las puertas estaban en
2 de 22; hoy en 1 de 22, y no porque haya cambiado el criterio: la que medía que
un desconocido llega a su primera respuesta estaba en ✅ desde el 07-11 y lleva
cuatro días en 🔴. Kairo responde la página y no responde la pregunta. Lo que lo
arregla —cuota de Gemini u OpenRouter— solo lo puede hacer él, y lleva cuatro
días sin tocar nada.

Lo de antes (19-11):

**Kairo se contradice a sí misma en dos documentos publicados, y lo ha hecho hoy
al decir la verdad.** La política de privacidad publicada esta mañana dice que
**no se puede afirmar** que lo que mandas no se use para entrenar modelos
—porque en la capa gratuita de la API de Gemini la tabla del proveedor marca
*"usado para mejorar nuestros productos"* como **sí**—. Y `/precios` lleva ocho
días diciendo *"No. Ni las tuyas ni las de nadie."*

Hasta hoy eso era una línea pendiente. Desde hoy es una **contradicción
publicada** entre dos páginas de Kairo, las dos sobre datos personales.

La segunda frase que bloquea es la de la portada: promete **Claude y GPT** y
ninguno de los dos está en la cadena desde el 11-11.

**Y lo que no es el motivo del rojo**: el producto está mejor que nunca —26
commits suyos en tres días, dos P1 nuestros de 10 y 17 días cerrados por él— y
el sistema también: cuatro días sin perder un turno y el verificador cubriendo
ya tres capas. Lo que no se mueve son **las puertas de lanzamiento**: las mismas
19 del 04-11, con 13 sin mirar.
