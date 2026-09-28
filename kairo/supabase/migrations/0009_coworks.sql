-- =============================================================
-- Kairo · Co-Works: los encargos que se ejecutan solos
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Un Co-Work es un trabajo con hora. Nadie lo lanza: llega la hora y se
-- hace, estés o no delante. Eso obliga a resolver tres cosas que un chat
-- normal no tiene que resolver, y las tres viven aquí, en la base de
-- datos, porque es el único sitio donde dos servidores a la vez se
-- ponen de acuerdo:
--
--   1. QUÉ toca ahora           → coworks_pendientes()
--   2. QUIÉN lo coge            → reservar_cowork()   (uno y solo uno)
--   3. QUÉ pasó                 → terminar_cowork()
--
-- El día se cuenta en la zona horaria de cada uno. Un Co-Work de las
-- 7:00 es a las 7:00 de quien lo creó, no del servidor, que está en
-- Fráncfort y en invierno lleva otra hora.
-- =============================================================

-- -------------------------------------------------------------
-- 1. LA HORA DE CADA UNO
--    Si la zona guardada no existe (alguien escribe cualquier cosa por
--    la API), `at time zone` no devuelve un valor raro: revienta. Y una
--    zona mal escrita no puede tumbar el reparto de trabajo de todos
--    los demás, así que se cae a Madrid y sigue.
-- -------------------------------------------------------------

create or replace function public.hora_local(p_zona text)
returns timestamp
language plpgsql
stable
set search_path = public
as $$
begin
  return now() at time zone coalesce(nullif(trim(p_zona), ''), 'Europe/Madrid');
exception
  when others then
    return now() at time zone 'Europe/Madrid';
end;
$$;

-- -------------------------------------------------------------
-- 2. LOS ENCARGOS
-- -------------------------------------------------------------

create table if not exists public.coworks (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfiles (id) on delete cascade,
  nombre      text not null default '',
  -- De momento solo hay un tipo. La columna existe desde el principio
  -- para que añadir el siguiente no sea una migración de datos.
  tipo        text not null default 'brief' check (tipo in ('brief')),
  -- Lo que vigila: "IA, GTA 6, ofertas de PS5". En una línea, como se
  -- lo dirías a una persona.
  temas       text not null default '',
  -- La hora del día, entera. Los minutos sobran: esto no es una alarma,
  -- es "por la mañana" o "por la noche", y prometer el minuto exacto
  -- sería mentir, porque quien dispara esto no es un reloj de precisión.
  hora        smallint not null default 7 check (hora between 0 and 23),
  zona        text not null default 'Europe/Madrid',
  activo      boolean not null default true,
  -- Cuándo se ejecutó por última vez, para poder enseñarlo.
  ultima_vez  timestamptz,
  creado_el   timestamptz not null default now()
);

create index if not exists idx_coworks_perfil on public.coworks (perfil_id, creado_el desc);
-- El índice que usa el reparto: solo interesan los encendidos.
create index if not exists idx_coworks_activos on public.coworks (activo) where activo;

alter table public.coworks drop constraint if exists coworks_nombre_check;
alter table public.coworks
  add constraint coworks_nombre_check check (length(nombre) <= 120);

alter table public.coworks drop constraint if exists coworks_temas_check;
alter table public.coworks
  add constraint coworks_temas_check check (length(temas) <= 600);

alter table public.coworks drop constraint if exists coworks_zona_check;
alter table public.coworks
  add constraint coworks_zona_check check (length(zona) <= 60);

-- -------------------------------------------------------------
-- 3. LO QUE DEJÓ HECHO
--
--    La pareja (cowork, día) es ÚNICA, y esa restricción no es un
--    detalle de limpieza: es el candado. Dos servidores que se
--    despiertan a la vez intentan escribir la misma fila y la base de
--    datos deja pasar a uno solo. Sin eso, el mismo día te llegaría el
--    mismo resumen dos veces y se te cobraría dos veces.
-- -------------------------------------------------------------

create table if not exists public.cowork_resultados (
  id              uuid primary key default gen_random_uuid(),
  cowork_id       uuid not null references public.coworks (id) on delete cascade,
  perfil_id       uuid not null references public.perfiles (id) on delete cascade,
  -- El día en la zona del dueño, no en la del servidor.
  dia             date not null,
  estado          text not null default 'ejecutando'
                  check (estado in ('ejecutando', 'ok', 'sin_creditos', 'error')),
  contenido       text not null default '',
  fuentes         jsonb,
  modelo          text,
  -- La conversación que queda en la barra lateral para poder seguir
  -- preguntando sobre lo que te ha contado.
  conversacion_id uuid references public.conversaciones (id) on delete set null,
  creado_el       timestamptz not null default now(),
  constraint cowork_resultados_unico unique (cowork_id, dia)
);

