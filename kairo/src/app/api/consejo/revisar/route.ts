import { revisarDocumentos } from "@/lib/consejo/documentos";
import { leerTodo } from "@/lib/consejo/leer";
import { formarConsejo } from "@/lib/consejo/miembros";
import { esRefCli } from "@/lib/consejo/cli";
import { aceptaArchivos } from "@/lib/ia/proveedores";

export const runtime = "nodejs";
export const maxDuration = 60;

/* Qué se puede leer de los documentos, ANTES de deliberar.
 *
 * Esto no llama a ningún modelo: abre los PDFs aquí, mira si traen capa
 * de texto y comprueba si en la mesa hay alguien capaz de mirar un
 * archivo. Son unos milisegundos y no cuesta nada.
 *
 * Existe porque pasó lo contrario. Un expediente con la carta de sanción
 * escaneada se mandó tres veces: las tres se pagó la deliberación entera
 * —quince llamadas— y las tres el aviso de «sin capa de texto y ningún
 * miembro ha podido mirarlo» llegó al final, cuando el dinero ya estaba
 * gastado. El dato estaba disponible antes de empezar; lo que faltaba
 * era mirarlo antes.
 */
export async function POST(peticion: Request) {
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await peticion.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "La petición no es JSON válido." }, { status: 400 });
  }

  const archivos = revisarDocumentos(cuerpo.adjuntos);
  const lecturas = await leerTodo(archivos.documentos);

  /* ¿Hay alguien en la mesa que pueda mirar un archivo? Un programa
     local no recibe archivos y los de OpenRouter tampoco, así que un
     consejo entero por OpenRouter no puede ver un escaneo por mucho que
     se lo mandes. */
  const c = formarConsejo();
  const puedenMirar = c.miembros.some((m) =>
    m.refs.some((ref) => !esRefCli(ref) && aceptaArchivos(ref)),
  );

  const texto = lecturas.filter((l) => l.estado === "texto");
  const necesitanOjos = lecturas.filter((l) => l.estado === "escaneo" || l.estado === "imagen");
  const rotos = lecturas.filter((l) => l.estado === "roto");

  return Response.json(
    {
      archivos: lecturas.map(({ nombre, estado, paginas, caracteres, motivo }) => ({
        nombre,
        estado,
        paginas,
        caracteres,
        motivo,
      })),
      /** Caracteres que ya están listos sin gastar una llamada. */
      caracteres: texto.reduce((n, l) => n + l.caracteres, 0),
      puedenMirar,
      /** Lo que se va a quedar fuera si se lanza tal cual. */
      sinLeer: puedenMirar ? [] : necesitanOjos.map((l) => l.nombre),
      rotos: rotos.map((l) => l.nombre),
      rechazados: archivos.rechazados,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
