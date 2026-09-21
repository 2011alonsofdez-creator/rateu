"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "es" | "en";
export type Theme = "dark" | "light";

/* Todos los textos de la interfaz viven aquí. Añadir un idioma
   es añadir una clave más a este objeto: nada de textos sueltos
   escritos a mano dentro de los componentes. */
const dict = {
  es: {
    "nav.product": "Producto",
    "nav.pricing": "Precios",
    "nav.login": "Entrar",
    "nav.start": "Empezar gratis",

    "hero.badge": "Claude · Gemini · GPT, en una sola suscripción",
    "hero.title": "La IA que trabaja",
    "hero.titleAccent": "cuando tú no.",
    "hero.sub":
      "Kairo usa los tres mejores modelos del mundo y elige solo el adecuado para cada tarea. Tú escribes; él decide, trabaja y te avisa.",
    "hero.cta": "Empezar gratis",
    "hero.cta2": "Ver cómo funciona",
    "hero.note": "Sin tarjeta. 15 créditos gratis cada día.",

    "brains.title": "Tres cerebros. Una sola IA.",
    "brains.sub":
      "No eliges modelo porque no deberías tener que saber cuál es mejor. Kairo lo decide en milisegundos según lo que le pides.",
    "brains.claude": "Código y textos largos",
    "brains.claudeDesc":
      "Programar, depurar y analizar documentos de cientos de páginas sin perder el hilo.",
    "brains.gemini": "Velocidad e imagen",
    "brains.geminiDesc":
      "Respuestas instantáneas para lo del día a día, y generación de imágenes.",
    "brains.gpt": "Razonamiento y voz",
    "brains.gptDesc":
      "Problemas en varios pasos, matemáticas y conversación hablada natural.",
    "brains.note": "¿Y si quieres los tres a la vez? Ese es el Mega-Prompt.",

    "features.title": "Lo que Kairo hace y los demás no",
    "features.sub": "Cinco cosas que cambian cómo trabajas con una IA.",
    "features.cowork": "Co-Works programados",
    "features.coworkDesc":
      "«Cada lunes a las 8:00 revisa mi correo, resume lo urgente y prepárame el plan de la semana.» Se ejecuta solo, tú lo lees cuando llegas.",
    "features.mentes": "Mentes",
    "features.mentesDesc":
      "Crea tu propia IA especializada: le das instrucciones y archivos, y responde siempre como tú quieres.",
    "features.mega": "Mega-Prompt",
    "features.megaDesc":
      "Un botón que lanza los tres modelos a la vez y combina lo mejor de cada respuesta. Para cuando acertar importa de verdad.",
    "features.code": "Zona de código",
    "features.codeDesc":
      "Editor, ejecución y conexión con tus repositorios. Programa acompañado, no solo aconsejado.",
    "features.connect": "Conectores",
    "features.connectDesc":
      "Drive, Gmail, Calendar y GitHub. Kairo trabaja con tus cosas, no con copias pegadas a mano.",
    "features.ages": "Modo niños, adolescente y adulto",
    "features.agesDesc":
      "Cada edad, su Kairo. Los perfiles de menores los crea y supervisa un adulto de la familia.",

    "pricing.title": "Precios claros, sin sorpresas",
    "pricing.sub":
      "Pagas por lo que gastas, y siempre ves cuánto cuesta antes de pulsar.",
    "pricing.monthly": "Mensual",
    "pricing.yearly": "Anual",
    "pricing.save": "2 meses gratis",
    "pricing.month": "/mes",
    "pricing.year": "/año",
    "pricing.popular": "El más elegido",
    "pricing.free": "Free",
    "pricing.freeDesc": "Para probarlo sin compromiso",
    "pricing.plus": "Kairo+",
    "pricing.plusDesc": "Para el día a día",
    "pricing.supreme": "Supreme",
    "pricing.supremeDesc": "Sin límites reales",
    "pricing.ctaFree": "Empezar gratis",
    "pricing.ctaPaid": "Elegir plan",
    "pricing.creditsTitle": "¿Y si me quedo sin créditos?",
    "pricing.creditsSub":
      "Compras un pack cuando lo necesites. No caducan nunca.",

    "footer.legal": "Aviso legal",
    "footer.privacy": "Privacidad",
    "footer.cookies": "Cookies",
    "footer.terms": "Términos",
    "footer.rights": "Todos los derechos reservados.",
    "footer.tagline": "La IA que trabaja cuando tú no.",

    "app.newChat": "Nuevo chat",
    "app.chats": "Chats",
    "app.mentes": "Mentes",
    "app.coworks": "Co-Works",
    "app.code": "Código",
    "app.connectors": "Conectores",
    "app.settings": "Ajustes",
    "app.credits": "créditos",
    "app.today": "Hoy",
    "app.week": "Últimos 7 días",
    "app.earlier": "Antes",
    "app.greeting": "¿En qué trabajamos hoy?",
    "app.greetingSub": "Elige por dónde empezar o escribe directamente.",
    "app.placeholder": "Escribe aquí...",
    "app.attach": "Adjuntar archivo",
    "app.voice": "Dictar",
    "app.send": "Enviar",
    "app.copy": "Copiar",
    "app.copied": "Copiado",
    "app.regen": "Regenerar",
    "app.regenWarn": "Vuelve a costar créditos",
    "app.level": "Nivel",
    "app.fast": "Rápido",
    "app.fastDesc": "Para lo del día a día",
    "app.normal": "Normal",
    "app.normalDesc": "Redactar, resumir, explicar",
    "app.mega": "MEGA",
    "app.megaDesc": "Los tres modelos a la vez",
    "app.cr": "cr",
    "app.noCredits": "Te has quedado sin créditos",
    "app.noCreditsSub":
      "Se renuevan mañana, o puedes subir de plan y seguir ahora mismo.",
    "app.upgrade": "Subir de plan",
    "app.buyCredits": "Comprar créditos",
    "app.later": "Ahora no",
    "app.creditsLeft": "Créditos disponibles",
    "app.thisMonth": "Gastados este mes",
    "app.renews": "Se renuevan el",
    "app.soon": "Próximamente",
    "app.soonDesc":
      "Esta sección llega en la versión 2. De momento, el chat ya funciona.",
    "app.backToChat": "Volver al chat",
    "app.demo": "Demo · datos de ejemplo",

    "card.chat": "Chat",
    "card.chatDesc": "Pregunta lo que sea",
    "card.mentes": "Mentes",
    "card.mentesDesc": "Tu IA especializada",
    "card.cowork": "Co-Work",
    "card.coworkDesc": "Programa una tarea",
    "card.code": "Código",
    "card.codeDesc": "Programa con ayuda",
    "card.image": "Imagen",
    "card.imageDesc": "Crea una imagen",

    "theme.toggle": "Cambiar tema",
    "lang.toggle": "Cambiar idioma",
    "menu.open": "Abrir menú",
    "menu.close": "Cerrar menú",
  },
  en: {
    "nav.product": "Product",
    "nav.pricing": "Pricing",
    "nav.login": "Log in",
    "nav.start": "Start free",

    "hero.badge": "Claude · Gemini · GPT, in one subscription",
    "hero.title": "The AI that works",
    "hero.titleAccent": "when you don't.",
    "hero.sub":
      "Kairo runs the world's three best models and picks the right one for every task. You type; it decides, works, and tells you when it's done.",
    "hero.cta": "Start free",
    "hero.cta2": "See how it works",
    "hero.note": "No card required. 15 free credits every day.",

    "brains.title": "Three minds. One AI.",
    "brains.sub":
      "You don't pick a model, because you shouldn't have to know which one is better. Kairo decides in milliseconds based on what you ask.",
    "brains.claude": "Code and long documents",
    "brains.claudeDesc":
      "Write, debug and analyse hundreds of pages without losing the thread.",
    "brains.gemini": "Speed and images",
    "brains.geminiDesc":
      "Instant answers for everyday questions, plus image generation.",
    "brains.gpt": "Reasoning and voice",
    "brains.gptDesc":
      "Multi-step problems, maths and natural spoken conversation.",
    "brains.note": "Want all three at once? That's the Mega-Prompt.",

    "features.title": "What Kairo does that others don't",
    "features.sub": "Five things that change how you work with an AI.",
    "features.cowork": "Scheduled Co-Works",
    "features.coworkDesc":
      "\"Every Monday at 8:00, check my inbox, summarise what's urgent and draft my week.\" It runs on its own; you read it when you arrive.",
    "features.mentes": "Minds",
    "features.mentesDesc":
      "Build your own specialised AI: give it instructions and files, and it always answers your way.",
    "features.mega": "Mega-Prompt",
    "features.megaDesc":
      "One button fires all three models and merges the best of each answer. For when getting it right really matters.",
    "features.code": "Code workspace",
    "features.codeDesc":
      "Editor, execution and repository access. Code with company, not just advice.",
    "features.connect": "Connectors",
    "features.connectDesc":
      "Drive, Gmail, Calendar and GitHub. Kairo works with your actual files, not pasted copies.",
    "features.ages": "Kids, teen and adult modes",
    "features.agesDesc":
      "A Kairo for every age. Child profiles are created and supervised by an adult in the family.",

    "pricing.title": "Clear pricing, no surprises",
    "pricing.sub":
      "You pay for what you use, and you always see the cost before you click.",
    "pricing.monthly": "Monthly",
    "pricing.yearly": "Yearly",
    "pricing.save": "2 months free",
    "pricing.month": "/mo",
    "pricing.year": "/yr",
    "pricing.popular": "Most popular",
    "pricing.free": "Free",
    "pricing.freeDesc": "Try it, no strings attached",
    "pricing.plus": "Kairo+",
    "pricing.plusDesc": "For everyday work",
    "pricing.supreme": "Supreme",
    "pricing.supremeDesc": "No real limits",
    "pricing.ctaFree": "Start free",
    "pricing.ctaPaid": "Choose plan",
    "pricing.creditsTitle": "What if I run out of credits?",
    "pricing.creditsSub": "Buy a pack whenever you need it. They never expire.",

    "footer.legal": "Legal notice",
    "footer.privacy": "Privacy",
    "footer.cookies": "Cookies",
    "footer.terms": "Terms",
    "footer.rights": "All rights reserved.",
    "footer.tagline": "The AI that works when you don't.",

    "app.newChat": "New chat",
    "app.chats": "Chats",
    "app.mentes": "Minds",
    "app.coworks": "Co-Works",
    "app.code": "Code",
    "app.connectors": "Connectors",
    "app.settings": "Settings",
    "app.credits": "credits",
    "app.today": "Today",
    "app.week": "Last 7 days",
    "app.earlier": "Earlier",
    "app.greeting": "What are we working on?",
    "app.greetingSub": "Pick a starting point or just start typing.",
    "app.placeholder": "Type here...",
    "app.attach": "Attach file",
    "app.voice": "Dictate",
    "app.send": "Send",
    "app.copy": "Copy",
    "app.copied": "Copied",
    "app.regen": "Regenerate",
    "app.regenWarn": "Costs credits again",
    "app.level": "Level",
    "app.fast": "Fast",
    "app.fastDesc": "For everyday questions",
    "app.normal": "Normal",
    "app.normalDesc": "Write, summarise, explain",
    "app.mega": "MEGA",
    "app.megaDesc": "All three models at once",
    "app.cr": "cr",
    "app.noCredits": "You're out of credits",
    "app.noCreditsSub":
      "They reset tomorrow, or you can upgrade and keep going right now.",
    "app.upgrade": "Upgrade",
    "app.buyCredits": "Buy credits",
    "app.later": "Not now",
    "app.creditsLeft": "Credits available",
    "app.thisMonth": "Spent this month",
    "app.renews": "Renews on",
    "app.soon": "Coming soon",
    "app.soonDesc":
      "This section ships in version 2. For now, the chat already works.",
    "app.backToChat": "Back to chat",
    "app.demo": "Demo · sample data",

    "card.chat": "Chat",
    "card.chatDesc": "Ask anything",
    "card.mentes": "Minds",
    "card.mentesDesc": "Your specialised AI",
    "card.cowork": "Co-Work",
    "card.coworkDesc": "Schedule a task",
    "card.code": "Code",
    "card.codeDesc": "Code with help",
    "card.image": "Image",
    "card.imageDesc": "Create an image",

    "theme.toggle": "Toggle theme",
    "lang.toggle": "Switch language",
    "menu.open": "Open menu",
    "menu.close": "Close menu",
  },
} as const;

