-- Avoid overlapping permissive SELECT policies while preserving public reads
-- and administrator access to unpublished catalogue metadata.

drop policy if exists "Broadcast schedules of published anime are readable" on public.anime_broadcast_schedules;
drop policy if exists "ANIXIA admins manage anime broadcast schedules" on public.anime_broadcast_schedules;
create policy "Published broadcast schedules are readable by visitors"
  on public.anime_broadcast_schedules for select to anon
  using (private.is_published_anime(anime_id));
create policy "Published and admin broadcast schedules are readable by members"
  on public.anime_broadcast_schedules for select to authenticated
  using (private.is_published_anime(anime_id) or (select private.is_anixia_admin()));
create policy "ANIXIA admins insert anime broadcast schedules"
  on public.anime_broadcast_schedules for insert to authenticated
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins update anime broadcast schedules"
  on public.anime_broadcast_schedules for update to authenticated
  using ((select private.is_anixia_admin()))
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins delete anime broadcast schedules"
  on public.anime_broadcast_schedules for delete to authenticated
  using ((select private.is_anixia_admin()));

drop policy if exists "Streaming services of published anime are readable" on public.anime_streaming_services;
drop policy if exists "ANIXIA admins manage anime streaming services" on public.anime_streaming_services;
create policy "Published streaming services are readable by visitors"
  on public.anime_streaming_services for select to anon
  using (private.is_published_anime(anime_id));
create policy "Published and admin streaming services are readable by members"
  on public.anime_streaming_services for select to authenticated
  using (private.is_published_anime(anime_id) or (select private.is_anixia_admin()));
create policy "ANIXIA admins insert anime streaming services"
  on public.anime_streaming_services for insert to authenticated
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins update anime streaming services"
  on public.anime_streaming_services for update to authenticated
  using ((select private.is_anixia_admin()))
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins delete anime streaming services"
  on public.anime_streaming_services for delete to authenticated
  using ((select private.is_anixia_admin()));

drop policy if exists "Theme songs of published anime are readable" on public.anime_theme_songs;
drop policy if exists "ANIXIA admins manage anime theme songs" on public.anime_theme_songs;
create policy "Published theme songs are readable by visitors"
  on public.anime_theme_songs for select to anon
  using (private.is_published_anime(anime_id));
create policy "Published and admin theme songs are readable by members"
  on public.anime_theme_songs for select to authenticated
  using (private.is_published_anime(anime_id) or (select private.is_anixia_admin()));
create policy "ANIXIA admins insert anime theme songs"
  on public.anime_theme_songs for insert to authenticated
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins update anime theme songs"
  on public.anime_theme_songs for update to authenticated
  using ((select private.is_anixia_admin()))
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins delete anime theme songs"
  on public.anime_theme_songs for delete to authenticated
  using ((select private.is_anixia_admin()));

drop policy if exists "Source materials of published anime are readable" on public.anime_source_materials;
drop policy if exists "ANIXIA admins manage anime source materials" on public.anime_source_materials;
create policy "Published source materials are readable by visitors"
  on public.anime_source_materials for select to anon
  using (private.is_published_anime(anime_id));
create policy "Published and admin source materials are readable by members"
  on public.anime_source_materials for select to authenticated
  using (private.is_published_anime(anime_id) or (select private.is_anixia_admin()));
create policy "ANIXIA admins insert anime source materials"
  on public.anime_source_materials for insert to authenticated
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins update anime source materials"
  on public.anime_source_materials for update to authenticated
  using ((select private.is_anixia_admin()))
  with check ((select private.is_anixia_admin()));
create policy "ANIXIA admins delete anime source materials"
  on public.anime_source_materials for delete to authenticated
  using ((select private.is_anixia_admin()));
