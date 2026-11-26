-- Merge exact case-only duplicate genre masters into their canonical display-name rows.
-- This preserves anime links and source identifiers; conflicting anime/genre pairs are ignored.
BEGIN;

CREATE TEMP TABLE _anixia_genre_merge_map ON COMMIT DROP AS
SELECT duplicate.id AS duplicate_id, canonical.id AS canonical_id
FROM public.genres AS duplicate
JOIN public.genres AS canonical
  ON lower(btrim(canonical.name)) = lower(btrim(duplicate.name))
 AND canonical.name = initcap(btrim(duplicate.name))
 AND canonical.id <> duplicate.id
WHERE duplicate.name <> canonical.name;

INSERT INTO public.anime_genres (anime_id, genre_id)
SELECT links.anime_id, merge_map.canonical_id
FROM public.anime_genres AS links
JOIN _anixia_genre_merge_map AS merge_map
  ON merge_map.duplicate_id = links.genre_id
ON CONFLICT (anime_id, genre_id) DO NOTHING;

UPDATE public.genre_external_ids AS external_ids
SET genre_id = merge_map.canonical_id
FROM _anixia_genre_merge_map AS merge_map
WHERE external_ids.genre_id = merge_map.duplicate_id;

DELETE FROM public.anime_genres AS links
USING _anixia_genre_merge_map AS merge_map
WHERE links.genre_id = merge_map.duplicate_id;

DELETE FROM public.genres AS genres
USING _anixia_genre_merge_map AS merge_map
WHERE genres.id = merge_map.duplicate_id;

COMMIT;
