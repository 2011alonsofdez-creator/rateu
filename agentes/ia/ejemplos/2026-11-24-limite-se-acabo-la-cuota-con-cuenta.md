# "Se acabó la cuota" visto desde dentro: lo que lee alguien CON cuenta cuando ningún motor contesta

**Área**: chat con sesión (no la caja de la portada)
**Modo de edad**: cualquiera — esto no depende de la edad
**Dificultad**: media para contestar, alta para *encontrar*
**Por qué importa**: es el caso que Kairo está viviendo **hoy mismo**. El
guardián lleva desde el 20-11 midiendo que un desconocido no recibe respuesta, y
en `conocimiento/limites-y-cuotas.md` (24-11) quedó escrita esta pregunta como
hueco declarado: *"qué ve un usuario **con cuenta** cuando pasa lo mismo dentro
del chat. Es una pregunta abierta para un área 4"*. Esto la cierra.

---

## La pregunta del caso

No hay una pregunta concreta: **cualquiera**. Alguien con cuenta escribe lo que
sea en el chat y, por detrás, **todos los modelos de la cadena devuelven 429**.
Es lo que hoy devuelve producción:

```json
{"error":"sin_cerebros","intentos":["gemini:429","gemini:429","extra:429","extra:429"]}
```

Lo que importa de este caso no es qué contesta Kairo a la pregunta. Es **qué se
le dice a la persona cuando no hay nada que contestar**, y si eso es verdad.

## La buena noticia primero, porque no la esperaba

**El chat ya lo hacía bien, y mejor que la portada.** Trazado a mano
(`api/chat/route.ts`):

1. Los modelos se prueban todos una vez y, si todos fallan por saturación, se
   dan **tres vueltas** con esperas de 0, 1.200 y 3.000 ms (`VUELTAS`). No se
   insiste con el mismo modelo: *"cuando un modelo está saturado, el de al lado
   suele estar libre"*.
2. **Si ninguno escribe pero la búsqueda sí trajo resultados**, no se devuelve
   un error: se le enseñan los enlaces y se le dice la verdad —*"Ahora mismo
   todos mis modelos están saturados y no puedo redactarte una respuesta, pero
   sí he encontrado esto"*— y **no se cobra**. Eso es mejor de lo que yo iba a
   proponer.
3. Si no hay ni modelos ni fuentes, `throw ultimoFallo` sube al `catch`, que
   manda al cliente `clasificarError(e)` **y** los segundos de espera que pida
   el proveedor.
4. `clasificarError` gradúa el 429 en tres (`tipoDeCuota`): `cuota_minuto`,
   `cuota_dia` y `cuota_agotada`.

Y los tres tienen su texto, en los dos idiomas:

| Caso | Lo que lee la persona |
|---|---|
| `cuota_minuto` | *"Has llegado al límite de mensajes por minuto de la capa gratuita. No se ha perdido nada: espera un poco y dale a Reintentar."* |
| `cuota_dia` | *"Se ha agotado la cuota gratuita de hoy. Se renueva sola mañana. Tu pregunta queda guardada."* |

**Nada de esto culpa a la persona ni a su pregunta, y no se cobra.** Era lo que
había que comprobar y está bien.

## Lo que SÍ estaba mal, y es el hallazgo

**El tercer caso, `cuota_agotada`, mandaba a reintentar justo cuando reintentar
no puede funcionar.** Decía:

> *"Se ha agotado la cuota gratuita. Vuelve a probar dentro de un rato."*

Y ese es **exactamente el error que se arregló en la caja de la portada el
20-11**, cuando decía *"Prueba otra vez en un momento"* con la cuota del día
agotada. Sobrevivió aquí porque es una capa más abajo y porque el texto suena
razonable.

**Por qué "dentro de un rato" es la respuesta equivocada para este caso
concreto**, y esto es lo que hay que entender:

