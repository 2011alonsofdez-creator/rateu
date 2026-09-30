-- =============================================================
-- Kairo · La memoria
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Lo que separa "una web que llama a un modelo" de "mi IA" no es el
-- modelo: es que se acuerde de ti. El modelo se alquila y se cambia el
-- día que sale otro mejor. Esto no se alquila.
--
-- Una sola tabla, y la regla que la gobierna: aquí solo entra lo que has
-- pedido que entre. Un Kairo que va apuntando solo lo que él cree
-- importante acaba con una ficha tuya que tú no has escrito, no puedes
-- ver venir, y se equivoca en silencio.
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABLA
--    Los límites van en la columna y no solo en la web: validar en el
--    navegador no valida nada, porque a la API se le puede llamar por
--    fuera. Y 300 caracteres no es tacañería: esto viaja pegado a TODAS
--    las respuestas, así que lo que sobra aquí se paga en cada una.
-- -------------------------------------------------------------

create table if not exists public.recuerdos (
  id         uuid primary key default gen_random_uuid(),
  perfil_id  uuid not null references public.perfiles (id) on delete cascade,
  texto      text not null check (length(btrim(texto)) between 3 and 300),
  /* De dónde salió. Por ahora solo hay dos formas, y las dos son tuyas:
     dicho en el chat ("recuerda que...") o escrito a mano en la pantalla
     de la memoria. Si algún día Kairo aprende a proponer recuerdos, ese
     tercer origen tiene que poder distinguirse de un vistazo. */
  origen     text not null default 'chat' check (origen in ('chat', 'mano')),
  creado_el  timestamptz not null default now(),
  usado_el   timestamptz
);

create index if not exists idx_recuerdos_perfil on public.recuerdos (perfil_id, creado_el desc);

-- -------------------------------------------------------------
-- 2. UN TOPE POR PERSONA
--
--    Doscientos. No es por el espacio —ocupan nada— sino porque los
--    recuerdos se le enseñan al modelo en cada respuesta: una memoria
--    que crece sin freno acaba siendo un texto larguísimo que empuja
--    fuera la conversación de verdad. Y una memoria que nadie puede
--    leerse entera no es una memoria, es un cajón.
-- -------------------------------------------------------------

create or replace function public.limitar_recuerdos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cuantos integer;
begin
  select count(*) into cuantos from public.recuerdos where perfil_id = new.perfil_id;

  if cuantos >= 200 then
    raise exception 'Has llegado al máximo de 200 recuerdos. Borra alguno para añadir otro.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists recuerdos_con_tope on public.recuerdos;
create trigger recuerdos_con_tope
  before insert on public.recuerdos
  for each row execute function public.limitar_recuerdos();

-- -------------------------------------------------------------
-- 3. SEGURIDAD A NIVEL DE FILA
--
--    Esto es lo más privado que va a guardar Kairo de nadie: no son
--    mensajes sueltos, es una lista de cosas ciertas sobre una persona,
--    escrita para que se lea de un tirón. Cada uno los suyos y nada más.
-- -------------------------------------------------------------

alter table public.recuerdos enable row level security;

drop policy if exists recuerdos_mios on public.recuerdos;
create policy recuerdos_mios on public.recuerdos
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- -------------------------------------------------------------
-- 4. PERMISOS POR COLUMNA
--
--    Se limpia primero y se da después: Supabase arranca con
--    `alter default privileges ... grant all on tables to anon,
--    authenticated`, así que la tabla nace con TODO dado a los dos roles
--    —incluido el UPDATE de `perfil_id`—. Sin este revoke, la lista de
--    abajo no limita nada: solo repite lo que ya estaba dado, y un
--    recuerdo se podría mover a la cuenta de otro.
-- -------------------------------------------------------------

revoke all on public.recuerdos from anon, authenticated;

grant select, insert, delete on public.recuerdos to authenticated;
grant update (texto) on public.recuerdos to authenticated;
