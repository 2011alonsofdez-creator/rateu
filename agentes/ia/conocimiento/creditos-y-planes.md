# Créditos y planes de Kairo

**Última revisión**: 2026-11-06 · Revisar cuando cambien `kairo/src/lib/ia/config.ts`
o `kairo/src/lib/planes.ts`, y antes de encender la tienda de pagos.

**El 05-11 el dueño dobló la escala entera y este archivo tardó un día en
enterarse.** Es la segunda vez en tres días que pasa lo mismo —el 04-11 decía 15
donde había 20— y la causa es la de siempre: **aquí los números están escritos a
mano y en el código están interpolados.** Así que la línea de arriba, "revisar
cuando cambien", no basta: nadie la lee a tiempo. Lo que sí funciona es lo que
hizo el guardián hoy, y queda dicho aquí para que se repita: **cuando el dueño
toque `planes.ts` o `config.ts`, se revisa este archivo en el mismo turno.**

**Este archivo no llega a Kairo.** Es la referencia de los agentes. Lo que Kairo
sabe es lo que está escrito en `kairo/src/lib/ia/prompt.ts`; corregir un número
aquí no cambia ni una respuesta. Se descubrió el 23-10 y cuesta repetirlo.

Frases cortas y verificables, pensadas para que las lea la IA. **El código manda
sobre la especificación**: lo que cobra Kairo es lo que está en el código, no lo
que diga un documento.

## Cuánto cuesta cada cosa, en créditos

Confirmado en **`kairo/src/lib/planes.ts`** (la constante `CREDITOS_NIVEL`), que
desde el 05-11 es el único sitio donde vive el precio: `config.ts` ya solo
reexporta (`export const CREDITOS = CREDITOS_NIVEL`), y eso lo arregla el dueño
a propósito —antes estaba escrito dos veces, una en cada lado—.

**Era 1 / 4 / 20 / 120 hasta el 05-11.** Se multiplicó por dos, y los planes
también, así que **con la misma suscripción salen exactamente las mismas
preguntas que antes**: lo único que cambia es que los números suenan a más. La
proporción, que es lo que dice algo real, no se ha tocado: un Forja son veinte
rápidos y un MEGA son seis Forjas.

| Acción | Créditos |
|---|---|
| Mensaje rápido (nivel Rápido) | 2 |
| Mensaje normal | 8 |
| Forja (razonamiento a fondo) | 40 |
| Mega-Prompt | 240 |
| Leer un papel con Paperwork | 8 (cobra como un mensaje normal) |
| Un Co-Work ejecutado | 8 (cobra como un mensaje normal) |
| Una app con Código | 8, **y cada arreglo otros 8**: se escribe otra vez |

Generar imágenes: **no hay coste definido en el código** (sin confirmar). La
especificación dice 20 créditos, pero no se ha encontrado dónde se cobra, así
que Kairo no debe afirmar ese número.

## Cuántos créditos trae cada plan

Confirmado en `kairo/src/lib/planes.ts` (`CREDITOS_PLAN` y `NOMBRE_PLAN`).

| Plan | Se llama | Créditos |
|---|---|---|
| `free` | Free | 40 al día |
| `plus` | Kairo+ | 2.000 al mes |
| `supreme` | Supreme | 6.000 al mes |

Lo que da de sí el plan de 2.000: **1.000 mensajes rápidos, o 250 normales, o 50
Forja, o 8 Mega-Prompts**. Son los mismos créditos: se gastan en lo que se use.
**Y fíjate en que esas cuatro cuentas son las de antes**: al doblarse los dos
lados a la vez, lo que cabe en un plan no se movió ni una pregunta.

Con 40 al día, el plan Free da para 20 mensajes rápidos, o 5 normales —o sea
cinco apps con Código, o un papel y unas preguntas—. **Las mismas de antes**, por
lo mismo. Un Mega-Prompt cuesta 240, así que con la recarga de un día no sale.

**Historia de esta cifra, que es corta y dice mucho**: 15 hasta el 29-10, 20
hasta el 05-11, y 40 desde entonces. El 40 está en `planes.ts` y en la migración
`0020_escala_x2.sql` (el `default` de la columna y la función de recarga). Que
las migraciones se hayan ejecutado en Supabase **no es comprobable desde aquí**
(hace falta la cuenta), así que eso es ⚪, no verde.

### El regalo de bienvenida, que es lo que de verdad tiene una cuenta nueva

Quien se registra entra además con **300 créditos de regalo**, una sola vez
(eran 150 hasta el 05-11).
Cuatro hechos del código, cada uno con su sitio:

- Van a `creditos_extra` (`0020_escala_x2.sql:69`, un `default` de la columna:
  solo cuentas nuevas, a quien ya estaba no se le toca el saldo).
- **La recarga diaria no los pisa**: `recargar_creditos_free()` solo escribe
  `creditos`, nunca `creditos_extra`.
- **Se gastan los últimos**: `gastar_creditos()` tira primero del saldo del plan
  y solo después del extra (`0001_esquema.sql:186-187`). Por eso el regalo dura
  hasta que se acaba, en vez de evaporarse el primer día.
