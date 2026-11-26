-- Keep source classifications for provenance while hiding clear media-format
-- and production-format classes from the public genre taxonomy.
BEGIN;

ALTER TABLE public.genres
  ADD COLUMN IF NOT EXISTS is_filterable boolean NOT NULL DEFAULT true;

UPDATE public.genres
SET is_filterable = false
WHERE
  name ~* '(television|tv series|tv program|video game|web series)'
  OR lower(btrim(name)) IN (
    'animated series',
    'anime television program',
    'animated film with lgbt character(s)',
    'compilation film',
    'computer-animated film',
    'computer animation',
    'film and series for children',
    'brickfilm',
    'short',
    'anime/manga style',
    'music program',
    'game show',
    'talk show',
    'public service announcement',
    'generative ai art'
  );

COMMENT ON COLUMN public.genres.is_filterable IS
  'Whether this classification is shown in public genre browsing and genre selectors. False preserves source metadata but hides non-genre media/production formats.';

COMMIT;
