import type { Lang } from "./i18n";
import type { Adjunto, Fuente } from "./tipos";
import { CREDITOS_NIVEL, CREDITOS_PLAN } from "./planes";
import type { Producto } from "./pagos/config";

/* Datos de ejemplo para el Paso 1. Todo esto se sustituye por
   Supabase en el Paso 2: nada de aquí sobrevive a producción. */

export type Level = "fast" | "normal" | "forja" | "mega";

/** Lo que puede elegir la persona: un nivel, o que lo elija Kairo. */
export type Nivel = Level | "auto";

/* El precio sale de planes.ts, el mismo sitio del que lo saca el
   servidor para cobrar: aquí solo se le pone color. */
export const LEVELS: Record<Level, { credits: number; color: string }> = {
  fast: { credits: CREDITOS_NIVEL.fast, color: "var(--green)" },
  normal: { credits: CREDITOS_NIVEL.normal, color: "var(--acento-2)" },
  forja: { credits: CREDITOS_NIVEL.forja, color: "var(--acento)" },
  mega: { credits: CREDITOS_NIVEL.mega, color: "var(--gold)" },
};

type Bi = { es: string; en: string };
export const pick = (v: Bi, lang: Lang) => v[lang];

/* La lista de conversaciones de ejemplo se ha ido: ahora salen de la
   base de datos. Enseñar chats inventados a alguien que ha entrado con
   su cuenta era mentirle en la pantalla principal. */

export type Message = {
  id: string;
  /** El identificador que le dio la base de datos, cuando ya está
   *  guardado. Es lo que permite editar una pregunta o regenerar una
   *  respuesta: las dos cosas rehacen la conversación desde ese punto. */
  dbId?: string;
  role: "user" | "kairo";
  content: Bi;
  model?: string;
  level?: Level;
  credits?: number;
  /** Lo que mandaste con la pregunta. En los mensajes viejos se guarda
   *  solo el nombre y el tamaño: el contenido se suelta en cuanto deja
   *  de hacer falta, que es un archivo menos dando vueltas por ahí. */
  adjuntos?: Adjunto[];
  /** Las páginas que consultó para contestar, si las consultó. */
  fuentes?: Fuente[];
  /** Lo que buscó. Se enseña debajo de las fuentes. */
  busquedas?: string[];
  /** Por qué NO pudo buscar, cuando iba a hacerlo y no pudo. Se enseña
   *  encima de la respuesta: sin esto, una respuesta de memoria y una
   *  comprobada se leen exactamente igual. */
  sinBusqueda?: "cuota" | "otro";
  /** Lo que acaba de guardar en su memoria por este mensaje. */
  recordado?: string;
};

