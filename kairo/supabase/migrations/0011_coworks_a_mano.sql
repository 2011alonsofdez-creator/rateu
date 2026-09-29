-- =============================================================
-- Kairo · Co-Works: los tipos nuevos, y poder probarlos sin la llave
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Esto arregla la cosa más tonta que tenían los Co-Works: para pulsar
-- «Probar ahora» hacía falta SUPABASE_SERVICE_ROLE_KEY en Vercel. La
-- llave del servidor es para el reloj, que trabaja sin nadie delante;
-- para probar un encargo TUYO, estando TÚ delante y con TU sesión, no
-- hace ninguna falta.
--
-- Así que aquí abajo hay dos funciones gemelas de las del reparto, pero
-- que en vez de fiarse de quien llama se lo preguntan a la base de
-- datos: ¿este encargo es de quien lo está pidiendo? Si no, no pasa.
--
-- Y de paso, tres tipos nuevos de Co-Work.
-- =============================================================

-- -------------------------------------------------------------
-- 1. LOS TIPOS NUEVOS
--
--    brief   · el resumen de tus temas cada mañana
--    salud   · el vigilante, que mira que todo siga en pie
--    repaso  · un trozo de lo que estás estudiando, cada día
--    precio  · qué cuestan hoy las cosas que le digas
--    idioma  · diez minutos de inglés (o del idioma que sea)
--
--    La lista está cerrada aquí además de en el código, y en las dos a
--    propósito: un tipo que aparece por descuido se ejecuta solo todos
--    los días y gasta créditos todos los días.
-- -------------------------------------------------------------

alter table public.coworks drop constraint if exists coworks_tipo_check;
alter table public.coworks
  add constraint coworks_tipo_check
  check (tipo in ('brief', 'salud', 'repaso', 'precio', 'idioma'));

-- -------------------------------------------------------------
-- 2. RESERVAR EL DÍA, CON TU SESIÓN
--
--    Igual que `reservar_cowork`, con dos diferencias que son justo las
--    que la hacen segura:
--
--    a) El encargo tiene que ser tuyo. Lo comprueba ella, no quien
--       llama: `mi_perfil_id()` sale del token, y un token no se puede
--       falsificar desde el navegador.
--    b) El día NO lo elige quien llama: lo calcula ella con la zona
--       horaria del encargo. Si lo eligiera el navegador, se podría
--       pedir el de mañana, y el de pasado, y el de todo el mes que
--       viene: un resumen al día se convertiría en treinta.
--
--    Devuelve siempre una fila. `resultado` nulo significa "el día ya
--    estaba cogido", y el día viene igual porque quien llama lo necesita
--    para ir a buscar lo que se hizo.
-- -------------------------------------------------------------

drop function if exists public.reservar_mi_cowork(uuid);

create or replace function public.reservar_mi_cowork(p_cowork uuid)
returns table (resultado uuid, dia date)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil uuid;
  v_zona   text;
  v_dia    date;
  v_id     uuid;
begin
  v_perfil := public.mi_perfil_id();
  if v_perfil is null then
    raise exception 'Sin sesión' using errcode = '28000';
  end if;

  -- Tuyo o de nadie. Y con esto la comprobación deja de estar en la
  -- ruta, que es código que se puede olvidar de hacerla.
  select c.zona into v_zona
    from public.coworks c
   where c.id = p_cowork
     and c.perfil_id = v_perfil;

  if v_zona is null then
    raise exception 'Ese Co-Work no existe o no es tuyo' using errcode = '42501';
  end if;

  v_dia := public.hora_local(v_zona)::date;

  /* Una reserva muerta no bloquea el día: el mismo cuarto de hora que
     usa el reparto.

     El alias `r` no es cosmético. Esta función devuelve una columna que
     se llama `dia`, así que dentro de ella `dia` a secas significa dos
     cosas —la columna de la tabla y la que se devuelve— y PostgreSQL se
     planta: «column reference "dia" is ambiguous». Sin el alias, esto
     no borra nada y reservar falla siempre. */
  delete from public.cowork_resultados r
   where r.cowork_id = p_cowork
     and r.dia = v_dia
     and r.estado = 'ejecutando'
     and r.creado_el < now() - interval '15 minutes';

  insert into public.cowork_resultados (cowork_id, perfil_id, dia, estado)
  values (p_cowork, v_perfil, v_dia, 'ejecutando')
  on conflict on constraint cowork_resultados_unico do nothing
  returning id into v_id;

  return query select v_id, v_dia;
end;
$$;

