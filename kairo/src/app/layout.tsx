import type { Metadata, Viewport } from "next";
import { UiProvider } from "@/lib/i18n";
import "./globals.css";

/* La dirección de producción, escrita aquí a propósito.
 *
 * `metadataBase` tiene que ser absoluta: las redes sociales no piden la
 * tarjeta desde el navegador de nadie, así que una ruta relativa como
 * /og.png no les dice en qué servidor está. Sin esta línea, Next avisa
 * en el build y la imagen de abajo no se enseña en ningún sitio.
 *
 * No sale de una variable de entorno a propósito: no es un secreto, es
 * la dirección pública, y si un día falta la variable la tarjeta deja de
 * salir sin que nadie se entere. Si cambia el dominio, se cambia aquí. */
const SITIO = "https://kairo-six-lemon.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
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
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Kairo — La IA que trabaja cuando tú no",
      },
    ],
  },
  /* X y LinkedIn leen esto antes que lo de arriba. `summary_large_image`
     es lo que hace que salga la tarjeta grande en vez de una miniatura
     cuadrada al lado del texto. */
  twitter: {
    card: "summary_large_image",
    title: "Kairo — La IA que trabaja cuando tú no",
    description:
      "Tres modelos, una sola IA. Con trabajos programados que se ejecutan solos.",
    images: ["/og.png"],
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
        <UiProvider>{children}</UiProvider>
      </body>
    </html>
  );
}
