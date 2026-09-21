# Kairo — Paso 1: interfaz

> *"La IA que trabaja cuando tú no."*

Interfaz completa de Kairo con datos de ejemplo. **No hay backend, ni login, ni
llamadas a ninguna IA, ni una sola clave de API.** Eso llega en los pasos 2, 3 y 4.

La especificación completa del producto está en [`../docs/kairo/ESPECIFICACION.md`](../docs/kairo/ESPECIFICACION.md).

## Arrancarlo

```bash
npm install
npm run dev          # http://localhost:3000
```

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
| `/legal` | Los cuatro documentos legales, pendientes de redactar |

## Lo que ya funciona de verdad

- **Selector ⚡ Rápido / Normal / MEGA** con el coste en créditos **visible antes de pulsar**.
- **Descuento de créditos** al enviar, compartido entre la barra lateral y el chat.
- **Modal de "sin créditos"** cuando el nivel elegido cuesta más de lo que queda.
- **Español e inglés** completos, y **tema oscuro y claro** sin parpadeo al cargar.
- **Responsive**: en móvil la barra lateral pasa a menú deslizante.

## Estructura

```
src/
  app/
    layout.tsx            Tema, idioma y fuentes
    page.tsx              Landing
    precios/  legal/
    (app)/                Todo lo que va con barra lateral
      layout.tsx          Shell + proveedor de créditos
      chat/  mentes/  coworks/  codigo/  conectores/  ajustes/
  components/             Sidebar, Composer, Markdown, iconos...
  lib/
    i18n.tsx              Textos en es/en + tema
    credits.tsx           Estado compartido de créditos
    mock.ts               Datos de ejemplo (se borran en el Paso 2)
```

## Decisiones que conviene no deshacer

1. **Los colores son variables CSS**, no clases `dark:`. Cambiar de tema no toca ni un
   componente.
2. **Todos los textos viven en `lib/i18n.tsx`.** Añadir un idioma es añadir una clave.
3. **El markdown se pinta como texto, nunca con `innerHTML`.** En el Paso 3 el contenido
   vendrá del modelo, y ahí esto deja de ser un detalle.
4. **Los créditos se comprueban antes de gastar.** Ahora es una comprobación de adorno en
   el navegador; en el Paso 3 esa misma comprobación se hace en el servidor, que es donde
   cuenta.

## Siguiente paso

El **Paso 2** (login y base de datos con Supabase) está escrito y listo para pegar en
la especificación, sección 7.
