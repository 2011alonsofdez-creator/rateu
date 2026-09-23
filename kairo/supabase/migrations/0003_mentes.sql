-- =============================================================
-- Kairo · Mentes — la IA especializada que crea cada persona
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABLA
--    Una Mente es un puñado de instrucciones con nombre. Los
--    límites de longitud están en la propia columna a propósito:
--    validar solo en el navegador no valida nada, porque cualquiera
--    puede llamar a la API por su cuenta.
-- -------------------------------------------------------------

create table if not exists public.mentes (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references public.perfiles (id) on delete cascade,
  nombre         text not null check (length(btrim(nombre)) between 1 and 60),
  emoji          text not null default '🧠' check (length(emoji) <= 8),
  descripcion    text not null default '' check (length(descripcion) <= 160),
  instrucciones  text not null default '' check (length(instrucciones) <= 4000),
  -- Nulo = hereda el tono de los ajustes del perfil.
  tono           text check (tono in ('cercano', 'experto', 'chispa', 'breve')),
  creada_el      timestamptz not null default now(),
  actualizada_el timestamptz not null default now()
);

create index if not exists idx_mentes_perfil on public.mentes (perfil_id, creada_el);

-- La conversación ya tenía la columna desde el primer día; ahora que la
-- tabla existe, se le pone el vínculo de verdad. Si se borra una Mente,
-- las conversaciones que la usaron siguen ahí, sin ella.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'conversaciones_mente_id_fkey'
  ) then
    alter table public.conversaciones
      add constraint conversaciones_mente_id_fkey
      foreign key (mente_id) references public.mentes (id) on delete set null;
  end if;
end $$;

-- -------------------------------------------------------------
-- 2. UN TOPE POR PERSONA
--    Sin esto, un script crea un millón de filas en una tarde.
--    Treinta es de sobra para cualquiera que las use de verdad.
-- -------------------------------------------------------------

create or replace function public.limitar_mentes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.mentes where perfil_id = new.perfil_id) >= 30 then
    raise exception 'Has llegado al máximo de Mentes' using errcode = 'P0003';
  end if;
  return new;
end;
$$;

drop trigger if exists mentes_tope on public.mentes;
create trigger mentes_tope
  before insert on public.mentes
  for each row execute function public.limitar_mentes();

create or replace function public.tocar_mente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizada_el := now();
  return new;
end;
$$;

drop trigger if exists mentes_tocar on public.mentes;
create trigger mentes_tocar
  before update on public.mentes
  for each row execute function public.tocar_mente();

-- -------------------------------------------------------------
-- 3. SEGURIDAD A NIVEL DE FILA
--    Tus Mentes son tuyas. Nadie más las lee ni las edita, y eso lo
--    decide la base de datos, no la aplicación.
-- -------------------------------------------------------------

alter table public.mentes enable row level security;

drop policy if exists mentes_todo on public.mentes;

create policy mentes_todo on public.mentes
  for all using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- La política dice QUÉ FILAS; el permiso dice QUÉ COLUMNAS.
-- perfil_id se puede poner al crear (la política comprueba que es el
-- tuyo) pero no se puede cambiar después: así una Mente no se muda a
-- la cuenta de otro.
grant select, delete on public.mentes to authenticated;
grant insert (perfil_id, nombre, emoji, descripcion, instrucciones, tono)
  on public.mentes to authenticated;
grant update (nombre, emoji, descripcion, instrucciones, tono)
  on public.mentes to authenticated;