`cuota_agotada` no es "una cuota cualquiera". Es **el cajón**: un 429 en el que
el proveedor **no** ha dicho `per day`, **no** ha dicho `per minute` y **no** ha
pedido esperar unos segundos. Y esa última parte decide, porque
`tipoDeCuota` mira la espera **primero**: si el proveedor hubiera pedido
esperar ≤120 s, el clasificador ya habría devuelto `cuota_minuto`. O sea que
**el silencio del proveedor es una pista contra que sea un límite por minuto**,
y el texto estaba apostando precisamente a eso.

**Y la casa ya lo tenía decidido al revés, en dos sitios de tres:**

- `api/paperwork/route.ts:98` → `if (motivo === "cuota_dia" || motivo === "cuota_agotada") return fallo(429, "cuota_dia")`
- `api/gist/route.ts:111` → lo mismo, y con el motivo escrito al lado: *"la del
  minuto se arregla esperando, **la del día no se arregla hoy**, y lo de un
  vídeo privado no se arregla nunca"*.

**El chat era el único de los tres que seguía blando.** El cambio del 24-11 es
esa línea: el chat cuenta `cuota_agotada` como la del día, igual que sus dos
hermanos, y la persona lee *"Se ha agotado la cuota gratuita de hoy. Se renueva
sola mañana. Tu pregunta queda guardada."*

`err.cuota` se queda escrita en `i18n.tsx` —sin cablear y con el motivo al
lado—, no borrada, por si algún día hace falta un tercer grado que de verdad se
arregle esperando un rato.

**Comprobado en el paquete que se sirve al navegador**, no solo en el fuente:
`cuota_agotada"===e?"err.cuotaDia"`, una sola aparición y sin rastro del
emparejamiento viejo. `tsc` 0 y `next build` 0.

## La respuesta ideal, si alguien pregunta por esto

Si una persona pregunta *"¿por qué no me contestas?"* o *"¿me has cobrado?"*,
Kairo no tiene que inventarse una hora de vuelta:

- **Decir qué ha pasado**: se ha agotado la cuota gratuita del motor, no es su
  pregunta y no se ha perdido nada.
- **No prometer el minuto exacto de vuelta.** Kairo no sabe cuándo se le renueva
  la cuota —depende de la configuración de quien la lleva—, así que *"se renueva
  sola"* sí, *"en una hora"* no.
- **Decir que no se le ha cobrado**, porque es verdad: se cobra en la primera
  palabra escrita y aquí no se escribió ninguna.
- Si hubo búsqueda, **los enlaces van por delante del error**, que es lo que ya
  hace el código.

## Lo que este caso deja medido y lo que deja abierto

**Medido**: con cuenta, el chat dice la verdad en los tres grados de cuota, no
cobra, y guarda la pregunta. La avería de los textos estaba en la portada (20-11)
y en este cajón (hoy).

**Abierto, y lo dejo sin tocar a propósito** —un cambio al día—:

1. **`err.cuotaDia` dice "se renueva sola mañana", y eso es casi siempre verdad
   pero no siempre.** La cuota de Gemini se renueva a medianoche del Pacífico,
   o sea a las **09:00 en España** (`conocimiento/limites-y-cuotas.md`). Para
   alguien que se queda sin cuota a las 23:00, "mañana" es correcto; para
   alguien a las 08:00, la renovación es **en una hora** y "mañana" le quita las
   ganas de volver. Es una ventana estrecha y un arreglo honesto sería no dar
   plazo. Candidato a la próxima área 4.
2. **Qué ve quien NO tiene sesión dentro del chat** (no la caja de la portada):
   `fallo(401, "sin_sesion")`. No lo he seguido hasta la pantalla.
3. **Nada de esto se ha podido probar contra producción**, porque el chat pide
   cuenta y desde la sede no se abre la web. Está trazado leyendo el código y
   verificado en el paquete compilado, que es el estándar de esta casa, pero
   **no es lo mismo que haberlo visto en pantalla**.
