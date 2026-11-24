# Límites y cuotas de los motores de Kairo

**Última revisión: 2026-11-24.** Lo escribió `kairo-entrenador` (área 3) el
2026-11-24, después de que el guardián encontrara a Kairo muda cuatro días
seguidos y de descubrir que **la pregunta que llevábamos 39 días dándonos por
contestada no lo estaba**.

Este archivo existe porque las dos averías más largas de Kairo —la del 26-10
("deja de buscar cada tarde") y la del 20-11 ("no contesta a un desconocido")—
son las dos la misma avería: **se acabó el cupo diario y nadie lo vio venir.**
Y porque al mirarlo de cerca resulta que no sabíamos leer nuestro propio
diagnóstico.

Como todo lo de esta carpeta: **esto no viaja con la app y no llega al prompt.**
Es la referencia de los agentes y el sitio donde se comprueba un dato antes de
escribirlo en `kairo/src/lib/ia/prompt.ts`.

---

## 1. Las cuotas de Gemini son POR PROYECTO, no por clave

**Esto es lo más importante del archivo y corrige una creencia nuestra de 39
días.**

Lo que dice la documentación de Google: los límites (RPM, RPD, TPM) se aplican
**por proyecto, no por clave de API**. Crear más claves dentro del mismo
proyecto **no multiplica la cuota**: son varias puertas al mismo contador. La
única forma de tener cuotas separadas es tener **proyectos separados**.

- Fuente: <https://ai.google.dev/gemini-api/docs/rate-limits>
- Comprobado el 24-11 con dos búsquedas independientes. **No se ha podido abrir
  la página desde la sede** (esta máquina no tiene salida a internet, apartado 2
  del protocolo): lo anterior viene del resumen del buscador citando esa página,
  y de varias fuentes secundarias que coinciden. Si alguien puede abrirla, que
  confirme la frase exacta y borre esta advertencia.

**Lo que esto rompe de lo nuestro:**

`/api/estado` dice *"Gemini: 3 clave(s)"* y lo venimos apuntando cada día como
si fuera cuota repartida. El propio código lo dice en `cerebros.ts:101-108`: *"el
único trabajo de esa pantalla es decir si de verdad hay cuota repartida"*. Pues
bien: **contar claves no puede contestar esa pregunta.** Tres claves son tres
cuotas solo si están en tres proyectos distintos; si están en uno, son una cuota
y tres llaves de la misma puerta.

**Cuál de las dos cosas es, no lo sabemos y no se puede saber desde aquí**: no
sale en `/api/estado`, no está en el código y hace falta mirar la consola de
Google Cloud. Es una pregunta para el dueño, y está en el backlog del 24-11.

**Y de aquí sale una corrección a lo que llevábamos cuatro días pidiéndole.**
Desde el 20-11 el aviso decía *"una clave de Gemini aparte para el generador de
entrenamiento"*. Si esa clave nueva sale del mismo proyecto, **no arregla nada**:
el generador seguiría comiéndose la cuota de producción. Lo que hay que pedir es
**un proyecto de Google Cloud aparte** para el generador.

## 2. Cuándo se renueva la cuota diaria de Gemini

A **medianoche del Pacífico**, y los límites por día (RPD) son los que se
reinician ahí.

- Fuente: la misma página de arriba, con la misma advertencia.
- En hora UTC eso es: **08:00 UTC en invierno** (PST, UTC−8) y **07:00 UTC en
  verano** (PDT, UTC−7). En hora española, **09:00** en invierno y **09:00** en
  verano también, por casualidad de los dos cambios de hora.

**Por qué esto importa para los agentes, y es el error que más caro ha salido:**
el guardián dispara a las **06:12 UTC**, o sea **1 h 48 min antes de que se
renueve el día**. Mide a Kairo en el minuto en que la cuota lleva ~22 horas
gastándose: el peor de las 24. Durante días hemos dado por "Kairo está muda" lo
que estaba medido solo al final de la jornada de cuota. La prueba de la portada
no mentía; mentía la hora a la que la mirábamos.

Hay informes de usuarios de que el contador a veces no se reinicia a su hora.
`(sin confirmar)`, y son foros, no Google. Conviene saber que existe antes de
dar por hecho que un 429 pasada la medianoche del Pacífico es culpa nuestra.

## 3. Cómo se lee de verdad `intentos`, y cómo NO

Cuando Kairo no puede contestar, `/api/probar` devuelve algo así:

```json
{"error":"sin_cerebros","intentos":["gemini:429","gemini:429","extra:429","extra:429"]}
```

**Cada elemento es `proveedor:código`. El proveedor, no el modelo y NO la
clave** —lo dice `api/probar/route.ts:183-185`: *"Solo el proveedor y el código:
ni el modelo exacto ni el mensaje del servidor"*—.

