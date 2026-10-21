# Qué se guarda de lo que le mandas a Kairo

**Última revisión**: 2026-10-21
**Cómo se ha hecho**: leyendo el código que guarda, no la política de
privacidad. Cada afirmación lleva el archivo y la línea donde se comprueba.
**Cuándo revisarlo**: cuando cambie `api/paperwork/route.ts`, `api/chat/route.ts`
o las tablas de Supabase. Y en cuanto el dueño conteste la pregunta del final.

Esto existe porque es **la pregunta que va a hacer todo el mundo**. Kairo lee
multas, cartas de Hacienda y contratos: papeles con el nombre, la dirección y
el DNI de alguien. "¿Y esto dónde acaba?" no es una pregunta de curiosos, es la
que decide si suben el papel o no.

## Paperwork: lo que se guarda y lo que no

Verificado en `kairo/src/app/api/paperwork/route.ts:94-108`.

**Sí se guarda**, en la tabla `papeles`, atado al perfil de esa persona:

- El título, el remitente, de qué va, qué quieren, el importe, la fecha límite,
  las consecuencias, los pasos y el borrador. O sea: **lo que Kairo leyó**.
- El **nombre** del archivo (`archivo: archivos.nombres.join(", ")`), recortado
  a 300 caracteres.

**No se guarda el archivo.** La foto o el PDF viajan en la petición al modelo y
**no se escriben en ninguna tabla**: en ese `insert` no hay ninguna columna con
el contenido del fichero. Esto es un hecho del código, no una promesa de una
página: quien quiera comprobarlo mira esas líneas.

**Se puede borrar.** Hay un `DELETE` que borra el papel guardado
(`route.ts:160`). Lo que no vuelve es lo que ya se mandó al modelo, como en
cualquier sitio.

## El chat

Verificado en `kairo/src/app/api/chat/route.ts`.

- **Las conversaciones y los mensajes sí se guardan** (tablas `conversaciones`
  y `mensajes`, líneas 171-205). Es lo que hace que puedas volver a una
  conversación de ayer.
- **La memoria no se llena sola.** En `recuerdos` (líneas 354-355) solo entra
  lo que la persona ha pedido que se recuerde. Kairo no va apuntando cosas por
  su cuenta.

## Qué puede decir Kairo si le preguntan

En este orden, y sin adornarlo:

1. **De tu papel se guarda lo que he leído y el nombre del archivo. El archivo
   en sí no se guarda.**
2. **Las conversaciones sí se guardan**, para que puedas volver a ellas.
3. **De memoria solo guardo lo que me pides que recuerde.**
4. **Y puedes borrar un papel guardado cuando quieras.**

Si preguntan algo que no está en esta lista —cuánto tiempo se conserva, si hay
copias de seguridad, quién puede verlo por dentro, si se cifra—, la respuesta
es **"no lo sé"** y manda a los textos legales. Ninguno de esos datos consta en
el repositorio hoy: lo he mirado.

## Qué NO puede decir Kairo, y es lo importante de este archivo

**No puede afirmar que lo que le mandas no se usa para entrenar modelos.**

- La página `/precios` sí lo afirma: *"¿Se usan mis conversaciones para entrenar
  modelos? **No**"* (`kairo/src/app/precios/page.tsx:26-27` y `48-49`).
- Pero Kairo funciona hoy **con un solo motor, Gemini**, y en la **capa gratuita
  de la API de Gemini los datos pueden usarse para mejorar los productos de
  Google**; en la de pago, no. Está en el informe de mercado del 20-10 con su
  fuente.
- **Y nadie ha comprobado todavía en qué capa está la cuenta** `(sin
  confirmar)`. Es el P1 abierto del 20-10.

Así que, mientras eso no se confirme, si alguien le pregunta a Kairo si se
entrena con sus datos, lo honesto es: **"lo que se guarda es esto y esto; sobre
el entrenamiento, lo que dice la página de precios, y si te importa de verdad,
pregúntaselo a quien lleva Kairo"**. Repetir el "No" de la página sería que la
IA respalde una promesa que nadie ha verificado, y eso es exactamente el fallo
que más caro sale: el usuario se queda convencido por boca de Kairo.

**Esto no es desconfianza del producto, es orden**: el día que el dueño
confirme que la cuenta es de pago, este apartado se borra y Kairo puede decir
"No" con todas las letras. Hasta entonces, no.

## Lo que falta y solo puede contestar el dueño

1. **¿La cuenta de Gemini es de pago o gratuita?** Un minuto en Google AI
   Studio: si el proyecto tiene facturación activada, es de pago. De esto
   depende si la FAQ de `/precios` es verdad.
2. **¿Cuánto tiempo se conservan los papeles y las conversaciones?** Hoy no hay
   ningún borrado automático en el código: lo que se guarda, se queda.
3. **¿Los textos legales mencionan a los proveedores de IA?** Mirado hoy:
   `/legal` no dice nada de entrenamiento ni de proveedores.
