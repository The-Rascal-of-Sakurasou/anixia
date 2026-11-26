# ANIXIA Master Data Architecture (Draft)

Updated: 2026-11-26

## Purpose

Define ANIXIA's canonical master-data model using the five agreed references: MyAnimeList, 日本のアニメ大全, きせつアニメ (MAKI), AQW, and Animecia. Adopt useful design patterns while retaining ANIXIA's own implementation. This document is an architectural proposal based on a read-only schema audit; it does not authorize destructive changes.

## Existing structures observed

- anime: canonical work record, including title, format, year, season, episode count, synopsis/source metadata, poster/source/attribution metadata, and publication state.
- genres + anime_genres: genre master and work links. genres.is_filterable controls public filter visibility; it is not a deletion flag.
- studios + anime_studios: studio master and work links. anime.studio_id also exists and requires consistency auditing.
- people + anime_staff: people and work-role links. Existing role codes observed: voice_actor, director, screenwriter, composer, producer.
- organizations + anime_organization_staff: organization master and work-role links. Existing role observed: 制作会社.
- characters + anime_characters: character master and work links. anime_staff.character_id can associate a credit with a character.
- series + anime_series + anime_relations: series membership and typed work relationships.
- anime_source_materials: source title, medium, author array, publisher/imprint strings, provenance and verification fields.
- anime_titles: multilingual and alternate titles.
- anime_broadcast_schedules, anime_streaming_services, anime_theme_songs: existing structures; zero rows were observed in the audit.
- tags + anime_tags: generic tag structure exists but has very little data.
- External identifier tables exist for anime, genres, studios, people, organizations, series, characters, episodes, and staff links.

Counts are snapshots from 2026-11-26 and must be re-queried before use as current metrics.

## Canonical logical taxonomy

### 1. Work identity and format

Keep one canonical anime record per catalog work. Treat format as an attribute, not a genre. Current enum values observed: tv, movie, ova, special, ona, web. Keep year, exact release date, season, episode count, duration, status, age rating, and country/region as attributes. Do not create genre records for TV, film, OVA, ONA, season, or year.

### 2. Genre

Genres should contain narrative/experience genres only. Keep broad, recognizable genres and useful subgenres. Do not mix in media formats, production techniques, source-media types, audience labels, or one-off plot objects and character traits. Separate genre, theme/subject, setting, audience/demographic, and production technique. Low usage alone is not grounds for deletion. Merge only genuine synonyms or duplicate labels after auditing all links and external mappings. Zero usage does not prove an item is unnecessary.

### 3. Theme and subject tags

Use tags for cross-cutting subjects, motifs, settings, and story characteristics that are not genres. Potential examples for review include time travel, vampires, post-apocalyptic setting, school setting, military setting, and gender transformation. These examples are not automatic insert instructions. Each tag needs a definition, canonical Japanese/English labels, and a type/category. Do not duplicate genres as tags.

### 4. Studios and production organizations

Use studios and anime_studios for animation studios and work-to-studio relationships, including production role and display order. Use organizations and anime_organization_staff for production committees, broadcasters, publishers, music labels, and other organizations with explicit roles. Audit anime.studio_id against anime_studios before selecting a single source of truth. Do not remove the shortcut until all frontend queries, RPCs, imports, and constraints are migrated.

### 5. People and staff credits

Use one people master for directors, voice actors, writers, composers, producers, character designers, art directors, cinematographers, sound directors, editors, and other individual credits. Store each work credit in anime_staff with a controlled role code and optional character link. Candidate role coverage: director, series_composition, screenwriter, character_design, chief_animation_director, animation_director, art_director, color_design, cinematography, editor, sound_director, music, voice_actor, producer, original_creator, original_author. Preserve source wording in provenance when normalizing role labels. Do not assume every role is available for every work.

### 6. Characters

Keep characters in characters and appearances in anime_characters. Represent voice actor credits in anime_staff and link the character through character_id; avoid duplicate free-text cast records.

### 7. Source material and publishing metadata

Keep source work title and medium in anime_source_materials. Normalize authors, publishers, and imprints into dedicated masters only when reliable identifiers and reusable entity records exist. Until then, preserve source-provided strings and provenance; do not guess identities.

### 8. Series and related works

Use series and anime_series for franchise membership. Use anime_relations for typed relationships such as sequel, prequel, side story, spin-off, remake, compilation, and alternate version. Do not use series labels as genres or generic tags.

### 9. Broadcast, streaming, and music

Use the existing anime_broadcast_schedules, anime_streaming_services, and anime_theme_songs tables. Their zero-row state means data acquisition and verification are needed, not that replacement tables should be created. Availability should include region and date validity where relevant. Theme songs should preserve OP/ED/insert type, sequence, song, artist, lyricist, composer, arranger, and provenance.

### 10. Provenance and verification

Imported or curated facts should retain source identity, source record ID, source URL, and verification timestamp where supported. Keep unverified data distinguishable from verified data. Do not copy protected synopsis text from streaming services or other sites without explicit permission/license. Prefer factual metadata and properly licensed/attributed text.

## Frontend navigation model

- Works: keyword search, format, year, season, status, genre, themes, studio, staff, cast, source type, and series.
- Genres: genre index and genre detail.
- People: role-aware index and person detail with credits.
- Studios: studio index and studio detail with works.
- Characters: character index and character detail with works and voice cast.
- Series: franchise index and series detail with ordered works.
- Source materials: medium, author, publisher/imprint, and adaptation links.
- Broadcast/streaming/music: dedicated pages when verified data exists.

Index counts must count distinct published works, not raw join rows. Hide empty or unverified records from public indexes without deleting underlying records.

## Performance and integrity rules

- Use server-side pagination for every large index; never fetch the entire catalogue into the browser.
- Add indexes to join-table foreign keys and common filter/sort columns only after checking existing indexes and query plans.
- Use stable sorting with a unique tie-breaker.
- Avoid N+1 requests; use bounded RPCs or batched joins.
- Cache public, slowly changing master indexes with explicit invalidation/versioning.
- Keep user-specific data behind RLS; public reads should expose published records only.
- Add uniqueness constraints for canonical external identifiers and join pairs only after duplicate audits.
- For merges, migrate all dependent links and external IDs, verify counts, then retire the duplicate master. Never delete first.

## Safe implementation sequence

1. Inventory all tables, columns, constraints, indexes, RLS policies, RPCs, edge functions, and frontend consumers.
2. Produce a complete genre audit: keep, merge, move-to-tag, move-to-format/attribute, hold, or retire; record target and reason for every row.
3. Define canonical role codes and map existing role values without losing source wording.
4. Reconcile anime.studio_id with anime_studios.
5. Design normalized author/publisher/label entities only after checking existing organization and people data.
6. Add reversible migrations and backfills; verify row counts and referential integrity before switching frontend reads.
7. Populate missing metadata from authorized sources with provenance and verification.
8. Redesign public pages and search against the finalized model.
9. Run regression tests, query-plan checks, RLS checks, and production smoke tests.

## Explicit non-goals

- Do not clone another site's source code, proprietary text, imagery, or database.
- Do not delete low-frequency genres based only on count.
- Do not turn all genres into tags or all tags into genres.
- Do not create duplicate tables for concepts already represented.
- Do not claim completeness from table existence or aggregate counts alone.