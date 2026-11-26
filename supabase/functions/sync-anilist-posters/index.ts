import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-anixia-cron-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const API = "https://graphql.anilist.co";
const MEDIA_FIELDS = `
  id
  idMal
  title { native romaji english }
  synonyms
  coverImage { large extraLarge }
  format
  seasonYear
  startDate { year }
  siteUrl
  isAdult
`;

type Work = {
  id: string; title: string; title_ja: string | null; title_kana: string | null;
  release_year: number | null; format: string; poster_url: string | null;
  poster_attempted_at: string | null; anilist_id?: string | null; mal_id?: string | null;
};
type Media = {
  id: number;
  idMal?: number | null;
  title?: { native?: string | null; romaji?: string | null; english?: string | null };
  synonyms?: string[];
  coverImage?: { large?: string | null; extraLarge?: string | null };
  format?: string | null;
  seasonYear?: number | null;
  startDate?: { year?: number | null };
  siteUrl?: string;
  isAdult?: boolean;
  episodes?: number | null;
  status?: string | null;
};
const norm = (value: unknown) => String(value ?? "").normalize("NFKC")
  .toLocaleLowerCase("ja-JP").replace(/[\s\p{P}\p{S}]+/gu, "");
const yearOf = (m: Media) => Number(m.seasonYear || m.startDate?.year || 0) || null;
const formatMatches = (format: string, mediaFormat: string) => {
  const f = String(format || "").toLowerCase();
  const m = String(mediaFormat || "").toUpperCase();
  if (f === "movie") return m === "MOVIE";
  if (f === "tv") return ["TV", "TV_SHORT"].includes(m);
  if (f === "ova") return m === "OVA";
  if (f === "ona" || f === "web") return m === "ONA";
  if (f === "special") return m === "SPECIAL";
  return true;
};
let lastAniListRequestAt = 0;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function searchTerms(work: Work): string[] {
  const raw = [work.title_ja, work.title, work.title_kana]
    .filter((v): v is string => !!v?.trim());
  const terms = new Set<string>();
  for (const value of raw) {
    const full = value.trim();
    if (full.length >= 2) terms.add(full);
  }
  const genericFragments = new Set(["THE", "MOVIE", "FILM", "ANIMATION", "TV", "OVA", "ONA", "SPECIAL", "SEASON", "PART"]);
  for (const value of raw) {
    for (const piece of value.split(/[|｜:：~〜\/／()\s]+/u)) {
      const term = piece.trim();
      if (genericFragments.has(term.toLocaleUpperCase("en"))) continue;
      if (Array.from(norm(term)).length >= 3) terms.add(term);
    }
  }
  return [...terms].slice(0, 5);
}

function aniListRetryDelayMs(response: Response, attempt: number): number {
  const header = response.headers.get("Retry-After");
  if (header) {
    const seconds = Number(header);
    const parsed = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
    if (Number.isFinite(parsed) && parsed > 0) {
      // If AniList asks for a longer wait, stop this batch and let the
      // scheduled retry run later instead of hammering the API.
      if (parsed > 40000) {
        throw new Error("AniList rate limit (429); Retry-After requires a longer cooldown, queued for a later scheduled retry");
      }
      return Math.max(1000, Math.ceil(parsed));
    }
  }
  return 20000 * (attempt + 1);
}

async function searchAniListBatch(searches: string[]): Promise<Media[][]> {
  // AniList caps GraphQL query complexity at 500. Split large batches so
  // catalog sync remains below that ceiling while preserving result order.
  if (searches.length > 25) {
    const combined: Media[][] = [];
    for (let i = 0; i < searches.length; i += 25) {
      combined.push(...await searchAniListBatch(searches.slice(i, i + 25)));
    }
    return combined;
  }
  if (!searches.length) return [];
  const wait = Math.max(0, 8000 - (Date.now() - lastAniListRequestAt));
  if (wait) await sleep(wait);
  lastAniListRequestAt = Date.now();

  const variables: Record<string, string> = {};
  const aliases = searches.map((search, i) => {
    variables[`s${i}`] = search;
    return `q${i}: Page(perPage: 15) { media(search: $s${i}, type: ANIME) { ${MEDIA_FIELDS} } }`;
  });
  const query = `query (${searches.map((_, i) => `$s${i}: String!`).join(", ")}) { ${aliases.join(" ")} }`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (response.status === 429 && attempt < 2) {
      await sleep(aniListRetryDelayMs(response, attempt));
      lastAniListRequestAt = Date.now();
      continue;
    }
    if (response.status === 429) throw new Error("AniList rate limit (429); queued for a later retry");
    if (!response.ok) { const detail = (await response.text()).slice(0, 1200); throw new Error("AniList API error (" + response.status + "): " + detail); }
    const payload = await response.json();
    if (Array.isArray(payload?.errors) && payload.errors.length) {
      throw new Error("AniList GraphQL error: " + String(payload.errors[0]?.message || "unknown").slice(0, 160));
    }
    return searches.map((_, i) => Array.isArray(payload?.data?.[`q${i}`]?.media)
      ? payload.data[`q${i}`].media as Media[] : []);
  }
  throw new Error("AniList request failed after retries");
}

