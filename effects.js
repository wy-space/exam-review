// ================================================================
// 四季與節日特效
// 農曆節日每年日期不同，需要時在 HOLIDAYS 裡改日期（格式 "YYYY-MM-DD"）
// 固定日期的節日用 "MM-DD"
// 右下角的 ✨ 按鈕可以開關特效
// ================================================================
const HOLIDAYS = [
  { name: "元旦", from: "01-01", to: "01-01", items: ["🎉", "✨", "🎊"], fw: true, msg: "新年快樂！新的一年，上榜的一年 🎉" },
  { name: "春節", from: "2027-02-05", to: "2027-02-10", items: ["🧧", "🏮", "🧨", "✨"], fw: true, msg: "新年快樂！過年輕量讀，休息也是進度 🧧" },
  { name: "情人節", from: "02-14", to: "02-14", items: ["💕", "💗", "🌹"], msg: "情人節快樂 💕 今天也要愛自己" },
  { name: "元宵節", from: "2027-02-20", to: "2027-02-20", items: ["🏮", "🌕", "✨"], msg: "元宵節快樂 🏮" },
  { name: "考前加油", from: "2027-03-10", to: "2027-03-13", items: ["🍀", "✨", "💯"], msg: "考前衝刺！你已經準備很久了，加油 🍀" },
  { name: "兒童節", from: "04-04", to: "04-04", items: ["🎈", "🍭", "🎈"], msg: "兒童節快樂 🎈" },
  { name: "端午節", from: "2027-06-09", to: "2027-06-09", items: ["🐉", "🍙", "🌿"], msg: "端午節快樂 🐉" },
  { name: "七夕", from: "2027-08-08", to: "2027-08-08", items: ["💫", "⭐", "💕"], msg: "七夕快樂 💫" },
  { name: "中秋節", from: "2027-09-15", to: "2027-09-15", items: ["🌕", "🐰", "🥮", "✨"], msg: "中秋節快樂 🌕" },
  { name: "國慶日", from: "10-10", to: "10-10", items: ["🎆", "✨"], fw: true, msg: "國慶日快樂 🎆" },
  { name: "萬聖節", from: "10-31", to: "10-31", items: ["🎃", "🦇", "👻", "🍬"], msg: "Happy Halloween 🎃" },
  { name: "聖誕節", from: "12-24", to: "12-25", items: ["❄️", "🎄", "🎁", "⭐"], msg: "聖誕快樂 🎄" },
  { name: "跨年", from: "12-31", to: "12-31", items: ["🎆", "✨", "🥂"], fw: true, msg: "跨年快樂！明年見 🎆" },
];
const SEASONS = {
  spring: { items: ["🌸", "🌸", "🌷"], name: "春" },   // 3–5 月：櫻花飄落
  summer: { items: ["✨", "🌿", "☀️"], name: "夏", glow: true }, // 6–8 月：光點
  autumn: { items: ["🍁", "🍂", "🍁"], name: "秋" },   // 9–11 月：楓葉
  winter: { items: ["❄️", "❄", "✻"], name: "冬" },    // 12–2 月：雪花
};
(function () {
  let on = true; try { on = localStorage.getItem("examhub_fx") !== "off"; } catch (e) {}
  if (matchMedia("(prefers-reduced-motion: reduce)").matches && localStorage.getItem("examhub_fx") == null) on = false;
  const now = new Date(Date.now() + 8 * 3600e3), ymd = now.toISOString().slice(0, 10), md = ymd.slice(5), m = now.getUTCMonth() + 1;
  const inRange = h => { const f = h.from.length === 5 ? md : ymd, a = h.from, b = h.to; return f >= a && f <= b; };
  const hol = HOLIDAYS.find(inRange);
  const season = m >= 3 && m <= 5 ? "spring" : m <= 8 && m >= 6 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
  const set = hol || SEASONS[season];

  // 節日橫幅
  if (hol) {
    const b = document.createElement("div"); b.className = "fxbanner"; b.textContent = hol.msg;
    document.body.insertBefore(b, document.body.firstChild);
  }
  // 開關按鈕
  const t = document.createElement("button"); t.className = "fxtoggle"; t.title = "開關季節特效";
  t.textContent = on ? "✨" : "○"; document.body.appendChild(t);
  const cv = document.createElement("canvas"); cv.className = "fxcanvas"; document.body.insertBefore(cv, document.body.firstChild);
  const ctx = cv.getContext("2d"); let W, H, parts = [], fws = [], raf = null, frame = 0;
  const resize = () => { const r = devicePixelRatio || 1; W = innerWidth; H = innerHeight; cv.width = W * r; cv.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0); };
  const N = () => Math.round(Math.min(26, Math.max(12, W / 50)));
  const mk = (top) => ({ x: Math.random() * W, y: top ? -30 - Math.random() * H : Math.random() * H, s: 12 + Math.random() * 12,
    vy: set.glow ? -0.15 - Math.random() * 0.3 : 0.35 + Math.random() * 0.8, vx: -0.3 + Math.random() * 0.6, r: Math.random() * 6.28, vr: -0.02 + Math.random() * 0.04,
    sw: Math.random() * 6.28, e: set.items[Math.floor(Math.random() * set.items.length)], a: 0.55 + Math.random() * 0.35 });
  function boom() { const x = W * (0.15 + Math.random() * 0.7), y = H * (0.12 + Math.random() * 0.35), hue = Math.random() * 360;
    for (let i = 0; i < 46; i++) { const ang = i / 46 * 6.28, sp = 1.2 + Math.random() * 2.4; fws.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 70 + Math.random() * 30, hue }); } }
  function tick() {
    frame++; ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.sw += 0.02; p.x += p.vx + Math.sin(p.sw) * 0.4; p.y += p.vy; p.r += p.vr;
      if (set.glow) { p.a = 0.35 + Math.abs(Math.sin(p.sw * 1.5)) * 0.5; if (p.y < -30) Object.assign(p, mk(false), { y: H + 20 }); }
      else if (p.y > H + 30) Object.assign(p, mk(true), { y: -30 });
      ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.font = p.s + "px serif"; ctx.textAlign = "center"; ctx.fillText(p.e, 0, 0); ctx.restore();
    });
    if (hol && hol.fw) {
      if (frame % 90 === 1) boom();
      fws = fws.filter(f => f.life > 0);
      fws.forEach(f => { f.x += f.vx; f.y += f.vy; f.vy += 0.025; f.vx *= 0.985; f.life--;
        ctx.globalAlpha = Math.min(1, f.life / 50); ctx.fillStyle = `hsl(${f.hue},90%,60%)`; ctx.beginPath(); ctx.arc(f.x, f.y, 2, 0, 6.28); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(tick);
  }
  function start() { resize(); parts = Array.from({ length: N() }, () => mk(false)); cv.style.display = "block"; if (!raf) tick(); }
  function stop() { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, W, H); cv.style.display = "none"; }
  addEventListener("resize", () => { if (raf) { resize(); } });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { cancelAnimationFrame(raf); raf = null; } else if (on && !raf) tick(); });
  t.onclick = () => { on = !on; try { localStorage.setItem("examhub_fx", on ? "on" : "off"); } catch (e) {} t.textContent = on ? "✨" : "○"; on ? start() : stop(); };
  if (on) start(); else cv.style.display = "none";
})();
