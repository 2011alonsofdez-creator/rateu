-- =============================================================
-- Kairo · TODO LO QUE FALTA, DE UNA VEZ
--
-- Esto no es una migración nueva: son las diez que van de la 0003 a la
-- 0012, pegadas una detrás de otra y en orden. Existe para no tener que
-- abrir diez archivos y hacer diez pegadas.
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
--   0009 · Co-Works (los encargos que se ejecutan solos)
--   0010 · El Vigilante (el Co-Work que vigila que todo siga en pie)
--   0011 · Los demás tipos de Co-Work, y poder probarlos sin la llave
--   0012 · La memoria: lo que Kairo recuerda de ti
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

-- ▼▼▼ 0009_coworks.sql ▼▼▼

-- =============================================================
-- Kairo · Co-Works: los encargos que se ejecutan solos
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Un Co-Work es un trabajo con hora. Nadie lo lanza: llega la hora y se
-- hace, estés o no delante. Eso obliga a resolver tres cosas que un chat
-- normal no tiene que resolver, y las tres viven aquí, en la base de
-- datos, porque es el único sitio donde dos servidores a la vez se
-- ponen de acuerdo:
--
--   1. QUÉ toca ahora           → coworks_pendientes()
--   2. QUIÉN lo coge            → reservar_cowork()   (uno y solo uno)
--   3. QUÉ pasó                 → terminar_cowork()
--
-- El día se cuenta en la zona horaria de cada uno. Un Co-Work de las
-- 7:00 es a las 7:00 de quien lo creó, no del servidor, que está en
-- Fráncfort y en invierno lleva otra hora.
-- =============================================================

-- -------------------------------------------------------------
-- 1. LA HORA DE CADA UNO
--    Si la zona guardada no existe (alguien escribe cualquier cosa por
--    la API), `at time zone` no devuelve un valor raro: revienta. Y una
--    zona mal escrita no puede tumbar el reparto de trabajo de todos
--    los demás, así que se cae a Madrid y sigue.
-- -------------------------------------------------------------

create or replace function public.hora_local(p_zona text)
returns timestamp
language plpgsql
stable
set search_path = public
as $$
begin
  return now() at time zone coalesce(nullif(trim(p_zona), ''), 'Europe/Madrid');
exception
  when others then
    return now() at time zone 'Europe/Madrid';
end;
$$;

-- -------------------------------------------------------------
-- 2. LOS ENCARGOS
-- -------------------------------------------------------------

create table if not exists public.coworks (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfiles (id) on delete cascade,
  nombre      text not null default '',
  -- De momento solo hay un tipo. La columna existe desde el principio
  -- para que añadir el siguiente no sea una migración de datos.
  tipo        text not null default 'brief' check (tipo in ('brief')),
  -- Lo que vigila: "IA, GTA 6, ofertas de PS5". En una línea, como se
  -- lo dirías a una persona.
  temas       text not null default '',
  -- La hora del día, entera. Los minutos sobran: esto no es una alarma,
  -- es "por la mañana" o "por la noche", y prometer el minuto exacto
  -- sería mentir, porque quien dispara esto no es un reloj de precisión.
  hora        smallint not null default 7 check (hora between 0 and 23),
  zona        text not null default 'Europe/Madrid',
  activo      boolean not null default true,
  -- Cuándo se ejecutó por última vez, para poder enseñarlo.
  ultima_vez  timestamptz,
  creado_el   timestamptz not null default now()
);

create index if not exists idx_coworks_perfil on public.coworks (perfil_id, creado_el desc);
-- El índice que usa el reparto: solo interesan los encendidos.
create index if not exists idx_coworks_activos on public.coworks (activo) where activo;

alter table public.coworks drop constraint if exists coworks_nombre_check;
alter table public.coworks
  add constraint coworks_nombre_check check (length(nombre) <= 120);

alter table public.coworks drop constraint if exists coworks_temas_check;
alter table public.coworks
  add constraint coworks_temas_check check (length(temas) <= 600);

