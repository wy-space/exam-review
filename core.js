// ===== 核心：科目註冊、題庫、儲存、紀錄、共用元件 =====
const REG = { subjects: {}, order: [] };
function SUBJECT(def) {
  def.chapters = def.chapters || []; def.essays = def.essays || [];
  REG.subjects[def.id] = def; REG.order.push(def.id);
}
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} if (typeof Sync !== "undefined") Sync.dirty(k); }
};
// 舊版資料搬家（第一版存在 cht_ 開頭）
(function migrate() {
  [["cht_wrong", "examhub_wrong"], ["cht_rate", "examhub_rate"]].forEach(([a, b]) => {
    try { if (localStorage.getItem(a) && !localStorage.getItem(b)) localStorage.setItem(b, localStorage.getItem(a)); } catch (e) {}
  });
})();
let wrong = LS.get("examhub_wrong", {});
let rate = LS.get("examhub_rate", {});
let custom = LS.get("examhub_custom", { q: [], e: [] });
const saveState = () => { LS.set("examhub_wrong", wrong); LS.set("examhub_rate", rate); LS.set("examhub_custom", custom); };

// 請瀏覽器把資料標記為「持久保存」，降低被自動清除的機會
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
// ===== 題庫 =====
const QBANK = {}, EMAP = {}, CMAP = {};
const ansIdx = a => typeof a === "number" ? a : "ABCD".indexOf(String(a).trim().toUpperCase());
function buildBank() {
  for (const k in QBANK) delete QBANK[k];
  for (const k in EMAP) delete EMAP[k];
  REG.order.forEach(sid => {
    const S = REG.subjects[sid];
    S.chapters.forEach(c => {
      CMAP[c.id] = c; c.sub = sid; c.keys = [];
      (c.q || []).forEach((q, i) => { const k = `${c.id}-${i}`; QBANK[k] = { q: q[0], o: q[1], a: ansIdx(q[2]), x: q[3] || "", src: `${S.name}｜${c.t}`, sub: sid, ch: c.id }; c.keys.push(k); });
    });
    S.essays.forEach(e => { EMAP[e.id] = Object.assign({ sub: sid }, e); });
  });
  (custom.q || []).forEach(q => {
    const S = REG.subjects[q.sub]; if (!S) return;
    const c = CMAP[q.ch]; const k = "C" + q.id;
    QBANK[k] = { q: q.q, o: q.o, a: q.a, x: q.x || "", src: `${S.name}｜${c ? c.t : "自己新增"}`, sub: q.sub, ch: q.ch, mine: true };
    if (c) c.keys.push(k);
  });
  (custom.e || []).forEach(e => { if (REG.subjects[e.sub]) EMAP["CE" + e.id] = Object.assign({ mine: true }, e, { id: "CE" + e.id }); });
}
const subOfKey = k => (QBANK[k] && QBANK[k].sub) || null;
const essaysOf = sid => Object.values(EMAP).filter(e => e.sub === sid);
const keysOf = sid => Object.keys(QBANK).filter(k => QBANK[k].sub === sid);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ===== 練習紀錄 =====
const LOGKEY = "examhub_log";
const Log = {
  all() { const a = LS.get(LOGKEY, []);
    a.forEach(x => { if (!x.sub) { const s = subOfKey(x.k) || (EMAP[x.id] && EMAP[x.id].sub); if (s) x.sub = s; } }); return a; },
  add(e) { const a = LS.get(LOGKEY, []); let t = Date.now(); if (a.length && a[a.length - 1].t >= t) t = a[a.length - 1].t + 1; a.push(Object.assign({ t }, e)); if (a.length > 10000) a.splice(0, a.length - 10000); LS.set(LOGKEY, a); if (typeof Sync !== "undefined") Sync.schedule(); },
  replace(a) { LS.set(LOGKEY, a || []); }
};
const dTW = t => new Date(t + 8 * 3600e3).toISOString().slice(0, 10);
const hmTW = t => new Date(t + 8 * 3600e3).toISOString().slice(11, 16);
const todayTW = () => dTW(Date.now());
function logStats(sid) {
  const L = Log.all().filter(x => !sid || x.sub === sid);
  const q = L.filter(x => x.ty === "q"), ok = q.filter(x => x.ok).length;
  const set = new Set(L.map(x => dTW(x.t)));
  let streak = 0, cur = todayTW(); if (!set.has(cur)) cur = dTW(Date.now() - 864e5);
  while (set.has(cur)) { streak++; cur = dTW(Date.parse(cur + "T12:00:00+08:00") - 864e5); }
  const days = [...set].sort();
  return { total: q.length, ok, rate: q.length ? Math.round(ok / q.length * 100) : 0, days: days.length, last: days[days.length - 1] || null, essays: L.filter(x => x.ty === "e").length, streak };
}

