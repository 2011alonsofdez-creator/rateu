# Kairo — Especificación del producto

> *"La IA que trabaja cuando tú no."*
> Documento de construcción. Versión 1.0 — 21 de septiembre de 2026.

---

## 1. Ficha del producto

| | |
|---|---|
| **Nombre** | Kairo |
| **Eslogan** | La IA que trabaja cuando tú no. |
| **Qué es** | Un asistente de IA conversacional que por dentro usa **Claude, Gemini y GPT a la vez** y elige automáticamente el mejor modelo para cada tarea. |
| **Para quién** | Público general de todo el mundo, con tres modos de edad: niños, adolescente y adulto. |
| **Entra** | Texto, archivos (PDF, Word, Excel, imágenes), voz y datos de apps conectadas. |
| **Sale** | Respuestas, código, documentos, imágenes y tareas ejecutadas automáticamente. |
| **Diferencial** | **Co-Works programados**: trabajos de IA que se ejecutan solos a una hora fija, sin que el usuario esté delante. |
| **Idiomas** | Interfaz en español e inglés. La IA responde en cualquier idioma. |
| **Plataforma** | Web responsive (móvil y escritorio). Apps nativas en la v3. |

### El concepto: el router multi-modelo

No se entrena un modelo propio — eso cuesta cientos de millones. Kairo **enruta** cada
petición al modelo que mejor la resuelve y presenta el resultado como una sola IA.
Esto es técnicamente sencillo, económicamente viable y es el argumento de venta:

> *Una suscripción. Los tres cerebros. Tú no eliges: Kairo elige por ti.*

| Tipo de tarea | Modelo al que enruta | Por qué |
|---|---|---|
| Saludo, pregunta corta, reformular | Nivel **Rápido** (Gemini Flash / Haiku / GPT mini) | Cuesta ~0,003 € y responde al instante |
| Conversación normal, redactar, resumir | Nivel **Estándar** (Sonnet / Gemini Pro / GPT medio) | Equilibrio calidad-precio |
| Programar, analizar documentos largos, razonar | Nivel **Máximo** (Opus / GPT tope de gama) | Calidad máxima, ~0,06 € por mensaje |
| Imagen | Gemini Image / fal.ai | Coste bajo por imagen |
| Voz | OpenAI Realtime / ElevenLabs | Latencia baja y voces naturales |
| **Mega-Prompt** | Los tres en paralelo + síntesis | La respuesta definitiva. ~0,36 € por uso |

**Clasificador de router:** un modelo rápido y barato lee la petición y devuelve
`{nivel: "rapido"|"estandar"|"maximo", motivo: "..."}`. Si el clasificador duda, sube
un nivel. El usuario siempre puede forzar el nivel a mano desde el botón ⚡.

---

## 2. Funcionalidades

### MVP (versión 1 — esto es lo que se construye ahora)

- [ ] Registro y login (email + Google)
- [ ] Chat en tiempo real con respuesta en streaming
- [ ] **Router multi-modelo** con selector manual ⚡ Rápido / Normal / Mega-Prompt
- [ ] Subida de archivos (PDF, imagen, Word, Excel) y lectura de su contenido
- [ ] Historial de conversaciones, renombrar y borrar
- [ ] Sistema de créditos con descuento atómico en servidor
- [ ] Tres planes: Free / Kairo+ / Supreme, con pasarela de pago
- [ ] **Tres modos de edad** con filtros de moderación distintos
- [ ] Selector de tono de la IA (lo elige el usuario en ajustes)
- [ ] Páginas legales, precios, error y estado vacío
- [ ] Interfaz en español e inglés

### Versión 2 (después de los primeros usuarios que paguen)

- [ ] **Co-Works programados** — la función estrella
- [ ] **Mentes** — agentes personalizados (el equivalente a los GPTs)
- [ ] Conectores: Google Drive, Gmail, Google Calendar, GitHub
- [ ] Zona de programación: editor de código, ejecutar, conectar repositorio
- [ ] Generación de imágenes
- [ ] Memoria entre conversaciones

### Versión 3 (cuando haya ingresos que lo paguen)

- [ ] Apps nativas iOS y Android
- [ ] Modo voz en tiempo real
- [ ] Tienda pública de Mentes con reparto de ingresos para sus creadores
- [ ] API para desarrolladores
- [ ] Planes para equipos y empresas

