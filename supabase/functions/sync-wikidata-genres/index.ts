import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const SOURCE = "wikidata";
const STATE_SOURCE = "wikidata-genres";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIDATA_ENTITY = "https://www.wikidata.org/wiki/";
const USER_AGENT = "ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/; genre metadata sync)";
const ALLOWED_ORIGIN = "https://the-rascal-of-sakurasou.github.io";
const HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-anixia-cron-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json; charset=utf-8"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
type AnyRecord = Record<string, any>;

const CANONICAL_GENRES = new Map<string, string>([
  ["action", "Action"],
  ["action anime and manga", "Action"],
  ["adventure", "Adventure"],
  ["adventure anime and manga", "Adventure"],
  ["comedy", "Comedy"],
  ["comedy anime and manga", "Comedy"],
  ["drama", "Drama"],
  ["drama anime and manga", "Drama"],
  ["fantasy", "Fantasy"],
  ["fantasy anime and manga", "Fantasy"],
  ["science fiction anime and manga", "Science Fiction"],
  ["historical", "Historical"],
  ["horror", "Horror"],
  ["mystery", "Mystery"],
  ["romance", "Romance"],
  ["science fiction", "Science Fiction"],
  ["slice of life", "Slice of Life"],
  ["sports", "Sports"],
  ["supernatural", "Supernatural"],
  ["suspense / thriller", "Suspense / Thriller"],
  ["psychological", "Psychological"],
  ["mecha", "Mecha"],
  ["isekai", "isekai"],
  ["music", "Music"],
  ["crime", "Crime"],
  ["dark fantasy", "dark fantasy"],
  ["cyberpunk", "cyberpunk"],
  ["steampunk", "steampunk"],
  ["space opera", "space opera"],
  ["post-apocalyptic anime and manga", "post-apocalyptic anime and manga"],
  ["time-travel anime and manga", "time-travel anime and manga"],
  ["magical girl anime and manga", "magical girl anime and manga"],
  ["romantic comedy anime and manga", "romantic comedy anime and manga"],
  ["school anime and manga", "school anime and manga"],
  ["coming-of-age anime and manga", "coming-of-age anime and manga"],
  ["black comedy", "black comedy"],
  ["parody", "parody"],
  ["satire", "satire"],
  ["military science fiction", "military science fiction"],
  ["cute girls doing cute things", "cute girls doing cute things"],
  ["band anime and manga", "band anime and manga"],
  ["idol anime and manga", "idol anime and manga"],
  ["battle royale anime and manga", "battle royale anime and manga"],
  ["survival anime and manga", "survival anime and manga"]
]);

