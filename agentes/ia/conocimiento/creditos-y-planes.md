# Créditos y planes de Kairo

**Última revisión**: 2026-11-04 · Revisar cuando cambien `kairo/src/lib/ia/config.ts`
o `kairo/src/lib/planes.ts`, y antes de encender la tienda de pagos.

**Este archivo no llega a Kairo.** Es la referencia de los agentes. Lo que Kairo
sabe es lo que está escrito en `kairo/src/lib/ia/prompt.ts`; corregir un número
aquí no cambia ni una respuesta. Se descubrió el 23-10 y cuesta repetirlo.

Frases cortas y verificables, pensadas para que las lea la IA. **El código manda
sobre la especificación**: lo que cobra Kairo es lo que está en el código, no lo
que diga un documento.

## Cuánto cuesta cada cosa, en créditos

Confirmado en `kairo/src/lib/ia/config.ts:183` (la constante `CREDITOS`), que es
la que usan de verdad `api/chat`, `api/paperwork` y `api/coworks`.

| Acción | Créditos |
|---|---|
| Mensaje rápido (nivel Rápido) | 1 |
| Mensaje normal | 4 |
| Forja (razonamiento a fondo) | 20 |
| Mega-Prompt | 120 |
| Leer un papel con Paperwork | 4 (cobra como un mensaje normal) |
| Un Co-Work ejecutado | 4 (cobra como un mensaje normal) |

Generar imágenes: **no hay coste definido en el código** (sin confirmar). La
especificación dice 20 créditos, pero no se ha encontrado dónde se cobra, así
que Kairo no debe afirmar ese número.

## Cuántos créditos trae cada plan

Confirmado en `kairo/src/lib/planes.ts` (`CREDITOS_PLAN` y `NOMBRE_PLAN`).

| Plan | Se llama | Créditos |
|---|---|---|
| `free` | Free | 20 al día |
| `plus` | Kairo+ | 1.000 al mes |
| `supreme` | Supreme | 3.000 al mes |

Lo que da de sí 1.000 créditos: 1.000 mensajes rápidos, o 250 normales, o 50
Forja, o 8 Mega-Prompts. Son los mismos créditos: se gastan en lo que se use.

Con 20 al día, el plan Free da para 20 mensajes rápidos, o 5 normales —o sea
cinco apps con Código, o un papel y unas preguntas—. Un Mega-Prompt cuesta 120,
así que con la recarga de un día no sale.

**Eran 15 hasta el 29-10.** El 20 está en `planes.ts:10` y en
`0019_plan_gratis.sql` (el `default` de la columna y la función de recarga). Que
la migración se haya ejecutado en Supabase **no es comprobable desde aquí**
(hace falta la cuenta), así que en producción podría seguir siendo 15: eso es ⚪,
no verde. El prompt no se enteró del cambio porque no hacía falta —interpola
`CREDITOS_PLAN`, así que dice lo que diga el código—; este archivo sí, porque
estaba escrito a mano, y ha vivido seis días diciendo 15.

### El regalo de bienvenida, que es lo que de verdad tiene una cuenta nueva

Quien se registra entra además con **150 créditos de regalo**, una sola vez.
Cuatro hechos del código, cada uno con su sitio:

- Van a `creditos_extra` (`0019_plan_gratis.sql:74`, un `default` de la columna:
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

La cuenta del primer día, hecha con el orden de gasto real: 20 + 150 = 170. Un
MEGA se come los 20 del día y 100 del regalo, y quedan 50. No dan para un
segundo MEGA, sí para dos Forja. El comentario del código dice "que sobren
treinta" porque cuenta solo el regalo; con los 20 del día son cincuenta.

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
| Un Co-Work ejecutado | 40 créditos | 4, y con un comentario que lo justifica: "lo mismo que un mensaje normal: es uno" |
| Analizar un documento | 15 créditos | 4, el precio de un mensaje normal (`api/paperwork/route.ts:73`) |

Que el código cobre menos no es un descuido: en los dos últimos casos está
escrito a propósito. Pero la cuenta de la especificación —el margen mínimo
garantizado— está hecha con 40 y con 15, así que o se corrige el documento o se
corrigen los precios, y eso lo decide el dueño.
