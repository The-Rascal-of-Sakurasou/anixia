-- ANIXIA catalog quality audit
-- Read-only report. Run in the Supabase SQL Editor.
-- No data is modified by any query in this file.

-- 1. Overall catalog coverage.
select
  count(*) as total_works,
  count(*) filter (where is_published) as published_works,
  count(*) filter (where not is_published) as unpublished_works,
  count(*) filter (where is_published and nullif(btrim(poster_url), '') is null) as published_missing_poster,
  count(*) filter (where is_published and nullif(btrim(synopsis), '') is null) as published_missing_synopsis,
  count(*) filter (where is_published and release_year is null) as published_missing_year,
  count(*) filter (where is_published and nullif(btrim(title_ja), '') is null) as published_missing_japanese_title,
  count(*) filter (where is_published and nullif(btrim(title_kana), '') is null) as published_missing_kana,
  count(*) filter (
    where is_published and episode_count is null and episodes_count is null
      and coalesce(no_episodes, false) = false
  ) as published_missing_episode_count
from public.anime;

-- 2. Poster pipeline progress: untouched vs completed no-match attempts.
select
  is_published,
  count(*) as works,
  count(*) filter (where nullif(btrim(poster_url), '') is not null) as with_poster,
  count(*) filter (where nullif(btrim(poster_url), '') is null) as missing_poster,
  count(*) filter (
    where nullif(btrim(poster_url), '') is null and poster_attempted_at is null
  ) as not_attempted,
  count(*) filter (
    where nullif(btrim(poster_url), '') is null and poster_attempted_at is not null
  ) as attempted_without_match,
  max(poster_attempted_at) as latest_attempt,
  max(poster_synced_at) as latest_success
from public.anime
group by is_published
order by is_published desc;

-- 3. Missing posters by source and format, including external-ID coverage.
select
  coalesce(a.source, '(unknown)') as record_source,
  a.format,
  count(*) as missing_posters,
  count(*) filter (where exists (
    select 1 from public.anime_external_ids x
    where x.anime_id = a.id and x.source = 'anilist'
  )) as with_anilist_id,
  count(*) filter (where exists (
    select 1 from public.anime_external_ids x
    where x.anime_id = a.id and x.source = 'myanimelist'
  )) as with_mal_id,
  count(*) filter (where a.poster_attempted_at is null) as not_attempted,
  count(*) filter (where a.poster_attempted_at is not null) as attempted_without_match
from public.anime a
where a.is_published = true and nullif(btrim(a.poster_url), '') is null
group by a.source, a.format
order by missing_posters desc;

-- 4. Attribution and license completeness for attached images.
select
  count(*) filter (where is_published and nullif(btrim(poster_url), '') is not null) as published_with_poster,
  count(*) filter (
    where is_published and nullif(btrim(poster_url), '') is not null
      and nullif(btrim(poster_attribution), '') is null
  ) as missing_attribution,
  count(*) filter (
    where is_published and nullif(btrim(poster_url), '') is not null
      and nullif(btrim(poster_license), '') is null
  ) as missing_license,
  count(*) filter (
    where is_published and nullif(btrim(poster_url), '') is not null
      and nullif(btrim(poster_source_url), '') is null
  ) as missing_source_url
from public.anime;

-- 5. Actual published episode rows, distinct from the anime episode-count field.
select
  a.is_published,
  count(distinct a.id) as works,
  count(distinct a.id) filter (where e.episode_total > 0) as works_with_published_episodes,
  coalesce(sum(e.episode_total), 0) as published_episode_rows
from public.anime a
left join (
  select anime_id, count(*) filter (where is_published) as episode_total
  from public.episodes
  group by anime_id
) e on e.anime_id = a.id
group by a.is_published
order by a.is_published desc;
