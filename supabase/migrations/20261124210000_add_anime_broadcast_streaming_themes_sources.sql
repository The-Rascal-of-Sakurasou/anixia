-- Add structured broadcast, streaming, theme-song, and source-material metadata.
-- Additive only: existing anime rows and current catalog queries remain unchanged.

create table if not exists public.anime_broadcast_schedules (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references public.anime(id) on delete cascade,
  broadcast_type text not null default 'terrestrial',
  broadcaster_name text not null,
  weekday smallint,
  start_time time,
  timezone text not null default 'Asia/Tokyo',
  starts_on date,
  ends_on date,
  schedule_note text,
  source text,
  source_record_id text,
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_broadcast_type_chk check (broadcast_type in ('terrestrial','bs','cs','cable','streaming','theater','other')),
  constraint anime_broadcast_weekday_chk check (weekday is null or weekday between 0 and 6),
  constraint anime_broadcast_name_nonempty_chk check (length(btrim(broadcaster_name)) > 0),
  constraint anime_broadcast_date_range_chk check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table if not exists public.anime_streaming_services (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references public.anime(id) on delete cascade,
  service_name text not null,
  service_url text,
  availability_type text not null default 'subscription',
  region_code text not null default 'JP',
  available_from date,
  available_until date,
  availability_note text,
  source text,
  source_record_id text,
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_streaming_type_chk check (availability_type in ('subscription','free','rental','purchase','limited_free','other')),
  constraint anime_streaming_name_nonempty_chk check (length(btrim(service_name)) > 0),
  constraint anime_streaming_region_chk check (region_code ~ '^[A-Z]{2}$'),
  constraint anime_streaming_date_range_chk check (available_until is null or available_from is null or available_until >= available_from)
);

create table if not exists public.anime_theme_songs (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references public.anime(id) on delete cascade,
  theme_type text not null,
  sequence_number smallint not null default 1,
  song_title text not null,
  artist_name text,
  episode_range text,
  lyricist text,
  composer text,
  arranger text,
  source text,
  source_record_id text,
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_theme_type_chk check (theme_type in ('opening','ending','insert')),
  constraint anime_theme_sequence_chk check (sequence_number > 0),
  constraint anime_theme_title_nonempty_chk check (length(btrim(song_title)) > 0)
);

create table if not exists public.anime_source_materials (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references public.anime(id) on delete cascade,
  medium text not null,
  title text not null,
  authors text[],
  publisher_name text,
  imprint_name text,
  source_url text,
  is_primary boolean not null default false,
  notes text,
  source text,
  source_record_id text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anime_source_medium_chk check (medium in ('manga','light_novel','novel','game','visual_novel','web_novel','original','other')),
  constraint anime_source_title_nonempty_chk check (length(btrim(title)) > 0)
);

create index if not exists anime_broadcast_anime_date_idx
  on public.anime_broadcast_schedules (anime_id, starts_on, weekday);
create index if not exists anime_broadcast_broadcaster_idx
  on public.anime_broadcast_schedules (lower(broadcaster_name));
create unique index if not exists anime_broadcast_source_record_uidx
  on public.anime_broadcast_schedules (source, source_record_id)
  where source is not null and source_record_id is not null;

create index if not exists anime_streaming_anime_region_idx
  on public.anime_streaming_services (anime_id, region_code, available_from);
create index if not exists anime_streaming_service_name_idx
  on public.anime_streaming_services (lower(service_name));
create unique index if not exists anime_streaming_source_record_uidx
  on public.anime_streaming_services (source, source_record_id)
  where source is not null and source_record_id is not null;

create index if not exists anime_theme_anime_type_idx
  on public.anime_theme_songs (anime_id, theme_type, sequence_number);
create index if not exists anime_theme_song_title_idx
  on public.anime_theme_songs (lower(song_title));
create unique index if not exists anime_theme_source_record_uidx
  on public.anime_theme_songs (source, source_record_id)
  where source is not null and source_record_id is not null;

create index if not exists anime_source_material_anime_idx
  on public.anime_source_materials (anime_id, is_primary desc);
create index if not exists anime_source_material_title_idx
  on public.anime_source_materials (lower(title));
create unique index if not exists anime_source_material_source_record_uidx
  on public.anime_source_materials (source, source_record_id)
  where source is not null and source_record_id is not null;

alter table public.anime_broadcast_schedules enable row level security;
alter table public.anime_streaming_services enable row level security;
alter table public.anime_theme_songs enable row level security;
alter table public.anime_source_materials enable row level security;

create policy "Broadcast schedules of published anime are readable"
  on public.anime_broadcast_schedules for select to anon, authenticated
  using (private.is_published_anime(anime_id));
create policy "ANIXIA admins manage anime broadcast schedules"
  on public.anime_broadcast_schedules for all to authenticated
  using (private.is_anixia_admin()) with check (private.is_anixia_admin());

create policy "Streaming services of published anime are readable"
  on public.anime_streaming_services for select to anon, authenticated
  using (private.is_published_anime(anime_id));
create policy "ANIXIA admins manage anime streaming services"
  on public.anime_streaming_services for all to authenticated
  using (private.is_anixia_admin()) with check (private.is_anixia_admin());

create policy "Theme songs of published anime are readable"
  on public.anime_theme_songs for select to anon, authenticated
  using (private.is_published_anime(anime_id));
create policy "ANIXIA admins manage anime theme songs"
  on public.anime_theme_songs for all to authenticated
  using (private.is_anixia_admin()) with check (private.is_anixia_admin());

create policy "Source materials of published anime are readable"
  on public.anime_source_materials for select to anon, authenticated
  using (private.is_published_anime(anime_id));
create policy "ANIXIA admins manage anime source materials"
  on public.anime_source_materials for all to authenticated
  using (private.is_anixia_admin()) with check (private.is_anixia_admin());

grant select on public.anime_broadcast_schedules to anon, authenticated;
grant select on public.anime_streaming_services to anon, authenticated;
grant select on public.anime_theme_songs to anon, authenticated;
grant select on public.anime_source_materials to anon, authenticated;

grant insert, update, delete on public.anime_broadcast_schedules to authenticated;
grant insert, update, delete on public.anime_streaming_services to authenticated;
grant insert, update, delete on public.anime_theme_songs to authenticated;
grant insert, update, delete on public.anime_source_materials to authenticated;

grant all on public.anime_broadcast_schedules to service_role;
grant all on public.anime_streaming_services to service_role;
grant all on public.anime_theme_songs to service_role;
grant all on public.anime_source_materials to service_role;