> **Regla de oro:** no se empieza la v2 hasta que la v1 funcione y alguien haya pagado.
> Construir las tres versiones a la vez es la forma más habitual de no terminar ninguna.

---

## 3. Monetización

### Los planes

| | **Free** | **Kairo+** | **Supreme** |
|---|---|---|---|
| **Precio** | 0 € | **9,99 €/mes** | **24,99 €/mes** |
| Créditos | 15 al día | 1.000 al mes | 3.000 al mes |
| Modelos | Solo Rápido | Rápido + Estándar | Los tres, incluido Máximo |
| Mega-Prompt | ❌ | 8 al mes | 25 al mes |
| Co-Works activos | ❌ | 3 | Ilimitados |
| Conectores | 1 | 5 | Todos |
| Mentes propias | 1 | 10 | Ilimitadas |
| Archivos | 5 MB | 25 MB | 100 MB |
| Historial | 30 días | Completo | Completo |
| Soporte | Comunidad | Email | Email prioritario |

**Anual con 2 meses gratis:** Kairo+ 99 €/año · Supreme 249 €/año.

### Tabla de consumo de créditos

| Acción | Créditos | Coste real para ti |
|---|---|---|
| Mensaje rápido | 1 | ~0,003 € |
| Mensaje estándar | 4 | ~0,012 € |
| Mensaje máximo (con razonamiento) | 20 | ~0,060 € |
| Generar imagen | 20 | ~0,060 € |
| Analizar documento largo | 15 | ~0,045 € |
| Co-Work ejecutado | 40 | ~0,120 € |
| **Mega-Prompt** | **120** | **~0,360 €** |

**Packs extra:** 500 créditos → 5,99 € · 2.000 créditos → 19,99 €
(los créditos comprados no caducan; los del plan se renuevan cada mes y no se acumulan).

### Por qué estos números

1 crédito ≈ **0,003 € de coste real**, y el precio al usuario es de ~0,010 €/crédito:
**margen mínimo x3**.

| Plan | Ingreso | Coste en el peor caso | **Margen mínimo garantizado** |
|---|---|---|---|
| Free | 0 € | 1,35 €/mes | — (coste de captación) |
| Kairo+ | 9,99 € | 3,00 € | **70%** |
| Supreme | 24,99 € | 9,00 € | **64%** |

**Los créditos son un tope duro.** Aunque un usuario gaste hasta el último crédito,
sigues ganando dinero. Es imposible que un cliente te deje en pérdidas — ese es
justamente el motivo de usar créditos en vez de "ilimitado".

### Control del coste del plan gratuito

El plan Free es el único que puede sangrar. Protecciones obligatorias:

1. Solo modelo Rápido, nunca Estándar ni Máximo.
2. 15 créditos al día, no mensuales (reparte el gasto y da motivo para volver a diario).
3. Verificación de email obligatoria antes del primer mensaje (mata el registro masivo).
4. Límite por IP: máximo 3 cuentas gratuitas.
5. **Tope de gasto global mensual en el panel de cada proveedor de API.** Si se
   alcanza, el plan Free se pausa y los de pago siguen funcionando.

### Avisos legales sobre el cobro

- **Para cobrar hace falta ser mayor de edad** y tener cuenta verificada en la pasarela.
  Si no es el caso: lanzar gratis y activar los pagos más adelante, o ponerlo a nombre
  de un familiar mayor de edad (con un acuerdo claro por escrito).
- **Vendiendo al mundo entero, el IVA de cada país es inmanejable.** Usa
  **Lemon Squeezy** o **Paddle**: son *merchant of record*, venden legalmente por ti y
  liquidan los impuestos. Cobran ~5% frente al ~2,9% de Stripe y te ahorran el problema.
- **El modo niños es lo más delicado de todo el proyecto.** Un menor no puede tener
  cuenta propia con datos personales sin consentimiento verificable de un adulto
  (RGPD en Europa, COPPA en EE.UU.). **Diseño obligatorio: el modo niños es un perfil
  hijo dentro de la cuenta de un adulto, nunca una cuenta independiente.**

---

## 4. Estructura: pantallas y botones

### Esqueleto (Opción A — chat central)

