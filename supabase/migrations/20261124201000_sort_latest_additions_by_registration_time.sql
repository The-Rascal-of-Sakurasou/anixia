-- Show recently registered works on the ANIXIA home page.
-- "newest" must use registration time, not the anime's original release year.
do $$
declare
  v_signature regprocedure := 'public.search_public_anime(text,uuid,integer,text,anime_format,uuid,text,integer,integer,uuid[],text,text)'::regprocedure;
  v_definition text;
begin
  v_definition := pg_get_functiondef(v_signature);

  if position('a.created_at' in v_definition) = 0 then
    v_definition := replace(
      v_definition,
      'a.release_year, a.season, a.episode_count, a.poster_url,',
      'a.release_year, a.created_at, a.season, a.episode_count, a.poster_url,'
    );
  end if;

  if position('f.created_at end desc nulls last' in v_definition) = 0 then
    v_definition := replace(
      v_definition,
      'case when p_sort = ''newest'' or p_sort is null then coalesce(f.release_year, 0) end desc nulls last,',
      'case when p_sort = ''newest'' or p_sort is null then f.created_at end desc nulls last,'
    );
  end if;

  if position('a.created_at' in v_definition) = 0
     or position('f.created_at end desc nulls last' in v_definition) = 0 then
    raise exception 'Could not safely patch search_public_anime newest ordering';
  end if;

  execute v_definition;
end $$;
