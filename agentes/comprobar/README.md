# Comprobaciones automáticas de los agentes

Scripts que miran si lo que los agentes han escrito sigue siendo verdad. No
arreglan nada: avisan, con el archivo y la línea.

## `cifras.py`

```bash
python3 agentes/comprobar/cifras.py
```

Lee del **código** los números y los hechos del producto —lo que cuesta cada
nivel, lo que trae cada plan, el regalo de bienvenida, los topes de Co-Works y
Mentes, la galleta y el tope de la prueba sin cuenta— y comprueba que el
material de `agentes/` no diga otra cosa. Salida 0 si cuadra, 1 y la lista si no.

**Por qué existe.** Entre el 06 y el 10 de noviembre, **cuatro veces** un cambio
del dueño dejó falso algo nuestro:

| Cuándo | Qué quedó falso |
|---|---|
| 06-11 | la escala de créditos, en cuatro archivos de `agentes/ia/` |
| 06-11 | el caso 7 del banco de pruebas, que esperaba 120 y 1.000 |
| 07-11 | la política de cookies, que decía "no hay analítica" |
| 10-11 | *(evitado)* el tono de la prueba de la portada, que no tenía ninguno |

Las tres primeras se arreglaron a mano, y las tres veces la conclusión fue
"dejemos escrita una regla". La regla acabó escrita en **tres archivos
distintos**. Eso no es una regla: es la prueba de que se nos olvidó tres veces.
Esto es la regla hecha programa.

**Y funcionó en su primera ejecución**, que es lo que de verdad lo justifica:
encontró en `ejemplos/2026-11-03-limite-ayer-podia-usar-mega.md` un párrafo
entero con la escala vieja —*"un mensaje rápido, 1 crédito; uno normal, 4…"*—
**cuatro días después** del repaso a mano del 06-11, que se hizo con cuidado y
con 22 comprobaciones propias. A mano se nos escapó; al script, no.

## Qué mira, y las dos redes (11-11)

**Los archivos**, dos grupos con reglas distintas:

| | Qué | Cómo se lee |
|---|---|---|
| **Material** | `ia/conocimiento/`, el banco de pruebas y todos los `ia/ejemplos/` | entero, menos las notas de mantenimiento del final |
| **Paneles vivos** | `CONTEXTO.md`, `ESTADO.md` y `lanzamiento/checklist.md` | de cada línea, **solo lo que afirma hoy** |
| **Copia del producto** (12-11) | `lib/i18n.tsx`, `lib/mock.ts`, `precios/contenido.tsx`, `ElegirPlan.tsx` | **sin los comentarios**, que citan la historia a propósito |

Los paneles se añadieron el **11-11** por un motivo medido: el 10-11 el radar,
buscando a mano para su informe, encontró **cuatro cifras en presente y falsas**
justo en los dos archivos que el script no miraba —`CONTEXTO.md`, el que el
protocolo manda leer antes de opinar, y el checklist—. Tres llevaban cinco días;
una, doce.

Esos archivos guardan su histórico **dentro de la misma celda**: una fila
encadena `Lo de antes:` y debajo cita, a propósito, la cifra de la semana
pasada. Si el script leyera la celda entera cantaría esas citas, y un
verificador con falsos positivos se desactiva solo. Así que corta cada línea en
el primer marcador de histórico y dice cuántas recortó, porque un recorte
silencioso es otra forma de punto ciego.

**Las dos redes**, y la segunda es la que hace falta:

1. **Frases prohibidas** (`VIEJAS`): las redacciones concretas de la escala
   anterior. Caza lo que ya mordió.
2. **Un nombre de cifra pegado a un número** (`cifras_pegadas`), comparado con
   el código. `rápido 2` pasa, `rápido 1` no, da igual cómo esté escrito
   alrededor. Mira también cada línea pegada a la siguiente, porque la prosa va
   envuelta a 76 columnas y una cifra se parte sin avisar.

