(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { page: 1, perPage: 50, users: [], reviews: [], posts: [], filter: "all", busy: false };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const dateText = (value) => value ? new Date(value).toLocaleString("ja-JP") : "記録なし";
  const profileName = (author) => author?.profile?.display_name || author?.profile?.username || "ユーザー";
  async function invoke(action, extra = {}) {
    const { data, error } = await ANIXIA.getClient().functions.invoke("admin-user-management", { body: { action, ...extra } });
    if (error) throw new Error(data?.error || error.message || "管理者処理に失敗しました。");
    if (data?.error) throw new Error(data.error);
    return data;
  }
  function renderUsers() {
    const q = $("user-search").value.trim().toLocaleLowerCase();
    const rows = state.users.filter((u) => {
      const p = u.profile || {};
      return [u.email, p.username, p.display_name, u.id].some((v) => String(v || "").toLocaleLowerCase().includes(q));
    });
    $("users-list").innerHTML = rows.length ? rows.map((u) => {
      const p = u.profile || {};
      const isBanned = !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();
      const status = u.is_admin ? "管理者" : isBanned ? "利用停止中" : "利用可能";
      const action = u.is_admin
        ? '<span class="admin-meta">管理者アカウントは操作対象外</span>'
        : isBanned
          ? '<button class="admin-button" type="button" data-user-unban="'+esc(u.id)+'">利用停止を解除</button>'
          : '<select data-user-duration="'+esc(u.id)+'" aria-label="停止期間"><option value="1d">1日</option><option value="7d" selected>7日</option><option value="30d">30日</option></select><button class="admin-button danger" data-user-ban="'+esc(u.id)+'" type="button">利用停止</button>';
      return '<article class="admin-item"><h3>'+esc(p.display_name || p.username || u.email || "名前未設定")+'</h3>'+
        '<p>'+esc(u.email || "メールアドレスなし")+'</p>'+
        '<p class="admin-meta">状態：'+status+'　／　登録：'+dateText(u.created_at)+'　／　最終ログイン：'+dateText(u.last_sign_in_at)+'</p>'+
        (isBanned ? '<p class="admin-meta">停止期限：'+dateText(u.banned_until)+'</p>' : '')+
        '<p class="admin-meta">ユーザーID：'+esc(u.id)+'</p><div class="admin-actions">'+action+'</div></article>';
    }).join("") : '<div class="admin-empty">該当するユーザーはいません。</div>';
    $("users-page").textContent = state.page + "ページ目";
    $("users-prev").disabled = state.page <= 1 || state.busy;
    $("users-next").disabled = state.users.length < state.perPage || state.busy;
  }
  async function loadUsers() {
    if (state.busy) return;
    state.busy = true;
    $("users-message").textContent = "ユーザー一覧を取得しています…";
    $("refresh-users").disabled = true;
    try {
      const result = await invoke("list_users", { page: state.page, perPage: state.perPage });
      state.users = result.users || [];
      $("users-message").textContent = state.users.length + "件を表示しています。";
    } catch (error) {
      state.users = [];
      $("users-list").innerHTML = '<div class="admin-empty">ユーザー一覧を取得できませんでした。</div>';
      $("users-message").textContent = error.message;
    } finally {
      state.busy = false;
      $("refresh-users").disabled = false;
      renderUsers();
    }
  }
  async function setBan(userId, duration) {
    const label = duration === "unban" ? "利用停止を解除" : "このアカウントを"+({ "1d":"1日","7d":"7日","30d":"30日" }[duration])+"停止";
    if (!window.confirm(label+"しますか？")) return;
    try {
      $("users-message").textContent = "アカウント状態を更新しています…";
      await invoke("set_user_ban", { userId, duration });
      await loadUsers();
      $("users-message").textContent = "アカウント状態を更新しました。";
    } catch (error) { $("users-message").textContent = error.message; }
  }
  function renderPosts() {
    const reviewCards = state.reviews.map((r) => {
      const anime = Array.isArray(r.anime) ? r.anime[0] : r.anime;
      const hidden = !r.is_published;
      return { type:"review", created_at:r.created_at,
        html:'<article class="admin-item"><h3>レビュー：'+esc(r.title || anime?.title_ja || anime?.title || "作品名不明")+'</h3>'+
        '<p>'+esc(r.body)+'</p><p class="admin-meta">投稿者：'+esc(profileName(r.author))+'（'+esc(r.author?.email || "メール不明")+'）</p>'+
        '<p class="admin-meta">投稿日：'+dateText(r.created_at)+'　／　ネタバレ：'+(r.spoiler ? "あり" : "なし")+'　／　状態：'+(hidden ? "非表示" : "公開中")+'</p>'+
        '<div class="admin-actions"><button class="admin-button '+(hidden ? "" : "danger")+'" data-review-toggle="'+esc(r.id)+'" data-publish="'+String(hidden)+'" type="button">'+(hidden ? "公開する" : "非表示にする")+'</button></div></article>'
      };
    });
    const postCards = state.posts.map((p) => {
      const hidden = !!p.deleted_at;
      return { type:"post", created_at:p.created_at,
        html:'<article class="admin-item"><h3>コミュニティ投稿</h3>'+
        '<p>'+esc(p.body || (p.attachment_url ? "添付ファイル付き投稿" : "本文なし"))+'</p>'+
        (p.attachment_url ? '<p><a href="'+esc(p.attachment_url)+'" target="_blank" rel="noopener noreferrer">添付ファイルを確認</a></p>' : '')+
        '<p class="admin-meta">投稿者：'+esc(profileName(p.author))+'（'+esc(p.author?.email || "メール不明")+'）</p>'+
        '<p class="admin-meta">投稿日：'+dateText(p.created_at)+'　／　状態：'+(hidden ? "非表示" : "公開中")+(p.reply_to_id ? "　／　返信" : "")+(p.quote_post_id ? "　／　引用" : "")+'</p>'+
        '<div class="admin-actions"><button class="admin-button '+(hidden ? "" : "danger")+'" data-post-toggle="'+esc(p.id)+'" data-hidden="'+String(!hidden)+'" type="button">'+(hidden ? "再表示する" : "非表示にする")+'</button></div></article>'
      };
    });
    const all = [...reviewCards, ...postCards].filter((item) =>
      state.filter === "all" || (state.filter === "reviews" ? item.type === "review" : item.type === "post")
    ).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    $("posts-list").innerHTML = all.length ? all.map((x) => x.html).join("") : '<div class="admin-empty">該当する投稿はありません。</div>';
    document.querySelectorAll("[data-post-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.postFilter === state.filter)));
  }
  async function loadPosts() {
    $("posts-message").textContent = "投稿を取得しています…";
    $("refresh-posts").disabled = true;
    try {
      const result = await invoke("list_posts");
      state.reviews = result.reviews || [];
      state.posts = result.posts || [];
      renderPosts();
      $("posts-message").textContent = "レビュー"+state.reviews.length+"件、コミュニティ投稿"+state.posts.length+"件を取得しました（各最大100件）。";
    } catch (error) {
      $("posts-list").innerHTML = '<div class="admin-empty">投稿を取得できませんでした。</div>';
      $("posts-message").textContent = error.message;
    } finally { $("refresh-posts").disabled = false; }
  }
  async function moderateReview(reviewId, publish) {
    if (!window.confirm((publish ? "レビューを公開" : "レビューを非表示")+"にしますか？")) return;
    try {
      $("posts-message").textContent = "レビューを更新しています…";
      await invoke("moderate_review", { reviewId, publish });
      await loadPosts();
      $("posts-message").textContent = "レビューを更新しました。";
    } catch (error) { $("posts-message").textContent = error.message; }
  }
  async function moderatePost(postId, hidden) {
    if (!window.confirm((hidden ? "投稿を非表示" : "投稿を再表示")+"にしますか？")) return;
    try {
      $("posts-message").textContent = "投稿を更新しています…";
      await invoke("moderate_post", { postId, hidden });
      await loadPosts();
      $("posts-message").textContent = "投稿を更新しました。";
    } catch (error) { $("posts-message").textContent = error.message; }
  }
  async function init() {
    try {
      const user = await ANIXIA.getUser();
      if (!user) { $("admin-status").textContent = "ログインが必要です。"; return; }
      $("user-id").textContent = user.id;
      const isAdmin = await ANIXIA.isAdmin();
      if (!isAdmin) {
        $("admin-status").textContent = "ログイン済みですが、管理者権限がありません。";
        $("admin-setup").hidden = false;
        return;
      }
      $("admin-status").textContent = "管理者としてログインしています。";
      $("admin-tools").hidden = false;
      await Promise.all([loadUsers(), loadPosts()]);
    } catch (error) {
      console.error(error);
      $("admin-status").textContent = "管理者状態を確認できませんでした。";
    }
  }
  $("refresh-users").addEventListener("click", () => loadUsers());
  $("user-search").addEventListener("input", renderUsers);
  $("users-prev").addEventListener("click", () => { if (state.page > 1) { state.page--; loadUsers(); } });
  $("users-next").addEventListener("click", () => { if (state.users.length === state.perPage) { state.page++; loadUsers(); } });
  $("refresh-posts").addEventListener("click", loadPosts);
  document.addEventListener("click", (event) => {
    const target = event.target;
    const ban = target.closest("[data-user-ban]");
    const unban = target.closest("[data-user-unban]");
    const review = target.closest("[data-review-toggle]");
    const post = target.closest("[data-post-toggle]");
    const filter = target.closest("[data-post-filter]");
    if (ban) {
      const id = ban.dataset.userBan;
      const duration = document.querySelector('[data-user-duration="'+CSS.escape(id)+'"]')?.value || "7d";
      setBan(id, duration);
    } else if (unban) setBan(unban.dataset.userUnban, "unban");
    else if (review) moderateReview(review.dataset.reviewToggle, review.dataset.publish === "true");
    else if (post) moderatePost(post.dataset.postToggle, post.dataset.hidden === "true");
    else if (filter) { state.filter = filter.dataset.postFilter; renderPosts(); }
  });
  init();
})();