-- =============================================================
-- 0016 · TU PERFIL, Y NO EL DE AL LADO
--
-- La seguridad a nivel de fila deja ver tu perfil... y, si tienes
-- hijos a cargo, también el de ellos. Es a propósito: para eso está
-- `perfiles_leer`. Pero el código pedía el perfil así:
--
--     select ... from perfiles limit 1
--
-- confiando en que solo iba a volver uno. Con un perfil hijo a cargo
-- vuelven dos, y cuál de los dos sale primero no lo decide nadie:
-- PostgreSQL no promete ningún orden sin ORDER BY. O sea que la web
-- podía estar mirando la edad, el tono, el nombre y el saldo del hijo
-- mientras la persona que escribe es el adulto.
--
-- Nada de eso se escapa a un desconocido —el hijo nunca ve al padre, y
-- dos personas sin relación no se ven jamás—, pero dentro de una
-- familia sí se cruza, y eso ya es cruzarse.
--
-- Esta función devuelve TU fila y punto. Una sola llamada, así que el
-- chat no paga ni un viaje de más por hacerlo bien.
-- =============================================================

create or replace function public.mi_perfil()
returns setof public.perfiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.perfiles where auth_id = auth.uid();
$$;

-- OJO con los permisos: Supabase le da EXECUTE a `anon` y a
-- `authenticated` por su cuenta en cuanto se crea la función, y
-- `revoke ... from public` NO se lo quita. Hay que nombrarlos.
--
-- Sin sesión, `auth.uid()` es nulo y esto no devuelve nada igualmente;
-- se le quita a `anon` de todas formas, porque una función que no
-- hace falta no se deja abierta.
revoke all on function public.mi_perfil() from public, anon;
grant execute on function public.mi_perfil() to authenticated;

-- =============================================================
-- Listo. Nada que comprobar a ojo: si la web sigue entrando con tu
-- nombre y tu saldo, está hecho.
-- =============================================================
