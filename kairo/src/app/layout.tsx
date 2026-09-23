import type { Metadata, Viewport } from "next";
import { UiProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kairo — La IA que trabaja cuando tú no",
  description:
    "Kairo usa Claude, Gemini y GPT a la vez y elige el mejor modelo para cada tarea. Con Co-Works programados que trabajan mientras no estás.",
  openGraph: {
    title: "Kairo — La IA que trabaja cuando tú no",
    description:
      "Tres modelos, una sola IA. Con trabajos programados que se ejecutan solos.",
    type: "website",
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
