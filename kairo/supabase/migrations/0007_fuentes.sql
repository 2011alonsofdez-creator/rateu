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
