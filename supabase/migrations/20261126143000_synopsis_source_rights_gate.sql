-- Require explicit rights approval before storing any synopsis text.
-- Prime Video is registered as a link/reference candidate only; text import stays disabled.

ALTER TABLE public.catalog_sources
  ADD COLUMN IF NOT EXISTS synopsis_import_allowed boolean NOT NULL DEFAULT false;

INSERT INTO public.catalog_sources
  (code, display_name, website_url, api_docs_url, terms_url,
   rights_review_status, rights_notes, is_enabled, synopsis_import_allowed)
VALUES
  ('prime_video_jp', 'Prime Video Japan', 'https://www.primevideo.com/',
   NULL, NULL, 'pending',
   '候補情報源。作品ページへのリンク参照のみ。利用規約・著作権上の再利用許諾が確認できるまで、あらすじ本文の取得・保存・転載は禁止。',
   false, false)
ON CONFLICT (code) DO UPDATE
SET display_name = EXCLUDED.display_name,
    website_url = EXCLUDED.website_url,
    rights_review_status = 'pending',
    rights_notes = EXCLUDED.rights_notes,
    is_enabled = false,
    synopsis_import_allowed = false,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.enforce_synopsis_source_rights()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  source_is_approved boolean;
BEGIN
  IF NEW.synopsis IS NULL OR btrim(NEW.synopsis) = '' THEN
    NEW.synopsis := NULL;
    NEW.synopsis_source := NULL;
    NEW.synopsis_source_title := NULL;
    NEW.synopsis_source_url := NULL;
    NEW.synopsis_source_revision_id := NULL;
    NEW.synopsis_source_revision_url := NULL;
    NEW.synopsis_license := NULL;
    NEW.synopsis_license_url := NULL;
    NEW.synopsis_attribution := NULL;
    NEW.synopsis_synced_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.synopsis_source IS NULL OR NEW.synopsis_source = 'anixia_original' THEN
    RAISE EXCEPTION 'Synopsis text requires an approved external source; ANIXIA-authored synopses are disabled.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT (cs.is_enabled AND cs.rights_review_status = 'approved'
          AND cs.synopsis_import_allowed)
    INTO source_is_approved
  FROM public.catalog_sources AS cs
  WHERE cs.code = NEW.synopsis_source;

  IF COALESCE(source_is_approved, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Synopsis import is blocked: source % is not approved for synopsis reuse.', NEW.synopsis_source
      USING ERRCODE = 'check_violation';
  END IF;

  IF NULLIF(btrim(NEW.synopsis_source_title), '') IS NULL
     OR NULLIF(btrim(NEW.synopsis_source_url), '') IS NULL
     OR NULLIF(btrim(NEW.synopsis_license), '') IS NULL
     OR NULLIF(btrim(NEW.synopsis_license_url), '') IS NULL
     OR NULLIF(btrim(NEW.synopsis_attribution), '') IS NULL THEN
    RAISE EXCEPTION 'Synopsis provenance is incomplete; source title, source URL, license, license URL, and attribution are required.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS anime_synopsis_source_rights_guard ON public.anime;
CREATE TRIGGER anime_synopsis_source_rights_guard
BEFORE INSERT OR UPDATE OF synopsis, synopsis_source, synopsis_source_title,
  synopsis_source_url, synopsis_license, synopsis_license_url, synopsis_attribution
ON public.anime
FOR EACH ROW
EXECUTE FUNCTION public.enforce_synopsis_source_rights();

COMMENT ON COLUMN public.catalog_sources.synopsis_import_allowed IS
  'True only after explicit rights review confirms that synopsis text may be stored and reused by ANIXIA. Defaults to false.';
