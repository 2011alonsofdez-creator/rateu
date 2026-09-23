import { clienteServidor } from "./supabase/server";
import { hasSupabase } from "./supabase/config";
import { perfilDemo } from "./perfil";
import type { Mente } from "./tipos";

/* Lectura de Mentes. Solo servidor: usa cookies.
   No hace falta filtrar por usuario en ninguna consulta porque la
   seguridad a nivel de fila ya devuelve únicamente las tuyas. */

const COLUMNAS = "id, nombre, emoji, descripcion, instrucciones, tono";

/** Tres Mentes de ejemplo para cuando no hay Supabase configurado.
 *  Llevan el nombre de quien ha entrado: así se ve de un vistazo que
 *  la idea es que sean TUYAS. */
export function mentesDemo(): Mente[] {
  const nombre = perfilDemo().nombre;
  return [
    {
      id: "demo-1",
      nombre: "Community manager",
      emoji: "📣",
      descripcion: "Escribe mis publicaciones con mi tono de siempre",
      instrucciones:
        "Escribes publicaciones para redes sociales. Frases cortas, nada de palabras huecas y siempre una idea por publicación.",
      tono: "chispa",
    },
    {
      id: "demo-2",
      nombre: "Revisor de contratos",
      emoji: "⚖️",
      descripcion: "Busca cláusulas abusivas y me las explica en claro",
      instrucciones:
        "Lees contratos y señalas lo que perjudica a quien firma. Cita la cláusula, explica qué significa en palabras normales y di si es negociable.",
      tono: "experto",
    },
    {
      id: "demo-3",
      nombre: `Profe de ${nombre}`,
      emoji: "📚",
      descripcion: "Explica el temario sin dar la respuesta hecha",
      instrucciones:
        "Ayudas a estudiar. Nunca das la solución directa: haces preguntas y das pistas hasta que salga sola. Al final, un resumen de lo aprendido.",
      tono: "cercano",
    },
  ];
}

/** Las Mentes de quien está usando la app, de la más antigua a la más nueva. */
export async function listarMentes(): Promise<Mente[]> {
  if (!hasSupabase) return mentesDemo();

  try {
    const supabase = await clienteServidor();
    if (!supabase) return mentesDemo();

    const { data, error } = await supabase
      .from("mentes")
      .select(COLUMNAS)
      .order("creada_el", { ascending: true });

    if (error) return [];
    return (data ?? []) as Mente[];
  } catch {
    return [];
  }
}
