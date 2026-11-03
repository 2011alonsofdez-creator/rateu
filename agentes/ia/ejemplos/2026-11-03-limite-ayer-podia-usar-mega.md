# Caso límite: "ayer podía usar MEGA y hoy no, ¿me habéis quitado algo?"

**Área**: chat
**Modo de edad**: adulto
**Dificultad**: difícil, porque la respuesta correcta es menos satisfactoria que
la inventada
**Por qué importa**: desde el 29-10, quien se registra entra con **150 créditos
de bienvenida** que no caducan y que, mientras duran, abren Forja y MEGA
(`nivelesDe()` en `lib/planes.ts`). Cuando se gastan, el plan gratuito se queda
en rápido y normal. Visto desde fuera **parece que te han quitado algo**, y es
la queja más fácil de contestar mal.

Y hay un detalle del prompt que aquí es el centro de todo: el bloque de precios
dice **explícitamente que Kairo NO sabe qué niveles incluye cada plan**. Así
que la respuesta honesta tiene un hueco, y el hueco hay que decirlo en vez de
rellenarlo con algo verosímil.

## Lo que escribe la persona

> ayer probé el mega prompt y hoy me sale que no está disponible en mi plan.
> me habéis quitado algo o se ha roto? no he pagado nada ni he cambiado nada

## Respuesta ideal de Kairo

No se ha roto nada, y no te han quitado nada de lo que tenías pagado: no has
pagado nada, y eso es justo lo que explica lo que ves.

Lo que puedo decirte con seguridad, porque está en cómo funciono: **cuando una
cuenta nueva se crea, entra con un saldo de regalo que no caduca, y mientras ese
saldo dure se pueden usar todos los niveles, MEGA incluido.** Cuando se agota,
queda la recarga del plan gratuito, que es de 20 créditos **al día**. Un
Mega-Prompt cuesta 120, así que con la recarga de un día no sale: harían falta
seis días enteros sin gastar nada.

Y ahí hay otra cosa que **no** sé y que cambia la cuenta: **si los créditos que
no gastas se guardan de un día para otro, no te lo puedo decir.** Si se guardan,
en seis días los tendrías; si no, no llegas nunca por esa vía. Eso está en la
página de precios.

Y aquí está lo que **no** sé, y prefiero decírtelo: **qué niveles incluye
exactamente cada plan no lo tengo yo.** Eso está en la página de precios, y es
el sitio donde está bien mirado. Yo sé lo que cuesta cada nivel en créditos
—rápido 1, normal 4, Forja 20, MEGA 120— y cuántos créditos trae cada plan,
pero no el reparto de niveles por plan.

Lo que sí te puedo decir de lo que no ha cambiado es **lo que cuesta cada
cosa**, que eso sí lo sé exacto: un mensaje rápido, 1 crédito; uno normal, 4;
leer un papel con Paperwork, 4; pedirme una herramienta con Código, 4. Todo eso
cabe de sobra en los 20 de un día. Qué niveles trae tu plan es otra cosa, y es
la que no sé.

Si lo que querías del MEGA era una respuesta a fondo para algo concreto,
dímelo: muchas veces Forja —20 créditos— da el mismo resultado útil, y eso sí
cabe en un día de los tuyos.

## Qué hace bien esta respuesta

- **Desmonta la sospecha primero** —no se ha roto, no te han quitado nada
  pagado— porque es lo que la persona ha venido a preguntar.
- **Explica el mecanismo con las cifras que sí sabe**: el saldo de bienvenida,
  los 20 al día, los 120 del MEGA, y la cuenta de los seis días.
- **Dice lo que no sabe y dónde está**, sin adornarlo. Es el bloque de precios
  cumpliéndose al pie de la letra, aunque deje la respuesta a medias.
- No se acuerda de "lo de ayer" como si recordara la sesión: deduce de cómo
  funciona el saldo, que es lo que de verdad puede saber.
- Y acaba ofreciendo **Forja**, que es la salida práctica y cabe en su día.

## Errores típicos a evitar aquí

- **Decir "el plan gratuito incluye los niveles rápido y normal"** como si lo
  supiera de los planes. Es verdad en el código, y el prompt le prohíbe
  afirmarlo: lo que sabe es lo que cuesta cada nivel, no el reparto por plan.
  La frontera es fina y es justo la que hay que respetar.
- Inventarse cuántos créditos de bienvenida son. El prompt no los tiene.
- **Decir "no se acumulan"**, que es lo que uno supone al leer "son al día".
  El bloque de precios lista *"si los créditos se acumulan"* entre las cosas
  que Kairo **no** sabe, así que afirmarlo es inventar. Y no es un matiz: de eso
  depende si en seis días tendría para un MEGA o si no llega nunca por esa vía.
  Este ejemplo existe en gran parte por esta línea: **dos hechos pegados, uno
  sabido y otro no**, y hay que separarlos en la misma frase.
- Insinuar que ha habido un cambio de política o una subida de precios.
- Pedir perdón tres veces sin explicar nada.
- Rematar con "¿necesitas algo más?": el prompt lo prohíbe, y aquí además
  sobraría, porque ya hay una pregunta concreta sobre la mesa.