```
┌──────────────┬────────────────────────────────────┐
│ ✦ Kairo      │                                    │
│ ＋ Nuevo chat│        ¿En qué trabajamos hoy?     │
│──────────────│                                    │
│ 💬 Chats     │   [💬 Chat] [🧠 Mentes] [⏰ Co-Work]│
│ 🧠 Mentes    │   [💻 Código] [🎨 Imagen]          │
│ ⏰ Co-Works  │                                    │
│ 💻 Código    │ ┌────────────────────────────────┐ │
│ 🔌 Conectores│ │ Escribe aquí...                │ │
│──────────────│ │ 📎  🎤    ⚡Rápido▾      ➤     │ │
│ ⚡ 840 créd. │ └────────────────────────────────┘ │
│ 👤 Alonso    │        ⚡Rápido · Normal · MEGA    │
└──────────────┴────────────────────────────────────┘
```

### Pantallas

| Pantalla | Contiene |
|---|---|
| **Landing** | Eslogan, los 3 cerebros, demo del chat, precios, testimonios, pie legal |
| **Registro / Login** | Email + Google. **Pregunta la fecha de nacimiento** (decide el modo por defecto) |
| **Chat** | Barra lateral + hilo de mensajes + caja de texto |
| **Mentes** | Galería de Mentes + botón "Crear Mente" (nombre, icono, instrucciones, archivos) |
| **Co-Works** | Lista de trabajos programados, botón "Nuevo Co-Work", historial de ejecuciones |
| **Código** | Editor, botón ejecutar, panel de salida, conectar repositorio |
| **Conectores** | Tarjetas con botón "Conectar" / "Desconectar" por servicio |
| **Precios** | Los 3 planes + packs de créditos + preguntas frecuentes |
| **Ajustes** | Perfil, **tono de la IA**, idioma, modo de edad, perfiles hijo, facturación, borrar cuenta |
| **Panel familiar** | Solo adultos: crear perfil hijo, ver su uso, ajustar restricciones |
| **Legales** | Aviso legal, privacidad, cookies, términos |
| **Error / Vacío** | 404, error de servidor, "sin créditos", "aún no tienes chats" |

### Botones clave y su comportamiento

| Botón | Qué hace |
|---|---|
| **➤ Enviar** | Envía. Deshabilitado si no hay créditos → abre el modal de mejora de plan |
| **⚡ Selector** | Rápido (1 cr) / Normal (4 cr) / **MEGA (120 cr)**. Muestra el coste **antes** de pulsar |
| **📎 Adjuntar** | Sube archivo. Valida tamaño según el plan |
| **🎤 Voz** | Dicta el mensaje (v2) |
| **🔄 Regenerar** | Repite la respuesta. **Cobra créditos otra vez** — avísalo |
| **📋 Copiar / ⬇ Descargar** | En cada respuesta y bloque de código |
| **⚡ 840 créditos** | Abre el desglose de gasto y los packs extra |

### Los tres modos de edad

| | 🧒 **Niños (hasta 12)** | 🧑 **Adolescente (13–17)** | 👤 **Adulto (18+)** |
|---|---|---|---|
| Creación | Solo como perfil hijo de un adulto | Perfil hijo, o cuenta propia con consentimiento | Cuenta propia |
| Interfaz | Colores vivos, letra grande, iconos | Estándar con avisos suaves | Completa |
| Moderación | Estrictísima, entrada **y** salida | Alta | Estándar |
| Temas | Solo educativo, creativo y ocio sano | Sin contenido adulto, drogas ni autolesión | Todo lo legal |
| Módulos | Solo Chat e Imagen | Chat, Imagen, Código | Todos |
| Conectores | ❌ | Con permiso del adulto | ✅ |
| Datos | Mínimos, sin publicidad, sin entrenamiento | Mínimos | Estándar |
| Extra | Historial visible para el adulto responsable | Avisa al adulto ante señales de riesgo | — |

**Siempre, en los tres modos:** si aparece cualquier señal de autolesión, abuso o
peligro, Kairo corta la conversación normal y muestra el teléfono de ayuda del país
del usuario. Esto no es opcional y no depende del modelo — se implementa como
comprobación propia antes y después de cada respuesta.

---

## 5. Stack técnico

