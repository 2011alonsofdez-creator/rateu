-- =============================================================
-- Kairo · Que un encargo pueda buscar
-- Pegar entero en Supabase → SQL Editor → Run.
-- Es idempotente: puedes ejecutarlo dos veces sin romper nada.
--
-- Los cuatro tipos que escribimos nosotros tienen decidido de fábrica
-- si buscan: el resumen de temas sí, el repaso no. Un encargo tuyo no
-- se puede decidir desde aquí, porque puede ser cualquier cosa.
--
-- Y hace falta de verdad: el primer Abogado que se ejecutó acabó
-- diciendo "compruébalo en el BOE", que es exactamente lo que habría
-- hecho una búsqueda. Pero poner que busquen todos sería cobrar unos
-- céntimos de más cada día a los que no lo necesitan —el que escribe
-- mensajes de seguimiento no tiene nada que buscar—, así que se
-- pregunta una vez y se guarda.
--
-- Por defecto NO busca: es lo que ya hacían los encargos que existen,
-- o sea que esto no cambia el comportamiento de nada que ya esté
-- creado ni empieza a gastar sin avisar.
-- =============================================================

alter table public.coworks
  add column if not exists busca boolean not null default false;

-- Y nada más. Si esto te devuelve "Success. No rows returned", está
-- hecho: al crear o editar un encargo verás el interruptor.
