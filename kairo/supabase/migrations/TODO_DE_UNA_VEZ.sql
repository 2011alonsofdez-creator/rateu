-- =============================================================
-- Kairo · TODO LO QUE FALTA, DE UNA VEZ
--
-- Esto no es una migración nueva: son las seis que van de la 0003 a la
-- 0008, pegadas una detrás de otra y en orden. Existe para no tener que
-- abrir seis archivos y hacer seis pegadas.
--
-- CÓMO SE USA
--   Supabase → SQL Editor → New query → pegar esto entero → Run.
--
-- Se puede ejecutar dos veces, o diez, sin romper nada: cada trozo
-- comprueba antes si lo suyo ya existe. Los avisos en amarillo que
-- digan "already exists, skipping" son normales y buenos.
--
-- Si sale algo en ROJO, eso sí hay que mirarlo: copia el mensaje.
--
-- Qué añade cada parte:
--   0003 · Mentes
--   0004 · Mentes con instrucciones más largas
--   0005 · Historial de conversaciones (y arregla los niveles)
--   0006 · Pagos
--   0007 · Fuentes bajo las respuestas
--   0008 · Gist y Paperwork
-- =============================================================


-- ▼▼▼ 0003_mentes.sql ▼▼▼

-- =============================================================
-- Kairo · Mentes — la IA especializada que crea cada persona
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABLA
--    Una Mente es un puñado de instrucciones con nombre. Los
--    límites de longitud están en la propia columna a propósito:
--    validar solo en el navegador no valida nada, porque cualquiera
--    puede llamar a la API por su cuenta.
-- -------------------------------------------------------------

create table if not exists public.mentes (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references public.perfiles (id) on delete cascade,
  nombre         text not null check (length(btrim(nombre)) between 1 and 60),
  emoji          text not null default '🧠' check (length(emoji) <= 8),
  descripcion    text not null default '' check (length(descripcion) <= 160),
  instrucciones  text not null default '' check (length(instrucciones) <= 4000),
  -- Nulo = hereda el tono de los ajustes del perfil.
  tono           text check (tono in ('cercano', 'experto', 'chispa', 'breve')),
  creada_el      timestamptz not null default now(),
  actualizada_el timestamptz not null default now()
);

create index if not exists idx_mentes_perfil on public.mentes (perfil_id, creada_el);

-- La conversación ya tenía la columna desde el primer día; ahora que la
-- tabla existe, se le pone el vínculo de verdad. Si se borra una Mente,
-- las conversaciones que la usaron siguen ahí, sin ella.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'conversaciones_mente_id_fkey'
  ) then
    alter table public.conversaciones
      add constraint conversaciones_mente_id_fkey
      foreign key (mente_id) references public.mentes (id) on delete set null;
  end if;
end $$;

-- -------------------------------------------------------------
-- 2. UN TOPE POR PERSONA
--    Sin esto, un script crea un millón de filas en una tarde.
--    Treinta es de sobra para cualquiera que las use de verdad.
-- -------------------------------------------------------------

create or replace function public.limitar_mentes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.mentes where perfil_id = new.perfil_id) >= 30 then
    raise exception 'Has llegado al máximo de Mentes' using errcode = 'P0003';
  end if;
  return new;
end;
$$;

drop trigger if exists mentes_tope on public.mentes;
create trigger mentes_tope
  before insert on public.mentes
  for each row execute function public.limitar_mentes();

create or replace function public.tocar_mente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizada_el := now();
  return new;
end;
$$;

drop trigger if exists mentes_tocar on public.mentes;
create trigger mentes_tocar
  before update on public.mentes
  for each row execute function public.tocar_mente();

-- -------------------------------------------------------------
-- 3. SEGURIDAD A NIVEL DE FILA
--    Tus Mentes son tuyas. Nadie más las lee ni las edita, y eso lo
--    decide la base de datos, no la aplicación.
-- -------------------------------------------------------------

alter table public.mentes enable row level security;

drop policy if exists mentes_todo on public.mentes;

create policy mentes_todo on public.mentes
  for all using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- La política dice QUÉ FILAS; el permiso dice QUÉ COLUMNAS.
-- perfil_id se puede poner al crear (la política comprueba que es el
-- tuyo) pero no se puede cambiar después: así una Mente no se muda a
-- la cuenta de otro.
grant select, delete on public.mentes to authenticated;
grant insert (perfil_id, nombre, emoji, descripcion, instrucciones, tono)
  on public.mentes to authenticated;
grant update (nombre, emoji, descripcion, instrucciones, tono)
  on public.mentes to authenticated;

-- ▲▲▲ fin de 0003_mentes.sql ▲▲▲


-- ▼▼▼ 0004_mentes_mas_texto.sql ▼▼▼