| Pieza | Herramienta | Coste de partida |
|---|---|---|
| Frontend | Next.js + Tailwind | Gratis |
| Alojamiento | Vercel | Gratis hasta escalar |
| Login + BD + archivos + cron | **Supabase** | Gratis hasta 500 MB |
| Cerebro | API de Anthropic + Google + OpenAI | Pago por uso |
| Imagen | Gemini Image / fal.ai | Pago por uso |
| Voz (v3) | ElevenLabs / OpenAI Realtime | Pago por uso |
| Moderación | OpenAI Moderation | **Gratis** |
| Pagos | **Lemon Squeezy** | ~5% por venta |
| Email | Resend | Gratis hasta 3.000/mes |
| Analítica | Plausible | ~9 €/mes (o Google Analytics gratis) |

### Dónde va cada clave

🔐 **Ninguna clave de API va nunca en el navegador.** Si una clave acaba en el
frontend, cualquiera la extrae en 30 segundos y te gasta miles de euros en una noche.

| Clave | Dónde vive | Quién la usa |
|---|---|---|
| `ANTHROPIC_API_KEY` | Variable de entorno del servidor | Edge function `chat` |
| `GOOGLE_AI_API_KEY` | Variable de entorno del servidor | Edge function `chat` |
| `OPENAI_API_KEY` | Variable de entorno del servidor | Edge functions `chat` y `moderar` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor, jamás en el cliente** | Descuento de créditos |
| `SUPABASE_ANON_KEY` | Sí puede ir en el frontend | Login del usuario |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Variable de entorno del servidor | Verificar cada webhook |
| Tokens OAuth de conectores | Tabla `conectores`, **cifrados** | Edge functions de cada conector |

### Base de datos (Supabase)

```sql
perfiles          id, auth_id, nombre, email, plan, creditos, creditos_extra,
                  modo_edad, tono, idioma, adulto_responsable_id, renueva_el
conversaciones    id, perfil_id, titulo, mente_id, creada_el
mensajes          id, conversacion_id, rol, contenido, modelo_usado,
                  nivel, creditos_gastados, tokens_in, tokens_out
mentes            id, perfil_id, nombre, icono, instrucciones, archivos, es_publica
coworks           id, perfil_id, nombre, prompt, cron, activo, ultima_ejecucion
cowork_runs       id, cowork_id, estado, resultado, creditos_gastados, ejecutado_el
movimientos       id, perfil_id, tipo, creditos, motivo, creado_el
conectores        id, perfil_id, servicio, token_cifrado, scopes, caduca_el
suscripciones     id, perfil_id, plan, estado, ls_subscription_id, renueva_el
```

### Reglas de seguridad no negociables

1. **RLS activado en todas las tablas.** Cada usuario solo ve sus filas. Sin excepción.
2. **Los créditos se descuentan en el servidor, en la misma transacción que la llamada**,
   con una función SQL atómica. Nunca desde el cliente, nunca "después".
3. **Límite de peticiones:** 20/min por usuario, 60/min por IP.
4. **Moderación de entrada y salida** en modos niños y adolescente, siempre.
5. **Webhook de pagos con firma verificada.** Sin verificar la firma, cualquiera puede
   regalarse el plan Supreme con una petición.
6. **Tope de gasto mensual** configurado en el panel de cada proveedor de API.
7. **Nunca confíes en lo que llega del cliente**: el plan, los créditos y el modo de
   edad se leen siempre de la base de datos, jamás del navegador.

---

## 6. System prompt de Kairo

### Base (en los tres modos)

