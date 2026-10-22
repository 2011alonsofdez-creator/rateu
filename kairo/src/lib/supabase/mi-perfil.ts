import type { clienteServidor } from "./server";
import { faltaFuncion } from "./compat";

/* TU PERFIL, Y NO EL DE AL LADO.
 *
 * `perfiles` deja ver el tuyo y, si tienes hijos a cargo, el de ellos:
 * está puesto a propósito en la política `perfiles_leer`. El problema
 * era cómo se pedía en media docena de rutas:
 *
 *     .from("perfiles").select(...).limit(1)
 *
 * Eso da por hecho que solo hay una fila. Con un hijo a cargo hay dos,
 * y PostgreSQL no promete ningún orden sin ORDER BY: puede salir
 * cualquiera de las dos. La web acababa leyendo la edad, el tono, el
 * nombre y el saldo del hijo mientras quien escribía era el adulto.
 *
 * A un desconocido no se le escapaba nada —un hijo no ve nunca al
 * adulto, y dos personas sin relación no se ven jamás—, pero dentro de
 * una familia sí se cruzaba. Y eso ya es cruzarse.
 *
 * Todo pasa por aquí para que no vuelva a quedarse un `.limit(1)`
 * suelto en una ruta nueva.
 */

type Cliente = NonNullable<Awaited<ReturnType<typeof clienteServidor>>>;

export type ConPerfil<T> = {
  perfil: T | null;
  /** Falta la migración 0016. Se ha contestado igual, por el camino
   *  largo; esto solo sirve para poder decirlo en la revisión. */
  sinFuncion: boolean;
};

/** Tu fila de `perfiles`, con las columnas que le pidas.
 *
 *  Un viaje cuando la migración 0016 está puesta, que es lo normal. Dos
 *  cuando no: se pregunta el identificador y después la fila. Nunca una
 *  fila que no sea la tuya. */
export async function miPerfil<T>(
  supabase: Cliente,
  columnas: string,
): Promise<ConPerfil<T>> {
  const { data, error } = await supabase
    .rpc("mi_perfil")
    .select(columnas)
    .maybeSingle();

  if (!error) return { perfil: (data as T | null) ?? null, sinFuncion: false };

  /* Un error que no sea "esa función no existe" se trata como que no
     hay perfil, igual que antes: sin sesión tampoco hay fila. Lo que no
     se hace es seguir adelante con una fila cualquiera. */
  if (!faltaFuncion(error)) return { perfil: null, sinFuncion: false };

  const { data: id } = await supabase.rpc("mi_perfil_id");
  if (typeof id !== "string" || !id) return { perfil: null, sinFuncion: true };

  const { data: fila } = await supabase
    .from("perfiles")
    .select(columnas)
    .eq("id", id)
    .maybeSingle();

  return { perfil: (fila as T | null) ?? null, sinFuncion: true };
}
