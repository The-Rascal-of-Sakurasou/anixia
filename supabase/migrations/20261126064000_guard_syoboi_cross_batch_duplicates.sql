-- Correct the known Black Jack source-ID collision before enforcing uniqueness.
-- Syoboi TID 520 is the 2004 TV series; TID 3172 is the 1993 OVA.
UPDATE public.anime
SET syobocal_tid = '3172',
    updated_at = now()
WHERE id = 'faf37347-4a84-4c04-be47-b84c34aa0b00'
  AND syobocal_tid = '520'
  AND format = 'ova'
  AND release_year = 1993
  AND episode_count = 12;

-- The source identifier must never be assigned to multiple catalog records.
CREATE UNIQUE INDEX IF NOT EXISTS anime_syobocal_tid_unique_idx
  ON public.anime (syobocal_tid)
  WHERE syobocal_tid IS NOT NULL AND btrim(syobocal_tid) <> '';

-- Resolve candidate titles against the entire published catalog, not just the
-- current pagination batch. This preserves the original cross-catalog
-- ambiguity guard while keeping each Edge Function request bounded.
CREATE OR REPLACE FUNCTION public.get_anime_title_collision_index(
  p_normalized_titles text[]
)
RETURNS TABLE (
  normalized_title text,
  anime_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
  WITH requested AS (
    SELECT DISTINCT
      lower(regexp_replace(normalize(coalesce(input_value, ''), NFKC),
        '[^[:alnum:]]+', '', 'g')) AS match_key
    FROM unnest(coalesce(p_normalized_titles, ARRAY[]::text[])) AS inputs(input_value)
  ),
  all_titles AS (
    SELECT a.id AS anime_id, a.title_ja AS title
    FROM public.anime a
    WHERE a.is_published AND a.title_ja IS NOT NULL

    UNION ALL

    SELECT a.id AS anime_id, a.title AS title
    FROM public.anime a
    WHERE a.is_published AND a.title IS NOT NULL

    UNION ALL

    SELECT t.anime_id, t.title
    FROM public.anime_titles t
    JOIN public.anime a ON a.id = t.anime_id
    WHERE a.is_published
      AND t.language_code = 'ja'
      AND t.title_type IN ('main', 'short', 'synonym')
  ),
  normalized_catalog AS (
    SELECT
      all_titles.anime_id,
      lower(regexp_replace(normalize(coalesce(all_titles.title, ''), NFKC),
        '[^[:alnum:]]+', '', 'g')) AS match_key
    FROM all_titles
  )
  SELECT DISTINCT requested.match_key, normalized_catalog.anime_id
  FROM normalized_catalog
  JOIN requested ON requested.match_key = normalized_catalog.match_key
  WHERE requested.match_key <> '';
$function$;

REVOKE ALL ON FUNCTION public.get_anime_title_collision_index(text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_anime_title_collision_index(text[])
  TO service_role;

COMMENT ON FUNCTION public.get_anime_title_collision_index(text[])
  IS 'Returns every published anime record whose normalized main title or Japanese alias matches any supplied normalized title. Restricted to service_role for safe cross-batch catalog matching.';