**Por qué hacía falta la segunda, con la prueba hecha**: se le pasaron los
paneles del 10-11 con sus cuatro cifras falsas dentro y la primera red **cazó
dos**. Las otras se le escaparon por la forma, no por poco: busca
`20 créditos al día` y el panel escribía `` `free` 15 créditos ``; busca
`MEGA 120` y el panel escribía `` `mega` 120 ``. Y en cuanto la segunda red se
encendió encontró, en `ejemplos/2026-10-15-limite-usuario-que-insiste.md`,
*"un mensaje normal cuesta 4 créditos y Forja cuesta 20"* **cinco veces en el
mismo archivo**: seis días viejas, en una carpeta que el script ya miraba desde
el 10-11. Una palabra en medio —*cuesta*— y no había coincidencia.

**La tercera red, del 12-11: un tope que no dice de quién es.** Desde el 10-11
los topes de Co-Works y Mentes son **por plan**, así que una cifra a secas
—*"puedes tener hasta 30 Mentes"*— es verdad para uno de los tres planes y falsa
para los otros dos. Por eso esta red no comprueba que el número esté entre los
tres valores: **el fallo de hoy decía 30, que es exactamente el de Kairo+**. Lo
que exige es que la frase diga **de quién** es el tope, o que lleve `{n}` y lo
rellene quien sabe el plan.

Solo mira números que suenan a tope —detrás de *"hasta"*, *"máximo de"*, *"up
to"*, o pegados al nombre—, y eso también salió de equivocarse: la primera
versión cogía el primer número de la frase y acusó a dos respuestas de ejemplo
que ofrecen *"un Co-Work que te avise cada martes a las 21:00"*. El 21 de una
hora no es un tope.

**La lección, para quien amplíe esto**: una lista de frases prohibidas protege
de la redacción de ayer. Lo que protege de la de mañana es comparar con el
código.

**Y una de fontanería que cuesta una tarde si se aprende tarde**: al quitar los
comentarios de un `.ts` hay que **sustituirlos por sus mismos saltos de línea**.
Borrarlos del todo corre las líneas de abajo, y la primera versión de esta red
acusaba a `mock.ts:130` —un trozo de SQL de ejemplo— de hablar de Co-Works. Un
verificador que da bien el fallo y mal la línea manda a leer el archivo entero,
que es justo lo que viene a ahorrar.

### Quién lo pasa y cuándo

**El guardián, cada mañana**, dentro de su comprobación 9 (lo que lleva
demasiado tiempo pendiente): si falla, el desajuste va al backlog como 🟡 del
día, igual que cualquier otro hallazgo.

Y **el agente que escriba una cifra del producto**, antes de cerrar su turno.
Cuesta un segundo.

### Cuando el producto cambia

Si aparece una cifra nueva en el código —un tope, un precio, una galleta—, se
añade a este script **el mismo día**. Es lo único que hay que acordarse de
hacer, y es una línea.

Ya ha pasado una vez y se cumplió: la noche del 10-11 el dueño hizo los topes
**por plan**, y el guardián los metió a la mañana siguiente. El script dejó de
leer un tope único con un `>=` suelto —ese número había dejado de existir— y
pasó a leer los tres de la migración `0023_topes_por_plan.sql`, **y a fallar si
`planes.ts` dice otra cosa**: la pantalla lee el TypeScript y el servidor corta
con el disparador, así que si bailan, la página vende algo que no se cumple.

### Lo que NO hace

- No juzga estilo, ni opiniones, ni si un texto está bien escrito.
- **No mira el resto de `kairo/src`**: solo los cuatro archivos de copia de la
  tabla. Una cifra escrita a mano en una pantalla que no esté ahí sigue sin red.
- **No comprueba afirmaciones sin número.** De las cuatro cifras falsas del
  10-11, la más cara era *"`free` solo alcanza el nivel rápido"* —falsa desde el
  29-10, y con ella un agente concluye que Paperwork, Gist y Código no entran en
  el plan gratis—. Eso no es una cifra, es una frase, y este script no la ve.
  Sigue haciendo falta leer.
- No mira `agentes/ia/diario-entrenamiento.md` ni los informes ni los partes:
  son **histórico** y dicen lo que era verdad el día que se escribieron. Tocarlos
  sería falsificar el registro, y el protocolo lo prohíbe (apartado 5).
- No mira `docs/kairo/ESPECIFICACION.md`: ahí las diferencias con el código son
  un hallazgo, no un error, y están contadas en
  `agentes/ia/conocimiento/creditos-y-planes.md`.
