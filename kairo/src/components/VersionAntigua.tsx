"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/lib/i18n";
import { dominioDe, esOtroDespliegue } from "@/lib/despliegue";

/* ESTÁS MIRANDO UN KAIRO QUE NO ES EL PUBLICADO.
 *
 * Vercel le da una dirección propia a CADA despliegue
 * (kairo-5zwfjk6ri-…, kairo-p2an09pq2-…), y cada una se queda congelada
 * con las variables que había cuando se construyó. Entrar por una de
 * ésas es abrir una foto del pasado: la clave que pusiste después no
 * está, el modelo que cambiaste tampoco.
 *
 * Y por fuera no se distingue en nada. Un día entero se fue en creer
 * que la búsqueda estaba rota cuando lo que pasaba es que la pestaña
 * abierta era de dos despliegues atrás —y en el camino di dos
 * diagnósticos, uno en cada dirección, los dos equivocados—.
 *
 * Esto no hay que quitarlo antes de lanzar: no sale porque la web esté
 * a medias, sale porque la dirección no es la publicada. Quien entre
 * por el dominio no lo verá nunca.
 */

export function VersionAntigua({ publicada }: { publicada: string }) {
  /* El host no se puede mirar en el servidor: allí no hay navegador, y
     el mismo despliegue responde por las dos direcciones. Así que la
     comparación es de este lado, después de pintar. */
  const [aquí, setAquí] = useState<string | null>(null);
  const { t } = useUi();

  useEffect(() => setAquí(window.location.hostname), []);

  if (aquí === null || !esOtroDespliegue(aquí, publicada)) return null;

  return (
    <div className="border-b border-gold/30 bg-gold/10 px-4 py-2.5 text-[13px] leading-relaxed text-gold">
      <span className="font-medium">{t("old.title")}</span>{" "}
      {t("old.body")}{" "}
      <a
        href={`https://${dominioDe(publicada)}`}
        className="font-medium underline underline-offset-2 hover:opacity-80"
      >
        {t("old.go")}
      </a>
    </div>
  );
}
