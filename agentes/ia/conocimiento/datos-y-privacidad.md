# Qué se guarda de lo que le mandas a Kairo

**Última revisión**: 2026-11-14 (la anterior, 2026-10-24)
**Dónde se usa, desde el 2026-10-24**: los cuatro hechos de abajo están
escritos a mano en el bloque `PRIVACIDAD` de `kairo/src/lib/ia/prompt.ts`,
porque esta carpeta **no viaja con la app** y por tanto nunca llegaba al
prompt (lo descubrió el banco de pruebas del 23-10). Así que este archivo es
la fuente y el bloque es la copia: **si cambias algo aquí, cámbialo allí**, o
Kairo seguirá diciendo lo de antes.
**Cómo se ha hecho**: leyendo el código que guarda, no la política de
privacidad. Cada afirmación lleva el archivo y la línea donde se comprueba.
**Cuándo revisarlo**: cuando cambie `api/paperwork/route.ts`, `api/chat/route.ts`,
las tablas de Supabase o la carpeta `entrenamiento/`.
**Y desde el 13-11 ya no es el único sitio donde esto está escrito**: hay una
política de privacidad publicada en `/legal/privacidad`, hecha leyendo el mismo
código. Si alguna vez este archivo y ese documento no dicen lo mismo, **manda el
documento**, porque es el que lee el usuario; y entonces esto hay que arreglarlo
el mismo día.

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
(`route.ts:177`, comprobado otra vez el 24-10 — era la 160 el 21-10 y el
archivo ha crecido con el merge; es un `delete()` de verdad, no el `update`
de estado de la línea 164, que es otra cosa). Lo que no vuelve es lo que ya se mandó al modelo, como en
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
copias de seguridad, quién puede verlo por dentro, si se cifra—, **esto cambió el
13-11 y es el cambio que más mejora la respuesta**. Antes la respuesta era "no lo
sé, está en los textos legales", y era una respuesta pobre porque no había tales
textos. Hoy sí los hay, y dicen exactamente eso: el apartado 7 de
`/legal/privacidad` se titula *"Cuatro cosas que hoy no te podemos decir"* y las
enumera una por una, con lo que sí se puede hacer en su lugar (de la
conservación: *"no hay un plazo de borrado automático configurado. Lo que sí
puedes hacer hoy es borrar tú"*).

Así que la respuesta ya no es "no lo sé": es **"eso no está establecido, y está
escrito que no lo está, aquí"**. Son cosas distintas. La primera suena a que
Kairo no se ha enterado; la segunda es una casa que ha mirado sus cuatro
agujeros y los ha publicado en vez de taparlos. No hace falta prometer nada para
que esa respuesta deje tranquilo a quien pregunta.

## Qué NO puede decir Kairo, y es lo importante de este archivo

**No puede afirmar que lo que le mandas no se usa para entrenar modelos.**

- La página `/precios` sí lo afirma, y desde el 11-11 **con más fuerza**:
  *"¿Se usan mis conversaciones para entrenar modelos? **No. Ni las tuyas ni las
  de nadie, y tampoco se venden.**"*
- Kairo funciona hoy **con un solo motor, Gemini**, y en la **capa gratuita de
  la API de Gemini los datos se usan para mejorar los productos de Google** —la
  tabla de precios del proveedor trae la fila *"used to improve our products"*
  con **Yes** en gratuita y **No** en pago—; en la de pago, no.
- **Y la capa está contestada desde el 25-10: es la gratuita.** Lo dijo un
  commit del propio dueño (`688ecb2`, 24-10), que habla de *"Gemini's free
  tier"* como lo que le está pasando a Kairo. Queda escrito en
  `agentes/CONTEXTO.md`.
  *Hasta el 14-11 este archivo decía que "nadie lo ha comprobado todavía
  `(sin confirmar)`". Llevaba **veinte días** contestado y nadie lo trajo aquí.*
- **Y desde el 13-11 hay un documento publicado que lo dice**: la política de
  privacidad (`/legal/privacidad`), apartado 5, explica que mientras la cuenta
  esté en esa capa **no se puede afirmar lo contrario**.

Así que, si alguien le pregunta a Kairo si se entrena con sus datos, lo honesto
es: **"lo que se guarda es esto y esto; sobre el entrenamiento, la política de
privacidad dice que mientras la cuenta esté en la capa gratuita no se puede
afirmar que no, y ahí está explicado"**. Repetir el "No" de `/precios` sería que
la IA respalde una afirmación que su propio documento legal contradice, y eso es
el fallo que más caro sale: el usuario se queda convencido por boca de Kairo.

**Y desde el 13-11 hay algo que decir y que antes no se podía**: las dos páginas
se contradicen. `/precios` dice que no, la política de privacidad dice que no se
puede afirmar. **Kairo no tiene que elegir bando ni hacer de árbitro**: cuenta lo
que dice el documento legal, que es el que manda en esto, y si la persona
insiste con lo de `/precios`, dice que eso está pendiente de corregir. No se
inventa una explicación de por qué hay dos versiones.

**Esto no es desconfianza del producto, es orden**: el día que la cuenta pase a
la capa de pago, este apartado se borra, la política de privacidad se reescribe
y Kairo puede decir "No" con todas las letras. Hasta entonces, no.

## Sí, Kairo está entrenando un modelo propio. Y no con tus datos

Esto es nuevo del 13 y 14-11, está en `main` y **lo van a preguntar**, porque
"estáis entrenando una IA con lo mío" es la sospecha natural en cuanto alguien
ve la palabra entrenamiento.

Lo que hay, comprobado archivo por archivo el 15-11:

- `entrenamiento/entrenar.py` entrena **un LoRA sobre Gemma 4 E4B** (no cambia
  el modelo entero: solo unas capas pequeñas encima).
- Entrena con **un solo conjunto de datos**, `alonsofg29/kairo-ejemplos`
  (`entrenar.py:110`, un `hf_hub_download` de `data/train.jsonl`). No lee nada
  más.
- Ese conjunto lo fabrica `generar_ejemplos.py` **a partir de preguntas escritas
  a mano** (`preguntas.txt`) y del prompt de Kairo, y lo sube **privado**
  (`private=True`, línea 204).
- **No toca la base de datos.** En toda la carpeta no hay `supabase`, ni
  `postgres`, ni una sola consulta a `papeles`, `conversaciones`, `mensajes` o
  `recuerdos`; y el workflow que lo ejecuta
  (`.github/workflows/generar-ejemplos.yml`) solo recibe dos secretos,
  `GEMINI_API_KEY` y `HF_TOKEN`. Ninguna llave de Supabase.

Así que si preguntan, la respuesta es **sí, y es la buena**: *"se está
entrenando una versión propia de Kairo, pero con preguntas inventadas a mano
para enseñarle a contestar, no con conversaciones de nadie"*. Decirlo así es
mejor que esquivarlo: el usuario se queda con que hay un modelo propio **y** con
que sus papeles no están dentro.

**Y aquí va el cable trampa, que es para lo que sirve este archivo.** El
apartado 5 de la política publicada afirma: *"Kairo no vende tus datos, no los
cede con fines comerciales y **no los usa para entrenar ningún modelo
propio**"*. Hoy eso es verdad y se puede comprobar en un minuto con los cuatro
puntos de arriba. Deja de serlo **el día que alguien meta conversaciones reales
en `preguntas.txt` o en ese conjunto de datos**, y ese día habrá una afirmación
falsa en el documento donde menos se puede. No hace falta mala fe: basta con
querer ejemplos más realistas. Quien toque `entrenamiento/` vuelve aquí.

## Lo que falta y solo puede contestar el dueño

1. **¿Cuánto tiempo se conservan los papeles y las conversaciones?** Hoy no hay
   ningún borrado automático en el código: lo que se guarda, se queda. El
   apartado 7 de la política ya lo dice así, de modo que esto ya no es un
   agujero tapado: es una decisión pendiente, y publicada como pendiente.
2. **¿Se pasa la cuenta de Gemini a la capa de pago?** Es la única pregunta que
   cierra de verdad lo del entrenamiento, y con ella la contradicción entre
   `/precios` y la política de privacidad.

*Lo de antes, resuelto y dejado aquí por histórico: "¿la cuenta de Gemini es de
pago o gratuita?" (contestada el 25-10: gratuita) y "¿los textos legales
mencionan a los proveedores de IA?" (contestada el 13-11: sí, la política de
privacidad los nombra uno por uno).*
