-- =============================================================
-- Kairo · Guardar las conversaciones
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
-- =============================================================

-- -------------------------------------------------------------
-- 1. LOS NIVELES QUE EXISTEN DE VERDAD
--    La tabla se escribió antes que el selector, y guardaba
--    'rapido'/'estandar'/'maximo'. Los niveles reales son otros,
--    así que el primer mensaje que intentáramos guardar habría
--    rebotado contra esta comprobación.
-- -------------------------------------------------------------

alter table public.mensajes drop constraint if exists mensajes_nivel_check;
alter table public.mensajes
  add constraint mensajes_nivel_check
  check (nivel is null or nivel in ('fast', 'normal', 'forja', 'mega'));

-- -------------------------------------------------------------
-- 2. ORDENAR POR ACTIVIDAD, NO POR FECHA DE CREACIÓN
--    Una conversación de hace un mes que has retomado hoy va
--    arriba del todo. Ordenar por cuándo se creó la escondería.
-- -------------------------------------------------------------

alter table public.conversaciones
  add column if not exists actualizada_el timestamptz not null default now();

-- Las que ya existieran arrancan con la fecha en que se crearon.
update public.conversaciones set actualizada_el = creada_el
 where actualizada_el < creada_el;

alter table public.conversaciones drop constraint if exists conversaciones_titulo_check;
alter table public.conversaciones
  add constraint conversaciones_titulo_check check (length(titulo) <= 120);

create index if not exists idx_conv_actividad
  on public.conversaciones (perfil_id, actualizada_el desc);

-- Cada mensaje nuevo sube su conversación. Va en un disparador y no en
-- el código del servidor a propósito: así es imposible que una ruta se
-- olvide y la lista quede desordenada.
create or replace function public.tocar_conversacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversaciones
     set actualizada_el = now()
   where id = new.conversacion_id;
  return new;
end;
$$;

drop trigger if exists mensajes_tocan_conversacion on public.mensajes;
create trigger mensajes_tocan_conversacion
  after insert on public.mensajes
  for each row execute function public.tocar_conversacion();

-- -------------------------------------------------------------
-- 3. BORRAR UNA CONVERSACIÓN
--    Los mensajes se van solos por la clave foránea en cascada.
--    No hace falta función: la política de la tabla ya deja borrar
--    únicamente las tuyas.
-- -------------------------------------------------------------
