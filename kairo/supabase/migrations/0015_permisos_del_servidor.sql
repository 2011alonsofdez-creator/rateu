/* LOS PERMISOS DEL SERVIDOR, OTRA VEZ Y DE GOLPE.
 *
 * El reloj respondía «permission denied for function coworks_pendientes»
 * con la migración 0009 puesta y la función existiendo. Las migraciones
 * dan ese permiso a `service_role` una por una, cada una con la firma
 * exacta escrita a mano; basta con que una firma cambiara, con que un
 * bloque no llegara a ejecutarse, o con que la base de datos se montara
 * a trozos en otro orden, para que falte uno. Y falta uno = no trabaja
 * nada, porque la primera llamada ya se cae.
 *
 * Esto lo arregla de una: recorre las funciones que usa el servidor,
 * las busca POR SU FIRMA REAL en la base de datos (no por una escrita
 * aquí, que es justo lo que se desincroniza) y le da EXECUTE a
 * `service_role`. Lo que ya estuviera dado se queda igual.
 *
 * No afloja nada: `service_role` es la llave del servidor, que ya puede
 * con todo. A `anon` y a `authenticated` no se les toca.
 *
 * Se puede ejecutar las veces que haga falta.
 */

do $$
declare
  f record;
begin
  /* En una base de datos que no sea de Supabase este rol no existe, y
     entonces no hay nada que dar. */
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    raise notice 'Sin rol service_role: no es una base de Supabase, no hay nada que hacer.';
    return;
  end if;

  for f in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        /* El reloj y los Co-Works */
        'coworks_pendientes', 'reservar_cowork', 'terminar_cowork',
        'reservar_mi_cowork', 'terminar_mi_cowork', 'soltar_coworks_atascados',
        /* Los avisos de plazos */
        'papeles_para_avisar', 'apuntar_aviso',
        /* Los créditos y los pagos */
        'gastar_creditos', 'gastar_creditos_de', 'anadir_creditos',
        'recargar_plan', 'aplicar_suscripcion', 'registrar_evento_pago',
        /* La hora de cada uno */
        'hora_local'
      )
  loop
    execute format('grant execute on function %s to service_role', f.firma);
  end loop;
end
$$;

/* Y las tablas que el servidor lee y escribe sin nadie delante. En
   Supabase `service_role` ya las tiene por defecto, pero una migración
   que hace `revoke all ... from <roles>` se las puede llevar por delante
   si alguna vez se escribe el nombre de más. Darlas aquí cuesta nada. */
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    return;
  end if;

  foreach t in array array[
    'perfiles', 'conversaciones', 'mensajes',
    'coworks', 'cowork_resultados',
    'papeles', 'avisos_papel',
    'movimientos', 'suscripciones', 'eventos_pago'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on public.%I to service_role', t);
    end if;
  end loop;
end
$$;
