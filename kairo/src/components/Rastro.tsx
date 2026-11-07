"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { apuntar } from "@/lib/rastro";

/* Apunta una visita por página. Va en el layout, así que se entera
   también de los cambios de página sin recargar, que en Next son la
   mayoría y es justo lo que un contador de los de antes se pierde. */
export function Rastro() {
  const ruta = usePathname();
  const ultima = useRef<string>("");

  useEffect(() => {
    if (!ruta || ruta === ultima.current) return;
    ultima.current = ruta;
    apuntar("visita", ruta);
  }, [ruta]);

  return null;
}
