# ANIXIA Zero-Cost Rebuild Plan

Last reviewed: 2026-11-25

## Mission

Build a reliable, Japanese-first anime reference database with broad coverage and useful, verifiable information while keeping incremental infrastructure and service spending at JPY 0.

"Domestic largest" is an ambition, not a current claim. Do not optimize for raw catalog count at the expense of correctness, licensing, completeness, performance, or reliability.

## Non-negotiable constraints

- No paid APIs, hosting, domains, databases, image CDNs, analytics, or monitoring subscriptions.
- Keep the current GitHub Pages + Supabase deployment unless a documented free alternative is demonstrably better and compatible with terms.
- Preserve existing user data and stable public URLs.
- No destructive schema/data changes without a backup/export, a migration, and a rollback plan.
- Never publish unverified records merely to increase counts.
- Never import popularity scores from external APIs. Popularity must be calculated from ANIXIA's own eligible user activity, with transparent rules.
- Record source, source identifier, retrieval/update timestamps, license/rights status, and field-level provenance where practical.
- Respect each source's terms and image-specific license/attribution requirements. A free API is not automatically permission to republish all its images or metadata.
- Keep secrets out of browser code and Git history.

## Current measured baseline (2026-11-25)

- Supabase database size: approximately 92 MB.
- Anime records: 10,032.
- People: 5,920.
- Characters: 8,299.
- Episodes: 32,378.
- Anime-staff relations: 13,025.
- Anime-character relations: 9,671.
- Public anime: 8,615.
- Public anime missing poster URL: 6,027.
- Public anime missing synopsis: 8,304.
- Public anime missing episode count: 2,134.
- Public anime missing Japanese title: 0.
- Existing Supabase schema has 55 tables, 100+ migrations, and 20 Edge Functions.
- Security Advisor findings include tables with RLS enabled but no policies, SECURITY DEFINER function grants to review, and leaked-password protection disabled.
- Performance Advisor findings include unindexed foreign keys, unused indexes, and overlapping permissive RLS policies.
- A deployed AniList catalog-sync function exists, while current project policy needs to be reconciled with the enabled source configuration. Do not assume deployed code matches the GitHub repository.

Counts are point-in-time measurements, not guarantees. Re-run before each migration or bulk operation.

## Target architecture

### 1. Frontend: static-first

- Keep pages static or pre-rendered wherever possible.
- Split shared UI into reusable components and shared design tokens.
- Load only the data needed for the current page.
- Use pagination and bounded queries; never fetch the entire catalog into the browser.
- Use responsive image dimensions, lazy loading, and explicit image fallbacks.
- Avoid client-side bundles and third-party scripts that add cost or tracking.
- Keep public read views cacheable where technically possible.
- Keep private account operations behind authenticated Supabase policies/RPCs.

### 2. Backend: one documented application boundary

- Treat Supabase Postgres as the canonical application database.
- Use PostgREST/RPC for bounded read operations and authenticated mutations.
- Use Edge Functions only for tasks that require secrets, trusted validation, or scheduled/batched processing.
- Do not create another function for every small feature; consolidate related operations into documented modules.
- Add request limits, pagination, timeouts, idempotency, and retry-safe batch processing.
- Ensure every privileged SECURITY DEFINER function has a fixed search_path, explicit authorization checks, and the minimum EXECUTE grants.

### 3. Data pipeline: import -> normalize -> validate -> review -> publish

1. Acquire data only from approved sources and permitted methods.
2. Store raw source identifiers and provenance.
3. Normalize titles, formats, dates, studios, people, and relations.
4. Match against existing records using source IDs and conservative title/year/format matching.
5. Put ambiguous matches into a review queue; never auto-merge uncertain records.
6. Validate required fields and source/license rules.
7. Publish only when the record meets the publication policy.
8. Reconcile changed source records incrementally; do not repeatedly re-import the full catalog.
9. Log failures and allow safe retries.

### 4. Source policy

- Wikidata structured data: usable under CC0; still store source identifiers and follow responsible query/access practices.
- Wikimedia Commons: assess each file's individual license, author, attribution, and reuse conditions. Do not assume every Commons image has the same license.
- Shoboi Calendar: use only within its documented terms and technical limits; store provenance.
- AniList: do not use it as a bulk metadata/catalog source under the current ANIXIA policy. Any image matching or display must be separately checked against the applicable API terms and image rights before use.
- Japanese official sites and other sources: use only facts and assets that can lawfully be reused; link to sources when copying/rehosting is not permitted.
- Do not scrape sites merely because their pages are publicly accessible.

### 5. Images

- Separate image discovery from image approval.
- Store canonical image URL, source, source item/file ID, license, attribution, verification timestamp, and status.
- Prefer licensed Wikimedia Commons assets and explicitly reusable official assets.
- Do not proxy, mirror, or rehost an image unless the license/terms permit it.
- Verify URL reachability and that the image actually depicts the matching work.
- Keep a queue for missing, broken, mismatched, and rights-unclear images.
- Use a consistent poster aspect ratio and fallback artwork.
- Do not fabricate or AI-generate substitute posters for real copyrighted anime works.

## Rebuild order and acceptance gates