alter table public.coworks drop constraint if exists coworks_zona_check;
alter table public.coworks
  add constraint coworks_zona_check check (length(zona) <= 60);

-- -------------------------------------------------------------
-- 3. LO QUE DEJÓ HECHO
--
--    La pareja (cowork, día) es ÚNICA, y esa restricción no es un
--    detalle de limpieza: es el candado. Dos servidores que se
--    despiertan a la vez intentan escribir la misma fila y la base de
--    datos deja pasar a uno solo. Sin eso, el mismo día te llegaría el
--    mismo resumen dos veces y se te cobraría dos veces.
-- -------------------------------------------------------------

create table if not exists public.cowork_resultados (
  id              uuid primary key default gen_random_uuid(),
  cowork_id       uuid not null references public.coworks (id) on delete cascade,
  perfil_id       uuid not null references public.perfiles (id) on delete cascade,
  -- El día en la zona del dueño, no en la del servidor.
  dia             date not null,
  estado          text not null default 'ejecutando'
                  check (estado in ('ejecutando', 'ok', 'sin_creditos', 'error')),
  contenido       text not null default '',
  fuentes         jsonb,
  modelo          text,
  -- La conversación que queda en la barra lateral para poder seguir
  -- preguntando sobre lo que te ha contado.
  conversacion_id uuid references public.conversaciones (id) on delete set null,
  creado_el       timestamptz not null default now(),
  constraint cowork_resultados_unico unique (cowork_id, dia)
);

create index if not exists idx_cowork_resultados_perfil
  on public.cowork_resultados (perfil_id, creado_el desc);

alter table public.cowork_resultados drop constraint if exists cowork_resultados_contenido_check;
alter table public.cowork_resultados
  add constraint cowork_resultados_contenido_check check (length(contenido) <= 40000);

-- -------------------------------------------------------------
-- 4. QUÉ TOCA AHORA
--
--    Devuelve los encargos cuya hora ya ha pasado HOY, en su propia
--    zona, y que no tienen resultado de hoy. Viene con los datos del
--    dueño para no tener que ir a buscarlos uno a uno: son los que
--    deciden el tono, la edad y si le quedan créditos.
-- -------------------------------------------------------------

