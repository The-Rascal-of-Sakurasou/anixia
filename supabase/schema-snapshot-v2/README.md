# ANIXIA schema snapshot v2 — live catalog inventory

Captured: 2026-11-26 (UTC)
Supabase project: `trvnxggqzlhqdhoyiliy`
PostgreSQL: 17.12.0.000

## Status

This directory is a **read-only catalog inventory and capture runbook**, not yet a replayable schema dump. The available Supabase connection exposes catalog introspection, but not a complete `pg_dump --schema-only` export. No production DDL, data, migration history, grants, or secrets were changed to create this inventory.

Do not use this directory as a bootstrap or restore source. The existing `supabase/schema-snapshot/` remains the previous replayable snapshot, captured 2026-11-17, and is known to be stale.

## Live catalog counts

| Object | Live count |
|---|---:|
| Tables (public + private) | 64 |
| Constraints | 238 |
| Indexes | 181 |
| RLS policies | 123 |
| Functions (public + private) | 45 |
| Non-internal triggers (public + private + auth) | 15 |
| Tables with RLS enabled | 64 / 64 |

All 64 application tables in `public` and `private` have RLS enabled. None currently has FORCE ROW LEVEL SECURITY enabled.

## Tables

### private (3)
- `admin_users`
- `anixia_catalog_quality_snapshots`
- `quiz_answer_keys`

### public (61)
- `achievements`
- `anime`
- `anime_broadcast_schedules`
- `anime_characters`
- `anime_external_ids`
- `anime_genres`
- `anime_organization_staff`
- `anime_relations`
- `anime_series`
- `anime_source_materials`
- `anime_staff`
- `anime_staff_external_ids`
- `anime_streaming_services`
- `anime_studios`
- `anime_tags`
- `anime_theme_songs`
- `anime_titles`
- `announcements`
- `catalog_duplicate_suppressions`
- `catalog_entity_aliases`
- `catalog_entity_merge_log`
- `catalog_sources`
- `catalog_sync_runs`
- `catalog_sync_secrets`
- `catalog_sync_state`
- `character_external_ids`
- `characters`
- `episode_external_ids`
- `episodes`
- `favorites`
- `genre_external_ids`
- `genres`
- `message_members`
- `message_threads`
- `organization_external_ids`
- `organizations`
- `people`
- `people_external_ids`
- `profiles`
- `quiz_answers`
- `quiz_attempts`
- `quiz_choices`
- `quiz_questions`
- `quizzes`
- `ratings`
- `reviews`
- `series`
- `series_external_ids`
- `social_post_bookmarks`
- `social_post_likes`
- `social_post_media`
- `social_post_reposts`
- `social_posts`
- `studio_external_ids`
- `studios`
- `tags`
- `thread_message_media`
- `thread_messages`
- `user_achievements`
- `user_follows`
- `watch_entries`

## Known gap versus v1

The v1 snapshot contains 47 tables, 172 constraints, 55 standalone indexes, 69 policies, 20 functions and 11 custom triggers. Compared with the current live catalog, v1 is behind by 17 tables, 66 constraints, 126 indexes, 54 policies, 25 functions and 4 triggers. The count differences are not a safe migration plan: objects may have changed or been renamed, and count equality does not prove definition equality.

## Reproducible capture

- `catalog-inventory.sql` runs read-only catalog queries to inspect columns, constraints, indexes, policies, functions, triggers, grants and extensions.
- A true schema-only export still needs to be generated using the Supabase CLI/pg_dump with an authorized database connection, then reviewed and replayed in a disposable local Supabase instance.
- Keep role definitions, application schema, Auth customizations, Storage policies, extension configuration, cron schedules, secrets and platform-managed settings as separately reviewed capture domains. Never put credentials, API keys, Vault values, or production rows into Git.

## Important Supabase CLI v3 note

Supabase CLI v3 changed commands to target the local stack by default and deprecated older remote-target flags. Do not run a dump command until its installed CLI version and `supabase db dump --help` have been checked. Do not run `db push`, `db pull`, `migration repair`, or any command that changes the hosted project as part of this capture.

## Next steps

1. Obtain a schema-only export through an authorized local CLI session without sharing the database password in chat.
2. Compare it with the catalog inventory and the old v1 snapshot.
3. Replay the export in an isolated local Supabase stack.
4. Add automated structural parity checks.
5. Only then reconcile migration history or make production schema changes.
