-- =============================================================
-- Kairo · El plan gratis, para que se pueda probar de verdad
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- POR QUÉ SE CAMBIA
--
-- Una cuenta gratis tenía 15 créditos al día y solo el nivel Rápido.
-- Rápido cuesta 1, así que eran quince preguntas cortas y nada más:
-- Kairo Code, Gist y Paperwork van en Normal y cuestan 4, o sea que
-- estaban cerrados. Enseñar Code por ahí y que quien se registre no
-- pueda tocarlo es la peor forma de gastar una visita.
--
-- Lo que se hace aquí abajo son dos cosas:
--
--   1. Veinte al día en vez de quince. Con Rápido y Normal abiertos
--      (eso va en el código), veinte dan para el día a día de verdad:
--      cinco apps en Code, o un papel y unas preguntas.
--
--   2. Ciento cincuenta de regalo al registrarse, una sola vez. No es
--      una cifra al azar: un MEGA cuesta 120. Da para probar UN MEGA
--      —varios cerebros a la vez, que es lo mejor que hace Kairo— y
--      que sobren treinta. Para el segundo, se paga.
--
--      Van a `creditos_extra`, que es la hucha que NO se borra con la
--      recarga diaria. Así el regalo dura hasta que se gasta, en vez
--      de evaporarse a medianoche.
-- =============================================================

-- -------------------------------------------------------------
-- 1. VEINTE AL DÍA
--    Se cambian los tres sitios donde estaba escrito el quince: el
--    valor de partida, a quién se recarga y cuánto se le pone.
-- -------------------------------------------------------------

alter table public.perfiles alter column creditos set default 20;

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
       set creditos   = 20,
           renueva_el = (current_date + interval '1 day')::date
     where plan = 'free'
       and creditos < 20
    returning id, 20 - creditos as antes
  )
  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  select id, 'recarga', 20, 'Recarga diaria del plan gratuito' from recargados;

  get diagnostics v_afectados = row_count;
  return v_afectados;
end;
$$;

revoke all on function public.recargar_creditos_free() from public;

-- -------------------------------------------------------------
-- 2. EL REGALO DE BIENVENIDA
--
--    Solo para las cuentas NUEVAS: es un `default`, así que a quien ya
--    está no se le toca el saldo. Y a propósito: regalar a toda la base
--    de golpe no es una bienvenida, es un descuadre.
-- -------------------------------------------------------------

alter table public.perfiles alter column creditos_extra set default 150;

-- Y nada más. Si esto te devuelve "Success. No rows returned", está
-- hecho: la próxima cuenta que se registre entra con 150 de regalo.