export const thread: Message[] = [
  {
    id: "m1",
    role: "user",
    content: {
      es: "Tengo una tienda online de café de especialidad. Se me caen las ventas los martes y no sé por qué. ¿Por dónde empiezo a mirar?",
      en: "I run a specialty coffee shop online. Sales drop every Tuesday and I don't know why. Where do I start looking?",
    },
  },
  {
    id: "m2",
    role: "kairo",
    level: "normal",
    credits: CREDITOS_NIVEL.normal,
    model: "Gemini Pro",
    content: {
      es: `Antes de tocar nada, hay que separar **si vienen menos personas** o **si compran menos las que vienen**. Son problemas distintos y se arreglan de forma distinta.

Mira estos cuatro datos del martes frente a la media de la semana:

1. **Visitas totales** — si caen, el problema está fuera de la tienda (anuncios, correos, redes).
2. **Tasa de conversión** — si las visitas son iguales pero la conversión baja, el problema está dentro.
3. **Carritos abandonados** — un pico aquí casi siempre apunta a los gastos de envío o a un fallo en el pago.
4. **Origen del tráfico** — muchas campañas reparten peor presupuesto a mitad de semana.

Si me dices cuál de los cuatro se mueve, te digo qué mirar después.`,
      en: `Before touching anything, separate **fewer people arriving** from **the same people buying less**. Those are different problems with different fixes.

Compare these four numbers for Tuesday against your weekly average:

1. **Total visits** — if they drop, the problem is outside the shop (ads, emails, social).
2. **Conversion rate** — same visits but lower conversion means the problem is inside.
3. **Abandoned carts** — a spike here almost always points at shipping costs or a checkout bug.
4. **Traffic source** — many ad campaigns allocate budget badly mid-week.

Tell me which of the four moves and I'll tell you where to look next.`,
    },
  },
  {
    id: "m3",
    role: "user",
    content: {
      es: "Las visitas son iguales pero la conversión baja del 2,4% al 0,9%. Y sí, hay muchos carritos abandonados.",
      en: "Visits are the same but conversion drops from 2.4% to 0.9%. And yes, lots of abandoned carts.",
    },
  },
  {
    id: "m4",
    role: "kairo",
    level: "mega",
    credits: CREDITOS_NIVEL.mega,
    model: "Mega-Prompt · Claude + Gemini + GPT",
    content: {
      es: `Mismas visitas, conversión por los suelos y carritos abandonados: **eso no es marketing, es un fallo técnico o de precio que solo aparece los martes**.

**Lo primero, en este orden:**

- **Revisa si el martes se lanza algún proceso automático** (sincronización de stock, copia de seguridad, actualización de precios). Si un producto se queda sin stock a mitad del proceso, el botón de comprar falla en silencio.
- **Comprueba las reglas de envío por día.** Es más común de lo que parece: una regla mal puesta que sube el envío de 3,90 € a 9,90 € un día concreto.
- **Haz una compra de prueba un martes**, desde el móvil y con la caché limpia. La mitad de estos casos se resuelven así en diez minutos.

Para confirmarlo con datos, esta consulta te da la conversión por día y por dispositivo:

\`\`\`sql
SELECT
  EXTRACT(DOW FROM creado_el)    AS dia_semana,
  dispositivo,
  COUNT(*) FILTER (WHERE estado = 'pagado')::float
    / NULLIF(COUNT(*), 0) * 100  AS conversion_pct,
  COUNT(*) FILTER (WHERE estado = 'abandonado') AS abandonados
FROM pedidos
WHERE creado_el > NOW() - INTERVAL '90 days'
GROUP BY dia_semana, dispositivo
ORDER BY dia_semana;
\`\`\`

Si la caída está solo en móvil, es un fallo de la pasarela de pago. Si está en los dos, es el envío o el stock.

¿Quieres que te programe un **Co-Work** que te avise cada martes a las 21:00 con la conversión del día y te alerte si baja del 1,5%?`,
      en: `Same visits, conversion on the floor and abandoned carts: **that isn't marketing, it's a technical or pricing fault that only shows up on Tuesdays**.

**Check these first, in this order:**

- **Look for an automated job that runs on Tuesdays** (stock sync, backup, price update). If a product goes out of stock mid-process, the buy button fails silently.
- **Check your per-day shipping rules.** More common than it sounds: a misconfigured rule that pushes shipping from €3.90 to €9.90 on one specific day.
- **Place a test order on a Tuesday**, on mobile, with a clean cache. Half of these cases are solved in ten minutes this way.

To confirm it with data, this query gives you conversion by day and device:

\`\`\`sql
SELECT
  EXTRACT(DOW FROM created_at)   AS weekday,
  device,
  COUNT(*) FILTER (WHERE status = 'paid')::float
    / NULLIF(COUNT(*), 0) * 100  AS conversion_pct,
  COUNT(*) FILTER (WHERE status = 'abandoned') AS abandoned
FROM orders
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY weekday, device
ORDER BY weekday;
\`\`\`

If the drop is mobile-only, it's your payment gateway. If it's both, it's shipping or stock.

Want me to schedule a **Co-Work** that pings you every Tuesday at 21:00 with the day's conversion and alerts you if it falls below 1.5%?`,
    },
  },
];

export const user = {
  name: "Alonso",
  plan: "Kairo+",
  credits: 1680,
  creditsTotal: 2000,
  spentThisMonth: 320,
  renewsOn: { es: "14 de octubre", en: "October 14" },
};

export type Plan = {
  id: "free" | "plus" | "supreme";
  monthly: number;
  yearly: number;
  featured?: boolean;
  bullets: { es: string[]; en: string[] };
};

/* LO DE LOS MEGABYTES POR PLAN NUNCA FUE VERDAD.
 *
 * Decía 5, 25 y 100 MB según el plan, y el tope real era uno solo para
 * todo el mundo: 3 MB por archivo, porque los archivos viajan dentro de
 * la petición y Vercel corta a 4,5. O sea que el plan de 25 € prometía
 * cien megas y rechazaba un PDF de cuatro.
 *
 * Ahora los PDF se leen en el navegador y viaja su texto, así que el
 * tamaño del PDF da igual de verdad. Lo que sigue teniendo tope son las
 * fotos y los PDF escaneados, que son imágenes. Eso es lo que se dice.
 */
