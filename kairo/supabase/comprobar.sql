/* ¿ESTÁN TODAS LAS MIGRACIONES?
 *
 * Pégalo en Supabase → SQL Editor → Run. No toca nada: solo mira.
 *
 * Si todo está en su sitio sale UNA línea: «NADA QUE HACER».
 * Si falta algo, sale una línea por cada cosa que falta, con el nombre
 * del archivo que hay que pegar (están en supabase/migrations/).
 *
 * Existe porque el panel de Supabase pone «LAST MIGRATION: No migrations»
 * aunque estén todas: esa casilla solo cuenta las que se suben con la
 * herramienta de línea de comandos, y las que se pegan aquí no aparecen.
 * Mirarlo a ojo, tabla por tabla, es media hora y una equivocación.
 */
with necesario(migracion, tipo, nombre) as (
  values
    ('0008_gist_y_paperwork', 'tabla',   'fichas'),
    ('0008_gist_y_paperwork', 'tabla',   'papeles'),
    ('0009_coworks',          'tabla',   'coworks'),
    ('0009_coworks',          'tabla',   'cowork_resultados'),
    ('0009_coworks',          'funcion', 'coworks_pendientes'),
    ('0009_coworks',          'funcion', 'reservar_cowork'),
    ('0009_coworks',          'funcion', 'terminar_cowork'),
    ('0010_vigilante',        'funcion', 'soltar_coworks_atascados'),
    ('0011_coworks_a_mano',   'funcion', 'reservar_mi_cowork'),
    ('0012_memoria',          'tabla',   'recuerdos'),
    ('0013_telegram',         'columna', 'perfiles.telegram_chat_id'),
    ('0014_plazos',           'tabla',   'avisos_papel'),
    ('0014_plazos',           'funcion', 'papeles_para_avisar'),
    ('0014_plazos',           'funcion', 'apuntar_aviso')
),
estado as (
  select migracion, tipo, nombre,
    case tipo
      when 'tabla' then to_regclass('public.' || nombre) is not null
      when 'funcion' then exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = nombre)
      when 'columna' then exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = split_part(nombre, '.', 1)
          and column_name = split_part(nombre, '.', 2))
    end as puesto
  from necesario
)
select migracion as "Falta esta migracion", tipo as "Falta este", nombre as "Llamado"
from estado
where not puesto
union all
select 'NADA QUE HACER: estan todas', '', ''
where not exists (select 1 from estado where not puesto)
order by 1;
