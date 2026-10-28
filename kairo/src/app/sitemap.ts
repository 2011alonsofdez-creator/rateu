import type { MetadataRoute } from "next";

/* Las páginas públicas de Kairo, para el buscador.
 *
 * Solo las que se pueden ver sin cuenta. Meter aquí las de dentro
 * sería contradecir a robots.ts, y un sitemap que apunta a páginas que
 * no se pueden abrir resta en vez de sumar. */
export default function sitemap(): MetadataRoute.Sitemap {
  const sitio = "https://kairo-six-lemon.vercel.app";
  const hoy = new Date();

  return [
    { url: `${sitio}/`, lastModified: hoy, changeFrequency: "weekly", priority: 1 },
    { url: `${sitio}/precios`, lastModified: hoy, changeFrequency: "monthly", priority: 0.8 },
    /* Páginas de intención: una por problema que resuelve Kairo. No son
       de producto, son la respuesta a lo que alguien escribe en Google
       cuando le acaba de pasar. Se añaden aquí a medida que existan. */
    { url: `${sitio}/multas`, lastModified: hoy, changeFrequency: "monthly", priority: 0.9 },
    { url: `${sitio}/cartas-de-hacienda`, lastModified: hoy, changeFrequency: "monthly", priority: 0.9 },
    { url: `${sitio}/contratos`, lastModified: hoy, changeFrequency: "monthly", priority: 0.9 },
    { url: `${sitio}/crear-una-app`, lastModified: hoy, changeFrequency: "monthly", priority: 0.9 },
    { url: `${sitio}/sin-suscripcion`, lastModified: hoy, changeFrequency: "monthly", priority: 0.9 },
    { url: `${sitio}/legal`, lastModified: hoy, changeFrequency: "yearly", priority: 0.3 },
  ];
}
