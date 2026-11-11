import { clienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

/* CONTAR LO QUE PASA, SIN CONTÁRSELO A NADIE.
 *
 * Kairo no tenía ninguna analítica. Ninguna: ni Google, ni Plausible, ni
 * nada. Eso significa que no se sabía cuánta gente llega, cuánta prueba,
 * cuánta se registra ni por dónde se cae. Y sin eso, cada decisión de
 * producto —el saludo, el deslizador, los precios— es una opinión que
 * nadie puede desmentir ni confirmar.
 *
 * Lo normal sería enchufar un servicio de fuera. Aquí no, por dos
 * razones: una, que mandar a un tercero por dónde navega la gente que
 * entra en Kairo es exactamente lo que Kairo promete no hacer; y dos,
 * que no hace falta.
 *
 * Así que se cuenta en tu propia base de datos y se cuenta POCO:
 *
 *   · QUÉ pasó (visita, prueba, registro…) y EN QUÉ página.
 *   · De qué sitio venía, solo el dominio: "instagram.com", no el enlace.
 *
 * No se guarda IP, ni identificador de visitante, ni galleta, ni nada
 * que permita seguir a una persona de una página a otra. Esto cuenta
 * SUCESOS, no gente. Con eso ya se contesta lo que importa —cuántos
 * llegan, cuántos prueban, cuántos se registran— y no hay dato personal
 * de por medio, así que tampoco hay que pedir permiso por un cartel.
 *
 * Nunca falla hacia fuera: si la tabla no existe todavía o Supabase está
 * caído, se calla y devuelve que sí. Una analítica rota no puede tumbar
 * una página.
 */

/* Los dos últimos miden la sugerencia de Co-Works del chat: cuántas
   veces sale y cuántas la pulsan. Si tras cien salidas la aceptan menos
   de cinco, la sugerencia sobra y se quita. Sin esto no se puede quitar
   nunca, porque siempre queda la duda de si estaba ayudando. */
const EVENTOS = new Set([
  "visita", "prueba", "prueba_agotada", "registro", "mensaje",
  "cowork_sugerido", "cowork_aceptado",
]);

/** Solo el dominio de donde viene, nunca el enlace entero. */
function dominio(origen: string | null): string | null {
  if (!origen) return null;
  try {
    const h = new URL(origen).hostname.replace(/^www\./, "");
    return h.slice(0, 80) || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { evento, ruta } = (await request.json()) as { evento?: string; ruta?: string };
    if (!evento || !EVENTOS.has(evento)) return new Response(null, { status: 204 });

    const supabase = clienteAdmin();
    if (!supabase) return new Response(null, { status: 204 });

    await supabase.from("rastro").insert({
      evento,
      ruta: String(ruta ?? "/").slice(0, 120),
      origen: dominio(request.headers.get("referer")),
    });
  } catch {
    /* Contar es lo menos importante que hace esta casa. */
  }
  return new Response(null, { status: 204 });
}
