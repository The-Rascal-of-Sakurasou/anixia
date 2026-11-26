import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-anixia-cron-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const norm = (value: unknown) => String(value ?? "").normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/[\s\p{P}\p{S}]/gu, "");
const cleanHtml = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 500);

function licenseInfo(meta: Record<string, any>) {
  const short = cleanHtml(meta?.LicenseShortName?.value);
  const rawUrl = cleanHtml(meta?.LicenseUrl?.value);
  const url = rawUrl.startsWith("//") ? "https:" + rawUrl : rawUrl.replace(/^http:\/\/creativecommons\.org\//i, "https://creativecommons.org/");
  const artist = cleanHtml(meta?.Artist?.value || meta?.Author?.value);
  const credit = cleanHtml(meta?.Credit?.value || meta?.Attribution?.value);
  const normalized = short.toLowerCase();
  const licenseUrl = url.toLowerCase();
  const copyrighted = cleanHtml(meta?.Copyrighted?.value).toLowerCase();
  const cc0 = /^(?:cc0(?:\s|$)|cc zero)$/i.test(short) && /creativecommons\.org\/publicdomain\/zero\//.test(licenseUrl);
  const publicDomain = /^(public domain|pd|public domain mark)$/i.test(short) &&
    (/creativecommons\.org\/publicdomain\/mark\//.test(licenseUrl) || (!licenseUrl && copyrighted === "false"));
  const ccBy = /^cc by(?:\s|$)/i.test(short) && /creativecommons\.org\/licenses\/by\/\d+(?:\.\d+)?(?:\/|$)/.test(licenseUrl);
  const ccBySa = /^cc by-sa(?:\s|$)/i.test(short) && /creativecommons\.org\/licenses\/by-sa\/\d+(?:\.\d+)?(?:\/|$)/.test(licenseUrl);
  const allowed = cc0 || publicDomain || ccBy || ccBySa;
  const effectiveLicenseUrl = url || (publicDomain && copyrighted === "false"
    ? "https://commons.wikimedia.org/wiki/Commons:Licensing" : "");
  if (!allowed || (!/^https:\/\/creativecommons\.org\//i.test(url) && !effectiveLicenseUrl)) return null;
  if (/non.?commercial|by-nc|\bnd\b|by-nd|fair.?use|all.?rights.?reserved/i.test(normalized + " " + licenseUrl)) return null;
  const attribution = artist || credit;
  // CC BY / CC BY-SA require a real creator or credit line; never invent one.
  if ((ccBy || ccBySa) && !attribution) return null;
  return {
    short,
    url: effectiveLicenseUrl,
    artist,
    credit,
    attribution: attribution || "Public domain / CC0"
  };
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

async function imageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url, {
      headers: { Range: "bytes=0-65535" },
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < 65536) {
      const part = await reader.read();
      if (part.done) break;
      chunks.push(part.value);
      total += part.value.length;
    }
    await reader.cancel().catch(() => {});
    const bytes = new Uint8Array(Math.min(total, 65536));
    let offset = 0;
    for (const chunk of chunks) {
      const length = Math.min(chunk.length, bytes.length - offset);
      if (length <= 0) break;
      bytes.set(chunk.subarray(0, length), offset);
      offset += length;
    }
    const u32be = (i: number) => (((bytes[i] << 24) >>> 0) + (bytes[i+1] << 16) + (bytes[i+2] << 8) + bytes[i+3]) >>> 0;
    const u24le = (i: number) => bytes[i] | (bytes[i+1] << 8) | (bytes[i+2] << 16);
    const ascii = (i: number, n: number) => String.fromCharCode(...bytes.subarray(i, i+n));
    if (bytes.length >= 24 && bytes[0]===137 && ascii(1,3)==="PNG") {
      return { width: u32be(16), height: u32be(20) };
    }
    if (bytes.length >= 30 && ascii(0,4)==="RIFF" && ascii(8,4)==="WEBP") {
      const kind = ascii(12,4);
      if (kind === "VP8X") return { width: u24le(24)+1, height: u24le(27)+1 };
      if (kind === "VP8 " && ascii(23,3)==="\x9d\x01\x2a") {
        return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff };
      }
      if (kind === "VP8L" && bytes[20]===0x2f) {
        const b1=bytes[21],b2=bytes[22],b3=bytes[23],b4=bytes[24];
        return { width: 1 + (((b2 & 0x3f) << 8) | b1), height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)) };
      }
    }
    if (bytes.length >= 4 && bytes[0]===0xff && bytes[1]===0xd8) {
      let i=2;
      while (i+9 < bytes.length) {
        if (bytes[i] !== 0xff) { i++; continue; }
        while (bytes[i]===0xff) i++;
        const marker=bytes[i++];
        if (marker===0xd8 || marker===0xd9 || (marker>=0xd0 && marker<=0xd7)) continue;
        if (i+1>=bytes.length) break;
        const length=(bytes[i]<<8)|bytes[i+1];
        if (length<2 || i+length>bytes.length) break;
        if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
          return { height: (bytes[i+3]<<8)|bytes[i+4], width: (bytes[i+5]<<8)|bytes[i+6] };
        }
        i += length;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function searchImage(work: any) {
  // Prefer Wikidata P18: the image is directly linked to this exact anime item,
  // so matching does not depend on Japanese/English filename spelling.
  const qid = String(work.source_id || "");
  const extraTitles: string[] = [];
  if (/^Q[1-9][0-9]*$/.test(qid)) {
    try {
      const entityParams = new URLSearchParams({
        action: "wbgetentities", ids: qid, props: "claims|labels|aliases", languages: "en|ja", format: "json", origin: "*"
      });
      const entityResponse = await fetch("https://www.wikidata.org/w/api.php?" + entityParams, {
        headers: { "User-Agent": "ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/; anime image metadata)" }
      });
      if (entityResponse.ok) {
        const entityPayload = await entityResponse.json();
        const entity = entityPayload?.entities?.[qid];
        const enLabel = entity?.labels?.en?.value;
        if (enLabel) extraTitles.push(enLabel);
        for (const alias of (entity?.aliases?.en || []).slice(0, 8)) if (alias?.value) extraTitles.push(alias.value);
        const fileName = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (typeof fileName === "string" && fileName.trim()) {
          const imageParams = new URLSearchParams({
            action: "query", format: "json", formatversion: "2",
            titles: "File:" + fileName, prop: "imageinfo",
            iiprop: "url|size|extmetadata", iiurlwidth: "900", origin: "*"
          });
          const imageResponse = await fetch("https://commons.wikimedia.org/w/api.php?" + imageParams, {
            headers: { "User-Agent": "ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/; public anime database)" }
          });
          if (imageResponse.ok) {
            const imagePayload = await imageResponse.json();
            const page = (imagePayload?.query?.pages || [])[0];
            const info = page?.imageinfo?.[0];
            const width = Number(info?.width || 0), height = Number(info?.height || 0);
            const license = licenseInfo(info?.extmetadata || {});
            const isLogo = /logo|ロゴ/i.test(fileName);
            const validShape = !isLogo && width >= 900 && height >= 1260 &&
              width / height >= 0.38 && width / height <= 0.9;
            if (info?.thumburl && info?.descriptionurl && String(info?.mime || "").startsWith("image/") &&
                String(info.thumburl).startsWith("https://upload.wikimedia.org/") &&
                validShape && license) {
              return {
                url: info.thumburl,
                width, height,
                id: page.title,
                page: info.descriptionurl,
                attribution: license.attribution,
                license: license.short,
                licenseUrl: license.url
              };
            }
          }
        }

        // Follow the Wikidata media-franchise link for its Commons category (P373).
        const franchiseId = entityPayload?.entities?.[qid]?.claims?.P8345?.[0]?.mainsnak?.datavalue?.value?.id;
        let franchiseClaims: any = null;
        if (franchiseId) {
          const franchiseParams = new URLSearchParams({
            action: "wbgetentities", ids: franchiseId, props: "claims", format: "json", origin: "*"
          });
          const franchiseResponse = await fetch("https://www.wikidata.org/w/api.php?" + franchiseParams, {
            headers: { "User-Agent": "ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/; anime image metadata)" }
          });
          if (franchiseResponse.ok) {
            const franchisePayload = await franchiseResponse.json();
            franchiseClaims = franchisePayload?.entities?.[franchiseId]?.claims || null;
          }
        }
        const commonsCategory =
          entityPayload?.entities?.[qid]?.claims?.P373?.[0]?.mainsnak?.datavalue?.value ||
          franchiseClaims?.P373?.[0]?.mainsnak?.datavalue?.value;
        if (typeof commonsCategory === "string" && commonsCategory.trim()) {
          const categoryParams = new URLSearchParams({
            action: "query", format: "json", formatversion: "2",
            generator: "categorymembers", gcmtitle: "Category:" + commonsCategory,
            gcmnamespace: "6", gcmlimit: "50", prop: "imageinfo",
            iiprop: "url|size|extmetadata", iiurlwidth: "900", origin: "*"
          });
          const categoryResponse = await fetch("https://commons.wikimedia.org/w/api.php?" + categoryParams, {
            headers: { "User-Agent": "ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/; public anime database)" }
          });
          if (categoryResponse.ok) {
            const categoryPayload = await categoryResponse.json();
            const categoryPages = Array.isArray(categoryPayload?.query?.pages) ? categoryPayload.query.pages : [];
            const categoryMatches = categoryPages.map((page: any) => {
              const info = page.imageinfo?.[0];
              if (!info?.thumburl || !info?.descriptionurl || !String(info?.mime || "").startsWith("image/") || !String(info.thumburl).startsWith("https://upload.wikimedia.org/")) return null;
              const fileName = String(page.title || "").replace(/^File:/i, "");
              const posterFile = /poster|key[ -]?visual|cover|ポスター|キービジュアル|表紙/i.test(fileName);
              const workHasVariantTerm = /\b(movie|film|ova|ona|special)\b/i.test(String(work.title_ja || "") + " " + String(work.title || ""));
              const candidateHasVariantTerm = /\b(movie|film|ova|ona|special)\b/i.test(fileName);
              if (candidateHasVariantTerm && !workHasVariantTerm) return null;
              if (!posterFile) return null;
              const width = Number(info.width || 0), height = Number(info.height || 0);
              const validShape = width >= 900 && height >= 1260 &&
                width / height >= 0.38 && width / height <= 0.9;
              const license = licenseInfo(info.extmetadata || {});
              if (!validShape || !license) return null;
              return { page, info, license, score: 100 };
            }).filter(Boolean).sort((a: any, b: any) => b.score - a.score);
            if (categoryMatches.length) {
              const best = categoryMatches[0];
              return {
                url: best.info.thumburl,
                width: Number(best.info.width || 0), height: Number(best.info.height || 0),
                id: best.page.title,
                page: best.info.descriptionurl,
                attribution: best.license.attribution,
                license: best.license.short,
                licenseUrl: best.license.url
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn("Wikidata/Commons category lookup failed for " + qid + ": " + String(error).slice(0, 160));
    }
  }
  const candidates = [...new Set([work.title_ja, work.title, work.title_kana, ...extraTitles].filter((v: unknown) => String(v || "").trim().length >= 3))].slice(0, 6);
  for (const query of candidates) {
    const searchTerms = [query + " poster", query + " key visual", query + " cover", query];
    for (const searchTerm of searchTerms) {
    const params = new URLSearchParams({
      action: "query", format: "json", formatversion: "2",
      generator: "search", gsrsearch: searchTerm, gsrnamespace: "6", gsrlimit: "15",
      prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "900",
      origin: "*"
    });
    const response = await fetch("https://commons.wikimedia.org/w/api.php?" + params, {
      headers: { "User-Agent": "ANIXIA/1.0 (https://the-rascal-of-sakurasou.github.io/anixia/; public anime database)" }
    });
    if (response.status === 429) throw new Error("Wikimedia Commons rate limit (429)");
    if (!response.ok) throw new Error("Wikimedia Commons API error: " + response.status);
    const payload = await response.json();
    const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
    const target = norm(query);
    const ranked = pages.map((page: any) => {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl || !info?.descriptionurl || !String(info?.mime || "").startsWith("image/") || !String(info.thumburl).startsWith("https://upload.wikimedia.org/")) return null;
      const rawFileName = String(page.title || "").replace(/^File:/i, "").replace(/\.[a-z0-9]{2,5}$/i, "");
      const rawDescription = cleanHtml(info.extmetadata?.ImageDescription?.value);
      const fileName = norm(rawFileName);
      const description = norm(rawDescription);
      const workText = String(work.title_ja || "") + " " + String(work.title || "");
      const workHasVariantTerm = /\b(movie|film|ova|ona|special)\b/i.test(workText);
      const candidateHasVariantTerm = /\b(movie|film|ova|ona|special)\b/i.test(rawFileName + " " + rawDescription);
      if (candidateHasVariantTerm && !workHasVariantTerm) return null;
      const isLogo = /logo|ロゴ/i.test(rawFileName + " " + rawDescription);
      const posterFile = /poster|key[ -]?visual|cover|dvd|blu[ -]?ray|promotional|artwork|ポスター|キービジュアル|表紙/i.test(rawFileName + " " + rawDescription);
      if (isLogo || !posterFile) return null;
      const exact = fileName === target || description === target;
      const contains = fileName.includes(target) || description.includes(target);
      if (!contains) return null;
      const width = Number(info.width || 0), height = Number(info.height || 0);
      const validShape = width >= 900 && height >= 1260 &&
        width / height >= 0.38 && width / height <= 0.9;
      if (!validShape) return null;
      const license = licenseInfo(info.extmetadata || {});
      const yearMatch = work.release_year && String(page.title).includes(String(work.release_year));
      if (!license) return null;
      return { page, info, license, score: (exact ? 100 : 90) + (yearMatch ? 10 : 0) + 10 };
    }).filter(Boolean).sort((a: any, b: any) => b.score - a.score);
    if (ranked.length && (!ranked[1] || ranked[0].score > ranked[1].score)) {
      const best = ranked[0];
      return {
        url: best.info.thumburl,
        width: Number(best.info.width || 0), height: Number(best.info.height || 0),
        id: best.page.title,
        page: best.info.descriptionurl,
        attribution: best.license.attribution,
        license: best.license.short,
        licenseUrl: best.license.url
      };
    }
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\\s+/i, "");
  const cronToken = req.headers.get("x-anixia-cron-token") || "";
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Supabase function secrets are incomplete." }, 500);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let authorized = false;
  if (cronToken) {
    const stored = await db.from("catalog_sync_secrets").select("secret_hash").eq("id", 1).maybeSingle();
    if (stored.error) return json({ error: "同期トークンを検証できません。" }, 500);
    authorized = Boolean(stored.data?.secret_hash) && sameToken(await digestHex(cronToken), String(stored.data.secret_hash));
  }
  if (!authorized) {
    if (!token) return json({ error: "管理者ログインまたは有効な同期トークンが必要です。" }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "認証を確認できませんでした。" }, 401);
    const { data: isAdmin, error: adminError } = await userClient.rpc("is_anixia_admin");
    if (adminError || isAdmin !== true) return json({ error: "管理者権限が必要です。" }, 403);
  }

  const sourceCheck = await db.from("catalog_sources")
    .select("rights_review_status,is_enabled")
    .eq("code", "wikimedia_commons")
    .single();
  if (sourceCheck.error) return json({ error: "Wikimedia Commonsの利用承認状態を確認できません。" }, 500);
  if (!sourceCheck.data?.is_enabled || sourceCheck.data.rights_review_status !== "approved") {
    return json({ error: "Wikimedia Commonsの利用承認が有効ではないため、同期を停止しました。" }, 423);
  }

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 30);
  const force = body.force === true;
  const upgradeExisting = body.upgradeExisting === true;
  const requestedIds = Array.isArray(body.animeIds)
    ? [...new Set(body.animeIds.map((v: unknown) => String(v || "")).filter((v: string) => /^[0-9a-f-]{36}$/i.test(v)))].slice(0, 30)
    : [];
  let offset = 0;
  if (!requestedIds.length && !force) {
    const state = await db.from("catalog_sync_state").select("next_offset").eq("source", "commons-posters").maybeSingle();
    if (state.error) return json({ error: state.error.message }, 500);
    offset = Math.max(0, Number(state.data?.next_offset) || 0);
  }
  const buildQuery = (startAt: number) => {
    let query = db.from("anime").select("id,title,title_ja,title_kana,release_year,poster_url,poster_source,source_id")
      ; // Process only missing posters in normal sync; upgrade mode may inspect existing posters.
    if (requestedIds.length) query = query.in("id", requestedIds);
    // Keep pagination over a stable full catalog; filtering out updated rows here
    // would shift offsets and cause later titles to be skipped.
    query = query.order("release_year", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });
    return query.range(startAt, startAt + limit - 1);
  };
  let { data: works, error: listError } = await buildQuery(offset);
  if (listError) return json({ error: listError.message }, 500);
  if (!requestedIds.length && !force && (!works || works.length === 0) && offset > 0) {
    offset = 0;
    const reset = await db.from("catalog_sync_state").upsert({
      source: "commons-posters", next_offset: 0, updated_at: new Date().toISOString()
    }, { onConflict: "source" });
    if (reset.error) return json({ error: reset.error.message }, 500);
    const firstPage = await buildQuery(0);
    works = firstPage.data;
    listError = firstPage.error;
    if (listError) return json({ error: listError.message }, 500);
  }

  const results = { scanned: (works || []).length, updated: 0, unmatched: [] as string[], errors: [] as string[] };
  for (const work of works || []) {
    if (!force && work.poster_url && !(upgradeExisting && work.poster_source === "anilist")) continue;
    try {
      if (upgradeExisting && work.poster_url && work.poster_source === "anilist") {
        const currentSize = await imageDimensions(work.poster_url);
        // Unknown dimensions are left untouched; never replace an image unless
        // its low resolution is confirmed.
        if (!currentSize || (currentSize.width >= 600 && currentSize.height >= 840)) continue;
      }
      const image = await searchImage(work);
      if (!image) { results.unmatched.push(work.title_ja || work.title || work.id); continue; }
      const { data: updatedRecord, error } = await db.from("anime").update({
        poster_url: image.url,
        poster_source: "wikimedia_commons",
        poster_source_id: image.id,
        poster_attribution: image.attribution,
        poster_source_url: image.page,
        poster_license: image.license,
        poster_license_url: image.licenseUrl,
        poster_synced_at: new Date().toISOString()
      }).eq("id", work.id).select("id").maybeSingle();
      if (error) throw error;
      if (!updatedRecord?.id || updatedRecord.id !== work.id) {
        throw new Error("画像更新対象の作品レコードが更新されませんでした。RLS・接続先・作品IDを確認してください。");
      }
      results.updated++;
    } catch (error) {
      results.errors.push((work.title_ja || work.title || work.id) + ": " + String(error).slice(0, 160));
    }
  }
  if (!requestedIds.length && !force) {
    const nextOffset = (works || []).length < limit ? 0 : offset + limit;
    const stateUpdate = await db.from("catalog_sync_state").upsert({
      source: "commons-posters", next_offset: nextOffset,
      last_success_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }, { onConflict: "source" });
    if (stateUpdate.error) results.errors.push("同期位置の保存に失敗: " + stateUpdate.error.message);
  }
  return json({
    ...results,
    nextOffset: (!requestedIds.length && !force) ? ((works || []).length < limit ? 0 : offset + limit) : null,
    message: "ライセンス条件を確認できたWikimedia Commons画像だけを登録しました。"
  });
});