-- =============================================================
-- Kairo · Más sitio para escribir una Mente
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
-- =============================================================
--
-- 4.000 caracteres daban para un párrafo largo, y una Mente bien
-- escrita no es un párrafo: es un encargo. Cómo trabaja, qué formato
-- quieres, qué no debe hacer nunca, ejemplos de lo que esperas. Eso
-- ocupa páginas, no líneas.
--
-- 12.000 caracteres son unas cuatro páginas, que es de sobra para
-- cualquier encargo de verdad y sigue siendo pequeño al lado de lo
-- que aguanta el modelo. La descripción sube a 300 por lo mismo: una
-- sola línea no siempre basta para acordarse de para qué era.

alter table public.mentes drop constraint if exists mentes_instrucciones_check;
alter table public.mentes
  add constraint mentes_instrucciones_check check (length(instrucciones) <= 12000);

alter table public.mentes drop constraint if exists mentes_descripcion_check;
alter table public.mentes
  add constraint mentes_descripcion_check check (length(descripcion) <= 300);

-- ▲▲▲ fin de 0004_mentes_mas_texto.sql ▲▲▲


-- ▼▼▼ 0005_historial.sql ▼▼▼

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

-- ▲▲▲ fin de 0005_historial.sql ▲▲▲


-- ▼▼▼ 0006_pagos.sql ▼▼▼

-- =============================================================
-- Kairo · Paso 4 — Suscripciones y packs de créditos
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
-- =============================================================
--
-- Una regla manda sobre todo lo de aquí: EL NAVEGADOR NO TOCA EL DINERO.
-- Ni el plan, ni los créditos, ni el estado de la suscripción. Todo eso
-- lo mueven las funciones de abajo, y a esas funciones solo puede
-- llamarlas el servidor con la clave de administrador, nunca una página.

-- -------------------------------------------------------------
-- 1. TABLAS
-- -------------------------------------------------------------

create table if not exists public.suscripciones (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references public.perfiles (id) on delete cascade,
  proveedor      text not null default 'lemonsqueezy',
  -- El identificador que le da el proveedor. Es la llave para no
  -- duplicar suscripciones cuando reenvía el mismo aviso.
  proveedor_id   text not null,
  plan           text not null check (plan in ('plus', 'supreme')),
  estado         text not null check (estado in
                   ('en_prueba', 'activa', 'pausada', 'impagada', 'cancelada', 'vencida')),
  -- Cuándo se renueva, o cuándo se acaba si está cancelada.
  renueva_el     date,
  termina_el     date,
  -- Enlace del proveedor para que el usuario gestione o cancele su
  -- suscripción él mismo. Algunos caducan; si falla, el propio
  -- proveedor lo dirá, y siempre queda el enlace del correo de compra.
  portal         text,
  creada_el      timestamptz not null default now(),
  actualizada_el timestamptz not null default now(),
  unique (proveedor, proveedor_id)
);

create index if not exists idx_susc_perfil on public.suscripciones (perfil_id);

/* El libro de avisos ya atendidos.
   Los proveedores de pago reenvían un aviso si no les contestas rápido,
   y también si les da la gana. Sin esto, un reenvío del pack de 2.000
   créditos te los regala dos veces. Con esto, el segundo aviso no hace
   nada porque su identificador ya está en la tabla. */
