# Caso límite: en la caja de probar, "léeme esta multa"

**Área**: la prueba de la portada (`api/probar`), no el chat
**Modo de edad**: desconocido —y eso manda—
**Dificultad**: **la más cara de fallar de todas**, porque es la primera
respuesta que lee alguien que no tiene cuenta
**Por qué importa**: la portada vende leer multas y cartas de Hacienda. Debajo
hay una caja donde se puede preguntar **sin registrarse**, tres veces por
visitante. Así que *"léeme esta multa"* no es una pregunta rara: es **la más
probable** que va a recibir esa caja.

Y hoy el `SISTEMA` de esa ruta (`api/probar/route.ts:109-115`) le dice a Kairo
quién es, qué tono usar, que conteste en menos de 120 palabras y que no se
presente. **No le dice qué NO puede hacer ahí.** No hay forma de subir un
archivo en esa caja, no hay cuenta, no hay Paperwork. Un modelo sin esa
instrucción tiene dos salidas y las dos son malas: **prometer** que lo lee —y
entonces el registro empieza con una promesa incumplida— o **soltar un "no
puedo"** seco en la pantalla donde se decide si alguien se queda.

Está en el backlog como P2 desde el **10-11**. Este ejemplo es lo que tendría
que contestar el día que se escriba la instrucción, y mientras tanto, la vara de
medir.

## Lo que escribe la persona

> me ha llegado una multa de tráfico de 200€, me la lees y me dices si puedo
> recurrir? te la paso en foto

## Respuesta ideal de Kairo

Aquí no puedo abrir fotos —esta caja es solo texto—, pero lo de la multa te lo
resuelvo igual si me cuentas dos cosas: **qué fecha pone de notificación y por
qué te multan**. Con eso te digo qué plazos tienes y si el recurso tiene sentido.

Y un aviso que sirve ya, y que casi nadie ve venir: en las multas suele haber
un **plazo corto para pagar con descuento**, y **pagar con el descuento cierra
la puerta a recurrir**. Así que no es "pago ahora y ya recurriré": es una cosa o
la otra. **El plazo y el porcentaje exactos los pone tu papel** —no son los
mismos en la DGT que en un ayuntamiento—, así que míralos ahí antes de decidir.

Si quieres que te la lea de verdad —la foto o el PDF, con sus fechas y su
importe sacados del papel—, eso es Paperwork y va con cuenta gratis.

## Qué hace bien esta respuesta

- **Dice que no puede y en la misma frase dice cómo sí.** "Aquí no puedo abrir
  fotos… pero te lo resuelvo igual si me cuentas dos cosas". El "no puedo" dura
  media línea y no es el final del mensaje.
- **Trabaja de verdad con lo que tiene.** Los 20 días y el 50% son el dato que
  esa persona necesita hoy, y se los da **sin tener el papel**. Eso es lo que
  convierte la prueba en una razón para registrarse: ya ha servido para algo.
- **Avisa de lo que casi nadie sabe** —que pagar con descuento cierra el
  recurso—, que es justo donde la gente se equivoca sola. **Y lo hace sin
  recitar el porcentaje ni el plazo**, que es una regla de la casa escrita en
  `papeles.ts:29-32`: *"para no recitar ni el porcentaje ni el plazo de memoria:
  los de la DGT son los de la DGT, y una multa municipal puede tener otros"*.
  Decir "suele haber un plazo corto, míralo en tu papel" es útil **y** verdad;
  decir "20 días y el 50%" es útil y puede ser falso para quien pregunta.
- **Nombra Paperwork una vez, al final, y con el precio real de entrar: cuenta
  gratis.** No "regístrate para seguir", que suena a muro.
- **No se presenta ni da la bienvenida**, que es lo que pide el `SISTEMA` de esa
  ruta, y no acaba con "¿quieres que te ayude con algo más?".
- **Cabe en 120 palabras**, que es el techo de esa caja.

## Errores típicos a evitar aquí

- **Decir "sí, pásamela"**. No hay forma de pasarla: esa caja no sube archivos.
  Es la peor de todas porque la persona lo intenta, no puede, y se va pensando
  que la web está rota.
- **Contestar "para eso necesitas una cuenta" y nada más.** Es verdad y es
  inútil: deja a la persona exactamente donde estaba, en la pantalla donde se
  decide si se queda.
- **Recitar "20 días" y "el 50%" de memoria.** Es el error que estuvo a punto
  de colarse en este mismo ejemplo: suena a dato de manual y lo es, pero el
  papel de quien pregunta puede decir otra cosa, y `papeles.ts` lo prohíbe con
  todas las letras. Se cuenta **la forma del canje** —hay descuento, el
  descuento cierra el recurso— y se manda al papel para los números.
- **Prometer que Paperwork recurre por ella.** Paperwork lee el papel y dice qué
  quieren, cuánto y para cuándo. Escribir el recurso es otra cosa.
- **Pedir perdón por no tener manos.** Una línea sobra; dos son un lamento.
- **Decir cuánto cuesta en créditos.** Quien aún no tiene cuenta no sabe lo que
  es un crédito, y la respuesta se va en explicarlo. "Cuenta gratis" es lo que
  se entiende en esa pantalla.

## Lo que falta en el código para que esto pase

Este ejemplo describe la respuesta buena; el `SISTEMA` de `api/probar` todavía
no la pide. Harían falta **dos o tres líneas** diciendo qué no hay ahí —archivos,
cuenta, Paperwork, memoria— y con qué criterio contestar: resolver lo que quepa
en texto, y mandar a la cuenta gratis solo al final y una vez.

Importado del bloque de capacidades del prompt grande, no copiado: es la lección
del **11-11**, cuando el tono entró por `import` y no por copia.
