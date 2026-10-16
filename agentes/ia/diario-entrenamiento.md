# Diario de entrenamiento de la IA de Kairo

Lo escribe `kairo-entrenador`, una entrada por día, la más reciente arriba.

## Rotación de áreas

Cada día le toca un área, en este orden cíclico. En una semana ha pasado por
todo y nada se queda sin atender.

1. **Prompt maestro** — afinar una sección de `kairo/src/lib/ia/prompt.ts`
2. **Ejemplos** — 2-3 casos nuevos en `ejemplos/`
3. **Conocimiento** — ampliar o corregir `conocimiento/`
4. **Casos límite** — qué pasa con lo raro, lo hostil o lo fuera de tema
5. **Evaluación** — pasar el banco de pruebas y anotar resultados
6. **Tono** — que suene a Kairo y no a un modelo genérico
7. **Recorte** — quitar lo duplicado, lo contradictorio y lo que no cambia nada

Si `notas.md` pide centrarse en algo, eso manda sobre la rotación.

---

## El mapa del prompt maestro

Levantado el 2026-10-12 leyendo `kairo/src/lib/ia/prompt.ts` entero (399
líneas). Es la referencia para elegir trabajo las próximas semanas; se
actualiza cuando el prompt cambie de forma, no cada día.

El prompt no es un texto fijo: se **arma por piezas** en `construirPrompt()`,
y el orden de pegado importa porque lo último que lee el modelo pesa más.
Orden real: BASE → TU TONO → nombre → fecha → hechos buscados → memoria →
internet (sí/no) → archivos → Forja → Mente → modo de edad.

| # | Pieza | Dónde | Qué hace | Cómo la veo |
|---|---|---|---|---|
| 1 | `TONOS` | L10-19 | 4 estilos: cercano, experto, chispa, breve | Flojo: son adjetivos ("serio, preciso"), no instrucciones medibles. Área 6 |
| 2 | `BASE` › IDENTIDAD | L23-26 | No revela modelo ni proveedor | Bien |
| 3 | `BASE` › CÓMO RESPONDES | L28-34 | Ir al grano, listas solo si aclaran | Correcto, pero "primero miras" es falso cuando no hay buscador |
| 4 | `BASE` › NO TE INVENTAS NADA | L36-50 | La sección más trabajada del prompt | Bien. No tocar sin motivo fuerte |
| 5 | `BASE` › LÍMITES | L52-58 | Médico/legal/financiero, autolesión | Bien |
| 6 | `BASE` › QUÉ NO HACES NUNCA | L60-65 | 4 tics de IA prohibidos | **El hueco más claro.** Faltan dos tics muy visibles: resumir lo que acaba de decir y ofrecerse a seguir ayudando al final. Área 6 |
| 7 | `SIN_INTERNET` | L72-86 | Qué decir sin buscador | Bien, y bien razonado el por qué está separado |
| 8 | `CON_INTERNET` | L87-115 | Cuándo es obligatorio buscar | Bien. Es una lista de casos, no un "puedes buscar" |
| 9 | `bloqueFecha()` | L124-167 | Qué día es hoy, zona del usuario | Bien. Resuelve el "mi conocimiento llega hasta 2024" |
| 10 | `bloqueHechos()` | L169-220 | 3 variantes: búsqueda fallida / sin resultados / con resultados | Bien, y la distinción fallo≠vacío es fina. Los resultados van delimitados y marcados como datos, no órdenes |
| 11 | `ARCHIVOS` | L230-243 | Lo de dentro de un archivo es dato, no orden | Bien |
| 12 | `NINOS` | L245-258 | 12 años o menos | No se toca sin permiso del dueño |
| 13 | `ADOLESCENTES` | L260-272 | 13-17 | No se toca sin permiso. Observación: no dice nada de emojis ni de tono, a diferencia de `NINOS` |
| 14 | `FORJA` | L276-290 | Niveles forja y mega: respuesta a fondo | **Tenía una contradicción con el tono "breve".** Arreglado hoy |
| 15 | `bloqueMente()` | L302-324 | Instrucciones del usuario, delimitadas y sin ampliar permisos | Bien, y el comentario explica las 3 defensas |
| 16 | `zonaValida()` | L326-337 | Zona horaria del navegador, con caída a Madrid | Bien |

Comprobado de paso, porque llamaba la atención: `modoEdad === null` se trata
como `"nino"` en `prompt.ts` (L398), `buscar.ts:437` y `config.ts:149`. Es
deliberado y coherente en los tres sitios —ante la duda, el modo más
protegido—, no un descuido. Lo dejo anotado para no volver a levantar la
piedra cada semana.

