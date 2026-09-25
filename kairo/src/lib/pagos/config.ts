import type { PlanId } from "@/lib/planes";

/* Los pagos son opcionales, igual que los cerebros: sin configurar, los
   botones de precios llevan a crear una cuenta y nada más se rompe. */

export type Producto = "plus" | "plus_anual" | "supreme" | "supreme_anual" | "pack_500" | "pack_2000";

const ENLACES: Record<Producto, () => string> = {
  plus: () => process.env.LEMON_CHECKOUT_PLUS ?? "",
  plus_anual: () => process.env.LEMON_CHECKOUT_PLUS_ANUAL ?? "",
  supreme: () => process.env.LEMON_CHECKOUT_SUPREME ?? "",
  supreme_anual: () => process.env.LEMON_CHECKOUT_SUPREME_ANUAL ?? "",
  pack_500: () => process.env.LEMON_CHECKOUT_PACK_500 ?? "",
  pack_2000: () => process.env.LEMON_CHECKOUT_PACK_2000 ?? "",
};

export const PRODUCTOS = Object.keys(ENLACES) as Producto[];

export const enlaceDe = (p: Producto) => ENLACES[p]?.().trim() ?? "";

/** ¿Hay tienda montada? Basta con que exista el enlace de un plan. */
export const hayTienda = () => PRODUCTOS.some((p) => enlaceDe(p).length > 0);

export const secretoWebhook = () => process.env.LEMON_WEBHOOK_SECRET?.trim() ?? "";

/* Qué producto del proveedor es cada cosa. El aviso trae un número de
   variante, y esto lo traduce. Se configura con variables porque esos
   números los genera tu tienda y no hay forma de adivinarlos. */
const VARIANTES: { variable: string; plan?: PlanId; creditos?: number }[] = [
  { variable: "LEMON_VARIANTE_PLUS", plan: "plus" },
  { variable: "LEMON_VARIANTE_PLUS_ANUAL", plan: "plus" },
  { variable: "LEMON_VARIANTE_SUPREME", plan: "supreme" },
  { variable: "LEMON_VARIANTE_SUPREME_ANUAL", plan: "supreme" },
  { variable: "LEMON_VARIANTE_PACK_500", creditos: 500 },
  { variable: "LEMON_VARIANTE_PACK_2000", creditos: 2000 },
];

/** Traduce el número de variante del proveedor a lo que significa aquí. */
export function queEs(variante: unknown) {
  const id = String(variante ?? "").trim();
  if (!id) return null;

  for (const v of VARIANTES) {
    if ((process.env[v.variable] ?? "").trim() === id) {
      return { plan: v.plan, creditos: v.creditos };
    }
  }
  return null;
}

/** Los estados del proveedor, traducidos a los nuestros. */
export function traducirEstado(estado: string | null | undefined) {
  switch ((estado ?? "").toLowerCase()) {
    case "on_trial":
      return "en_prueba";
    case "active":
      return "activa";
    case "paused":
      return "pausada";
    case "past_due":
    case "unpaid":
      return "impagada";
    case "cancelled":
    case "canceled":
      return "cancelada";
    case "expired":
      return "vencida";
    default:
      return null;
  }
}
