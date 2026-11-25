-- Fast paths for the homepage and frequently traversed catalog relations.
-- Public RPCs expose only published catalog rows and aggregate count, never raw private candidates.

create index if not exists anime_published_created_at_idx
  on public.anime (created_at desc, id desc)
  where is_published = true;

create index if not exists anime_studio_id_idx
  on public.anime (studio_id)
  where studio_id is not null;

create index if not exists anime_staff_character_id_idx
  on public.anime_staff (character_id)
  where character_id is not null;

create index if not exists characters_series_id_idx
  on public.characters (series_id)
  where series_id is not null;

create or replace function public.get_public_anime_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from public.anime
  where is_published = true;
$$;

revoke all on function public.get_public_anime_count() from public;
grant execute on function public.get_public_anime_count() to anon, authenticated;

create or replace function public.get_latest_public_anime(p_limit integer default 5)
returns table (
  id uuid,
  title text,
  title_ja text,
  title_kana text,
  format public.anime_format,
  release_year integer,
  poster_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.title, a.title_ja, a.title_kana, a.format, a.release_year, a.poster_url
  from public.anime a
  where a.is_published = true
  order by a.created_at desc, a.id desc
  limit least(greatest(coalesce(p_limit, 5), 1), 20);
$$;

revoke all on function public.get_latest_public_anime(integer) from public;
grant execute on function public.get_latest_public_anime(integer) to anon, authenticated;