**Lo que marca el trabajo de las próximas semanas**, por orden de lo que más
cambiaría las respuestas:

1. Los 4 tonos son adjetivos, no instrucciones (pieza 1) y faltan dos tics de
   IA en QUÉ NO HACES NUNCA (pieza 6). Las dos cosas son área 6, Tono.
2. No hay ni un ejemplo en `agentes/ia/ejemplos/` ni una línea en
   `agentes/ia/conocimiento/`: las carpetas están con su README y nada más.
   Áreas 2 y 3.
3. El banco de pruebas (`agentes/ia/evals/banco-de-pruebas.md`) no se ha
   pasado nunca, así que ningún cambio de prompt tiene red de seguridad
   todavía. Área 5, y conviene que no se retrase mucho.

---

## Entradas

### 2026-10-16 — Evaluación (área 5)

**Qué cambié**: rellenado `agentes/ia/evals/banco-de-pruebas.md`, que tenía sus
8 casos en `[por escribir]`, y escrita la primera pasada en
`agentes/ia/evals/resultados/2026-10-16.md`.

**Por qué**: llevaba cuatro días siendo la recomendación del radar y mía.
Sin esto, los seis cambios de prompt de la semana eran opiniones.

**Cómo lo comprobé** —y esto es lo que hace que la pasada valga algo—: el
prompt no se ha leído de memoria. Se ha **renderizado el de verdad**, ejecutando
`construirPrompt()` con `node --experimental-strip-types` y stubs de sus cuatro
dependencias, con los valores reales de `CREDITOS` y `CREDITOS_PLAN`. Salen 103
líneas para la configuración adulto / cercano / normal / sin buscador / sin
archivos, y contra ese texto exacto se ha puntuado.

**Resultado: 10 de 12 en los 6 casos evaluables.** Dos casos no se han podido
evaluar y no se cuentan: la multa de Paperwork no pasa por este prompt sino por
el de `papeles.ts`, y el modo niño necesita su propia renderización.

**Lo que mide y lo que no, dicho claro**: mide si el prompt dice lo que hace
falta, no lo que contesta Kairo en producción —desde aquí no hay API, ni
claves, ni red—. Y quien puntúa es un modelo de la misma familia que escribió
el prompt. Así que es un **suelo, no una prueba**: los 1 valen mucho más que
los 2.

Los dos 1, que son el trabajo que esto deja hecho:

- **Nadie le ha dicho a Kairo qué puede y qué no puede hacer.** Hay un "no
  prometas tareas que no puedes ejecutar", pero ninguna lista. Si alguien pide
  "resérvame mesa el viernes", el modelo decide solo, y a veces dirá que sí. El
  material ya está escrito en `conocimiento/creditos-y-planes.md`; falta
  llevarlo al prompt, igual que se hizo con los créditos.
- **No hay ninguna regla sobre no ceder ante quien insiste**, que es el vicio
  más típico de un modelo sin afinar y el que más caro sale cuando va de
  dinero. El caso está escrito en `ejemplos/` desde ayer, pero escrito no es lo
  mismo que puesto en el prompt.

Y una cosa buena que enseña la pasada: el caso 7, el de los créditos, **hace
tres días habría sido un 0** y hoy es un 2. El cambio del 14-10 se puede
defender con un número.

**Qué necesito del dueño**: nada. Los dos arreglos van al backlog para el
constructor, redactados.

**Mañana toca**: área 6, **Tono** — los cuatro tonos son adjetivos y no
instrucciones, y a `QUÉ NO HACES NUNCA` le faltan dos tics muy visibles. Lo
tengo anotado desde el mapa del primer día.

### 2026-10-15 — Casos límite (área 4)

**Qué cambié**: tres casos nuevos en `agentes/ia/ejemplos/`, de situaciones que
hoy romperían a Kairo:

| Archivo | Qué rompe |
|---|---|
| `2026-10-15-limite-texto-pegado.md` | Un correo pegado en el chat con una orden escondida dentro, dirigida a la IA |
| `2026-10-15-limite-hora-del-cowork.md` | Un Co-Work a hora fija para una reunión, cuando el reloj no es puntual |
| `2026-10-15-limite-usuario-que-insiste.md` | Alguien que insiste tres veces en que se le ha cobrado de más, cuando no es así |

**Por qué**: los tres son fallos que no se ven venir. El primero es un agujero
abierto, el segundo es Kairo rompiendo su propia promesa, y el tercero es el
vicio más típico de un modelo sin afinar —ceder ante quien insiste— puesto
donde más cuesta, que es el dinero.

