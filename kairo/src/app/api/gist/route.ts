import { clienteServidor } from "@/lib/supabase/server";
import { miPerfil } from "@/lib/supabase/mi-perfil";
import { resumir, tipoDeUrl, type Ficha, type Idioma } from "@/lib/ia/gist";
import { limpiaDeYoutube } from "@/lib/fichas";
import { CREDITOS } from "@/lib/ia/config";
import { clasificarError } from "@/lib/ia/errores";
import { limpiarFallo } from "@/lib/ia/fallos";
import { faltaColumna } from "@/lib/supabase/compat";

export const runtime = "nodejs";
/* Ver un vídeo entero lleva su tiempo. Es el techo de Vercel, y aun así
   un vídeo muy largo puede no llegar: eso se le dice al usuario. */
export const maxDuration = 60;
export const preferredRegion = "fra1";

/* Gist: la ficha de un enlace.
 *
 * GET  → tus fichas, la última primero
 * POST → {url} : la mira, la guarda y la devuelve
 * DELETE ?id=  → borra una
 *
 * Ninguna consulta filtra por usuario y no hace falta: la seguridad a
 * nivel de fila solo deja ver y tocar lo tuyo.
 */

const COLUMNAS = "id, tipo, url, titulo, autor, resumen, puntos, fuentes, modelo, creada_el";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fallo = (estado: number, motivo: string) =>
  new Response(JSON.stringify({ error: motivo }), {
    status: estado,
    headers: { "content-type": "application/json" },
  });

export async function GET() {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ fichas: [] });

  const { data, error } = await supabase
    .from("fichas")
    .select(COLUMNAS)
    .order("creada_el", { ascending: false })
    .limit(120);

  // Sin la migración 0008 la tabla no existe: no es un fallo que
  // haya que enseñar en rojo, es que esto todavía no está montado.
  if (error) {
    return Response.json({ fichas: [], falta: faltaColumna(error) });
  }

  return Response.json({ fichas: data ?? [] }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const cuerpo = await req.json().catch(() => null);
  const url = typeof cuerpo?.url === "string" ? cuerpo.url.trim() : "";

  const tipo = tipoDeUrl(url);
  if (!tipo) return fallo(400, "enlace_no_valido");

  /* El enlace de un vídeo, en limpio antes de nada. Lo que se pega lleva
     el minuto por el que iba y de dónde salió el clic, y eso estropea
     los enlaces de las partes y duplica fichas. Ver `limpiaDeYoutube`. */
  const enlace = tipo === "video" ? limpiaDeYoutube(url) : url;

  /* En qué idioma se quiere el resumen. Lo decide quien lee, no el
     vídeo: uno en inglés resumido en inglés no le sirve a quien no lo
     habla. Y si llega cualquier otra cosa en el cuerpo, español. */
  const idioma: Idioma = cuerpo?.idioma === "original" ? "original" : "es";

  const { perfil } = await miPerfil<{
    id: string;
    modo_edad: "nino" | "adolescente" | "adulto" | null;
    creditos: number;
    creditos_extra: number;
  }>(supabase, "id, modo_edad, creditos, creditos_extra");

  if (!perfil) return fallo(401, "sin_sesion");

  const coste = CREDITOS.normal;
  if (perfil.creditos + perfil.creditos_extra < coste) return fallo(402, "sin_creditos");

  let resultado;
  try {
    resultado = await resumir(enlace, tipo, perfil.modo_edad, idioma);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    /* Tachando antes lo que tenga pinta de clave: un "API key not valid:
       AIza…" de Google deja la clave entera escrita en el registro del
       servidor, y ese registro lo lee cualquiera que entre al panel. */
    console.error("[kairo] gist:", limpiarFallo(e));
    if (mensaje === "sin_clave") return fallo(503, "sin_clave");

    /* POR QUÉ NO HA PODIDO, QUE NO ES LO MISMO.
 
       Hasta ahora todo acababa en el mismo cartel: «si es un vídeo,
       tiene que ser público». Y eso es MENTIR cuando lo que pasa es que
       la cuota gratuita de Google se ha acabado por hoy, que es el caso
       más frecuente con diferencia. Quien lo lee se va a revisar la
       privacidad de un vídeo que estaba perfectamente público.
 
       Cada motivo lleva además lo que hay que hacer, que no es lo mismo:
       la del minuto se arregla esperando, la del día no se arregla hoy,
       y lo de un vídeo privado no se arregla nunca. */
    const motivo = clasificarError(e);
    if (motivo === "clave_invalida") return fallo(503, "sin_clave");
    if (motivo === "cuota_minuto") return fallo(429, "cuota_minuto");
    if (motivo === "cuota_dia" || motivo === "cuota_agotada") return fallo(429, "cuota_dia");
    if (motivo === "sobrecargado") return fallo(503, "sobrecargado");
    /* Y el vídeo que se ve entero pero del que no sale nada escrito.
       No es un fallo de enlace: es que no ha cabido. */
    if (mensaje === "vacio") return fallo(502, "vacio");
    return fallo(502, "no_se_ha_podido");
  }

  /* Se cobra DESPUÉS de tener la ficha: si el vídeo es privado, si la
     página no se deja leer o si el modelo falla, no se paga nada. */
  const { data: cobro, error: errorCobro } = await supabase.rpc("gastar_creditos", {
    p_cantidad: coste,
    p_motivo: `gist ${tipo}`,
  });
  if (errorCobro) return fallo(402, "sin_creditos");

  /* El saldo que queda, para que la pantalla lo ponga al día sin tener
     que recargarla. Lo dice la base de datos después de cobrar, que es
     la única que sabe cuánto queda de verdad.
 
     Y si no lo dice, NO se manda. Una respuesta vacía no es un saldo de
     cero: poniendo cero "por si acaso", la pantalla se quedaría creyendo
     que no te quedan créditos y te bloquearía el siguiente mensaje con
     el saldo intacto en la base de datos. */
  const fila = Array.isArray(cobro) ? cobro[0] : cobro;
  const saldo =
    typeof fila?.creditos === "number"
      ? { creditos: fila.creditos, creditosExtra: fila.creditos_extra ?? 0 }
      : null;

  const f: Ficha = resultado.ficha;
  const { data, error } = await supabase
    .from("fichas")
    .insert({
      perfil_id: perfil.id,
      tipo: f.tipo,
      url: f.url,
      titulo: f.titulo,
      autor: f.autor,
      resumen: f.resumen,
      puntos: f.puntos,
      fuentes: f.fuentes,
      modelo: resultado.modelo,
    })
    .select(COLUMNAS)
    .maybeSingle();

  if (error) {
    console.error("[kairo] no se guardó la ficha:", error.message);
    // La ficha está hecha y pagada: se devuelve aunque no se guarde.
    return Response.json({
      ficha: { ...f, id: "", creada_el: new Date().toISOString() },
      guardada: false,
      saldo,
    });
  }

  return Response.json({ ficha: data, guardada: true, saldo });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fallo(400, "id_no_valida");

  const supabase = await clienteServidor();
  if (!supabase) return fallo(503, "demo");

  const { error } = await supabase.from("fichas").delete().eq("id", id);
  if (error) return fallo(500, "no_se_ha_podido");

  return Response.json({ ok: true });
}
