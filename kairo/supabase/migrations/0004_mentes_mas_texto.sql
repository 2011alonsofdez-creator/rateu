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
