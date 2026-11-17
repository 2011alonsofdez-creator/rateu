-- =============================================================
-- 0027 · CERRAR PERMISOS (seguridad, importante)
--
-- Supabase, al crear una tabla o una función en `public`, se las da
-- ENTERAS a los roles `anon` y `authenticated` (permisos por defecto).
-- "grant update (nombre, tono, idioma)" no quita nada: añade. Y
-- "revoke ... from public" tampoco, porque esos roles tienen el permiso
-- con su nombre, no a través de "public".
--
-- Resultado antes de esto:
--   1. Cualquiera con sesión podía, desde la consola del navegador y con
--      la clave pública de la web, hacerse:
--        update perfiles set creditos = 999999, plan = 'supreme',
--                            ilimitado = true, modo_edad = 'adulto'
--      (la política dejaba editar SU fila; el permiso, TODAS sus columnas).
--   2. Cualquiera con sesión podía llamar a recargar_creditos_free() y
--      volver a tener 40 créditos cuando quisiera (y a la vez a todos los
--      del plan gratis).
--
-- Esto se puede pegar las veces que haga falta: no borra datos.
-- =============================================================

-- 1. PERFILES: se lee lo tuyo; se cambia SOLO lo que la web cambia.
revoke all on table public.perfiles from anon, authenticated;
grant select on table public.perfiles to authenticated;
grant update (nombre, tono, idioma, telegram_chat_id) on table public.perfiles to authenticated;

-- 2. Lo que solo puede tocar el servidor (cobros, recargas, pagos).
revoke all on function public.recargar_creditos_free() from public, anon, authenticated;
revoke all on function public.recargar_plan(uuid, text) from public, anon, authenticated;
revoke all on function public.aplicar_suscripcion(uuid, text, text, text, date, date, text, text) from public, anon, authenticated;
revoke all on function public.anadir_creditos(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.registrar_evento_pago(text, text) from public, anon, authenticated;

-- 3. Historial de créditos y suscripciones: solo se leen desde la web.
--    (La seguridad por filas ya lo impedía; esto lo deja cerrado también
--    por permisos, por si un día alguien añade una política de más.)
revoke insert, update, delete, truncate on table public.movimientos   from anon, authenticated;
revoke insert, update, delete, truncate on table public.suscripciones from anon, authenticated;

-- 4. Nadie sin sesión toca nada de nadie.
revoke all on table public.perfiles, public.conversaciones, public.mensajes,
                    public.movimientos, public.suscripciones, public.mentes,
                    public.fichas, public.papeles, public.apps_code
  from anon;

-- Listo. Si no da error, ya está cerrado.

-- =============================================================
-- 5. LA RECARGA DIARIA DEL PLAN GRATIS, A PRUEBA DE FALLOS
--
-- Antes dependía solo de pg_cron (Database → Extensions). Si no estaba
-- activado, los del plan gratis se quedaban sin créditos para siempre y
-- nada lo decía. Ahora también la lanza el reloj de los Co-Works (cada
-- 10 minutos), y por eso cada perfil se recarga COMO MUCHO una vez al
-- día: solo si su `renueva_el` ya ha llegado.
-- =============================================================
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
       set creditos   = 40,
           renueva_el = (current_date + interval '1 day')::date
     where plan = 'free'
       and creditos < 40
       and (renueva_el is null or renueva_el <= current_date)
    returning id
  )
  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  select id, 'recarga', 40, 'Recarga diaria del plan gratuito' from recargados;

  get diagnostics v_afectados = row_count;
  return v_afectados;
end;
$$;
revoke all on function public.recargar_creditos_free() from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.recargar_creditos_free() to service_role';
  end if;
end $$;
