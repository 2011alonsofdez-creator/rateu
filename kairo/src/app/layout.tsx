import type { Metadata, Viewport } from "next";
import { UiProvider } from "@/lib/i18n";
import "./globals.css";

/* DE DÓNDE CUELGAN LAS DIRECCIONES ABSOLUTAS.
 *
 * Hace falta para la tarjeta de compartir: WhatsApp, X y Telegram piden
 * la imagen por su dirección completa, y sin esto Next la pone relativa
 * y media internet no la carga. En Vercel la variable de abajo viene
 * puesta de serie, así que en producción no hay nada que configurar;
 * NEXT_PUBLIC_SITE_URL es para cuando haya dominio propio. */
const CASA =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/* LA TARJETA QUE SE VE AL PEGAR EL ENLACE.
 *
 * Hasta ahora no había ninguna: quien pegaba kairo en un grupo de
 * WhatsApp veía un recuadro gris con la dirección y nada más. Y el plan
 * de este mes es precisamente mandar gente desde redes, o sea que el
 * primer contacto con la marca de casi todo el mundo iba a ser ese
 * recuadro gris.
 *
 * La imagen es opengraph-image.png, aquí al lado: Next la encuentra sola
 * por el nombre del archivo y escribe las etiquetas. No hay que
 * enlazarla. */
export const metadata: Metadata = {
  metadataBase: new URL(CASA),
  title: "Kairo — La IA que trabaja cuando tú no",
  description:
    "Kairo usa Claude, Gemini y GPT a la vez y elige el mejor modelo para cada tarea. Con Co-Works programados que trabajan mientras no estás.",
  openGraph: {
    title: "Kairo — La IA que trabaja cuando tú no",
    description:
      "Tres modelos, una sola IA. Con trabajos programados que se ejecutan solos.",
    type: "website",
    siteName: "Kairo",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairo — La IA que trabaja cuando tú no",
    description:
      "Tres modelos, una sola IA. Con trabajos programados que se ejecutan solos.",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0d",
};

/* Aplica el tema guardado antes del primer pintado. Sin esto, quien
   tenga el tema claro ve un fogonazo oscuro al cargar cada página. */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('kairo.theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    var l = localStorage.getItem('kairo.lang');
    if (l) document.documentElement.lang = l;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();`;

import { Rastro } from "@/components/Rastro";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <UiProvider>
          {/* Cuenta las visitas en nuestra propia base de datos. No
              guarda IP ni galleta: cuenta sucesos, no personas. */}
          <Rastro />
          {children}
        </UiProvider>
      </body>
    </html>
  );
}
