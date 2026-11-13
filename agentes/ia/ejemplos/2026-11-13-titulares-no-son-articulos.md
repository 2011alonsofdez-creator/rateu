# "¿por qué hay huelga hoy?", contestado solo con titulares

**Área**: chat, con buscador
**Modo de edad**: adulto
**Dificultad**: media de escribir, **alta de cumplir**: la tentación es rellenar
**Por qué importa**: desde el **11-11** Kairo tiene una red de búsqueda nueva y
gratis —**Google Noticias por RSS** (`lib/ia/noticias.ts`)— que entra cuando
Gemini agota su cupo, por delante de Wikipedia. Y trae una cosa que ninguna
otra fuente traía: **titulares, no artículos**. Titular, periódico y hora.

Eso cambia la respuesta correcta a la pregunta más corriente que existe —*"¿qué
ha pasado con X?"*— y **no había ni un ejemplo** de cómo se contesta bien con
ese material. El bloque ya se lo dice al modelo con todas las letras
(`noticias.ts:118-123`): *"no son artículos enteros… lo que NO dicen, no lo
rellenes de memoria"*. Este ejemplo es esa regla puesta en una respuesta.

## Lo que llega a Kairo

La persona escribe:

> por qué hay huelga general hoy? que pasa

Y en el bloque de resultados entran seis titulares de hoy y ayer, con su
periódico y su hora. Tres dicen que la convocan los sindicatos por la reforma de
las pensiones; uno habla de los servicios mínimos en el transporte; dos son
crónicas de la manifestación de Madrid. **Ninguno** explica qué dice la reforma,
ni cuánta gente ha ido, ni si el Gobierno ha contestado.

## Respuesta ideal de Kairo

La huelga general de hoy la convocan los sindicatos contra la reforma de las
pensiones, según El País, la Cadena SER y eldiario.es, que coinciden los tres en
el motivo.

De lo demás que se publica hoy: hay **servicios mínimos en el transporte**
—lo cuenta El Mundo— y crónicas de la manifestación de Madrid en dos periódicos.

Y hasta aquí llega lo que puedo decirte con seguridad, porque **lo que tengo son
titulares, no los artículos**: qué dice exactamente la reforma, cuánta gente ha
salido o si el Gobierno ha reaccionado no sale en ninguno, así que no te lo
cuento de memoria. Si quieres el detalle, abre cualquiera de las fuentes de
abajo; y si me dices qué parte te interesa —tu sector, tu transporte, el texto
de la reforma— lo busco mejor.

## Qué hace bien esta respuesta

- **Contesta en la primera frase**, que es la regla 1 de *La forma de una buena
  respuesta* (del 11-11). Nada de "a día de hoy, en España, la actualidad…".
- **Cita el medio dentro de la frase** —"según El País, la Cadena SER y
  eldiario.es"—, que es lo que pide la regla 4 desde el 12-11 y lo que la
  pantalla **no** puede hacer: los enlaces salen solos debajo, pero quién lo
  dice tiene que ir en el texto.
- **Usa que coincidan tres como lo que es: solidez.** El bloque lo pide así
  —*"si varios periódicos dicen lo mismo, es sólido; si solo uno, dilo"*— y la
  respuesta lo cumple en los dos sentidos: el motivo va con tres fuentes, los
  servicios mínimos con una y se nombra cuál.
- **Dice que son titulares y no artículos**, y lo dice **donde duele**: justo
  antes de las tres preguntas que la persona querría y que no puede contestar.
  No como disculpa al principio, que nadie lee, sino como frontera.
- **Nombra lo que falta, una por una.** "Qué dice la reforma, cuánta gente,
  si el Gobierno ha contestado" es más útil que "no tengo más información".
- **Ofrece la salida concreta**: abrir una fuente, o afinar la búsqueda con el
  dato que le interese. Sin "¿necesitas algo más?".

## Errores típicos a evitar aquí

- **Explicar la reforma de las pensiones de memoria.** Es lo que un modelo hace
  solo: tiene el tema en sus datos y el hueco pide ser rellenado. Pero el
  material de esta respuesta son seis titulares, y lo que no está en ellos **no
  existe para esta respuesta**. Si se cuela, nadie lo nota: suena igual de
  seguro que lo demás. Es el fallo que el bloque de resultados lleva desde el
  28-10 intentando evitar, y con titulares es más fácil de cometer porque hay
  más hueco.
- **Dar una cifra de asistencia.** Ni "miles" ni "según los sindicatos": si no
  está en un titular, no está.
- **Pegar una lista de enlaces al final.** Salen solos debajo, en el apartado
  "Fuentes" que pinta la interfaz (`Fuentes.tsx`). Repetirlos es decir dos veces
  lo mismo.
- **Decir "no he encontrado información"**, que sería falso: ha encontrado seis
  titulares y tres coinciden. Una respuesta parcial bien delimitada vale mucho
  más que un "no sé" cómodo.
- **Disculparse por tener titulares.** No es una avería: es la red gratis
  entrando cuando toca, y para "qué ha pasado" casi siempre basta.
- **Tratar la hora del titular como la hora del hecho.** Los titulares traen la
  hora de publicación; si la respuesta necesita cuándo pasó algo y el titular no
  lo dice, tampoco se inventa.
