(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const language = () => window.ANIXIA_LANG?.() || "ja";
  const messages = {
    ja: {loading:"読み込み中…", empty:"作品データはまだありません。", failed:"作品情報を読み込めませんでした。時間をおいて再度お試しください。", retry:"再試行", year:"放送年未登録", genresEmpty:"ジャンルデータはまだありません。", genresFailed:"ジャンル情報を読み込めませんでした。", ratingsEmpty:"評価が5件以上ある作品はまだありません。", ratingsFailed:"評価ランキングを読み込めませんでした。", login:"ログイン", mypage:"マイページ"},
    en: {loading:"Loading…", empty:"No titles are available yet.", failed:"Could not load titles. Please try again later.", retry:"Retry", year:"Year unknown", genresEmpty:"No genres are available yet.", genresFailed:"Could not load genres.", ratingsEmpty:"No titles have at least five ratings yet.", ratingsFailed:"Could not load the ratings ranking.", login:"Log in", mypage:"My Library"}
  };
  const t = () => messages[language()] || messages.ja;
  const hasJapanese = value => /[\u3040-\u30ff\u3400-\u9fff]/u.test(String(value||""));
  const title = (work) => language() === "en" ? (work.title_en || work.title_romaji || (work.title && !hasJapanese(work.title) ? work.title : "English title unavailable")) : (work.title_ja || work.title_kana || work.title || "タイトル未設定");
  const year = (work) => work.release_year ? String(work.release_year) : t().year;
  const card = (work) => `
    <a class="anixia-work-card" href="anime-detail.html?id=${encodeURIComponent(work.id)}">
      <div class="anixia-poster">
        ${ANIXIA.posterMarkup(work.poster_url, title(work), work.poster_credit)}
      </div>
      <div class="anixia-work-copy">
        <strong>${esc(title(work))}</strong>
        <small>${esc([year(work), work.format || ""].filter(Boolean).join(" · "))}</small>
      </div>
    </a>`;
  const showRetryState = (id, message, retry) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = `<div class="anixia-state"><p>${esc(message)}</p><button type="button" class="anixia-retry-button">${esc(t().retry)}</button></div>`;
    el.querySelector(".anixia-retry-button")?.addEventListener("click", retry, { once: true });
  };
  async function loadSection(id, options) {
    try {
      const data = await ANIXIA.getLatestAnime(options.limit || 5);
      const el = $(id);
      if (!el) return;
      el.innerHTML = data.length ? data.map(card).join("") : `<p class="anixia-state">${esc(t().empty)}</p>`;
    } catch (error) {
      console.error(error);
      showRetryState(id, t().failed, () => loadSection(id, options));
    }
  }
  async function loadRatings() {
    try {
      const rows = await ANIXIA.getRankings("rating", 5);
      const el = $("rating-works");
      if (!el) return;
      el.innerHTML = rows.length
        ? rows.map((work, index) => `<div class="anixia-home-ranked-card"><span class="anixia-home-rank-no">${String(index + 1).padStart(2, "0")}</span>${card(work)}</div>`).join("")
        : `<p class="anixia-state">${esc(t().ratingsEmpty)}</p>`;
    } catch (error) {
      console.error(error);
      showRetryState("rating-works", t().ratingsFailed, loadRatings);
    }
  }

  async function loadGenres() {
    try {
      const genres = await ANIXIA.getGenres();
      $("genre-links").innerHTML = genres.length
        ? genres.slice(0, 12).map(g => `<a href="anime.html?genre=${encodeURIComponent(g.id)}">${esc(language() === "en" ? (g.name_en || (g.name && !hasJapanese(g.name) ? g.name : "Genre name unavailable")) : (g.name_ja || g.name))}</a>`).join("")
        : `<p class="anixia-state">${esc(t().genresEmpty)}</p>`;
    } catch (error) {
      console.error(error);
      showRetryState("genre-links", t().genresFailed, loadGenres);
    }
  }
  async function loadCatalogCount() {
    const countEl = $("catalog-count");
    if (!countEl) return;
    const parent = countEl.parentElement;
    const oldRetry = parent?.querySelector(".anixia-count-retry");
    oldRetry?.remove();
    countEl.setAttribute("aria-live", "polite");
    countEl.setAttribute("aria-busy", "true");
    try {
      const count = await ANIXIA.getCatalogCount();
      countEl.textContent = Number(count).toLocaleString(language() === "ja" ? "ja-JP" : "en-US");
      countEl.removeAttribute("aria-busy");
    } catch (error) {
      console.error(error);
      countEl.textContent = language() === "ja" ? "取得失敗" : "Unavailable";
      countEl.removeAttribute("aria-busy");
      if (parent) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "anixia-retry-button anixia-count-retry";
        retry.textContent = t().retry;
        retry.addEventListener("click", loadCatalogCount, { once: true });
        parent.appendChild(retry);
      }
    }
  }
  async function init() {
    // Independent homepage sections load concurrently so a slow count query
    // cannot delay the latest additions or genre navigation.
    const [userResult] = await Promise.all([
      ANIXIA.getUser().catch(() => null),
      loadCatalogCount(),
      loadSection("popular-works", { sort: "newest", limit: 5 }),
      loadRatings(),
      loadGenres()
    ]);
    $("account-link").textContent = userResult ? t().mypage : t().login;
    $("account-link").href = userResult ? "mypage.html" : "login.html";
  }
  $("hero-search").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = $("search-input").value.trim();
    location.href = "anime.html" + (query ? "?search=" + encodeURIComponent(query) : "");
  });
  window.addEventListener("anixia:languagechange", () => {
    if (window.ANIXIA_RELOAD_HOME) init();
  });
  init();
})();
