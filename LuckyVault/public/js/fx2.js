// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// Glowing sprite sparkles for wins (Kenney Particle Pack, CC0): a full-screen canvas used by slot wins,
// table wins and the BIG WIN screen, plus a rotating light burst behind big-win amounts.
(function () {
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = {}; ['star', 'star2', 'spark', 'sym', 'flare'].forEach(n => { const i = new Image(); i.src = 'assets/fx/' + n + '.webp'; IMG[n] = i; });
  const cv = document.createElement('canvas'); cv.id = 'fx2'; cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9800;display:none'; document.body.appendChild(cv); const cx = cv.getContext('2d');
  const P = []; let run = false;
  function size() { const d = Math.min(2, devicePixelRatio || 1), w = innerWidth, h = innerHeight; if (cv.width !== w * d || cv.height !== h * d) { cv.width = w * d; cv.height = h * d; cv.style.width = w + 'px'; cv.style.height = h + 'px'; } cx.setTransform(d, 0, 0, d, 0, 0); }
  function add(p) { P.push(p); if (!run) { run = true; cv.style.display = 'block'; requestAnimationFrame(loop); } }
  // burst of sparkles from a point
  function sparkle(x, y, n, spread) { if (RM || document.hidden) return; size(); n = Math.min(120, n || 24); const S = ['star', 'star2', 'spark', 'sym'];
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, sp = (spread || 1) * (2 + Math.random() * 6);
      add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5, g: .12, life: 1, dec: .008 + Math.random() * .014, s: 20 + Math.random() * 40, rot: Math.random() * 6, vr: (Math.random() - .5) * .2, img: S[i % S.length] }); } }
  // sparkles falling over the whole screen (big wins)
  function rain(ms) { if (RM) return; size(); const t0 = performance.now(); const S = ['star', 'star2', 'sym', 'spark'];
    (function drop() { if (performance.now() - t0 > ms) return; for (let i = 0; i < 3; i++) add({ x: Math.random() * innerWidth, y: -30, vx: (Math.random() - .5) * 1.5, vy: 2 + Math.random() * 3, g: .03, life: 1, dec: .004 + Math.random() * .004, s: 18 + Math.random() * 34, rot: Math.random() * 6, vr: (Math.random() - .5) * .1, img: S[(Math.random() * 4) | 0] }); setTimeout(drop, 60); })(); }
  function loop() {
    cx.clearRect(0, 0, innerWidth, innerHeight); cx.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .985; p.rot += p.vr; p.life -= p.dec;
      if (p.life <= 0 || p.y > innerHeight + 40) { P.splice(i, 1); continue; } const im = IMG[p.img]; if (!im || !im.complete) continue;
      const tw = .65 + .35 * Math.sin(p.life * 20 + p.rot * 3); const s = p.s * (.6 + .4 * p.life);
      cx.globalAlpha = Math.min(1, p.life * 1.4) * tw; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.drawImage(im, -s / 2, -s / 2, s, s); cx.restore(); }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    if (P.length) requestAnimationFrame(loop); else { run = false; cx.clearRect(0, 0, innerWidth, innerHeight); cv.style.display = 'none'; } }
  window.LVSparkle = sparkle;
  window.LVSparkleAt = (el, n) => { if (!el) return; const r = el.getBoundingClientRect(); sparkle(r.left + r.width / 2, r.top + r.height / 2, n || 30, 1.2); };
  // slot wins: sparkles from the reels, more for bigger wins
  const t = setInterval(() => { if (typeof window.countWin !== 'function' || window.countWin._fx2) return; const c0 = window.countWin;
    window.countWin = function (v, label) { try { const bet = (typeof curBet === 'function' ? curBet() : 1) || 1, x = v / bet; if (x >= 1) { const b = document.getElementById('boardWrap'); if (b) { const r = b.getBoundingClientRect(); sparkle(r.left + r.width / 2, r.top + r.height / 2, Math.min(90, 10 + x * 3), Math.min(2.2, .9 + x / 30)); } } } catch (e) {} return c0.apply(this, arguments); };
    window.countWin._fx2 = true; clearInterval(t); }, 400);
  // BIG WIN screen: light burst behind the amount + sparkle rain while it is open
  const bw = document.getElementById('bw');
  if (bw) { const h = document.createElement('div'); h.className = 'fx2-halo'; h.innerHTML = '<i class="a"></i><i class="b"></i>'; bw.insertBefore(h, document.getElementById('bwT'));
    let on = false; new MutationObserver(() => { const s = bw.classList.contains('show'); if (s && !on) { on = true; rain(6000); const v = document.getElementById('bwV'); if (v) setTimeout(() => window.LVSparkleAt(v, 80), 200); } if (!s) on = false; }).observe(bw, { attributes: true, attributeFilter: ['class'] }); }
  const st = document.createElement('style'); st.textContent =
    '.fx2-halo{position:absolute;left:50%;top:50%;width:min(90vw,720px);height:min(90vw,720px);transform:translate(-50%,-52%);pointer-events:none;z-index:1}' +
    '.fx2-halo i{position:absolute;inset:0;background:center/contain no-repeat;mix-blend-mode:screen}.fx2-halo .a{background-image:url(assets/fx/burst.webp);opacity:.22;animation:fx2r 18s linear infinite}.fx2-halo .b{background-image:url(assets/fx/halo.webp);inset:24%;opacity:.4;animation:fx2q 1.6s ease-in-out infinite alternate}@keyframes fx2q{from{transform:scale(.9);opacity:.25}to{transform:scale(1.1);opacity:.45}}' +
    '@keyframes fx2r{to{transform:rotate(360deg)}}@keyframes fx2p{from{transform:scale(.85);opacity:.6}to{transform:scale(1.15);opacity:1}}' +
    '.spot.won::after{content:"";position:absolute;inset:-18px;background:url(assets/fx/halo.webp) center/contain no-repeat;mix-blend-mode:screen;pointer-events:none;animation:fx2p 1s ease-in-out infinite alternate;z-index:0}' +
    '@media(prefers-reduced-motion:reduce){.fx2-halo i,.spot.won::after{animation:none}}';
  document.head.appendChild(st);
})();

