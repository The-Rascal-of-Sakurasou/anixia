-- Convert correlated catalog filters into reusable candidate-ID sets.
create or replace function private.match_anime_global(p_query text)
returns setof uuid language sql stable set search_path=''
as $$
  select ax.id from public.anime ax
  where ax.is_published=true and (
    strpos(lower(coalesce(ax.title,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ax.title_ja,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ax.title_kana,'')),lower(left(trim(p_query),80)))>0
  )
  union
  select at.anime_id from public.anime_titles at
  join public.anime ax on ax.id=at.anime_id and ax.is_published=true
  where strpos(lower(at.title),lower(left(trim(p_query),80)))>0
  union
  select ast.anime_id from public.anime_staff ast
  join public.people pe on pe.id=ast.person_id
  where (
    strpos(lower(coalesce(pe.name,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.name_ja,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.name_kana,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.name_en,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.nickname,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.nickname_en,'')),lower(left(trim(p_query),80)))>0
    or exists(select 1 from public.catalog_entity_aliases cea where cea.entity_type='people' and cea.entity_id=pe.id and strpos(lower(cea.alias),lower(left(trim(p_query),80)))>0)
  )
  union
  select ac.anime_id from public.anime_characters ac
  join public.characters ch on ch.id=ac.character_id
  where (
    strpos(lower(coalesce(ch.name,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.name_ja,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.name_kana,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.name_en,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.nickname,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.nickname_en,'')),lower(left(trim(p_query),80)))>0
    or exists(select 1 from public.catalog_entity_aliases cea where cea.entity_type='characters' and cea.entity_id=ch.id and strpos(lower(cea.alias),lower(left(trim(p_query),80)))>0)
  )
  union
  select linked.anime_id from (
    select ax2.id as anime_id,ax2.studio_id from public.anime ax2 where ax2.studio_id is not null
    union
    select ast.anime_id,ast.studio_id from public.anime_studios ast
  ) linked join public.studios st on st.id=linked.studio_id
  where (
    strpos(lower(coalesce(st.name,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(st.name_ja,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(st.name_kana,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(st.name_en,'')),lower(left(trim(p_query),80)))>0
    or exists(select 1 from public.catalog_entity_aliases cea where cea.entity_type='studios' and cea.entity_id=st.id and strpos(lower(cea.alias),lower(left(trim(p_query),80)))>0)
  )
  union
  select aos.anime_id from public.anime_organization_staff aos
  join public.organizations org on org.id=aos.organization_id
  where (
    strpos(lower(coalesce(org.name,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(org.name_ja,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(org.name_kana,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(org.name_en,'')),lower(left(trim(p_query),80)))>0
    or exists(select 1 from public.catalog_entity_aliases cea where cea.entity_type='organizations' and cea.entity_id=org.id and strpos(lower(cea.alias),lower(left(trim(p_query),80)))>0)
  );
$$;

create or replace function private.match_anime_people(p_query text)
returns setof uuid language sql stable set search_path=''
as $$
  select ast.anime_id from public.anime_staff ast
  join public.people pe on pe.id=ast.person_id
  where (
    strpos(lower(coalesce(pe.name,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.name_ja,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.name_kana,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.name_en,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.nickname,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(pe.nickname_en,'')),lower(left(trim(p_query),80)))>0
    or exists(select 1 from public.catalog_entity_aliases cea where cea.entity_type='people' and cea.entity_id=pe.id and strpos(lower(cea.alias),lower(left(trim(p_query),80)))>0)
  );
$$;

create or replace function private.match_anime_characters(p_query text)
returns setof uuid language sql stable set search_path=''
as $$
  select ac.anime_id from public.anime_characters ac
  join public.characters ch on ch.id=ac.character_id
  where (
    strpos(lower(coalesce(ch.name,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.name_ja,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.name_kana,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.name_en,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.nickname,'')),lower(left(trim(p_query),80)))>0
    or strpos(lower(coalesce(ch.nickname_en,'')),lower(left(trim(p_query),80)))>0
    or exists(select 1 from public.catalog_entity_aliases cea where cea.entity_type='characters' and cea.entity_id=ch.id and strpos(lower(cea.alias),lower(left(trim(p_query),80)))>0)
  );
$$;

revoke all on function private.match_anime_global(text) from public, anon, authenticated;
revoke all on function private.match_anime_people(text) from public, anon, authenticated;
revoke all on function private.match_anime_characters(text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_public_anime(p_query text, p_genre_id uuid, p_year integer, p_season text, p_format anime_format, p_studio_id uuid, p_sort text, p_limit integer, p_offset integer, p_tag_ids uuid[], p_person_query text, p_character_query text)
 RETURNS TABLE(id uuid, title text, title_ja text, title_kana text, synopsis text, format anime_format, release_year integer, season text, episode_count integer, poster_url text, watchers_count integer, reviews_count integer, studio_id uuid, average_score numeric, rating_count bigint, total_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with rating_summary as (
    select r.anime_id,
      round(avg(r.score)::numeric, 2) as average_score,
      count(*)::bigint as rating_count
    from public.ratings r
    join public.profiles rp
      on rp.id = r.user_id
     and rp.is_public = true
     and rp.show_ratings = true
    group by r.anime_id
  ),
  filtered as (
    select
      a.id, a.title, a.title_ja, a.title_kana, a.synopsis, a.format,
      a.release_year, a.created_at, a.season, a.episode_count, a.poster_url,
      a.watchers_count, a.reviews_count, a.studio_id,
      rs.average_score, coalesce(rs.rating_count, 0)::bigint as rating_count,
      count(*) over()::bigint as total_count
    from public.anime a
    left join rating_summary rs on rs.anime_id = a.id
    where a.is_published = true
      and (
        nullif(trim(coalesce(p_query, '')), '') is null
        or a.id in (select private.match_anime_global(p_query))
      )
      and (
        p_genre_id is null
        or exists (
          select 1 from public.anime_genres ag
          where ag.anime_id = a.id and ag.genre_id = p_genre_id
        )
      )
      and (
        cardinality(coalesce(p_tag_ids, array[]::uuid[])) = 0
        or exists (
          select 1 from public.anime_tags atg
          where atg.anime_id = a.id
            and atg.tag_id = any((coalesce(p_tag_ids, array[]::uuid[]))[1:30])
        )
      )
      and (p_year is null or a.release_year = p_year)
      and (p_season is null or a.season = p_season)
      and (p_format is null or a.format = p_format)
      and (
        p_studio_id is null
        or a.studio_id = p_studio_id
        or exists (
          select 1 from public.anime_studios ast
          where ast.anime_id = a.id and ast.studio_id = p_studio_id
        )
      )
      and (
        nullif(trim(coalesce(p_person_query, '')), '') is null
        or a.id in (select private.match_anime_people(p_person_query))
      )
      and (
        nullif(trim(coalesce(p_character_query, '')), '') is null
        or a.id in (select private.match_anime_characters(p_character_query))
      )
      and (coalesce(p_sort, 'newest') <> 'rating' or coalesce(rs.rating_count, 0) >= 5)
  )
  select
    f.id, f.title, f.title_ja, f.title_kana, f.synopsis, f.format,
    f.release_year, f.season, f.episode_count, f.poster_url,
    f.watchers_count, f.reviews_count, f.studio_id, f.average_score,
    f.rating_count, f.total_count
  from filtered f
  order by
    case when p_sort = 'rating' then f.average_score end desc nulls last,
    case when p_sort = 'popular' then coalesce(f.watchers_count, 0) end desc nulls last,
    case when p_sort = 'reviews' then coalesce(f.reviews_count, 0) end desc nulls last,
    case when p_sort = 'title' then lower(coalesce(f.title_ja, f.title)) end asc nulls last,
    case when p_sort = 'newest' or p_sort is null then f.created_at end desc nulls last,
    f.title asc
  limit least(greatest(coalesce(p_limit, 24), 1), 50)
  offset least(greatest(coalesce(p_offset, 0), 0), 10000);
$function$
;
