-- =============================================================
-- Kairo · La escala de créditos, multiplicada por dos
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- POR QUÉ SE CAMBIA
--
-- Los niveles costaban 1 / 4 / 20 / 120 y ahora cuestan 2 / 8 / 40 / 240.
-- Los planes se multiplican por dos a la vez, así que NADIE gana ni
-- pierde capacidad: con Kairo+ salían 50 Forjas y siguen saliendo 50.
-- Lo único que cambia es que los números suenan a más, que es lo que
-- se lee en la página de precios.
--
-- Y de paso se arregla una cosa que llevaba rota desde el principio:
-- `recargar_plan` reponía 15 créditos a las cuentas gratis, cuando el
-- plan gratis lleva meses dando 20 al día. Nadie lo notó porque a las
-- gratis las recarga la otra función, la diaria; pero el día que una
-- cuenta de pago cayera a gratis, se habría quedado en 15.
--
--   Rápido   1  →  2
--   Normal   4  →  8
--   Forja   20  → 40
--   MEGA   120  → 240
--
--   Free     20 al día  →  40 al día
--   Kairo+    1.000/mes →  2.000/mes
--   Supreme   3.000/mes →  6.000/mes
--   Regalo      150     →  300   (un MEGA entero, igual que antes)
-- =============================================================

-- -------------------------------------------------------------
-- 1. CUARENTA AL DÍA
-- -------------------------------------------------------------

alter table public.perfiles alter column creditos set default 40;

create or replace function public.recargar_creditos_free()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_afectados integer;
begin
  with recargados as (
    update public.perfiles
       set creditos   = 40,
           renueva_el = (current_date + interval '1 day')::date
     where plan = 'free'
       and creditos < 40
    returning id, 40 - creditos as antes
  )
  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  select id, 'recarga', 40, 'Recarga diaria del plan gratuito' from recargados;

  get diagnostics v_afectados = row_count;
  return v_afectados;
end;
$$;

revoke all on function public.recargar_creditos_free() from public;

-- -------------------------------------------------------------
-- 2. EL REGALO DE BIENVENIDA
-- -------------------------------------------------------------

alter table public.perfiles alter column creditos_extra set default 300;

-- -------------------------------------------------------------
-- 3. LO QUE REPONE CADA PLAN AL RENOVAR
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
                when 'supreme' then 6000
                when 'plus'    then 2000
                else 40
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

revoke all on function public.recargar_plan(uuid, text) from public;

-- -------------------------------------------------------------
-- 4. LO QUE YA TIENE LA GENTE EN LA HUCHA
--
--    Esto NO se ejecuta solo, y está así a propósito: doblar saldos es
--    lo único de este archivo que no se puede repetir sin hacer daño.
--    Si lo corres dos veces, doblas dos veces.
--
--    Las cuentas gratis no lo necesitan: mañana la recarga diaria las
--    deja en 40 solas. Las de pago tampoco se rompen: al renovar el mes
--    se ponen en 2.000 o 6.000. Esto es solo si no quieres esperar.
--
--    Para usarlo: quita los dos guiones del principio de cada línea y
--    ejecútalo UNA vez.
-- -------------------------------------------------------------

-- update public.perfiles
--    set creditos = creditos * 2,
--        creditos_extra = creditos_extra * 2;

-- Y nada más. "Success. No rows returned" significa que está hecho.
