// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
/* Lucky Vault — presentation of feature slots (expanding / sticky / walking / multiplier wilds, wild reels,
   mystery symbols, lightning wilds, colossal symbols, cash collect, pick bonus, wheel bonus, choose-your-bonus)
   and the double-up gamble. The server decides every outcome; this file only animates it. */
(function () {
  'use strict';
  const css = document.createElement('style');
  css.textContent = `
.myst .in{background:linear-gradient(145deg,#5b21b6,#1e1b4b)!important;box-shadow:inset 0 0 0 2px #c4b5fd,inset 0 0 0 4px #4c1d95,0 0 14px rgba(167,139,250,.7)!important;color:#fde68a;font-family:Anton,Impact,"Arial Black",sans-serif;font-size:calc(var(--cell)*.6)!important;text-shadow:0 3px 0 #000}
.cell .flip .in,.cell.flip .in{animation:flipIn .5s ease-out}
@keyframes flipIn{0%{transform:rotateY(90deg) scale(.8)}100%{transform:rotateY(0) scale(1)}}
.wx{position:absolute;right:4%;top:4%;background:linear-gradient(#ff4d6d,#9d0208);color:#fff;font:900 calc(var(--cell)*.17)/1 Anton,Impact,"Arial Black",sans-serif;padding:3px 5px;border-radius:7px;box-shadow:0 0 0 2px #ffd447,0 2px 6px #000;z-index:4}
.cell.grow .in{animation:growW .45s cubic-bezier(.3,1.6,.5,1)}
@keyframes growW{0%{transform:scale(.2);opacity:.2}100%{transform:scale(1);opacity:1}}
.reel.wildglow{box-shadow:0 0 0 3px #ffd447,0 0 30px 8px rgba(255,200,61,.8);transition:box-shadow .2s}
.cell.sticky .in{box-shadow:inset 0 0 0 3px #22d3ee,0 0 16px rgba(34,211,238,.9)!important}
.cell.sticky .in::before{content:"STICKY";position:absolute;top:4%;left:0;right:0;text-align:center;font:900 calc(var(--cell)*.11)/1 "Arial Black",sans-serif;color:#cffafe;text-shadow:0 1px 2px #000;background:none!important;height:auto!important;z-index:5}
.bolt{position:absolute;pointer-events:none;z-index:8;width:6px;background:linear-gradient(#fff,#a5f3fc,#fff);box-shadow:0 0 12px #a5f3fc,0 0 30px #fff;transform-origin:top;animation:bolt .35s ease-out forwards}
@keyframes bolt{0%{transform:scaleY(0);opacity:1}60%{transform:scaleY(1);opacity:1}100%{opacity:0}}
#flashFx{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:60}
#flashFx.on{animation:fl .35s ease-out}
@keyframes fl{0%{opacity:.75}100%{opacity:0}}
.colo{position:absolute;z-index:5;pointer-events:none;border-radius:18px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,rgba(255,214,10,.55),rgba(0,0,0,.65) 72%),linear-gradient(160deg,#2a1c3d,#0c0816);box-shadow:inset 0 0 0 3px #ffe28a,inset 0 0 0 6px #c98a12,0 0 30px rgba(255,200,61,.8);animation:growW .5s cubic-bezier(.3,1.6,.5,1)}
.colo span{font-size:calc(var(--cell)*1.7);filter:drop-shadow(0 8px 10px rgba(0,0,0,.6))}
.collectfly{position:fixed;z-index:65;pointer-events:none;font:900 15px Anton,Impact,"Arial Black",sans-serif;color:#fde68a;text-shadow:0 2px 0 #000,0 0 8px #ffc83d}
.fov{position:fixed;inset:0;z-index:55;display:none;align-items:center;justify-content:center;background:rgba(3,6,12,.82);backdrop-filter:blur(3px)}
.fov.show{display:flex}
.fbox{width:min(560px,94vw);background:linear-gradient(160deg,#1c1033,#0b1220);border:2px solid #ffd447;border-radius:20px;padding:18px;text-align:center;box-shadow:0 0 50px rgba(255,200,61,.35);color:#fff}
.fbox h2{margin:0 0 4px;font-family:Anton,Impact,"Arial Black",sans-serif;font-size:30px;letter-spacing:1px;background:linear-gradient(#fff6c2,#ffc83d 50%,#e07b00);-webkit-background-clip:text;background-clip:text;color:transparent}
.fbox p{margin:0 0 12px;color:#cbd5e1;font-size:14px}
.chests{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:8px 0 12px}
.chest{aspect-ratio:1;border:0;border-radius:14px;cursor:pointer;font-size:clamp(30px,8vw,44px);background:radial-gradient(circle at 50% 35%,#7c2d12,#2a0f05);box-shadow:inset 0 0 0 3px #f59e0b,0 4px 0 #451a03;transition:transform .15s}
.chest:hover:not(:disabled){transform:translateY(-3px) scale(1.04)}
.chest.open{background:radial-gradient(circle,#fde68a,#b45309);font:900 clamp(16px,4.5vw,22px) Anton,Impact,"Arial Black",sans-serif;color:#3b0d00;animation:growW .4s}
.chest.end{background:radial-gradient(circle,#86efac,#166534);color:#fff}
.chest.dim{opacity:.35}
.ftot{font:900 26px Anton,Impact,"Arial Black",sans-serif;color:#fde68a;text-shadow:0 2px 0 #000}
.wheelwrap{position:relative;width:min(340px,80vw);aspect-ratio:1;margin:6px auto 12px}
.wheelwrap svg{width:100%;height:100%;transition:transform 4.2s cubic-bezier(.12,.6,.1,1);filter:drop-shadow(0 8px 20px rgba(0,0,0,.6))}
.wheelwrap .ptr{position:absolute;left:50%;top:-6px;transform:translateX(-50%);width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-top:30px solid #ffd447;filter:drop-shadow(0 3px 3px #000);z-index:2}
.wheelwrap .hub{position:absolute;left:50%;top:50%;width:22%;height:22%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6c2,#ffc83d 45%,#b8730a);box-shadow:0 0 0 4px #4a1d00;display:flex;align-items:center;justify-content:center;font:900 12px Anton,Impact,sans-serif;color:#3b0d00}
.choices{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.choices button{border:0;border-radius:14px;padding:14px 8px;cursor:pointer;background:linear-gradient(160deg,#4c1d95,#1e1b4b);color:#fff;box-shadow:inset 0 0 0 2px #a78bfa;font-weight:800}
.choices button b{display:block;font:900 28px Anton,Impact,"Arial Black",sans-serif;color:#fde68a}
.choices button:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 2px #fde68a,0 0 18px rgba(253,230,138,.5)}
#wActs{display:inline-flex;gap:8px;margin-left:12px;vertical-align:middle}
#collectBtn{border:0;border-radius:10px;padding:7px 14px;font:900 13px "Arial Black",sans-serif;background:linear-gradient(#5ef08a,#12a150);color:#04260f;cursor:pointer;box-shadow:0 0 14px rgba(70,230,130,.6),inset 0 -3px 0 rgba(0,0,0,.25);animation:spinIdle 1.6s infinite}
#collectBtn:active,#gambleBtn:active{transform:scale(.94)}
#bal2box.glowc{animation:glowc .9s ease-out}@keyframes glowc{0%{box-shadow:0 0 0 0 rgba(255,214,10,.9)}100%{box-shadow:0 0 0 18px rgba(255,214,10,0)}}
#gambleBtn{border:0;border-radius:10px;padding:6px 12px;font:900 13px "Arial Black",sans-serif;background:linear-gradient(#ffd447,#e09b00);color:#3b0d00;cursor:pointer;box-shadow:0 0 12px rgba(255,200,61,.6);animation:spinIdle 1.6s infinite}
.gcard{width:120px;height:170px;margin:10px auto;border-radius:12px;background:repeating-linear-gradient(45deg,#7f1d1d 0 8px,#991b1b 8px 16px);box-shadow:inset 0 0 0 4px #fff,0 8px 20px #000;display:flex;align-items:center;justify-content:center;font:900 46px Georgia,serif;transition:transform .4s}
.gcard.face{background:#fff}.gcard.flip{transform:rotateY(180deg)}
.gbtns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px}
.gbtns button{border:0;border-radius:12px;padding:10px 14px;font-weight:900;cursor:pointer;font-size:15px}
.gbtns .red{background:#dc2626;color:#fff}.gbtns .black{background:#111827;color:#fff;box-shadow:inset 0 0 0 2px #475569}.gbtns .suit{background:#f8fafc;color:#111;font-size:20px;padding:8px 14px}.gbtns .col{background:#22c55e;color:#04140b}
.ghist{display:flex;gap:4px;justify-content:center;min-height:26px;margin-top:6px}.ghist span{background:#fff;color:#111;border-radius:4px;padding:2px 5px;font-weight:900;font-size:13px}
`;
  css.textContent += `
#game.skinned .cell:not(.coinc):not(.mult):not(.myst) .in{background:none!important;box-shadow:none!important;filter:none!important}
#game.skinned .hi .in::before{display:none!important}
#game.skinned .symimg{width:88%;height:88%;filter:drop-shadow(0 4px 4px rgba(0,0,0,.45))}
#game.skinned .cell.win .symimg{filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 14px #ffc83d)}
#game.skinned .cell.win .in::after{display:none!important}
#game.skinned .wild .in small,#game.skinned .scat .in small{bottom:2%;font-size:calc(var(--cell)*.12)}
#game.skinned.reelimg .reel{background:var(--reelimg) center/100% 100% no-repeat!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}
#game.skinned.reelimg #boardWrap{background:#2a0b3d}
#game.skinned.reelimg .cell.dim .in{opacity:.35}
#game.nolabel .wild .in small,#game.nolabel .scat .in small{display:none}
/* v4.5 premium layer for games with purchased art */
#bgArt.img{animation:kenburns 38s ease-in-out infinite alternate;transform-origin:50% 40%;will-change:transform}
@keyframes kenburns{from{transform:scale(1.02)}to{transform:scale(1.14) translate(-1.5%,-1%)}}
#game.skinned::before{content:"";position:absolute;inset:-30%;z-index:0;pointer-events:none;background:repeating-conic-gradient(from 0deg at 50% 38%,rgba(255,255,255,.05) 0 7deg,transparent 7deg 18deg);animation:rays 60s linear infinite;will-change:transform}
@keyframes rays{to{transform:rotate(360deg)}}
body.spinning #bgArt span,body.spinning #bgArt.img,body.spinning #game.skinned::before,body.spinning #game.skinned::after,body.spinning #gLogo img{animation-play-state:paused!important}
body.lowfx #bgArt.img,body.lowfx #game.skinned::before,body.lowfx #game.skinned::after,body.lowfx #gLogo img{animation:none!important}
body.lowfx #game.skinned::before{display:none}
body.lowfx #game .symimg,body.lowfx #game .sanim{filter:none!important}
body.lowfx #game.skinned .reel.moving .symimg{filter:none!important}
body.lowfx .cell.win .in::after{animation:none!important;display:none!important}
#game.skinned::after{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 50% 42%,transparent 40%,rgba(0,0,0,.55) 100%),radial-gradient(2px 2px at 12% 80%,#fff8,transparent),radial-gradient(2px 2px at 82% 70%,#fff8,transparent),radial-gradient(1.5px 1.5px at 30% 30%,#fff9,transparent),radial-gradient(2px 2px at 66% 22%,#fff7,transparent),radial-gradient(1.5px 1.5px at 92% 40%,#fff9,transparent),radial-gradient(1.5px 1.5px at 6% 35%,#fff9,transparent);background-size:100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%;animation:motes 9s ease-in-out infinite alternate}
@keyframes motes{to{background-position:0 0,0 -40px,0 -60px,0 -30px,0 -50px,0 -20px,0 -45px}}
#game.skinned:not(.goldframe) #frame{background:linear-gradient(160deg,color-mix(in srgb,var(--c2) 45%,#fff) 0%,var(--c2) 22%,color-mix(in srgb,var(--c2) 55%,#000) 50%,var(--c2) 78%,color-mix(in srgb,var(--c2) 40%,#fff) 100%)!important;box-shadow:0 0 0 2px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.45),inset 0 -3px 0 rgba(0,0,0,.4),0 0 46px color-mix(in srgb,var(--c2) 55%,transparent),0 28px 60px rgba(0,0,0,.7)!important}
#game.skinned #boardWrap{box-shadow:inset 0 0 0 2px rgba(0,0,0,.55),inset 0 10px 24px rgba(0,0,0,.55)}
#game.skinned .reel{background:linear-gradient(90deg,rgba(0,0,0,.28),rgba(255,255,255,.06) 50%,rgba(0,0,0,.28)),linear-gradient(color-mix(in srgb,var(--c1) 70%,#000),color-mix(in srgb,var(--c2) 35%,#0a0a14) 50%,color-mix(in srgb,var(--c1) 70%,#000))}
#game.skinned .reel::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;background:linear-gradient(rgba(0,0,0,.5),transparent 16%,transparent 84%,rgba(0,0,0,.5)),linear-gradient(90deg,rgba(255,255,255,.07),transparent 30%)}
#game.skinned .cell.win{z-index:5}
#game.skinned .cell.win::before{content:"";position:absolute;inset:4%;border-radius:18%;background:radial-gradient(circle,rgba(255,236,150,.75),rgba(255,180,40,.35) 45%,transparent 70%);animation:winHalo .6s ease-in-out infinite alternate;pointer-events:none}
@keyframes winHalo{from{transform:scale(.85);opacity:.6}to{transform:scale(1.12);opacity:1}}
#game.skinned .cell.win .symimg{animation:symPop .55s cubic-bezier(.3,1.6,.5,1) infinite alternate}
@keyframes symPop{from{transform:scale(1)}to{transform:scale(1.14) rotate(-2deg)}}
#game.skinned .cell .symimg{transition:transform .2s}
#game.skinned .reel.moving .symimg{filter:none}
#gLogo img{filter:drop-shadow(0 6px 10px rgba(0,0,0,.6)) drop-shadow(0 0 18px rgba(255,200,80,.35));animation:logoFloat 4s ease-in-out infinite}
@keyframes logoFloat{50%{transform:translateY(-4px)}}
@media (prefers-reduced-motion: reduce){#bgArt.img,#game.skinned::before,#game.skinned::after,#game.skinned .cell.win .symimg,#gLogo img{animation:none!important}}
#game.goldframe #frame{background:linear-gradient(160deg,#ffe27a,#b8730a 35%,#ffd75e 55%,#8a5200)!important;box-shadow:0 0 0 3px #4a1d00,0 0 40px rgba(255,170,0,.35),0 25px 60px rgba(0,0,0,.7)!important}
#gLogo.imglogo .ic,#gLogo.imglogo .nm{display:none}
#gLogo.imglogo.tall .lgimg{height:clamp(62px,13vh,128px)}
#gLogo .lgimg{display:none}#gLogo.imglogo .lgimg{display:block;height:clamp(44px,8vh,90px);width:auto;max-width:92vw;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))}
`;
  document.head.appendChild(css);
  const flash = document.createElement('div'); flash.id = 'flashFx'; document.body.appendChild(flash);
  const ov = document.createElement('div'); ov.className = 'fov'; ov.innerHTML = '<div class="fbox" id="fbox"></div>'; document.body.appendChild(ov);
  const box = () => document.getElementById('fbox');
  const SUIT = { h: ['♥', '#dc2626'], d: ['♦', '#dc2626'], c: ['♣', '#111'], s: ['♠', '#111'] };
  const isFeat = g => g && g.slot && E.MATH[g.mk || g.e] && E.MATH[g.mk || g.e].feat;

  // ---------- symbol rendering additions ----------
  const cell0 = window.cellEl;
  window.cellEl = function (g, o) {
    if (o && o.s === 'Q') { const d = document.createElement('div'); d.className = 'cell myst lo'; d.innerHTML = '<div class="in">?</div>'; return d; }
    const d = cell0(g, o);
    if (o && o.s === 'W' && o.v) { const i = d.querySelector('.in'); if (i) i.insertAdjacentHTML('beforeend', '<b class="wx">x' + o.v + '</b>'); }
    return d;
  };
  function setCell(v, c, r, o, cls) {
    const old = v.cells[c] && v.cells[c][r]; if (!old) return; const ne = cellEl(T.g, o); if (cls) ne.classList.add(cls);
    if (old.style.transform) ne.style.transform = old.style.transform; old.replaceWith(ne); v.cells[c][r] = ne;
  }
  function boardRect() { return document.getElementById('boardWrap').getBoundingClientRect(); }
  function cellCenter(v, c, r) { const p = v.cellPos(c, r), b = boardRect(); return [b.left + 4 + p[0], b.top + 4 + p[1]]; }
  let colo = null; const clearColo = () => { if (colo) { colo.remove(); colo = null; } };

  async function playFx(v, f, fin, tb) {
    const W = { s: 'W' };
    if (f.t === 'mystery') { floatTxt('MYSTERY!', 900); sfx.scatter(); await wait(tb ? 250 : 600); f.cells.forEach(([c, r]) => setCell(v, c, r, fin[c][r], 'flip')); sfx.win(); await wait(tb ? 300 : 700); }
    else if (f.t === 'lightning') {
      flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); sfx.mult(); floatTxt('LIGHTNING WILDS!', 1000);
      const wrap = document.getElementById('boardWrap');
      for (const [c, r] of f.cells) { const p = v.cellPos(c, r); const b = document.createElement('div'); b.className = 'bolt'; b.style.left = (p[0] + 1) + 'px'; b.style.top = '-40px'; b.style.height = (p[1] + 44) + 'px'; wrap.appendChild(b); setTimeout(() => b.remove(), 400); setCell(v, c, r, fin[c][r], 'grow'); if (window.LVFX) LVFX.burst(p[0] + 4, p[1] + 4, 14, 190); await wait(tb ? 60 : 160); }
      await wait(tb ? 200 : 500);
    }
    else if (f.t === 'wildreel') { floatTxt('WILD REELS!', 1100); sfx.mult(); for (const c of f.reels) { if (v.reels && v.reels[c]) v.reels[c].r.classList.add('wildglow'); for (let r = 0; r < fin[c].length; r++) setCell(v, c, r, fin[c][r], 'grow'); await wait(tb ? 120 : 300); } await wait(tb ? 200 : 600); (v.reels || []).forEach(x => x.r.classList.remove('wildglow')); }
    else if (f.t === 'expand') { sfx.mult(); floatTxt('EXPANDING WILD!', 900); for (const c of f.reels) { if (v.reels && v.reels[c]) v.reels[c].r.classList.add('wildglow'); for (let r = 0; r < fin[c].length; r++) setCell(v, c, r, fin[c][r], 'grow'); await wait(tb ? 100 : 250); } await wait(tb ? 150 : 400); (v.reels || []).forEach(x => x.r.classList.remove('wildglow')); }
    else if (f.t === 'wmult') { for (const [c, r] of f.cells) { setCell(v, c, r, fin[c][r], 'grow'); sfx.pop(); await wait(tb ? 60 : 180); } }
    else if (f.t === 'colossal') {
      sfx.big(); floatTxt('COLOSSAL!', 1000); for (let c = f.c0; c < f.c0 + 3; c++) for (let r = 0; r < 3; r++) setCell(v, c, r, fin[c][r]);
      const a = v.cellPos(f.c0, 0), z = v.cellPos(f.c0 + 2, 2); colo = document.createElement('div'); colo.className = 'colo';
      Object.assign(colo.style, { left: (a[0] + 4 - CELL / 2 + 3) + 'px', top: (a[1] + 4 - CELLH / 2 + 3) + 'px', width: (z[0] - a[0] + CELL - 6) + 'px', height: (z[1] - a[1] + CELLH - 6) + 'px' });
      const t = T.g.glyph[f.to] || '⭐'; colo.innerHTML = '<span class="emo">' + t + '</span>'; document.getElementById('boardWrap').appendChild(colo); await wait(tb ? 300 : 900);
    }
    else if (f.t === 'walk') { floatTxt('WALKING WILD → RESPIN', 900); }
  }
  async function animCollect(v, col, tb) {
    if (!col) return; floatTxt('COLLECT!', 900); sfx.coins();
    const W = []; v.cells.forEach((cs, c) => cs.forEach((e, r) => { if (e.classList.contains('wild')) W.push([c, r]); }));
    for (const [c, r] of col.cells) { const from = cellCenter(v, c, r); const to = cellCenter(v, ...(W[0] || [2, 1])); const el = document.createElement('div'); el.className = 'collectfly'; el.textContent = fmt(r2(col.cells.find(z => z[0] === c && z[1] === r)[2] * curBet())); el.style.left = from[0] + 'px'; el.style.top = from[1] + 'px'; document.body.appendChild(el);
      el.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(calc(${to[0] - from[0]}px - 50%),calc(${to[1] - from[1]}px - 50%)) scale(.6)`, opacity: .3 }], { duration: tb ? 300 : 600, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove(); sfx.coins(); await wait(tb ? 60 : 140); }
    await wait(tb ? 250 : 500); setWin('<span>Collected</span><b>' + fmt(col.amt) + '</b>' + (col.wilds > 1 ? '<span class="mx">x' + col.wilds + ' wilds</span>' : '') + (col.mult > 1 ? '<span class="mx">x' + col.mult + '</span>' : '')); await wait(tb ? 300 : 800);
  }

  // ---------- presenter ----------
  const present0 = window.present;
  window.present = async function (res, inFS) {
    if (!res || !res.feat) { clearColo(); return present0(res, inFS); }
    const v = T.view, g = T.g, m = E.MATH[g.mk || g.e]; const TB = () => !!S.turbo || !!T.quick; let tb = TB(); let run = 0; clearColo();
    for (let i = 0; i < res.steps.length; i++) {
      const st = res.steps[i]; tb = TB();
      if (i > 0) { clearHL(); clearColo(); await wait(tb ? 150 : 400); }
      await v.spin(st.grid, tb);
      if (inFS && (m.feat || {}).sticky && T.fs && T.fs.ext && T.fs.ext.sticky) T.fs.ext.sticky.forEach(([c, r]) => { const e = v.cells[c] && v.cells[c][r]; if (e) e.classList.add('sticky'); });
      for (const f of st.fx || []) await playFx(v, f, st.final, tb);
      if (st.collect) await animCollect(v, st.collect, tb);
      if (st.win > 0) {
        const lw = r2(st.win - (st.collect ? st.collect.amt : 0)); run = r2(run + st.win);
        if (lw > 0) { hl(st.wins.flatMap(w => w.cells)); if ((m.base || g.e) === 'lines') drawLines(st.wins); sfx.win(); const wm = Math.max(1, ...st.wins.map(w => w.wm || 1)); floatTxt((wm > 1 ? 'x' + wm + '  ' : '') + fmt(lw), tb ? 600 : 1000);
          setWin('<span>' + (st.respin ? 'Respin win' : 'Win') + '</span><b>' + fmt(run) + '</b>' + (st.mult && st.mult > 1 ? '<span class="mx">x' + st.mult + '</span>' : '')); await wait(tb ? 450 : 1000); }
      }
      st.grid = st.final; // so resizes redraw the final symbols
    }
    if (res.collectUp) { sfx.big(); floatTxt('+10 SPINS · PRIZES x' + res.collectUp.mult, 1600); await wait(1600); }
    if (res.bonus) { clearHL(); hl(res.scat.cells.length ? res.scat.cells : []); sfx.scatter(); floatTxt(res.bonus.type === 'pick' ? 'PICK BONUS!' : 'WHEEL BONUS!', 1300); await wait(1400); clearHL(); if (res.bonus.type === 'pick') await pickGame(res.bonus); else await wheelGame(res.bonus); setWin('<span>Bonus</span><b>' + fmt(res.bonus.win) + '</b>'); }
    if (res.scat.trig) { hl(res.scat.cells); sfx.scatter(); floatTxt(inFS ? '+ FREE SPINS' : 'FREE SPINS', 1400); await wait(1400); }
  };

  // ---------- pick bonus ----------
  function pickGame(b) {
    return new Promise(res => {
      const N = 12, icons = ['🧰', '🎁', '💼', '👜'];
      const LZ = ((window.LVLang && LVLang.get()) || 'bi'), FZ = (zh, en) => LZ === 'zh' ? zh : LZ === 'en' ? en : zh + ' ' + en; box().innerHTML = '<h2>' + FZ('宝箱选宝', 'TREASURE PICK') + '</h2><p>' + FZ('打开宝箱拿奖金，开到“收取”时奖励结束。', 'Open chests to reveal prizes. The bonus ends when you find COLLECT.') + (b.mult > 1 ? FZ(' 所有奖金 x' + b.mult + '！', ' All prizes x' + b.mult + '!') : '') + '</p><div class="chests">' + Array.from({ length: N }, (_, i) => '<button class="chest emo" data-i="' + i + '">' + icons[i % 4] + '</button>').join('') + '</div><div class="ftot" id="ptot">0.00</div>';
      ov.classList.add('show'); let k = 0, tot = 0; const bet = curBet(); let done = false;
      const open = btn => {
        if (done || btn.disabled) return; const it = b.items[k++]; btn.disabled = true; btn.classList.add('open');
        if (it === 'COLLECT') { btn.classList.add('end'); btn.textContent = 'COLLECT'; done = true; sfx.big();
          box().querySelectorAll('.chest:not(.open)').forEach(x => { x.classList.add('dim'); x.disabled = true; });
          document.getElementById('ptot').textContent = fmt(b.win) + (b.mult > 1 ? '  (x' + b.mult + ')' : ''); clearInterval(auto); setTimeout(() => { ov.classList.remove('show'); res(); }, 1800); return; }
        tot += it; btn.textContent = it + 'x'; sfx.coins(); document.getElementById('ptot').textContent = fmt(r2(b.win * tot / b.base));
      };
      box().querySelectorAll('.chest').forEach(x => x.onclick = () => open(x));
      const auto = setInterval(() => { if (T.auto > 0 || S.turbo) { const c = box().querySelector('.chest:not(:disabled)'); if (c) open(c); } }, 700);
    });
  }
  // ---------- wheel bonus ----------
  function wheelSVG(vals, lvl) {
    const n = vals.length, R = 100, cols = [['#b91c1c', '#7f1d1d'], ['#1d4ed8', '#1e3a8a'], ['#7e22ce', '#4c1d95']][lvl] || ['#b91c1c', '#7f1d1d'];
    let s = '<svg viewBox="-110 -110 220 220">'; for (let i = 0; i < n; i++) { const a0 = (i / n) * 2 * Math.PI - Math.PI / 2 - Math.PI / n, a1 = a0 + 2 * Math.PI / n; const x0 = R * Math.cos(a0), y0 = R * Math.sin(a0), x1 = R * Math.cos(a1), y1 = R * Math.sin(a1);
      const v = vals[i]; const fill = v === 'UP' ? '#16a34a' : (i % 2 ? cols[0] : cols[1]);
      s += '<path d="M0 0 L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + R + ' ' + R + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Z" fill="' + fill + '" stroke="#ffd447" stroke-width="1.5"/>';
      const am = (a0 + a1) / 2; s += '<text x="' + (68 * Math.cos(am)).toFixed(1) + '" y="' + (68 * Math.sin(am)).toFixed(1) + '" fill="#fff" font-family="Anton,Impact,Arial Black" font-size="' + (v === 'UP' ? 11 : 15) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + (am * 180 / Math.PI + 90).toFixed(1) + ' ' + (68 * Math.cos(am)).toFixed(1) + ' ' + (68 * Math.sin(am)).toFixed(1) + ')">' + (v === 'UP' ? (((window.LVLang && LVLang.get()) === 'en') ? 'UPGRADE' : '升级') : v + 'x') + '</text>'; }
    for (let i = 0; i < 24; i++) { const a = i / 24 * 2 * Math.PI; s += '<circle cx="' + (104 * Math.cos(a)).toFixed(1) + '" cy="' + (104 * Math.sin(a)).toFixed(1) + '" r="2.6" fill="#fff6c2"/>'; }
    return s + '<circle r="105" fill="none" stroke="#ffd447" stroke-width="4"/></svg>';
  }
  async function wheelGame(b) {
    ov.classList.add('show');
    for (let s = 0; s < b.stops.length; s++) {
      const st = b.stops[s], vals = b.wheels[st.wheel];
      box().innerHTML = '<h2>' + ['PRIZE WHEEL', 'SUPER WHEEL', 'MEGA WHEEL'][st.wheel] + '</h2><p>' + (st.wheel < 2 ? 'Land UPGRADE to move up to the next wheel!' : 'Top prize 1,000x the bet!') + '</p><div class="wheelwrap"><div class="ptr"></div>' + wheelSVG(vals, st.wheel) + '<div class="hub">SPIN</div></div><div class="ftot" id="wtot"></div>';
      const svg = box().querySelector('svg'); await wait(S.turbo ? 200 : 700); sfx.spin();
      const n = vals.length, rot = 360 * 5 - st.i * (360 / n); svg.style.transform = 'rotate(' + rot + 'deg)';
      const tick = setInterval(() => sfx.click(), 120); await wait(S.turbo ? 2200 : 4300); clearInterval(tick);
      if (st.v === 'UP' && s < b.stops.length - 1) { sfx.scatter(); document.getElementById('wtot').textContent = 'UPGRADE!'; await wait(1300); continue; }
      sfx.big(); document.getElementById('wtot').textContent = st.v + 'x  =  ' + fmt(b.win) + (b.x5 ? '  (5 BONUS x2)' : ''); await wait(2200);
    }
    ov.classList.remove('show');
  }
  // ---------- choose your free spins ----------
  window.LVF = {
    choose(g, options) {
      return new Promise(res => {
        box().innerHTML = '<h2>CHOOSE YOUR BONUS</h2><p>Same expected value — pick your style: more spins or bigger multipliers.</p><div class="choices">' + options.map((o, i) => '<button data-i="' + i + '"><b>' + o[0] + '</b>free spins · x' + o[1] + '</button>').join('') + '</div>';
        ov.classList.add('show'); sfx.scatter(); let done = false;
        const go = async i => { if (done) return; done = true; const r = await API.spin(g.id, curBet(), false, false, { choice: i }); ov.classList.remove('show'); if (r.err) { toast(r.msg || r.err); res(null); return; } if (API.mode === 'server') S.fs = r.fs; res(r); };
        box().querySelectorAll('[data-i]').forEach(b => b.onclick = () => go(+b.dataset.i));
        if (T.auto > 0) setTimeout(() => go(Math.floor(Math.random() * options.length)), 2500);
      });
    },
    // ---------- gamble ----------
    offerGamble(r) {
      const bar = document.getElementById('winbar'); if (!bar) return;
      if (!T.g || !T.g.slot || r.inFS || r.ev || !(r.win > 0) || T.auto > 0) { if (T.pend) LVF.collect(true); return; }
      if (document.getElementById('wActs')) return;
      const w = document.createElement('div'); w.id = 'wActs';
      w.innerHTML = '<button id="collectBtn">COLLECT</button><button id="gambleBtn">GAMBLE</button>'; bar.appendChild(w);
      const t = setTimeout(() => LVF.collect(), 7000); LVF._ct = t;
      document.getElementById('collectBtn').onclick = () => LVF.collect();
      document.getElementById('gambleBtn').onclick = () => { clearTimeout(t); w.remove(); const amt = r.win; T.pend = 0; setBal(); gamble(amt); };
    },
    collect(quick) {
      clearTimeout(LVF._ct); const w = document.getElementById('wActs'); if (w) w.remove();
      const p = T.pend || 0; if (!p) return; const from = r2(S.bal - p); T.pend = 0;
      setWin('<span>Collected</span><b>' + fmt(p) + '</b>');
      if (quick) { setBal(); return; }
      try { sfx.collect ? sfx.collect() : sfx.coins(); } catch (e) {}
      try { if (LVFX.fly) LVFX.fly(Math.min(16, 5 + Math.round(p / Math.max(.01, curBet())))); } catch (e) {}
      const els = [document.getElementById('bal'), document.getElementById('bal2')], t0 = performance.now(), d = 900, to = S.bal;
      const box = document.getElementById('bal2box'); if (box) { box.classList.remove('glowc'); void box.offsetWidth; box.classList.add('glowc'); }
      (function tk(n) { const k = Math.min(1, (n - t0) / d), v = from + (to - from) * (1 - Math.pow(1 - k, 3)); if (!T.pend) els.forEach(e => e && (e.textContent = fmt(v))); if (k < 1) requestAnimationFrame(tk); else setBal(); })(t0);
    }
  };
  async function gamble(amt) {
    const g = T.g; const hist = []; let cur = amt, left = 5; T.busy = true; updUI();
    const draw = (msg, card) => {
      box().innerHTML = '<h2>GAMBLE</h2><p>' + msg + '</p><div class="ftot">' + fmt(cur) + '</div><div class="gcard' + (card ? ' face' : '') + '" style="color:' + (card ? SUIT[card.suit][1] : '#fff') + '">' + (card ? card.rank + SUIT[card.suit][0] : '') + '</div>' +
        '<div class="gbtns"><button class="red" data-p="red">RED x2</button><button class="black" data-p="black">BLACK x2</button></div><div class="gbtns">' + ['h', 'd', 'c', 's'].map(s => '<button class="suit" data-p="' + s + '" style="color:' + SUIT[s][1] + '">' + SUIT[s][0] + ' x4</button>').join('') + '</div>' +
        '<div class="gbtns"><button class="col" id="gcol">COLLECT ' + fmt(cur) + '</button></div><div class="ghist">' + hist.map(c => '<span style="color:' + SUIT[c.suit][1] + '">' + c.rank + SUIT[c.suit][0] + '</span>').join('') + '</div><p style="margin-top:8px;font-size:12px">' + left + ' gambles left · fair odds, 100% return on the gambled amount</p>';
      box().querySelectorAll('[data-p]').forEach(x => x.onclick = () => pick(x.dataset.p)); document.getElementById('gcol').onclick = end;
    };
    let busy = false;
    const pick = async p => {
      if (busy) return; busy = true; const r = await API.gamble(g.id, p); busy = false;
      if (r.err) { toast(r.msg || r.err); end(); return; }
      hist.unshift(r.card); if (hist.length > 6) hist.pop(); S.bal = r.bal; setBal();
      if (r.ok) { cur = r.amt; left = r.left; sfx.win(); if (left <= 0) { draw('Maximum reached — collecting!', r.card); setTimeout(end, 1400); } else draw('You won! Gamble again or collect.', r.card); }
      else { cur = 0; sfx.stop(); draw('Unlucky — the gamble is lost.', r.card); setTimeout(end, 1600); }
    };
    function end() { ov.classList.remove('show'); T.busy = false; setWin(cur > 0 ? '<span>Collected</span><b>' + fmt(cur) + '</b>' : ''); updUI(); }
    ov.classList.add('show'); draw('Guess the colour (x2) or the suit (x4) of the next card.', null);
  }
  function applySkin(g) {
    const gm = document.getElementById('game'); const A = window.LVX && LVX.assets && LVX.assets.games ? LVX.assets.games[g && g.slug] : null;
    gm.classList.toggle('skinned', !!(A && Object.keys(A).some(k => k.startsWith('sym_')))); gm.classList.toggle('reelimg', !!(A && A.reel));
    if (A && A.reel) gm.style.setProperty('--reelimg', 'url("assets/games/' + g.slug + '/' + A.reel + '")'); else gm.style.removeProperty('--reelimg');
    gm.classList.toggle('nolabel', !!(A && A.nolabel)); gm.classList.toggle('goldframe', !!(A && A.frame === 'gold'));
    const lg = document.getElementById('gLogo'); if (lg) { if (!lg.dataset.html) lg.dataset.html = '1'; lg.classList.toggle('imglogo', !!(A && A.logo)); let im = lg.querySelector('img.lgimg'); if (A && A.logo) { if (!im) { im = document.createElement('img'); im.className = 'lgimg'; lg.appendChild(im); } lg.classList.remove('tall'); im.onload = () => lg.classList.toggle('tall', im.naturalWidth / im.naturalHeight < 3.2); im.src = 'assets/games/' + g.slug + '/' + A.logo; } else if (im) im.remove(); }
  }
  // resume a pending choice after a reload
  const open0 = window.openGame;
  window.openGame = function (id) { const r = open0.apply(this, arguments); const g = GAMES[id]; if (g && g.slot) applySkin(g); if (g && S.fs && S.fs.gid === id && S.fs.choose) setTimeout(async () => { const c = await LVF.choose(g, S.fs.choose); if (c && c.fs) { T.fs = c.fs; S.fs = c.fs; updUI(); setTimeout(() => doSpin(), 600); } }, 800); return r; };
})();
