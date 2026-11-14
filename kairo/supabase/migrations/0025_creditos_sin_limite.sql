-- =============================================================
-- Kairo · Cuentas sin límite de créditos (la del creador)
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Una cuenta marcada como `ilimitado` usa Kairo sin gastar créditos:
-- las dos funciones que cobran (la del chat y la de los Co-Works) ven
-- la marca y no restan nada.
--
-- La marca SOLO se puede poner desde aquí, desde el SQL Editor. Desde
-- la web nadie puede ponérsela: los usuarios solo pueden cambiar su
-- nombre, tono, idioma y Telegram (ver 0001 y 0013).
-- =============================================================

alter table public.perfiles
  add column if not exists ilimitado boolean not null default false;

-- Cobrar desde el chat (lo llama el navegador del usuario).
create or replace function public.gastar_creditos(
  p_cantidad integer,
  p_motivo   text default ''
)
returns table (creditos integer, creditos_extra integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil    uuid;
  v_del_plan  integer;
  v_del_extra integer;
  v_ilimitado boolean;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  select id into v_perfil from public.perfiles where auth_id = auth.uid();
  if v_perfil is null then
    raise exception 'Sin sesión' using errcode = '28000';
  end if;

  -- Bloquea la fila para que dos pestañas a la vez no gasten el mismo crédito
  select p.creditos, p.creditos_extra, p.ilimitado
    into v_del_plan, v_del_extra, v_ilimitado
    from public.perfiles p
   where p.id = v_perfil
     for update;

  -- Sin límite: no se resta nada y el saldo se queda como está.
  if v_ilimitado then
    return query
      select p.creditos, p.creditos_extra from public.perfiles p where p.id = v_perfil;
    return;
  end if;

  if v_del_plan + v_del_extra < p_cantidad then
    raise exception 'Créditos insuficientes' using errcode = 'P0002';
  end if;

  v_del_plan  := least(v_del_plan, p_cantidad);
  v_del_extra := p_cantidad - v_del_plan;

  update public.perfiles p
     set creditos       = p.creditos - v_del_plan,
         creditos_extra = p.creditos_extra - v_del_extra
   where p.id = v_perfil;

  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  values (v_perfil, 'gasto', -p_cantidad, coalesce(p_motivo, ''));

  return query
    select p.creditos, p.creditos_extra from public.perfiles p where p.id = v_perfil;
end;
$$;
revoke all on function public.gastar_creditos(integer, text) from public;
grant execute on function public.gastar_creditos(integer, text) to authenticated;

-- Cobrar desde el servidor (Co-Works, que no tienen a nadie delante).
create or replace function public.gastar_creditos_de(
  p_perfil   uuid,
  p_cantidad integer,
  p_motivo   text default ''
)
returns table (creditos integer, creditos_extra integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_del_plan  integer;
  v_del_extra integer;
  v_ilimitado boolean;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  if p_perfil is null then
    raise exception 'Falta el perfil' using errcode = '22023';
  end if;

  select p.creditos, p.creditos_extra, p.ilimitado
    into v_del_plan, v_del_extra, v_ilimitado
    from public.perfiles p
   where p.id = p_perfil
     for update;

  if not found then
    raise exception 'Perfil no encontrado' using errcode = 'P0003';
  end if;

  if v_ilimitado then
    return query
      select p.creditos, p.creditos_extra from public.perfiles p where p.id = p_perfil;
    return;
  end if;

  if v_del_plan + v_del_extra < p_cantidad then
    raise exception 'Créditos insuficientes' using errcode = 'P0002';
  end if;

  v_del_plan  := least(v_del_plan, p_cantidad);
  v_del_extra := p_cantidad - v_del_plan;

  update public.perfiles p
     set creditos       = p.creditos - v_del_plan,
         creditos_extra = p.creditos_extra - v_del_extra
   where p.id = p_perfil;

  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  values (p_perfil, 'gasto', -p_cantidad, coalesce(p_motivo, ''));

  return query
    select p.creditos, p.creditos_extra from public.perfiles p where p.id = p_perfil;
end;
$$;
revoke all on function public.gastar_creditos_de(uuid, integer, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.gastar_creditos_de(uuid, integer, text) to service_role';
    execute 'grant execute on function public.gastar_creditos(integer, text) to service_role';
  end if;
end
$$;

-- -------------------------------------------------------------
-- PARA MARCAR UNA CUENTA (no se ejecuta solo: quita los dos guiones
-- del principio de cada línea y pon tu correo):
--
-- update public.perfiles
--    set ilimitado = true, plan = 'supreme', creditos = 6000
--  where auth_id = (select id from auth.users where email = 'TU_CORREO');
-- -------------------------------------------------------------
