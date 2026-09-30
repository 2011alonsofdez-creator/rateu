import { clienteServidor } from "@/lib/supabase/server";
import { buscarHechos, type Diario } from "@/lib/ia/buscar";
import { esDeAhora } from "@/lib/ia/ahora";

export const runtime = "nodejs";
export const maxDuration = 45;
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

/* PROBAR LA BÚSQUEDA, DELANTE DE TI.
 *
 * «Sigue dando información desactualizada» es un síntoma con cuatro
 * causas posibles, y desde fuera se ven las cuatro exactamente igual:
 *
 *   1. Ni siquiera se ha buscado, porque la pregunta no ha disparado la
 *      búsqueda.
 *   2. Se ha buscado y Google no tenía nada.
 *   3. La llamada ha fallado —un identificador de modelo que ya no
 *      existe, una cuenta sin buscador, la cuota agotada—.
 *   4. Se ha buscado bien y el que contesta ha pasado de los resultados.
 *
 * Se arreglan de cuatro formas distintas, así que adivinar cuál es sale
 * caro: se prueba una, se despliega, se espera, y vuelta a empezar. Esto
 * lo dice en una pantalla y en diez segundos.
 *
 * Hace una búsqueda de verdad, así que pide sesión: si no, cualquiera
 * podría gastar la cuota de Gemini desde fuera llamando en bucle. No
 * cuesta créditos —es una herramienta para arreglar, no un uso—, pero sí
 * tiene una espera entre pruebas por lo mismo.
 */

const ESPERA = 8000;

/* La espera entre pruebas, y lo que NO es.
 *
 * Esto vive en la memoria de una función que se levanta y se muere, y
 * hay varias a la vez: dos peticiones seguidas pueden caer en dos
 * copias distintas, cada una con su mapa vacío. O sea que no es un
 * candado: es un freno para el dedo nervioso que pulsa "Probar" cinco
 * veces seguidas, que es el caso real. El candado de verdad es que hay
 * que haber iniciado sesión.
 *
 * Y con tope de tamaño, porque una copia caliente atendiendo a mucha
 * gente iría acumulando una entrada por persona para siempre. */
const ESPERAS_MAX = 500;
const ultima = new Map<string, number>();

export async function POST(req: Request) {
  const supabase = await clienteServidor();
  if (!supabase) return Response.json({ error: "demo" }, { status: 503 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, modo_edad")
    .limit(1)
    .maybeSingle<{ id: string; modo_edad: "nino" | "adolescente" | "adulto" | null }>();

  if (!perfil) return Response.json({ error: "sin_sesion" }, { status: 401 });

  const desde = ultima.get(perfil.id) ?? 0;
  if (Date.now() - desde < ESPERA) {
    return Response.json({ error: "espera", segundos: Math.ceil(ESPERA / 1000) }, { status: 429 });
  }

  const cuerpo = await req.json().catch(() => null);
  const pregunta = (typeof cuerpo?.pregunta === "string" ? cuerpo.pregunta : "").trim().slice(0, 500);
  if (!pregunta) return Response.json({ error: "sin_pregunta" }, { status: 400 });

  /* El reloj se pone DESPUÉS de comprobar la pregunta: una petición mal
     formada no gasta nada, así que castigarla con ocho segundos de
     espera es castigar por nada. */
  if (ultima.size >= ESPERAS_MAX) ultima.clear();
  ultima.set(perfil.id, Date.now());

  /* Lo primero, y lo que más veces es la respuesta: ¿esta pregunta
     llega siquiera a disparar una búsqueda? Si esto sale "no", lo demás
     da igual, porque en el chat no se habría buscado nunca. */
  const dispara = esDeAhora(pregunta);

  const diario: Diario = { modelos: [], intentos: [] };
  const empezo = Date.now();

  /* Se busca aunque `dispara` sea false: así se ve si el problema es la
     pista que falta (busca bien cuando se le obliga) o la búsqueda en
     sí (tampoco funciona obligándola). */
  const hallazgo = await buscarHechos(pregunta, "", perfil.modo_edad, diario).catch(() => null);

  return Response.json(
    {
      pregunta,
      /* Si esto es false, en el chat esta pregunta NO habría buscado, y
         ahí está el fallo por muy bien que salga el resto. */
      dispara_busqueda: dispara,
      ms: Date.now() - empezo,
      modelos: diario.modelos,
      intentos: diario.intentos,
      busco: hallazgo?.busco ?? false,
      modelo: hallazgo?.modelo ?? null,
      fuentes: (hallazgo?.fuentes ?? []).map((f) => f.url).slice(0, 8),
      busquedas: hallazgo?.busquedas ?? [],
      // Un trozo, para ver si lo que trae tiene fecha de hoy o de hace dos años.
      hechos: (hallazgo?.hechos ?? "").slice(0, 1200),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
