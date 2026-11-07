/** Apunta que ha pasado algo. No espera respuesta y nunca estorba.
 *
 *  `keepalive` es lo que hace que el aviso salga aunque la persona
 *  cierre la pestaña en ese mismo instante, que es justo cuando más
 *  interesa saber que estuvo. */
export function apuntar(evento: string, ruta?: string) {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/rastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento, ruta: ruta ?? window.location.pathname }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* sin red, sin cuentas */
  }
}
