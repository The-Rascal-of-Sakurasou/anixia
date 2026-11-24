-- Remove a redundant unique index.
-- public.anime_source_source_id_key is the unique constraint-backed index
-- on (source, source_id); this duplicate index had the same definition and
-- no associated constraint.
DROP INDEX IF EXISTS public.anime_source_source_id_upsert_key;
