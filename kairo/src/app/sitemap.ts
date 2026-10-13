import type { MetadataRoute } from "next";

/* Las páginas públicas de Kairo, para el buscador.
 *
 * Solo las tres que se pueden ver sin cuenta. Meter aquí las de dentro
 * sería contradecir a robots.ts, y un sitemap que apunta a páginas que
 * no se pueden abrir resta en vez de sumar. */
export default function sitemap(): MetadataRoute.Sitemap {
  const sitio = "https://kairo-six-lemon.vercel.app";
  const hoy = new Date();

  return [
    { url: `${sitio}/`, lastModified: hoy, changeFrequency: "weekly", priority: 1 },
    { url: `${sitio}/precios`, lastModified: hoy, changeFrequency: "monthly", priority: 0.8 },
    { url: `${sitio}/legal`, lastModified: hoy, changeFrequency: "yearly", priority: 0.3 },
  ];
}
