import { clienteServidor } from "@/lib/supabase/server";
import { faltaColumna } from "@/lib/supabase/compat";
import { esTipo, necesitaTemas, recetaDe } from "@/lib/coworks/recetas";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

/* Tus Co-Works.
 *
 * GET    → los tuyos, con los últimos resultados
 * POST   → crea uno
 * PATCH  → cambia uno  {id, ...}
 * DELETE ?id= → lo borra
 *
 * Ninguna consulta filtra por usuario, y no hace falta: la seguridad a
 * nivel de fila solo deja ver y tocar lo tuyo. Lo que sí se filtra aquí
 * es lo que ENTRA, porque de la base de datos se fía uno, del cuerpo de
 * una petición no.
 */

const COLUMNAS = "id, nombre, tipo, temas, hora, zona, activo, ultima_vez, creado_el";
const COLUMNAS_RESULTADO =
  "id, cowork_id, dia, estado, contenido, fuentes, modelo, conversacion_id, creado_el";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fallo = (estado: number, motivo: string) =>
  Response.json({ error: motivo }, { status: estado });

/** Una zona horaria que exista de verdad. Si no, Madrid. */
function zonaValida(z: unknown): string {
  const texto = typeof z === "string" ? z.trim() : "";
  if (!texto || texto.length > 60) return "Europe/Madrid";
  try {
    new Intl.DateTimeFormat("es-ES", { timeZone: texto }).format(new Date());
    return texto;
  } catch {
    return "Europe/Madrid";
  }
}

/** La hora, entera y dentro del día. */
function horaValida(h: unknown, porDefecto = 7): number {
  const n = Math.trunc(Number(h));
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : porDefecto;
}

const recortar = (v: unknown, tope: number) =>
  (typeof v === "string" ? v : "").trim().slice(0, tope);

export async function GET() {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ coworks: [], resultados: [] });

  const { data, error } = await supabase
    .from("coworks")
    .select(COLUMNAS)
    .order("creado_el", { ascending: true })
    .limit(20);

  // Sin la migración 0009 la tabla no existe. No es un error rojo: es
  // que esto todavía no está montado en tu base de datos.
  if (error) return Response.json({ coworks: [], resultados: [], falta: faltaColumna(error) });

  const { data: resultados } = await supabase
    .from("cowork_resultados")
    .select(COLUMNAS_RESULTADO)
    .order("creado_el", { ascending: false })
    .limit(60);

  return Response.json(
    { coworks: data ?? [], resultados: resultados ?? [] },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);

  /* La lista de tipos está cerrada aquí además de en la base de datos:
     lo que llegue en el cuerpo y no esté en ella es un Daily Brief, no
     un tipo nuevo inventado por quien escribe la petición. */
  const tipo = esTipo(cuerpo?.tipo) ? cuerpo.tipo : "brief";

  /* El vigilante no tiene temas: mira siempre lo mismo, que es que la
     casa no se haya caído. Pedirle temas sería pedirle al detector de
     humo que le digas qué habitación vigilar. */
  const temas = necesitaTemas(tipo) ? recortar(cuerpo?.temas, 600) : "";
  if (necesitaTemas(tipo) && !temas) return fallo(400, "sin_temas");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!perfil) return fallo(401, "sin_sesion");

  const { data, error } = await supabase
    .from("coworks")
    .insert({
      perfil_id: perfil.id,
      nombre: recortar(cuerpo?.nombre, 120) || (tipo === "salud" ? "Vigilante" : recetaDe(tipo).nombre),
      tipo,
      temas,
      hora: horaValida(cuerpo?.hora),
      zona: zonaValida(cuerpo?.zona),
      activo: cuerpo?.activo !== false,
    })
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    if (faltaColumna(error)) return fallo(503, "falta_migracion");
    // El tope de diez llega como P0001 con su mensaje ya escrito.
    if (error.code === "P0001") return fallo(409, "demasiados");
    /* La lista cerrada de `tipo` no acepta 'salud' hasta que se pega
       0010_vigilante.sql. Pasa de verdad: quien puso 0009 antes de esta
       versión tiene la tabla con la lista vieja. Sin esta línea sale un
       500 genérico y nadie averigua nunca que falta una migración. */
    if (error.code === "23514" && /tipo/i.test(error.message)) {
      return fallo(503, "falta_migracion");
    }
    console.error("[kairo] no se pudo crear el Co-Work:", error.message);
    return fallo(500, "no_se_ha_podido");
  }

  return Response.json({ cowork: data });
}

export async function PATCH(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const id = typeof cuerpo?.id === "string" ? cuerpo.id : "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  /* Solo estos cinco campos. Lo que no esté en esta lista no se toca, ni
     aunque venga en el cuerpo: `perfil_id` viaja por aquí a diario en
     los intentos de los curiosos. */
  const cambios: Record<string, unknown> = {};
  if (cuerpo?.nombre !== undefined) {
    /* Si lo dejas en blanco se queda como estaba: un Co-Work sin nombre
       en la lista es una tarjeta que no se sabe cuál es, y poner aquí
       "Daily Brief" le cambiaría el nombre a un repaso. */
    const nombre = recortar(cuerpo.nombre, 120);
    if (nombre) cambios.nombre = nombre;
  }
  /* El tipo NO está en esta lista y no es un olvido: convertir a mitad
     de vida un Daily Brief en un vigilante (o al revés) dejaría el
     encargo con los datos del otro. Si quieres el otro, se crea. */
  if (cuerpo?.temas !== undefined) {
    const temas = recortar(cuerpo.temas, 600);
    if (!temas) return fallo(400, "sin_temas");
    cambios.temas = temas;
  }
  if (cuerpo?.hora !== undefined) cambios.hora = horaValida(cuerpo.hora);
  if (cuerpo?.zona !== undefined) cambios.zona = zonaValida(cuerpo.zona);
  if (cuerpo?.activo !== undefined) cambios.activo = Boolean(cuerpo.activo);

  if (!Object.keys(cambios).length) return fallo(400, "nada_que_cambiar");

  const { data, error } = await supabase
    .from("coworks")
    .update(cambios)
    .eq("id", id)
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    console.error("[kairo] no se pudo cambiar el Co-Work:", error.message);
    return fallo(500, "no_se_ha_podido");
  }
  if (!data) return fallo(404, "no_encontrado");

  return Response.json({ cowork: data });
}

export async function DELETE(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const { error } = await supabase.from("coworks").delete().eq("id", id);
  if (error) return fallo(500, "no_se_ha_podido");

  return Response.json({ ok: true });
}
