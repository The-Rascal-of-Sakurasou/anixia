const ALLOWED_ORIGIN = "https://the-rascal-of-sakurasou.github.io";
const HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-anixia-cron-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

Deno.serve((req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && origin !== ALLOWED_ORIGIN) {
    return json({ error: "Origin not allowed." }, 403);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  // ANIXIA policy: AniList may be used for approved poster matching only.
  // It must not be used as a bulk anime-catalog metadata source.
  return json({
    ok: false,
    code: "SOURCE_POLICY_DISABLED",
    message: "AniList catalog ingestion is disabled by ANIXIA source policy. Poster matching is handled by sync-anilist-posters."
  }, 410);
});
