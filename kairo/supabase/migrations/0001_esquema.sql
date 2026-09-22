-- =============================================================
-- Kairo · Paso 2 — Esquema, seguridad y créditos
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABLAS
-- -------------------------------------------------------------

create table if not exists public.perfiles (
  id                     uuid primary key default gen_random_uuid(),
  auth_id                uuid not null unique references auth.users (id) on delete cascade,
  nombre                 text not null default '',
  email                  text not null default '',
  plan                   text not null default 'free'
                           check (plan in ('free', 'plus', 'supreme')),
  creditos               integer not null default 15 check (creditos >= 0),
  creditos_extra         integer not null default 0 check (creditos_extra >= 0),
  fecha_nacimiento       date,
  -- Nulo hasta que sabemos la edad (por ejemplo al entrar con Google).
  -- La app manda a /bienvenida a quien lo tenga sin rellenar.
  modo_edad              text check (modo_edad in ('nino', 'adolescente', 'adulto')),
  tono                   text not null default 'cercano',
  idioma                 text not null default 'es',
  adulto_responsable_id  uuid references public.perfiles (id) on delete set null,
  renueva_el             date,
  creado_el              timestamptz not null default now()
);

create table if not exists public.conversaciones (
  id         uuid primary key default gen_random_uuid(),
  perfil_id  uuid not null references public.perfiles (id) on delete cascade,
  titulo     text not null default '',
  mente_id   uuid,
  creada_el  timestamptz not null default now()
);

create table if not exists public.mensajes (
  id                uuid primary key default gen_random_uuid(),
  conversacion_id   uuid not null references public.conversaciones (id) on delete cascade,
  rol               text not null check (rol in ('user', 'kairo')),
  contenido         text not null default '',
  modelo_usado      text,
  nivel             text check (nivel in ('rapido', 'estandar', 'maximo', 'mega')),
  creditos_gastados integer not null default 0,
  tokens_in         integer not null default 0,
  tokens_out        integer not null default 0,
  creado_el         timestamptz not null default now()
);

create table if not exists public.movimientos (
  id         uuid primary key default gen_random_uuid(),
  perfil_id  uuid not null references public.perfiles (id) on delete cascade,
  tipo       text not null check (tipo in ('gasto', 'recarga', 'compra', 'ajuste')),
  creditos   integer not null,
  motivo     text not null default '',
  creado_el  timestamptz not null default now()
);

create index if not exists idx_perfiles_auth        on public.perfiles (auth_id);
create index if not exists idx_perfiles_responsable on public.perfiles (adulto_responsable_id);
create index if not exists idx_conv_perfil          on public.conversaciones (perfil_id, creada_el desc);
create index if not exists idx_msg_conv             on public.mensajes (conversacion_id, creado_el);
create index if not exists idx_mov_perfil           on public.movimientos (perfil_id, creado_el desc);

-- -------------------------------------------------------------
-- 2. AYUDANTE
--    Devuelve el perfil de quien hace la petición.
--    Va en SECURITY DEFINER a propósito: si leyera public.perfiles
--    con RLS activo desde dentro de una política de esa misma tabla,
--    se llamaría a sí misma sin fin.
-- -------------------------------------------------------------

create or replace function public.mi_perfil_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.perfiles where auth_id = auth.uid();
$$;

-- -------------------------------------------------------------
-- 3. SEGURIDAD A NIVEL DE FILA
--    Sin esto, cualquiera con la clave pública lee toda la base
--    de datos. No es opcional.
-- -------------------------------------------------------------

alter table public.perfiles       enable row level security;
alter table public.conversaciones enable row level security;
alter table public.mensajes       enable row level security;
alter table public.movimientos    enable row level security;

drop policy if exists perfiles_leer      on public.perfiles;
drop policy if exists perfiles_editar    on public.perfiles;
drop policy if exists perfiles_crear     on public.perfiles;   -- de una versión anterior
drop policy if exists conv_todo          on public.conversaciones;
drop policy if exists msg_todo           on public.mensajes;
drop policy if exists mov_leer           on public.movimientos;

-- Cada uno ve su perfil. Un adulto ve además los perfiles hijo que tenga a cargo.
create policy perfiles_leer on public.perfiles
  for select using (
    auth_id = auth.uid()
    or adulto_responsable_id = public.mi_perfil_id()
  );

-- Solo se edita el perfil propio, y además solo ciertas columnas:
-- el permiso de abajo (grant update (...)) limita CUÁLES.
-- Sin ese límite, un usuario podría hacer
--   update perfiles set creditos = 999999 where auth_id = auth.uid()
-- y regalarse créditos infinitos. La política dice QUÉ FILAS;
-- el grant dice QUÉ COLUMNAS. Hacen falta las dos cosas.
create policy perfiles_editar on public.perfiles
  for update using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- No hay política de INSERT a propósito: los perfiles los crea el