async function fetchAniListByIds(ids: number[]): Promise<Map<number, Media>> {
  const result = new Map<number, Media>();
  const unique = [...new Set(ids.filter(id => Number.isSafeInteger(id) && id > 0))];
  for (let start = 0; start < unique.length; start += 25) {
    const batch = unique.slice(start, start + 25);
    const waitMs = Math.max(0, 8000 - (Date.now() - lastAniListRequestAt));
    if (waitMs) await sleep(waitMs);
    lastAniListRequestAt = Date.now();
    const variables: Record<string, number> = {};
    const fields = batch.map((id, i) => {
      variables[`i${i}`] = id;
      return `m${i}: Media(id: $i${i}, type: ANIME) { ${MEDIA_FIELDS} }`;
    });
    const query = `query (${batch.map((_, i) => `$i${i}: Int!`).join(", ")}) { ${fields.join(" ")} }`;
    let completed = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      if (response.status === 429 && attempt < 2) {
        await sleep(aniListRetryDelayMs(response, attempt));
        lastAniListRequestAt = Date.now();
        continue;
      }
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 1000);
        throw new Error("AniList direct-ID API error (" + response.status + "): " + detail);
      }
      const payload = await response.json();
      if (Array.isArray(payload?.errors) && payload.errors.length) {
        throw new Error("AniList direct-ID GraphQL error: " + String(payload.errors[0]?.message || "unknown").slice(0, 160));
      }
      for (let i = 0; i < batch.length; i++) {
        const media = payload?.data?.[`m${i}`];
        if (media && Number(media.id) === batch[i]) result.set(batch[i], media as Media);
      }
      completed = true;
      break;
    }
    if (!completed) throw new Error("AniList direct-ID lookup failed after retries.");
  }
  return result;
}

async function fetchAniListByMalIds(ids: number[]): Promise<Map<number, Media>> {
  const result = new Map<number, Media>();
  const unique = [...new Set(ids.filter(id => Number.isSafeInteger(id) && id > 0))];
  for (let start = 0; start < unique.length; start += 25) {
    const batch = unique.slice(start, start + 25);
    const waitMs = Math.max(0, 8000 - (Date.now() - lastAniListRequestAt));
    if (waitMs) await sleep(waitMs);
    lastAniListRequestAt = Date.now();
    const query = `query ($ids: [Int]) { Page(perPage: 50) { media(idMal_in: $ids, type: ANIME) { ${MEDIA_FIELDS} } } }`;
    let completed = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ query, variables: { ids: batch } }),
      });
      if (response.status === 429 && attempt < 3) {
        await sleep(aniListRetryDelayMs(response, attempt));
        lastAniListRequestAt = Date.now();
        continue;
      }
      if ([500, 502, 503, 504].includes(response.status) && attempt < 3) {
        await sleep((attempt + 1) * 2500);
        continue;
      }
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 1000);
        throw new Error("AniList MAL-ID API error (" + response.status + "): " + detail);
      }
      const payload = await response.json();
      if (Array.isArray(payload?.errors) && payload.errors.length) {
        throw new Error("AniList MAL-ID GraphQL error: " + String(payload.errors[0]?.message || "unknown").slice(0, 160));
      }
      const items = Array.isArray(payload?.data?.Page?.media) ? payload.data.Page.media : [];
      for (const media of items) {
        const malId = Number(media?.idMal);
        if (Number.isSafeInteger(malId) && batch.includes(malId)) result.set(malId, media as Media);
      }
      completed = true;
      break;
    }
    if (!completed) throw new Error("AniList MAL-ID lookup failed after retries.");
    if (start + 25 < unique.length) await sleep(8000);
  }
  return result;
}

