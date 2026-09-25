-- =============================================================
-- Kairo · Paso 4 — Suscripciones y packs de créditos
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
-- =============================================================
--
-- Una regla manda sobre todo lo de aquí: EL NAVEGADOR NO TOCA EL DINERO.
-- Ni el plan, ni los créditos, ni el estado de la suscripción. Todo eso
-- lo mueven las funciones de abajo, y a esas funciones solo puede
-- llamarlas el servidor con la clave de administrador, nunca una página.

-- -------------------------------------------------------------
-- 1. TABLAS
-- -------------------------------------------------------------

create table if not exists public.suscripciones (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references public.perfiles (id) on delete cascade,
  proveedor      text not null default 'lemonsqueezy',
  -- El identificador que le da el proveedor. Es la llave para no
  -- duplicar suscripciones cuando reenvía el mismo aviso.
  proveedor_id   text not null,
  plan           text not null check (plan in ('plus', 'supreme')),
  estado         text not null check (estado in
                   ('en_prueba', 'activa', 'pausada', 'impagada', 'cancelada', 'vencida')),
  -- Cuándo se renueva, o cuándo se acaba si está cancelada.
  renueva_el     date,
  termina_el     date,
  -- Enlace del proveedor para que el usuario gestione o cancele su
  -- suscripción él mismo. Algunos caducan; si falla, el propio
  -- proveedor lo dirá, y siempre queda el enlace del correo de compra.
  portal         text,
  creada_el      timestamptz not null default now(),
  actualizada_el timestamptz not null default now(),
  unique (proveedor, proveedor_id)
);

create index if not exists idx_susc_perfil on public.suscripciones (perfil_id);

/* El libro de avisos ya atendidos.
   Los proveedores de pago reenvían un aviso si no les contestas rápido,
   y también si les da la gana. Sin esto, un reenvío del pack de 2.000
   créditos te los regala dos veces. Con esto, el segundo aviso no hace
   nada porque su identificador ya está en la tabla. */
