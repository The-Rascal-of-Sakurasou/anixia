# ANIXIA Reference Benchmark and Original Product Specification

Updated: 2026-11-25

## Purpose

Use the five selected reference sites as product-quality benchmarks, not as templates to reproduce. Study the user problems each site solves, extract general interaction principles, and combine them into an ANIXIA-specific experience. Do not copy page layouts, CSS, wording, logos, illustrations, artwork, or proprietary datasets.

## Five-site benchmark

| Reference | What to learn | ANIXIA implementation direction | What not to copy |
|---|---|---|---|
| [日本のアニメ大全](https://animedb.jp/) | Historical coverage; Japanese title discovery; detailed, kana and chronological search; archive-oriented metadata | Build strong coverage from early Japanese animation to current releases. Add kana index, decade/year index, structured metadata and provenance. Keep historical and current works equally discoverable. | Do not copy its archive structure, wording, visual layout, or scrape its records. |
| [MyAnimeList](https://myanimelist.net/) | Deep work pages; user lists and progress tracking; reviews; recommendations; seasonal discovery; community activity | Connect each work page to a personal library, progress, reviews, ratings and related works. Use user-controlled lists and explain how ANIXIA's own ranking is calculated. | Do not imitate its page composition, scoring presentation, branding, text, or copy its database. |
| [きせつあにめ](https://kisetsu-anime.com/) | Season-focused discovery; current-season ranking; work cards; review and community entry points | Create a useful season hub with current/upcoming seasons, filters, schedule context and clear paths to work details. Separate ANIXIA's own user ratings from imported metadata. | Do not copy its ranking UI, card design, review text or site-specific presentation. |
| [Animecia](https://media-mania.github.io/Animecia/index.html) | Japanese-first catalog organization, search and work-information hierarchy | Prioritize Japanese titles, readings, alternate titles and consistent detail pages. Keep search, filters, work relationships and metadata completeness coherent. | Do not reuse its code, visual assets, wording or database contents without explicit permission. |
| [Anime Quiz World (AQW)](https://the-rascal-of-sakurasou.github.io/anime-quiz-world/index.html) | Quiz flow, recommendation diagnosis, user participation and cross-feature navigation | Treat quiz and recommendation as first-class discovery tools that link back to canonical ANIXIA work records. Reuse only code or standards whose license and ownership permit reuse. | Do not make ANIXIA look like AQW or transplant quiz content without checking rights and compatibility. |

### Observed reference signals

- The Anime Taizen public site exposes detailed search, kana search and chronological search as distinct discovery paths.
- The Kisetsu Anime landing page combines seasonal ranking with review/community entry points.
- MyAnimeList's official app description highlights anime tracking, seasonal pages, recommendations, reviews and friend/community activity.
- Animecia and AQW should also be reviewed directly in their own repositories and browser builds; automated text extraction may not expose their full UI. Do not infer unobserved features from inaccessible pages.

## ANIXIA's differentiated product model

ANIXIA should combine the strengths above into one connected system rather than five disconnected feature clones:

1. **A Japanese-first canonical catalog** — one authoritative ANIXIA work record, with Japanese title, reading, alternate titles, English title, format, dates, episode count and source history.
2. **Multiple discovery routes** — title/alias search, kana index, decade/year, season, genre, studio, staff, cast, characters and related-work navigation.
3. **A complete work page** — concise key facts first, then synopsis, episode list, staff/cast, studios, characters, themes, related works, official links and source/rights notes.
4. **A personal anime library** — watch status, episode progress, favorites, personal score and private notes, all protected by user-specific RLS.
5. **A transparent community layer** — reviews and discussions with spoiler controls, reporting and moderation. Do not expose private notes or personal lists by default.
6. **Seasonal discovery** — current and upcoming titles, broadcast timing where verified, filters and season-to-season navigation.
7. **Quiz and recommendation discovery** — quiz results and diagnosis recommendations link to canonical work pages; never create duplicate work records.
8. **ANIXIA-owned rankings** — ratings/popularity derive only from eligible ANIXIA user activity under documented rules. Never import popularity scores from external APIs.
9. **Data trust** — show source/provenance and image rights status where known. Keep uncertain or rights-unclear records out of public display until reviewed.
10. **Fast by design** — bounded queries, pagination, lazy images, responsive thumbnails, cache separation for public/private data and no full-catalog downloads.

## Information architecture

Primary navigation should stay compact and task-oriented:

- Discover: search, seasonal anime, genres, decades and kana index.
- Catalog: anime, people, characters, studios and staff.
- Personal: library, progress, favorites and profile.
- Community: reviews, discussions and user discovery.
- Explore: quizzes, recommendation diagnosis and comparisons.

Do not place every secondary route in the top-level navigation. Use page-local tabs, filters and related links to keep the header usable on mobile.

## Work-page information hierarchy

Recommended order:

1. Title, poster, format, year/season, status and verified episode count.
2. Short synopsis and official/source links.
3. User actions: add to library, update progress, rate, favorite.
4. Core metadata: genres/tags, studios, source material, broadcast/release dates.
5. Staff and cast, with role labels and person links.
6. Characters and related works/series navigation.
7. Episode list, independently paginated or collapsed for long-running works.
8. Reviews and discussions, with spoiler handling.
9. Source, image attribution, verification and update information.

The exact layout must be designed by ANIXIA and validated against real content density, not copied from any reference.

## Acceptance criteria

- Every major feature is reachable from a coherent navigation path on desktop and mobile.
- Search supports Japanese title, reading, alternate title and English/romanized title where data exists.
- Every public work page links to relevant people, characters, studios, episodes and related works when verified.
- User data is private by default and tested for owner/non-owner access.
- Rankings are calculated from ANIXIA's own eligible activity, with the formula documented.
- Quiz and recommendation outputs link to existing catalog records.
- No reference site's text, artwork, page layout or dataset is copied.
- No page downloads the entire catalog; large collections are paginated and images are lazy-loaded.
- Missing, uncertain or rights-unclear metadata is labeled or kept unpublished rather than fabricated.

## Implementation order

1. Fix current reliability and responsive-test failures before adding visual complexity.
2. Finish catalog completeness, source provenance and poster-rights/match review.
3. Strengthen title search, kana/year/season discovery and related-work navigation.
4. Standardize work, person, character and studio detail pages.
5. Connect watchlist, progress, favorites, ratings and reviews to the catalog.
6. Improve seasonal hub, then quizzes/recommendations and community discovery.
7. Run accessibility, security, performance and mobile regression tests after each phase.

## Constraints

- Keep incremental service spending at JPY 0.
- Preserve current data and URLs.
- Do not bulk ingest reference-site data.
- Do not import external popularity scores.
- AniList remains restricted to permitted image matching/display use; do not use it as a bulk catalog source.
- Verify every source's terms and every image's individual license before use.
