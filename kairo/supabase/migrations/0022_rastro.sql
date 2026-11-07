-- =============================================================
-- Kairo · Contar lo que pasa, sin contárselo a nadie
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- POR QUÉ
--
-- Kairo no tenía ninguna analítica. Ni Google, ni Plausible, ni nada.
-- Sin esto no se sabe cuánta gente llega, cuánta prueba, cuánta se
-- registra ni por dónde se cae, y cada decisión de producto es una
-- opinión que nadie puede desmentir.
--
-- Lo normal sería enchufar un servicio de fuera. Aquí se cuenta en tu
-- propia base de datos, porque mandar a un tercero por dónde navega la
-- gente que entra en Kairo es justo lo que Kairo promete no hacer.
--
-- Y se cuenta POCO a propósito: qué pasó, en qué página y de qué
-- dominio venía. Sin IP, sin identificador de visitante y sin galleta.
-- Esto cuenta SUCESOS, no personas: no hay forma de seguir a nadie de
-- una página a otra, y por tanto tampoco hay dato personal que pedir
-- permiso para guardar.
-- =============================================================

create table if not exists public.rastro (
  id         bigserial primary key,
  evento     text        not null,
  ruta       text        not null default '/',
  origen     text,
  creado_el  timestamptz not null default now()
);

create index if not exists rastro_creado_el_idx on public.rastro (creado_el desc);
create index if not exists rastro_evento_idx    on public.rastro (evento, creado_el desc);

-- Nadie lee ni escribe esto desde el navegador. Solo el servidor, con su
-- llave de servicio, y tú desde este mismo editor.
alter table public.rastro enable row level security;
revoke all on table public.rastro from anon, authenticated;

-- -------------------------------------------------------------
-- CÓMO MIRARLO
--
-- Pega esto cuando quieras saber cómo va la semana:
--
--   select date_trunc('day', creado_el)::date as dia,
--          count(*) filter (where evento = 'visita')   as visitas,
--          count(*) filter (where evento = 'prueba')   as pruebas,
--          count(*) filter (where evento = 'registro') as registros
--     from public.rastro
--    where creado_el > now() - interval '14 days'
--    group by 1 order by 1 desc;
--
-- Y de dónde viene la gente:
--
--   select coalesce(origen, '(directo)') as de, count(*)
--     from public.rastro
--    where evento = 'visita' and creado_el > now() - interval '30 days'
--    group by 1 order by 2 desc limit 20;
-- -------------------------------------------------------------

-- "Success. No rows returned" significa que está hecho.
