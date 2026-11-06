-- =============================================================
-- Kairo · El último 15 que quedaba suelto
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- POR QUÉ
--
-- La 0020 dobló la escala y arregló el 15 que `recargar_plan` le ponía
-- a las cuentas gratis. Había otro igual en `aplicar_suscripcion`, que
-- es la que corre cuando una suscripción vence o no se paga: baja el
-- plan a gratis y de paso recorta el saldo a 15 créditos.
--
-- Con el plan gratis en 40 al día, eso dejaba a quien se le acaba de
-- caducar la suscripción por debajo de cualquiera que acaba de
-- registrarse. Se arreglaba solo a la mañana siguiente con la recarga
-- diaria, pero entre medias le cobras un tope de 40 y le das 15.
--
-- OJO: esto es la función ENTERA, copiada de la 0006 con un solo
-- cambio (el 15 pasa a 40). Va completa a propósito: `create or
-- replace` con una lista de parámetros distinta NO reemplaza nada,
-- crea una función nueva al lado y deja la vieja haciendo su trabajo.
-- =============================================================

create or replace function public.aplicar_suscripcion(
  p_perfil       uuid,
  p_proveedor_id text,
  p_plan         text,
  p_estado       text,
  p_renueva      date default null,
  p_termina      date default null,
  p_portal       text default null,
  p_proveedor    text default 'lemonsqueezy'
)
returns public.perfiles
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil public.perfiles;
begin
  if p_perfil is null then
    raise exception 'Falta el perfil' using errcode = '22023';
  end if;

  insert into public.suscripciones
         (perfil_id, proveedor, proveedor_id, plan, estado, renueva_el, termina_el, portal)
  values (p_perfil, p_proveedor, p_proveedor_id, p_plan, p_estado, p_renueva, p_termina, p_portal)
  on conflict (proveedor, proveedor_id) do update
     set plan           = excluded.plan,
         estado         = excluded.estado,
         renueva_el     = excluded.renueva_el,
         termina_el     = excluded.termina_el,
         -- Si el aviso no trae portal, se conserva el que ya había.
         portal         = coalesce(excluded.portal, public.suscripciones.portal),
         actualizada_el = now();

  if p_estado in ('en_prueba', 'activa', 'cancelada') then
    -- Sigue teniendo lo que pagó. Los créditos NO se tocan aquí: se
    -- recargan cuando el proveedor confirma el cobro, no al firmar.
    update public.perfiles
       set plan       = p_plan,
           renueva_el = coalesce(p_renueva, p_termina, renueva_el)
     where id = p_perfil
    returning * into v_perfil;

  elsif p_estado in ('vencida', 'impagada') then
    update public.perfiles
       set plan       = 'free',
           -- El tope del plan gratis, no un número de hace dos versiones.
           creditos   = least(creditos, 40),
           renueva_el = (current_date + interval '1 day')::date
     where id = p_perfil
    returning * into v_perfil;

  else
    -- pausada: se queda como está, ni sube ni baja.
    select * into v_perfil from public.perfiles where id = p_perfil;
  end if;

  return v_perfil;
end;
$$;

revoke all on function public.aplicar_suscripcion(uuid, text, text, text, date, date, text, text) from public;

-- "Success. No rows returned" significa que está hecho.