### Phase 0 — Freeze and establish a safe baseline
- Export schema and essential data.
- Record current deployment commit, migrations, functions, cron jobs, secrets inventory (names only), and enabled data sources.
- Identify all production writes and scheduled jobs.
- Add a documented rollback procedure.
- No feature work until this inventory exists.

Gate: baseline is reproducible; restore/rollback steps are documented.

### Phase 1 — Security and deployment consistency
- Compare deployed Edge Function definitions with GitHub source.
- Bring all production function code under version control or explicitly retire undocumented functions.
- Review RLS table by table based on intended access.
- Review every SECURITY DEFINER function and EXECUTE grant.
- Enable leaked-password protection if compatible with the existing auth flow.
- Review public views/RPCs for accidental private-field exposure.
- Review source registry rights statuses and disable unapproved or policy-incompatible sources.
- Add deployment checks to prevent a mismatch between GitHub and production.

Gate: no unexplained deployed code; no unresolved critical security findings; source policy matches actual jobs.

### Phase 2 — Data model and catalog quality
- Audit unique keys and relationships for anime, titles, studios, people, characters, episodes, and external IDs.
- Add or verify uniqueness constraints only after duplicate analysis.
- Identify duplicate candidates but do not auto-merge sequels, remakes, specials, or alternate formats.
- Build quality reports for missing/invalid fields, orphan relations, suspicious dates, and episode-count mismatches.
- Define publication rules by format and data availability.
- Fix the highest-impact public records first.

Gate: duplicate review workflow works; quality metrics are measurable and reproducible.

### Phase 3 — Core catalog completeness
Priority order:
1. Correct Japanese title and alternate titles.
2. Format, release year/date, season, status.
3. Verified poster and image attribution.
4. Synopsis with source provenance.
5. Episode count and episode records.
6. Studios and production roles.
7. Staff and cast.
8. Genres, tags, related works, and series relationships.

Gate: each published record has a defined minimum completeness level; no bulk publication of unverified data.

### Phase 4 — Search and discovery
- Build indexed title/alias search.
- Add filters for format, year, season, studio, genre, status, and staff.
- Support kana/romanized/alternate-title matching.
- Add pagination, sort allowlists, query limits, and query-plan checks.
- Add series navigation, related works, and seasonal discovery.

Gate: search results are relevant, bounded, and fast on representative mobile/desktop tests.

### Phase 5 — Frontend and UX rebuild
- Establish one design system and navigation model.
- Rebuild home, search, anime detail, person, character, studio, season, ranking, and user pages consistently.
- Mobile-first layouts, accessible controls, clear empty/error/loading states.
- Remove dead links, duplicate UI, and obsolete scripts.
- Use progressive enhancement and avoid blocking the first render on optional APIs.

Gate: all major routes pass desktop/mobile smoke tests and keyboard/accessibility checks.

### Phase 6 — User features and trust
- Watch status, personal lists, favorites, ratings, reviews, and profile.
- Strict user ownership policies for private data.
- Rate limits and abuse controls that fit the free plan.
- Transparent rules for ANIXIA-derived rankings and popularity.
- Moderation/reporting workflow before expanding community features.

Gate: user A cannot read or modify user B's private records; ranking calculations are explainable.

### Phase 7 — Free-tier performance and operations
- Measure database, storage, egress, Edge Function invocations, GitHub Pages size/bandwidth, and build usage.
- Cache public data safely; reduce repeated queries and payload sizes.
- Use scheduled incremental work, not constant polling.
- Add SQL-based health checks and GitHub Actions checks within free quotas.
- Maintain a local/exportable backup because Supabase Free does not include automatic backups.
- Set thresholds and pause bulk jobs before quota exhaustion.

Gate: routine use remains within the actual free quotas; the site degrades gracefully when a quota is reached.

## Free-tier operating constraints to monitor

These values are subject to provider changes and must be rechecked before release:

- Supabase Free currently lists 500 MB database size, 1 GB file storage, 5 GB uncached and 5 GB cached egress, 500,000 Edge Function invocations, and pausing after one week of inactivity.
- Supabase Free Edge Functions have a 150-second wall-clock limit and 2-second CPU time limit.
- GitHub Pages published sites have a 1 GB size limit and a soft 100 GB/month bandwidth limit; GitHub Pages is not intended as free hosting for commercial SaaS or sensitive transactions.

Do not treat quotas as guaranteed capacity. Keep the product read-light, static-first, and resilient.

## First implementation tasks

1. Create a production inventory of migrations, functions, scheduled jobs, source registry, RLS policies, and deployed-vs-repository code.
2. Produce a table-by-table access matrix before changing RLS.
3. Produce a function-by-function SECURITY DEFINER/grant report.
4. Disable no source blindly; first identify jobs, dependencies, and permitted uses. Then reconcile policy and configuration.
5. Build a reproducible catalog quality report and store its baseline.
6. Build an image rights/match verification queue.
7. Only then begin schema migrations or bulk catalog enrichment.

## Definition of success

ANIXIA is not "complete" when it has a large number of rows. It is successful when:
- Japanese anime coverage is broad and measurable.
- Published records are accurate, sourced, and consistently structured.
- Posters are correctly matched and legally reusable.
- Search works across titles, aliases, people, and production metadata.
- The site is usable on mobile and desktop.
- Private user data is protected.
- New data can be added incrementally without duplicates or regressions.
- Routine operation stays within a verified JPY 0 budget.
