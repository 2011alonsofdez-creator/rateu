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