async function findPostersBatch(works: Work[]): Promise<Map<string, Media | null>> {
  const posters = new Map<string, Media | null>();
  const directWorks = works.filter(work => /^\d+$/.test(String(work.anilist_id || "")));
  const directItems = await fetchAniListByIds(directWorks.map(work => Number(work.anilist_id)));
  // A stale or mismatched AniList ID must not block a valid MAL-ID lookup.
  // Keep direct AniList matches first, then use MAL as a fallback, applying the
  // same exact title, year, format, adult-content and image checks to both.
  const directCandidates = new Map<string, Media>();
  for (const work of works) {
    const direct = work.anilist_id ? directItems.get(Number(work.anilist_id)) : null;
    if (direct && chooseCandidate(work, new Map([[direct.id, direct]]))) {
      directCandidates.set(work.id, direct);
    }
  }
  const malWorks = works.filter(work =>
    !directCandidates.has(work.id) && /^\d+$/.test(String(work.mal_id || ""))
  );
  const malItems = await fetchAniListByMalIds(malWorks.map(work => Number(work.mal_id)));
  const fallbackWorks: Work[] = [];
  for (const work of works) {
    const direct = directCandidates.get(work.id) || null;
    const byMal = !direct && work.mal_id ? malItems.get(Number(work.mal_id)) : null;
    const malCandidate = byMal && chooseCandidate(work, new Map([[byMal.id, byMal]])) ? byMal : null;
    const candidate = direct || malCandidate;
    if (candidate) posters.set(work.id, candidate);
    else fallbackWorks.push(work);
  }
  const plans = fallbackWorks.map(work => ({ work, terms: searchTerms(work) }));
  const allTerms = plans.flatMap(plan => plan.terms);
  const results = await searchAniListBatch(allTerms);
  let cursor = 0;
  for (const plan of plans) {
    const found = new Map<number, Media>();
    for (let i = 0; i < plan.terms.length; i++) {
      for (const media of results[cursor++] || []) found.set(media.id, media);
    }
    posters.set(plan.work.id, chooseCandidate(plan.work, found));
  }
  return posters;
}

