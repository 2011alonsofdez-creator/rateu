-- =============================================================
-- Kairo · Paso 2 — Recarga diaria del plan gratuito
-- Ejecutar DESPUÉS de 0001_esquema.sql.
-- =============================================================

-- Devuelve a 15 los créditos de las cuentas gratuitas.
-- Solo toca a quien tenga menos de 15: así no se le quitan créditos
-- a nadie ni se rellena a quien no ha gastado.
create or replace function public.recargar_creditos_free()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_afectados integer;
begin
  with recargados as (
    update public.perfiles
       set creditos   = 15,
           renueva_el = (current_date + interval '1 day')::date
     where plan = 'free'
       and creditos < 15
    returning id, 15 - creditos as antes
  )
  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  select id, 'recarga', 15, 'Recarga diaria del plan gratuito' from recargados;

  get diagnostics v_afectados = row_count;
  return v_afectados;
end;
$$;

-- Nadie la llama desde el navegador: la dispara el planificador.
revoke all on function public.recargar_creditos_free() from public;

-- -------------------------------------------------------------
-- Programarla cada día a las 3:00 (UTC).
--
-- Requiere la extensión pg_cron, que se activa una sola vez desde
-- el panel: Database → Extensions → buscar "pg_cron" → Enable.
--
-- Si aún no está activada, este bloque no falla: te avisa y sigue.
-- Puedes volver a ejecutar este archivo después de activarla.
-- -------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    -- Quita la tarea anterior si ya existía, para no duplicarla
    if exists (select 1 from cron.job where jobname = 'kairo-recarga-free') then
      perform cron.unschedule('kairo-recarga-free');
    end if;

    perform cron.schedule(
      'kairo-recarga-free',
      '0 3 * * *',
      $cron$ select public.recargar_creditos_free(); $cron$
    );

    raise notice 'Recarga diaria programada a las 03:00 UTC.';
  else
    raise notice 'pg_cron no está activado. Actívalo en Database → Extensions y vuelve a ejecutar este archivo.';
  end if;
end;
$$;
