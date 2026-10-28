-- =============================================================
-- Kairo · Team
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- "Contratar a alguien" en la pantalla de Team llevaba desde el
-- principio contestando "aún no". Esto es lo único que le faltaba por
-- debajo, y es poco a propósito: un miembro del Team no es una pieza
-- nueva, es un Co-Work cuyo encargo lo escribe su dueño en vez de
-- nosotros. Así hereda sin tocar nada el reloj, la reserva para que no
-- se ejecute dos veces, el cobro de créditos, el tope de diez por
-- cuenta, el aviso cuando falla y el historial.
--
-- Por eso aquí abajo solo hay que dejar que el tipo exista. La lista
-- está cerrada justo para esto: para tener que venir y decidirlo a
-- propósito, en vez de que aparezcan tipos sueltos por descuido.
--
-- OJO CON EL ORDEN: TODO_DE_UNA_VEZ.sql es un paquete viejo (va de la
-- 0003 a la 0012) y trae su propia lista de tipos, sin 'encargo'. Si
-- alguna vez lo vuelves a pegar DESPUÉS de esto, se lleva por delante
-- lo de aquí y Team deja de poder contratar. Entonces se arregla
-- volviendo a pegar este archivo.
-- =============================================================

alter table public.coworks drop constraint if exists coworks_tipo_check;
alter table public.coworks
  add constraint coworks_tipo_check
  check (tipo in ('brief', 'salud', 'repaso', 'precio', 'idioma', 'encargo'));

-- Y nada más. Si esto te devuelve "Success. No rows returned", está
-- hecho: ya puedes contratar en Team.
