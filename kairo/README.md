# Kairo

> *"La IA que trabaja cuando tú no."*

**Pasos 1, 2 y 3 hechos.** Falta el Paso 4 (pagos).

La IA responde de verdad: el chat llama a Gemini desde el servidor, en
streaming, con el system prompt y los filtros de contenido que corresponden a
la edad del usuario. Los créditos se cobran en la base de datos cuando llega
el primer trozo de respuesta, así que un fallo del modelo nunca se cobra.

Claude y GPT todavía no están conectados: `lib/ia/config.ts` ya está preparado
para ellos, solo hay que añadir sus claves y sus modelos.

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

Para conectarlo de verdad, copia `.env.example` a `.env.local`, rellena las
variables y sigue [`supabase/README.md`](supabase/README.md). La clave de
Gemini se saca gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

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
- **La IA responde de verdad**, en streaming, con el tono que el usuario eligió
  y los filtros de contenido de su modo de edad.
- **El nivel decide el modelo y cuánto razona**: Rápido usa Flash-Lite sin
  razonamiento, Normal usa Flash, y MEGA usa Flash con el presupuesto de
  razonamiento al máximo.
- **Busca en internet antes de contestar y enseña de dónde lo ha sacado**:
  precios, horarios, direcciones y cualquier cosa que cambie salen del
  buscador, no de la memoria del modelo, y debajo de la respuesta queda la
  lista de páginas consultadas. Va incluido con la clave de Gemini.
- **Archivos**: imágenes, PDF y archivos de texto, con el clip, arrastrándolos
  encima o pegando una captura. Las fotos se encogen en el navegador antes de
  salir, y nada de eso se guarda en ningún servidor: se lee para responder y
  se tira.
- **Editar una pregunta ya enviada** y **regenerar** la última respuesta. Las
  dos rehacen la conversación desde ese punto, también en la base de datos.
- **Un nivel que el plan no incluye aparece bloqueado**, no da error después.
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
7. **`GEMINI_API_KEY` no lleva `NEXT_PUBLIC_`.** Solo la ve `/api/chat`, en el
   servidor. Si acabara en el navegador, cualquiera gastaría tu cuota.
8. **Los modelos se nombran con alias `-latest`.** Google renombra sus modelos
   cada pocos meses; con el alias el código no se rompe.

## Lo que falta

- **El clasificador automático**: que Kairo escoja el nivel solo, sin que el
  usuario toque el botón ⚡.
- **Team, Co-Works y Conectores**. Sus botones ya explican qué harán y a dónde
  ir mientras tanto, en vez de no hacer nada al pulsarlos.
- **Guardar los archivos adjuntos**. Hoy se leen para responder y no se
  guardan en ninguna parte; del historial queda solo su nombre.
