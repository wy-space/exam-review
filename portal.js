// ===== 入口網站：index.html =====
const tw = () => new Date(Date.now() + 8 * 3600e3);
let filter = LS.get("examhub_pf", "全部");
const poemToday = () => { const m = +todayTW().slice(5, 7), k = m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
  const L = POEMS[k], n = Math.floor(Date.parse(todayTW() + "T00:00:00Z") / 864e5); return L[n % L.length]; };
function greet() { const h = tw().getUTCHours(); return h < 5 ? "夜深了" : h < 11 ? "早安" : h < 18 ? "午安" : "晚安"; }
function ring(p) { const r = 24, c = 2 * Math.PI * r;
  return `<svg width="60" height="60" viewBox="0 0 60 60" class="rsvg"><circle cx="30" cy="30" r="${r}" fill="none" stroke="var(--line)" stroke-width="6"/>
  <circle class="rarc" cx="30" cy="30" r="${r}" fill="none" stroke="url(#rg)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" style="--c:${c};--o:${c * (1 - p / 100)}" transform="rotate(-90 30 30)"/>
  <text x="30" y="35" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${p}%</text></svg>`; }
function home() {
  const t = todayTW();
  const ups = getExams().filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  const main = ups[0] || null, days = main ? daysUntil(main.date) : 0;
  const EX = main ? Date.parse(main.date + "T00:00:00+08:00") : Date.now(), ST = Date.parse(planStart() + "T00:00:00+08:00");
  const prog = main ? Math.min(100, Math.max(0, Math.round((Date.now() - ST) / Math.max(1, EX - ST) * 100))) : 0;
  const d = SCHEDULE.find(x => x.d === t) || SCHEDULE.find(x => x.d > t) || SCHEDULE[0], off = (d.type === "rest" || d.type === "skip") && d.d === t;
  const notYet = t < SCHEDULE[0].d;
  const per = {}; Log.all().forEach(x => { const k = dTW(x.t); per[k] = (per[k] || 0) + 1; });
  const wk = []; for (let i = 6; i >= 0; i--) wk.push(dTW(Date.now() - i * 864e5));
  const s = logStats(""), pm = poemToday();
  const m = +t.slice(5, 7), season = m >= 3 && m <= 5 ? "春" : m >= 6 && m <= 8 ? "夏" : m >= 9 && m <= 11 ? "秋" : "冬";
  const g = greet();
  let h = `<section class="hero2">
    <div class="hero-art rise" style="--d:2"><div class="halo"></div><span class="flyer"><span class="bk"><span class="biglogo flipani" role="img" aria-label="logo"></span></span></span></div>
    <div class="hero-text">
      <span class="datechip rise" style="--d:0">${tw().toLocaleDateString("zh-TW", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric", weekday: "long" })}<i>${season}</i></span>
      <h1 class="greet" aria-label="${esc(g)}">${[...g].map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join("")}</h1>
      <p class="poemline rise" style="--d:5">「${esc(pm[0])}${esc(pm[1])}」<span>${esc(pm[2])}</span></p>
    </div>
  </section>
  <div class="dash">
    <section class="card today rise" style="--d:6"><div class="label">${notYet ? "中華電信・計畫從 " + d.d.slice(5).replace("-", "/") + " 開始" : d.d === t ? "中華電信・今日任務" : "下一個讀書日 " + d.d.slice(5).replace("-", "/")}</div>
      <h2>${off ? (d.type === "skip" ? "⏸ 今天順延休息" : "😴 週六放假") : esc(d.phase)}</h2>
      ${off ? `<p class="muted small">今天不排進度，好好休息。</p>` : `<div class="task"><div class="ic">✍️</div><div>${esc(d.pro)}</div></div><div class="task"><div class="ic w">🔤</div><div>${esc(d.eng)}</div></div>`}
      <div class="btns">${off ? `<a class="btn pri glow" href="cht.html#today">看讀書計畫 →</a>` : `<a class="btn pri glow" href="cht.html#today">開始今天的進度 →</a>`}<a class="btn" href="cht.html#progress">進度</a></div></section>
    <div class="side">
      <section class="card countdown rise" style="--d:7">${main ? `<div class="cl">${esc(main.name)}倒數</div>
        <div class="cn"><b data-count="${days}">0</b><span>天</span></div>
        <div class="bar"><i style="--w:${prog}%"></i></div><div class="cs">${main.date.replace(/-/g, "/")}${main.note ? "・" + esc(main.note) : ""}</div>
        ${ups.length > 1 ? `<div class="more">${ups.slice(1, 4).map(e => `<div><span>${esc(e.name)}</span><b>${daysUntil(e.date)}</b> 天</div>`).join("")}</div>` : ""}`
        : `<div class="cl">考試倒數</div><div class="cs" style="margin:10px 0">還沒有設定考試日期</div>`}
        <a class="cdedit" href="#exams">${ups.length ? "📅 月曆／編輯考試" : "＋ 新增考試"}</a></section>
      <section class="card rise" style="--d:8"><div class="label">這一週</div><div class="week">${wk.map((k, i) => { const n = per[k] || 0, lv = !n ? "" : n < 10 ? "l1" : n < 25 ? "l2" : "l3";
        return `<div class="dayc">${"日一二三四五六"[new Date(k + "T12:00:00Z").getUTCDay()]}<div class="dot ${lv} ${k === t ? "today" : ""}" style="--i:${i}">${n || ""}</div></div>`; }).join("")}</div>
        <div class="nums"><div><b data-count="${s.streak}">0</b><span>連續天數</span></div><div><b data-count="${s.total}">0</b><span>累計作答</span></div><div><b data-count="${s.essays}">0</b><span>申論自評</span></div></div></section>
    </div>
  </div>`;
  const exams = ["全部", ...new Set(REG.order.flatMap(id => REG.subjects[id].exams))];
  h += `<h3 class="sec rise" style="--d:9"><span class="orn">✦</span>科目<span class="chips">${exams.map(x => `<button class="chip ${x === filter ? "on" : ""}" data-f="${x}">${x}</button>`).join("")}</span></h3><div class="subs">` +
    REG.order.filter(id => filter === "全部" || REG.subjects[id].exams.includes(filter)).map((id, n) => { const S = REG.subjects[id], st = logStats(id), nw = keysOf(id).filter(k => wrong[k]).length;
      const ess = essaysOf(id), known = ess.filter(e => rate[e.id] === 2).length;
      const pct = S.essayOnly ? (ess.length ? Math.round(known / ess.length * 100) : 0) : st.rate;
      const line = S.essayOnly ? `申論熟練 <b>${known}</b>／${ess.length}<br>${st.last ? "上次 " + st.last.slice(5).replace("-", "/") : "還沒開始"}` : `作答 <b>${st.total}</b> 題<br>${st.last ? "上次 " + st.last.slice(5).replace("-", "/") : "還沒開始"}`;
      return `<a class="card sub rise" style="--d:${10 + n}" href="subject.html#${id}"><div class="shine"></div>
        <div class="subtop"><div class="ico">${S.icon}</div><div>${S.exams.map(x => `<span class="tag ${x === "國營" ? "warm" : "acc"}">${x}</span>`).join("")}</div></div>
        <h4>${esc(S.name)}</h4>
        <p>${S.chapters.length} 章${keysOf(id).length ? "・" + keysOf(id).length + " 題" : ""}${ess.length ? "・申論 " + ess.length : ""}${nw ? `・<span style="color:var(--redt)">錯題 ${nw}</span>` : ""}</p>
        <div class="ring">${ring(pct)}<div class="t">${line}</div></div><span class="go">→</span></a>`; }).join("") + `</div>`;
  return h;
}
// 往下捲時，大 logo 飛到左上角「考試複習」旁邊
let flyOff = null;
function setupFly() {
  if (flyOff) { flyOff(); flyOff = null; }
  const art = $(".hero-art"), fl = $(".flyer"), halo = $(".halo"), tgt = $(".brand img");
  const mobile = matchMedia("(max-width: 720px)").matches;
  document.body.classList.toggle("homefly", !!art && mobile);
  if (!art || !tgt || !mobile) { if (art) { $(".flyer").style.transform = ""; $(".halo").style.opacity = ""; $(".flyer").style.opacity = ""; } return; }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { document.body.classList.remove("homefly"); return; }
  let A = null, raf = 0;
  const measure = () => { fl.style.transform = ""; const r = fl.getBoundingClientRect(); A = { x: r.left + r.width / 2, y: r.top + scrollY + r.height / 2, w: r.width }; };
  const frame = () => { raf = 0; if (!A) measure();
    const t = tgt.getBoundingClientRect(), tx = t.left + t.width / 2, ty = t.top + t.height / 2;
    const dist = Math.max(120, A.y - ty), s = scrollY, p0 = Math.min(1, Math.max(0, s / dist)), p = p0 * p0 * (3 - 2 * p0);
    const cy = A.y * (1 - p) + ty * p, cx = A.x + (tx - A.x) * p, k = 1 + (t.width / A.w - 1) * p;
    fl.style.transform = `translate(${cx - A.x}px, ${cy - (A.y - s)}px) scale(${k})`;
    halo.style.opacity = 1 - p; fl.style.opacity = p0 >= 1 ? 0 : 1; tgt.style.opacity = p0 >= 1 ? 1 : 0; };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const onResize = () => { if (!matchMedia("(max-width: 720px)").matches) { setupFly(); return; } A = null; onScroll(); };
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onResize);
  setTimeout(() => { A = null; frame(); }, 900);
  flyOff = () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onResize); tgt.style.opacity = ""; };
}
function animateCounts(root) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll("[data-count]").forEach(el => { const to = +el.dataset.count;
    if (reduce || !to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1100 + Math.min(600, to * 4);
    const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); };
    setTimeout(() => requestAnimationFrame(step), 350); });
}
// ===== 考試倒數：月曆＋管理 =====
let calMonth = null;
function examsView() {
  const t = todayTW(), ex = getExams().slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!calMonth) { const next = ex.find(e => e.date >= t); calMonth = t.slice(0, 7); }
  const [Y, M] = calMonth.split("-").map(Number), first = new Date(Date.UTC(Y, M - 1, 1)), dim = new Date(Date.UTC(Y, M, 0)).getUTCDate();
  const byDate = {}; ex.forEach(e => (byDate[e.date] = byDate[e.date] || []).push(e));
  const skips = typeof planSkips === "function" ? planSkips() : [];
  let cells = ""; for (let i = 0; i < first.getUTCDay(); i++) cells += `<div class="cal-c empty"></div>`;
  for (let dd = 1; dd <= dim; dd++) { const ds = `${Y}-${String(M).padStart(2, "0")}-${String(dd).padStart(2, "0")}`, es = byDate[ds] || [];
    cells += `<div class="cal-c ${ds === t ? "today" : ""} ${es.length ? "exam" : ""} ${ds < t ? "past" : ""}"><span class="cal-n">${dd}</span>${es.map(e => `<span class="cal-e">${esc(e.name)}</span>`).join("")}${skips.includes(ds) ? `<span class="cal-s">順延</span>` : ""}</div>`; }
  const list = ex.map(e => { const n = daysUntil(e.date);
    return `<div class="exrow" data-id="${esc(e.id)}"><div class="exn"><b>${n >= 0 ? n : "—"}</b><span>${n > 0 ? "天" : n === 0 ? "就是今天" : "已結束"}</span></div>
      <div class="exf"><input class="ex-name" value="${esc(e.name)}" placeholder="考試名稱"><input class="ex-date" type="date" value="${esc(e.date)}"><input class="ex-note" value="${esc(e.note || "")}" placeholder="備註（可不填）"></div>
      <div class="exb">${e.id === "cht" ? `<span class="tag acc">連動讀書計畫</span>` : `<button class="btn sm ex-del">刪除</button>`}</div></div>`; }).join("");
  return `<section class="shero"><div class="hello">考試倒數</div><h1>每一天都算數</h1></section>
  <section class="card"><div class="calhead"><button class="btn sm" id="calprev">‹</button><h2>${Y} 年 ${M} 月</h2><button class="btn sm" id="calnext">›</button><button class="btn sm" id="caltoday">今天</button></div>
    <div class="cal">${"日一二三四五六".split("").map(w => `<div class="cal-w">${w}</div>`).join("")}${cells}</div>
    <div class="calnext">${ex.filter(e => e.date >= t).map(e => `<button class="chip" data-jump="${e.date.slice(0, 7)}">${esc(e.name)} ${e.date.slice(5).replace("-", "/")}</button>`).join("")}</div></section>
  <section class="card"><h2>我的考試</h2><p class="small muted">直接改名稱或日期就會自動存檔。「中華電信筆試」的日期會連動讀書計畫，改了計畫會自動重排。</p>
    <div class="exlist">${list || `<p class="muted">還沒有考試</p>`}</div>
    <h3 class="sub">新增考試</h3>
    <div class="exadd"><input id="na-name" placeholder="例如：國營聯招筆試"><input id="na-date" type="date"><input id="na-note" placeholder="備註（可不填）"><button class="btn pri" id="na-save">新增</button></div>
    <div id="na-msg" class="small" style="color:var(--redt)"></div></section>`;
}
function bindExams() {
  const ex = () => getExams();
  document.querySelectorAll(".exrow").forEach(row => {
    const id = row.dataset.id, upd = () => { const a = ex(), e = a.find(x => x.id === id); if (!e) return;
      const d = row.querySelector(".ex-date").value; if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      e.name = row.querySelector(".ex-name").value.trim() || e.name; e.date = d; e.note = row.querySelector(".ex-note").value.trim();
      saveExams(a); if (id === "cht" && typeof initSchedule === "function") initSchedule(); };
    row.querySelectorAll("input").forEach(i => i.onchange = () => { upd(); render(); });
    const del = row.querySelector(".ex-del"); if (del) del.onclick = () => { saveExams(ex().filter(x => x.id !== id)); render(); };
  });
  const sv = $("#na-save"); if (sv) sv.onclick = () => { const n = $("#na-name").value.trim(), d = $("#na-date").value;
    if (!n || !d) { $("#na-msg").textContent = "名稱和日期都要填"; return; }
    const a = ex(); a.push({ id: Date.now().toString(36), name: n, date: d, note: $("#na-note").value.trim() }); saveExams(a); calMonth = d.slice(0, 7); render(); };
  const mv = k => { const [Y, M] = calMonth.split("-").map(Number), d = new Date(Date.UTC(Y, M - 1 + k, 1)); calMonth = d.toISOString().slice(0, 7); render(); };
  const p = $("#calprev"); if (p) p.onclick = () => mv(-1);
  const n2 = $("#calnext"); if (n2) n2.onclick = () => mv(1);
  const td = $("#caltoday"); if (td) td.onclick = () => { calMonth = todayTW().slice(0, 7); render(); };
  document.querySelectorAll("[data-jump]").forEach(b => b.onclick = () => { calMonth = b.dataset.jump; render(); });
}
function backupNag() {
  const last = LS.get("examhub_lastbackup", 0), n = Log.all().length;
  if (n < 20 || Date.now() - last < 7 * 864e5) return "";
  return `<div class="notice">💾 ${last ? "已經超過 7 天沒備份了" : "你還沒有備份過"}，練習紀錄只存在這台裝置。<a href="#backup">現在備份 →</a></div>`;
}
function render() {
  const v = ["home", "exams", "history", "backup"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  let body = "";
  if (v === "home") body = backupNag() + home();
  if (v === "exams") body = examsView();
  if (v === "history") body = `<section class="shero"><div class="hello">練習紀錄</div><h1>看看自己走了多遠</h1></section><section class="card"><div id="hist"></div></section>`;
  if (v === "backup") body = `<section class="shero"><div class="hello">雲端同步與備份</div><h1>把進度帶著走</h1></section><section class="card" id="syncpanel">${syncPanelHTML()}</section><section class="card"><h2>💾 手動備份</h2>${backupHTML()}</section>`;
  $("#app").innerHTML = `<div class="top"><a class="brand" href="index.html"><img src="logo.png" alt="">考試複習</a>
    <nav><a href="#home" class="${v === "home" ? "on" : ""}">首頁</a><a href="#exams" class="${v === "exams" ? "on" : ""}">倒數</a><a href="#history" class="${v === "history" ? "on" : ""}">紀錄</a><a href="#backup" class="${v === "backup" ? "on" : ""}">同步</a></nav>${syncBadge()}</div>` + body +
    `<footer>練習紀錄只存在這台裝置的瀏覽器・換裝置請用「備份」</footer>
    <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--warm)"/></linearGradient></defs></svg>`;
  if ($("#hist")) renderHistory($("#hist"), { onRedo: ks => { const s = QBANK[ks[0]].sub; location.href = "subject.html#" + s + "-wrong"; } });
  bindBackup(); bindSyncPanel(render); if (v === "exams") bindExams(); animateCounts($("#app")); setupFly();
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { filter = b.dataset.f; LS.set("examhub_pf", filter); render(); });
}
buildBank(); initSchedule();
addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
render();
