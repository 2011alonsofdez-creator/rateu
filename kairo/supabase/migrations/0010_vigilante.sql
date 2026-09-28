-- =============================================================
-- Kairo · El Vigilante
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Un segundo tipo de Co-Work. El primero (brief) trabaja para ti; este
-- trabaja para Kairo: cada día comprueba que todo lo de debajo sigue en
-- pie —que Supabase responde, que no se ha pausado, que no falta ninguna
-- migración ni ninguna clave— y solo te escribe cuando algo va mal.
--
-- Aquí abajo solo hacen falta dos cosas: dejar que el tipo exista, y una
-- función para soltar los trabajos que se quedaron a medias.
-- =============================================================

-- -------------------------------------------------------------
-- 1. EL TIPO NUEVO
--    La columna ya existía con su lista cerrada, que es justo para lo
--    que sirve una lista cerrada: para tener que venir aquí y decidirlo
--    a propósito en vez de que aparezcan tipos sueltos por descuido.
-- -------------------------------------------------------------

alter table public.coworks drop constraint if exists coworks_tipo_check;
alter table public.coworks
  add constraint coworks_tipo_check check (tipo in ('brief', 'salud'));

-- -------------------------------------------------------------
-- 2. SOLTAR LO QUE SE QUEDÓ A MEDIAS
--
--    Cuando un servidor se cae a mitad de un Co-Work, su reserva se
--    queda puesta con estado 'ejecutando'. `reservar_cowork` ya perdona
--    las de hoy a los quince minutos, pero una de hace tres días se
--    queda ahí para siempre, ocupando el día de un trabajo que nunca
--    llegó a hacerse.
--
--    Esto las borra. Es de las poquísimas cosas que el vigilante arregla
--    solo, y puede hacerlo porque no toca nada de nadie: borra una fila
--    que dice "empecé" de un trabajo que nunca terminó.
-- -------------------------------------------------------------

-- Por si ya existía la versión de una sola pieza: se quita antes, o
-- PostgreSQL dejaría las dos conviviendo como dos funciones distintas.
drop function if exists public.soltar_coworks_atascados(integer);

create or replace function public.soltar_coworks_atascados(
  p_horas  integer default 1,
  -- De quién. El vigilante de cada uno suelta lo suyo y nada más:
  -- pudiendo tocarlo todo, tocar solo lo tuyo es la diferencia entre una
  -- reparación y un destrozo. Admite nulo (todos) para poder limpiar a
  -- mano desde el panel si algún día hace falta.
  p_perfil uuid default null
)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cuantos integer;
begin
  delete from public.cowork_resultados
   where estado = 'ejecutando'
     and creado_el < now() - make_interval(hours => greatest(1, coalesce(p_horas, 1)))
     and (p_perfil is null or perfil_id = p_perfil);

  get diagnostics v_cuantos = row_count;
  return v_cuantos;
end;
$$;

-- Del servidor, como todas las del reparto. Un usuario que pudiera
-- llamarla podría borrar reservas ajenas y provocar trabajo repetido.
revoke all on function public.soltar_coworks_atascados(integer, uuid) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.soltar_coworks_atascados(integer, uuid) to service_role';
  end if;
end
$$;
