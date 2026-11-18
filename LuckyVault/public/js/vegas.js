// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
/* LuckyVault — Las Vegas style layer (v5.8)
   Marquee bulbs, neon titles, a Vegas-style welcome sign hero, Strip skyline,
   table-limit placards and a "Vegas Strip" lobby tab. All original artwork (SVG/CSS). */
(function () {
  const css = `
:root{--neonP:#ff3ea5;--neonC:#36e6ff;--neonY:#ffd60a;--bulb:#ffe9a3}
/* marquee bulb strip under the top bar */
#vgMarq{position:sticky;top:var(--topH,57px);z-index:19;height:12px;background:
 radial-gradient(circle at 6px 6px,var(--bulb) 0 2.6px,rgba(255,200,80,.35) 3.2px,transparent 4.6px) 0 0/24px 12px,
 radial-gradient(circle at 18px 6px,#7a5a1a 0 2.4px,transparent 3px) 0 0/24px 12px,
 linear-gradient(#3a0a24,#1b0612);border-bottom:1px solid #5a1a3a;animation:vgChase 1.1s steps(2) infinite}
@keyframes vgChase{to{background-position:12px 0,12px 0,0 0}}
/* neon section titles */
#lobby .rowhd h2{font-family:'Arial Black',Anton,Impact,sans-serif;letter-spacing:.5px;color:#fff;text-shadow:0 0 2px #fff,0 0 6px var(--neonP),0 0 14px var(--neonP),0 0 26px rgba(255,62,165,.6)}
#lobby .rowsec:nth-child(3n+1) .rowhd h2{text-shadow:0 0 2px #fff,0 0 6px var(--neonC),0 0 14px var(--neonC),0 0 26px rgba(54,230,255,.55)}
#lobby .rowsec:nth-child(3n+2) .rowhd h2{text-shadow:0 0 2px #fff,0 0 6px var(--neonY),0 0 14px var(--neonY),0 0 26px rgba(255,214,10,.55)}
#lobby .rowhd h2{animation:vgFlick 7s infinite}#lobby .rowhd h2 span{text-shadow:none}
@keyframes vgFlick{0%,92%,100%{opacity:1}93%{opacity:.55}94%{opacity:1}96%{opacity:.7}97%{opacity:1}}
/* lobby jackpot pills get a bulb frame */
#lobby .jpbar .jp{position:relative}
#lobby .jpbar .jp::after{content:'';position:absolute;inset:-5px;border-radius:17px;pointer-events:none;padding:5px;
 background:radial-gradient(circle,var(--bulb) 0 1.7px,transparent 2.6px) 0 0/10px 10px;
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:vgChase2 .9s steps(2) infinite;opacity:.9}
@keyframes vgChase2{to{background-position:5px 5px}}
/* welcome sign hero */
.hero.hv{background:radial-gradient(120% 120% at 70% 30%,#3b0b4f 0%,#14051f 55%,#07020c 100%)!important;border-color:rgba(255,62,165,.55)!important}
.hero.hv .vsign{position:absolute;right:2%;top:50%;transform:translateY(-50%);height:104%;max-height:220px;filter:drop-shadow(0 0 18px rgba(255,62,165,.45))}
.hero.hv h1{font-family:'Arial Black',Anton,Impact,sans-serif!important;color:#fff;text-shadow:0 0 4px #fff,0 0 12px var(--neonP),0 0 26px var(--neonP)}
.hero.hv h1 span{color:var(--neonY)!important;text-shadow:0 0 4px #fff,0 0 12px var(--neonY),0 0 24px #ff9f0a}
.hero.hv>div:first-child{position:relative;z-index:2;max-width:60%}
@media(max-width:520px){.hero.hv .vsign{opacity:.5;right:-6%}.hero.hv>div:first-child{max-width:78%}}
.vsign .bl{animation:vgBulb 1s steps(2) infinite}.vsign .bl.o{animation-delay:-.5s}
@keyframes vgBulb{0%{fill:#fff6c8}50%{fill:#8a6a1a}}
/* Strip skyline above the footer */
#vgSky{display:block;width:100%;height:120px;margin-top:18px;opacity:.9}
#vgSky .win{animation:none}#vgSky.onscr .win:nth-child(5n){animation:vgWin 3s steps(1) infinite}#vgSky .win.b{animation-delay:-1.3s}#vgSky .win.c{animation-delay:-2.1s}
@keyframes vgWin{0%,60%{opacity:1}61%,100%{opacity:.25}}
/* tables: Vegas limit placard + printed felt marking */
#vgPlac{position:absolute;left:max(10px,calc(50% - 560px));top:58px;z-index:3;pointer-events:none;background:linear-gradient(#141414,#000);border:2px solid #c9a227;border-radius:8px;padding:4px 10px 5px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.08);font:700 9px Arial;color:#c9a227;letter-spacing:1.5px}
#vgPlac b{display:block;font:900 15px 'Arial Black',sans-serif;color:#ff4d4d;letter-spacing:0;text-shadow:0 0 6px rgba(255,60,60,.7)}
#vgPlac i{display:block;font-style:normal;color:#9ad;font-size:8px;letter-spacing:1px;margin-top:1px}
@media(max-width:700px){#vgPlac{display:none!important}}
#felt.oval::before{content:'LUCKY VAULT  ·  LAS VEGAS';position:absolute;left:50%;bottom:6px;transform:translateX(-50%);font:900 11px 'Arial Black',sans-serif;letter-spacing:6px;color:rgba(255,214,10,.16);white-space:nowrap;pointer-events:none}
/* performance: freeze decorative motion while spinning or in low-fx mode */
body.lowfx #vgMarq,body.lowfx #lobby .jpbar .jp::after,body.lowfx .vsign .bl,body.lowfx #vgSky .win,body.lowfx #lobby .rowhd h2,
body.spinning #vgMarq,body.spinning .vsign .bl{animation:none!important}
@media(prefers-reduced-motion:reduce){#vgMarq,#lobby .jpbar .jp::after,.vsign .bl,#vgSky .win,#lobby .rowhd h2{animation:none!important}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---- original Vegas-style sign (SVG) ----
  function bulbs() { const P = [[130, 26], [240, 100], [130, 174], [20, 100]]; let s = '', k = 0; for (let e = 0; e < 4; e++) { const [x0, y0] = P[e], [x1, y1] = P[(e + 1) % 4]; for (let i = 0; i < 9; i++) { const t = i / 9; s += '<circle class="bl' + (k++ % 2 ? ' o' : '') + '" cx="' + (x0 + (x1 - x0) * t).toFixed(1) + '" cy="' + (y0 + (y1 - y0) * t).toFixed(1) + '" r="3"/>'; } } return s; }
  const SIGN = '<svg class="vsign" viewBox="0 -12 260 242" aria-hidden="true">' +
    '<defs><linearGradient id="vgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffe7ef"/></linearGradient></defs>' +
    '<rect x="122" y="150" width="16" height="78" fill="#8a8f99"/><rect x="104" y="214" width="52" height="14" rx="3" fill="#555b66"/>' +
    '<path d="M130 18 L248 100 L130 182 L12 100 Z" fill="url(#vgG)" stroke="#ff3ea5" stroke-width="5"/>' +
    '<path d="M130 36 L224 100 L130 164 L36 100 Z" fill="none" stroke="#ffd60a" stroke-width="1.5"/>' +
    '<g fill="#ffd60a">' + bulbs() + '</g>' +
    '<text x="130" y="74" text-anchor="middle" font-family="Arial Black,Anton,Impact" font-size="11" fill="#1f6feb" letter-spacing="3">WELCOME TO</text>' +
    [['L', '#ff2d55'], ['U', '#ff9f0a'], ['C', '#ffd60a'], ['K', '#34c759'], ['Y', '#36a2ff']].map(([c, col], i) => '<circle cx="' + (82 + i * 24) + '" cy="96" r="11" fill="#fff" stroke="' + col + '" stroke-width="2.5"/><text x="' + (82 + i * 24) + '" y="102" text-anchor="middle" font-family="Arial Black" font-size="15" fill="' + col + '">' + c + '</text>').join('') +
    '<text x="130" y="131" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="bold" font-size="22" fill="#e01e5a">Vault</text>' +
    '<text x="130" y="147" text-anchor="middle" font-family="Arial Black" font-size="7" fill="#1f6feb" letter-spacing="2">LAS VEGAS STYLE</text>' +
    '<path d="M130 0 l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2z" fill="#ff3ea5" stroke="#ffd60a" stroke-width="2" transform="translate(0,-4) scale(1)"/>' +
    '</svg>';

  // ---- Strip skyline (SVG) ----
  function skyline() {
    const W = 1200, H = 120; let s = '<svg id="vgSky" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="vgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,62,165,0)"/><stop offset="1" stop-color="rgba(255,62,165,.28)"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#vgS)"/>';
    let x = 0, k = 0; const rnd = (i) => (Math.sin(i * 12.9898) * 43758.5453) % 1; const r = i => Math.abs(rnd(i));
    while (x < W) { const w = 28 + r(k) * 46, h = 30 + r(k + 7) * 80; const top = H - h; s += '<rect x="' + x.toFixed(0) + '" y="' + top.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#12051c"/>';
      if (r(k + 3) > .55) s += '<rect x="' + (x + w / 2 - 1).toFixed(0) + '" y="' + (top - 14).toFixed(0) + '" width="2" height="14" fill="#12051c"/><circle cx="' + (x + w / 2).toFixed(0) + '" cy="' + (top - 15).toFixed(0) + '" r="2" fill="#ff3ea5"/>';
      for (let yy = top + 6; yy < H - 6; yy += 9) for (let xx = x + 4; xx < x + w - 5; xx += 8) if (r(xx * 3 + yy) > .62) s += '<rect class="win' + (r(xx + yy) > .7 ? ' b' : r(xx - yy) > .7 ? ' c' : '') + '" x="' + xx.toFixed(0) + '" y="' + yy + '" width="3" height="4" fill="' + (r(xx) > .5 ? '#ffd27a' : '#7fe8ff') + '"/>';
      x += w + 2; k++; }
    // tower and a big wheel silhouette
    s += '<rect x="560" y="10" width="10" height="110" fill="#12051c"/><ellipse cx="565" cy="26" rx="22" ry="8" fill="#12051c"/><circle cx="565" cy="8" r="2.5" fill="#ff3ea5"/>';
    s += '<g stroke="#2a0d3a" stroke-width="2" fill="none"><circle cx="940" cy="62" r="44"/>' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return '<line x1="940" y1="62" x2="' + (940 + 44 * Math.cos(a)).toFixed(0) + '" y2="' + (62 + 44 * Math.sin(a)).toFixed(0) + '"/>'; }).join('') + '</g><path d="M922 120 L940 62 L958 120" stroke="#2a0d3a" stroke-width="3" fill="none"/>';
    return s + '</svg>';
  }

  function topH() { const t = document.getElementById('top'); if (t) document.documentElement.style.setProperty('--topH', t.offsetHeight + 'px'); }

  function init() {
    const top = document.getElementById('top');
    if (top && !document.getElementById('vgMarq')) { const m = document.createElement('div'); m.id = 'vgMarq'; m.setAttribute('aria-hidden', 'true'); top.after(m); topH(); addEventListener('resize', topH); }
    const heros = document.getElementById('heros');
    if (heros && !heros.querySelector('.hv')) {
      const h = document.createElement('div'); h.className = 'hero hv';
      h.innerHTML = '<div><small>THE VEGAS STRIP</small><h1>Fabulous<br><span>Vegas tables</span></h1><p>Pai Gow Poker &amp; Tiles, Ultimate Texas Hold’em, Let It Ride, Mississippi Stud, Spanish 21, EZ Baccarat, Ten Play poker and classic reels.</p><button class="cta" data-go="vegas">Hit the Strip</button></div>' + SIGN;
      heros.insertBefore(h, heros.firstChild);
    }
    // table count text in the table-games hero
    const h2 = document.querySelector('.hero.h2 p'); if (h2 && typeof GAMES !== 'undefined') { const n = GAMES.filter(g => g && !g.slot && (typeof vis !== 'function' || vis(g))).length; h2.textContent = 'Real casino rules, real house edges. ' + n + ' tables open 24/7.'; }
    const foot = document.querySelector('#lobby .foot'); if (foot && !document.getElementById('vgSky')) foot.insertAdjacentHTML('beforebegin', skyline());
  }

  // placard on table open
  const oo = window.openTable;
  if (oo) window.openTable = async function (g) {
    const r = oo.apply(this, arguments);
    try { const t = document.getElementById('table'); let p = document.getElementById('vgPlac'); if (!p) { p = document.createElement('div'); p.id = 'vgPlac'; t.appendChild(p); }
      const C = window.LV_CONFIG || {}; const mn = C.tableMin || 1, mx = C.tableMax || 5000; const vp = g.tk === 'videopoker';
      p.style.display = vp || g.tk === 'scratch' || g.tk === 'keno' ? 'none' : '';
      p.innerHTML = 'TABLE LIMITS<b>' + mn.toLocaleString() + ' – ' + mx.toLocaleString() + '</b><i>' + (g.name || '').toUpperCase() + '</i>'; } catch (e) { }
    return r;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init, 1500);
  window.LVV = { init };
})();