create or replace function public.coworks_pendientes(p_limite integer default 50)
returns table (
  id         uuid,
  perfil_id  uuid,
  nombre     text,
  tipo       text,
  temas      text,
  zona       text,
  dia        date,
  duenio     text,
  modo_edad  text,
  tono       text,
  plan       text,
  saldo      integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.perfil_id,
    c.nombre,
    c.tipo,
    c.temas,
    c.zona,
    public.hora_local(c.zona)::date as dia,
    p.nombre                        as duenio,
    p.modo_edad,
    p.tono,
    p.plan,
    (p.creditos + p.creditos_extra) as saldo
  from public.coworks c
  join public.perfiles p on p.id = c.perfil_id
  where c.activo
    and extract(hour from public.hora_local(c.zona)) >= c.hora
    and not exists (
      select 1
        from public.cowork_resultados r
       where r.cowork_id = c.id
         and r.dia = public.hora_local(c.zona)::date
         /* Una reserva muerta no cuenta como trabajo hecho. Si alguien
            se cayó a mitad —una función a la que se le acabó el minuto,
            por ejemplo— la fila se queda en 'ejecutando' para siempre, y
            sin esta línea el encargo quedaría fuera del reparto el resto
            del día: nunca se reintenta, porque el que libera las
            reservas muertas es `reservar_cowork`, y a `reservar_cowork`
            solo se llama para lo que sale de aquí. Es el mismo cuarto de
            hora que usa allí. */
         and not (
           r.estado = 'ejecutando'
           and r.creado_el < now() - interval '15 minutes'
         )
    )
  order by c.creado_el
  limit greatest(1, least(coalesce(p_limite, 50), 200));
$$;

-- -------------------------------------------------------------
-- 5. QUIÉN LO COGE
--
--    Devuelve el identificador de la fila reservada, o nada si ya se lo
--    había quedado otro. "Nada" significa: no lo hagas, no cobres, no
--    escribas. Es lo que hace que dos disparadores a la vez —el de
--    Vercel y el de GitHub— sean inofensivos.
--
--    Y una reserva muerta no bloquea el día entero: si alguien se cayó
--    a mitad, a los quince minutos el trabajo vuelve a estar libre.
-- -------------------------------------------------------------

create or replace function public.reservar_cowork(p_cowork uuid, p_dia date)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  delete from public.cowork_resultados
   where cowork_id = p_cowork
     and dia = p_dia
     and estado = 'ejecutando'
     and creado_el < now() - interval '15 minutes';

  insert into public.cowork_resultados (cowork_id, perfil_id, dia, estado)
  select p_cowork, c.perfil_id, p_dia, 'ejecutando'
    from public.coworks c
   where c.id = p_cowork
  on conflict on constraint cowork_resultados_unico do nothing
  returning id into v_id;

  return v_id;
end;
$$;

-- -------------------------------------------------------------
-- 6. QUÉ PASÓ
-- -------------------------------------------------------------

create or replace function public.terminar_cowork(
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
  v_cowork uuid;
begin
  if p_estado not in ('ok', 'sin_creditos', 'error') then
    raise exception 'Estado no válido: %', p_estado using errcode = '22023';
  end if;

  update public.cowork_resultados
     set estado          = p_estado,
         contenido       = left(coalesce(p_contenido, ''), 40000),
         fuentes         = p_fuentes,
         modelo          = p_modelo,
         conversacion_id = p_conversacion
   where id = p_resultado
  returning cowork_id into v_cowork;

  if v_cowork is not null then
    update public.coworks set ultima_vez = now() where id = v_cowork;
  end if;
end;
$$;

-- -------------------------------------------------------------
-- 7. COBRAR SIN SESIÓN
--
--    `gastar_creditos` lee auth.uid(), y un Co-Work no tiene a nadie
--    delante: lo lanza un reloj. Esta es la misma función, con el mismo
--    bloqueo de fila y el mismo apunte en el historial, pero diciendo
--    de quién se cobra.
--
--    Y por eso mismo NO la puede llamar un usuario: si pudiera, podría
--    vaciarle los créditos a cualquiera. Se revoca a todo el mundo y
--    solo se le da al servidor.
-- -------------------------------------------------------------

create or replace function public.gastar_creditos_de(
  p_perfil   uuid,
  p_cantidad integer,
  p_motivo   text default ''
)
returns table (creditos integer, creditos_extra integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_del_plan  integer;
  v_del_extra integer;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero' using errcode = '22023';
  end if;

  if p_perfil is null then
    raise exception 'Falta el perfil' using errcode = '22023';
  end if;

  select p.creditos, p.creditos_extra
    into v_del_plan, v_del_extra
    from public.perfiles p
   where p.id = p_perfil
     for update;

  if not found then
    raise exception 'Perfil no encontrado' using errcode = 'P0003';
  end if;

  if v_del_plan + v_del_extra < p_cantidad then
    raise exception 'Créditos insuficientes' using errcode = 'P0002';
  end if;

  v_del_plan  := least(v_del_plan, p_cantidad);
  v_del_extra := p_cantidad - v_del_plan;

  update public.perfiles p
     set creditos       = p.creditos - v_del_plan,
         creditos_extra = p.creditos_extra - v_del_extra
   where p.id = p_perfil;

  insert into public.movimientos (perfil_id, tipo, creditos, motivo)
  values (p_perfil, 'gasto', -p_cantidad, coalesce(p_motivo, ''));

  return query
    select p.creditos, p.creditos_extra from public.perfiles p where p.id = p_perfil;
end;
$$;

-- -------------------------------------------------------------
-- 8. UN TOPE POR PERSONA
--    Diez encargos automáticos por cuenta. Cada uno gasta créditos solo
--    todos los días sin que nadie lo mire: el tope es lo que impide que
--    un descuido se convierta en una factura.
-- -------------------------------------------------------------

create or replace function public.limitar_coworks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cuantos integer;
begin
  select count(*) into cuantos from public.coworks where perfil_id = new.perfil_id;

  if cuantos >= 10 then
    raise exception 'Has llegado al máximo de 10 Co-Works.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists coworks_con_tope on public.coworks;
create trigger coworks_con_tope
  before insert on public.coworks
  for each row execute function public.limitar_coworks();

-- -------------------------------------------------------------
-- 9. SEGURIDAD A NIVEL DE FILA
--    Cada uno ve los suyos. Los resultados se leen y se borran, pero no
--    se escriben desde el navegador: los escribe el servidor cuando
--    ejecuta el encargo. Que un usuario pudiera insertar un resultado
--    sería poder decir "esto ya está hecho" y saltarse el candado.
-- -------------------------------------------------------------

alter table public.coworks            enable row level security;
alter table public.cowork_resultados  enable row level security;

drop policy if exists coworks_todo on public.coworks;
create policy coworks_todo on public.coworks
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

drop policy if exists cowork_resultados_mios on public.cowork_resultados;
create policy cowork_resultados_mios on public.cowork_resultados
  for all
  using (perfil_id = public.mi_perfil_id())
  with check (perfil_id = public.mi_perfil_id());

-- -------------------------------------------------------------
-- 10. PERMISOS POR COLUMNA
--     Se puede cambiar el nombre, los temas, la hora, la zona y el
--     interruptor. `perfil_id` no está: un encargo no se puede mover a
--     la cuenta de otro, ni queriendo.
-- -------------------------------------------------------------

-- Se limpia primero y se da después. Supabase arranca con
-- `alter default privileges ... grant all on tables to anon, authenticated`,
-- así que estas dos tablas nacen con TODOS los permisos dados a los dos
-- roles, incluido el UPDATE de la columna `perfil_id`. Sin este revoke,
-- la lista de abajo no limita nada: solo repite algo que ya estaba dado.
revoke all on public.coworks           from anon, authenticated;
revoke all on public.cowork_resultados from anon, authenticated;

grant select, insert, delete on public.coworks to authenticated;
grant update (nombre, temas, hora, zona, activo) on public.coworks to authenticated;

grant select, delete on public.cowork_resultados to authenticated;

-- Las funciones del reparto son del servidor. Un usuario no reserva, no
-- termina y, sobre todo, no cobra.
--
-- Y se le quita a `anon` y a `authenticated` POR SU NOMBRE, no solo a
-- `public`. Es el mismo motivo que arriba: en Supabase las funciones
-- nuevas nacen con EXECUTE dado explícitamente a esos dos roles, y un
-- permiso explícito no se va quitándoselo a `public`. Quitárselo solo a
-- `public` dejaría a cualquiera con sesión llamar a `gastar_creditos_de`
-- con el perfil de otro y vaciarle los créditos. Es lo mismo que hace
-- 0006_pagos.sql con `aplicar_suscripcion`.
revoke all on function public.coworks_pendientes(integer) from public, anon, authenticated;
revoke all on function public.reservar_cowork(uuid, date) from public, anon, authenticated;
revoke all on function public.terminar_cowork(uuid, text, text, jsonb, text, uuid) from public, anon, authenticated;
revoke all on function public.gastar_creditos_de(uuid, integer, text) from public, anon, authenticated;

do $$
begin
  -- En Supabase existe el rol service_role; en una base de datos
  -- cualquiera (una de pruebas, por ejemplo) no tiene por qué.
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.coworks_pendientes(integer) to service_role';
    execute 'grant execute on function public.reservar_cowork(uuid, date) to service_role';
    execute 'grant execute on function public.terminar_cowork(uuid, text, text, jsonb, text, uuid) to service_role';
    execute 'grant execute on function public.gastar_creditos_de(uuid, integer, text) to service_role';
  end if;
end
$$;

-- La hora local sí la puede preguntar cualquiera: no dice nada de nadie.
grant execute on function public.hora_local(text) to authenticated;

-- ▲▲▲ fin de 0009_coworks.sql ▲▲▲

-- ▼▼▼ 0010_vigilante.sql ▼▼▼

-- =============================================================
-- Kairo · El Vigilante
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Un segundo tipo de Co-Work. El primero (brief) trabaja para ti; este
-- trabaja para Kairo: cada día comprueba que todo lo de debajo sigue en
-- pie —que Supabase responde, que no se ha pausado, que no falta ninguna
-- migración ni ninguna clave— y solo te escribe cuando algo va mal.
--
-- Aquí abajo solo hacen falta dos cosas: dejar que el tipo exista, y una
-- función para soltar los trabajos que se quedaron a medias.
-- =============================================================

-- -------------------------------------------------------------
-- 1. EL TIPO NUEVO
--    La columna ya existía con su lista cerrada, que es justo para lo
--    que sirve una lista cerrada: para tener que venir aquí y decidirlo
--    a propósito en vez de que aparezcan tipos sueltos por descuido.
-- -------------------------------------------------------------

alter table public.coworks drop constraint if exists coworks_tipo_check;
alter table public.coworks
  add constraint coworks_tipo_check check (tipo in ('brief', 'salud'));

-- -------------------------------------------------------------
-- 2. SOLTAR LO QUE SE QUEDÓ A MEDIAS
--
--    Cuando un servidor se cae a mitad de un Co-Work, su reserva se
--    queda puesta con estado 'ejecutando'. `reservar_cowork` ya perdona
--    las de hoy a los quince minutos, pero una de hace tres días se
--    queda ahí para siempre, ocupando el día de un trabajo que nunca
--    llegó a hacerse.
--
--    Esto las borra. Es de las poquísimas cosas que el vigilante arregla
--    solo, y puede hacerlo porque no toca nada de nadie: borra una fila
--    que dice "empecé" de un trabajo que nunca terminó.
-- -------------------------------------------------------------

-- Por si ya existía la versión de una sola pieza: se quita antes, o
-- PostgreSQL dejaría las dos conviviendo como dos funciones distintas.
drop function if exists public.soltar_coworks_atascados(integer);

create or replace function public.soltar_coworks_atascados(
  p_horas  integer default 1,
  -- De quién. El vigilante de cada uno suelta lo suyo y nada más:
  -- pudiendo tocarlo todo, tocar solo lo tuyo es la diferencia entre una
  -- reparación y un destrozo. Admite nulo (todos) para poder limpiar a
  -- mano desde el panel si algún día hace falta.
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
begin
  delete from public.cowork_resultados
   where estado = 'ejecutando'
     and creado_el < now() - make_interval(hours => greatest(1, coalesce(p_horas, 1)))
     and (p_perfil is null or perfil_id = p_perfil);

  get diagnostics v_cuantos = row_count;
  return v_cuantos;
end;
$$;

-- Del servidor, como todas las del reparto. Un usuario que pudiera
-- llamarla podría borrar reservas ajenas y provocar trabajo repetido.
revoke all on function public.soltar_coworks_atascados(integer, uuid) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.soltar_coworks_atascados(integer, uuid) to service_role';
  end if;
end
$$;

-- ▲▲▲ fin de 0010_vigilante.sql ▲▲▲

-- ▼▼▼ 0011_coworks_a_mano.sql ▼▼▼

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

-- ▲▲▲ fin de 0011_coworks_a_mano.sql ▲▲▲

-- ▼▼▼ 0012_memoria.sql ▼▼▼

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

-- ▲▲▲ fin de 0012_memoria.sql ▲▲▲
