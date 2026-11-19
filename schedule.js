// ===== 中華電信讀書計畫：依「開始日」自動排程 =====
// 週一～四讀滿、週五與週日晚上輕量、週六放假；2/22 起衝刺；考試日預估 2027/3/13
// 忙的時候可以按「順延」：那天變休息，後面的進度全部往後推一天
// ===== 考試倒數清單（入口網站可以新增、修改）=====
// id 為 "cht" 的那一筆會連動中華電信讀書計畫的考試日
const DEFAULT_EXAMS = [{ id: "cht", name: "中華電信筆試", date: "2027-03-13", note: "預估，以簡章為準" }];
function getExams() { try { const a = JSON.parse(localStorage.getItem("examhub_exams") || "null"); return Array.isArray(a) && a.length ? a : DEFAULT_EXAMS.slice(); } catch (e) { return DEFAULT_EXAMS.slice(); } }
function saveExams(a) { LS.set("examhub_exams", a); }
function chtExamDate() { const e = getExams().find(x => x.id === "cht"); return e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : DEFAULT_EXAMS[0].date; }
const daysUntil = d => Math.ceil((Date.parse(d + "T00:00:00+08:00") - Date.parse(todayTW() + "T00:00:00+08:00")) / 864e5);
const PLAN = {
  get exam() { return chtExamDate(); },
  get sprint() { return new Date(Date.parse(this.exam + "T00:00:00Z") - 19 * 864e5).toISOString().slice(0, 10); },
  defaultStart: "2026-11-19",
  light: ["2027-02-05", "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09"], // 春節輕量
  get notes() { const add = n => new Date(Date.parse(this.exam + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
    return { "2026-12-22": "留意116年簡章（115年是 12/29 公告）", "2027-01-04": "報名可能開始（115年為 1/2–2/2）",
      "2027-02-01": "確認已報名繳費（115年 2/2 截止）", [add(-8)]: "查詢入場通知書", [add(-1)]: "考前一天：只看申論架構＋錯題，早點睡" }; },
  priority: ["E01", "E02", "E03", "E05", "E07", "E08", "E10", "E15", "E19", "E04", "E06", "E09", "E11", "E12", "E13", "E14", "E20", "E22", "E26", "E30"],
};
let SCHEDULE = [];
function planStart() { try { const s = JSON.parse(localStorage.getItem("cht_start") || "null"); return /^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s : PLAN.defaultStart; } catch (e) { return PLAN.defaultStart; } }
function planSkips() { try { const a = JSON.parse(localStorage.getItem("cht_skip") || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function buildSchedule(start, skips) {
  skips = skips || [];
  const WD = "日一二三四五六", add = (s, n) => new Date(Date.parse(s + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const wdOf = s => new Date(s + "T00:00:00Z").getUTCDay();          // 0=日 … 6=六
  const isStudy = s => { const w = wdOf(s); return w >= 1 && w <= 4 && !PLAN.light.includes(s) && !skips.includes(s); };
  const ET = id => (EMAP[id] ? EMAP[id].t : id);
  const E = [...essaysOf("mgmt"), ...essaysOf("mkt")].filter(e => /^E\d+$/.test(e.id)).map(e => e.id).sort();
  const M = REG.subjects.mgmt.chapters.map(c => c.id), K = REG.subjects.mkt.chapters.map(c => c.id);
  const order = []; for (let i = 0; i < Math.max(M.length, K.length); i++) { if (M[i]) order.push(M[i]); if (K[i]) order.push(K[i]); }
  const G = REG.subjects.eng.chapters.map(c => c.t), NV = Math.floor(((REG.subjects.eng.vocab || []).length || 8) / 8) * 8;
  if (start > PLAN.exam) start = PLAN.exam;
  // 衝刺前有幾個讀書日，不夠就一天排兩章／兩題申論
  let pre = 0; for (let s = start; s < PLAN.sprint; s = add(s, 1)) if (isStudy(s)) pre++;
  const cpd = pre >= order.length ? 1 : 2, epd = pre >= E.length ? 1 : 2;
  const NOTES = PLAN.notes;
  const days = []; let ei = 0, ci = 0, rnd = 0, vi = 0, li = 0, sp = 0, timed = 0, wkEs = [], hist = [];
  for (let s = start; s <= PLAN.exam; s = add(s, 1)) {
    const w = wdOf(s), wk = Math.floor((Date.parse(s) - Date.parse(start)) / 864e5 / 7), g = wk % G.length;
    const x = { d: s, w: WD[w], note: NOTES[s] || null };
    if (s === PLAN.exam) { Object.assign(x, { type: "exam", phase: "考試", pro: "📝 預估考試日（以116年簡章為準）", eng: "—", note: "帶准考證、2B 鉛筆、黑筆" }); days.push(x); continue; }
    if (skips.includes(s)) { Object.assign(x, { type: "skip", phase: "順延休息", pro: "⏸ 今天先休息，進度已往後推一天", eng: "—" }); days.push(x); continue; }
    if (PLAN.light.includes(s)) { wkEs = []; Object.assign(x, { type: "light", phase: "過年", review: hist.slice(-4), pro: "🧧 過年輕量：翻申論架構 20 分鐘", eng: "單字複習（不學新字）", note: x.note || "休息也是進度" }); days.push(x); continue; }
    if (w === 6) { Object.assign(x, { type: "rest", phase: "週六放假", pro: "😴 週六放假，好好休息", eng: "—" }); days.push(x); continue; }
    if (w === 5 || w === 0 || s === add(PLAN.exam, -1)) {
      if (w === 0) {
        let rev; if (ei < E.length) rev = hist.slice(-8, -4).length ? hist.slice(-8, -4) : hist.slice(0, 2);
        else { if (sp >= hist.length) sp = 0; rev = hist.slice(sp, sp + 4); sp += 4; }
        Object.assign(x, { type: "sun", phase: "週日晚輕量", review: rev, vocabReview: true, logic: [li, li + 1, li + 2] }); li += 3;
        x.pro = "晚上輕量 40 分：申論回憶 " + (rev.length ? rev.map(ET).join("、") : "本週題目") + "（只默寫架構）"; x.eng = "本週單字快速複習＋邏輯思維 3 題";
      } else {
        const rev = wkEs.length ? wkEs.slice() : hist.slice(-3);
        Object.assign(x, { type: "fri", phase: "週五晚輕量", review: rev, vocabReview: true, wrong: true });
        x.pro = "晚上輕量 40 分：本週申論默寫架構（" + (rev.length ? rev.map(ET).join("、") : "本週題目") + "）＋錯題本"; x.eng = "本週單字快速複習"; wkEs = [];
      }
      days.push(x); continue;
    }
    x.type = "study"; x.grammar = g; x.vocab = vi; vi = (vi + 8) % NV;
    const gname = G[g];
    if (s >= PLAN.sprint && ei >= E.length && ci >= order.length) {
      const e = PLAN.priority[timed % PLAN.priority.length]; timed++;
      Object.assign(x, { phase: "3 衝刺", essayTimed: e, quizMix: true, wrong: true }); wkEs.push(e);
      x.pro = `計時申論 25 分：「${ET(e)}」＋混合題庫 20 題＋錯題本`;
      x.eng = w === 4 ? "國營歷屆英文半份計時（約 25 題）" : "8 個單字＋文法題；週四改做歷屆英文半份計時";
    } else {
      let es;
      if (ei < E.length) {
        const news = E.slice(ei, ei + epd); ei += news.length; x.essayNews = news; news.forEach(n => { hist.push(n); wkEs.push(n); });
        const prev = hist.slice(-news.length - 1, -news.length); x.review = prev;
        es = `申論 40 分：背「${news.map(ET).join("」「")}」` + (prev.length ? `＋默寫「${ET(prev[0])}」` : "");
      } else { const e = PLAN.priority[timed % PLAN.priority.length]; timed++; x.essayTimed = e; wkEs.push(e); es = `申論 40 分：計時寫「${ET(e)}」`; }
      let cs;
      if (ci < order.length) {
        const cs2 = order.slice(ci, ci + cpd); ci += cs2.length; x.chapters = cs2; x.phase = "1 申論＋章節";
        cs = cs2.map(id => `【${REG.subjects[CMAP[id].sub].name}】${CMAP[id].t}`).join("＋") + "：讀重點＋做題 50 分";
      } else {
        const a = order[(rnd * 2) % order.length], b = order[(rnd * 2 + 1) % order.length]; rnd++;
        Object.assign(x, { quizChapters: [a, b], wrong: true, phase: s >= PLAN.sprint ? "3 衝刺" : "2 刷題＋申論" });
        cs = `刷題 50 分：${CMAP[a].t}＋${CMAP[b].t}（含錯題重做）`;
      }
      x.pro = es + "／" + cs;
      x.eng = `單字第 ${x.vocab + 1}–${x.vocab + 8} 個＋文法「${gname}」4 題`;
    }
    days.push(x);
  }
  return days;
}
function initSchedule() { SCHEDULE = buildSchedule(planStart(), planSkips()); }
