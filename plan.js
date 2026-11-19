// ===== 中華電信讀書計畫：cht.html =====
let done = LS.get("cht_done", {});
let curDate = todayTW();
function clampDate() { if (curDate < SCHEDULE[0].d) curDate = SCHEDULE[0].d; if (curDate > SCHEDULE[SCHEDULE.length - 1].d) curDate = SCHEDULE[SCHEDULE.length - 1].d; }
const sec = (title, body) => `<section class="card"><h2>${title}</h2>${body}</section>`;
const weekWords = d => { const i = SCHEDULE.findIndex(x => x.d === d.d), s = [];
  for (let j = Math.max(0, i - 6); j <= i; j++) if (SCHEDULE[j].vocab != null) s.push(SCHEDULE[j].vocab); return s; };
const chKeys = id => CMAP[id] ? CMAP[id].keys : [];
function pageToday() {
  const d = SCHEDULE.find(x => x.d === curDate), idx = SCHEDULE.indexOf(d);
  let h = `<div class="daybar"><button class="btn" id="prev" ${idx === 0 ? "disabled" : ""}>‹ 前一天</button>
    <div class="dayinfo"><input type="date" id="dpick" value="${d.d}" min="${SCHEDULE[0].d}" max="${SCHEDULE[SCHEDULE.length - 1].d}"><div>星期${d.w}・<span class="tag acc">${esc(d.phase)}</span></div></div>
    <button class="btn" id="next" ${idx === SCHEDULE.length - 1 ? "disabled" : ""}>後一天 ›</button></div>`;
  const st = planStart(), before = todayTW() < st;
  h = `<div class="startbar"><span>📅 計畫開始日</span><input type="date" id="startpick" value="${st}" max="${PLAN.exam}"><button class="btn sm" id="starttoday">從今天開始</button></div>` +
    (before ? `<div class="notice">讀書計畫從 ${st.slice(5).replace("-", "/")} 開始，下面是第一天的內容。想提早開始就改上面的日期。</div>` : "") + h;
  if (d.note) h += `<div class="notice">📌 ${esc(d.note)}</div>`;
  h += `<div class="summary"><b>今日安排</b><br>${esc(d.pro)}<br>${esc(d.eng)}</div>`;
    if (d.type === "rest") return h + sec("😴 週六放假", `<p>今天不排進度，好好休息。</p><p class="muted small">有空想動一動，可以到上方的經濟學或法學緒論練幾題，不強求。</p>`);
  if (d.type === "skip") return h + sec("⏸ 已順延", `<p>今天的進度已經往後推一天，好好休息。</p><button class="btn" id="unskip">取消順延，今天照常讀</button>`);
  if (d.type === "exam") return h + sec("📝 考試日", `<p>深呼吸。申論先列小標題再展開，每題控制在 20–25 分鐘。</p>`);
  if (d.essayNews) h += sec(`✍️ 申論・今日新背（${d.essayNews.length > 1 ? "兩題，約 30 分" : "約 25 分"}）`, d.essayNews.map(id => essayHTML(id, "new")).join(""));
  if (d.essayTimed) h += sec("⏱️ 申論・計時寫作（25 分）", `<p class="muted small">先在紙上寫完再展開架構對照，缺漏的點用紅筆補上。</p>` + essayHTML(d.essayTimed, "timed"));
  if (d.review && d.review.length) h += sec(d.type === "study" ? "🔁 申論・默寫昨天的題目（約 15 分）" : "🔁 申論・默寫複習",
    `<p class="muted small">先遮住架構，把小標題寫在紙上，再打開對照，最後按「熟了／模糊／忘了」。</p>` + d.review.map(id => essayHTML(id, "review")).join(""));
  if (d.chapters) { const cs = d.chapters.filter(id => CMAP[id]);
    h += sec(`📖 今日章節（約 30 分）`, cs.map(id => `<div class="small muted">${esc(REG.subjects[CMAP[id].sub].name)}</div>` + notesHTML(CMAP[id])).join(""));
    h += sec("✅ 章節練習題（約 20 分）", quizHTML(cs.flatMap(chKeys))); }
  if (d.quizChapters) h += sec("📚 今日刷題章節", d.quizChapters.map(id => CMAP[id] ? notesHTML(CMAP[id]) : "").join("") + `<h3 class="sub">練習題</h3>` + quizHTML(d.quizChapters.flatMap(chKeys)));
  if (d.quizMix) h += sec("🎯 混合題庫 20 題", quizHTML(shuffle([...keysOf("mgmt"), ...keysOf("mkt")]).slice(0, 20)));
  if (d.wrong) { const ks = Object.keys(wrong).filter(k => QBANK[k] && ["mgmt", "mkt", "eng", "logic"].includes(QBANK[k].sub));
    h += sec("❌ 錯題本重做", quizHTML(shuffle(ks).slice(0, 15), { empty: "目前沒有錯題 🎉" })); }
  if (d.type === "study" && d.grammar != null) { const g = REG.subjects.eng.chapters[d.grammar % REG.subjects.eng.chapters.length];
    h += sec("🔤 英文單字（約 10 分）", vocabHTML(d.vocab) + `<p class="muted small">點單字翻面看中文。再搭配你的單字書背 20 個新字。</p>`);
    h += sec(`📝 英文文法：${esc(g.t)}（約 20 分）`, notesHTML(g) + quizHTML(g.keys)); }
  if (d.vocabReview) { const ws = weekWords(d); h += sec("🔤 本週單字快速複習", ws.length ? ws.map(s => vocabHTML(s)).join("") : `<p class="muted">本週還沒有新單字。</p>`); }
  if (d.logic) { const L = keysOf("logic"); h += sec("🧩 邏輯思維 3 題", quizHTML(d.logic.map(i => L[i % L.length]))); }
  h += `<div class="donebar"><label><input type="checkbox" id="donechk" ${done[d.d] ? "checked" : ""}> 今天的進度完成了</label></div>`;
  if (!done[d.d] && d.type !== "exam") h += `<div class="skipbar"><button class="btn sm" id="skipday">😮‍💨 今天太忙，進度往後推一天</button><div class="small muted">這天會變成休息，之後的內容全部順延；剩下的天數不夠時，系統會自動改成一天兩章。</div></div>`;
  return h;
}
function pageProgress() {
  const study = SCHEDULE.filter(x => !["rest", "skip", "exam"].includes(x.type));
  const past = study.filter(x => x.d <= todayTW()), nd = study.filter(x => done[x.d]).length;
  const es = [...essaysOf("mgmt"), ...essaysOf("mkt")], r = [0, 1, 2].map(v => es.filter(e => rate[e.id] === v).length);
  return sec("📊 進度", `<div class="stats"><div><b>${nd}</b><span>已完成天數</span></div><div><b>${past.length}</b><span>至今應讀天數</span></div>
      <div><b>${r[2]}</b><span>申論熟了</span></div><div><b>${r[1]}</b><span>申論模糊</span></div><div><b>${r[0]}</b><span>申論忘了</span></div></div>`) +
    sec("🗓️ 每週節奏", `<ul><li>週一～週四：申論 40 分＋章節或刷題 50 分＋英文 30 分</li><li>週五晚上：輕量 40 分，默寫本週申論＋錯題本＋單字</li><li>週六：放假</li><li>週日晚上：輕量 40 分，回憶前幾週的申論＋單字＋邏輯 3 題</li></ul>
      <p class="small muted">申論 40 題每天背一題、章節每天一章，背完讀完後改成刷題和計時寫作；2/22 起衝刺。開始日較晚時，系統會自動改成一天兩章或兩題，確保考前讀完。</p>`) +
    `<section class="card" id="syncpanel">${syncPanelHTML()}</section>` + sec("💾 手動備份", backupHTML());
}
function render() {
  const v = location.hash.slice(1) === "progress" ? "progress" : "today";
  const days = Math.max(0, daysUntil(PLAN.exam));
  $("#app").innerHTML = topbar("plan") + `<section class="shero"><div class="hello">中華電信 業務類（行銷及企業客戶業務推廣）</div><h1>📅 讀書計畫</h1><div class="small muted">距筆試 ${days} 天・${PLAN.exam.replace(/-/g, "/")}（可在入口網站「倒數」修改）</div></section>
    <div class="tabs"><a href="#today" class="${v === "today" ? "on" : ""}">今日任務</a><a href="#progress" class="${v === "progress" ? "on" : ""}">進度與備份</a></div><main>${v === "today" ? pageToday() : pageProgress()}</main>`;
  const m = $("main"); bindQuiz(m); bindEssays(m); bindVocab(m); bindBackup(); bindSyncPanel(render);
  const on = (s, f) => { const el = $(s); if (el) f(el); };
  on("#prev", el => el.onclick = () => { curDate = SCHEDULE[SCHEDULE.findIndex(x => x.d === curDate) - 1].d; render(); scrollTo(0, 0); });
  on("#next", el => el.onclick = () => { curDate = SCHEDULE[SCHEDULE.findIndex(x => x.d === curDate) + 1].d; render(); scrollTo(0, 0); });
  on("#dpick", el => el.onchange = e => { if (SCHEDULE.find(x => x.d === e.target.value)) { curDate = e.target.value; render(); } });
  on("#startpick", el => el.onchange = e => { const v = e.target.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return; LS.set("cht_start", v); initSchedule(); curDate = v < todayTW() ? todayTW() : v; clampDate(); render(); });
  on("#starttoday", el => el.onclick = () => { LS.set("cht_start", todayTW()); initSchedule(); curDate = todayTW(); clampDate(); render(); });
  on("#skipday", el => el.onclick = () => { const a = planSkips(); if (!a.includes(curDate)) a.push(curDate); LS.set("cht_skip", a.sort()); initSchedule(); render(); scrollTo(0, 0); });
  on("#unskip", el => el.onclick = () => { LS.set("cht_skip", planSkips().filter(x => x !== curDate)); initSchedule(); render(); scrollTo(0, 0); });
  on("#donechk", el => el.onchange = e => { if (e.target.checked) { done[curDate] = true; Log.add({ sub: "plan", ty: "d", d: curDate }); } else delete done[curDate]; LS.set("cht_done", done); });
}
buildBank(); initSchedule(); clampDate();
addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
render();
