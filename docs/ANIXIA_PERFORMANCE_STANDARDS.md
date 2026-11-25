# ANIXIA Performance Standards

Last updated: 2026-11-25

## Goal

Keep page responsiveness independent of total catalog size. A page must fetch only the records and fields needed for its current view. The catalog may grow from 10,000 to substantially more records without turning the homepage or detail page into a full-catalog download.

## Non-negotiable rules

1. Never download the entire anime table for a list, homepage, ranking, or search page.
2. Every list endpoint must enforce a server-side limit. Current search RPC caps results at 50; ordinary screens should request 24 or fewer.
3. Do not use per-row network requests (N+1). Fetch related metadata in a bounded batch or a single RPC.
4. Do not run expensive full-catalog aggregates just to display a small homepage section or catalog count.
5. Load poster images lazily outside the initial viewport. Keep image dimensions/aspect ratio reserved to avoid layout shifts.
6. Use small card thumbnails in lists and load full-size artwork only on detail views when needed.
7. Keep public catalog data and private user data out of the same cache policy. Never cache authenticated/private responses in the service worker.
8. Add indexes only for measured query patterns, foreign keys with meaningful row counts, and demonstrated access paths. Do not delete indexes only because a short usage snapshot calls them unused.
9. Keep detail payloads bounded. Episodes, long staff lists, and reviews should be independently paginated or loaded when their section is opened as data volume grows.
10. Measure query plans and browser network behavior before and after each performance change.

## Current architecture

- Static HTML/CSS/JavaScript is hosted on GitHub Pages.
- Supabase PostgreSQL provides the catalog and RPC endpoints.
- Service worker caching applies to same-origin static assets and navigations.
- Supabase API responses are not currently cached by the service worker.
- Poster markup already uses lazy image loading and asynchronous decoding.

## Changes made on 2026-11-25

### Dedicated homepage query paths

Added:
- `public.get_latest_public_anime(limit)`: returns only the fields required for homepage cards, ordered by registration time, capped at 20.
- `public.get_public_anime_count()`: returns only the published catalog count.

Added partial index:
- `anime_published_created_at_idx` on `(created_at DESC, id DESC)` for published anime.

Added foreign-key indexes for the three largest affected catalog tables:
- `anime.studio_id`
- `anime_staff.character_id`
- `characters.series_id`

The homepage no longer calls the general-purpose search RPC for its five latest cards. The count no longer invokes the full search query.

### Parallel metadata enrichment

English title lookup and poster-credit lookup now run concurrently for list/detail results. This removes avoidable serial network waits. The same bounded enrichment helper is reused by the watchlist/recommendation flows.

### Duplicate shared assets

The global performance helper now checks whether the page already includes `site-theme.css` and `anixia-global-header.js` before dynamically adding them. This prevents duplicate stylesheet and header-script inclusion on pages that already declare them.

## Measured database baseline

Measurements taken directly against the Supabase database on 2026-11-25; these are database execution times, not full browser page-load timings.

| Query | Observed execution |
|---|---:|
| General `search_public_anime` for 5 latest rows | about 57.0 ms |
| Dedicated latest-row function wrapper | about 2.9 ms |
| Underlying indexed latest-row SELECT | about 0.11 ms |
| Dedicated published-count function | about 5.6 ms |

The underlying latest-row SELECT used `anime_published_created_at_idx` and read 7 shared buffers in the observed plan. These measurements are a baseline, not a guarantee under all traffic or cache conditions.


### Search query restructuring

The general search RPC originally evaluated person, character, studio, and organization matches as correlated EXISTS conditions for each anime row. These have been moved into private candidate-ID helper functions and are now evaluated as entity searches that return matching anime IDs.

This preserves substring matching and the same global/person/character search fields while reducing repeated correlated work. Helper functions have no direct execution grant for anon/authenticated; they are called from the existing privileged search RPC.

Measured database timings on 2026-11-25:
- Global query `Re:ゼロ`: about 1,713 ms before restructuring, about 1,199 ms after.
- Person filter `花澤香菜`: about 247 ms before, about 131 ms after.
- Character filter `キリト`: about 170 ms after restructuring (no earlier baseline was recorded).

Global search remains slower than the desired target and is a follow-up optimization item. A trigram-index rewrite was tested and reverted because its measured execution time regressed substantially; no trigram extension or experimental indexes remain.

## Next optimization priorities

1. Review the general search RPC. Its current implementation computes rating aggregates and a total-count window while evaluating broad substring matches. Measure query plans for title, person, character, genre, and studio searches separately.
2. Introduce cursor/keyset pagination for deep result pages; keep offset pagination only for shallow pages where it is acceptable.
3. Reduce detail-page payload size by separately loading/paginating episodes, staff, and reviews when their sections are requested.
4. Audit every HTML page for duplicate scripts, stylesheets, and unnecessary third-party SDK loading.
5. Add a reproducible performance check to CI for JavaScript syntax, duplicate assets, unbounded queries, and image-loading attributes.
6. Review the 15 remaining unindexed foreign keys. Prioritize them when their tables become populated or when query plans show a benefit.
7. Review the unused-index and overlapping-RLS-policy advisories individually. Do not bulk-drop indexes or rewrite policies without checking query usage and access semantics.

## Validation checklist for each release

- [ ] Homepage latest additions use the dedicated bounded RPC.
- [ ] Homepage count uses the dedicated count RPC.
- [ ] No list page fetches all anime rows.
- [ ] List queries have explicit server-side limits.
- [ ] No N+1 request pattern was introduced.
- [ ] Poster images are lazy-loaded and have stable layout dimensions.
- [ ] Authenticated data is not cached publicly.
- [ ] Query plans were checked for the changed RPCs.
- [ ] Browser Network panel was checked for duplicate requests and oversized payloads.
- [ ] Existing features and publication/privacy rules still work.
