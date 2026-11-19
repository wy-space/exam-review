// ===== 雲端同步（Convex）=====
// 同步內容：錯題本、申論熟練度、自己新增的題目、讀書計畫打勾、上次備份時間、練習紀錄
const Sync = (() => {
  const KEYS = ["examhub_wrong", "examhub_rate", "examhub_custom", "cht_done", "cht_start", "cht_skip", "examhub_exams", "examhub_lastbackup"];
  const URL0 = (typeof CONVEX_URL === "string" ? CONVEX_URL : "").trim().replace(/\/+$/, "");
  const META = "examhub_syncmeta";
  const FIXED = (typeof SYNC_CODE === "string" && /^[A-Za-z0-9-]{16,64}$/.test(SYNC_CODE.trim())) ? SYNC_CODE.trim() : "";
  let meta = (() => { try { return JSON.parse(localStorage.getItem(META) || "{}"); } catch (e) { return {}; } })();
  meta = Object.assign({ code: "", kt: {}, pushed: {}, logPushed: 0, logPulled: 0, last: 0 }, meta);
  const save = () => { try { localStorage.setItem(META, JSON.stringify(meta)); } catch (e) {} };
  // 設定檔裡有固定同步碼：自動使用，不用輸入
  if (FIXED && meta.code !== FIXED) { meta = { code: FIXED, kt: {}, pushed: {}, logPushed: 0, logPulled: 0, last: 0 }; save(); }
  let state = "off", err = "", timer = null, busy = false, again = false;
  const listeners = [];
  const emit = () => listeners.forEach(f => { try { f(); } catch (e) {} });
  const enabled = () => !!(URL0 && meta.code && getPw());

  const PWKEY = "examhub_pw";
  const getPw = () => { try { return localStorage.getItem(PWKEY) || ""; } catch (e) { return ""; } };
  async function call(kind, path, args) {
    if (path !== "sync:login") args = Object.assign({ pw: getPw() }, args);
    const body = JSON.stringify({ path, args, format: "json" });
    const r = await fetch(URL0 + "/api/" + kind, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 60000 });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.status !== "success") { const m = j.errorMessage || ("HTTP " + r.status); if (/密碼錯誤/.test(m)) { try { localStorage.removeItem(PWKEY); } catch (e) {} showLock("密碼已變更，請重新輸入"); } throw new Error(m.replace(/^.*Uncaught Error: /s, "").split("\n")[0]); }
    return j.value;
  }
  function genCode() {
    const a = "abcdefghjkmnpqrstuvwxyz23456789", b = new Uint32Array(20); crypto.getRandomValues(b);
    return [...b].map(x => a[x % a.length]).join("").replace(/(.{4})(?=.)/g, "$1-");
  }
  function dirty(k) { if (!KEYS.includes(k)) return; meta.kt[k] = Date.now(); save(); schedule(); }
  function schedule(ms = 2500) { if (!enabled()) return; clearTimeout(timer); timer = setTimeout(run, ms); }

  async function pull() {
    let changed = false;
    // 一般資料
    let since = meta.logPulled || 0, first = true, res;
    do {
      res = await call("query", "sync:pull", { code: meta.code, since });
      if (first) {
        for (const r of res.kv) if (KEYS.includes(r.k) && r.t > (meta.kt[r.k] || 0)) {
          localStorage.setItem(r.k, r.v); meta.kt[r.k] = r.t; meta.pushed[r.k] = r.t; changed = true;
        }
        first = false;
      }
      if (res.logs.length) {
        const local = Log.all(), have = new Set(local.map(x => x.t));
        let add = 0;
        for (const l of res.logs) { if (!have.has(l.t)) { try { local.push(JSON.parse(l.e)); add++; } catch (e) {} } since = Math.max(since, l.t); }
        if (add) { local.sort((a, b) => a.t - b.t); Log.replace(local); changed = true; }
        meta.logPulled = since;
      }
    } while (res.logs.length >= 3000);
    save();
    return changed;
  }
  async function push() {
    const items = KEYS.filter(k => (meta.kt[k] || 0) > (meta.pushed[k] || 0) && localStorage.getItem(k) != null)
      .map(k => ({ k, v: localStorage.getItem(k), t: meta.kt[k] }));
    if (items.length) { await call("mutation", "sync:pushKV", { code: meta.code, items }); items.forEach(i => meta.pushed[i.k] = i.t); save(); }
    const logs = Log.all().filter(x => x.t > (meta.logPushed || 0));
    for (let i = 0; i < logs.length; i += 300) {
      const part = logs.slice(i, i + 300);
      await call("mutation", "sync:pushLogs", { code: meta.code, logs: part.map(x => ({ t: x.t, e: JSON.stringify(x) })) });
      meta.logPushed = part[part.length - 1].t; save();
    }
  }
  function reloadState() {
    try {
      wrong = LS.get("examhub_wrong", {}); rate = LS.get("examhub_rate", {}); custom = LS.get("examhub_custom", { q: [], e: [] });
      if (typeof done !== "undefined") done = LS.get("cht_done", {});
      if (typeof buildBank === "function") buildBank();
      if (typeof initSchedule === "function") initSchedule();
      if (typeof render === "function") render();
    } catch (e) {}
  }
  async function run() {
    if (!enabled()) { state = URL0 ? "nocode" : "off"; emit(); return; }
    if (busy) { again = true; return; }
    busy = true; state = "syncing"; emit();
    try {
      const changed = await pull();
      await push();
      meta.last = Date.now(); save(); state = "ok"; err = "";
      if (changed) reloadState();
    } catch (e) { state = "error"; err = String(e.message || e); }
    busy = false; emit();
    if (again) { again = false; schedule(500); }
  }
  // 第一次開啟同步時：本機已有的資料全部標記成要上傳
  function markAll() { const now = Date.now(); KEYS.forEach(k => { if (localStorage.getItem(k) != null && !meta.kt[k]) meta.kt[k] = now; }); }

  // ===== 密碼鎖 =====
  function showLock(msg) {
    if (!URL0 || document.getElementById("lock")) return;
    const d = document.createElement("div"); d.id = "lock";
    d.innerHTML = `<form class="lockbox"><span class="bk lockbk"><img src="logo.png" alt=""><svg class="pgflip" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 16 C28 2 70 -2 100 6 L100 90 C70 84 30 86 0 98 Z"/><path class="ln" d="M12 40 C40 32 70 32 88 36 M12 58 C40 50 70 50 88 54"/></svg></span><h1>考試複習</h1><p>請輸入密碼</p>
      <input type="password" id="lockpw" autocomplete="current-password" placeholder="密碼">
      <button class="btn pri" type="submit">進入</button><div class="lockmsg">${msg || ""}</div></form>`;
    document.body.appendChild(d); document.documentElement.classList.add("locked");
    setTimeout(() => { const i = document.getElementById("lockpw"); if (i) i.focus(); }, 50);
    d.querySelector("form").onsubmit = async e => {
      e.preventDefault(); const pw = document.getElementById("lockpw").value, m = d.querySelector(".lockmsg");
      if (!pw) { m.textContent = "請輸入密碼"; return; }
      m.textContent = "確認中…";
      try {
        const ok = await call("query", "sync:login", { pw });
        if (!ok) { m.textContent = "密碼不對，再試一次"; return; }
        localStorage.setItem(PWKEY, pw); d.classList.add("out"); document.documentElement.classList.remove("locked");
        setTimeout(() => d.remove(), 450); markAll(); save(); run();
      } catch (err) { m.textContent = "連不上雲端：" + (err.message || err); }
    };
  }
  if (URL0 && !getPw()) { if (document.body) showLock(); else document.addEventListener("DOMContentLoaded", () => showLock()); }
  if (enabled()) { markAll(); save(); setTimeout(run, 600); } else state = URL0 ? "nocode" : "off";
  document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(300); });
  addEventListener("pagehide", () => { if (enabled() && timer) { clearTimeout(timer); run(); } });

  return {
    dirty, schedule, run, on: f => listeners.push(f),
    logout() { try { localStorage.removeItem(PWKEY); } catch (e) {} location.reload(); },
    get fixed() { return !!FIXED; }, get state() { return state; }, get err() { return err; }, get code() { return meta.code; }, get last() { return meta.last; }, get url() { return URL0; },
    create() { meta = { code: genCode(), kt: {}, pushed: {}, logPushed: 0, logPulled: 0, last: 0 }; markAll(); save(); run(); },
    join(code) { code = String(code || "").trim().toLowerCase(); if (!/^[a-z0-9-]{16,64}$/.test(code)) return false;
      meta = { code, kt: {}, pushed: {}, logPushed: 0, logPulled: 0, last: 0 }; markAll(); save(); run(); return true; },
    leave() { meta = { code: "", kt: {}, pushed: {}, logPushed: 0, logPulled: 0, last: 0 }; save(); state = URL0 ? "nocode" : "off"; emit(); },
    markAllNow() { const now = Date.now(); KEYS.forEach(k => { if (localStorage.getItem(k) != null) meta.kt[k] = now; }); meta.logPushed = 0; save(); },
  };
})();