export type TKey = keyof (typeof dict)["es"];

type Ui = {
  lang: Lang;
  theme: Theme;
  t: (key: TKey) => string;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  toggleTheme: () => void;
};

const UiContext = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [theme, setTheme] = useState<Theme>("dark");

  /* Recuperamos las preferencias guardadas. Va en try/catch porque en
     ventana privada o con las cookies bloqueadas, leer localStorage lanza. */
  useEffect(() => {
    try {
      const l = localStorage.getItem("kairo.lang");
      if (l === "es" || l === "en") setLangState(l);
      const th = localStorage.getItem("kairo.theme");
      if (th === "dark" || th === "light") setTheme(th);
    } catch {
      /* preferencias por defecto */
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("kairo.theme", theme);
      localStorage.setItem("kairo.lang", lang);
    } catch {
      /* no se puede guardar: la sesión actual funciona igual */
    }
  }, [theme, lang]);

  const t = useCallback((key: TKey) => dict[lang][key] ?? key, [lang]);

  const value = useMemo<Ui>(
    () => ({
      lang,
      theme,
      t,
      setLang: setLangState,
      toggleLang: () => setLangState((l) => (l === "es" ? "en" : "es")),
      toggleTheme: () => setTheme((v) => (v === "dark" ? "light" : "dark")),
    }),
    [lang, theme, t],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi debe usarse dentro de <UiProvider>");
  return ctx;
}