```
Eres Kairo, un asistente de IA. Tu lema: "La IA que trabaja cuando tú no."

IDENTIDAD
- Te llamas Kairo. No reveles qué modelo o proveedor hay por detrás.
  Si preguntan, di: "Soy Kairo. Uso varios motores y elijo el mejor para cada tarea."
- Hablas el idioma del usuario. Por defecto, español.
- Tu tono es: {TONO_ELEGIDO}. Mantenlo en toda la conversación.

CÓMO RESPONDES
- Ve al grano. Nada de preámbulos tipo "¡Qué buena pregunta!".
- Respuesta corta para preguntas cortas; desarrolla solo si hace falta.
- Usa listas y tablas cuando aclaren; no las uses por rellenar.
- El código siempre en bloque, con el lenguaje indicado y listo para copiar.
- Si no sabes algo o puede haber cambiado, dilo. Nunca te lo inventes.
- Si la petición es ambigua y las interpretaciones cambian el resultado, pregunta.
  Si no, elige la más razonable y avisa de lo que has supuesto.

LÍMITES
- No des consejo médico, legal ni financiero personalizado: informa y recomienda acudir
  a un profesional.
- No ayudes con nada ilegal ni con contenido que dañe a una persona concreta.
- No pidas ni guardes contraseñas, tarjetas ni documentos de identidad.
- Si detectas señales de autolesión, abuso o peligro inmediato, deja todo lo demás,
  responde con calma y ofrece el teléfono de ayuda del país del usuario.

QUÉ NO HACES NUNCA
- No te disculpas una y otra vez. Corriges y sigues.
- No repites la pregunta del usuario antes de contestar.
- No rellenas con avisos innecesarios ni con "como modelo de lenguaje...".
- No prometes tareas que no puedes ejecutar. Si no puedes, lo dices.
```

### Añadido en modo 🧒 Niños

```
Hablas con un niño de 12 años o menos.
- Frases cortas, palabras sencillas, ejemplos con cosas que conozca.
- Tono amable y animado. Puedes usar algún emoji.
- SOLO temas educativos, creativos y de ocio sano. Nada de violencia, miedo, sexo,
  drogas, política de adultos, dinero real ni datos personales.
- Si pregunta algo que no toca, no le riñas: redirige con naturalidad hacia algo útil
  y propón otra cosa divertida.
- Nunca pidas datos personales: ni nombre completo, ni colegio, ni dirección, ni foto.
- Si cuenta algo que preocupa (le hacen daño, está triste de forma persistente, alguien
  desconocido le habla), dile con calma que hable con un adulto de confianza.
- Anímale a pensar por sí mismo: si es un deber, guíale con pistas, no le des la
  respuesta hecha.
```

### Añadido en modo 🧑 Adolescente

```
Hablas con alguien de entre 13 y 17 años.
- Trátale con respeto, sin hablarle como a un niño pequeño y sin sermones.
- Nada de contenido sexual, drogas, alcohol, apuestas, armas ni autolesión.
- Con estudios: ayuda a entender y a aprender. Si te piden que hagas el trabajo entero,
  explícale por qué no te parece buena idea y ofrécele hacerlo con él.
- Si habla de ansiedad, acoso o tristeza persistente, escúchale, valídale y recomiéndale
  hablar con un adulto de confianza o con un profesional. Si hay riesgo real, da el
  teléfono de ayuda.
- Con dinero y contratos: informa, pero recuérdale que es menor y necesita a un adulto.
```

### Instrucción del router (modelo clasificador)

```
Clasifica esta petición del usuario. Responde SOLO con JSON, sin nada más:
{"nivel": "rapido" | "estandar" | "maximo", "motivo": "<5 palabras>"}

rapido   → saludo, pregunta corta y factual, reformular, traducir, continuar charla
estandar → redactar, resumir, explicar, conversación con contexto, dudas generales
maximo   → programar, depurar, analizar documentos largos, razonamiento en varios
           pasos, matemáticas, decisiones importantes, cualquier cosa larga o compleja

Ante la duda, sube un nivel. Nunca expliques tu decisión: solo el JSON.
```

---

## 7. Prompt para construirla con Claude Code

Cuatro pasos. **No pegues los cuatro de golpe**: termina uno, compruébalo, y pasa al
siguiente. Es la diferencia entre una app que funciona y un montón de código roto.

### Paso 1 — Estructura y diseño

