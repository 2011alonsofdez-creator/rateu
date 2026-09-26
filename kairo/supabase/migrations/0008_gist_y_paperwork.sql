-- =============================================================
-- Kairo · Gist y Paperwork
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Dos apartados nuevos, y los dos guardan lo mismo: una ficha que se
-- hace una vez y se consulta muchas.
--   · Gist      → pegas un enlace y queda el resumen, para volver a él
--   · Paperwork → subes un papel y queda qué es y para cuándo
-- =============================================================

-- -------------------------------------------------------------
-- 1. GIST: los resúmenes guardados
-- -------------------------------------------------------------

create table if not exists public.fichas (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfiles (id) on delete cascade,
  tipo        text not null default 'web' check (tipo in ('video', 'web')),
  url         text not null default '',
  titulo      text not null default '',
  autor       text not null default '',
  -- El resumen largo, en markdown.
  resumen     text not null default '',
  -- [{ "marca": "12:30", "texto": "..." }] — el minuto o el apartado.
  puntos      jsonb,
  -- Las páginas que consultó, con la misma forma que en los mensajes.
  fuentes     jsonb,
  modelo      text,
  creada_el   timestamptz not null default now()
);

create index if not exists idx_fichas_perfil on public.fichas (perfil_id, creada_el desc);

alter table public.fichas drop constraint if exists fichas_titulo_check;
alter table public.fichas
  add constraint fichas_titulo_check check (length(titulo) <= 300);

alter table public.fichas drop constraint if exists fichas_url_check;
alter table public.fichas
  add constraint fichas_url_check check (length(url) <= 2000);

alter table public.fichas drop constraint if exists fichas_resumen_check;
alter table public.fichas
  add constraint fichas_resumen_check check (length(resumen) <= 40000);

-- -------------------------------------------------------------
-- 2. PAPERWORK: la bandeja de los papeles
--    Lo que importa de un papel oficial no es el texto: es la fecha.
--    Por eso fecha_limite es una columna de verdad y no un campo
--    dentro de un json: se ordena por ella y se avisa con ella.
-- -------------------------------------------------------------

create table if not exists public.papeles (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references public.perfiles (id) on delete cascade,
  titulo         text not null default '',
  remitente      text not null default '',
  de_que_va      text not null default '',
  que_quieren    text not null default '',
  importe        text not null default '',
  fecha_limite   date,
  consecuencias  text not null default '',
  -- ["Pagar antes del...", "Guardar el justificante"]
  pasos          jsonb,
  -- Un borrador de respuesta, si hace falta contestar.
  borrador       text not null default '',
  archivo        text not null default '',
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'hecho')),
  creada_el      timestamptz not null default now()
);

create index if not exists idx_papeles_perfil on public.papeles (perfil_id, fecha_limite nulls last);

alter table public.papeles drop constraint if exists papeles_titulo_check;
alter table public.papeles
  add constraint papeles_titulo_check check (length(titulo) <= 300);

-- -------------------------------------------------------------
-- 3. SEGURIDAD A NIVEL DE FILA
--    Lo de siempre: cada uno ve lo suyo y nada más. Un resumen de un
--    vídeo puede parecer inocente; la carta de Hacienda de alguien,
--    desde luego, no.
-- -------------------------------------------------------------

alter table public.fichas  enable row level security;
alter table public.papeles enable row level security;

drop policy if exists fichas_todo on public.fichas;
create policy fichas_todo on public.fichas
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

drop policy if exists papeles_todo on public.papeles;
create policy papeles_todo on public.papeles
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- -------------------------------------------------------------
-- 4. PERMISOS POR COLUMNA
--    Insertar, sí. Cambiar de dueño, no: `perfil_id` no está en la
--    lista de lo que se puede actualizar, así que una ficha no se
--    puede mover a la cuenta de otro ni a propósito.
-- -------------------------------------------------------------

grant select, insert, delete on public.fichas  to authenticated;
grant update (titulo) on public.fichas to authenticated;

grant select, insert, delete on public.papeles to authenticated;
grant update (titulo, estado) on public.papeles to authenticated;

-- -------------------------------------------------------------
-- 5. UN TOPE POR PERSONA
--    Sin esto, un script en bucle llena la tabla de otro. El tope es
--    alto: no molesta a nadie normal y corta al que no lo es.
-- -------------------------------------------------------------

create or replace function public.limitar_fichas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cuantas integer;
  tope    integer;
begin
  if tg_table_name = 'fichas' then tope := 500; else tope := 500; end if;

  execute format('select count(*) from public.%I where perfil_id = $1', tg_table_name)
    into cuantas using new.perfil_id;

  if cuantas >= tope then
    raise exception 'Has llegado al máximo de % guardados.', tope
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists fichas_con_tope on public.fichas;
create trigger fichas_con_tope
  before insert on public.fichas
  for each row execute function public.limitar_fichas();

drop trigger if exists papeles_con_tope on public.papeles;
create trigger papeles_con_tope
  before insert on public.papeles
  for each row execute function public.limitar_fichas();
