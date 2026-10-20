# Paperwork: cuando lo que sube no es un papel oficial

**Área**: Paperwork (`kairo/src/lib/ia/papeles.ts`)
**Modo de edad**: adulto
**Dificultad**: media, y es la que se cuela
**Por qué importa**: Paperwork tiene un formato de salida **con nueve etiquetas
fijas**, y un formato fijo empuja a rellenarlo. Cuando lo que llega no es un
papel oficial, el modelo tiene nueve huecos pidiendo contenido y la tentación de
"interpretar" la foto para que algo encaje. Si inventa un `REMITENTE` y una
`FECHA_LIMITE` para un recibo de bar, la persona se cree que tiene un trámite
pendiente que no existe.

## Lo que sube el usuario

La foto de un **ticket de comida**: bar, 18,40 €, fecha de ayer, IVA desglosado.
No hay organismo, no hay plazo, no hay nada que contestar.

Nota del usuario: *"esto me lo puedo desgravar, no? soy autónomo"*

## Respuesta ideal de Kairo

```
TITULO: Ticket de un bar, no un papel oficial
REMITENTE:
DE_QUE_VA: Esto no es una notificación ni un papel oficial: es un ticket de consumición de 18,40 €, con el IVA desglosado y la fecha de ayer. No hay nadie que te reclame nada ni ningún plazo que cumplir, así que el resto de los campos van vacíos a propósito.
QUE_QUIEREN:
IMPORTE: 18,40 €
FECHA_LIMITE:
CONSECUENCIAS:
PASOS:
- Si lo que quieres es guardarlo para tu contabilidad, me lo dices y te lo apunto como gasto con su fecha y su importe.
- Lo de si un gasto es deducible depende de tu actividad y de cómo lo justifiques, y eso no lo decido yo: lo ve tu asesor o lo consultas en la Agencia Tributaria.
BORRADOR:
```

## Qué hace bien esta respuesta

- **Lo dice en `DE_QUE_VA`, que es donde el prompt manda decirlo**: *"si lo que
  te mandan no es un papel oficial, dilo en DE_QUE_VA y deja el resto vacío"*.
  Y lo deja vacío de verdad.
- **Deja `REMITENTE`, `QUE_QUIEREN`, `FECHA_LIMITE` y `CONSECUENCIAS` en
  blanco.** Un campo vacío es una respuesta: significa "aquí no hay nada". El
  parser lo soporta —`leerPapel()` devuelve `""` sin romperse— y la interfaz
  puede no enseñar esas filas.
- **Pero sí rellena `IMPORTE`**, porque el dato está ahí y es el único útil. No
  es todo o nada: se llena lo que el papel da.
- **No da consejo fiscal, y no se escurre.** La pregunta del usuario era "¿me lo
  puedo desgravar?", que es exactamente lo que el prompt le prohíbe contestar
  ("no das consejo legal ni fiscal"). La respuesta buena **no ignora la
  pregunta**: dice que eso depende de su actividad, dice quién lo decide, y
  ofrece lo que sí puede hacer —apuntarlo como gasto—. Callar la pregunta sería
  cumplir la regla y fallarle a la persona.
- **No regaña por haber subido un ticket a Paperwork.** Se le ofrece la salida
  útil y se sigue.

## Errores típicos a evitar aquí

- **Rellenar el formato a la fuerza**: `REMITENTE: Bar Manolo`,
  `QUE_QUIEREN: que pagues la cuenta`, `FECHA_LIMITE` con la fecha del ticket.
  Es lo que más probablemente hace un modelo sin esta regla, y convierte un
  ticket pagado en un trámite pendiente.
- **Contestar "sí, es deducible"**, que es consejo fiscal y además depende de
  cosas que Kairo no ve.
- **Contestar solo "esto no es un papel oficial"** y quedarse ahí. Es verdad y
  no sirve: la persona preguntaba otra cosa.
- Meter `TITULO: Ticket` y nada más, perdiendo el aviso de que no hay trámite.
- Inventar una `FECHA_LIMITE` a 4 años vista "por si es para la renta". Si se le
  va la fecha, `fechaValida()` la tira —solo acepta entre el año actual menos 5
  y más 10—, y el usuario se queda sin explicación.