// ===== 元件：選擇題 =====
function quizHTML(keys, opts = {}) {
  keys = keys.filter(k => QBANK[k]);
  if (!keys.length) return `<p class="muted">${opts.empty || "目前沒有題目"}</p>`;
  return `<div class="quiz">` + keys.map((k, n) => { const q = QBANK[k];
    return `<div class="q" data-k="${k}"><div class="qsrc">${esc(q.src)}${q.mine ? ' <span class="tag warm">我新增的</span>' : ""}${wrong[k] ? ` <span class="tag red">錯 ${wrong[k]} 次</span>` : ""}</div>
      <div class="qt">${n + 1}. ${esc(q.q)}</div>
      <div class="opts">${q.o.map((o, i) => `<button class="opt" data-i="${i}"><b>${"ABCD"[i]}</b>${esc(o)}</button>`).join("")}</div>
      <div class="exp" hidden></div></div>`; }).join("") + `</div>`;
}
function bindQuiz(root, onAnswer) {
  root.querySelectorAll(".q").forEach(qel => {
    const k = qel.dataset.k, q = QBANK[k];
    qel.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      if (qel.classList.contains("answered")) return;
      qel.classList.add("answered");
      const i = +b.dataset.i, ok = i === q.a;
      qel.querySelectorAll(".opt")[q.a].classList.add("right"); if (!ok) b.classList.add("bad");
      if (ok) delete wrong[k]; else wrong[k] = (wrong[k] || 0) + 1;
      saveState();
      Log.add({ sub: q.sub, ty: "q", k, q: q.q, a: q.o[i], c: q.o[q.a], ok, src: q.src });
      const ex = $(".exp", qel); ex.hidden = false;
      ex.innerHTML = `<b>${ok ? "答對了 ✓" : "正解：" + "ABCD"[q.a]}</b>　${esc(q.x)}${!ok ? "（已加入錯題本）" : ""}`;
      if (onAnswer) onAnswer(ok);
    });
  });
}
// ===== 元件：申論 =====
function essayHTML(id, mode = "new") {
  const e = EMAP[id]; if (!e) return "";
  const r = rate[id], S = REG.subjects[e.sub];
  const label = { timed: "計時寫作", review: "默寫複習", new: "今日新背", bank: "", memo: "" }[mode];
  const hide = !["new", "bank"].includes(mode);
  return `<div class="essay" data-id="${id}">
    <div class="ehead"><span class="tag acc">${esc(S.name)}</span>${e.tag ? `<span class="tag ${/歷屆/.test(e.tag) ? "warm" : ""}">${esc(e.tag)}</span>` : ""}${label ? `<span class="tag">${label}</span>` : ""}${e.mine ? '<span class="tag warm">我新增的</span>' : ""}
      ${r != null ? `<span class="tag rtag ${["red", "yellow", "green"][r]}">${["忘了", "模糊", "熟了"][r]}</span>` : ""}</div>
    <h3>${esc(e.t)}</h3><p class="eq">題目：${esc(e.q)}</p>
    ${mode === "timed" ? `<div class="timer"><span class="tval">25:00</span><button class="btn sm tstart">開始計時</button></div>` : ""}
    <button class="btn sm toggle">${hide ? "先自己默寫，再看架構" : "收起架構"}</button>
    <div class="ans" ${hide ? "hidden" : ""}><ul>${e.a.map(l => `<li>${esc(l)}</li>`).join("")}</ul>${e.tip ? `<p class="tip">🔑 ${esc(e.tip)}</p>` : ""}</div>
    <div class="rate">記得多少？<button class="btn sm" data-r="2">熟了</button><button class="btn sm" data-r="1">模糊</button><button class="btn sm" data-r="0">忘了</button></div></div>`;
}
function bindEssays(root) {
  root.querySelectorAll(".essay").forEach(el => {
    const t = $(".toggle", el), a = $(".ans", el), id = el.dataset.id;
    t.onclick = () => { a.hidden = !a.hidden; t.textContent = a.hidden ? "看架構" : "收起架構"; };
    el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => {
      const v = +b.dataset.r; rate[id] = v; saveState();
      Log.add({ sub: EMAP[id].sub, ty: "e", id, title: EMAP[id].t, r: v });
      let tg = $(".rtag", el); if (!tg) { tg = document.createElement("span"); $(".ehead", el).appendChild(tg); }
      tg.className = "tag rtag " + ["red", "yellow", "green"][v]; tg.textContent = ["忘了", "模糊", "熟了"][v];
    });
    const ts = $(".tstart", el);
    if (ts) { let left = 1500, h = null; ts.onclick = () => {
      if (h) { clearInterval(h); h = null; ts.textContent = "繼續"; return; }
      ts.textContent = "暫停";
      h = setInterval(() => { left--; $(".tval", el).textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
        if (left <= 0) { clearInterval(h); $(".tval", el).textContent = "時間到！"; } }, 1000); }; }
  });
}
// ===== 元件：單字 =====
function vocabHTML(start, n = 8) {
  const V = (REG.subjects.eng && REG.subjects.eng.vocab) || []; if (!V.length) return "";
  const w = []; for (let i = 0; i < n; i++) w.push(V[(start + i) % V.length]);
  return `<div class="vocab">${w.map(([en, zh]) => `<button class="vc"><span class="en">${esc(en)}</span><span class="zh">${esc(zh)}</span></button>`).join("")}</div>`;
}
function bindVocab(root) { root.querySelectorAll(".vc").forEach(b => b.onclick = () => b.classList.toggle("show")); }
function notesHTML(c) {
  const S = REG.subjects[c.sub];
  const rel = essaysOf(c.sub).filter(e => (c.e || []).includes(e.id));
  return `<div class="notes"><h3>${esc(c.t)}</h3><ul>${(c.p || []).map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>`;
}

