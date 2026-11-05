import type { Lang } from "./i18n";
import type { Adjunto, Fuente } from "./tipos";
import { CREDITOS_NIVEL } from "./planes";

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
    bullets: {
      /* Esto decía 15 créditos y "modelo rápido", y las dos cosas
         llevaban días siendo mentira: el plan gratis pasó a 40 al día y
         a tener también el estándar. Vender MENOS de lo que das es un
         error más tonto que el contrario, porque lo paga la página de
         precios, que es donde se decide si alguien se registra.
         Y faltaba lo mejor que tiene: los 300 de bienvenida, que dan
         para un MEGA entero. */
      es: [
        "40 créditos al día",
        "300 de regalo al registrarte",
        "Modelos rápido y estándar",
        "Historial de 30 días",
        "1 Mente propia",
        "PDF de cualquier tamaño · fotos hasta 3 MB",
      ],
      en: [
        "40 credits per day",
        "300 free credits to start",
        "Fast and standard models",
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
        "5 conectores · 10 Mentes",
        "PDF de cualquier tamaño · fotos hasta 3 MB",
      ],
      en: [
        "2,000 credits per month",
        "Fast and standard models",
        "8 Mega-Prompts per month",
        "3 active Co-Works",
        "5 connectors · 10 Minds",
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
        "Co-Works ilimitados",
        "Todos los conectores · Mentes ilimitadas",
        "PDF de cualquier tamaño · fotos hasta 3 MB",
        "Soporte prioritario",
      ],
      en: [
        "6,000 credits per month",
        "All three models, top tier included",
        "25 Mega-Prompts per month",
        "Unlimited Co-Works",
        "Every connector · unlimited Minds",
        "PDFs of any size · photos up to 3 MB",
        "Priority support",
      ],
    },
  },
];

export const creditPacks = [
  { credits: 1000, price: 5.99 },
  { credits: 4000, price: 19.99 },
];