```
Crea un proyecto Next.js 15 con App Router, TypeScript y Tailwind llamado "kairo".

Es un asistente de IA conversacional. Diseño: modo oscuro por defecto con selector de
tema claro, moderno y limpio (referencia visual: Claude y Linear), esquinas redondeadas,
tipografía Inter, color de acento violeta-cian.

Construye SOLO la interfaz con datos falsos, sin backend todavía:

1. Landing en "/" con: cabecera con logo Kairo y botones Entrar/Empezar gratis, un hero
   con el eslogan "La IA que trabaja cuando tú no", una sección que explique los tres
   cerebros (Claude, Gemini, GPT) y que Kairo elige el mejor para cada tarea, una
   sección de funcionalidades, la tabla de precios (Free 0 € / Kairo+ 9,99 € /
   Supreme 24,99 €) y un pie con enlaces legales.

2. App en "/chat" con esta estructura:
   - Barra lateral izquierda plegable: logo, botón "Nuevo chat", lista de chats
     recientes, navegación (Chats, Mentes, Co-Works, Código, Conectores), y abajo del
     todo el contador "⚡ 840 créditos" y el perfil del usuario.
   - Centro: hilo de mensajes con burbujas de usuario y de Kairo, avatar, botones de
     copiar y regenerar en cada respuesta de Kairo, y renderizado de markdown con
     bloques de código con resaltado.
   - Caja de texto abajo, fija: botón adjuntar (📎), botón de voz (🎤), un selector
     desplegable "⚡ Rápido / Normal / MEGA" que muestra el coste en créditos de cada
     opción, y el botón de enviar.
   - Estado vacío (sin conversación abierta): saludo "¿En qué trabajamos hoy?" y cinco
     tarjetas de acceso rápido: Chat, Mentes, Co-Works, Código, Imagen.

3. Páginas vacías pero maquetadas para /mentes, /coworks, /codigo, /conectores,
   /ajustes y /precios.

4. Todos los textos en un archivo de traducciones con español e inglés.

Todo responsive: en móvil la barra lateral se convierte en un menú desplegable.
No escribas todavía nada de autenticación ni de llamadas a IA.
```

### Paso 2 — Login y base de datos

```
Conecta el proyecto a Supabase y monta la autenticación y la base de datos.

1. Login con email/contraseña y con Google. En el registro pide la fecha de nacimiento
   y, según la edad, asigna el modo: menos de 13 → "niño" (obliga a que un adulto lo
   invite), 13-17 → "adolescente", 18+ → "adulto".

2. Crea estas tablas con Row Level Security activado en todas, de forma que cada usuario
   solo pueda leer y escribir sus propias filas:

   perfiles(id, auth_id, nombre, email, plan, creditos, creditos_extra, modo_edad, tono,
            idioma, adulto_responsable_id, renueva_el)
   conversaciones(id, perfil_id, titulo, mente_id, creada_el)
   mensajes(id, conversacion_id, rol, contenido, modelo_usado, nivel,
            creditos_gastados, tokens_in, tokens_out, creado_el)
   movimientos(id, perfil_id, tipo, creditos, motivo, creado_el)

3. Crea una función SQL "gastar_creditos(perfil_id, cantidad, motivo)" que descuente de
   forma atómica: primero de los créditos del plan, luego de los créditos extra, y que
   falle con error si no hay saldo suficiente. Debe registrar siempre el movimiento.

4. Al registrarse, crea el perfil con plan "free" y 15 créditos. Añade un cron diario
   que recargue a 15 los créditos de todas las cuentas free.

5. Protege /chat y el resto de rutas de la app: sin sesión, redirige al login.

La SUPABASE_SERVICE_ROLE_KEY solo puede usarse en el servidor, nunca en el cliente.
```

### Paso 3 — La IA (el router multi-modelo)

```
Ahora el cerebro. Crea una API route en el servidor (nunca en el cliente) que:

1. Verifique la sesión del usuario y lea de la base de datos su plan, sus créditos y su
   modo de edad. NUNCA te fíes de lo que mande el navegador.

2. Si el modo es niño o adolescente, pase el mensaje por la API de moderación de OpenAI
   antes de nada. Si se bloquea, responde con un mensaje amable de redirección y no
   cobres créditos.

3. Elija el nivel: si el usuario ha forzado uno con el botón ⚡, respétalo (comprobando
   que su plan se lo permite); si no, llama a un modelo rápido y barato con el prompt
   clasificador del documento de especificación y usa el nivel que devuelva.

4. Enrute al proveedor correspondiente:
   - rapido   → el modelo más barato disponible (Gemini Flash, Haiku o GPT mini)
   - estandar → un modelo de gama media (Sonnet, Gemini Pro o GPT medio)
   - maximo   → el mejor modelo disponible (Opus o GPT tope de gama)
   - mega     → llama a los tres en paralelo y pide a uno de ellos que combine las tres
                respuestas en una sola, mejor que cualquiera por separado

   Usa los SDK oficiales de cada proveedor y consulta su documentación para los
   identificadores exactos de modelo, que cambian a menudo.

5. Cobre los créditos ANTES de llamar al modelo, con la función gastar_creditos. Si no
   hay saldo, devuelve error 402 y que el frontend abra el modal de mejora de plan.

6. Devuelva la respuesta en streaming, y al terminar guarde el mensaje con el modelo
   usado, el nivel y los tokens consumidos.

7. Aplique el system prompt del documento de especificación, con el añadido que
   corresponda al modo de edad y con el tono que el usuario tenga elegido.

8. Tenga límite de peticiones: 20 por minuto y usuario.

Todas las claves de API en variables de entorno del servidor. Ninguna en el frontend.
```