-- disparador de registro, nunca el navegador.

create policy conv_todo on public.conversaciones
  for all using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

create policy msg_todo on public.mensajes
  for all using (
    conversacion_id in (
      select id from public.conversaciones where perfil_id = public.mi_perfil_id()
    )
  )
  with check (
    conversacion_id in (
      select id from public.conversaciones where perfil_id = public.mi_perfil_id()
    )
  );

-- Los movimientos se leen pero no se escriben a mano: los crea la función.
create policy mov_leer on public.movimientos
  for select using (perfil_id = public.mi_perfil_id());

-- -------------------------------------------------------------
-- 4. GASTAR CRÉDITOS
--    No recibe el perfil como parámetro a propósito: lo deduce de
--    la sesión. Así es imposible gastar los créditos de otro, ni
--    siquiera manipulando la petición.
--    Gasta primero los del plan y luego los comprados en packs.
-- -------------------------------------------------------------

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
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  select id into v_perfil from public.perfiles where auth_id = auth.uid();
  if v_perfil is null then
    raise exception 'Sin sesión' using errcode = '28000';
  end if;

  -- Bloquea la fila para que dos pestañas a la vez no gasten el mismo crédito
  select p.creditos, p.creditos_extra
    into v_del_plan, v_del_extra
    from public.perfiles p
   where p.id = v_perfil
     for update;

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

-- -------------------------------------------------------------
-- 5. PERFIL AUTOMÁTICO AL REGISTRARSE
--    El modo de edad sale de la fecha de nacimiento que pide el
--    formulario. Si no viene (entrada con Google), queda nulo y la
--    app pregunta antes de dejar entrar.
-- -------------------------------------------------------------

create or replace function public.crear_perfil_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nacimiento date;
  v_anios      integer;
  v_modo       text;
begin
  begin
    v_nacimiento := nullif(new.raw_user_meta_data ->> 'fecha_nacimiento', '')::date;
  exception when others then
    v_nacimiento := null;   -- fecha con formato raro: la pedimos luego
  end;

  if v_nacimiento is not null then
    v_anios := extract(year from age(v_nacimiento))::integer;
    v_modo  := case
                 when v_anios < 13 then 'nino'
                 when v_anios < 18 then 'adolescente'
                 else 'adulto'
               end;
  end if;

  insert into public.perfiles (auth_id, nombre, email, fecha_nacimiento, modo_edad, renueva_el)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''),
             split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    v_nacimiento,
    v_modo,
    (current_date + interval '1 day')::date
  )
  on conflict (auth_id) do nothing;

  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_al_registrarse();

-- -------------------------------------------------------------
-- 6. PERMISOS
--    La política decide qué filas. El permiso decide qué columnas.
--    creditos, creditos_extra y plan quedan fuera del alcance del
--    navegador: solo los mueven funciones del servidor.
-- -------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.perfiles to authenticated;
grant update (nombre, tono, idioma) on public.perfiles to authenticated;

grant select, insert, update, delete on public.conversaciones to authenticated;
grant select, insert, update, delete on public.mensajes       to authenticated;
grant select                        on public.movimientos     to authenticated;

-- -------------------------------------------------------------
-- 7. COMPLETAR EL PERFIL
--    La fecha de nacimiento y el modo de edad no se editan como un
--    campo más: se fijan UNA vez. Si no, un adolescente se pondría
--    en modo adulto desde la consola del navegador y se saltaría
--    toda la moderación.
-- -------------------------------------------------------------

create or replace function public.completar_perfil(
  p_nombre text,
  p_fecha  date
)
returns public.perfiles
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil public.perfiles;
  v_anios  integer;
  v_modo   text;
begin
  select * into v_perfil from public.perfiles where auth_id = auth.uid();

  if v_perfil.id is null then
    raise exception 'Sin sesión' using errcode = '28000';
  end if;

  if v_perfil.modo_edad is not null then
    raise exception 'El modo de edad ya está fijado' using errcode = '42501';
  end if;

  if p_fecha is null or p_fecha > current_date or p_fecha < '1900-01-01'::date then
    raise exception 'Fecha de nacimiento no válida' using errcode = '22023';
  end if;

  v_anios := extract(year from age(p_fecha))::integer;
  v_modo  := case
               when v_anios < 13 then 'nino'
               when v_anios < 18 then 'adolescente'
               else 'adulto'
             end;

  update public.perfiles
     set nombre           = coalesce(nullif(trim(p_nombre), ''), nombre),
         fecha_nacimiento = p_fecha,
         modo_edad        = v_modo
   where id = v_perfil.id
  returning * into v_perfil;

  return v_perfil;
end;
$$;

revoke all on function public.completar_perfil(text, date) from public;
grant execute on function public.completar_perfil(text, date) to authenticated;