// ===== 練習紀錄頁 =====
function renderHistory(root, opts = {}) {
  const st = renderHistory.st || (renderHistory.st = { sub: "", only: "all", day: null });
  if (opts.sub) st.sub = opts.sub;
  const L = Log.all().filter(x => !st.sub || x.sub === st.sub);
  const byDay = {}; L.forEach(x => (byDay[dTW(x.t)] = byDay[dTW(x.t)] || []).push(x));
  const days = Object.keys(byDay).sort().reverse();
  if (!st.day || !byDay[st.day]) st.day = days[0] || null;
  const s = logStats(st.sub);
  let h = `<div class="stats"><div><b>${s.days}</b><span>練習天數</span></div><div><b>${s.streak}</b><span>連續天數</span></div>
    <div><b>${s.total}</b><span>累計作答</span></div><div><b>${s.rate}%</b><span>正確率</span></div><div><b>${s.essays}</b><span>申論自評</span></div></div>
    <div class="toolbar">${opts.sub ? "" : `<select id="hsub"><option value="">全部科目</option>${REG.order.map(id => `<option value="${id}" ${st.sub === id ? "selected" : ""}>${esc(REG.subjects[id].name)}</option>`).join("")}</select>`}
    <select id="honly"><option value="all">全部紀錄</option><option value="bad" ${st.only === "bad" ? "selected" : ""}>只看答錯</option><option value="e" ${st.only === "e" ? "selected" : ""}>只看申論</option></select></div>`;
  if (!days.length) { root.innerHTML = h + `<p class="muted">還沒有練習紀錄。做題或在申論按「熟了／模糊／忘了」之後，就會記在這裡。</p>`; bindH(); return; }
  h += `<div class="hdays">${days.map(d => { const q = byDay[d].filter(x => x.ty === "q"), ok = q.filter(x => x.ok).length;
    return `<button class="hday ${d === st.day ? "on" : ""}" data-d="${d}"><b>${d.slice(5).replace("-", "/")}</b><span>${q.length} 題${q.length ? "・" + Math.round(ok / q.length * 100) + "%" : ""}</span></button>`; }).join("")}</div>`;
  let items = byDay[st.day].slice().reverse();
  if (st.only === "bad") items = items.filter(x => x.ty === "q" && !x.ok);
  if (st.only === "e") items = items.filter(x => x.ty === "e");
  const q = byDay[st.day].filter(x => x.ty === "q");
  const bad = [...new Set(q.filter(x => !x.ok).map(x => x.k))].filter(k => QBANK[k]);
  h += `<div class="hhead"><b>${st.day}</b>　作答 ${q.length} 題，答對 ${q.filter(x => x.ok).length} 題
    ${opts.onRedo && bad.length ? `<button class="btn sm pri" id="hredo">重做這天答錯的 ${bad.length} 題</button>` : ""}</div><div class="hlist">` +
    (items.map(x => {
      const sn = !opts.sub && REG.subjects[x.sub] ? `<span class="tag">${esc(REG.subjects[x.sub].name)}</span>` : "";
      if (x.ty === "q") return `<div class="hitem ${x.ok ? "ok" : "bad"}"><div class="hmeta">${hmTW(x.t)} ${sn}${x.ok ? "✅" : "❌"} <span class="muted">${esc(x.src)}</span></div><div>${esc(x.q)}</div>
        <div class="hans">你的答案：${esc(x.a)}${x.ok ? "" : `　｜　正解：${esc(x.c)}`}</div></div>`;
      if (x.ty === "e") return `<div class="hitem"><div class="hmeta">${hmTW(x.t)} ${sn}<span class="tag">申論</span></div>${esc(x.title)}　→　<b>${["忘了", "模糊", "熟了"][x.r]}</b></div>`;
      if (x.ty === "d") return `<div class="hitem"><div class="hmeta">${hmTW(x.t)}</div>✔ 完成 ${esc(x.d)} 的讀書計畫</div>`;
      return ""; }).join("") || `<p class="muted">這個篩選條件下沒有紀錄。</p>`) + `</div>`;
  root.innerHTML = h; bindH();
  function bindH() {
    root.querySelectorAll(".hday").forEach(b => b.onclick = () => { st.day = b.dataset.d; renderHistory(root, opts); });
    const hs = $("#hsub", root); if (hs) hs.onchange = e => { st.sub = e.target.value; st.day = null; renderHistory(root, opts); };
    const ho = $("#honly", root); if (ho) ho.onchange = e => { st.only = e.target.value; renderHistory(root, opts); };
    const rd = $("#hredo", root); if (rd) rd.onclick = () => opts.onRedo(bad);
  }
}

