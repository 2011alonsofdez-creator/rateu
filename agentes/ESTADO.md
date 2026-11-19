# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-11-19 ([informe](informes/2026-11-19-estado.md)),
la decimotercera
**Semáforo general**: 🔴 **duodécimo rojo, y el motivo ya no se puede decir más corto: no falta trabajo, falta él. Todo lo que los agentes pueden tocar se está arreglando; todo lo que necesita una decisión suya está congelado, y lo más viejo lleva diecinueve días**
Lo de antes: 🔴 undécimo rojo, por tres documentos legales terminados y cero publicados (sigue igual, quince días la política de cookies)

> **Lo que ha cambiado de verdad**: en tres días, **10 commits de agentes —6 de
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
