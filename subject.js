// ===== 單科頁：subject.html#科目id-分頁 =====
let practiceKeys = null, practiceTitle = "", lastSid = null;
function parseHash() { const [sid0, view] = location.hash.slice(1).split("-"); const sid = REG.subjects[sid0] ? sid0 : REG.order[0]; return { sid, view: view || (REG.subjects[sid].essayOnly ? "essays" : "notes") }; }
function tabs(S, view) {
  const hasQ = keysOf(S.id).length > 0 || !S.essayOnly;
  const t = [...(S.essayOnly ? [["essays", "申論"], ["notes", "重點"]] : [["notes", "重點"], ...(essaysOf(S.id).length ? [["essays", "申論"]] : [])]), ...(hasQ ? [["practice", "練習"], ["wrong", "錯題本"]] : []),
    ...(S.vocab ? [["vocab", "單字"]] : []), ["add", "＋新增題目"], ["history", "紀錄"]];
  return `<div class="tabs">${t.map(([k, n]) => `<a href="#${S.id}-${k}" class="${k === view ? "on" : ""}">${n}${k === "wrong" ? ` <span class="badge">${keysOf(S.id).filter(x => wrong[x]).length || ""}</span>` : ""}</a>`).join("")}</div>`;
}
function vNotes(S) {
  return S.chapters.map(c => `<section class="card"><div class="label">${esc(c.id)}</div>${notesHTML(c)}
    ${c.keys.length ? `<button class="btn sm" data-prac="${c.id}">練習這章（${c.keys.length} 題）</button>` : ""}</section>`).join("");
}
function vEssays(S) {
  const f = LS.get("examhub_ef_" + S.id, "全部"), memo = LS.get("examhub_memo", true);
  const tags = [...new Set(essaysOf(S.id).map(e => e.tag ? e.tag.replace(/ .*/, "") : "").filter(Boolean))];
  const list = essaysOf(S.id).filter(e => f === "全部" || (f === "還沒熟的" ? rate[e.id] !== 2 : (e.tag || "").startsWith(f)));
  return `<div class="toolbar">${["全部", ...tags, "還沒熟的"].map(x => `<button class="btn sm ${x === f ? "pri" : ""}" data-ef="${x}">${x}</button>`).join("")}
    <label class="small inl"><input type="checkbox" id="memo" ${memo ? "checked" : ""}> 背誦模式（先隱藏架構）</label></div>
    <p class="small muted">共 ${essaysOf(S.id).length} 題，已熟 ${essaysOf(S.id).filter(e => rate[e.id] === 2).length} 題。</p>` +
    (list.map(e => `<section class="card">${essayHTML(e.id, memo ? "memo" : "bank")}</section>`).join("") || `<p class="muted">這裡還沒有申論題，可以到「＋新增題目」加。</p>`);
}
function vPractice(S) {
  const sel = LS.get("examhub_ps_" + S.id, "all");
  if (!practiceKeys) {
    const all = keysOf(S.id);
    if (sel === "all") { practiceKeys = all; practiceTitle = "全部題目"; }
    else if (sel === "rand") { practiceKeys = shuffle(all).slice(0, 20); practiceTitle = "隨機 20 題"; }
    else if (sel === "mine") { practiceKeys = all.filter(k => QBANK[k].mine); practiceTitle = "我新增的題目"; }
    else { practiceKeys = CMAP[sel] ? CMAP[sel].keys : []; practiceTitle = CMAP[sel] ? CMAP[sel].t : ""; }
  }
  return `<div class="toolbar"><select id="psel"><option value="all">全部題目（${keysOf(S.id).length}）</option><option value="rand" ${sel === "rand" ? "selected" : ""}>隨機 20 題</option>
    <option value="mine" ${sel === "mine" ? "selected" : ""}>我新增的題目</option>${S.chapters.map(c => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${esc(c.t)}（${c.keys.length}）</option>`).join("")}</select>
    <button class="btn sm" id="pre">重新出題</button></div><p class="small muted">${esc(practiceTitle)}・答錯會自動進錯題本</p>` +
    `<section class="card">${quizHTML(practiceKeys, { empty: "這個範圍還沒有題目" })}</section>`;
}
function vWrong(S) {
  const ks = keysOf(S.id).filter(k => wrong[k]).sort((a, b) => wrong[b] - wrong[a]);
  return `<p class="small muted">答錯的題目留在這裡，重做答對就會移出。共 ${ks.length} 題。</p><section class="card">${quizHTML(ks, { empty: "目前沒有錯題 🎉" })}</section>`;
}
function vVocab(S) {
  const q = LS.get("examhub_vq", "");
  const list = S.vocab.filter(([en, zh]) => !q || en.toLowerCase().includes(q.toLowerCase()) || zh.includes(q));
  return `<section class="card"><input id="vsearch" placeholder="搜尋英文或中文" value="${esc(q)}"><table class="vt">${list.map(([en, zh]) => `<tr><td>${esc(en)}</td><td>${esc(zh)}</td></tr>`).join("")}</table></section>`;
}
function vAdd(S) {
  const mineQ = custom.q.filter(x => x.sub === S.id), mineE = custom.e.filter(x => x.sub === S.id);
  const code = mineQ.map(x => `        ${JSON.stringify(x.q)}, ${JSON.stringify(x.o)}, "${"ABCD"[x.a]}", ${JSON.stringify(x.x || "")}`).map(l => "[" + l.trim() + "],");
  return `<section class="card"><h2>新增選擇題</h2>
    <label>章節<select id="aq-ch">${S.chapters.map(c => `<option value="${c.id}">${esc(c.t)}</option>`).join("")}</select></label>
    <label>題目<textarea id="aq-q" rows="2" placeholder="例如：Maslow 需求層級最高層是？"></textarea></label>
    <div class="optin">${[0, 1, 2, 3].map(i => `<label class="oi"><input type="radio" name="aq-a" value="${i}" ${i === 0 ? "checked" : ""}><b>${"ABCD"[i]}</b><input id="aq-o${i}" placeholder="選項 ${"ABCD"[i]}"></label>`).join("")}</div>
    <p class="small muted">圈選的那個選項是正解。</p>
    <label>解析（可不填）<input id="aq-x" placeholder="為什麼是這個答案"></label>
    <div class="toolbar"><button class="btn pri" id="aq-save">加入題庫</button><span id="aq-msg" class="small"></span></div></section>
  <section class="card"><h2>新增申論題</h2>
    <label>標題<input id="ae-t" placeholder="例如：Porter 價值鏈"></label>
    <label>題目<textarea id="ae-q" rows="2" placeholder="請說明……"></textarea></label>
    <label>作答架構（一行一點）<textarea id="ae-a" rows="6" placeholder="【定義】……&#10;1. ……&#10;2. ……"></textarea></label>
    <label>記憶口訣（可不填）<input id="ae-tip"></label>
    <div class="toolbar"><button class="btn pri" id="ae-save">加入申論題庫</button><span id="ae-msg" class="small"></span></div></section>
  <section class="card"><h2>我新增的（${mineQ.length} 題選擇、${mineE.length} 題申論）</h2>
    ${mineQ.map(x => `<div class="mine"><div><b>${esc(x.q)}</b><div class="small muted">正解 ${"ABCD"[x.a]}：${esc(x.o[x.a])}・${esc(CMAP[x.ch] ? CMAP[x.ch].t : "")}</div></div><button class="btn sm" data-delq="${x.id}">刪除</button></div>`).join("")}
    ${mineE.map(x => `<div class="mine"><div><b>申論：${esc(x.t)}</b></div><button class="btn sm" data-dele="${x.id}">刪除</button></div>`).join("")}
    ${mineQ.length ? `<details><summary class="small">想永久寫進檔案？（進階）</summary><p class="small muted">複製下面的內容，貼到 GitHub 上 s-${S.id}.js 對應章節的 q: [ ] 裡。寫進檔案後，換裝置不用還原也看得到；記得把這裡的題目刪掉，避免重複。</p><textarea rows="5" readonly>${esc(code.join("\n"))}</textarea></details>` : `<p class="small muted">還沒有新增的題目。新增的題目存在這台裝置，備份時會一起帶走。</p>`}</section>`;
}
function render() {
  const { sid, view } = parseHash(), S = REG.subjects[sid];
  if (lastSid && lastSid !== sid) practiceKeys = null; lastSid = sid;
  document.title = S.name + "｜考試複習";
  let body = "";
  if (view === "notes") body = vNotes(S);
  else if (view === "essays") body = vEssays(S);
  else if (view === "practice") body = vPractice(S);
  else if (view === "wrong") body = vWrong(S);
  else if (view === "vocab" && S.vocab) body = vVocab(S);
  else if (view === "add") body = vAdd(S);
  else if (view === "history") body = `<section class="card"><div id="hist"></div></section>`;
  else body = vNotes(S);
  $("#app").innerHTML = topbar(sid) + `<section class="shero"><div class="hello">${S.exams.map(x => `<span class="tag ${x === "國營" ? "warm" : "acc"}">${x}</span>`).join("")} ${esc(S.note || "")}</div>
    <h1>${S.icon} ${esc(S.name)}</h1><div class="small muted">${S.chapters.length} 章${keysOf(sid).length ? "・" + keysOf(sid).length + " 題選擇" : ""}${essaysOf(sid).length ? "・" + essaysOf(sid).length + " 題申論" : ""}</div></section>` + tabs(S, view) + `<main>${body}</main>`;
  const m = $("main");
  bindQuiz(m); bindEssays(m); bindVocab(m);
  if ($("#hist")) renderHistory($("#hist"), { sub: sid, onRedo: ks => { practiceKeys = ks; practiceTitle = "重做答錯的題目"; location.hash = sid + "-practice"; } });
  m.querySelectorAll("[data-prac]").forEach(b => b.onclick = () => { LS.set("examhub_ps_" + sid, b.dataset.prac); practiceKeys = null; location.hash = sid + "-practice"; });
  m.querySelectorAll("[data-ef]").forEach(b => b.onclick = () => { LS.set("examhub_ef_" + sid, b.dataset.ef); render(); });
  const memo = $("#memo"); if (memo) memo.onchange = e => { LS.set("examhub_memo", e.target.checked); render(); };
  const ps = $("#psel"); if (ps) ps.onchange = e => { LS.set("examhub_ps_" + sid, e.target.value); practiceKeys = null; render(); };
  const pre = $("#pre"); if (pre) pre.onclick = () => { practiceKeys = null; render(); };
  const vs = $("#vsearch"); if (vs) vs.oninput = e => { LS.set("examhub_vq", e.target.value); const p = e.target.selectionStart; render(); const v = $("#vsearch"); v.focus(); v.setSelectionRange(p, p); };
  const aqs = $("#aq-save"); if (aqs) aqs.onclick = () => {
    const q = $("#aq-q").value.trim(), o = [0, 1, 2, 3].map(i => $("#aq-o" + i).value.trim()), a = +document.querySelector("input[name=aq-a]:checked").value;
    if (!q || o.some(x => !x)) { $("#aq-msg").textContent = "題目和四個選項都要填"; return; }
    custom.q.push({ id: Date.now().toString(36), sub: sid, ch: $("#aq-ch").value, q, o, a, x: $("#aq-x").value.trim() });
    saveState(); buildBank(); render(); $("#aq-msg") && ($("#aq-msg").textContent = "已加入 ✓");
  };
  const aes = $("#ae-save"); if (aes) aes.onclick = () => {
    const t = $("#ae-t").value.trim(), q = $("#ae-q").value.trim(), a = $("#ae-a").value.split("\n").map(s => s.trim()).filter(Boolean);
    if (!t || !a.length) { $("#ae-msg").textContent = "標題和架構要填"; return; }
    custom.e.push({ id: Date.now().toString(36), sub: sid, t, q: q || t, a, tip: $("#ae-tip").value.trim() });
    saveState(); buildBank(); render(); $("#ae-msg") && ($("#ae-msg").textContent = "已加入 ✓");
  };
  m.querySelectorAll("[data-delq]").forEach(b => b.onclick = () => { custom.q = custom.q.filter(x => x.id !== b.dataset.delq); saveState(); buildBank(); render(); });
  m.querySelectorAll("[data-dele]").forEach(b => b.onclick = () => { custom.e = custom.e.filter(x => x.id !== b.dataset.dele); saveState(); buildBank(); render(); });
}
buildBank();
addEventListener("hashchange", () => { if (!/-practice$/.test(location.hash) ) practiceKeys = null; render(); scrollTo(0, 0); });
render();