export const plans: Plan[] = [
  {
    id: "free",
    monthly: 0,
    yearly: 0,
    /* EL PRIMER CONFLICTO DEL PROYECTO SE RESOLVIÓ AQUÍ, EL 01-11.
       El dueño arregló esta misma tarjeta en `main` (`493c45c`) la misma
       noche en que el constructor la arreglaba en la rama, y las dos
       versiones chocaron. Se quedó de cada lado lo que el otro no tenía:
       suya la viñeta de los **150 de regalo** —que además contesta la
       pregunta que se le hizo el 30-10— y el sitio donde la puso;
       nuestras la cifra **leída del código** y la viñeta del **1
       Co-Work**, que es el tope real del plan gratis y que su versión no
       traía. Su versión volvía a escribir el 20 a mano, que es justo lo
       que tuvo mal el 15 durante cinco días en cinco sitios.

       LOS CRÉDITOS SALEN DE `CREDITOS_PLAN`, NO ESCRITOS A MANO.
       Decían 15 y el código daba 20 desde el 29-10: el plan gratis
       mejoró y esta tarjeta siguió vendiendo el de antes durante un día,
       que es lo que pasa siempre con una cifra copiada. Ahora no puede
       volver a pasar.
       Y los niveles: el plan gratis tiene `["fast", "normal"]`
       (`planes.ts`), así que decir "Modelo rápido" dejaba fuera a
       Paperwork, Gist y Código, que van en normal y ya funcionan gratis.
       El "1 Co-Work" no es un adorno: es el tope real del plan gratis
       (`api/coworks/route.ts`, `solo_uno_gratis`), y no decirlo es dejar
       que alguien cree el segundo y se encuentre un error.

       Y LOS DE PAGO, EL 31-10. Decían "3 Co-Works activos" (Kairo+) y
       "Co-Works ilimitados" (Supreme). Las dos eran falsas y en
       direcciones contrarias: el tope de verdad es **10 para los dos**,
       y lo pone la base de datos en `limitar_coworks()`
       (`TODO_DE_UNA_VEZ.sql:1058-1080` y `0009_coworks.sql:339-361`,
       idénticos), que es un `trigger before insert` y **no consulta el
       plan** —buscado un `plan` en `api/coworks/` y en `lib/coworks/`:
       el único que aparece viaja para armar el prompt—.
       La de Supreme era la única falsa **en contra de quien paga**: 24,99 €
       por "ilimitados" y el número diez esperando. Lo avisó crecimiento el
       29-10, el constructor pidió la decisión en el parte del 30-10
       —corregir el texto o subir el tope— y avisó de que, sin respuesta,
       hoy pondría el texto. Esto es eso.
       El 10 va escrito a mano y no leído, y no hay forma mejor hoy: ese
       tope vive **solo en SQL**, así que no hay constante de TypeScript
       que importar. Si algún día sube para Supreme, deja de ser un número
       y pasa a depender del plan, y entonces estas dos viñetas hay que
       rehacerlas, no retocarlas.
       Y que Kairo+ y Supreme digan ahora lo mismo aquí es la verdad:
       Supreme se distingue en otras cuatro viñetas —los tres modelos, los
       25 Mega-Prompts, los conectores y el soporte—, pero en Co-Works no se
       distingue en nada.
       (Eran cinco hasta el 04-11. La quinta era "los 100 MB", y se cae con
       el cambio del dueño de ese día: los PDF se leen en el navegador, así
       que su tamaño da igual en los dos planes y la viñeta es la misma.
       Los 100 MB, además, nunca fueron verdad: el tope real son 3 MB por
       archivo, `ADJUNTOS.bytesPorArchivo` en `lib/tipos.ts:94`.)

       LAS MENTES, LO MISMO Y ENCONTRADO DE REBOTE. Buscando si "ilimitado"
       se prometía en algún otro sitio salió "Mentes ilimitadas", también en
       Supreme. El tope real es **30 para todo el mundo**, en
       `limitar_mentes()` (`TODO_DE_UNA_VEZ.sql:82-93`), tampoco consulta el
       plan, y **no hay ningún otro tope en ninguna parte**: ni en
       `api/mentes/route.ts` ni en `lib/mentes.ts` ni en las acciones. Lo
       dice además el propio producto: el aviso que ve el usuario es
       `mente.errLimit`, "Has llegado al máximo de **30** Mentes".
       Así que aquí dice 30, que es lo que pasa y lo que el error ya cuenta.
       Lo que NO toco, porque no es un dato falso contra quien paga sino
       cómo se vende: el Free dice "1 Mente propia" y Kairo+ dice "10
       Mentes", y los dos se quedan cortos —los dos tienen 30—. Corregir eso
       es regalar lo que él no decidió regalar, o puede que esos topes por
       plan estén pensados y solo falte implementarlos. Preguntado en el
       parte del 31-10. */
    bullets: {
      /* Esto decía 15 créditos y "modelo rápido", y las dos cosas
         llevaban días siendo mentira: el plan gratis pasó a 40 al día y
         a tener también el estándar. Vender MENOS de lo que das es un
         error más tonto que el contrario, porque lo paga la página de
         precios, que es donde se decide si alguien se registra.
         Y faltaba lo mejor que tiene: los 300 de bienvenida, que dan
         para un MEGA entero. */
      es: [
        `${CREDITOS_PLAN.free} créditos al día`,
        "300 de regalo al registrarte",
        "Modelos rápido y normal: chat, Paperwork, Gist y Código",
        "1 Co-Work, que trabaja solo a su hora",
        "Historial de 30 días",
        "1 Mente propia",
        "PDF de cualquier tamaño · fotos hasta 3 MB",
      ],
      en: [
        `${CREDITOS_PLAN.free} credits per day`,
        "300 free credits to start",
        "Fast and standard models: chat, Paperwork, Gist and Code",
        "1 Co-Work, working on its own at its hour",
        "30-day history",
        "1 Mind of your own",
        "PDFs of any size · photos up to 3 MB",
      ],
    },
  },
  {
    id: "plus",
    monthly: 9.99,
    yearly: 99,
    featured: true,
    bullets: {
      es: [
        "2.000 créditos al mes",
        "Modelos rápido y estándar",
        "8 Mega-Prompts al mes",
        "3 Co-Works activos",
        "10 Mentes propias",
        "PDF de cualquier tamaño · fotos hasta 3 MB",
      ],
      en: [
        "2,000 credits per month",
        "Fast and standard models",
        "8 Mega-Prompts per month",
        "3 active Co-Works",
        "10 Minds of your own",
        "PDFs of any size · photos up to 3 MB",
      ],
    },
  },
  {
    id: "supreme",
    monthly: 24.99,
    yearly: 249,
    bullets: {
      es: [
        "6.000 créditos al mes",
        "Los tres modelos, incluido el máximo",
        "25 Mega-Prompts al mes",
        "10 Co-Works activos",
        "30 Mentes propias",
        "PDF de cualquier tamaño · fotos hasta 3 MB",
        "Soporte prioritario",
      ],
      en: [
        "6,000 credits per month",
        "All three models, top tier included",
        "25 Mega-Prompts per month",
        "10 active Co-Works",
        "30 Minds of your own",
        "PDFs of any size · photos up to 3 MB",
        "Priority support",
      ],
    },
  },
];

/* EL NOMBRE DEL PRODUCTO VA ESCRITO, NO SE CALCULA.
 *
 * El botón de comprar sacaba el identificador del número de créditos
 * —`pack_${pack.credits}`—, así que al doblar la escala empezó a pedir
 * un "pack_1000" que no existe en la tienda y el enlace devolvía a
 * precios sin comprar nada. En silencio, además: no hay error, solo no
 * pasa nada.
 *
 * Los nombres siguen diciendo 500 y 2000 porque identifican el PRODUCTO
 * de la tienda, que es el mismo de siempre y está ya configurado en
 * Vercel. Lo que cambió es cuántos créditos abona, y eso vive en
 * pagos/config.ts. Aquí van separados a propósito: el día que vuelvan a
 * cambiar los créditos, el botón sigue apuntando a donde debe. */
export const creditPacks: { producto: Producto; credits: number; price: number }[] = [
  { producto: "pack_500", credits: 1000, price: 5.99 },
  { producto: "pack_2000", credits: 4000, price: 19.99 },
];