- **Mientras quede algo, el plan gratuito tiene los cuatro niveles**, MEGA
  incluido: `nivelesDe(plan, creditosExtra)` devuelve los cuatro si
  `plan === "free"` y `creditosExtra > 0` (`planes.ts:65-73`). Cuando llega a
  cero, vuelve a `NIVELES_POR_PLAN.free`, que es rápido y normal
  (`planes.ts:45`).

La cuenta del primer día, hecha con el orden de gasto real: 40 + 300 = 340. Un
MEGA se come los 40 del día y 200 del regalo, y **quedan 100**. No dan para un
segundo MEGA, sí para **dos Forja** y sobran 20.

**Y un detalle del código que anoto por si alguien hace la resta**: el comentario
de `nivelesDe()` sigue diciendo que el regalo da para un MEGA *"y que sobren
treinta"*. Con la escala nueva sobran **sesenta** (300 − 240): la frase se quedó
de cuando eran 150 y 120. Es un comentario, no el comportamiento, y `planes.ts`
está en lo que ningún agente toca (apartado 5 del protocolo), así que **se
reporta y no se arregla**.

Y el límite de este archivo, otra vez, porque aquí es donde pica: **de este
apartado Kairo no puede decir nada**. Los créditos por plan sí los sabe —el
prompt interpola `CREDITOS_PLAN`—, pero ni los 150 del regalo ni qué niveles
trae cada plan: el bloque de precios los lista entre lo que NO sabe
(`prompt.ts:302-304`). El caso de
`ejemplos/2026-11-03-limite-ayer-podia-usar-mega.md` es exactamente esa
frontera, y sigue siendo la respuesta correcta.

## Precios

**(Sin confirmar en el código.)** Estas cifras salen de
`docs/kairo/ESPECIFICACION.md` sección 3, no del código, y la tienda de pagos no
consta encendida. Kairo puede darlas diciendo que las confirme en la página de
precios, y **nunca debe presentarlas como un cobro en firme**.

- Kairo+: 9,99 €/mes · 99 €/año (sin confirmar)
- Supreme: 24,99 €/mes · 249 €/año (sin confirmar)
- Packs de créditos extra: 500 por 5,99 € · 2.000 por 19,99 € (sin confirmar)
- Los créditos comprados no caducan; los del plan se renuevan cada mes y no se
  acumulan (sin confirmar)

## Qué sabe hacer Kairo

Confirmado por las rutas que existen en `kairo/src/app`:

- **Chat** con cuatro niveles de esfuerzo: Rápido, Normal, Forja y MEGA.
- **Co-Works**: encargos que se ejecutan solos a una hora fija.
- **Paperwork**: lee un papel oficial y dice qué quieren, cuánto y para cuándo.
- **Gist**: resume un vídeo o una página.
- **Mentes**: asistentes personalizados con instrucciones propias.
- **Memoria**: recuerda cosas de una conversación a otra.
- **Conectores** y **Team**: existen como sección de la aplicación.
- Busca en internet cuando la respuesta depende de algo que cambia.
- Entiende archivos adjuntos: PDF, Word, Excel e imágenes.

## Qué NO debe decir Kairo nunca

- **Qué modelo o proveedor hay por detrás.** "Soy Kairo. Uso varios motores y
  elijo el mejor para cada tarea."
- **Un precio, un límite o una condición que no esté arriba.** Si se lo
  preguntan y no está, se dice que no lo sabe y se manda a la página de precios
  o a los ajustes de la cuenta. Un dato comercial inventado se descubre pagando.
- **Que un plan incluye algo** sin que esté confirmado arriba. Ahora mismo no
  hay confirmación de los topes por plan de Mega-Prompts al mes, conectores,
  Mentes, tamaño de archivo ni días de historial.
- **Que el Mega-Prompt siempre da la mejor respuesta.** Es más caro, no
  infalible.

## Lo que choca entre el documento y el código

Tres cosas, y las tres tocan dinero. Hasta que el dueño decida, **Kairo se
calla sobre ellas** y el agente no toca nada.

| Qué | La especificación dice | El código hace |
|---|---|---|
| Niveles de Kairo+ | Rápido + Estándar; Máximo y Mega-Prompt solo en Supreme | `plus` y `supreme` tienen los cuatro, MEGA incluido (`planes.ts:46-47`) |
| Un Co-Work ejecutado | 40 créditos | **8**, y con un comentario que lo justifica: "lo mismo que un mensaje normal: es uno" |
| Analizar un documento | 15 créditos | **8**, el precio de un mensaje normal |

Que el código cobre menos no es un descuido: en los dos últimos casos está
escrito a propósito. Pero la cuenta de la especificación —el margen mínimo
garantizado— está hecha con 40 y con 15, así que o se corrige el documento o se
corrigen los precios, y eso lo decide el dueño.

**Y el 05-11 la distancia se acortó sola**: al doblarse la escala, el documento
pedía 40 por un Co-Work y el código pasó de 4 a **8**; por un documento, el
documento pedía 15 y el código pasó de 4 a **8**. Sigue cobrando menos de lo que
dice la especificación, pero ya no es cinco y diez veces menos.
