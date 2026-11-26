create table if not exists public.anime_source_references (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references public.anime(id) on delete cascade,
  source_code text not null references public.catalog_sources(code) on update cascade on delete restrict,
  resource_type text not null check (resource_type in ('official_page','streaming_page','metadata_page','image_page','license_page')),
  source_url text not null check (source_url ~ '^https://'),
  external_id text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  rights_status text not null default 'pending' check (rights_status in ('pending','approved','restricted','rejected','unknown')),
  permitted_use text not null default 'link_only' check (permitted_use in ('link_only','metadata','image','synopsis','none','unknown')),
  notes text,
  discovered_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (anime_id, source_code, resource_type, source_url)
);

create index if not exists anime_source_references_anime_idx
  on public.anime_source_references (anime_id, resource_type);
create index if not exists anime_source_references_source_status_idx
  on public.anime_source_references (source_code, verification_status, rights_status);

alter table public.anime_source_references enable row level security;
revoke all on table public.anime_source_references from public, anon;
grant select, insert, update, delete on table public.anime_source_references to authenticated;

drop policy if exists "ANIXIA admins manage anime source references" on public.anime_source_references;
create policy "ANIXIA admins manage anime source references"
  on public.anime_source_references
  for all
  to authenticated
  using (private.is_anixia_admin())
  with check (private.is_anixia_admin());

insert into public.catalog_sources
  (code, display_name, website_url, rights_review_status, rights_notes, is_enabled, synopsis_import_allowed)
values
  ('netflix_jp', 'Netflix Japan', 'https://www.netflix.com/jp/', 'pending',
   '参照先候補。作品ページへのリンク参照のみを想定。利用規約・著作権上の再利用許諾を確認するまで、本文・画像の取得や保存は禁止。', false, false),
  ('crunchyroll', 'Crunchyroll', 'https://www.crunchyroll.com/', 'pending',
   '参照先候補。作品ページへのリンク参照のみを想定。利用規約・著作権上の再利用許諾を確認するまで、本文・画像の取得や保存は禁止。', false, false),
  ('hidive', 'HIDIVE', 'https://www.hidive.com/', 'pending',
   '参照先候補。作品ページへのリンク参照のみを想定。利用規約・著作権上の再利用許諾を確認するまで、本文・画像の取得や保存は禁止。', false, false),
  ('kitsu', 'Kitsu', 'https://kitsu.app/', 'pending',
   'API・データ利用条件の個別審査が未完了。許可範囲が確認できるまで自動取得・保存を無効化。', false, false),
  ('anidb', 'AniDB', 'https://anidb.net/', 'pending',
   'API・データセットの利用条件と再配布条件の個別審査が未完了。許可範囲が確認できるまで自動取得・保存を無効化。', false, false),
  ('myanimelist', 'MyAnimeList', 'https://myanimelist.net/', 'pending',
   '公式APIの利用条件・APIキー要件・保存および再配布条件の確認が未完了。許可範囲が確認できるまで自動取得・保存を無効化。', false, false),
  ('animenewsnetwork', 'Anime News Network', 'https://www.animenewsnetwork.com/', 'pending',
   'APIの利用条件・取得可能項目・保存および再配布条件の確認が未完了。許可範囲が確認できるまで自動取得・保存を無効化。', false, false),
  ('tvmaze', 'TVmaze', 'https://www.tvmaze.com/', 'pending',
   'API・画像の利用条件および表示義務の個別審査が未完了。許可範囲が確認できるまで自動取得・保存を無効化。', false, false),
  ('anime_offline_database', 'Anime Offline Database (community continuation)', 'https://github.com/cedya77/anime-offline-database', 'pending',
   'ODbL 1.0 / DbCL 1.0を掲示するコミュニティ継続版の候補。継承元・更新状況・帰属表示・派生データベースの公開義務・個別提供元データの権利を確認するまで自動取り込みは無効。', false, false)
on conflict (code) do update set
  display_name = excluded.display_name,
  website_url = excluded.website_url,
  rights_notes = coalesce(public.catalog_sources.rights_notes, excluded.rights_notes),
  updated_at = now();
