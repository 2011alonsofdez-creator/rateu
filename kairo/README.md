# Kairo

> *"La IA que trabaja cuando tú no."*

**Paso 1 (interfaz) y Paso 2 (login, base de datos y créditos) hechos.**
Falta el Paso 3 (la IA) y el Paso 4 (pagos).

Todavía no se llama a ninguna IA ni hay ninguna clave de modelo: las respuestas
del chat son de ejemplo. Lo que ya es real son las cuentas, los perfiles y el
gasto de créditos.

**La app funciona con y sin Supabase.** Sin las variables de entorno arranca en
modo demo con datos de ejemplo, así que un despliegue nunca se queda en blanco
por una variable que falte. Para conectarla de verdad:
**[`supabase/README.md`](supabase/README.md)**.

La especificación completa del producto está en [`../docs/kairo/ESPECIFICACION.md`](../docs/kairo/ESPECIFICACION.md).

## Arrancarlo

```bash
npm install
npm run dev          # http://localhost:3000  (modo demo)
```

Para conectarlo a Supabase, copia `.env.example` a `.env.local`, rellena las dos
variables y sigue [`supabase/README.md`](supabase/README.md).

## Qué hay montado

| Ruta | Qué es |
|---|---|
| `/` | Landing: hero, los tres cerebros, funcionalidades y precios |
| `/precios` | Planes mensual/anual, packs de créditos y preguntas frecuentes |
| `/chat` | El chat: estado vacío con accesos rápidos, hilo de ejemplo y composer |
| `/mentes` | Galería de Mentes (los agentes personalizados) — v2 |
| `/coworks` | Trabajos programados — v2 |
| `/codigo` | Zona de programación — v2 |
| `/conectores` | Drive, Gmail, Calendar y GitHub — v2 |
| `/ajustes` | Tono de la IA, modo de edad, idioma, tema, plan y cuenta |
| `/entrar` | Login con correo o Google |
| `/registro` | Alta con fecha de nacimiento, que decide el modo de edad |
| `/bienvenida` | Pide la fecha a quien entró con Google |
| `/legal` | Los cuatro documentos legales, pendientes de redactar |

## Lo que ya funciona de verdad

- **Registro y login** con correo o Google. La fecha de nacimiento del formulario
  decide el modo de edad, y ese modo **solo se puede fijar una vez**.
- **Rutas protegidas**: sin sesión, `/chat` y compañía te mandan a `/entrar` y
  vuelven a donde ibas después de entrar.
- **Créditos reales**: el descuento lo hace la base de datos dentro de una
  transacción, con la fila bloqueada. Dos pestañas a la vez no pueden gastar el
  mismo crédito, y el navegador no puede tocar la columna `creditos`.
- **Selector ⚡ Rápido / Normal / MEGA** con el coste en créditos **visible antes de pulsar**.
- **Modal de "sin créditos"** cuando el nivel elegido cuesta más de lo que queda.
- **El tono elegido se guarda** en el perfil (lo usará el system prompt en el Paso 3).
- **Español e inglés** completos, y **tema oscuro y claro** sin parpadeo al cargar.
- **Responsive**: en móvil la barra lateral pasa a menú deslizante.

## Estructura

```
supabase/
  README.md               Guía de conexión, 10 minutos
  migrations/
    0001_esquema.sql      Tablas, RLS, permisos y funciones
    0002_recarga_diaria.sql  Recarga del plan gratuito con pg_cron
src/
  proxy.ts                Refresca la sesión y protege las rutas
  app/
    layout.tsx            Tema, idioma y fuentes
    page.tsx              Landing
    precios/  legal/
    auth/callback/        Aterrizaje de Google y de la confirmación por correo
    (auth)/               Pantallas de acceso, sin barra lateral
      entrar/  registro/  bienvenida/
    (app)/                Todo lo que va con barra lateral
      layout.tsx          Carga el perfil en el servidor
      actions.ts          gastarCreditos, guardarAjustes, cerrarSesion
      chat/  mentes/  coworks/  codigo/  conectores/  ajustes/
  components/             AppShell, Sidebar, Composer, Markdown, iconos...
  lib/
    i18n.tsx              Textos en es/en + tema
    planes.ts             Constantes y tipos de plan (sirve a los dos lados)
    perfil.ts             Lee el perfil (solo servidor)
    credits.tsx           Estado de créditos compartido
    supabase/             Clientes de navegador y de servidor
    mock.ts               Datos de ejemplo del modo demo
```

## Decisiones que conviene no deshacer

1. **Los colores son variables CSS**, no clases `dark:`. Cambiar de tema no toca ni un
   componente.
2. **Todos los textos de la interfaz viven en `lib/i18n.tsx`.** Añadir un idioma es
   añadir una clave.
3. **El markdown se pinta como texto, nunca con `innerHTML`.** En el Paso 3 el contenido
   vendrá del modelo, y ahí esto deja de ser un detalle.
4. **El navegador nunca decide nada que cueste dinero.** El plan, los créditos y el modo
   de edad se leen siempre de la base de datos. La comprobación del navegador solo evita
   viajes al servidor; la que manda está en `gastar_creditos`.
5. **`getUser()`, nunca `getSession()`** en el servidor. El primero valida el token
   contra Supabase; el segundo se limita a leer una cookie que el usuario controla.
6. **La clave `service_role` no aparece en el proyecto.** Si algún día hace falta, va en
   una variable de servidor y jamás en un archivo que empiece por `NEXT_PUBLIC_`.

## Siguiente paso

El **Paso 3** (el router multi-modelo y la moderación por edad) está escrito y listo
para pegar en `../docs/kairo/ESPECIFICACION.md`, sección 7.
