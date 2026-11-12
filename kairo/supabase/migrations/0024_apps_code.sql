-- =============================================================
-- Kairo · Historial de Code
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Hasta ahora, cada app que hacía Code se perdía al salir de la
-- pantalla. Aquí se guardan, para que Code tenga su propio historial
-- en la barra de la izquierda, igual que los chats.
-- =============================================================

create table if not exists public.apps_code (
  id             uuid primary key default gen_random_uuid(),
  -- Se rellena solo con el perfil de quien la guarda.
  perfil_id      uuid not null default public.mi_perfil_id()
                 references public.perfiles (id) on delete cascade,
  titulo         text not null check (length(btrim(titulo)) between 1 and 80),
  peticion       text not null default '' check (length(peticion) <= 4000),
  -- Un archivo HTML entero. 400 KB sobran: las apps de Code rondan 10-30.
  codigo         text not null check (length(codigo) <= 400000),
  creada_el      timestamptz not null default now(),
  actualizada_el timestamptz not null default now()
);

create index if not exists idx_apps_code_perfil
  on public.apps_code (perfil_id, actualizada_el desc);

alter table public.apps_code enable row level security;

drop policy if exists apps_code_todo on public.apps_code;

create policy apps_code_todo on public.apps_code
  for all using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- Cada uno ve, crea, cambia y borra solo las suyas. El perfil se pone
-- solo al crearla y no se puede cambiar después.
grant select, delete on public.apps_code to authenticated;
grant insert (titulo, peticion, codigo) on public.apps_code to authenticated;
grant update (titulo, peticion, codigo, actualizada_el) on public.apps_code to authenticated;

-- Tope para que nadie llene la base de datos: 200 apps por cuenta.
create or replace function public.limitar_apps_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.apps_code where perfil_id = new.perfil_id) >= 200 then
    raise exception 'demasiadas apps guardadas' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists apps_code_tope on public.apps_code;
create trigger apps_code_tope
  before insert on public.apps_code
  for each row execute function public.limitar_apps_code();