function qid(value: unknown): string | null {
  return typeof value === "string" && /^Q[1-9]\d*$/.test(value) ? value : null;
}
function claimIds(entity: AnyRecord, property: string): string[] {
  const claims = Array.isArray(entity?.claims?.[property]) ? entity.claims[property] : [];
  return [...new Set(claims
    .map((claim: AnyRecord) => qid(claim?.mainsnak?.datavalue?.value?.id))
    .filter(Boolean))] as string[];
}
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
}
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 1000);
  if (error && typeof error === "object") {
    const value = error as AnyRecord;
    return [value.message, value.details, value.hint, value.code]
      .filter((part) => typeof part === "string" && part.trim()).join(" | ").slice(0, 1000);
  }
  return String(error).slice(0, 1000);
}
async function fetchEntities(ids: string[]): Promise<Map<string, AnyRecord>> {
  const unique = [...new Set(ids.map(qid).filter(Boolean))] as string[];
  const result = new Map<string, AnyRecord>();
  for (let start = 0; start < unique.length; start += 50) {
    const chunk = unique.slice(start, start + 50);
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids: chunk.join("|"),
      props: "labels|claims",
      languages: "en|ja",
      format: "json",
      origin: "*"
    });
    let payload: AnyRecord | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(WIKIDATA_API + "?" + params.toString(), {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
      });
      if (response.status === 429) {
        const retry = Number(response.headers.get("Retry-After") || 10);
        await wait(Math.min(60, Math.max(2, retry)) * 1000);
        continue;
      }
      if ([500, 502, 503, 504].includes(response.status) && attempt < 3) {
        await wait((attempt + 1) * 1500);
        continue;
      }
      if (!response.ok) throw new Error("Wikidata API HTTP " + response.status);
      payload = await response.json();
      break;
    }
    if (!payload) throw new Error("Wikidata API remained unavailable.");
    for (const [id, entity] of Object.entries(payload.entities || {})) {
      if (qid(id) && entity && typeof entity === "object") result.set(id, entity as AnyRecord);
    }
    if (start + 50 < unique.length) await wait(500);
  }
  return result;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && origin !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return json({ error: "Supabase server configuration is incomplete." }, 500);

  let runId: string | null = null;
  try {
    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    let authorized = false;
    const cronToken = req.headers.get("x-anixia-cron-token");
    if (cronToken) {
      const stored = await db.from("catalog_sync_secrets").select("secret_hash").eq("id", 1).maybeSingle();
      if (stored.error) throw stored.error;
      const incomingHash = await sha256(cronToken);
      const secretHash = stored.data?.secret_hash;
      authorized = typeof secretHash === "string" && secretHash.length > 0 &&
        sameToken(incomingHash, secretHash);
    }
    if (!authorized) {
      const auth = req.headers.get("Authorization");
      if (!auth?.startsWith("Bearer ")) return json({ error: "管理者ログインまたは有効な同期トークンが必要です。" }, 401);
      const userClient = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: auth } }
      });
      const user = await userClient.auth.getUser();
      if (user.error || !user.data.user) return json({ error: "ログイン状態を確認できません。" }, 401);
      const admin = await userClient.rpc("is_anixia_admin");
      if (admin.error || admin.data !== true) return json({ error: "ANIXIA管理者権限が必要です。" }, 403);
    }

    const source = await db.from("catalog_sources")
      .select("rights_review_status,is_enabled")
      .eq("code", SOURCE).single();
    if (source.error) throw source.error;
    if (!source.data?.is_enabled || source.data.rights_review_status !== "approved") {
      return json({ error: "Wikidataの利用承認が有効ではないため、同期を停止しました。" }, 423);
    }

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "preview" ? "preview" : "sync";
    const limit = Math.min(50, Math.max(1, Math.floor(Number(body?.limit) || 50)));
    const cursor = await db.from("catalog_sync_state").select("next_offset")
      .eq("source", STATE_SOURCE).maybeSingle();
    if (cursor.error) throw cursor.error;
    const offset = Math.max(0, Number(cursor.data?.next_offset) || 0);

    const worksResult = await db.from("anime")
      .select("id,source_id,release_year", { count: "exact" })
      .eq("source", SOURCE).eq("is_published", true).not("source_id", "is", null)
      .order("release_year", { ascending: true }).order("source_id", { ascending: true })
      .range(offset, offset + limit - 1);
    if (worksResult.error) throw worksResult.error;
    const works = (worksResult.data || []).filter((work: AnyRecord) => qid(String(work.source_id || "")));
    if (!works.length) {
      if (mode === "sync") {
        const now = new Date().toISOString();
        const saved = await db.from("catalog_sync_state").upsert({
          source: STATE_SOURCE, next_offset: 0, last_success_at: now, updated_at: now
        }, { onConflict: "source" });
        if (saved.error) throw saved.error;
      }
      return json({
        status: "completed", mode, works: 0, offset, nextOffset: 0,
        worksTotal: worksResult.count || 0,
        message: "対象作品のジャンル同期が完了しました。"
      });
    }

    if (mode === "preview") {
      const entities = await fetchEntities(works.map((work: AnyRecord) => String(work.source_id)));
      const genreIds = [...new Set([...entities.values()].flatMap(entity => claimIds(entity, "P136")))];
      const genreEntities = await fetchEntities(genreIds);
      const candidates = [...genreEntities.entries()].map(([id, entity]) => ({
        id,
        label: String(entity?.labels?.en?.value || ""),
        allowed: CANONICAL_GENRES.has(String(entity?.labels?.en?.value || "").trim().toLocaleLowerCase())
      }));
      return json({ status: "preview", offset, works: works.length, worksTotal: worksResult.count || 0, genreCandidates: candidates });
    }

    const run = await db.from("catalog_sync_runs").insert({
      source: STATE_SOURCE, status: "running",
      pages_requested: 1, records_seen: 0, records_inserted_or_updated: 0
    }).select("id").single();
    if (run.error) throw run.error;
    runId = String(run.data.id);

    const workEntities = await fetchEntities(works.map((work: AnyRecord) => String(work.source_id)));
    const genreQids = [...new Set([...workEntities.values()].flatMap(entity => claimIds(entity, "P136")))];
    const genreEntities = await fetchEntities(genreQids);
    const genreIdByQid = new Map<string, string>();

    const canonicalNames = [...new Set([...genreEntities.values()]
      .map(entity => CANONICAL_GENRES.get(String(entity?.labels?.en?.value || "").trim().toLocaleLowerCase()))
      .filter(Boolean))] as string[];
    const existingGenres = canonicalNames.length
      ? await db.from("genres").select("id,name").in("name", canonicalNames)
      : { data: [], error: null };
    if (existingGenres.error) throw existingGenres.error;
    const idByName = new Map((existingGenres.data || []).map((row: AnyRecord) =>
      [String(row.name), String(row.id)]
    ));

    for (const [qidValue, entity] of genreEntities.entries()) {
      const label = String(entity?.labels?.en?.value || "").trim().toLocaleLowerCase();
      const canonicalName = CANONICAL_GENRES.get(label);
      const genreId = canonicalName ? idByName.get(canonicalName) : null;
      if (genreId) genreIdByQid.set(qidValue, genreId);
    }

    const externalRows = [...genreIdByQid.entries()].map(([externalId, genreId]) => ({
      genre_id: genreId, source: SOURCE, external_id: externalId,
      source_url: WIKIDATA_ENTITY + externalId, last_verified_at: new Date().toISOString()
    }));
    if (externalRows.length) {
      const saved = await db.from("genre_external_ids").upsert(externalRows, {
        onConflict: "source,external_id"
      });
      if (saved.error) throw saved.error;
    }

    const linkRows: AnyRecord[] = [];
    for (const work of works) {
      const entity = workEntities.get(String(work.source_id));
      if (!entity) continue;
      const genreIds = [...new Set(claimIds(entity, "P136")
        .map(id => genreIdByQid.get(id)).filter(Boolean))] as string[];
      for (const genreId of genreIds) linkRows.push({ anime_id: work.id, genre_id: genreId });
    }
    if (linkRows.length) {
      const saved = await db.from("anime_genres").upsert(linkRows, {
        onConflict: "anime_id,genre_id", ignoreDuplicates: true
      });
      if (saved.error) throw saved.error;
    }

    const nextOffset = offset + works.length;
    const now = new Date().toISOString();
    const total = Number(worksResult.count || 0);
    const completed = nextOffset >= total;
    const state = await db.from("catalog_sync_state").upsert({
      source: STATE_SOURCE,
      next_offset: completed ? 0 : nextOffset,
      last_success_at: completed ? now : null,
      updated_at: now
    }, { onConflict: "source" });
    if (state.error) throw state.error;

    const finished = await db.from("catalog_sync_runs").update({
      status: "succeeded", finished_at: now,
      records_seen: works.length,
      records_inserted_or_updated: linkRows.length + externalRows.length
    }).eq("id", runId);
    if (finished.error) throw finished.error;

    return json({
      status: completed ? "completed" : "succeeded",
      mode, offset, nextOffset: completed ? 0 : nextOffset,
      works: works.length, worksTotal: total,
      genreEntities: genreEntities.size,
      mappedGenreIds: genreIdByQid.size,
      animeGenreLinksAddedOrConfirmed: linkRows.length,
      completed
    });
  } catch (error) {
    const message = errorMessage(error);
    if (runId) {
      const dbUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (dbUrl && serviceKey) {
        const db = createClient(dbUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
        await db.from("catalog_sync_runs").update({
          status: "failed", finished_at: new Date().toISOString(), error_message: message
        }).eq("id", runId);
      }
    }
    return json({ error: message }, 500);
  }
});
