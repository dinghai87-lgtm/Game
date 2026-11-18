// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
/* Lucky Vault — motion and effects layer (loaded after the main script).
   Reel motion blur and bounce, winning-symbol sparkles and shine, glowing win lines, chasing marquee
   lights, coins flying to the balance, escalating BIG → MEGA → EPIC → LEGENDARY win sequence, screen
   shake, and a livelier lobby. Pure CSS/canvas, no images needed. Honors the system "reduce motion" setting. */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = document.createElement('style');
  css.textContent = `
/* 2026-11-18: no filter on the spinning strip (an SVG blur on 4000px-tall strips froze the screen on large / high-DPI desktops); a light streak overlay gives the motion feel instead */ .reel.moving .strip{filter:none!important} .reel{position:relative} .reel.moving::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(255,255,255,.06) 30%,rgba(255,255,255,.06) 70%,rgba(0,0,0,.35));opacity:.9}
.reel.settle .strip{filter:none!important}
#fxCv{position:absolute;left:-60px;top:-60px;pointer-events:none;z-index:6}
.cell.win .in{animation:winBounce .55s cubic-bezier(.3,1.6,.5,1) infinite alternate!important;z-index:3}
.cell.win .in::after{content:"";display:block!important;position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.65) 48%,rgba(255,255,255,.1) 56%,transparent 70%);background-size:250% 100%;animation:shine 1.1s ease-in-out infinite;opacity:.7;box-shadow:none!important;z-index:3}
@keyframes winBounce{0%{transform:scale(1)}100%{transform:scale(1.13)}}
@keyframes shine{0%{background-position:130% 0}100%{background-position:-30% 0}}
.cell.dim .in{opacity:.28;filter:grayscale(.6) brightness(.7)!important;transition:opacity .25s,filter .25s}
#lines polyline{stroke-width:5;stroke-dasharray:14 8;animation:dash .6s linear infinite;filter:drop-shadow(0 0 6px currentColor) drop-shadow(0 0 2px #000)!important}
#lines polyline.glow{stroke-width:11;stroke-dasharray:none;opacity:.35;animation:none;filter:blur(3px)!important}
@keyframes dash{to{stroke-dashoffset:-22}}
#frame .lights{background:radial-gradient(circle,#fff6c2 0 2.4px,rgba(255,200,61,.55) 3px,transparent 4.5px) 0 0/18px 18px!important;opacity:.9!important;animation:chase 1.2s linear infinite!important;filter:drop-shadow(0 0 3px #ffc83d)}
#frame.flash .lights{animation:chase .25s linear infinite,flashL .18s steps(2) infinite!important}
#frame.flash{box-shadow:0 0 0 2px rgba(255,214,10,.8),0 0 40px rgba(255,200,61,.55),0 25px 60px rgba(0,0,0,.7)!important;transition:box-shadow .2s}
@keyframes chase{to{background-position:18px 0}}
@keyframes flashL{50%{filter:drop-shadow(0 0 8px #fff) hue-rotate(40deg) brightness(1.6)}}
.shake{animation:shake .45s cubic-bezier(.36,.07,.19,.97) both}
@keyframes shake{10%,90%{transform:translate(-1px,1px)}20%,80%{transform:translate(3px,-2px)}30%,50%,70%{transform:translate(-5px,2px)}40%,60%{transform:translate(5px,-1px)}}
.flycoin{position:fixed;width:22px;height:22px;border-radius:50%;z-index:70;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff6c2,#ffd447 35%,#e09b00 70%,#8a5200);box-shadow:0 0 8px rgba(255,200,61,.9)}
#bal2box.bump,#top .bal.bump{animation:bump .35s ease-out}
@keyframes bump{40%{transform:scale(1.15);box-shadow:0 0 18px rgba(255,200,61,.8)}}
#bw .t{transition:transform .2s}
#bw .t.punch{animation:punch .5s cubic-bezier(.3,1.8,.5,1)}
@keyframes punch{0%{transform:scale(.4) rotate(-6deg);opacity:0}60%{transform:scale(1.25) rotate(2deg);opacity:1}100%{transform:scale(1)}}
#bw .t.legend{background-image:linear-gradient(90deg,#ff5f6d,#ffc371,#47ffb2,#4cc9f0,#c77dff,#ff5f6d)!important;background-size:300% 100%!important;animation:rainbow 2s linear infinite}
@keyframes rainbow{to{background-position:300% 0}}
#bw .tierbar{position:relative;z-index:2;display:flex;gap:6px;margin-top:14px}
#bw .tierbar i{width:46px;height:7px;border-radius:4px;background:rgba(255,255,255,.18);transition:background .3s,box-shadow .3s}
#bw .tierbar i.on{background:#ffd447;box-shadow:0 0 10px #ffc83d}
#bw .rays{animation-duration:6s!important}
#bw.lvl2 .rays{animation-duration:3.5s!important;filter:hue-rotate(160deg)}#bw.lvl3 .rays{animation-duration:2.2s!important;filter:hue-rotate(300deg) saturate(1.4)}#bw.lvl4 .rays{animation-duration:1.4s!important;filter:hue-rotate(60deg) saturate(1.8)}
#spin:not(:disabled){animation:spinIdle 2.4s ease-in-out infinite}
@keyframes spinIdle{50%{box-shadow:0 0 0 4px rgba(36,209,126,.25),0 0 26px rgba(36,209,126,.55)}}
/* lobby */
.tile::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%);background-size:300% 100%;background-position:150% 0;animation:tileShine 7s ease-in-out infinite;animation-delay:var(--sd,0s)}
/* only tiles on screen shimmer (285 running animations were dragging lobby scroll on mid-range phones) */ .tile:not(.onscr)::after{animation:none!important} body:has(#game.show) #lobby *,body:has(#game.show) #lobby *::after,body:has(#game.show) #lobby *::before,body:has(#table.show) #lobby *::before,body:has(#table.show) #lobby *,body:has(#table.show) #lobby *::after,body:has(#game.show) #hovDock *,body:has(#table.show) #hovDock *{animation-play-state:paused!important} @keyframes tileShine{0%,70%{background-position:150% 0}100%{background-position:-50% 0}}
.tile:hover .art{animation:artFloat 1.4s ease-in-out infinite alternate}
@keyframes artFloat{to{transform:translateY(-6px) scale(1.06)}}
.tile .art{animation:artIdle 3.2s ease-in-out infinite alternate;animation-delay:var(--sd,0s)}
@keyframes artIdle{to{transform:translateY(-3px)}}
.hero .big{animation:heroBob 3s ease-in-out infinite alternate}
@keyframes heroBob{to{transform:translateY(-8px) rotate(4deg)}}
.hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.55) 0 1.2px,transparent 2px) 0 0/38px 38px;opacity:.25;animation:sparkDrift 14s linear infinite}
@keyframes sparkDrift{to{background-position:38px -76px}}
.herodots{display:flex;justify-content:center;gap:6px;margin:-6px 0 4px}.herodots i{width:7px;height:7px;border-radius:50%;background:#ffffff33;cursor:pointer;transition:all .3s}.herodots i.on{width:20px;border-radius:4px;background:#ffd447}
@media (prefers-reduced-motion: reduce){.tile::after,.tile .art,.hero .big,.hero::before,#spin,.cell.win .in,.cell.win .in::after,#lines polyline,#frame .lights{animation:none!important}}
`;
  document.head.appendChild(css);
  // vertical-only motion blur for spinning reels
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); defs.setAttribute('width', 0); defs.setAttribute('height', 0); defs.style.position = 'absolute';
  defs.innerHTML = '<filter id="lvVBlur" x="0" y="-20%" width="100%" height="140%"><feGaussianBlur stdDeviation="0 7"/></filter>'; document.body.appendChild(defs);

  // ---------- particles over the board ----------
  const wrap = document.getElementById('boardWrap'); const cv = document.createElement('canvas'); cv.id = 'fxCv'; wrap.appendChild(cv); const cx = cv.getContext('2d');
  const P = []; let running = false;
  const CDPR = () => Math.min(1.5, devicePixelRatio || 1);   // particle canvas: sharp enough, far cheaper than 3x on phones
  let WS = null; if ('ResizeObserver' in window) new ResizeObserver(es => { const r = es[0].contentRect; WS = [Math.round(r.width), Math.round(r.height)]; }).observe(wrap);   // cached size: no forced layout on every burst
  function sizeCv() { const w = (WS ? WS[0] : wrap.offsetWidth) + 120, h = (WS ? WS[1] : wrap.offsetHeight) + 120, d = CDPR(); if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; cv.style.width = w + 'px'; cv.style.height = h + 'px'; } }
  function burst(x, y, n, hue) {
    if (RM) return; sizeCv();
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, sp = 1.5 + Math.random() * 4.5; P.push({ x: x + 60, y: y + 60, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 1, decay: .012 + Math.random() * .02, r: 1.5 + Math.random() * 3, h: hue == null ? 40 + Math.random() * 20 : hue, star: Math.random() < .35 }); }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function star(x, y, r) { cx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .35 : r * 1.6; cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } cx.closePath(); cx.fill(); }
  function loop() {
    const d = CDPR(); cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx; p.y += p.vy; p.vy += .08; p.vx *= .985; p.life -= p.decay; if (p.life <= 0) { P.splice(i, 1); continue; }
      cx.fillStyle = 'hsla(' + p.h + ',100%,' + (60 + p.life * 30) + '%,' + p.life + ')'; if (p.star) star(p.x, p.y, p.r); else { cx.beginPath(); cx.arc(p.x, p.y, p.r * p.life + .5, 0, 7); cx.fill(); } }
    cx.globalCompositeOperation = 'source-over';
    if (P.length) requestAnimationFrame(loop); else { running = false; cx.clearRect(0, 0, cv.width, cv.height); }
  }
  window.LVFX = { burst };

  // ---------- hooks into the game ----------
  const hl0 = window.hl;
  window.hl = function (list) {
    hl0(list); if (!T.view || !list || !list.length) return;
    const fr = document.getElementById('frame'); fr.classList.add('flash'); clearTimeout(hl.ft); hl.ft = setTimeout(() => fr.classList.remove('flash'), 1400);
    const seen = new Set(); list.forEach(([c, r]) => { const k = c + ',' + r; if (seen.has(k)) return; seen.add(k); const p = T.view.cellPos(c, r); burst(p[0] + 4, p[1] + 4, 10); });
  };
  const draw0 = window.drawLines;
  window.drawLines = function (wins) { draw0(wins); const svg = document.getElementById('lines'); svg.querySelectorAll('polyline').forEach(pl => { const g = pl.cloneNode(); g.setAttribute('class', 'glow'); pl.style.color = pl.getAttribute('stroke'); svg.insertBefore(g, pl); }); };
  const clear0 = window.clearHL; window.clearHL = function () { clear0(); const fr = document.getElementById('frame'); if (fr) fr.classList.remove('flash'); };

  // reel settle: drop the blur just before the reel lands so symbols snap in crisp
  const RV = window.ReelView || (typeof ReelView !== 'undefined' ? ReelView : null);
  if (RV && RV.prototype.spin) {
    const spin0 = RV.prototype.spin;
    RV.prototype.spin = function (grid, turbo) {
      const p = spin0.call(this, grid, turbo);
      // watch transitions: remove blur ~140ms before each reel stops
      this.reels.forEach(x => { const r = x.r; const st = x.st; const t0 = performance.now(); const chk = () => { if (!r.classList.contains('moving')) { r.classList.remove('settle'); return; } const m = /transform (\d+)ms/.exec(st.style.transition || ''); if (m && performance.now() - t0 > +m[1] - 160) { r.classList.add('settle'); return; } requestAnimationFrame(chk); }; requestAnimationFrame(chk); });
      return p.then(v => { this.reels.forEach(x => x.r.classList.remove('settle')); return v; });
    };
  }

  // coins fly from the board to the balance on decent wins
  function flyCoins(n) {
    if (RM) return; const from = document.getElementById('boardWrap').getBoundingClientRect(); const toEl = document.getElementById('bal2box'); if (!toEl) return; const to = toEl.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div'); c.className = 'flycoin'; const sx = from.left + from.width * (.25 + Math.random() * .5), sy = from.top + from.height * (.3 + Math.random() * .4);
      c.style.left = sx + 'px'; c.style.top = sy + 'px'; document.body.appendChild(c);
      const dx = to.left + to.width * .2 - sx, dy = to.top + to.height / 2 - sy, mx = (Math.random() - .5) * 160, my = -80 - Math.random() * 120;
      c.animate([{ transform: 'translate(0,0) scale(.6)', opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.2)`, opacity: 1, offset: .35 }, { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: .9 }], { duration: 700 + Math.random() * 300, delay: i * 45, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => { c.remove(); if (i === n - 1) { toEl.classList.remove('bump'); void toEl.offsetWidth; toEl.classList.add('bump'); sfx.coins(); } };
    }
  }
  window.LVFX.fly = flyCoins;
  const count0 = window.countWin;
  window.countWin = function (v, label) { try { const x = v / curBet(); if (x >= 3 && !T.pend && !(S.turbo || T.quick)) flyCoins(Math.min(18, Math.round(4 + x))); } catch (e) {} return count0(v, label); };

  // ---------- escalating big-win sequence ----------
  const TIERS = [[15, 'BIG WIN', ''], [40, 'MEGA WIN', 'mega'], [100, 'EPIC WIN', 'epic'], [500, 'LEGENDARY', 'legend']];
  window.bigWin = function (win, bet) {
    return new Promise(res => {
      const ov = document.getElementById('bw'), t = document.getElementById('bwT'), v = document.getElementById('bwV'); const x = win / bet;
      let bar = ov.querySelector('.tierbar'); if (!bar) { bar = document.createElement('div'); bar.className = 'tierbar'; bar.innerHTML = '<i></i><i></i><i></i><i></i>'; ov.insertBefore(bar, ov.querySelector('.h')); }
      const top = TIERS.filter(z => x >= z[0]).length || 1; let cur = 0;
      const setTier = k => { cur = k; const z = TIERS[k - 1]; t.textContent = z[1]; t.className = 't ' + z[2]; void t.offsetWidth; t.classList.add('punch'); ov.className = 'ov show lvl' + k; bar.querySelectorAll('i').forEach((e, i) => e.classList.toggle('on', i < k)); if (k > 1) { sfx.mult(); const st = document.getElementById('stage'); st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); } };
      ov.classList.add('show'); setTier(1); sfx.big(); const stop = coinsStart();
      const dur = Math.min(9000, 2200 + top * 1500 + x * 6); const t0 = performance.now(); let done = false;
      const st = document.getElementById('stage'); st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake');
      function tick(n) {
        if (done) return; const p = Math.min(1, (n - t0) / dur); const shown = win * (1 - Math.pow(1 - p, 2.2)); v.textContent = fmt(shown);
        const k = TIERS.filter(z => shown / bet >= z[0]).length || 1; if (k > cur) setTier(k);
        if (p < 1) requestAnimationFrame(tick); else { v.textContent = fmt(win); if (top > cur) setTier(top); setTimeout(finish, T.auto ? 1000 : 2400); }
      }
      function close(ms) { done = true; setTimeout(() => { ov.classList.remove('show'); ov.className = 'ov'; stop(); ov.onclick = null; res(); }, ms); }
      function finish() { if (done) return; v.textContent = fmt(win); close(250); }
      ov.onclick = () => { if (performance.now() - t0 < dur) { v.textContent = fmt(win); if (top > cur) setTier(top); done = true; setTimeout(() => close(0), 900); } else finish(); };
      requestAnimationFrame(tick); setTimeout(() => { if (!done) { v.textContent = fmt(win); if (top > cur) setTier(top); setTimeout(finish, T.auto ? 600 : 1500); } }, dur + 300);
    });
  };

  // ---------- lobby life ----------
  const tile0 = window.tileHTML;
  if (tile0) window.tileHTML = function (g) { return tile0(g).replace('style="background:', 'style="--sd:' + ((g.id * 0.73) % 7).toFixed(2) + 's;background:'); };
  const heros = document.getElementById('heros');
  if (heros) {
    const dots = document.createElement('div'); dots.className = 'herodots'; heros.after(dots); const n = heros.children.length; dots.innerHTML = '<i></i>'.repeat(n);
    const go = i => { const h = heros.children[i]; if (h) heros.scrollTo({ left: h.offsetLeft - 14, behavior: RM ? 'auto' : 'smooth' }); };
    dots.onclick = e => { const i = [...dots.children].indexOf(e.target); if (i >= 0) { go(i); hold = Date.now() + 15000; } };
    let hold = 0; heros.addEventListener('pointerdown', () => hold = Date.now() + 15000);
    const cur = () => { let best = 0, bd = 1e9; [...heros.children].forEach((h, i) => { const d = Math.abs(h.offsetLeft - 14 - heros.scrollLeft); if (d < bd) { bd = d; best = i; } }); return best; };
    heros.addEventListener('scroll', () => { const c = cur(); [...dots.children].forEach((d, i) => d.classList.toggle('on', i === c)); }, { passive: true });
    dots.children[0] && dots.children[0].classList.add('on');
    setInterval(() => { if (Date.now() < hold || heros.offsetParent === null || document.hidden || document.querySelector('#game.show,#table.show')) return; if (heros.scrollWidth <= heros.clientWidth + 20) return; go((cur() + 1) % n); }, 5000);
  }
})();

// 2026-11-19 perf: mark lobby tiles that are on screen; only those animate their shine
(function () { if (!('IntersectionObserver' in window)) { document.documentElement.classList.add('noio'); return; }
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('onscr', e.isIntersecting)), { rootMargin: '60px' });
  const seen = new WeakSet(); const scan = () => document.querySelectorAll('.tile, #vgSky').forEach(t => { if (!seen.has(t)) { seen.add(t); io.observe(t); } });
  let q = 0; const lob = document.getElementById('lobby') || document.body;
  new MutationObserver(() => { if (q) return; q = setTimeout(() => { q = 0; scan(); }, 300); }).observe(lob, { childList: true, subtree: true }); scan(); })();
