# Conectar Kairo con Supabase

Unos 10 minutos. Al terminar tendrás registro, login, perfiles y créditos
reales funcionando.

**Mientras no hagas esto, la app funciona igual en modo demo**, con datos de
ejemplo. No se rompe nada por dejarlo para otro día.

---

## 1. Crear el proyecto (2 min)

1. Entra en [supabase.com](https://supabase.com) → **Start your project** (gratis).
2. **New project**. Ponle de nombre `kairo`.
3. **Guarda la contraseña de la base de datos** que te genera. No se vuelve a mostrar.
4. En *Region* elige la más cercana a tus usuarios: para España, **West EU (Ireland)**.
5. Espera al aviso de que está listo (~2 min).

## 2. Copiar las dos claves (1 min)

Ve a **Project Settings → API** (en los paneles nuevos, *Data API*) y copia:

| Lo que ves | Dónde va |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / public** (o *Publishable key*) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> ⚠️ En esa misma página hay una clave **`service_role`**. **No la copies a ningún
> sitio.** Esa clave se salta toda la seguridad de la base de datos; si acaba en
> el navegador, cualquiera puede leer y borrar todos los datos de todos tus
> usuarios. Kairo no la usa en ninguna parte.

## 3. Poner las variables

**En Vercel:** Settings → Environment Variables → añade las dos → **Redeploy**.

**En tu ordenador:** copia `.env.example` a `.env.local` y rellénalo.

## 4. Crear las tablas (2 min)

En Supabase, **SQL Editor** → **New query**:

1. Pega entero el contenido de `migrations/0001_esquema.sql` → **Run**.
   Verás algunos avisos de *"does not exist, skipping"*: son normales la primera vez.
2. Nueva consulta, pega `migrations/0002_recarga_diaria.sql` → **Run**.
3. Nueva consulta, pega `migrations/0003_mentes.sql` → **Run**.
4. Nueva consulta, pega `migrations/0004_mentes_mas_texto.sql` → **Run**.
5. Nueva consulta, pega `migrations/0005_historial.sql` → **Run**.
6. Nueva consulta, pega `migrations/0006_pagos.sql` → **Run**.
7. Nueva consulta, pega `migrations/0007_fuentes.sql` → **Run**.

Los siete archivos se pueden ejecutar varias veces sin romper nada.

## 5. Activar la recarga diaria (1 min)

El archivo 0002 te habrá avisado de que falta `pg_cron`:

1. **Database → Extensions** → busca **`pg_cron`** → **Enable**.
2. Vuelve al SQL Editor y ejecuta `0002_recarga_diaria.sql` otra vez.
3. Ahora dirá *"Recarga diaria programada a las 03:00 UTC"*.

## 6. Ajustar las direcciones de retorno (1 min)

**Authentication → URL Configuration**:

- **Site URL**: la de tu web (`https://kairo-algo.vercel.app`).
- **Redirect URLs**, añade las dos:
  ```
  https://tu-dominio.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

Sin esto, al confirmar el correo o entrar con Google te devuelve a una página
de error.

## 7. Entrar con Google (opcional, 5 min)

Solo si quieres el botón de Google. El registro con correo funciona sin esto.

1. En [Google Cloud Console](https://console.cloud.google.com) crea un proyecto.
2. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**.
3. Tipo *Aplicación web*. En **URI de redirección autorizados** pon exactamente:
   ```
   https://TU-REFERENCIA.supabase.co/auth/v1/callback
   ```
   (la referencia es la parte del medio de tu Project URL)
4. Copia el *Client ID* y el *Client Secret*.
5. En Supabase: **Authentication → Providers → Google** → pégalos → **Enable**.

## 8. Comprobar que funciona

1. Abre tu web y entra en **Crear cuenta**.
2. Regístrate con una fecha de nacimiento de mayor de edad.
   - Si tienes la confirmación por correo activada (viene activada), abre el
     enlace que te llegue. Para hacer pruebas más rápido puedes desactivarla en
     **Authentication → Sign In / Providers → Email → Confirm email**.
3. En **Table Editor → perfiles** debe haber aparecido tu fila, con
   `plan = free`, `creditos = 15` y `modo_edad = adulto`.
4. En el chat, envía un mensaje. Los créditos deben bajar **en la tabla**, no
   solo en pantalla. Recarga la página: el número se mantiene.
5. En **Table Editor → movimientos** tiene que estar el apunte del gasto.
6. Ve a **Mentes**, crea una desde una plantilla y guárdala. Tiene que aparecer
   en **Table Editor → mentes** con tu `perfil_id`. Vuelve al chat, elígela en el
   botón del cerebro y pregúntale algo: debe responder según sus instrucciones.
7. Escribe un mensaje en el chat y **recarga la página**. La conversación tiene
   que seguir ahí, en la barra lateral y en pantalla. En **Table Editor →
   conversaciones** estará la fila, y en **mensajes** los dos mensajes.

### Prueba de seguridad (recomendada)

Crea una segunda cuenta y comprueba que no ve nada de la primera. Y en el SQL
Editor, ejecuta esto **estando en la consola como usuario autenticado no es
posible**, pero sí puedes verificar desde la app: abre la consola del navegador
(F12) y prueba a subirte los créditos. Debe fallar:

```js
const { error } = await supabase.from('perfiles')
  .update({ creditos: 999999 }).eq('auth_id', (await supabase.auth.getUser()).data.user.id)
console.log(error)   // permission denied for column creditos
```

Si eso **no** da error, algo ha ido mal con el archivo 0001: vuelve a ejecutarlo.

---

## Cómo está montada la seguridad

Tres capas, y hacen falta las tres:

1. **Seguridad a nivel de fila (RLS).** Decide *qué filas* ve cada uno. Sin ella,
   la clave pública deja leer la base de datos entera.
2. **Permisos por columna.** Deciden *qué columnas* se pueden escribir. La
   política deja al usuario editar su propia fila; el permiso impide que esa
   edición toque `creditos`, `creditos_extra` o `plan`.
3. **Funciones del servidor.** `gastar_creditos` y `completar_perfil` corren con
   permisos elevados y hacen la comprobación dentro de la transacción. Ninguna
   recibe el identificador del usuario: lo deducen de la sesión, así que no hay
   manera de operar sobre la cuenta de otro.

Un detalle que parece menor y no lo es: **el modo de edad solo se puede fijar una
vez**. Si fuera un campo editable como los demás, un adolescente se pondría en
modo adulto desde la consola del navegador y se saltaría toda la moderación que
se montará en el Paso 3.

## Archivos

| Archivo | Qué hace |
|---|---|
| `migrations/0001_esquema.sql` | Tablas, RLS, permisos, `gastar_creditos`, `completar_perfil` y el disparador que crea el perfil al registrarse |
| `migrations/0002_recarga_diaria.sql` | `recargar_creditos_free` y la tarea diaria de pg_cron |
| `migrations/0003_mentes.sql` | La tabla `mentes`, su RLS, el tope de 30 por persona y el vínculo con `conversaciones` |
| `migrations/0004_mentes_mas_texto.sql` | Sube las instrucciones de una Mente a 12.000 caracteres y la descripción a 300 |
| `migrations/0005_historial.sql` | Arregla los niveles de `mensajes`, ordena las conversaciones por actividad y las sube solas con cada mensaje |
| `migrations/0006_pagos.sql` | `suscripciones`, `eventos_pago` y las funciones que mueven plan y créditos. Ninguna la puede llamar el navegador |
| `migrations/0007_fuentes.sql` | Guarda con cada respuesta las páginas que Kairo consultó, para que las fuentes sigan ahí al reabrir la conversación |
