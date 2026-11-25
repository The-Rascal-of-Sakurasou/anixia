-- Accelerate substring matching for the public catalog without changing search semantics.
create extension if not exists pg_trgm with schema extensions;

create or replace function private.escape_like(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select replace(
    replace(
      replace(coalesce(p_value, ''), chr(92), chr(92) || chr(92)),
      '%', chr(92) || '%'
    ),
    '_', chr(92) || '_'
  );
$$;

create index if not exists anime_search_trgm_idx on public.anime using gin (
  lower(coalesce(title, '')) extensions.gin_trgm_ops,
  lower(coalesce(title_ja, '')) extensions.gin_trgm_ops,
  lower(coalesce(title_kana, '')) extensions.gin_trgm_ops
) where is_published = true;

create index if not exists anime_titles_search_trgm_idx on public.anime_titles using gin (
  lower(title) extensions.gin_trgm_ops
);

create index if not exists people_search_trgm_idx on public.people using gin (
  lower(coalesce(name, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_ja, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_kana, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_en, '')) extensions.gin_trgm_ops,
  lower(coalesce(nickname, '')) extensions.gin_trgm_ops,
  lower(coalesce(nickname_en, '')) extensions.gin_trgm_ops
);

create index if not exists characters_search_trgm_idx on public.characters using gin (
  lower(coalesce(name, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_ja, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_kana, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_en, '')) extensions.gin_trgm_ops,
  lower(coalesce(nickname, '')) extensions.gin_trgm_ops,
  lower(coalesce(nickname_en, '')) extensions.gin_trgm_ops
);

create index if not exists studios_search_trgm_idx on public.studios using gin (
  lower(coalesce(name, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_ja, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_kana, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_en, '')) extensions.gin_trgm_ops
);

create index if not exists organizations_search_trgm_idx on public.organizations using gin (
  lower(coalesce(name, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_ja, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_kana, '')) extensions.gin_trgm_ops,
  lower(coalesce(name_en, '')) extensions.gin_trgm_ops
);

create index if not exists catalog_entity_aliases_search_trgm_idx on public.catalog_entity_aliases using gin (
  lower(alias) extensions.gin_trgm_ops
) where entity_type in ('people', 'characters', 'studios', 'organizations');

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
        or lower(coalesce(a.title, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
        or lower(coalesce(a.title_ja, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
        or lower(coalesce(a.title_kana, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
        or exists (
          select 1
          from public.anime_titles at
          where at.anime_id = a.id
            and lower(at.title) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
        )
        or exists (
          select 1
          from public.anime_staff ast
          join public.people pe on pe.id = ast.person_id
          where ast.anime_id = a.id
            and (
              lower(coalesce(pe.name, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.name_ja, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.name_kana, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.name_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.nickname, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.nickname_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or exists (
                select 1 from public.catalog_entity_aliases cea
                where cea.entity_type = 'people'
                  and cea.entity_id = pe.id
                  and lower(cea.alias) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              )
            )
        )
        or exists (
          select 1
          from public.anime_characters ac
          join public.characters ch on ch.id = ac.character_id
          where ac.anime_id = a.id
            and (
              lower(coalesce(ch.name, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.name_ja, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.name_kana, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.name_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.nickname, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.nickname_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or exists (
                select 1 from public.catalog_entity_aliases cea
                where cea.entity_type = 'characters'
                  and cea.entity_id = ch.id
                  and lower(cea.alias) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              )
            )
        )
        or exists (
          select 1
          from (
            select a.studio_id as studio_id
            where a.studio_id is not null
            union
            select ast.studio_id
            from public.anime_studios ast
            where ast.anime_id = a.id
          ) linked_studios
          join public.studios st on st.id = linked_studios.studio_id
          where (
            lower(coalesce(st.name, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
            or lower(coalesce(st.name_ja, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
            or lower(coalesce(st.name_kana, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
            or lower(coalesce(st.name_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
            or exists (
              select 1 from public.catalog_entity_aliases cea
              where cea.entity_type = 'studios'
                and cea.entity_id = st.id
                and lower(cea.alias) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
            )
          )
        )
        or exists (
          select 1
          from public.anime_organization_staff aos
          join public.organizations org on org.id = aos.organization_id
          where aos.anime_id = a.id
            and (
              lower(coalesce(org.name, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(org.name_ja, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(org.name_kana, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(org.name_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              or exists (
                select 1 from public.catalog_entity_aliases cea
                where cea.entity_type = 'organizations'
                  and cea.entity_id = org.id
                  and lower(cea.alias) LIKE ('%' || private.escape_like(lower(left(trim(p_query), 80))) || '%') ESCAPE chr(92)
              )
            )
        )
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
        or exists (
          select 1
          from public.anime_staff ast
          join public.people pe on pe.id = ast.person_id
          where ast.anime_id = a.id
            and (
              lower(coalesce(pe.name, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_person_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.name_ja, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_person_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.name_kana, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_person_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.name_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_person_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.nickname, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_person_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(pe.nickname_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_person_query), 80))) || '%') ESCAPE chr(92)
              or exists (
                select 1 from public.catalog_entity_aliases cea
                where cea.entity_type = 'people'
                  and cea.entity_id = pe.id
                  and lower(cea.alias) LIKE ('%' || private.escape_like(lower(left(trim(p_person_query), 80))) || '%') ESCAPE chr(92)
              )
            )
        )
      )
      and (
        nullif(trim(coalesce(p_character_query, '')), '') is null
        or exists (
          select 1
          from public.anime_characters ac
          join public.characters ch on ch.id = ac.character_id
          where ac.anime_id = a.id
            and (
              lower(coalesce(ch.name, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_character_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.name_ja, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_character_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.name_kana, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_character_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.name_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_character_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.nickname, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_character_query), 80))) || '%') ESCAPE chr(92)
              or lower(coalesce(ch.nickname_en, '')) LIKE ('%' || private.escape_like(lower(left(trim(p_character_query), 80))) || '%') ESCAPE chr(92)
              or exists (
                select 1 from public.catalog_entity_aliases cea
                where cea.entity_type = 'characters'
                  and cea.entity_id = ch.id
                  and lower(cea.alias) LIKE ('%' || private.escape_like(lower(left(trim(p_character_query), 80))) || '%') ESCAPE chr(92)
              )
            )
        )
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