const GENERIC_TITLE_TOKENS = new Set([
  "劇場版", "映画", "特別編", "総集編",
  "movie", "film", "themovie", "animation", "theanimation", "tv", "ova", "ona",
  "special", "the", "and", "of"
]);
function titleTokens(value: string): string[] {
  return value.split(/[|｜:：~〜\-–—/／()[\]「」『』【】\s.!?]+/u)
    .map(norm)
    .filter(token => !GENERIC_TITLE_TOKENS.has(token) &&
      (token.length >= 4 || /\\d/.test(token) || /^[ivxlcdm]{1,4}$/.test(token)));
}
function titleMatchScore(work: Work, item: Media): number {
  const aliasesRaw = [item.title?.native, item.title?.romaji, item.title?.english, ...(item.synonyms || [])]
    .filter((v): v is string => !!v?.trim());
  const rawTargets = [work.title_ja, work.title, work.title_kana]
    .filter((v): v is string => !!v?.trim());
  // Poster assignment requires a complete title match after removing only
  // generic media labels. Partial word overlap is intentionally not accepted:
  // it caused unrelated titles such as "劇場版 X" to share the same poster.
  const clean = (value: string) => titleTokens(value).join("");
  const aliases = new Set(aliasesRaw.map(clean).filter(value => value.length >= 4));
  for (const target of rawTargets) {
    const normalized = clean(target);
    if (normalized.length >= 4 && aliases.has(normalized)) {
      return 1200 + Math.min(normalized.length, 40);
    }
  }
  return 0;
}
function chooseCandidate(work: Work, items: Map<number, Media>): Media | null {
  const scored = [...items.values()].flatMap(item => {
    if (item.isAdult === true) return [];
    const image = item.coverImage?.extraLarge || item.coverImage?.large;
    if (!image || !image.startsWith("https://s") || !image.includes(".anilist.co/")) return [];
    const year = yearOf(item);
    if (work.release_year && (!year || Math.abs(year - work.release_year) > 1)) return [];
    if (!formatMatches(work.format, item.format || "")) return [];
    const titleScore = titleMatchScore(work, item);
    if (!titleScore) return [];
    return [{ item, score: titleScore + (work.release_year && year === work.release_year ? 100 : 0) + 50 }];
  }).sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  if (scored.length > 1 && scored[0].score === scored[1].score) return null;
  return scored[0].item;
}
async function digestHex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
}
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Supabase function secrets are incomplete." }, 500);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const cronToken = req.headers.get("x-anixia-cron-token") || "";
  let authorized = false;
  if (cronToken) {
    const stored = await db.from("catalog_sync_secrets").select("secret_hash").eq("id", 1).maybeSingle();
    if (stored.error) return json({ error: "Sync token validation failed." }, 500);
    authorized = Boolean(stored.data?.secret_hash) &&
      sameToken(await digestHex(cronToken), String(stored.data.secret_hash));
  }
  if (!authorized) {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!token || !anonKey) return json({ error: "Administrator login is required." }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Could not verify administrator session." }, 401);
    const { data: isAdmin, error: adminError } = await userClient.rpc("is_anixia_admin");
    if (adminError || isAdmin !== true) return json({ error: "Administrator permission is required." }, 403);
  }
  const approval = await db.from("catalog_sources").select("rights_review_status,is_enabled")
    .eq("code", "anilist").single();
  if (approval.error) return json({ error: "AniList source approval could not be checked." }, 500);
  if (!approval.data.is_enabled || approval.data.rights_review_status !== "approved") {
    return json({ error: "AniList source is not approved for synchronization." }, 423);
  }
  let body: { limit?: number; force?: boolean; animeIds?: string[] } = {};
  try { body = await req.json(); } catch { /* empty body is allowed */ }
  const limit = Math.min(20, Math.max(1, Number(body.limit) || 10));
  const force = body.force === true;
  const requestedIds = Array.isArray(body.animeIds)
    ? [...new Set(body.animeIds.map(String).filter(v => /^[0-9a-f-]{36}$/i.test(v)))].slice(0, 30) : [];
  const selectFields = "id,title,title_ja,title_kana,release_year,format,poster_url,poster_attempted_at";
  const retryIds = new Set<string>();
  let works: Work[] = [];
  const loadNeverAttempted = async (published: boolean, take: number): Promise<Work[]> => {
    if (take <= 0) return [];
    const result = await db.from("anime")
      .select(selectFields)
      .is("poster_url", null)
      .eq("is_published", published)
      .is("poster_attempted_at", null)
      .order("release_year", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .limit(take);
    if (result.error) throw result.error;
    return (result.data || []) as Work[];
  };
  const loadRetry = async (published: boolean, take: number, cutoff: string): Promise<Work[]> => {
    if (take <= 0) return [];
    const result = await db.from("anime")
      .select(selectFields)
      .is("poster_url", null)
      .eq("is_published", published)
      .not("poster_attempted_at", "is", null)
      .lt("poster_attempted_at", cutoff)
      .order("poster_attempted_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(take);
    if (result.error) throw result.error;
    return (result.data || []) as Work[];
  };
  if (requestedIds.length || force) {
    let query = db.from("anime")
      .select(selectFields)
      .is("poster_url", null)
      .order("release_year", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });
    if (requestedIds.length) query = query.in("id", requestedIds);
    const result = await query.limit(limit);
    if (result.error) return json({ error: result.error.message }, 500);
    works = (result.data || []) as Work[];
  } else {
    try {
      // Public catalog first; process unpublished candidates after public works.
      for (const published of [true, false]) {
        if (works.length >= limit) break;
        works.push(...await loadNeverAttempted(published, limit - works.length));
      }
      // Retry no-match records once per day, published first. These retry IDs
      // must remain eligible below; otherwise the old retry path silently skipped them.
      if (works.length < limit) {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        for (const published of [true, false]) {
          if (works.length >= limit) break;
          const rows = await loadRetry(published, limit - works.length, cutoff);
          works.push(...rows);
          for (const row of rows) retryIds.add(row.id);
        }
      }
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
  }
  const workIds = (works || []).map((work: Work) => work.id);
  if (workIds.length) {
    const external = await db.from("anime_external_ids").select("anime_id,external_id,source")
      .in("source", ["anilist", "myanimelist"]).in("anime_id", workIds);
    if (external.error) return json({ error: external.error.message }, 500);
    const anilistByAnime = new Map<string,string>();
    const malByAnime = new Map<string,string>();
    for (const row of external.data || []) {
      if (row.source === "anilist") anilistByAnime.set(String(row.anime_id),String(row.external_id));
      if (row.source === "myanimelist") malByAnime.set(String(row.anime_id),String(row.external_id));
    }
    for (const work of (works || []) as Work[]) {
      work.anilist_id = anilistByAnime.get(work.id) || null;
      work.mal_id = malByAnime.get(work.id) || null;
    }
  }
  const result = { scanned: (works || []).length, updated: 0, skipped: 0,
    unmatched: [] as string[], errors: [] as string[] };
  const batchWorks = (works || []).filter((work: Work) =>
    !work.poster_url && (force || !work.poster_attempted_at || requestedIds.includes(work.id) || retryIds.has(work.id))) as Work[];
  let posters = new Map<string, Media | null>();
  try {
    posters = await findPostersBatch(batchWorks);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const rateLimited = /(?:\\b429\\b|rate limit|too many requests)/i.test(message);
    let deferredForRateLimit = 0;
    if (rateLimited && batchWorks.length) {
      const deferredAt = new Date().toISOString();
      const { data: deferredRows, error: deferError } = await db.from("anime")
        .update({ poster_attempted_at: deferredAt })
        .in("id", batchWorks.map(work => work.id))
        .is("poster_url", null)
        .select("id");
      if (deferError) {
        result.errors.push("Rate-limit backoff update failed: " + deferError.message.slice(0, 160));
      } else {
        deferredForRateLimit = deferredRows?.length || 0;
      }
    }
    result.errors.push(...batchWorks.map(work =>
      (work.title_ja || work.title) + ": " + message.slice(0, 180)));
    return json({ ...result, completed: false, deferredForRateLimit,
      message: rateLimited
        ? "AniList rate limit reached; this batch is deferred for 24 hours so later catalog records can proceed."
        : "The batch search failed; no works were marked as attempted, so they remain retryable." });
  }
  for (const work of (works || []) as Work[]) {
    if (work.poster_url || (!force && work.poster_attempted_at && !requestedIds.includes(work.id) && !retryIds.has(work.id))) { result.skipped++; continue; }
    try {
      const media = posters.get(work.id) || null;
      const attemptedAt = new Date().toISOString();
      if (!media) {
        result.unmatched.push(work.title_ja || work.title);
        const { error } = await db.from("anime").update({ poster_attempted_at: attemptedAt }).eq("id", work.id);
        if (error) throw error;
        continue;
      }
      const posterUrl = media.coverImage?.extraLarge || media.coverImage?.large;
      if (!posterUrl || !(posterUrl.startsWith("https://") || posterUrl.startsWith("http://"))) {
        result.unmatched.push(work.title_ja || work.title);
        const { error } = await db.from("anime").update({ poster_attempted_at: attemptedAt }).eq("id", work.id);
        if (error) throw error;
        continue;
      }
      const sourceUrl = media.siteUrl || "https://anilist.co/anime/" + media.id;
      const { data: updated, error } = await db.from("anime").update({
        poster_url: posterUrl,
        poster_source: "anilist",
        poster_source_id: String(media.id),
        poster_attribution: "AniList",
        poster_source_url: sourceUrl,
        poster_license: "ANIXIA向け利用許可取得済み（運営者申告）。画像の原著作権は各権利者に帰属。",
        poster_license_url: null,
        poster_synced_at: attemptedAt,
        poster_attempted_at: attemptedAt,
      }).eq("id", work.id).select("id").maybeSingle();
      if (error) throw error;
      if (!updated?.id || updated.id !== work.id) throw new Error("DB update returned no matching anime row.");
      result.updated++;
    } catch (error) {
      // Transient API/network failures must remain retryable. Only a completed
      // no-match lookup is marked as attempted above.
      result.errors.push((work.title_ja || work.title) + ": " +
        (error instanceof Error ? error.message : String(error)).slice(0, 180));
    }
  }
  return json({ ...result, completed: (works || []).length < limit,
    message: "Only exact title matches with a compatible release year are imported; ambiguous matches are skipped." });
});