// Soft open/close blips for dialogs (Kenney Interface Sounds, CC0). Big-win and free-spin overlays keep their own sounds.
(function () {
  const SKIP = { bw: 1, fsov: 1 }; const seen = new WeakMap(); let last = 0;
  function blip(on) { const now = Date.now(); if (now - last < 120) return; last = now; try { if (typeof sfx !== 'undefined') (on ? sfx.uiOpen : sfx.uiClose) && (on ? sfx.uiOpen() : sfx.uiClose()); } catch (e) {} }
  function watch() {
    const mo = new MutationObserver(ms => { for (const m of ms) { const el = m.target; if (!el.classList || !el.classList.contains('ov') || SKIP[el.id]) continue; const on = el.classList.contains('show'); if (seen.get(el) === on) continue; seen.set(el, on); blip(on); } });
    document.querySelectorAll('.ov').forEach(el => { seen.set(el, el.classList.contains('show')); mo.observe(el, { attributes: true, attributeFilter: ['class'] }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();

// Haptics (Android phones / the app): short buzz on wins, a pattern on BIG WIN. Off in Settings, or with reduced motion.
(function () {
  const ok = () => { try { return 'vibrate' in navigator && matchMedia('(pointer:coarse)').matches && localStorage.getItem('lv_vib') !== '0' && !matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const buzz = p => { if (ok()) try { navigator.vibrate(p); } catch (e) {} };
  window.LVHaptic = { win: () => buzz(25), big: () => buzz([40, 60, 40, 60, 90]), on: () => { try { return localStorage.getItem('lv_vib') !== '0'; } catch (e) { return true; } }, toggle() { try { localStorage.setItem('lv_vib', this.on() ? '0' : '1'); } catch (e) {} return this.on(); } };
  const t = setInterval(() => { if (typeof window.countWin !== 'function' || window.countWin._hap || !window.countWin._fx2) return; const c0 = window.countWin;
    window.countWin = function (amt) { try { if (amt > 0) LVHaptic.win(); } catch (e) {} return c0.apply(this, arguments); }; window.countWin._hap = true; clearInterval(t); }, 500);
  const bw = document.getElementById('bw'); if (bw) new MutationObserver(() => { if (bw.classList.contains('show')) LVHaptic.big(); }).observe(bw, { attributes: true, attributeFilter: ['class'] });
})();
