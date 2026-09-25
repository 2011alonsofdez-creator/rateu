# Cobrar en Kairo

Unos 30 minutos. Al terminar, alguien podrá pagar y su plan subirá solo.

**Mientras no hagas esto, la web funciona igual**: los botones de precios
llevan a crear una cuenta y no se rompe nada.

> **Antes de empezar.** Cobrar dinero de verdad trae obligaciones de
> verdad: facturas, impuestos, devoluciones y derecho de desistimiento.
> Lemon Squeezy actúa como vendedor (*merchant of record*) y se encarga
> del IVA por ti, pero **te va a pedir ser mayor de edad y dar tus datos
> fiscales**. Si todavía no lo eres, esto necesita a un adulto. Es una
> ley, no una pega mía, y el código de abajo funcionará igual el día que
> puedas activarlo.

---

## 1. La tienda (10 min)

1. Cuenta en [lemonsqueezy.com](https://lemonsqueezy.com) y crea una tienda.
2. **Products → New product** y crea seis:

   | Producto | Tipo | Precio |
   |---|---|---|
   | Kairo+ mensual | Subscription | 9,99 € / mes |
   | Kairo+ anual | Subscription | 99 € / año |
   | Supreme mensual | Subscription | 24,99 € / mes |
   | Supreme anual | Subscription | 249 € / año |
   | 500 créditos | Single payment | 5,99 € |
   | 2.000 créditos | Single payment | 19,99 € |

3. De cada uno necesitas **dos cosas**:
   - Su **enlace de compra** (botón *Share* → copiar la URL).
   - Su **número de variante**. Está en la dirección cuando abres la
     variante del producto, o en **Products → el producto → Variants**.

## 2. Las variables (5 min)

En **Vercel → Settings → Environment Variables**, todas en **las tres**
(Production, Preview, Development):

```
LEMON_CHECKOUT_PLUS            https://tu-tienda.lemonsqueezy.com/buy/...
LEMON_CHECKOUT_PLUS_ANUAL      ...
LEMON_CHECKOUT_SUPREME         ...
LEMON_CHECKOUT_SUPREME_ANUAL   ...
LEMON_CHECKOUT_PACK_500        ...
LEMON_CHECKOUT_PACK_2000       ...

LEMON_VARIANTE_PLUS            123456
LEMON_VARIANTE_PLUS_ANUAL      123457
LEMON_VARIANTE_SUPREME         123458
LEMON_VARIANTE_SUPREME_ANUAL   123459
LEMON_VARIANTE_PACK_500        123460
LEMON_VARIANTE_PACK_2000       123461
```

Tipo **Config** en todas. No son secretos.

## 3. La clave de administrador (2 min)

Esta sí es un secreto, y de los gordos.

En Supabase: **Project Settings → API → `service_role`**. Cópiala y ponla
en Vercel como:

```
SUPABASE_SERVICE_ROLE_KEY      (tipo Secret)
```

> ⚠️ Esa clave **se salta toda la seguridad de la base de datos**: quien
> la tenga lee y borra los datos de todos tus usuarios. Fíjate en que
> **no lleva `NEXT_PUBLIC_` delante** — ese prefijo la metería dentro del
> JavaScript que descarga cualquiera que visite tu web, y sería el final.
> La usa un solo archivo, `/api/pagos/webhook`, porque ahí no hay usuario
> con sesión: hay un aviso del banco y hay que cambiarle el plan a
> alguien. No la pegues en ningún otro sitio ni se la des a nadie.

## 4. El aviso de pago (5 min)

En Lemon Squeezy: **Settings → Webhooks → +**.

- **Callback URL:** `https://TU-WEB.vercel.app/api/pagos/webhook`
- **Signing secret:** inventa una contraseña larga y **guárdala**.
- **Eventos**, marca estos seis:
  - `order_created`
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_expired`
  - `subscription_payment_success`

Esa contraseña va a Vercel como:

```
LEMON_WEBHOOK_SECRET           (tipo Secret)
```

Tiene que ser **idéntica** en los dos sitios. Es lo único que separa un
aviso de pago de verdad de uno que se invente cualquiera.

**Redeploy.**

## 5. Comprobar antes de enseñar los botones (5 min)

1. Abre `/api/estado` y mira el apartado `pagos`. Las cuatro cosas tienen
   que estar puestas.
2. En Lemon Squeezy pon la tienda en **Test mode** y haz una compra con
   la tarjeta de prueba `4242 4242 4242 4242`.
3. En Supabase, **Table Editor**:
   - `suscripciones` → tiene que haber una fila con tu `perfil_id`.
   - `perfiles` → tu `plan` tiene que haber cambiado.
   - `movimientos` → el apunte de la recarga.
4. En Kairo, **Ajustes** → tiene que salir tu plan nuevo y el botón de
   **Gestionar o cancelar**.

Solo cuando eso funcione, añade:

```
NEXT_PUBLIC_TIENDA=1
```

y redespliega. Ahí ya aparecen los botones de comprar.

---

## Cómo está montado

**El navegador no toca el dinero.** Ni el plan, ni los créditos, ni el
estado de la suscripción. Esas columnas están fuera de su alcance desde
el primer día, y las funciones que las mueven están prohibidas para
`anon` y para `authenticated`: solo puede llamarlas el servidor con la
clave de administrador.

**Todo aviso se comprueba antes de hacer caso.** Se calcula la firma
sobre los bytes exactos que llegaron y se compara en tiempo constante.
Sin firma, con firma corta, con firma inventada o con una firma buena
pero de otro mensaje: 401 y a la basura.

**Un aviso repetido no cobra dos veces.** Cada uno deja su huella en
`eventos_pago` **antes** de aplicarse. Si algo falla a mitad, el reenvío
no se atiende y hay que arreglarlo a mano; al revés, un reenvío tras un
fallo tardío regalaría los créditos dos veces. De los dos errores, está
elegido el que no cuesta dinero.

**Cancelada no es lo mismo que vencida.** Cancelar significa que no se
renovará; sigues teniendo lo que pagaste hasta el día que termina. Solo
cuando el proveedor dice *expired* se baja a gratuito. Confundirlas es
quitarle a alguien algo que ya había pagado.

**Firmar no da créditos.** Los créditos se reponen cuando el proveedor
confirma que ha cobrado, no cuando alguien rellena un formulario.

**Los packs no caducan.** Van a `creditos_extra`, que la recarga mensual
no pisa. Y se gastan después de los del plan, no antes.
