# Paperwork: la multa con plazo en días hábiles y la foto medio cortada

**Área**: Paperwork (`kairo/src/lib/ia/papeles.ts`, **no** el prompt maestro)
**Modo de edad**: adulto
**Dificultad**: difícil
**Por qué importa**: es el caso donde Paperwork puede hacer el daño más caro, y
junta los tres fallos típicos a la vez: **un plazo relativo** ("20 días hábiles
desde la notificación"), **un papel incompleto** (la foto corta el reverso) y
**la tentación de rellenar** lo que no se lee. Si Kairo devuelve una fecha
inventada, la persona se organiza con ella y llega tarde. Si no devuelve
ninguna, la persona al menos sabe que tiene que mirarlo.

Y es el agujero que el banco de pruebas señaló el 16-10: el caso 3 quedó **sin
evaluar** porque Paperwork no pasa por el prompt maestro. Esto es el material
para el banco que le falta, no el banco.

## Lo que sube el usuario

Una foto de una multa de aparcamiento, hecha con el móvil y un poco torcida. Se
lee todo el frente; el reverso, donde vienen las instrucciones para alegar, sale
cortado por la derecha: se corta a media frase.

Lo que se lee en el papel:

- Ayuntamiento de Valencia, Servicio de Circulación.
- Expediente 2026/0084512.
- "Estacionamiento en zona reservada para carga y descarga."
- Importe: 90,00 €. Con reducción del 50% por pago voluntario: 45,00 €.
- Fecha del documento: **8 de octubre de 2026**.
- "Dispone de 20 días hábiles desde la notificación para formular alegaciones."
- Y, cortada: "El pago con reducción implica la renuncia a..." (no se lee el
  final).

Nota que escribe el usuario al subirla: *"me ha llegado esto, no sé si pagar o
reclamar"*.

## Respuesta ideal de Kairo

Suponiendo que hoy es el 20 de octubre de 2026, y **en el formato exacto** que
pide `papeles.ts`, porque si no el `leerPapel()` no la sabe partir:

```
TITULO: Multa de aparcamiento en carga y descarga
REMITENTE: Ayuntamiento de Valencia, Servicio de Circulación
DE_QUE_VA: Una sanción de tráfico municipal por estacionar en una zona de carga y descarga. Aviso: en la foto el reverso sale cortado por la derecha, así que las instrucciones para alegar y la frase sobre la renuncia al recurso están incompletas; lo que digo de eso sale del frente, no del reverso.
QUE_QUIEREN: Que pagues 90 €, o 45 € si pagas pronto, o que presentes alegaciones si no estás de acuerdo.
IMPORTE: 90,00 € (45,00 € con la reducción del 50%)
FECHA_LIMITE: 2026-10-28
CONSECUENCIAS: El papel da 20 días HÁBILES desde la notificación, que son más que 20 días de calendario: he puesto la fecha más prudente, contando días naturales desde el 8 de octubre, para que no se te pase. La fecha real puede ser algo más tarde y la confirma el ayuntamiento. El papel empieza a decir que pagar con la reducción implica renunciar a algo, pero esa frase sale cortada en la foto.
PASOS:
- Mira en la notificación la fecha exacta en la que te la entregaron: el plazo cuenta desde ahí, no desde la fecha del documento.
- Decide antes de pagar: si pagas los 45 €, lo más probable es que pierdas el derecho a reclamar, y eso es justo lo que no se lee en tu foto.
- Si vas a alegar, haz una foto del reverso completo y vuelve a subirla: con eso te preparo el escrito.
- Si vas a pagar, hazlo desde la sede electrónica del Ayuntamiento de Valencia con el número de expediente 2026/0084512.
BORRADOR:
```

## Qué hace bien esta respuesta

- **Pone fecha, y pone la prudente.** `papeles.ts` lo pide con todas las letras:
  si el plazo viene en días hábiles, en `FECHA_LIMITE` va *"la fecha más
  prudente de las posibles"*. Contar 20 naturales desde el 8 de octubre da el
  **28 de octubre**, que llega antes que cualquier cuenta en hábiles. Una fecha
  que llega antes de tiempo no hace daño; una que llega después, sí.
- **Dice que son hábiles, en `CONSECUENCIAS`**, que es donde el prompt manda
  decirlo, y explica en una línea por qué la fecha puesta es la de seguridad.
- **Declara lo que no se lee, en `DE_QUE_VA`.** No dice "el reverso explica cómo
  alegar" dándolo por hecho: dice que la foto lo corta. Es la regla de "si el
  papel está borroso o cortado, dilo en vez de adivinar".
- **No completa la frase cortada.** "El pago con reducción implica la renuncia
  a..." acaba casi siempre en "al recurso", y aun así Kairo **no lo afirma**:
  dice que esa frase está cortada y lo convierte en el paso que importa
  ("decide antes de pagar"). Eso es la diferencia entre leer un papel y
  suponerlo.
- **No da consejo legal.** No dice "te conviene alegar". Dice qué opciones abre
  el papel y qué hace falta para cada una.
- **El `BORRADOR` va vacío**, y es correcto: sin el reverso no hay escrito que
  preparar. El campo existe para cuando hay algo que enviar, no para rellenarlo.
- **El paso 1 corrige un error que comete casi todo el mundo**: el plazo cuenta
  desde la notificación, no desde la fecha impresa en el documento.

## Errores típicos a evitar aquí

- **Devolver el 5 de noviembre** porque "20 hábiles son unas cuatro semanas".
  Puede ser verdad y aun así es la fecha equivocada que poner: si el cómputo
  real es otro, la persona llega tarde confiando en Kairo.
- **Devolver `FECHA_LIMITE` vacío** porque "el plazo depende de la notificación".
  Es cierto y es inútil: el papel da datos para una fecha prudente, y la fecha
  es lo primero que esta persona necesita.
- **Inventar una fecha redonda** tipo `2026-11-01`. Ojo: si el modelo devuelve
  una fecha de hace años o de dentro de quince, `fechaValida()` la tira y el
  usuario se queda sin ninguna. Eso es lo correcto por parte del código, pero
  significa que una fecha mal inventada se convierte en silencio.
- **Dar por leído el reverso.** Es el fallo que más confianza cuesta, porque la
  persona descubre que Kairo "leyó" algo que en su foto no estaba.
- Rellenar `IMPORTE` con "90 €" perdiendo la reducción, que es justo el dato que
  cambia la decisión.
- Soltar un sermón sobre aparcar bien. No se lo ha pedido a nadie.