create table if not exists public.eventos_pago (
  id          text primary key,
  tipo        text not null default '',
  recibido_el timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 2. SEGURIDAD
--    Tú ves tu suscripción. Nadie escribe nada desde el navegador.
-- -------------------------------------------------------------

alter table public.suscripciones enable row level security;
alter table public.eventos_pago  enable row level security;

drop policy if exists susc_leer on public.suscripciones;
create policy susc_leer on public.suscripciones
  for select using (perfil_id = public.mi_perfil_id());

-- Sin políticas de escritura a propósito, y sin ninguna política en
-- eventos_pago: esa tabla no la ve nadie más que el servidor.

grant select on public.suscripciones to authenticated;
revoke all on public.eventos_pago from anon, authenticated;

-- -------------------------------------------------------------
-- 3. APLICAR UNA SUSCRIPCIÓN
--
--    Cancelada NO es lo mismo que vencida, y confundirlas es quitarle
--    a alguien lo que ha pagado:
--      cancelada → no se renovará, pero sigue teniendo acceso hasta que
--                  termine el mes que ya pagó.
--      vencida   → se acabó. Ahora sí, a plan gratuito.
-- -------------------------------------------------------------

drop function if exists public.aplicar_suscripcion(uuid, text, text, text, date, date, text);

create or replace function public.aplicar_suscripcion(
  p_perfil       uuid,
  p_proveedor_id text,
  p_plan         text,
  p_estado       text,
  p_renueva      date default null,
  p_termina      date default null,
  p_portal       text default null,
  p_proveedor    text default 'lemonsqueezy'
)
returns public.perfiles
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil public.perfiles;
begin
  if p_perfil is null then
    raise exception 'Falta el perfil' using errcode = '22023';
  end if;

  insert into public.suscripciones
         (perfil_id, proveedor, proveedor_id, plan, estado, renueva_el, termina_el, portal)
  values (p_perfil, p_proveedor, p_proveedor_id, p_plan, p_estado, p_renueva, p_termina, p_portal)
  on conflict (proveedor, proveedor_id) do update
     set plan           = excluded.plan,
         estado         = excluded.estado,
         renueva_el     = excluded.renueva_el,
         termina_el     = excluded.termina_el,
         -- Si el aviso no trae portal, se conserva el que ya había.
         portal         = coalesce(excluded.portal, public.suscripciones.portal),
         actualizada_el = now();

  if p_estado in ('en_prueba', 'activa', 'cancelada') then
    -- Sigue teniendo lo que pagó. Los créditos NO se tocan aquí: se
    -- recargan cuando el proveedor confirma el cobro, no al firmar.
    update public.perfiles
       set plan       = p_plan,
           renueva_el = coalesce(p_renueva, p_termina, renueva_el)
     where id = p_perfil
    returning * into v_perfil;

  elsif p_estado in ('vencida', 'impagada') then
    update public.perfiles
       set plan       = 'free',
           creditos   = least(creditos, 15),
           renueva_el = (current_date + interval '1 day')::date
     where id = p_perfil
    returning * into v_perfil;

  else
    -- pausada: se queda como está, ni sube ni baja.
    select * into v_perfil from public.perfiles where id = p_perfil;
  end if;

  return v_perfil;
end;
$$;

-- -------------------------------------------------------------
-- 4. RECARGAR LOS CRÉDITOS DEL MES
--    Se llama cuando el proveedor confirma que ha cobrado. Los del plan
--    se reponen; los comprados en packs no se tocan, que esos no caducan.
-- -------------------------------------------------------------

create or replace function public.recargar_plan(
  p_perfil uuid,
  p_plan   text
)
returns public.perfiles
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil public.perfiles;
  v_cuanto integer;
begin
  v_cuanto := case p_plan
                when 'supreme' then 3000
                when 'plus'    then 1000
                else 15
              end;

  update public.perfiles
     set creditos = v_cuanto
   where id = p_perfil
  returning * into v_perfil;

  if v_perfil.id is null then
    raise exception 'Perfil no encontrado' using errcode = 'P0002';
  end if;

  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  values (p_perfil, 'recarga', v_cuanto, 'renovación del plan ' || p_plan);

  return v_perfil;
end;
$$;

-- -------------------------------------------------------------
-- 5. PACKS DE CRÉDITOS
--    Van a creditos_extra, que no caduca ni se pisa con la recarga
--    mensual: los has comprado aparte y son tuyos hasta que los gastes.
-- -------------------------------------------------------------

create or replace function public.anadir_creditos(
  p_perfil   uuid,
  p_cantidad integer,
  p_motivo   text default 'pack de créditos'
)
returns public.perfiles
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil public.perfiles;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  update public.perfiles
     set creditos_extra = creditos_extra + p_cantidad
   where id = p_perfil
  returning * into v_perfil;

  if v_perfil.id is null then
    raise exception 'Perfil no encontrado' using errcode = 'P0002';
  end if;

  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  values (p_perfil, 'compra', p_cantidad, p_motivo);

  return v_perfil;
end;
$$;

-- -------------------------------------------------------------
-- 6. ¿YA ATENDIMOS ESTE AVISO?
--    Devuelve true la primera vez y false en los reenvíos.
-- -------------------------------------------------------------

create or replace function public.registrar_evento_pago(
  p_id   text,
  p_tipo text default ''
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  insert into public.eventos_pago (id, tipo) values (p_id, p_tipo);
  return true;
exception when unique_violation then
  return false;
end;
$$;

-- -------------------------------------------------------------
-- 7. QUIÉN PUEDE LLAMAR A TODO ESTO
--    Nadie salvo el servidor. Si `anon` pudiera llamar a
--    aplicar_suscripcion, cualquiera se pondría Supreme desde la
--    consola del navegador en diez segundos.
-- -------------------------------------------------------------

revoke all on function public.aplicar_suscripcion(uuid, text, text, text, date, date, text, text) from public, anon, authenticated;
revoke all on function public.recargar_plan(uuid, text)                                     from public, anon, authenticated;
revoke all on function public.anadir_creditos(uuid, integer, text)                          from public, anon, authenticated;
revoke all on function public.registrar_evento_pago(text, text)                             from public, anon, authenticated;
