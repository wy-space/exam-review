// ===== 中華電信讀書計畫：cht.html =====
let done = LS.get("cht_done", {});
let curDate = todayTW();
if (curDate < SCHEDULE[0].d) curDate = SCHEDULE[0].d;
if (curDate > SCHEDULE[SCHEDULE.length - 1].d) curDate = SCHEDULE[SCHEDULE.length - 1].d;
const sec = (title, body) => `<section class="card"><h2>${title}</h2>${body}</section>`;
const weekWords = d => { const i = SCHEDULE.findIndex(x => x.d === d.d), s = [];
  for (let j = Math.max(0, i - 6); j <= i; j++) if (SCHEDULE[j].vocab != null) s.push(SCHEDULE[j].vocab); return s; };
const chKeys = id => CMAP[id] ? CMAP[id].keys : [];
function pageToday() {
  const d = SCHEDULE.find(x => x.d === curDate), idx = SCHEDULE.indexOf(d);
  let h = `<div class="daybar"><button class="btn" id="prev" ${idx === 0 ? "disabled" : ""}>‹ 前一天</button>
    <div class="dayinfo"><input type="date" id="dpick" value="${d.d}" min="${SCHEDULE[0].d}" max="${SCHEDULE[SCHEDULE.length - 1].d}"><div>星期${d.w}・<span class="tag acc">${esc(d.phase)}</span></div></div>
    <button class="btn" id="next" ${idx === SCHEDULE.length - 1 ? "disabled" : ""}>後一天 ›</button></div>`;
  if (d.note) h += `<div class="notice">📌 ${esc(d.note)}</div>`;
  h += `<div class="summary"><b>今日安排</b><br>${esc(d.pro)}<br>${esc(d.eng)}</div>`;
  if (d.type === "econ") return h + sec("📘 經濟學日", `<p>週六留給經濟學，中華電信的進度今天休息。</p><p><a class="btn pri" href="subject.html#econ-essays">📈 進入經濟學申論</a></p>`);
  if (d.type === "exam") return h + sec("📝 考試日", `<p>深呼吸。申論先列小標題再展開，每題控制在 20–25 分鐘。</p>`);
  if (d.essayNew) h += sec("✍️ 申論・今日新背（約 25 分）", essayHTML(d.essayNew, "new"));
  if (d.essayTimed) h += sec("⏱️ 申論・計時寫作（25 分）", `<p class="muted small">先在紙上寫完再展開架構對照，缺漏的點用紅筆補上。</p>` + essayHTML(d.essayTimed, "timed"));
  if (d.review && d.review.length) h += sec(d.type === "study" ? "🔁 申論・默寫昨天的題目（約 15 分）" : "🔁 申論・默寫複習",
    `<p class="muted small">先遮住架構，把小標題寫在紙上，再打開對照，最後按「熟了／模糊／忘了」。</p>` + d.review.map(id => essayHTML(id, "review")).join(""));
  if (d.chapter && CMAP[d.chapter]) { const c = CMAP[d.chapter];
    h += sec(`📖 今日章節：${esc(REG.subjects[c.sub].name)}（約 30 分）`, notesHTML(c));
    h += sec("✅ 章節練習題（約 20 分）", quizHTML(chKeys(c.id))); }
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
  return h;
}
function pageProgress() {
  const study = SCHEDULE.filter(x => x.type !== "econ" && x.type !== "exam");
  const past = study.filter(x => x.d <= todayTW()), nd = study.filter(x => done[x.d]).length;
  const es = [...essaysOf("mgmt"), ...essaysOf("mkt")], r = [0, 1, 2].map(v => es.filter(e => rate[e.id] === v).length);
  return sec("📊 進度", `<div class="stats"><div><b>${nd}</b><span>已完成天數</span></div><div><b>${past.length}</b><span>至今應讀天數</span></div>
      <div><b>${r[2]}</b><span>申論熟了</span></div><div><b>${r[1]}</b><span>申論模糊</span></div><div><b>${r[0]}</b><span>申論忘了</span></div></div>`) +
    sec("🗓️ 每週節奏", `<ul><li>週一～週四：申論 40 分＋章節或刷題 50 分＋英文 30 分</li><li>週五晚上：輕量 40 分，默寫本週申論＋錯題本＋單字</li><li>週六：經濟學日</li><li>週日晚上：輕量 40 分，回憶前幾週的申論＋單字＋邏輯 3 題</li></ul>
      <p class="small muted">申論 40 題在 1/27 前背完一輪；章節 1/11 讀完，之後換成刷題；2/22 開始衝刺，每天計時寫一題。</p>`) +
    `<section class="card" id="syncpanel">${syncPanelHTML()}</section>` + sec("💾 手動備份", backupHTML());
}
function render() {
  const v = location.hash.slice(1) === "progress" ? "progress" : "today";
  const days = Math.max(0, Math.ceil((Date.parse("2027-03-13T00:00:00+08:00") - Date.now()) / 864e5));
  $("#app").innerHTML = topbar("plan") + `<section class="shero"><div class="hello">中華電信 業務類（行銷及企業客戶業務推廣）</div><h1>📅 讀書計畫</h1><div class="small muted">距預估筆試 ${days} 天・預估 2027/3/13（以簡章為準）</div></section>
    <div class="tabs"><a href="#today" class="${v === "today" ? "on" : ""}">今日任務</a><a href="#progress" class="${v === "progress" ? "on" : ""}">進度與備份</a></div><main>${v === "today" ? pageToday() : pageProgress()}</main>`;
  const m = $("main"); bindQuiz(m); bindEssays(m); bindVocab(m); bindBackup(); bindSyncPanel(render);
  const on = (s, f) => { const el = $(s); if (el) f(el); };
  on("#prev", el => el.onclick = () => { curDate = SCHEDULE[SCHEDULE.findIndex(x => x.d === curDate) - 1].d; render(); scrollTo(0, 0); });
  on("#next", el => el.onclick = () => { curDate = SCHEDULE[SCHEDULE.findIndex(x => x.d === curDate) + 1].d; render(); scrollTo(0, 0); });
  on("#dpick", el => el.onchange = e => { if (SCHEDULE.find(x => x.d === e.target.value)) { curDate = e.target.value; render(); } });
  on("#donechk", el => el.onchange = e => { if (e.target.checked) { done[curDate] = true; Log.add({ sub: "plan", ty: "d", d: curDate }); } else delete done[curDate]; LS.set("cht_done", done); });
}
buildBank();
addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
render();