// ===== 備份（所有考試資料）=====
function backupHTML() {
  const all = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(cht_|examhub_)/.test(k) && k !== "examhub_syncmeta") all[k] = localStorage.getItem(k); } } catch (e) {}
  return `<p class="small">進度、錯題本、練習紀錄和你自己新增的題目，都存在這台裝置的瀏覽器。換手機或電腦時，複製下面的備份碼，到新裝置打開同一個網址貼上並還原。</p>
    <textarea id="bk" rows="6">${esc(JSON.stringify(all))}</textarea>
    <div class="toolbar"><button class="btn pri" id="bkdl">⬇ 下載備份檔</button><label class="btn" style="margin:0">⬆ 從備份檔還原<input type="file" id="bkfile" accept=".json" hidden></label></div>
    <div class="toolbar"><button class="btn sm" id="bkcp">複製備份碼</button><button class="btn sm" id="bkld">還原貼上的備份碼</button><span id="bkmsg" class="small muted"></span></div>
    <p class="small muted">上次備份：${LS.get("examhub_lastbackup", null) ? new Date(LS.get("examhub_lastbackup")).toLocaleString("zh-TW") : "還沒備份過"}</p>`;
}
function bindBackup(after) {
  const restore = txt => { try { const o = JSON.parse(txt); Object.entries(o).forEach(([k, v]) => { if (k !== "examhub_syncmeta") localStorage.setItem(k, v); }); if (typeof Sync !== "undefined") Sync.markAllNow(); $("#bkmsg").textContent = "已還原，重新整理中…"; setTimeout(() => location.reload(), 800); } catch (e) { $("#bkmsg").textContent = "備份內容格式不對"; } };
  const dl = $("#bkdl"); if (dl) dl.onclick = () => { const blob = new Blob([$("#bk").value], { type: "application/json" }); const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "考試複習備份-" + todayTW() + ".json"; document.body.appendChild(a); a.click(); a.remove(); LS.set("examhub_lastbackup", Date.now()); $("#bkmsg").textContent = "已下載，請存到雲端硬碟或傳給自己"; };
  const fi = $("#bkfile"); if (fi) fi.onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => restore(r.result); r.readAsText(f); };
  const cp = $("#bkcp"); if (cp) cp.onclick = async () => { LS.set("examhub_lastbackup", Date.now()); try { await navigator.clipboard.writeText($("#bk").value); $("#bkmsg").textContent = "已複製"; } catch (e) { $("#bk").select(); $("#bkmsg").textContent = "請手動全選複製"; } };
  const ld = $("#bkld"); if (ld) ld.onclick = () => { try { const o = JSON.parse($("#bk").value); Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, v)); $("#bkmsg").textContent = "已還原，重新整理後生效"; setTimeout(() => location.reload(), 800); } catch (e) { $("#bkmsg").textContent = "備份碼格式不對"; } };
}
function topbar(active) {
  return `<div class="top"><a class="brand" href="index.html"><img src="logo.png" alt="">考試複習</a>
    <nav class="subnav">${REG.order.map(id => { const S = REG.subjects[id]; return `<a href="subject.html#${id}" class="${active === id ? "on" : ""}">${S.icon} ${esc(S.name)}</a>`; }).join("")}<a href="cht.html" class="${active === "plan" ? "on" : ""}">📅 中華電信計畫</a></nav>${typeof syncBadge === "function" ? syncBadge() : ""}</div>`;
}
