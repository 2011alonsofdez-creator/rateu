-- =============================================================
-- Kairo · Avisar antes de que venza un papel
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Paperwork ya sabe qué papeles tienes y para cuándo son. El reloj ya
-- sabe despertarse. Telegram ya sabe escribirte. Esto es lo que faltaba
-- para unirlos: una multa pierde el descuento, una beca cierra el plazo
-- y el seguro se renueva solo si no dices nada. Nadie te lo recuerda, y
-- despistarse cuesta dinero de verdad.
-- =============================================================

-- -------------------------------------------------------------
-- 1. QUÉ AVISOS SE HAN MANDADO YA
--
--    La clave primaria NO es decorativa: es el cerrojo. El reloj de
--    GitHub y el de Vercel suenan a la vez a propósito, y los dos ven el
--    mismo papel a punto de vencer. El que llega segundo choca contra
--    esta clave y se va sin mandar nada.
--
--    Sin ella, el aviso saldría dos veces. Y como el reloj suena cada
--    hora, saldría veinticuatro veces al día: la forma más rápida de que
--    alguien silencie a Kairo para siempre.
-- -------------------------------------------------------------

create table if not exists public.avisos_papel (
  papel_id    uuid not null references public.papeles (id) on delete cascade,
  -- A cuántos días del vencimiento se avisó: 7, 3, 1 o 0 (hoy).
  hito        smallint not null,
  enviado_el  timestamptz not null default now(),
  primary key (papel_id, hito)
);

/* Nadie necesita leer esto desde la web: es cosa del reloj. Con la
   seguridad por filas encendida y sin ninguna política, la tabla queda
   cerrada para todo el mundo salvo para las funciones de aquí abajo,
   que van con los permisos de su dueño. */
alter table public.avisos_papel enable row level security;

-- -------------------------------------------------------------
-- 2. QUÉ PAPELES TOCA AVISAR AHORA
--
--    Solo los pendientes, con fecha, y que vencen de aquí a una semana.
--    Ni los vencidos —eso ya no es un aviso, es un reproche— ni los
--    lejanos.
-- -------------------------------------------------------------

create or replace function public.papeles_para_avisar(p_limite integer default 50)
returns table (
  id                uuid,
  perfil_id         uuid,
  titulo            text,
  que_quieren       text,
  importe           text,
  consecuencias     text,
  fecha_limite      date,
  dias              integer,
  hito              smallint,
  telegram_chat_id  text
)
language sql
stable
security definer
set search_path = public
as $$
  with conZona as (
    select
      p.id,
      p.perfil_id,
      p.titulo,
      p.que_quieren,
      p.importe,
      p.consecuencias,
      p.fecha_limite,
      pe.telegram_chat_id,
      /* En su hora, no en la del servidor. A las 23:30 en Madrid el
         servidor ya está en mañana, y "vence hoy" se convertiría en
         "venció ayer" para quien lo lee.

         `perfiles` no guarda zona horaria, así que se usa la de
         cualquiera de sus Co-Works, que es la única que Kairo conoce de
         cada persona. Sin Co-Works, Madrid. */
      (p.fecha_limite - public.hora_local(
         coalesce((select c.zona from public.coworks c
                    where c.perfil_id = p.perfil_id and c.zona <> '' limit 1),
                  'Europe/Madrid'))::date)::integer as dias
    from public.papeles p
    join public.perfiles pe on pe.id = p.perfil_id
    where p.estado = 'pendiente'
      and p.fecha_limite is not null
  ),
  conHito as (
    select
      c.*,
      /* El hito es el cajón, no el número que se enseña. A cinco días
         cae en el de "una semana" y se avisa una vez; a dos, en el de
         "tres días". Así no hay un aviso por cada día que pasa. */
      (case
         when c.dias <= 0 then 0
         when c.dias <= 1 then 1
         when c.dias <= 3 then 3
         else 7
       end)::smallint as hito
    from conZona c
    where c.dias between 0 and 7
  )
  select
    h.id, h.perfil_id, h.titulo, h.que_quieren, h.importe,
    h.consecuencias, h.fecha_limite, h.dias, h.hito, h.telegram_chat_id
  from conHito h
  where not exists (
    select 1 from public.avisos_papel a
     where a.papel_id = h.id and a.hito = h.hito
  )
  order by h.dias, h.fecha_limite
  limit greatest(coalesce(p_limite, 50), 1);
$$;

-- -------------------------------------------------------------
-- 3. COGER EL AVISO ANTES DE MANDARLO
--
--    Se apunta PRIMERO y se manda después. Al revés —mandar y luego
--    apuntar— un fallo entre las dos cosas repetiría el aviso en la
--    siguiente vuelta del reloj, dentro de una hora.
--
--    Devuelve si lo ha cogido este. El que llega segundo recibe false y
--    no manda nada.
-- -------------------------------------------------------------

create or replace function public.apuntar_aviso(p_papel uuid, p_hito smallint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_puesto integer;
begin
  insert into public.avisos_papel (papel_id, hito)
  values (p_papel, p_hito)
  on conflict (papel_id, hito) do nothing;

  get diagnostics v_puesto = row_count;
  return v_puesto > 0;
end;
$$;

-- -------------------------------------------------------------
-- 4. PERMISOS
--
--    Esto lo llama el reloj con la llave del servidor, nadie más. Se
--    quita a todo el mundo primero porque Supabase da permiso de
--    ejecución por defecto a las cuentas con sesión, y "revoke from
--    public" NO se lo quita a esas.
-- -------------------------------------------------------------

revoke all on function public.papeles_para_avisar(integer) from public, anon, authenticated;
revoke all on function public.apuntar_aviso(uuid, smallint) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.papeles_para_avisar(integer) to service_role';
    execute 'grant execute on function public.apuntar_aviso(uuid, smallint) to service_role';
  end if;
end
$$;

-- =============================================================
-- Listo. A partir de ahora, un papel con fecha te avisa a los 7 días,
-- a los 3, el día de antes y el mismo día. Una vez cada cosa.
-- =============================================================
