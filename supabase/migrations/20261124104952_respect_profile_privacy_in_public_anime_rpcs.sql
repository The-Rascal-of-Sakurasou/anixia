-- Keep public anime RPCs aligned with profile-level privacy settings.
-- The migration is safe to replay: it patches only when the visibility filters
-- are missing, and raises if the expected source fragments have changed.

DO $anixia_privacy_fix$
DECLARE
  v_definition text;
  v_updated text;
BEGIN
  SELECT pg_get_functiondef('public.get_public_anime_detail(uuid)'::regprocedure)
    INTO v_definition;

  IF position('rp.is_public = true' in v_definition) = 0
     OR position('rp.show_reviews = true' in v_definition) = 0 THEN
    v_updated := replace(
      v_definition,
      'where rv.anime_id = a.id and rv.is_published = true',
      E'where rv.anime_id = a.id and rv.is_published = true\n        and exists (\n          select 1\n          from public.profiles rp\n          where rp.id = rv.user_id\n            and rp.is_public = true\n            and rp.show_reviews = true\n        )'
    );
    IF v_updated = v_definition THEN
      RAISE EXCEPTION 'Could not safely patch get_public_anime_detail(uuid): expected review filter not found';
    END IF;
    EXECUTE v_updated;
  END IF;

  SELECT pg_get_functiondef(
    'public.search_public_anime(text,uuid,integer,text,public.anime_format,uuid,text,integer,integer,uuid[],text,text)'::regprocedure
  ) INTO v_definition;

  IF position('rp.is_public = true' in v_definition) = 0
     OR position('rp.show_ratings = true' in v_definition) = 0 THEN
    v_updated := replace(
      v_definition,
      E'from public.ratings r\n    group by r.anime_id',
      E'from public.ratings r\n    join public.profiles rp\n      on rp.id = r.user_id\n     and rp.is_public = true\n     and rp.show_ratings = true\n    group by r.anime_id'
    );
    IF v_updated = v_definition THEN
      RAISE EXCEPTION 'Could not safely patch search_public_anime(...12 args): expected rating aggregation not found';
    END IF;
    EXECUTE v_updated;
  END IF;
END
$anixia_privacy_fix$;
