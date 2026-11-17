// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// Lucky Vault v5 retention UI: lobby dock (timed bonus, daily wheel, daily rush, album, VIP), shared progressive
// jackpot ticker, daily wheel with multipliers, card-collection album, VIP tiers, card drops, jackpot wins, level locks.
(function () {
  const $ = s => document.querySelector(s), A = 'assets/';
  const css = `
#hovDock{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:25;display:flex;gap:6px;padding:8px 10px 6px;border-radius:22px;background:linear-gradient(#3b1d6e,#1d0d3a);box-shadow:0 0 0 2px #d4a017,0 10px 30px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.18)}
#hovDock button{position:relative;border:0;background:none;color:#fff;width:74px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font:900 10px/1.1 "Arial Black",sans-serif;letter-spacing:.3px;text-shadow:0 2px 2px #000;padding:0}
#hovDock button .ic{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#fff7c2,#f2b705 45%,#8a5a00);box-shadow:0 3px 0 #5a3a00,0 0 0 2px #ffe58a inset;transition:transform .15s}
#hovDock button .ic img{width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}
#hovDock button:active .ic{transform:scale(.92)}
#hovDock button .tm{font:800 10px system-ui,sans-serif;color:#ffd60a;min-height:12px}
#hovDock button.ready .ic{animation:dockPulse 1.1s ease-in-out infinite}
#hovDock button .dot{position:absolute;top:0;right:10px;background:#ff2d55;color:#fff;border-radius:9px;font:900 10px system-ui;padding:1px 5px;box-shadow:0 0 0 2px #1d0d3a}
@keyframes dockPulse{50%{transform:scale(1.1);box-shadow:0 3px 0 #5a3a00,0 0 0 2px #fff inset,0 0 22px #ffd60a}}
body.ingame #hovDock{display:none}
#lobby{padding-bottom:96px}
@media (max-height:480px) and (orientation:landscape){#hovDock{padding:3px 6px 2px;bottom:4px;gap:2px}#hovDock button{width:60px;font-size:9px}#hovDock button .ic{width:34px;height:34px}#hovDock button .ic img{width:26px;height:26px}#hovDock button .tm{font-size:8px;min-height:9px}#lobby{padding-bottom:72px}}
@media(max-width:520px){#hovDock{gap:2px;padding:6px 6px 4px;bottom:6px}#hovDock button{width:62px;font-size:9px}#hovDock button .ic{width:42px;height:42px}#hovDock button .ic img{width:32px;height:32px}}
.jpbar{display:flex;gap:8px;justify-content:center;align-items:stretch;margin:10px 14px 4px;flex-wrap:wrap}
.jpbar .jp{flex:1;min-width:130px;max-width:300px;border-radius:14px;padding:6px 10px 7px;text-align:center;background:linear-gradient(#2a0f4f,#12062a);box-shadow:0 0 0 2px var(--jc),0 0 18px color-mix(in srgb,var(--jc) 45%,transparent),inset 0 1px 0 rgba(255,255,255,.2)}
.jpbar .jp small{display:block;font:900 11px "Arial Black",sans-serif;letter-spacing:2px;color:var(--jc)}
.jpbar .jp b{display:block;white-space:nowrap;font:900 clamp(17px,2.6vw,26px) Anton,Impact,"Arial Black",sans-serif;color:#fff;text-shadow:0 0 10px var(--jc),0 2px 0 #000;font-variant-numeric:tabular-nums;letter-spacing:.5px}
.jpbar .jp.grand{--jc:#ffd60a;flex:1.5}.jpbar .jp.major{--jc:#ff4fd8}.jpbar .jp.minor{--jc:#4cc9f0}.jpbar .jp.mini{--jc:#5ef08a}
#game .jpbar{position:relative;z-index:3;margin:4px auto 2px;max-width:860px;gap:6px}#game .jpbar .jp{flex:0 0 auto;min-width:118px;max-width:none;padding:3px 12px 4px;border-radius:10px}#game .jpbar .jp.grand{min-width:140px}#game .jpbar .jp small{font-size:9px;letter-spacing:1px}#game .jpbar .jp b{font-size:clamp(13px,2vw,19px)}
.hovov{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(5,2,15,.78);backdrop-filter:blur(3px)}
.hovov.show{display:flex}
.hovbox{position:relative;width:min(760px,94vw);max-height:92vh;overflow:auto;border-radius:22px;padding:18px;background:linear-gradient(160deg,#2c1260,#120728);box-shadow:0 0 0 3px #d4a017,0 30px 80px rgba(0,0,0,.7);color:#fff;text-align:center;animation:hovIn .35s cubic-bezier(.3,1.5,.5,1)}
@keyframes hovIn{from{transform:scale(.8);opacity:0}}
.hovbox h2{font:900 clamp(22px,4vw,34px) Anton,Impact,"Arial Black",sans-serif;letter-spacing:1px;background:linear-gradient(#fffbe6,#ffd36b 50%,#e08a00);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 rgba(0,0,0,.6));margin:0 0 6px}
.hovbox p{color:#d8ccf0;font-size:13px;margin:4px 0 10px}
.hovx{position:absolute;z-index:20;top:10px;right:12px;width:34px;height:34px;border-radius:50%;border:0;background:#ff3b5c;color:#fff;font:900 18px system-ui;cursor:pointer;box-shadow:0 3px 0 #8a0020}
.hovbtn{border:0;border-radius:14px;padding:12px 28px;font:900 18px "Arial Black",sans-serif;color:#063;background:linear-gradient(#7dffa8,#12a150);box-shadow:0 5px 0 #075d2c,0 0 20px rgba(80,255,150,.4);cursor:pointer;text-shadow:0 1px 0 rgba(255,255,255,.5)}
.hovbtn:disabled{filter:grayscale(1) brightness(.7);cursor:default}
.wheelwrap{position:relative;width:min(380px,78vw);aspect-ratio:1;margin:6px auto 12px}
.wheelwrap svg{width:100%;height:100%;transition:transform 5.2s cubic-bezier(.12,.7,.08,1);filter:drop-shadow(0 10px 20px rgba(0,0,0,.6))}
.wheelwrap .ptr{position:absolute;left:50%;top:-10px;transform:translateX(-50%);width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-top:34px solid #ffd60a;filter:drop-shadow(0 3px 2px #000);z-index:2}
.wmult{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:8px 0}
.wmult span{background:#0008;border:1px solid #ffd60a55;border-radius:10px;padding:6px 10px;font:800 13px system-ui}
.wmult span b{color:#ffd60a;font-size:16px;margin-left:4px}
.wtot{font:900 clamp(30px,6vw,52px) Anton,Impact,"Arial Black",sans-serif;color:#ffd60a;text-shadow:0 4px 0 #6b4300,0 0 20px #000}
.albgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
@media(max-width:600px){#game .jpbar{flex-wrap:nowrap}#game .jpbar .jp,#game .jpbar .jp.grand{flex:1 1 0;min-width:0;padding:2px 3px}#game .jpbar .jp b{font-size:10px;letter-spacing:-.2px}#game .jpbar .jp small{font-size:7px}}
@media(max-width:600px){.albgrid{grid-template-columns:repeat(2,1fr)}}
.albset{border-radius:16px;padding:8px;cursor:pointer;background:linear-gradient(160deg,var(--c2),var(--c1));box-shadow:0 0 0 2px rgba(255,255,255,.25),0 6px 14px rgba(0,0,0,.5);transition:transform .15s}
.albset:hover{transform:translateY(-3px)}
.albset img{width:70%;aspect-ratio:200/260;object-fit:contain}
.albset b{display:block;font:900 14px "Arial Black",sans-serif}
.albset .pb{height:8px;border-radius:5px;background:#0007;margin:5px 0 3px;overflow:hidden}.albset .pb i{display:block;height:100%;background:linear-gradient(90deg,#ffd60a,#ff8a00)}
.albset small{font:700 11px system-ui;color:#ffe9a8}
.albset.done{box-shadow:0 0 0 3px #ffd60a,0 0 22px #ffd60a}
.cardgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:8px}
@media(max-width:600px){.cardgrid{grid-template-columns:repeat(3,1fr)}}
.acard{position:relative}.acard img{width:100%;display:block;border-radius:12px}
.acard.miss img{filter:brightness(0) opacity(.45)}.acard.miss::after{content:"?";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 44px Anton,Impact,sans-serif;color:#ffffff55}
.acard em{position:absolute;top:4px;right:4px;background:#ff2d55;border-radius:9px;padding:1px 6px;font:900 11px system-ui;font-style:normal}
.vipt{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0}
.vipt div{flex:1;min-width:110px;border-radius:14px;padding:10px 6px;background:#0006;box-shadow:0 0 0 2px #ffffff22}
.vipt div.on{box-shadow:0 0 0 3px #ffd60a,0 0 20px #ffd60a88;background:linear-gradient(#5a2a9e,#2a0f55)}
.vipt div b{display:block;font:900 15px "Arial Black",sans-serif}.vipt div i{display:block;font-style:normal;font-size:26px}.vipt div small{font:700 11px system-ui;color:#d8ccf0}
#cardPop{position:fixed;right:16px;bottom:110px;z-index:70;display:flex;gap:8px;pointer-events:none}
#cardPop .cp{width:110px;text-align:center;animation:cpIn .5s cubic-bezier(.3,1.6,.5,1),cpOut .5s ease-in 3s forwards}
#cardPop .cp img{width:100%;filter:drop-shadow(0 0 14px #ffd60a)}#cardPop .cp b{display:block;font:900 12px "Arial Black",sans-serif;color:#ffd60a;text-shadow:0 2px 2px #000}
@keyframes cpIn{from{transform:translateY(60px) rotate(-12deg) scale(.4);opacity:0}}@keyframes cpOut{to{transform:translateY(-40px) scale(.7);opacity:0}}
#jpWin .hovbox{background:radial-gradient(circle at 50% 30%,#7a3fd0,#1b0838 70%)}
#jpWin .big{font:900 clamp(40px,10vw,90px) Anton,Impact,"Arial Black",sans-serif;color:#ffd60a;text-shadow:0 6px 0 #6b4300,0 0 40px #ff9d00;animation:jpPulse .6s ease-in-out infinite alternate}
@keyframes jpPulse{to{transform:scale(1.06)}}
.tile.locked{filter:saturate(.35) brightness(.7)}
.tile .lockb{position:absolute;inset:auto 8px 46% 8px;z-index:5;text-align:center;font:900 12px "Arial Black",sans-serif;color:#fff;background:#000b;border-radius:10px;padding:6px 4px;box-shadow:0 0 0 2px #ffd60a}
.flyc{position:fixed;z-index:80;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6c2,#ffc83d 45%,#b07400);box-shadow:0 0 8px #ffd60a;pointer-events:none}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  let HV = null, JP = { grand: 100000, major: 10000, minor: 1000, mini: 200 }, JPshow = JP;
  const srv = () => API.mode === 'server' && API.user;

  function overlay(id, html) {
    let o = document.getElementById(id); if (!o) { o = document.createElement('div'); o.id = id; o.className = 'hovov'; document.body.appendChild(o); }
    o.innerHTML = '<div class="hovbox"><button class="hovx" data-x>✕</button>' + html + '</div>'; o.classList.add('show');
    o.onclick = e => { if (e.target === o || e.target.closest('[data-x]')) o.classList.remove('show'); }; return o.firstChild;
  }
  function flyTo(from, n) {
    const to = (document.getElementById('game').classList.contains('show') ? $('#bal2box') : $('#bal')) || $('#bal'); if (!to || !from) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    for (let i = 0; i < n; i++) { const c = document.createElement('div'); c.className = 'flyc'; const sx = a.left + a.width / 2, sy = a.top + a.height / 2; c.style.left = sx + 'px'; c.style.top = sy + 'px'; document.body.appendChild(c);
      c.animate([{ transform: 'translate(0,0) scale(.5)', opacity: 0 }, { transform: `translate(${(Math.random() - .5) * 220}px,${-80 - Math.random() * 120}px) scale(1.2)`, opacity: 1, offset: .35 }, { transform: `translate(${b.left + b.width / 2 - sx}px,${b.top + b.height / 2 - sy}px) scale(.5)`, opacity: .9 }], { duration: 800 + Math.random() * 300, delay: i * 40, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => c.remove(); }
  }

  // ---------------- dock ----------------
  const dock = document.createElement('div'); dock.id = 'hovDock';
  dock.innerHTML = [['bonus', A + 'tables/coins.webp', 'COLLECT'], ['wheel', A + 'tables/fw_ring.webp', 'DAILY WHEEL'], ['rush', A + 'games/gold-rush/h1.webp', 'DAILY RUSH'], ['album', A + 'album/gems/9.webp', 'ALBUM'], ['vip', A + 'album/jewels/9.webp', 'VIP CLUB']]
    .map(([k, im, t]) => '<button data-k="' + k + '"><span class="ic"><img src="' + im + '" alt=""></span>' + t + '<span class="tm" id="dk_' + k + '"></span></button>').join('');
  document.body.appendChild(dock);
  dock.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (window.needLogin && needLogin()) return; (sfx.click || (() => {}))(); ({ bonus: collectBonus, wheel: () => checkDaily(true), rush: () => LVX.quests && LVX.quests('missions'), album: openAlbum, vip: openVip })[b.dataset.k](); };
  const watchGame = new MutationObserver(() => document.body.classList.toggle('ingame', $('#game').classList.contains('show') || ($('#table') && $('#table').classList.contains('show'))));
  setTimeout(() => { ['#game', '#table'].forEach(s => { const el = $(s); if (el) watchGame.observe(el, { attributes: true, attributeFilter: ['class'] }); }); }, 500);

  function paintDock() {
    const bt = dock.querySelector('[data-k=bonus]'), t = $('#dk_bonus');
    const at = HV ? HV.bonus.nextAt : (API.user && API.user.bonusAt) || 0, left = at - Date.now();
    bt.classList.toggle('ready', left <= 0); t.textContent = left <= 0 ? 'READY!' : new Date(left).toISOString().substr(11, 8);
    if (HV) { const got = HV.album.sets.reduce((a, s) => a + s.cards.filter(Boolean).length, 0); $('#dk_album').textContent = got + '/80'; $('#dk_vip').textContent = HV.vip.name.toUpperCase(); }
    const w = dock.querySelector('[data-k=wheel]'); w.classList.toggle('ready', !!(HV && HV.dailyReady)); $('#dk_wheel').textContent = HV && HV.dailyReady ? 'SPIN!' : '';
  }
  setInterval(paintDock, 1000);
  async function load() { if (!srv()) { paintDock(); return; } const r = await API.call('/api/hov'); if (!r.err) { HV = r; setJP(r.jackpots); } const d = await API.call('/api/daily'); if (HV && d && !d.err) HV.dailyReady = !!d.available; paintDock(); }
  async function collectBonus() {
    if (!srv()) { toast('Log in to collect free coins'); return; }
    const r = await API.call('/api/bonus', {}); if (r.err) { toast(r.msg || 'Not ready yet'); return; }
    setUser(r); if (HV) HV.bonus.nextAt = r.nextAt; flyTo(dock.querySelector('[data-k=bonus]'), 16); (sfx.collect || sfx.coins)(); toast('+' + fmtN(r.amount) + ' free coins'); paintDock();
  }

  // ---------------- jackpot ticker ----------------
  function bar() { return '<div class="jpbar">' + ['grand', 'major', 'minor', 'mini'].map(k => '<div class="jp ' + k + '"><small>' + k.toUpperCase() + '</small><b data-jp="' + k + '">—</b></div>').join('') + '</div>'; }
  function mountBars() {
    if (!$('#lobby .jpbar')) { const h = $('#heros'); if (h) h.insertAdjacentHTML('afterend', bar()); }
    if (!$('#game .jpbar')) { const s = $('#stage'); if (s) s.insertAdjacentHTML('afterbegin', bar()); }
  }
  // fixed jackpots: the meters show the set amounts and never move
  function setJP(p) { if (!p) return; JP = Object.assign({}, p); JPshow = JP; paintJP(); }
  function paintJP() { if (!JP) return; document.querySelectorAll('[data-jp]').forEach(el => { const v = JP[el.dataset.jp]; const t = v != null ? Math.round(v).toLocaleString('en-US') : '—'; if (el.textContent !== t) el.textContent = t; }); }
  setInterval(paintJP, 1000);
  async function pollJP() { try { const r = await fetch((window.LV_CONFIG && LV_CONFIG.server || '') + '/api/jackpots').then(r => r.json()); setJP(r.jackpots); } catch (e) {} }
  setInterval(pollJP, 60000);

  // ---------------- daily wheel (replaces the daily reward panel) ----------------
  window.checkDaily = async function (force) {
    if (!srv()) return; const d = await API.call('/api/daily'); if (d.err) return;
    if (HV) HV.dailyReady = !!d.available;
    if (!force) { paintDock(); return; }   // never pops up by itself: the DAILY WHEEL button in the dock glows (SPIN!) and the player opens it
    const W = (HV && HV.wheel) || [500, 2000, 750, 5000, 1000, 1500, 750, 10000, 1000, 3000, 500, 2500], n = W.length, R = 100;
    const cols = ['#e63946', '#f4a261', '#2a9d8f', '#8338ec', '#ff006e', '#3a86ff', '#06d6a0', '#ffbe0b', '#fb5607', '#7209b7', '#118ab2', '#ef476f'];
    let s = '<svg viewBox="-110 -110 220 220"><defs><radialGradient id="wg"><stop offset="0" stop-color="#fff8"/><stop offset="1" stop-color="#0000"/></radialGradient></defs><circle r="109" fill="#3a1d00" stroke="#ffd60a" stroke-width="4"/>';
    W.forEach((v, i) => { const a0 = (i - .5) / n * 2 * Math.PI - Math.PI / 2, a1 = (i + .5) / n * 2 * Math.PI - Math.PI / 2, am = i / n * 2 * Math.PI - Math.PI / 2;
      s += '<path d="M0 0 L' + (R * Math.cos(a0)).toFixed(2) + ' ' + (R * Math.sin(a0)).toFixed(2) + ' A' + R + ' ' + R + ' 0 0 1 ' + (R * Math.cos(a1)).toFixed(2) + ' ' + (R * Math.sin(a1)).toFixed(2) + 'Z" fill="' + cols[i % cols.length] + '" stroke="#ffd60a" stroke-width="1.2"/>';
      s += '<text x="' + (68 * Math.cos(am)).toFixed(2) + '" y="' + (68 * Math.sin(am)).toFixed(2) + '" fill="#fff" font-size="' + (v >= 10000 ? 11 : 12) + '" font-weight="900" font-family="Arial Black,sans-serif" text-anchor="middle" dominant-baseline="middle" stroke="#0007" stroke-width="2" paint-order="stroke" transform="rotate(' + (i / n * 360 + 90) + ' ' + (68 * Math.cos(am)).toFixed(2) + ' ' + (68 * Math.sin(am)).toFixed(2) + ')">' + fmtN(v) + '</text>'; });
    for (let i = 0; i < 24; i++) { const a = i / 24 * 2 * Math.PI; s += '<circle cx="' + (104 * Math.cos(a)).toFixed(1) + '" cy="' + (104 * Math.sin(a)).toFixed(1) + '" r="2.6" fill="#fff6c2" class="bulb"/>'; }
    s += '<circle r="100" fill="url(#wg)" opacity=".25"/><circle r="24" fill="#ffd60a" stroke="#6b4300" stroke-width="3"/><text y="5" text-anchor="middle" font-size="13" font-weight="900" fill="#3a1d00" font-family="Arial Black,sans-serif">SPIN</text></svg>';
    const box = overlay('wheelOv', '<h2>DAILY WHEEL</h2><p>Day ' + d.day + ' streak · spin once a day · the prize is multiplied by your streak, level and VIP tier</p><div class="wheelwrap"><div class="ptr"></div>' + s + '</div><div id="wRes"></div><button class="hovbtn" id="wGo"' + (d.available ? '' : ' disabled') + '>' + (d.available ? 'SPIN!' : 'Come back tomorrow') + '</button>');
    const svg = box.querySelector('svg'); let busy = false;
    box.querySelector('#wGo').onclick = async () => {
      if (busy) return; busy = true; box.querySelector('#wGo').disabled = true;
      const r = await API.call('/api/daily', {}); if (r.err) { toast(r.msg || r.err); busy = false; return; }
      const seg = r.wheel ? r.wheel.seg : 0; sfx.spin(); svg.style.transform = 'rotate(' + (360 * 7 + (360 - seg / n * 360)) + 'deg)';
      setTimeout(() => {
        sfx.stop(); const m = r.wheel ? r.wheel.mults : { streak: 1, level: 1, vip: 1 };
        box.querySelector('#wRes').innerHTML = '<div class="wmult"><span>Prize<b>' + fmtN(r.wheel ? r.wheel.base : r.amount) + '</b></span><span>× Streak<b>' + m.streak + '</b></span><span>× Level<b>' + m.level + '</b></span><span>× VIP<b>' + m.vip + '</b></span></div><div class="wtot">+' + fmtN(r.amount) + '</div>';
        setUser(r); (sfx.big || sfx.win)(); flyTo(box.querySelector('.wtot'), 22); if (HV) HV.dailyReady = false; paintDock();
        box.querySelector('#wGo').textContent = 'COLLECTED'; }, 5300);
    };
  };

  // ---------------- album ----------------
  async function openAlbum(setId) {
    if (!srv()) { toast('Log in to collect cards'); return; }
    const a = await API.call('/api/album'); if (a.err) return; if (HV) HV.album = a;
    const meta = { gems: ['#2b1055', '#7c3aed'], pirate: ['#062a3a', '#0e7490'], magic: ['#1a0b3a', '#6d28d9'], candy: ['#4a0d3a', '#db2777'], treasure: ['#2a1606', '#b45309'], jewels: ['#0b2240', '#1d4ed8'], coins: ['#2a2206', '#ca8a04'], bags: ['#1f1206', '#92400e'] };
    if (!setId) {
      const got = a.sets.reduce((x, s) => x + s.cards.filter(Boolean).length, 0);
      const box = overlay('albumOv', '<h2>VAULT COLLECTION</h2><p>Spin any slot to find cards — bigger bets find more. Complete a set for its prize; complete all 8 sets for the grand prize of <b style="color:#ffd60a">' + fmtN(a.grand) + '</b> coins.</p><p><b>' + got + ' / 80</b> cards collected' + (a.grandDone ? ' · ALBUM COMPLETE!' : '') + '</p><div class="albgrid">' +
        a.sets.map(s => { const n = s.cards.filter(Boolean).length; return '<div class="albset' + (s.done ? ' done' : '') + '" data-s="' + s.id + '" style="--c1:' + meta[s.id][0] + ';--c2:' + meta[s.id][1] + '"><img src="' + A + 'album/' + s.id + '/9.webp" alt=""><b>' + s.name + '</b><div class="pb"><i style="width:' + n * 10 + '%"></i></div><small>' + n + '/10 · ' + (s.done ? 'COMPLETED' : 'Prize ' + fmtN(s.reward)) + '</small></div>'; }).join('') + '</div>');
      box.querySelectorAll('[data-s]').forEach(el => el.onclick = () => openAlbum(el.dataset.s)); return;
    }
    const s = a.sets.find(x => x.id === setId);
    const box = overlay('albumOv', '<h2>' + s.name.toUpperCase() + '</h2><p>' + s.cards.filter(Boolean).length + '/10 · ' + (s.done ? 'Set completed!' : 'Complete the set to win ' + fmtN(s.reward) + ' coins') + '</p><div class="cardgrid">' +
      s.cards.map((c, i) => '<div class="acard' + (c ? '' : ' miss') + '"><img src="' + A + 'album/' + s.id + '/' + i + '.webp" alt="">' + (c > 1 ? '<em>×' + c + '</em>' : '') + '</div>').join('') + '</div><p style="margin-top:12px"><button class="hovbtn" id="albBack" style="font-size:14px;padding:8px 18px">◀ ALL SETS</button></p>');
    box.querySelector('#albBack').onclick = () => openAlbum();
  }

  // ---------------- VIP ----------------
  async function openVip() {
    if (!srv()) { toast('Log in to join the VIP Club'); return; }
    const r = await API.call('/api/hov'); if (r.err) return; HV = Object.assign(HV || {}, r);
    const icons = ['🥉', '🥈', '🥇', '💠', '💎'];
    overlay('vipOv', '<h2>VIP CLUB</h2><p>Your VIP tier multiplies every free bonus and the daily wheel. Tiers are based on lifetime coin-pack purchases.</p><div class="vipt">' +
      r.tiers.map((t, i) => '<div class="' + (i === r.vip.tier ? 'on' : '') + '"><i>' + icons[i] + '</i><b>' + t.name + '</b><small>×' + t.mult + ' bonuses<br>' + (t.min ? 'from $' + t.min : 'everyone') + '</small></div>').join('') + '</div><p>' +
      (r.vip.next ? 'Spend <b style="color:#ffd60a">$' + r.vip.next.need.toFixed(2) + '</b> more to reach <b>' + r.vip.next.name + '</b>.' : 'You are at the top tier — thank you!') + '</p><p>Free bonus now: <b style="color:#ffd60a">' + fmtN(r.bonus.amount) + '</b> coins every ' + r.bonus.hours + ' hours</p>');
  }

  // ---------------- spin results: card drops, jackpot wins ----------------
  const spin0 = API.spin.bind(API);
  API.spin = async function () {
    const r = await spin0.apply(API, arguments);
    if (r && !r.err) {
      if (r.jackpots) setJP(r.jackpots);
      if (r.cards && r.cards.length) setTimeout(() => showCards(r.cards), 2200);
      if (r.jackpot) setTimeout(() => showJackpot(r.jackpot), 2600);
    }
    return r;
  };
  function showCards(cards) {
    let w = $('#cardPop'); if (!w) { w = document.createElement('div'); w.id = 'cardPop'; document.body.appendChild(w); }
    w.innerHTML = cards.map(c => '<div class="cp"><img src="' + A + 'album/' + c.set + '/' + c.i + '.webp" alt=""><b>' + (c.isNew ? 'NEW CARD!' : 'DUPLICATE') + '</b></div>').join(''); (sfx.pack || sfx.pop)();
    cards.forEach(c => { if (c.setDone) { setTimeout(() => { overlay('setOv', '<h2>SET COMPLETE!</h2><p>' + c.setDone + '</p><div class="wtot">+' + fmtN(c.reward) + '</div>' + (c.grand ? '<p>You completed the whole album!</p>' : '')); (sfx.big || sfx.win)(); }, 1200); } });
    setTimeout(() => { w.innerHTML = ''; }, 3600); if (HV) load();
  }
  function showJackpot(j) {
    const box = overlay('jpWin', '<h2>' + j.name + ' JACKPOT!</h2><p>The Lucky Vault progressive jackpot</p><div class="big">' + fmtN(j.amount) + '</div><p><button class="hovbtn" data-x>COLLECT</button></p>');
    (sfx.big || sfx.win)(); flyTo(box.querySelector('.big'), 30); try { if (window.LVFX && LVFX.burst) LVFX.burst(); } catch (e) {}
  }

  // ---------------- level locks (slots unlock as you level up) ----------------
  function unlockLevel(g) { if (!g || !g.slot || !(window.LV_CONFIG && LV_CONFIG.levelLocks !== false)) return 1; const list = GAMES.filter(x => x && x.slot && window.vis && vis(x)); const k = list.indexOf(g); return k < 16 ? 1 : 2 + (k - 16); }
  window.unlockLevel = unlockLevel;
  const curLvl = () => (typeof E !== 'undefined' && E.levelOf) ? E.levelOf(S.xp || 0) : 1;
  const open0 = window.openGame;
  window.openGame = function (id) { const g = GAMES[id], need = unlockLevel(g); if (need > curLvl()) { toast(g.name + ' unlocks at level ' + need); (sfx.click || (() => {}))(); return; } return open0.apply(this, arguments); };
  function paintLocks() { const lv = curLvl(); document.querySelectorAll('#games .tile[data-id]').forEach(t => { const need = unlockLevel(GAMES[+t.dataset.id]); const lk = need > lv; t.classList.toggle('locked', lk); let b = t.querySelector('.lockb'); if (lk && !b) t.insertAdjacentHTML('beforeend', '<div class="lockb">🔒 LEVEL ' + need + '</div>'); else if (!lk && b) b.remove(); }); }
  const gm = $('#games'); if (gm) new MutationObserver(paintLocks).observe(gm, { childList: true });

  // boot
  mountBars(); pollJP(); setTimeout(load, 1500); setInterval(() => { if (srv()) load(); }, 60000);
  window.LVH = { load, openAlbum, openVip, collectBonus };
})();