-- -------------------------------------------------------------
-- 3. APUNTAR CÓMO FUE, CON TU SESIÓN
--
--    Lo mismo: solo puede cerrar una fila que sea suya.
--
--    Aquí hay que decir qué NO protege esto, porque parece que sí:
--    alguien que se ponga a llamar a esta función a mano puede escribir
--    lo que quiera en SU resultado de hoy, o marcarlo como hecho sin
--    haberlo hecho. Y no importa: lo único que consigue es quedarse sin
--    su propio resumen. Los créditos no pasan por aquí —se cobran con
--    `gastar_creditos`, que cuenta el saldo ella sola— así que por este
--    camino no se regala nada ni se le quita nada a nadie.
-- -------------------------------------------------------------

create or replace function public.terminar_mi_cowork(
  p_resultado    uuid,
  p_estado       text,
  p_contenido    text default '',
  p_fuentes      jsonb default null,
  p_modelo       text default null,
  p_conversacion uuid default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_perfil uuid;
  v_cowork uuid;
begin
  if p_estado not in ('ok', 'sin_creditos', 'error') then
    raise exception 'Estado no válido: %', p_estado using errcode = '22023';
  end if;

  v_perfil := public.mi_perfil_id();
  if v_perfil is null then
    raise exception 'Sin sesión' using errcode = '28000';
  end if;

  update public.cowork_resultados
     set estado          = p_estado,
         contenido       = left(coalesce(p_contenido, ''), 40000),
         fuentes         = p_fuentes,
         modelo          = p_modelo,
         conversacion_id = p_conversacion
   where id = p_resultado
     and perfil_id = v_perfil
  returning cowork_id into v_cowork;

  if v_cowork is not null then
    update public.coworks set ultima_vez = now() where id = v_cowork;
  end if;
end;
$$;

-- -------------------------------------------------------------
-- 4. SOLTAR LO ATASCADO, TAMBIÉN DESDE TU SESIÓN
--
--    El vigilante suelta los trabajos que se quedaron a medias. Cuando
--    lo lanza el reloj va con la llave del servidor y puede soltar los
--    de cualquiera; cuando lo lanzas tú con «Probar ahora» va con tu
--    sesión y solo puede soltar los tuyos.
--
--    Y eso no se lo pregunta a quien llama: si hay sesión, el perfil
--    que venga en `p_perfil` se IGNORA y se usa el tuyo. El reloj no
--    tiene sesión (`auth.uid()` vale nulo con la llave del servidor),
--    así que es el único que puede decir de quién. A `anon` no se le da
--    esta función, que es lo que impide que un desconocido entre por
--    ese mismo hueco.
-- -------------------------------------------------------------

create or replace function public.soltar_coworks_atascados(
  p_horas  integer default 1,
  p_perfil uuid default null
)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cuantos integer;
  v_perfil  uuid := p_perfil;
begin
  -- Con sesión, los tuyos y solo los tuyos, digas lo que digas.
  if auth.uid() is not null then
    v_perfil := public.mi_perfil_id();
    if v_perfil is null then
      raise exception 'Sin sesión' using errcode = '28000';
    end if;
  end if;

  delete from public.cowork_resultados
   where estado = 'ejecutando'
     and creado_el < now() - make_interval(hours => greatest(1, coalesce(p_horas, 1)))
     and (v_perfil is null or perfil_id = v_perfil);

  get diagnostics v_cuantos = row_count;
  return v_cuantos;
end;
$$;

-- -------------------------------------------------------------
-- 5. PERMISOS
--
--    Se limpia primero y se da después, por lo de siempre: en Supabase
--    las funciones nuevas nacen con EXECUTE dado explícitamente a
--    `anon` y a `authenticated`, y un permiso explícito no se quita
--    quitándoselo a `public`.
--
--    `anon` no entra en ninguna: sin sesión no hay dueño que comprobar,
--    y una función que comprueba al dueño no vale nada si la puede
--    llamar quien no tiene ninguno.
-- -------------------------------------------------------------

revoke all on function public.reservar_mi_cowork(uuid) from public, anon, authenticated;
revoke all on function public.terminar_mi_cowork(uuid, text, text, jsonb, text, uuid) from public, anon, authenticated;
revoke all on function public.soltar_coworks_atascados(integer, uuid) from public, anon, authenticated;

grant execute on function public.reservar_mi_cowork(uuid) to authenticated;
grant execute on function public.terminar_mi_cowork(uuid, text, text, jsonb, text, uuid) to authenticated;
grant execute on function public.soltar_coworks_atascados(integer, uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.soltar_coworks_atascados(integer, uuid) to service_role';
  end if;
end
$$;