// 上方的雲朵狀態
function syncBadge() {
  const s = Sync.state;
  const map = { off: ["☁", "未開啟雲端同步"], nocode: ["☁", "尚未設定同步碼"], syncing: ["☁…", "同步中"], ok: ["☁✓", "已同步"], error: ["☁!", "同步失敗"] };
  const [ic, tt] = map[s] || map.off;
  return `<a class="syncb ${s}" href="index.html#backup" title="${tt}">${ic}</a>`;
}
function refreshBadge() { document.querySelectorAll(".syncb").forEach(el => el.outerHTML = syncBadge()); }
Sync.on(refreshBadge);

// 雲端同步設定區塊（放在備份頁）
function syncPanelHTML() {
  if (!Sync.url) return `<h2>☁ 雲端同步</h2><p class="small">還沒設定 Convex 網址。部署好後，把網址貼到 <code>sync-config.js</code> 的 CONVEX_URL 再上傳，這裡就會出現同步設定。</p>`;
  const st = { off: "未開啟", nocode: "尚未開啟", syncing: "同步中…", ok: "已同步", error: "同步失敗：" + esc(Sync.err) }[Sync.state] || "";
  if (Sync.fixed) return `<h2>☁ 雲端同步</h2>
    <p class="small">狀態：<b>${st}</b>${Sync.last ? "・上次同步 " + new Date(Sync.last).toLocaleString("zh-TW") : ""}</p>
    <p class="small">已開啟自動同步：任何裝置打開這個網站，錯題本、申論熟練度、自己新增的題目和練習紀錄都會自動同步，不用輸入任何東西。</p>
    <div class="toolbar"><button class="btn pri" id="sy-now">立即同步</button><button class="btn sm" id="sy-logout">登出這台裝置</button><span id="sy-msg" class="small"></span></div>
    <p class="small muted">登出後，這台裝置下次打開要重新輸入密碼。</p>`;
  if (!Sync.code) return `<h2>☁ 雲端同步</h2>
    <p class="small">開啟後，錯題本、申論熟練度、自己新增的題目和練習紀錄會自動存到雲端。換手機時輸入同步碼就能找回。</p>
    <div class="toolbar"><button class="btn pri" id="sy-new">第一次使用：建立同步碼</button></div>
    <p class="small muted">已經在別的裝置建立過？輸入那組同步碼：</p>
    <div class="toolbar"><input id="sy-code" placeholder="xxxx-xxxx-xxxx-xxxx-xxxx" style="flex:1;min-width:200px"><button class="btn" id="sy-join">連接</button><span id="sy-msg" class="small"></span></div>`;
  return `<h2>☁ 雲端同步</h2>
    <p class="small">狀態：<b>${st}</b>${Sync.last ? "・上次同步 " + new Date(Sync.last).toLocaleString("zh-TW") : ""}</p>
    <p class="small">你的同步碼（請截圖或抄下來，換手機時要用）：</p>
    <div class="code-box">${esc(Sync.code)}</div>
    <div class="toolbar"><button class="btn pri" id="sy-now">立即同步</button><button class="btn sm" id="sy-copy">複製同步碼</button><button class="btn sm" id="sy-leave">這台裝置停止同步</button><span id="sy-msg" class="small"></span></div>
    <p class="small muted">同步碼就像鑰匙，拿到的人看得到你的練習紀錄，不要公開分享。</p>`;
}
function bindSyncPanel(rerender) {
  const g = id => document.getElementById(id);
  if (g("sy-new")) g("sy-new").onclick = () => { Sync.create(); rerender(); };
  if (g("sy-join")) g("sy-join").onclick = () => { if (Sync.join(g("sy-code").value)) rerender(); else g("sy-msg").textContent = "同步碼格式不對"; };
  if (g("sy-now")) g("sy-now").onclick = () => Sync.run();
  if (g("sy-logout")) g("sy-logout").onclick = () => Sync.logout();
  if (g("sy-copy")) g("sy-copy").onclick = async () => { try { await navigator.clipboard.writeText(Sync.code); g("sy-msg").textContent = "已複製"; } catch (e) { g("sy-msg").textContent = "請手動抄下"; } };
  if (g("sy-leave")) g("sy-leave").onclick = () => { Sync.leave(); rerender(); };
  if (bindSyncPanel.on) return; bindSyncPanel.on = true;
  Sync.on(() => { const p = document.getElementById("syncpanel"); if (p && !p.contains(document.activeElement)) { p.innerHTML = syncPanelHTML(); bindSyncPanel(rerender); } });
}
