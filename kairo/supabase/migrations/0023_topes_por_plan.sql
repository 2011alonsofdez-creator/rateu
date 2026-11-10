-- =============================================================
-- Kairo · Que el tope dependa del plan, y que "ilimitado" no sea mentira
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- POR QUÉ
--
-- Los dos topes que había —10 Co-Works y 30 Mentes— eran iguales para
-- todo el mundo, pagases lo que pagases. Y mientras tanto la página de
-- precios vendía "Co-Works ilimitados" y "Mentes ilimitadas" en el plan
-- de 24,99 € al mes.
--
-- Eso son dos problemas y el segundo es peor que el primero:
--
--   1. "Ilimitado" era falso. El Co-Work número 11 lanzaba una
--      excepción, y quien ha pagado por esa palabra tiene razón al
--      reclamar.
--   2. Kairo+ (9,99 €) y Supreme (24,99 €) tenían EXACTAMENTE los
--      mismos topes. Dos de los cinco argumentos de venta de Supreme no
--      lo diferenciaban en nada de un plan quince euros más barato.
--
-- Ahora cada plan tiene el suyo y la página de precios dice el número.
--
-- LOS NÚMEROS
--
--   Co-Works   Free 1   ·   Kairo+ 5   ·   Supreme 25
--   Mentes     Free 3   ·   Kairo+ 30  ·   Supreme 150
--
-- Un Co-Work se ejecuta cada mañana y cuesta 8 créditos. Con los 2.000
-- al mes de Kairo+ —unos 66 al día— cinco encargos son 40 diarios y
-- dejan sitio para chatear. Prometer más sería prometer trabajadores
-- que no aparecen, que es justo lo que se arregló cuando el plan gratis
-- se quedó en uno.
--
-- Las Mentes no cuestan nada: son instrucciones guardadas. Ahí el tope
-- solo existe para que nadie llene la tabla.
--
-- OJO CON LO QUE YA HAY
--
-- Los disparadores solo miran al INSERTAR. A quien ya tenga más de los
-- que le tocan no se le borra nada ni se le rompe nada: simplemente no
-- puede crear más hasta que baje del tope. Es lo correcto, porque lo
-- que ya creó se lo diste tú.
-- =============================================================

-- -------------------------------------------------------------
-- 1. EL TOPE DE CO-WORKS
-- -------------------------------------------------------------
create or replace function public.limitar_coworks()
returns trigger
language plpgsql
security definer                      -- para poder leer el plan del perfil
set search_path = public
as $$
declare
  v_plan  text;
  v_tope  integer;
  cuantos integer;
begin
  select plan into v_plan from public.perfiles where id = new.perfil_id;

  v_tope := case v_plan
              when 'supreme' then 25
              when 'plus'    then 5
              else 1                   -- free, y cualquier cosa rara
            end;

  select count(*) into cuantos from public.coworks where perfil_id = new.perfil_id;

  if cuantos >= v_tope then
    raise exception 'Has llegado al máximo de % Co-Works de tu plan.', v_tope
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists coworks_con_tope on public.coworks;
create trigger coworks_con_tope
  before insert on public.coworks
  for each row execute function public.limitar_coworks();

-- -------------------------------------------------------------
-- 2. EL TOPE DE MENTES
-- -------------------------------------------------------------
create or replace function public.limitar_mentes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan  text;
  v_tope  integer;
  cuantos integer;
begin
  select plan into v_plan from public.perfiles where id = new.perfil_id;

  v_tope := case v_plan
              when 'supreme' then 150
              when 'plus'    then 30
              else 3
            end;

  select count(*) into cuantos from public.mentes where perfil_id = new.perfil_id;

  if cuantos >= v_tope then
    raise exception 'Has llegado al máximo de % Mentes de tu plan.', v_tope
      using errcode = 'P0003';
  end if;

  return new;
end;
$$;

drop trigger if exists mentes_tope on public.mentes;
create trigger mentes_tope
  before insert on public.mentes
  for each row execute function public.limitar_mentes();

-- "Success. No rows returned" significa que está hecho.
