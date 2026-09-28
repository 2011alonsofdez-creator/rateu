# Co-Works · el agente que trabaja solo

Un Co-Work es un encargo con hora. Llega la hora y se hace, sin que haya
nadie delante. El primero que existe es el **Daily Brief**: cada día
busca en internet las novedades de los temas que le digas y te deja el
resumen escrito, con sus fuentes, y una conversación abierta en el chat
por si quieres seguir preguntando.

---

## Cómo funciona por dentro

```
   un reloj  ──POST──▶  /api/coworks/ejecutar
   (cada hora)                  │
                                ├─ 1. ¿Qué toca ahora?      coworks_pendientes()
                                ├─ 2. ¿Me lo quedo yo?      reservar_cowork()     ← el candado
                                ├─ 3. Buscar en internet    buscarHechos()
                                ├─ 4. Escribirlo            redactarBrief()
                                ├─ 5. Cobrar                gastar_creditos_de()
                                ├─ 6. Dejar la conversación conversaciones/mensajes
                                └─ 7. Apuntar qué pasó      terminar_cowork()
```

Las tres decisiones difíciles están en la base de datos y no en el
código, porque es el único sitio donde dos servidores a la vez se ponen
de acuerdo:

- **Qué toca** se calcula en la zona horaria de cada usuario. Un
  Co-Work de las 7:00 es a las 7:00 de quien lo creó, no del servidor.
- **Quién lo coge** lo decide una restricción `unique (cowork_id, dia)`.
  Si dos relojes suenan a la vez, uno se lleva el trabajo y el otro se va
  de vacío. Por eso tener dos disparadores es inofensivo.
- **Cuándo se cobra**: después de tener el texto escrito, nunca antes.
  Si la búsqueda falla, no se paga.

Y una regla que manda sobre todas: **si no se ha podido buscar, no se
escribe nada**. Un resumen diario inventado no es un resumen malo, es una
mentira automática que llega puntual cada mañana.

---

## Puesta en marcha (una sola vez)

### 1. La base de datos

Supabase → **SQL Editor** → pega entero
`kairo/supabase/migrations/0009_coworks.sql` → **Run**.

Se puede ejecutar dos veces sin romper nada.

### 2. Dos variables en Vercel

Vercel → tu proyecto → **Settings** → **Environment Variables**. Las dos
para **Production**:

| Variable | Valor | Para qué |
| --- | --- | --- |
| `CRON_SECRET` | una contraseña larga que te inventes | Sin ella, cualquiera podría llamar a la dirección del reloj en bucle y gastar los créditos de tus usuarios |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | El reloj no tiene sesión de nadie: necesita esta llave para leer los encargos de todos y apuntar lo que ha hecho |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **nunca** lleva `NEXT_PUBLIC_` delante.
> Ese prefijo la metería dentro del JavaScript que se descarga el
> navegador, y con ella cualquiera lee y borra los datos de todos.

Después de guardarlas: **Deployments → los tres puntitos del último →
Redeploy**. Las variables se aplican al construir.

### 3. El reloj

Hay dos, y no hacen daño el uno al otro.

**Vercel (ya puesto, no hay que tocar nada).** Está en
`kairo/vercel.json` y suena una vez al día a las 06:00 UTC. En el plan
gratuito de Vercel no se puede más a menudo, así que sirve para los
encargos de primera hora.

**GitHub Actions (opcional, gratis, recomendado).** Suena **cada hora**,
así que cualquier hora que elijas se cumple. Ya está el archivo
(`.github/workflows/kairo-coworks.yml`); solo faltan dos secretos:

GitHub → tu repositorio → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**:

| Secreto | Valor |
| --- | --- |
| `KAIRO_URL` | `https://tu-web.vercel.app` (sin barra al final) |
| `KAIRO_CRON_SECRET` | el mismo valor que pusiste en `CRON_SECRET` |

Para comprobarlo sin esperar: pestaña **Actions** → *Co-Works de Kairo* →
**Run workflow**. Si sale verde y dice `{"ok":true,...}`, está montado.

### 4. Probarlo de verdad

En Kairo → **Co-Works** → **Nuevo Co-Work** → escribe los temas →
**Crear** → **Probar ahora** (el botón ▶).

Tarda entre 15 y 30 segundos: está buscando en internet y escribiendo. Si
sale, está todo bien y mañana saldrá solo.

---

## Cuando algo no va

Llama tú mismo al reloj y lee lo que contesta:

```bash
curl -i -X POST \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-web.vercel.app/api/coworks/ejecutar
```

| Respuesta | Qué pasa |
| --- | --- |
| `{"ok":true,"mirados":0,...}` | Todo bien; ahora mismo no tocaba ninguno |
| `401 no_autorizado` | El `CRON_SECRET` de la llamada no es el de Vercel |
| `503 sin_cron_secret` | Falta la variable `CRON_SECRET` |
| `503 sin_clave` | Falta `SUPABASE_SERVICE_ROLE_KEY` |
| `503 sin_reparto` | Falta pegar la migración `0009_coworks.sql` |

Y en `/api/estado` sale si las claves han llegado, sin enseñar ninguna.

---

## Lo que cuesta

Un Co-Work gasta **4 créditos** al día, lo mismo que un mensaje normal,
porque es exactamente eso: una búsqueda y una respuesta. Si un día no
llegan los créditos, no se ejecuta, se apunta el motivo y al día
siguiente se vuelve a intentar.

El tope es de **10 Co-Works por cuenta**: algo que se ejecuta solo todos
los días sin que nadie lo mire necesita un techo.