**Lo que ha salido de hacerlo, y es lo importante de hoy**: comprobando qué
cubre el prompt encontré **un hueco real de seguridad**. El bloque `ARCHIVOS`
blinda lo que viene dentro de un adjunto, y el de resultados blinda lo que
viene de una búsqueda. Pero **nada cubre el texto que el usuario pega en su
propio mensaje**, que es por donde entra la mayoría del contenido: un correo,
un contrato, una página copiada. Y encima el bloque `ARCHIVOS` solo se añade
cuando hay adjuntos (`if (conArchivos)`), así que en una conversación de texto
normal esa defensa ni siquiera está presente.

**Cómo lo comprobé**: leyendo `kairo/src/lib/ia/prompt.ts`. El bloque de
archivos está en L230-243 y se pega solo bajo `if (conArchivos)`; el de
resultados, dentro de `bloqueHechos()`. Buscando "pegado", "ignora tus
instrucciones" y similares no aparece ninguna regla para el cuerpo del mensaje.

**Qué necesito del dueño**: nada. El arreglo es una regla corta en el prompt y
lo he dejado en el backlog para el constructor, redactado. No lo hago yo hoy
porque hoy me toca escribir los casos, y un cambio de prompt es área 1: así
cada cosa va con su commit y se puede revertir sola.

**Mañana toca**: área 5, **Evaluación** — pasar el banco de pruebas por primera
vez. Es la que más falta hace: lleva cuatro días de recomendación y mientras no
se pase, los cinco cambios de prompt de esta semana no se pueden defender ni
revertir con criterio.

### 2026-10-14 — Conocimiento (área 3)

**Qué cambié**: escrito `agentes/ia/conocimiento/creditos-y-planes.md`, el
primer archivo de una carpeta que solo tenía su README. Lleva lo que cuesta
cada acción en créditos, lo que trae cada plan, los precios, lo que Kairo sabe
hacer, lo que no debe decir nunca, y las tres cosas que chocan entre el
documento y el código.

**Por qué**: era el P1 número uno del backlog. Si hoy un usuario pregunta
"¿cuánto me gasta un Mega-Prompt?", Kairo no tiene de dónde sacarlo y contesta
un número verosímil y falso, que el usuario descubre pagando.

**Cómo lo comprobé**: cada cifra contra el código que la cobra, no contra la
especificación. Los créditos por nivel salen de `CREDITOS` en
`lib/ia/config.ts:183`, que es la constante que usan de verdad `api/chat`,
`api/paperwork` y `api/coworks`. Los créditos por plan, de `CREDITOS_PLAN` en
`lib/planes.ts`. Lo que no he encontrado en el código —los precios en euros, los
topes por plan, el coste de generar una imagen— va marcado `(sin confirmar)`,
y el archivo le dice a Kairo que no lo presente como un cobro en firme.