create index if not exists idx_cowork_resultados_perfil
  on public.cowork_resultados (perfil_id, creado_el desc);

alter table public.cowork_resultados drop constraint if exists cowork_resultados_contenido_check;
alter table public.cowork_resultados
  add constraint cowork_resultados_contenido_check check (length(contenido) <= 40000);

-- -------------------------------------------------------------
-- 4. QUÉ TOCA AHORA
--
--    Devuelve los encargos cuya hora ya ha pasado HOY, en su propia
--    zona, y que no tienen resultado de hoy. Viene con los datos del
--    dueño para no tener que ir a buscarlos uno a uno: son los que
--    deciden el tono, la edad y si le quedan créditos.
-- -------------------------------------------------------------

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
  select
    c.id,
    c.perfil_id,
    c.nombre,
    c.tipo,
    c.temas,
    c.zona,
    public.hora_local(c.zona)::date as dia,
    p.nombre                        as duenio,
    p.modo_edad,
    p.tono,
    p.plan,
    (p.creditos + p.creditos_extra) as saldo
  from public.coworks c
  join public.perfiles p on p.id = c.perfil_id
  where c.activo
    and extract(hour from public.hora_local(c.zona)) >= c.hora
    and not exists (
      select 1
        from public.cowork_resultados r
       where r.cowork_id = c.id
         and r.dia = public.hora_local(c.zona)::date
         /* Una reserva muerta no cuenta como trabajo hecho. Si alguien
            se cayó a mitad —una función a la que se le acabó el minuto,
            por ejemplo— la fila se queda en 'ejecutando' para siempre, y
            sin esta línea el encargo quedaría fuera del reparto el resto
            del día: nunca se reintenta, porque el que libera las
            reservas muertas es `reservar_cowork`, y a `reservar_cowork`
            solo se llama para lo que sale de aquí. Es el mismo cuarto de
            hora que usa allí. */
         and not (
           r.estado = 'ejecutando'
           and r.creado_el < now() - interval '15 minutes'
         )
    )
  order by c.creado_el
  limit greatest(1, least(coalesce(p_limite, 50), 200));
$$;

-- -------------------------------------------------------------
-- 5. QUIÉN LO COGE
--
--    Devuelve el identificador de la fila reservada, o nada si ya se lo
--    había quedado otro. "Nada" significa: no lo hagas, no cobres, no
--    escribas. Es lo que hace que dos disparadores a la vez —el de
--    Vercel y el de GitHub— sean inofensivos.
--
--    Y una reserva muerta no bloquea el día entero: si alguien se cayó
--    a mitad, a los quince minutos el trabajo vuelve a estar libre.
-- -------------------------------------------------------------

create or replace function public.reservar_cowork(p_cowork uuid, p_dia date)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  delete from public.cowork_resultados
   where cowork_id = p_cowork
     and dia = p_dia
     and estado = 'ejecutando'
     and creado_el < now() - interval '15 minutes';

  insert into public.cowork_resultados (cowork_id, perfil_id, dia, estado)
  select p_cowork, c.perfil_id, p_dia, 'ejecutando'
    from public.coworks c
   where c.id = p_cowork
  on conflict on constraint cowork_resultados_unico do nothing
  returning id into v_id;

  return v_id;
end;
$$;

-- -------------------------------------------------------------
-- 6. QUÉ PASÓ
-- -------------------------------------------------------------

