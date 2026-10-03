import { clienteServidor } from "@/lib/supabase/server";
import { faltaColumna } from "@/lib/supabase/compat";
import { buscarChat, codigoDe, hayTelegram, mandar, nombreDelBot } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

/* ENLAZAR TELEGRAM CON TU CUENTA.
 *
 *   GET            → si el bot está puesto, si estás enlazado y tu código
 *   POST vincular  → busca quién ha mandado tu código y lo guarda
 *   POST probar    → te manda un mensaje para verlo llegar
 *   DELETE         → desenlaza
 *
 * De aquí no sale el testigo del bot por ningún camino, ni siquiera su
 * longitud: con él, cualquiera escribe en nombre de Kairo a todo el que
 * lo tenga añadido.
 */

const fallo = (estado: number, motivo: string) =>
  new Response(JSON.stringify({ error: motivo }), {
    status: estado,
    headers: { "content-type": "application/json" },
  });

type Perfil = { id: string; telegram_chat_id: string | null };

/** El perfil de quien pregunta. Se pide por la función de la base de
 *  datos, que sabe cuál es el tuyo: `perfiles` también deja ver los de
 *  los hijos a cargo, así que coger "el primero" podría coger otro. */
async function miPerfil(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteServidor>>>,
): Promise<{ perfil: Perfil | null; falta: boolean }> {
  const { data: id } = await supabase.rpc("mi_perfil_id");

  const consulta = supabase.from("perfiles").select("id, telegram_chat_id");
  const { data, error } = id
    ? await consulta.eq("id", id).maybeSingle<Perfil>()
    : await consulta.limit(1).maybeSingle<Perfil>();

  // Sin la migración 0013 la columna no existe: no es un fallo, es que
  // esto todavía no está montado.
  if (error) return { perfil: null, falta: faltaColumna(error) };
  return { perfil: data ?? null, falta: false };
}

export async function GET() {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ bot: false, vinculado: false, demo: true });

  const puesto = hayTelegram();
  const { perfil, falta } = await miPerfil(supabase);

  if (!perfil) {
    return Response.json({ bot: puesto, vinculado: false, falta });
  }

  return Response.json(
    {
      bot: puesto,
      falta,
      vinculado: Boolean(perfil.telegram_chat_id),
      codigo: puesto ? codigoDe(perfil.id) : null,
      // Para poder abrir el bot de un toque en vez de buscarlo a mano.
      usuario: puesto ? await nombreDelBot() : null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");
  if (!hayTelegram()) return fallo(503, "sin_bot");

  const cuerpo = await req.json().catch(() => null);
  const accion = cuerpo?.accion === "probar" ? "probar" : "vincular";

  const { perfil, falta } = await miPerfil(supabase);
  if (falta) return fallo(503, "falta_migracion");
  if (!perfil) return fallo(401, "sin_sesion");

  /* Probar: se manda a la conversación YA guardada. Nunca a una que
     venga en la petición, que sería mandar mensajes de Kairo a donde
     diga cualquiera. */
  if (accion === "probar") {
    if (!perfil.telegram_chat_id) return fallo(409, "sin_vincular");

    const fue = await mandar(
      perfil.telegram_chat_id,
      "Soy Kairo. Esto es una prueba: si lees esto, los Co-Works te llegarán aquí.",
    );
    return fue ? Response.json({ ok: true }) : fallo(502, "no_se_ha_podido");
  }

  /* Vincular. El código sale del perfil de QUIEN PREGUNTA, así que la
     conversación se guarda en su cuenta y en ninguna otra: por aquí no
     se puede enlazar el Telegram de alguien con la cuenta de al lado. */
  const chat = await buscarChat(codigoDe(perfil.id));
  if (!chat) return fallo(404, "no_encontrado");

  const { error } = await supabase
    .from("perfiles")
    .update({ telegram_chat_id: chat })
    .eq("id", perfil.id);

  if (error) {
    return faltaColumna(error) ? fallo(503, "falta_migracion") : fallo(500, "no_se_ha_podido");
  }

  await mandar(chat, "Listo. A partir de ahora te mando aquí lo que preparen tus Co-Works.");
  return Response.json({ ok: true });
}

export async function DELETE() {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const { perfil } = await miPerfil(supabase);
  if (!perfil) return fallo(401, "sin_sesion");

  /* Desenlazar tiene que ser tan fácil como enlazar. Si irse cuesta más
     que entrar, deja de ser tuyo. */
  const { error } = await supabase
    .from("perfiles")
    .update({ telegram_chat_id: null })
    .eq("id", perfil.id);

  return error ? fallo(500, "no_se_ha_podido") : Response.json({ ok: true });
}
