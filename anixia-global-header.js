(() => {
  "use strict";
  if (window.__ANIXIA_GLOBAL_HEADER_INSTALLED__) return;
  window.__ANIXIA_GLOBAL_HEADER_INSTALLED__ = true;
  const ROOT = "/anixia/";
  const navItems = [
    ["作品一覧", "anime.html"],
    ["作品を探す", "discover.html"],
    ["人物・団体", "entities.html"],
    ["今期アニメ", "season.html"],
    ["ジャンル", "genres.html"],
    ["ランキング", "ranking.html"],
    ["おすすめ診断", "recommendations.html"],
    ["クイズ", "quiz.html"],
    ["作品比較", "compare.html"],
    ["コミュニティ", "community.html"],
    ["ユーザー検索", "user-search.html"],
    ["メッセージ", "messages.html"],
  ];

  function addStyles() {
    if (!document.querySelector('link[data-anixia-screen-system="true"]')) {
      const designSystem = document.createElement("link");
      designSystem.rel = "stylesheet";
      designSystem.href = ROOT + "anixia-screen-system.css?v=20261121-3";
      designSystem.dataset.anixiaScreenSystem = "true";
      document.head.appendChild(designSystem);
    }
    if (!document.querySelector('link[data-anixia-theme-styles="true"]')) {
      const themeStyle = document.createElement("link");
      themeStyle.rel = "stylesheet";
      themeStyle.href = ROOT + "anixia-theme.css?v=20261122-1";
      themeStyle.dataset.anixiaThemeStyles = "true";
      document.head.appendChild(themeStyle);
    }
    if (document.getElementById("anixia-global-header-style")) return;
    const style = document.createElement("style");
    style.id = "anixia-global-header-style";
    style.textContent = `
      .site-header,.anixia-global-header{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:9999!important;width:100%!important;background:#000!important;color:#fff!important;border:0!important;border-bottom:1px solid #222!important;box-shadow:none!important}
      .anixia-global-header-inner{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-rows:auto auto!important;align-items:center!important;column-gap:18px!important;row-gap:7px!important;width:100%!important;max-width:none!important;min-height:0!important;margin:0!important;padding:10px 24px!important;box-sizing:border-box!important;text-align:left!important}
      .anixia-global-header .anixia-logo{display:inline-flex!important;flex:0 0 auto!important;color:#03AF6A!important;text-decoration:none!important;font:850 25px/1 Inter,"Segoe UI",Arial,sans-serif!important;letter-spacing:0!important;word-spacing:0!important;gap:0!important;white-space:nowrap!important}
      .anixia-global-header .anixia-logo-xia{color:#1DA1F2!important}
      .anixia-global-nav{grid-column:1 / -1!important;grid-row:2!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:3px!important;flex-wrap:nowrap!important;width:100%!important;min-width:0!important;overflow-x:auto!important;scrollbar-width:none!important}
      .anixia-global-nav::-webkit-scrollbar{display:none!important}
      .anixia-global-nav a{display:inline-flex!important;align-items:center!important;min-height:36px!important;padding:7px 8px!important;border-radius:5px!important;color:#fff!important;background:transparent!important;text-decoration:none!important;font-size:12px!important;font-weight:650!important;white-space:nowrap!important}
      .anixia-global-nav a,.anixia-global-nav a:visited,.anixia-global-nav a:hover,.anixia-global-nav a:focus,.anixia-global-nav a[aria-current="page"]{color:#FFFFFF!important;opacity:1!important;background:transparent!important}
      .anixia-global-nav a:hover,.anixia-global-nav a[aria-current="page"]{background:rgba(255,255,255,.07)!important}
      .anixia-header-actions{grid-column:2!important;grid-row:1!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;flex:0 0 auto!important;margin:0!important}
      .anixia-header-actions .anixia-header-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:36px!important;padding:0 12px!important;border:1px solid #03AF6A!important;border-radius:6px!important;background:#03AF6A!important;color:#fff!important;text-decoration:none!important;font-family:inherit!important;font-size:12px!important;font-weight:750!important;white-space:nowrap!important;cursor:pointer!important}
      .anixia-header-actions .anixia-header-button:hover{background:#028f56!important;border-color:#028f56!important;color:#FFFFFF!important}
      .anixia-header-actions #account-link,.anixia-header-actions #account-link:visited,.anixia-header-actions #account-link:hover{color:#FFFFFF!important}
      .anixia-header-actions [hidden]{display:none!important}
      .anixia-menu-toggle{display:none!important}
      footer.anixia-global-footer{display:block!important;width:100%!important;margin:64px 0 0!important;padding:0!important;background:#000!important;color:#fff!important;border:0!important;border-top:1px solid #222!important;box-shadow:none!important}
      .anixia-footer-inner{width:100%!important;max-width:1200px!important;margin:0!important;padding:28px 18px 18px!important;box-sizing:border-box!important;text-align:left!important}
      .anixia-footer-main{margin:0 0 18px!important}
      .anixia-footer-logo{display:inline-flex!important;align-items:center!important;gap:0!important;color:#03AF6A!important;text-decoration:none!important;font:850 24px/1 Inter,"Segoe UI",Arial,sans-serif!important;letter-spacing:0!important;word-spacing:0!important}
      .anixia-footer-logo .anixia-logo-xia{color:#1DA1F2!important}
      .anixia-footer-nav{display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;gap:9px 18px!important;padding:0 0 16px!important;border:0!important}
      .anixia-footer-nav a{color:#fff!important;text-decoration:none!important;font-size:12px!important}
      .anixia-footer-nav a:hover{color:#fff!important}
      .anixia-footer-bottom{display:flex!important;justify-content:flex-start!important;padding-top:12px!important;border-top:1px solid #222!important;color:#fff!important;font-size:10px!important}
      .anixia-admin-login{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;margin-top:8px!important;padding:0 10px!important;border:1px solid #03AF6A!important;border-radius:6px!important;color:#fff!important;background:#03AF6A!important;font-size:11px!important;font-weight:750!important;text-decoration:none!important;opacity:1!important;cursor:pointer!important}.anixia-admin-login:hover{background:#028f56!important;border-color:#028f56!important;color:#fff!important}
      .anixia-admin-login,.anixia-admin-login:visited,.anixia-admin-login:hover,.anixia-admin-login:focus,.anixia-admin-login:active{color:#000!important;background:#000!important;background-color:#000!important;border-color:#000!important;outline:none!important;box-shadow:none!important;opacity:1!important}
      @media(max-width:900px){
        .anixia-global-header-inner{grid-template-columns:minmax(0,1fr) auto!important;grid-template-rows:auto auto!important;gap:7px 12px!important;padding:9px 18px!important}
        .anixia-global-nav{grid-column:1 / -1!important;grid-row:2!important;width:100%!important}
        .anixia-global-nav a{padding:6px 8px!important}
        .anixia-header-actions{grid-column:2!important;grid-row:1!important;margin:0!important}
      }
      /* Mobile header: compact controls with an accessible collapsible navigation. */
      @media(max-width:760px){
        .anixia-global-header-inner{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:8px!important;width:100%!important;min-height:0!important;padding:9px 12px!important;box-sizing:border-box!important;position:relative!important}
        .anixia-global-header .anixia-logo{font-size:23px!important;flex:0 0 auto!important}
        .anixia-header-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:0 1 auto!important;gap:5px!important;min-width:0!important;margin:0!important}
        .anixia-header-actions .anixia-header-button{flex:0 1 auto!important;min-width:0!important;min-height:35px!important;padding:0 9px!important;font-size:11px!important;white-space:nowrap!important}
        .anixia-menu-toggle{display:inline-flex!important;gap:5px!important;align-items:center!important}
        .anixia-global-nav{display:none!important;position:absolute!important;top:100%!important;left:0!important;right:0!important;z-index:10000!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:2px!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:8px 12px 14px!important;overflow-y:auto!important;overflow-x:hidden!important;max-height:70vh!important;box-sizing:border-box!important;background:#050505!important;border-bottom:1px solid #292929!important;box-shadow:0 12px 24px rgba(0,0,0,.24)!important}
        .anixia-global-header[data-menu-open="true"] .anixia-global-nav{display:flex!important}
        .anixia-global-nav a{display:flex!important;align-items:center!important;min-height:40px!important;padding:9px 12px!important;border-radius:6px!important;font-size:13px!important;white-space:normal!important}
      }
      @media(max-width:420px){
        .anixia-global-header .anixia-logo{font-size:21px!important}
        .anixia-header-actions{gap:4px!important}
        .anixia-header-actions .anixia-header-button{min-height:32px!important;padding:0 7px!important;font-size:10px!important}
        .anixia-menu-label{display:none!important}
      }
      /* Responsive footer: keep it in document flow so it never covers page content. */
      .anixia-global-footer{position:static!important;inset:auto!important;z-index:auto!important;width:100%!important;margin:48px 0 0!important;max-height:none!important;overflow:visible!important}
      .anixia-footer-inner{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px 18px!important;width:100%!important;max-width:1200px!important;margin:0 auto!important;padding:18px 20px!important;box-sizing:border-box!important}
      .anixia-footer-main{flex:0 0 auto!important;margin:0!important}
      .anixia-footer-logo{font-size:21px!important}
      .anixia-footer-nav{display:flex!important;align-items:center!important;justify-content:flex-start!important;flex:1 1 420px!important;flex-wrap:wrap!important;gap:8px 16px!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;overflow:visible!important}
      .anixia-footer-nav a{flex:0 0 auto!important;white-space:normal!important;font-size:11px!important}
      .anixia-footer-bottom{flex:0 1 auto!important;padding:0!important;border:0!important;white-space:normal!important;font-size:10px!important}
      .anixia-global-footer .anixia-admin-login{flex:0 0 auto!important;margin:0!important;min-height:30px!important;padding:0 9px!important;font-size:10px!important}
      @media(max-width:760px){
        .anixia-footer-inner{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:10px!important;padding:14px!important}
        .anixia-footer-logo{font-size:19px!important}
        .anixia-footer-nav{flex:0 1 auto!important;width:100%!important;gap:9px 14px!important}
        .anixia-footer-nav a{font-size:10px!important}
        .anixia-footer-bottom{white-space:normal!important}
      }
      @media(max-width:360px){
        .anixia-footer-inner{gap:8px!important;padding:12px 9px!important}
        .anixia-footer-logo{font-size:17px!important}
        .anixia-global-footer .anixia-admin-login{font-size:9px!important;padding:0 7px!important}
        .anixia-footer-nav{gap:7px 11px!important}
        .anixia-footer-nav a{font-size:9px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installHeader() {
    // Remove every page-specific header before creating the single shared header.
    document.querySelectorAll("body > header, header.site-header, header.anixia-global-header").forEach(node => node.remove());
    // Remove stale page-specific My Page controls; the account link is the single My Page entry.
    document.querySelectorAll("#mypage-link").forEach(node => node.remove());
    const header = document.createElement("header");
    header.className = "site-header anixia-global-header";
    header.setAttribute("role", "banner");
    header.style.setProperty("position", "fixed", "important");
    header.style.setProperty("top", "0px", "important");
    header.style.setProperty("left", "0px", "important");
    header.style.setProperty("right", "0px", "important");
    
    header.style.setProperty("z-index", "2147483647", "important");
    header.style.setProperty("width", "100%", "important");
    header.style.setProperty("transform", "none", "important");
    header.style.setProperty("background", "#000000", "important");
    header.style.setProperty("background-color", "#000000", "important");
    header.style.setProperty("color", "#FFFFFF", "important");
    header.innerHTML = `
      <div class="anixia-global-header-inner">
        <a class="anixia-logo" href="${ROOT}" aria-label="ANIXIA ホーム">ANI<span class="anixia-logo-xia">XIA</span></a>
        <nav class="anixia-global-nav" id="anixia-global-nav" aria-label="メインナビゲーション">
          ${navItems.map(([label,path]) => `<a href="${ROOT}${path}">${label}</a>`).join("")}
        </nav>
        <div class="anixia-header-actions">
          <a class="anixia-header-button" id="account-link" href="${ROOT}login.html">ログイン</a>
          <button class="anixia-header-button" id="home-logout" type="button" hidden>ログアウト</button>
          <button class="anixia-header-button" id="anixia-theme-toggle" type="button" aria-label="ダークモードに切り替え" title="テーマを切り替え">☾</button>
          <button class="anixia-header-button anixia-menu-toggle" id="anixia-menu-toggle" type="button" aria-expanded="false" aria-controls="anixia-global-nav" aria-label="メニューを開く"><span aria-hidden="true">☰</span><span class="anixia-menu-label">メニュー</span></button>
          <button class="anixia-header-button" id="language-toggle" type="button">EN</button>
        </div>
      </div>`;
    header.querySelectorAll(".anixia-global-nav a").forEach(a => {
      a.style.setProperty("color", "#FFFFFF", "important");
      a.style.setProperty("opacity", "1", "important");
    });
    header.querySelectorAll(".anixia-header-actions .anixia-header-button").forEach(a => a.style.setProperty("color", "#FFFFFF", "important"));
    const logo = header.querySelector(".anixia-logo");
    if (logo) logo.style.setProperty("color", "#03AF6A", "important");
    const logoAccent = header.querySelector(".anixia-logo-xia");
    if (logoAccent) logoAccent.style.setProperty("color", "#1DA1F2", "important");
    const current = location.pathname.replace(/^.*\/anixia\//, "");
    header.querySelectorAll(".anixia-global-nav a").forEach(a => {
      const path = a.getAttribute("href").replace(ROOT, "");
      if (path === current || (!path && !current)) a.setAttribute("aria-current", "page");
    });
    installTheme(header);
    const language = header.querySelector("#language-toggle");
    language.textContent = (localStorage.getItem("anixia-language") || "ja") === "ja" ? "EN" : "日本語";
    language.addEventListener("click", () => {
      const next = (localStorage.getItem("anixia-language") || "ja") === "ja" ? "en" : "ja";
      if (window.ANIXIA_SET_LANGUAGE) window.ANIXIA_SET_LANGUAGE(next);
      else { localStorage.setItem("anixia-language", next); location.reload(); }
    });

    const menuButton = header.querySelector("#anixia-menu-toggle");
    const closeMenu = () => {
      header.dataset.menuOpen = "false";
      menuButton?.setAttribute("aria-expanded", "false");
      menuButton?.setAttribute("aria-label", "メニューを開く");
      const label = menuButton?.querySelector(".anixia-menu-label");
      if (label) label.textContent = "メニュー";
    };
    menuButton?.addEventListener("click", () => {
      const open = header.dataset.menuOpen !== "true";
      header.dataset.menuOpen = String(open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      const label = menuButton.querySelector(".anixia-menu-label");
      if (label) label.textContent = open ? "閉じる" : "メニュー";
    });
    header.querySelectorAll(".anixia-global-nav a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 760) closeMenu(); }, {passive:true});
    // Keep the fixed header in the body; never reparent it during scrolling.
    document.body.prepend(header);
    const removeDuplicateMyPageLinks = () => document.querySelectorAll("#mypage-link").forEach(node => { if (!header.contains(node)) node.remove(); });
    removeDuplicateMyPageLinks();
    const duplicateObserver = new MutationObserver(removeDuplicateMyPageLinks);
    duplicateObserver.observe(document.body, {childList:true,subtree:true});
    const updateHeaderSpace = () => {
      header.style.setProperty("position", "fixed", "important");
      header.style.setProperty("top", "0", "important");
      header.style.setProperty("left", "0", "important");
      header.style.setProperty("right", "0", "important");
      header.style.setProperty("width", "100%", "important");
      header.style.setProperty("z-index", "2147483647", "important");
      document.documentElement.style.setProperty("--anixia-header-height", header.offsetHeight + "px");
      document.body.style.setProperty("padding-top", header.offsetHeight + "px", "important");
    };
    updateHeaderSpace();
    if (window.ResizeObserver) new ResizeObserver(updateHeaderSpace).observe(header);
    window.addEventListener("resize", updateHeaderSpace, {passive:true});
    window.addEventListener("orientationchange", updateHeaderSpace, {passive:true});
    window.addEventListener("pageshow", updateHeaderSpace);
    setupAuth(header);
  }

  function installTheme(header) {
    const button = header.querySelector("#anixia-theme-toggle");
    let theme = "light";
    try { theme = localStorage.getItem("anixia-theme") === "dark" ? "dark" : "light"; } catch (_) {}
    const apply = next => {
      theme = next === "dark" ? "dark" : "light";
      document.documentElement.dataset.anixiaTheme = theme;
      try { localStorage.setItem("anixia-theme", theme); } catch (_) {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme === "dark" ? "#0b1220" : "#ffffff");
      if (button) {
        button.textContent = theme === "dark" ? "☀" : "☾";
        button.setAttribute("aria-label", theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え");
        button.setAttribute("aria-pressed", String(theme === "dark"));
        button.title = theme === "dark" ? "ライトモード" : "ダークモード";
      }
    };
    apply(theme);
    button?.addEventListener("click", () => apply(theme === "dark" ? "light" : "dark"));
  }

  function loadScript(src, marker) {
    return new Promise((resolve,reject) => {
      const existing = document.querySelector(`script[${marker}]`);
      if (existing?.dataset.loaded === "true") return resolve();
      const script = existing || document.createElement("script");
      if (!existing) {
        script.src = src;
        script.async = true;
        script.setAttribute(marker, "");
        document.head.appendChild(script);
      }
      script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, {once:true});
      script.addEventListener("error", reject, {once:true});
      if (existing && (window.supabase || window.ANIXIA)) resolve();
    });
  }

  async function setupAuth(header) {
    const login = header.querySelector("#account-link");
    const logout = header.querySelector("#home-logout");
    const render = user => {
      const signedIn = !!(user && !user.is_anonymous);
      // 未ログイン時はログイン、ログイン済みの場合はマイページを表示する。
      login.hidden = false;
      login.href = ROOT + (signedIn ? "mypage.html" : "login.html");
      login.textContent = signedIn ? "マイページ" : "ログイン";
      login.setAttribute("aria-label", signedIn ? "マイページ" : "ログイン");
      logout.hidden = !signedIn;
    };
    try {
      if (!window.supabase) {
        await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", "data-anixia-supabase-sdk");
      }
      if (!window.ANIXIA || typeof window.ANIXIA.getClient !== "function") {
        await loadScript(ROOT + "anixia-client.js?v=20261122-timeout-1", "data-anixia-auth-client");
      }
      const client = window.ANIXIA.getClient();
      const {data,error} = await client.auth.getUser();
      if (error) throw error;
      render(data?.user || null);
      client.auth.onAuthStateChange((_event,session) => render(session?.user || null));
      logout.addEventListener("click", async () => {
        logout.disabled = true;
        logout.textContent = "ログアウト中…";
        try {
          const {error:signOutError} = await client.auth.signOut();
          if (signOutError) throw signOutError;
          location.href = ROOT;
        } catch (error) {
          console.error("ANIXIA logout failed",error);
          logout.disabled = false;
          logout.textContent = "ログアウト";
          alert("ログアウトできませんでした。時間をおいて再度お試しください。");
        }
      });
    } catch (error) {
      console.warn("ANIXIA authentication status unavailable",error);
      render(null);
    }
  }

  function installFooter() {
    const existing = document.querySelector("footer");
    const footer = existing || document.createElement("footer");
    footer.className = "anixia-global-footer";
    footer.style.setProperty("background", "#000000", "important");
    footer.style.setProperty("background-color", "#000000", "important");
    footer.style.setProperty("color", "#FFFFFF", "important");
    footer.style.setProperty("width", "100%", "important");
    footer.style.setProperty("position", "fixed", "important");
    footer.style.setProperty("left", "0", "important");
    footer.style.setProperty("right", "0", "important");
    footer.style.setProperty("bottom", "0", "important");
    footer.style.setProperty("z-index", "2147482999", "important");
    
    footer.style.setProperty("margin", "0", "important");
    footer.style.setProperty("max-height", "none", "important");
    footer.style.setProperty("overflow", "visible", "important");
    footer.innerHTML = `
      <div class="anixia-footer-inner">
        <div class="anixia-footer-main"><a class="anixia-footer-logo" href="${ROOT}" aria-label="ANIXIA ホーム">ANI<span class="anixia-logo-xia">XIA</span></a></div>
        <nav class="anixia-footer-nav" aria-label="フッターナビゲーション">
          <a href="${ROOT}data-sources.html">データ出典</a>
          <a href="${ROOT}terms.html">利用規約</a>
          <a href="${ROOT}privacy.html">プライバシーポリシー</a>
          <a href="${ROOT}operator.html">運営情報</a>
          <a href="https://x.com/anime_love_p" target="_blank" rel="noopener noreferrer">お問い合わせ</a>
        </nav>
        <div class="anixia-footer-bottom">© ANIXIA</div>
        <a class="anixia-admin-login" href="${ROOT}admin-login.html" aria-label="管理者ログイン">管理者ログイン</a>
      </div>`;
    document.querySelectorAll("footer").forEach(node => { if (node !== footer) node.remove(); });
    document.body.appendChild(footer);
    const updateFooterSpace = () => {
      footer.style.setProperty("position", "fixed", "important");
      footer.style.setProperty("left", "0", "important");
      footer.style.setProperty("right", "0", "important");
      footer.style.setProperty("bottom", "0", "important");
      footer.style.setProperty("width", "100%", "important");
      footer.style.setProperty("z-index", "2147482999", "important");
      footer.style.setProperty("max-height", "none", "important");
      footer.style.setProperty("overflow", "visible", "important");
      footer.style.setProperty("box-sizing", "border-box", "important");
      const height = footer.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--anixia-footer-height", height + "px");
      document.body.style.setProperty("padding-bottom", (height + 16) + "px", "important");
    };
    updateFooterSpace();
    if (window.ResizeObserver) new ResizeObserver(updateFooterSpace).observe(footer);
    window.addEventListener("resize", updateFooterSpace, {passive:true});
    window.addEventListener("orientationchange", updateFooterSpace, {passive:true});
    window.addEventListener("pageshow", updateFooterSpace);
  }

  function installBreadcrumb() {
    const path = location.pathname.split("/").pop() || "index.html";
    if (path === "index.html" || document.querySelector(".anixia-breadcrumb")) return;
    const main = document.querySelector("main");
    if (!main) return;
    const labels = {
      "anime.html":"作品データベース","anime-detail.html":"作品詳細","season.html":"今期アニメ",
      "ranking.html":"ランキング","recommendations.html":"おすすめ診断","quiz.html":"クイズ",
      "quiz-play.html":"クイズに挑戦","mypage.html":"マイページ","community.html":"コミュニティ",
      "discover.html":"作品を探す","entities.html":"人物・団体","entity-detail.html":"人物・団体の詳細",
      "login.html":"ログイン","signup.html":"新規登録","terms.html":"利用規約",
      "privacy.html":"プライバシーポリシー","operator.html":"運営情報","data-sources.html":"データ出典",
      "genres.html":"ジャンル","compare.html":"作品比較","profile.html":"プロフィール",
      "user-search.html":"ユーザー検索","messages.html":"メッセージ","memo.html":"メモ"
    };
    const label = labels[path] || (document.title.split(/[｜|]/)[0] || "ANIXIA").trim();
    const nav = document.createElement("nav");
    nav.className = "anixia-breadcrumb";
    nav.setAttribute("aria-label", "パンくずリスト");
    const list = document.createElement("ol");
    const addItem = (text, href, current) => {
      const item = document.createElement("li");
      if (href) {
        const link = document.createElement("a");
        link.href = ROOT + href;
        link.textContent = text;
        item.appendChild(link);
      } else {
        const span = document.createElement("span");
        span.textContent = text;
        if (current) span.setAttribute("aria-current", "page");
        item.appendChild(span);
      }
      list.appendChild(item);
    };
    addItem("トップ", "index.html", false);
    if (path === "anime-detail.html") {
      addItem("作品データベース", "anime.html", false);
      const h1 = main.querySelector("h1");
      addItem(h1?.textContent?.trim() || label, "", true);
      const current = list.querySelector('[aria-current="page"]');
      if (h1 && current) new MutationObserver(() => { const text = h1.textContent.trim(); if (text) current.textContent = text; }).observe(h1, {childList:true,subtree:true,characterData:true});
    } else if (path === "entity-detail.html") {
      addItem("人物・団体", "entities.html", false);
      const h1 = main.querySelector("h1");
      addItem(h1?.textContent?.trim() || label, "", true);
      const current = list.querySelector('[aria-current="page"]');
      if (h1 && current) new MutationObserver(() => { const text = h1.textContent.trim(); if (text) current.textContent = text; }).observe(h1, {childList:true,subtree:true,characterData:true});
    } else if (["profile.html","messages.html","user-search.html"].includes(path)) {
      addItem("コミュニティ", "community.html", false);
      addItem(label, "", true);
    } else {
      addItem(label, "", true);
    }
    nav.appendChild(list);
    main.parentNode.insertBefore(nav, main);
  }

  function init() {
    addStyles();
    installHeader();
    installBreadcrumb();
    installFooter();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();