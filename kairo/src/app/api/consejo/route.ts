import { revisarAdjuntos } from "@/lib/ia/adjuntos";
import { formarConsejo, hayConsejo } from "@/lib/consejo/miembros";
import { flujo, type Encargo } from "@/lib/consejo/motor";
import type { Modo } from "@/lib/consejo/tipos";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

/* El consejo completo son tres rondas en serie, y cada ronda espera a que
   conteste el más lento de todos. Con el tope de 60 segundos del chat se
   cortaba a mitad de la ronda 2. */
export const maxDuration = 300;

/** Lo que se le deja escribir a la pregunta. Lo largo va en los adjuntos,
 *  que para eso están y se transcriben una sola vez. */
const PREGUNTA_MAX = 8000;

/* Quién está en la mesa, antes de preguntar nada.
 *
 * La página lo pide al cargar para enseñar el consejo y avisar si está
 * incompleto. Vale la pena que sea una llamada aparte: así ves con quién
 * vas a deliberar ANTES de escribir la pregunta, y no después de haberla
 * escrito y haber esperado tres minutos. */
export async function GET() {
  const c = formarConsejo();
  return Response.json(
    { miembros: c.miembros, aviso: c.aviso, listo: hayConsejo(c) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(peticion: Request) {
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await peticion.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "La petición no es JSON válido." }, { status: 400 });
  }

  const pregunta = String(cuerpo.pregunta ?? "").trim();
  if (!pregunta) {
    return Response.json({ error: "Falta la pregunta." }, { status: 400 });
  }
  if (pregunta.length > PREGUNTA_MAX) {
    return Response.json(
      { error: `La pregunta pasa de ${PREGUNTA_MAX} caracteres. Lo largo, en un archivo.` },
      { status: 400 },
    );
  }

  const modo: Modo = cuerpo.modo === "completo" ? "completo" : "rapido";

  /* Los archivos pasan por la misma revisión que en el chat. No es por
     ahorrar código: es que esa función es la que decide de verdad qué
     entra, y el navegador no decide nada porque la petición se puede
     escribir a mano. */
  const archivos = revisarAdjuntos(cuerpo.adjuntos);

  const c = formarConsejo();
  if (!hayConsejo(c)) {
    return Response.json(
      { error: c.aviso ?? "No hay consejo que formar: faltan claves de proveedores." },
      { status: 503 },
    );
  }

  const encargo: Encargo = {
    pregunta,
    material: archivos.texto,
    adjuntos: archivos.adjuntos,
    modo,
  };

  return new Response(flujo(encargo), {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      /* Sin esto, un proxy que almacene en búfer se guarda las tres
         rondas y las suelta de golpe al final: el usuario mira una
         pantalla quieta durante dos minutos y se cree que se ha colgado. */
      "x-accel-buffering": "no",
    },
  });
}
