-- =============================================================
-- Kairo · PROPUESTA: subir la gracia de los Co-Works de 8 a 12 horas
--
-- ESTO NO ESTÁ APLICADO. Lo propone kairo-guardian el 2026-11-24 y lo
-- aplica el dueño si le parece. Va sin número de serie a propósito,
-- para no pisarle el 0028: si lo acepta, se renombra al que toque.
-- Pegar entero en Supabase → SQL Editor → Run. Es idempotente.
--
-- POR QUÉ, Y ESTA VEZ CON LAS 265 EJECUCIONES MEDIDAS UNA POR UNA
--
-- La migración 0026 dio 8 horas de gracia a un Co-Work que se quedó sin
-- hacer, y fue el arreglo bueno: cubre el 98,3 % del tiempo. Pero la
-- medición completa del reloj, hecha el 24-11, encuentra el 1,7 % que
-- se le escapa, y no es teórico:
--
--   · Juntando los DOS relojes —las 174 ejecuciones verdes de GitHub
--     desde el 16-10 y el cron diario de Vercel de las 06:00— quedan
--     16 huecos de más de 8 horas en 38 días.
--   · 12 de esos 16 están en los últimos 14 días: va a peor.
--   · El peor fue el 23-11: de las 12:14 a las 00:07 del día siguiente,
--     11,9 horas. Son 3,9 horas por encima de la gracia, así que un
--     Co-Work de esa tarde no salió, y en silencio.
--   · 13 de los 16 huecos malos empiezan entre las 06:00 y las 09:00
--     UTC, o sea la mañana española: los encargos de primera hora son
--     justo los que se caen.
--
-- Doce horas cubren el peor hueco medido (11,9 h) con margen, y siguen
-- siendo prudentes: un Co-Work no se ejecuta nunca al día siguiente de
-- su día, porque la ventana se cierra en el día local de ayer.
--
-- Lo único que cambia respecto a 0026 es el número 8 → 12. El resto es
-- su función, copiada tal cual.
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
    -- de 12 horas y el Co-Work ya existía entonces.
    select c.*, (public.hora_local(c.zona)::date - 1) as dia_tocado
      from public.coworks c
     where c.activo
       and public.hora_local(c.zona)
           < (public.hora_local(c.zona)::date - 1) + make_interval(hours => c.hora + 12)
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