create table if not exists public.eventos_pago (
  id          text primary key,
  tipo        text not null default '',
  recibido_el timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 2. SEGURIDAD
--    Tú ves tu suscripción. Nadie escribe nada desde el navegador.
-- -------------------------------------------------------------

alter table public.suscripciones enable row level security;
alter table public.eventos_pago  enable row level security;

drop policy if exists susc_leer on public.suscripciones;
create policy susc_leer on public.suscripciones
  for select using (perfil_id = public.mi_perfil_id());

-- Sin políticas de escritura a propósito, y sin ninguna política en
-- eventos_pago: esa tabla no la ve nadie más que el servidor.

grant select on public.suscripciones to authenticated;
revoke all on public.eventos_pago from anon, authenticated;

-- -------------------------------------------------------------
-- 3. APLICAR UNA SUSCRIPCIÓN
--
--    Cancelada NO es lo mismo que vencida, y confundirlas es quitarle
--    a alguien lo que ha pagado:
--      cancelada → no se renovará, pero sigue teniendo acceso hasta que
--                  termine el mes que ya pagó.
--      vencida   → se acabó. Ahora sí, a plan gratuito.
-- -------------------------------------------------------------

drop function if exists public.aplicar_suscripcion(uuid, text, text, text, date, date, text);

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
           creditos   = least(creditos, 15),
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

-- -------------------------------------------------------------
-- 4. RECARGAR LOS CRÉDITOS DEL MES
--    Se llama cuando el proveedor confirma que ha cobrado. Los del plan
--    se reponen; los comprados en packs no se tocan, que esos no caducan.
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
                when 'supreme' then 3000
                when 'plus'    then 1000
                else 15
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

-- -------------------------------------------------------------
-- 5. PACKS DE CRÉDITOS
--    Van a creditos_extra, que no caduca ni se pisa con la recarga
--    mensual: los has comprado aparte y son tuyos hasta que los gastes.
-- -------------------------------------------------------------

create or replace function public.anadir_creditos(
  p_perfil   uuid,
  p_cantidad integer,
  p_motivo   text default 'pack de créditos'
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
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  update public.perfiles
     set creditos_extra = creditos_extra + p_cantidad
   where id = p_perfil
  returning * into v_perfil;

  if v_perfil.id is null then
    raise exception 'Perfil no encontrado' using errcode = 'P0002';
  end if;

  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  values (p_perfil, 'compra', p_cantidad, p_motivo);

  return v_perfil;
end;
$$;

-- -------------------------------------------------------------
-- 6. ¿YA ATENDIMOS ESTE AVISO?
--    Devuelve true la primera vez y false en los reenvíos.
-- -------------------------------------------------------------

create or replace function public.registrar_evento_pago(
  p_id   text,
  p_tipo text default ''
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  insert into public.eventos_pago (id, tipo) values (p_id, p_tipo);
  return true;
exception when unique_violation then
  return false;
end;
$$;

-- -------------------------------------------------------------
-- 7. QUIÉN PUEDE LLAMAR A TODO ESTO
--    Nadie salvo el servidor. Si `anon` pudiera llamar a
--    aplicar_suscripcion, cualquiera se pondría Supreme desde la
--    consola del navegador en diez segundos.
-- -------------------------------------------------------------

revoke all on function public.aplicar_suscripcion(uuid, text, text, text, date, date, text, text) from public, anon, authenticated;
revoke all on function public.recargar_plan(uuid, text)                                     from public, anon, authenticated;
revoke all on function public.anadir_creditos(uuid, integer, text)                          from public, anon, authenticated;
revoke all on function public.registrar_evento_pago(text, text)                             from public, anon, authenticated;

-- ▲▲▲ fin de 0006_pagos.sql ▲▲▲


-- ▼▼▼ 0007_fuentes.sql ▼▼▼

-- =============================================================
-- Kairo · De dónde salió cada dato
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Kairo ya puede buscar en internet antes de contestar. Esto guarda
-- con cada respuesta las páginas que consultó, para que al volver a
-- abrir la conversación las fuentes sigan debajo y no haya que
-- creerse el dato a ciegas.
-- =============================================================

-- -------------------------------------------------------------
-- 1. LAS COLUMNAS
--    jsonb y no dos tablas nuevas: una lista de enlaces que solo se
--    lee junto a su mensaje no necesita tabla propia, ni índices, ni
--    claves foráneas. Y jsonb valida que sea JSON de verdad.
-- -------------------------------------------------------------

alter table public.mensajes
  add column if not exists fuentes   jsonb,
  add column if not exists busquedas jsonb;

-- -------------------------------------------------------------
-- 2. QUE SEAN LISTAS
--    Sin esto, cualquier cosa cabría en la columna: un número, una
--    cadena, un objeto. La ruta ya valida lo que pinta, pero lo que
--    impide de verdad guardar basura es la tabla.
-- -------------------------------------------------------------

alter table public.mensajes drop constraint if exists mensajes_fuentes_check;
alter table public.mensajes
  add constraint mensajes_fuentes_check
  check (
    fuentes is null
    or (jsonb_typeof(fuentes) = 'array' and jsonb_array_length(fuentes) <= 12)
  );

alter table public.mensajes drop constraint if exists mensajes_busquedas_check;
alter table public.mensajes
  add constraint mensajes_busquedas_check
  check (
    busquedas is null
    or (jsonb_typeof(busquedas) = 'array' and jsonb_array_length(busquedas) <= 6)
  );

-- -------------------------------------------------------------
-- 3. PERMISOS
--    No hacen falta: el permiso de 0001 es sobre la tabla entera, así
--    que cubre también las columnas que se añadan después. Se deja
--    dicho aquí para que nadie lo busque.
-- -------------------------------------------------------------

-- ▲▲▲ fin de 0007_fuentes.sql ▲▲▲


-- ▼▼▼ 0008_gist_y_paperwork.sql ▼▼▼

-- =============================================================
-- Kairo · Gist y Paperwork
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Dos apartados nuevos, y los dos guardan lo mismo: una ficha que se
-- hace una vez y se consulta muchas.
--   · Gist      → pegas un enlace y queda el resumen, para volver a él
--   · Paperwork → subes un papel y queda qué es y para cuándo
-- =============================================================

-- -------------------------------------------------------------
-- 1. GIST: los resúmenes guardados
-- -------------------------------------------------------------

create table if not exists public.fichas (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfiles (id) on delete cascade,
  tipo        text not null default 'web' check (tipo in ('video', 'web')),
  url         text not null default '',
  titulo      text not null default '',
  autor       text not null default '',
  -- El resumen largo, en markdown.
  resumen     text not null default '',
  -- [{ "marca": "12:30", "texto": "..." }] — el minuto o el apartado.
  puntos      jsonb,
  -- Las páginas que consultó, con la misma forma que en los mensajes.
  fuentes     jsonb,
  modelo      text,
  creada_el   timestamptz not null default now()
);

create index if not exists idx_fichas_perfil on public.fichas (perfil_id, creada_el desc);

alter table public.fichas drop constraint if exists fichas_titulo_check;
alter table public.fichas
  add constraint fichas_titulo_check check (length(titulo) <= 300);

alter table public.fichas drop constraint if exists fichas_url_check;
alter table public.fichas
  add constraint fichas_url_check check (length(url) <= 2000);

alter table public.fichas drop constraint if exists fichas_resumen_check;
alter table public.fichas
  add constraint fichas_resumen_check check (length(resumen) <= 40000);

-- -------------------------------------------------------------
-- 2. PAPERWORK: la bandeja de los papeles
--    Lo que importa de un papel oficial no es el texto: es la fecha.
--    Por eso fecha_limite es una columna de verdad y no un campo
--    dentro de un json: se ordena por ella y se avisa con ella.
-- -------------------------------------------------------------

create table if not exists public.papeles (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references public.perfiles (id) on delete cascade,
  titulo         text not null default '',
  remitente      text not null default '',
  de_que_va      text not null default '',
  que_quieren    text not null default '',
  importe        text not null default '',
  fecha_limite   date,
  consecuencias  text not null default '',
  -- ["Pagar antes del...", "Guardar el justificante"]
  pasos          jsonb,
  -- Un borrador de respuesta, si hace falta contestar.
  borrador       text not null default '',
  archivo        text not null default '',
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'hecho')),
  creada_el      timestamptz not null default now()
);

create index if not exists idx_papeles_perfil on public.papeles (perfil_id, fecha_limite nulls last);

alter table public.papeles drop constraint if exists papeles_titulo_check;
alter table public.papeles
  add constraint papeles_titulo_check check (length(titulo) <= 300);

-- -------------------------------------------------------------
-- 3. SEGURIDAD A NIVEL DE FILA
--    Lo de siempre: cada uno ve lo suyo y nada más. Un resumen de un
--    vídeo puede parecer inocente; la carta de Hacienda de alguien,
--    desde luego, no.
-- -------------------------------------------------------------

alter table public.fichas  enable row level security;
alter table public.papeles enable row level security;

drop policy if exists fichas_todo on public.fichas;
create policy fichas_todo on public.fichas
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

drop policy if exists papeles_todo on public.papeles;
create policy papeles_todo on public.papeles
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- -------------------------------------------------------------
-- 4. PERMISOS POR COLUMNA
--    Insertar, sí. Cambiar de dueño, no: `perfil_id` no está en la
--    lista de lo que se puede actualizar, así que una ficha no se
--    puede mover a la cuenta de otro ni a propósito.
-- -------------------------------------------------------------

grant select, insert, delete on public.fichas  to authenticated;
grant update (titulo) on public.fichas to authenticated;

grant select, insert, delete on public.papeles to authenticated;
grant update (titulo, estado) on public.papeles to authenticated;

-- -------------------------------------------------------------
-- 5. UN TOPE POR PERSONA
--    Sin esto, un script en bucle llena la tabla de otro. El tope es
--    alto: no molesta a nadie normal y corta al que no lo es.
-- -------------------------------------------------------------

create or replace function public.limitar_fichas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cuantas integer;
  tope    integer;
begin
  if tg_table_name = 'fichas' then tope := 500; else tope := 500; end if;

  execute format('select count(*) from public.%I where perfil_id = $1', tg_table_name)
    into cuantas using new.perfil_id;

  if cuantas >= tope then
    raise exception 'Has llegado al máximo de % guardados.', tope
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists fichas_con_tope on public.fichas;
create trigger fichas_con_tope
  before insert on public.fichas
  for each row execute function public.limitar_fichas();

drop trigger if exists papeles_con_tope on public.papeles;
create trigger papeles_con_tope
  before insert on public.papeles
  for each row execute function public.limitar_fichas();

-- ▲▲▲ fin de 0008_gist_y_paperwork.sql ▲▲▲


