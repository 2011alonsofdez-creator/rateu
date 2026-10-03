-- =============================================================
-- Kairo · Recibir los Co-Works en Telegram
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Una sola columna. El brief de la mañana se escribía a las 7:05 y se
-- quedaba dentro de la web esperando a que entraras a leerlo; con esto
-- te llega al móvil cuando se escribe.
-- =============================================================

alter table public.perfiles
  add column if not exists telegram_chat_id text;

-- Un identificador de conversación de Telegram es un número, a veces
-- negativo (los grupos). Nada más largo que eso tiene sentido aquí.
alter table public.perfiles drop constraint if exists perfiles_telegram_check;
alter table public.perfiles
  add constraint perfiles_telegram_check
  check (telegram_chat_id is null or telegram_chat_id ~ '^-?[0-9]{1,20}$');

/* Y el permiso para tocar SOLO esa columna.
 *
 * `perfiles` lleva dentro el plan y los créditos, así que el permiso de
 * escritura va columna por columna desde el primer día: sin esto, dar
 * permiso para enlazar Telegram sería dar permiso para regalarse
 * créditos. La seguridad por filas dice de quién es cada fila; esto dice
 * qué se puede cambiar de ella. */
grant update (telegram_chat_id) on public.perfiles to authenticated;

-- =============================================================
-- Listo. Si no da error, Ajustes → «Recibir en Telegram» ya funciona.
-- =============================================================
