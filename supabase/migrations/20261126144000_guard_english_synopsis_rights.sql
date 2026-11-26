-- Apply the same explicit rights gate to Japanese and English synopsis fields.
CREATE OR REPLACE FUNCTION public.enforce_synopsis_source_rights()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  source_is_approved boolean;
BEGIN
  IF (NEW.synopsis IS NULL OR btrim(NEW.synopsis) = '')
     AND (NEW.synopsis_en IS NULL OR btrim(NEW.synopsis_en) = '') THEN
    NEW.synopsis := NULL;
    NEW.synopsis_en := NULL;
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
BEFORE INSERT OR UPDATE OF synopsis, synopsis_en, synopsis_source, synopsis_source_title,
  synopsis_source_url, synopsis_license, synopsis_license_url, synopsis_attribution
ON public.anime
FOR EACH ROW
EXECUTE FUNCTION public.enforce_synopsis_source_rights();