Así que **`gemini:429` dos veces NO significa "dos claves agotadas"**, ni tres,
ni las que haya puestas. Significa que a dos modelos de Gemini se les preguntó y
los dos devolvieron 429. La cadena de esa ruta se arma en
`api/probar/route.ts:178-180`: dos modelos de la cadena con filtro de edad y dos
de la cadena sin él, cuatro en total, porque *"cuatro intentos son ya quince
segundos de espera"*.

Dicho de otra forma: ese JSON dice **que no hay cupo**, no **cuántas cuotas se
han agotado**. Yo mismo estuve a punto de escribir "las tres claves están
agotadas" el 24-11, y no es lo que pone.

## 4. El respaldo: OpenRouter y sus modelos `:free`

La cadena de respaldo **no se lee del repositorio**: se configura en Vercel. El
24-11 `/api/estado` daba cuatro modelos, los cuatro `:free`:

- `google/gemma-4-31b-it:free`
- `google/gemma-4-26b-a4b-it:free`
- `nvidia/nemotron-3.5-lightning:free`
- `nvidia/nemotron-3.5-super-vl:free`

Y el 12-11 eran otros tres. **`main` no se había movido**, así que cambiaron en
Vercel. Consecuencia práctica para cualquier agente: **mirar el código no te
dice qué motores tiene Kairo hoy**; eso solo lo dice `/api/estado`. El 19-11 ya
se escribió una viñeta en el prompt para que Kairo tampoco recite la lista de la
web como si la viera.

Que los cuatro sean `:free` tiene un lado bueno y uno malo. El bueno: no cuesta
por consulta, que es lo que resolvió el P1 del 26-10. El malo: **tienen tope
diario igual que Gemini**, y el 20-11 y el 24-11 dieron `extra:429`, o sea
agotados también. Un 429 prueba además dos cosas buenas, y conviene recordarlo
porque nos costó tres días de diagnóstico equivocado: que **se llega** al
proveedor y que **la clave vale**. Un 401 o un 403 serían lo contrario; el código
los distingue (`veredictoDeClave`, en `api/estado/route.ts:78`).

El cupo gratis de OpenRouter sube si la cuenta tiene saldo —el backlog del 15-11
lo cifra en 10 $ para pasar de 50 a 1.000 peticiones al día—. **`(sin confirmar)`
con fuente de hoy**: no se ha vuelto a comprobar en la web de OpenRouter el
24-11, y los cupos de estos sitios cambian de mes a mes. Antes de repetirlo en
un informe, que alguien lo mire con `WebSearch`.

## 5. Lo que NO se puede saber desde la sede

Para que ningún agente lo intente otra vez y lo apunte como roto:

- **Si Kairo contesta ahora mismo.** Esta máquina no sale a internet. Se mide
  lanzando `probar-portada.yml` desde GitHub.
- **En qué proyecto está cada clave de Gemini.** Hace falta la consola de Google
  Cloud, que es del dueño.
- **Cuánta cuota queda hoy.** Ni `/api/estado` ni el log lo dicen: solo se ve el
  429 cuando ya se acabó. Medir el consumo haría falta pedirlo a Google.
- **Quién se está comiendo la cuota.** El 20-11 se culpó al generador de
  entrenamiento; el 24-11 se comprobó que **no ha corrido desde el 19-11** y la
  cuota se agota igual. Así que hay otro consumidor y no sabemos cuál.

## 6. Qué debe decir Kairo cuando se queda sin cupo

Lo que ya está hecho, para no repetirlo: desde el 20-11 la caja de probar de la
portada distingue el caso y dice la verdad —*"ahora mismo estoy a tope y no puedo
contestar: no es tu pregunta, es que se ha agotado la cuota de hoy"*— en vez del
*"prueba otra vez en un momento"* de antes, que invitaba a reintentar justo
cuando reintentar no servía de nada (`i18n.tsx`, clave `try.saturado` en las líneas 49 y 700, los dos idiomas;
`Probar.tsx:67` la enciende con `sin_cerebros` y `sin_modelos`).

Lo que **no** está comprobado: qué ve un usuario **con cuenta** cuando pasa lo
mismo dentro del chat. Es una pregunta abierta para un área 4 (casos límite), no
para este archivo.

Y la regla de fondo, que vale para el prompt: **del cupo se habla sin
inventarse la hora.** Kairo no sabe cuándo se le renueva la cuota —depende de la
configuración de quien la lleva— así que no promete "vuelve en una hora". Dice
que se ha agotado, que se renueva sola y que no es culpa de la pregunta.
