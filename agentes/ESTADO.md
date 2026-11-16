# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-11-16 ([informe](informes/2026-11-16-estado.md)),
la duodécima
**Semáforo general**: 🔴 **undécimo rojo, y por primera vez no por algo mal escrito sino por algo bien escrito y sin publicar: hay tres documentos legales terminados y CERO publicados, y la web viva acepta cuentas y papeles sin una política de privacidad que se pueda leer**
Lo de antes: 🔴 décimo rojo, por la contradicción entre `/precios` y la política de privacidad (sigue en pie, diez días)

> **Lo que ha cambiado de verdad**: han sido los tres días más productivos de
> este sistema —el tercer documento legal escrito, el fallo que le daba a un
> niño una tabla de precios arreglado el mismo día que se supo por qué, el banco
> de pruebas puntuado entero por primera vez desde el 23-10 y 33 commits suyos
> en `main`— **y Kairo está exactamente igual de lejos del lanzamiento que hace
> doce días**: las puertas siguen en **2 de 22**. El trabajo está hecho y no
> llega a la web.
>
> Lo de antes (13-11): el producto y el sistema mejor que nunca, y lo que
> bloqueaba eran dos frases publicadas que no son verdad. Siguen ahí.

## Métricas

| Métrica | Valor | Anterior (13-11) | Tendencia |
|---|---|---|---|
| **Documentos legales escritos** | **3 de 4**: cookies, privacidad y **términos (15-11)** | 2 de 4 | ↑ |
| **Documentos legales PUBLICADOS** | **0 de 4.** En `main`, `app/legal/` tiene un solo archivo y dice "Pendiente de redactar" | 0 de 4, *pero nadie lo había medido* | **= y es el hallazgo del 16-11** |
| **Puertas de lanzamiento** | **2 ✅ · 4 🟡 · 1 ⚪ · 15 ⬜** de 22 | 2 ✅ · 3 🟡 · 1 ⚪ · 16 ⬜ | = **ninguna abierta en doce días** |
| Checklist de salud | **15 ✅ · 3 🟡 · 1 ⚪ · 1 ⬜** de 20 | 16 ✅ · 2 🟡 · 1 ⚪ · 1 ⬜ | ↓ por el medio día de agentes perdido el 14 |
| **Banco de pruebas** | **25 / 28**, los catorce casos puntuados el 16-11 | sin puntuar desde el 23-10 | = en total, ↑ en método |
| **Producción, vista de verdad** | **sí, hoy 06:14**: `revisar.yml` 43 (200, "TODO CORRECTO") y `probar-portada` 14, cinco pasos | sí, el 13-11 | ↑ **siete días seguidos** |
| **Commits suyos en `main` en 3 días** | **33** | 26 | ↑ |
| Entregas de agentes en 3 días | **8 commits**, con un día perdido (el 14) | 5 | ↑ |
| Visitas, registros, usuarios | **sin datos** | sin datos | = falta analítica; decisión suya |

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