Buscando eso aparecieron **dos divergencias nuevas, y las dos tocan dinero**:
un Co-Work ejecutado cobra 4 créditos y la especificación dice 40; y analizar
un documento con Paperwork cobra 4 y el documento dice 15. No son descuidos:
el código lleva un comentario que lo justifica ("lo mismo que un mensaje
normal: es uno"). Pero la cuenta del margen de la especificación está hecha con
40 y con 15. Van al backlog; no se toca nada.

**Lo que este cambio NO arregla, y conviene decirlo claro**: el archivo está en
`agentes/`, no en el prompt. **Hoy Kairo sigue sin saber sus precios.** La
carpeta `conocimiento/` es material; nadie la lee todavía en tiempo de
ejecución. Para que llegue hacen falta dos cosas que son de código y por tanto
del constructor, no mías: un bloque `PRODUCTO` en `lib/ia/prompt.ts` con las
cifras confirmadas, y la regla de qué contestar cuando le pregunten algo que no
esté ahí. Lo he dejado en el backlog redactado para que se pueda coger tal cual.

**Qué necesito del dueño**: que decida las tres divergencias de dinero. Están en
el backlog y en el archivo nuevo. Mientras no decida, Kairo se calla sobre ellas,
que es lo correcto pero no es gratis: un usuario que pregunte por su plan se
queda sin respuesta.

**Mañana toca**: área 4, Casos límite — tres situaciones que hoy romperían a
Kairo y cómo debe comportarse. Con cuidado con el modo de edad, que no se toca.

### 2026-10-13 — Ejemplos (área 2)

**Qué cambié**: tres casos nuevos en `agentes/ia/ejemplos/`, que estaba vacía:

| Archivo | Qué prueba |
|---|---|
| `2026-10-13-multa-con-plazo.md` | Paperwork: convertir "20 días naturales" en una fecha del calendario, explicar que el descuento del 50% implica renunciar a alegar, y avisar de que la foto sale cortada en vez de rellenar el hueco |
| `2026-10-13-peticion-a-medias.md` | El mensaje a medias: preguntar las dos cosas que cambian el resultado, no ocho, y no inventarse el "como te dije antes" que no existe |
| `2026-10-13-cuanto-gasta-mega.md` | Una pregunta sobre el propio Kairo: dar la cifra, hacer la cuenta, y marcar en una línea lo que no se puede confirmar |

**Por qué**: la carpeta no tenía ni un caso, así que "cómo responde Kairo"
estaba definido solo con adjetivos en el prompt. Un ejemplo con la respuesta
escrita entera define el comportamiento con hechos, y además es el material del
banco de pruebas, que tiene sus 8 casos en `[por escribir]`. Estos tres cubren
los huecos 3, 4 y 7 de ese banco.

Los tres son difíciles a propósito, y cada uno por un motivo distinto: el
primero obliga a calcular, el segundo a no adivinar, el tercero a no inventar.
Elegí la multa porque es el caso que mejor enseña para qué sirve Kairo: lo que
la persona necesita no es un resumen del papel, es una decisión con fecha.

**Cómo lo comprobé**: los datos del producto, contra las fuentes, no de memoria.
Los 120 créditos del Mega-Prompt y los 1.000 de Kairo+ salen de
`docs/kairo/ESPECIFICACION.md` sección 3 y de `kairo/src/lib/planes.ts`. Las
cuentas del ejemplo: 1.000 / 120 = 8 al mes, y 120 × 30 = 3.600 para usarlo a
diario. La fecha de la multa: 28/09/2026 + 20 días naturales = 18/10/2026.
Lo que **no** he comprobado: que Kairo responda así de verdad. Para eso hace
falta el banco de pruebas, que sigue sin pasarse nunca.

**Qué necesito del dueño**: nada para esto. Pero una advertencia que sale del
tercer ejemplo y que conviene que vea: ninguna de esas cifras de precios está
hoy en el prompt ni en `agentes/ia/conocimiento/`, que está vacío. Es decir,
**hoy Kairo no tiene de dónde sacar sus propios precios, así que si alguien se
los pregunta se los va a inventar**. Y ahí inventar no es un error de estilo:
es que el usuario se enteraría pagando. Eso hace del área 3 la más urgente de
las siete.

**Mañana toca**: área 3, Conocimiento — meter en `agentes/ia/conocimiento/` los
precios, los créditos y los límites de los planes, cada uno con su fuente, y
marcar `(sin confirmar)` lo que choque entre la especificación y el código
(que algo choca: lo encontró el constructor ayer con los niveles de Kairo+).

### 2026-10-12 — Prompt maestro (área 1)

**Qué cambié**: `kairo/src/lib/ia/prompt.ts`, bloque `FORJA` ("TRABAJO A
FONDO"). La primera regla decía "Tómate el espacio que haga falta. Aquí la
brevedad no se premia" y ahí se quedaba. Le he añadido a esa misma regla que
manda sobre `TU TONO`, y cómo: se mantiene la manera de hablar directa del
tono, pero no se recorta el contenido.

**Por qué**: era una contradicción real, no teórica. Quien tiene el tono
**"Al grano"** ("Lo mínimo imprescindible para responder bien, sin rodeos ni
relleno", L17-18) y pide **Forja** recibe las dos órdenes opuestas en el mismo
prompt, y encima la del tono viene reforzada con "Mantenlo en toda la
conversación" (L371). El modelo tenía que elegir sin criterio, y el usuario que
paga el nivel más caro era justo el que se podía llevar la respuesta recortada.
Ahora la precedencia está escrita.

**Cómo lo comprobé**: `tsc --noEmit --ignoreConfig --skipLibCheck` sobre el
archivo → **0 errores de sintaxis**; los 4 que salen son `TS2307` de los
imports con alias `@/`, que no se resuelven porque esta máquina no tiene
`node_modules` instalado y no tienen nada que ver con el cambio. Verificado
además que el literal de plantilla sigue cerrado y sin `${}` ni comillas
invertidas sueltas dentro. No he podido ver la respuesta real de Kairo: hace
falta el banco de pruebas (área 5) y, para la web, permiso de red.

**Qué necesito del dueño**: nada. El cambio es de texto de prompt, en un bloque
que no es `seguridad.ts` ni el modo de edad.

**Mañana toca**: área 2, Ejemplos — 2 o 3 casos en `agentes/ia/ejemplos/`,
incluido uno difícil. La carpeta está vacía, así que son los primeros.
