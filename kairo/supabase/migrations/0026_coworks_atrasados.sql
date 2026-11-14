-- =============================================================
-- Kairo · Que un Co-Work atrasado se haga tarde, y no se pierda
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- POR QUÉ
--
-- El reloj de GitHub está puesto cada 20 minutos, pero en una cuenta
-- gratuita suena cuando puede: 3-5 veces al día, con huecos de 4 a 8
-- horas. Hasta ahora un Co-Work solo se hacía si el reloj sonaba entre
-- su hora y la medianoche de ese día. Un Co-Work de las 22:00 con el
-- siguiente toque a las 02:00 no salía NUNCA, y sin avisar.
--
-- Ahora, si al sonar el reloj hay un Co-Work de AYER que no se hizo y
-- su hora fue hace menos de 8 horas, se hace en ese momento (apuntado
-- en el día de ayer, que es el que le tocaba). Tarde, pero sale.
-- =============================================================

create or replace function public.coworks_pendientes(p_limite integer default 50)
returns table (
  id         uuid,
  perfil_id  uuid,
  nombre     text,
  tipo       text,
  temas      text,
  zona       text,
  dia        date,
  duenio     text,
  modo_edad  text,
  tono       text,
  plan       text,
  saldo      integer
)
language sql
stable
security definer
set search_path = public
as $$
  with candidatos as (
    -- Los de hoy, a partir de su hora (lo de siempre).
    select c.*, public.hora_local(c.zona)::date as dia_tocado
      from public.coworks c
     where c.activo
       and extract(hour from public.hora_local(c.zona)) >= c.hora

    union all

    -- Los de ayer que se quedaron sin hacer, si su hora fue hace menos
    -- de 8 horas y el Co-Work ya existía entonces.
    select c.*, (public.hora_local(c.zona)::date - 1) as dia_tocado
      from public.coworks c
     where c.activo
       and public.hora_local(c.zona)
           < (public.hora_local(c.zona)::date - 1) + make_interval(hours => c.hora + 8)
       and c.creado_el
           < now() - (public.hora_local(c.zona)
                      - ((public.hora_local(c.zona)::date - 1) + make_interval(hours => c.hora)))
  )
  select
    c.id,
    c.perfil_id,
    c.nombre,
    c.tipo,
    c.temas,
    c.zona,
    c.dia_tocado                    as dia,
    p.nombre                        as duenio,
    p.modo_edad,
    p.tono,
    p.plan,
    (p.creditos + p.creditos_extra) as saldo
  from candidatos c
  join public.perfiles p on p.id = c.perfil_id
  where not exists (
    select 1
      from public.cowork_resultados r
     where r.cowork_id = c.id
       and r.dia = c.dia_tocado
       /* Una reserva muerta (alguien se cayó a mitad) no cuenta como
          trabajo hecho: pasado un cuarto de hora se puede reintentar. */
       and not (
         r.estado = 'ejecutando'
         and r.creado_el < now() - interval '15 minutes'
       )
  )
  order by c.dia_tocado, c.creado_el
  limit greatest(1, least(coalesce(p_limite, 50), 200));
$$;

revoke all on function public.coworks_pendientes(integer) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.coworks_pendientes(integer) to service_role';
  end if;
end
$$;