### Paso 4 — Pagos

```
Integra Lemon Squeezy para las suscripciones y los packs de créditos.

1. Productos: Kairo+ 9,99 €/mes, Supreme 24,99 €/mes, pack 500 créditos 5,99 €,
   pack 2.000 créditos 19,99 €. Y las versiones anuales: 99 € y 249 €.

2. Botones de compra en /precios y en el modal de "sin créditos", que abran el checkout
   de Lemon Squeezy con el id del usuario en los datos personalizados.

3. Webhook que VERIFIQUE LA FIRMA (sin esto cualquiera se regala el plan Supreme) y
   actualice el perfil: al activarse una suscripción, cambia el plan y asigna los
   créditos del mes; al cancelarse, vuelve a free al terminar el periodo pagado; al
   comprarse un pack, suma a creditos_extra.

4. Cron mensual que renueve los créditos del plan de cada suscriptor activo. Los
   créditos del plan no se acumulan de un mes a otro; los comprados en packs, sí.

5. Portal de facturación en /ajustes para cambiar de plan o cancelar.

6. Email con Resend: bienvenida, confirmación de pago, y aviso cuando queden menos de
   50 créditos (es el momento en que la gente sube de plan).

Prueba todo primero en el modo de pruebas de Lemon Squeezy.
```

---

## 8. Checklist de lanzamiento

**Antes de enseñárselo a nadie**
- [ ] Registrarte con una cuenta nueva y llegar hasta la primera respuesta sin errores
- [ ] Probar los tres niveles (⚡ Rápido, Normal, MEGA) y comprobar que descuentan bien
- [ ] Gastar todos los créditos a propósito y ver que el bloqueo funciona
- [ ] Crear un perfil hijo y comprobar los filtros del modo niños con preguntas límite
- [ ] Comprar con la tarjeta de pruebas de Lemon Squeezy y verificar que sube el plan
- [ ] Cancelar la suscripción y verificar que vuelve a free al terminar el periodo
- [ ] Abrirlo en un móvil de verdad, no solo en el simulador del navegador
- [ ] Buscar la clave de API en el código del navegador (F12 → Fuentes). No debe aparecer

**Legal y protección**
- [ ] Aviso legal, privacidad, cookies y términos escritos y enlazados en el pie
- [ ] Apartado específico de menores en la política de privacidad
- [ ] Topes de gasto mensual puestos en Anthropic, Google y OpenAI
- [ ] Copia de seguridad automática de la base de datos activada
- [ ] Dominio comprado y SSL funcionando (namecheckr.com para ver si kairo está libre)

**Primeros usuarios**
- [ ] 10 personas cercanas usándola una semana entera y contándote qué falla
- [ ] Analítica instalada: cuántos se registran, cuántos escriben el primer mensaje,
      cuántos pagan
- [ ] Un canal para recibir fallos (un email basta al principio)
- [ ] Publicar en Product Hunt, Reddit y foros del sector. No esperes a que esté perfecta

**Los tres números que tienes que mirar cada semana**
1. **Coste de API por usuario activo** — si sube de 1 € al mes en usuarios free, hay fuga
2. **Conversión de free a pago** — por debajo del 2% hay que revisar el plan gratuito
3. **Cuántos vuelven al día siguiente** — si nadie vuelve, ningún precio va a salvarlo

---

## Resumen en una línea

**Kairo** es un asistente de IA que enruta a Claude, Gemini y GPT según la tarea, se
monetiza con freemium más créditos (margen mínimo garantizado del 64%) y se diferencia
con Co-Works programados, que trabajan cuando el usuario no está.

**El siguiente paso es el Paso 1.** Lo demás puede esperar.
