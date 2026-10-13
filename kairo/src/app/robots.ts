import type { MetadataRoute } from "next";

/* Qué puede rastrear un buscador y qué no.
 *
 * Sin este archivo entran a todo, y "todo" incluye /chat, /ajustes o
 * /revision: páginas que detrás del login no enseñan nada, y que de
 * cara al buscador son páginas vacías o una redirección. Eso no da
 * errores, pero gasta el presupuesto de rastreo en lo que no interesa y
 * deja a Kairo peor colocada en lo que sí.
 *
 * Se dice en positivo: lo público se indexa, lo de dentro no. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",      // no son páginas
        "/chat",      // y de aquí para abajo, todo pide sesión
        "/coworks",
        "/mentes",
        "/memoria",
        "/paperwork",
        "/gist",
        "/conectores",
        "/team",
        "/ajustes",
        "/auth/",
        "/revision",  // diagnóstico interno, no es para el público
      ],
    },
    sitemap: "https://kairo-six-lemon.vercel.app/sitemap.xml",
  };
}