create or replace function public.terminar_cowork(
  p_resultado    uuid,
  p_estado       text,
  p_contenido    text default '',
  p_fuentes      jsonb default null,
  p_modelo       text default null,
  p_conversacion uuid default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cowork uuid;
begin
  if p_estado not in ('ok', 'sin_creditos', 'error') then
    raise exception 'Estado no válido: %', p_estado using errcode = '22023';
  end if;

  update public.cowork_resultados
     set estado          = p_estado,
         contenido       = left(coalesce(p_contenido, ''), 40000),
         fuentes         = p_fuentes,
         modelo          = p_modelo,
         conversacion_id = p_conversacion
   where id = p_resultado
  returning cowork_id into v_cowork;

  if v_cowork is not null then
    update public.coworks set ultima_vez = now() where id = v_cowork;
  end if;
end;
$$;

-- -------------------------------------------------------------
-- 7. COBRAR SIN SESIÓN
--
--    `gastar_creditos` lee auth.uid(), y un Co-Work no tiene a nadie
--    delante: lo lanza un reloj. Esta es la misma función, con el mismo
--    bloqueo de fila y el mismo apunte en el historial, pero diciendo
--    de quién se cobra.
--
--    Y por eso mismo NO la puede llamar un usuario: si pudiera, podría
--    vaciarle los créditos a cualquiera. Se revoca a todo el mundo y
--    solo se le da al servidor.
-- -------------------------------------------------------------

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
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  if p_perfil is null then
    raise exception 'Falta el perfil' using errcode = '22023';
  end if;

  select p.creditos, p.creditos_extra
    into v_del_plan, v_del_extra
    from public.perfiles p
   where p.id = p_perfil
     for update;

  if not found then
    raise exception 'Perfil no encontrado' using errcode = 'P0003';
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

-- -------------------------------------------------------------
-- 8. UN TOPE POR PERSONA
--    Diez encargos automáticos por cuenta. Cada uno gasta créditos solo
--    todos los días sin que nadie lo mire: el tope es lo que impide que
--    un descuido se convierta en una factura.
-- -------------------------------------------------------------

create or replace function public.limitar_coworks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cuantos integer;
begin
  select count(*) into cuantos from public.coworks where perfil_id = new.perfil_id;

  if cuantos >= 10 then
    raise exception 'Has llegado al máximo de 10 Co-Works.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists coworks_con_tope on public.coworks;
create trigger coworks_con_tope
  before insert on public.coworks
  for each row execute function public.limitar_coworks();

-- -------------------------------------------------------------
-- 9. SEGURIDAD A NIVEL DE FILA
--    Cada uno ve los suyos. Los resultados se leen y se borran, pero no
--    se escriben desde el navegador: los escribe el servidor cuando
--    ejecuta el encargo. Que un usuario pudiera insertar un resultado
--    sería poder decir "esto ya está hecho" y saltarse el candado.
-- -------------------------------------------------------------

alter table public.coworks            enable row level security;
alter table public.cowork_resultados  enable row level security;

drop policy if exists coworks_todo on public.coworks;
create policy coworks_todo on public.coworks
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

drop policy if exists cowork_resultados_mios on public.cowork_resultados;
create policy cowork_resultados_mios on public.cowork_resultados
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- -------------------------------------------------------------
-- 10. PERMISOS POR COLUMNA
--     Se puede cambiar el nombre, los temas, la hora, la zona y el
--     interruptor. `perfil_id` no está: un encargo no se puede mover a
--     la cuenta de otro, ni queriendo.
-- -------------------------------------------------------------

-- Se limpia primero y se da después. Supabase arranca con
-- `alter default privileges ... grant all on tables to anon, authenticated`,
-- así que estas dos tablas nacen con TODOS los permisos dados a los dos
-- roles, incluido el UPDATE de la columna `perfil_id`. Sin este revoke,
-- la lista de abajo no limita nada: solo repite algo que ya estaba dado.
revoke all on public.coworks           from anon, authenticated;
revoke all on public.cowork_resultados from anon, authenticated;

grant select, insert, delete on public.coworks to authenticated;
grant update (nombre, temas, hora, zona, activo) on public.coworks to authenticated;

grant select, delete on public.cowork_resultados to authenticated;

-- Las funciones del reparto son del servidor. Un usuario no reserva, no
-- termina y, sobre todo, no cobra.
--
-- Y se le quita a `anon` y a `authenticated` POR SU NOMBRE, no solo a
-- `public`. Es el mismo motivo que arriba: en Supabase las funciones
-- nuevas nacen con EXECUTE dado explícitamente a esos dos roles, y un
-- permiso explícito no se va quitándoselo a `public`. Quitárselo solo a
-- `public` dejaría a cualquiera con sesión llamar a `gastar_creditos_de`
-- con el perfil de otro y vaciarle los créditos. Es lo mismo que hace
-- 0006_pagos.sql con `aplicar_suscripcion`.
revoke all on function public.coworks_pendientes(integer) from public, anon, authenticated;
revoke all on function public.reservar_cowork(uuid, date) from public, anon, authenticated;
revoke all on function public.terminar_cowork(uuid, text, text, jsonb, text, uuid) from public, anon, authenticated;
revoke all on function public.gastar_creditos_de(uuid, integer, text) from public, anon, authenticated;

do $$
begin
  -- En Supabase existe el rol service_role; en una base de datos
  -- cualquiera (una de pruebas, por ejemplo) no tiene por qué.
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.coworks_pendientes(integer) to service_role';
    execute 'grant execute on function public.reservar_cowork(uuid, date) to service_role';
    execute 'grant execute on function public.terminar_cowork(uuid, text, text, jsonb, text, uuid) to service_role';
    execute 'grant execute on function public.gastar_creditos_de(uuid, integer, text) to service_role';
  end if;
end
$$;

-- La hora local sí la puede preguntar cualquiera: no dice nada de nadie.
grant execute on function public.hora_local(text) to authenticated;
