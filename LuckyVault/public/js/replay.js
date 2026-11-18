// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 牌局回放 Hand replay: re-deals a baccarat / dragon tiger hand from the bet history card by card.
(function () {
  const SU = { s: '♠', h: '♥', d: '♦', c: '♣' }; const R = { T: '10' };
  const card = c => '<div class="rp-c ' + (c[1] === 'h' || c[1] === 'd' ? 'red' : '') + '"><b>' + (R[c[0]] || c[0]) + '</b><i>' + SU[c[1]] + '</i></div>';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const NAME = { player: '闲 Player', banker: '庄 Banker', tie: '和 Tie', ppair: '闲对', bpair: '庄对', dbp: '闲龙宝', dbb: '庄龙宝', sdragon: '小龙', bdragon: '大龙', stiger: '小老虎', btiger: '大老虎', dragon7: '龙7', panda8: '熊猫8', dragon: '龙', tiger: '虎', stie: '同花和' };
  async function play(h) {
    const v = h.v; let o = document.getElementById('rpOv'); if (!o) { o = document.createElement('div'); o.id = 'rpOv'; document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.closest('.rp-x')) o.classList.remove('show'); }; }
    const g = (typeof GAMES !== 'undefined' && GAMES[h.g]) || {}; const dt = v.k === 'dt';
    o.innerHTML = '<div class="rp-box"><button class="rp-x">✕</button><h2>▶ 牌局回放 Replay</h2><p class="rp-s">' + (g.name || '') + ' · ' + new Date(h.t).toLocaleString() + '</p>' +
      '<div class="rp-t"><div><h3>' + (dt ? '龙 Dragon' : '闲 Player') + ' <span id="rpA"></span></h3><div class="rp-h" id="rpL"></div></div><div><h3>' + (dt ? '虎 Tiger' : '庄 Banker') + ' <span id="rpB"></span></h3><div class="rp-h" id="rpR"></div></div></div>' +
      '<div class="rp-res" id="rpRes"></div><p class="rp-bets">下注 Bets: ' + (Object.keys(v.b || {}).map(k => (NAME[k] || k) + ' ' + v.b[k]).join(' · ') || '—') + ' · 赢 Win ' + h.w + '</p><button class="rp-again">↻ 再看一次 Again</button></div>';
    o.classList.add('show'); o.querySelector('.rp-again').onclick = () => play(h);
    const L = o.querySelector('#rpL'), Rr = o.querySelector('#rpR'); const add = async (el, c) => { el.insertAdjacentHTML('beforeend', card(c)); try { (sfx.card || sfx.click)(); } catch (e) {} await wait(650); };
    if (dt) { await add(L, v.D); await add(Rr, v.T); }
    else { await add(L, v.P[0]); await add(Rr, v.B[0]); await add(L, v.P[1]); await add(Rr, v.B[1]);
      const pts = cs => cs.reduce((a, c) => a + ({ A: 1, T: 0, J: 0, Q: 0, K: 0 }[c[0]] ?? +c[0]), 0) % 10;
      o.querySelector('#rpA').textContent = pts(v.P.slice(0, 2)); o.querySelector('#rpB').textContent = pts(v.B.slice(0, 2)); await wait(500);
      if (v.P[2]) { await add(L, v.P[2]); o.querySelector('#rpA').textContent = v.pt; } if (v.B[2]) { await add(Rr, v.B[2]); o.querySelector('#rpB').textContent = v.bt; } }
    const LG = (window.LVLang && LVLang.get()) || 'bi', W0 = { player: ['闲赢', 'PLAYER WINS'], banker: ['庄赢', 'BANKER WINS'], tie: ['和局', 'TIE'], dragon: ['龙赢', 'DRAGON WINS'], tiger: ['虎赢', 'TIGER WINS'] }, W = {}; for (const k in W0) W[k] = LG === 'zh' ? W0[k][0] : LG === 'en' ? W0[k][1] : W0[k].join(' ');
    o.querySelector('#rpRes').textContent = W[v.win] || v.win;
  }
  const st = document.createElement('style'); st.textContent = '#rpOv{position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,.65);display:none;align-items:center;justify-content:center;padding:14px}#rpOv.show{display:flex}' +
    '.rp-box{position:relative;max-width:560px;width:100%;background:radial-gradient(ellipse at 50% 30%,#2a5c3a,#0f2a1a);border:3px solid #a16207;border-radius:20px;padding:18px;color:#fff;font:14px "Microsoft YaHei",Arial,sans-serif;text-align:center}.rp-box h2{margin:0;color:#ffd60a}.rp-s{opacity:.7;font-size:12px;margin:4px 0 10px}' +
    '.rp-x{position:absolute;right:12px;top:12px;border:0;background:#ffd60a;border-radius:50%;width:28px;height:28px;font-weight:900;cursor:pointer}.rp-t{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rp-t h3{margin:4px 0;font-size:15px}.rp-t h3 span{color:#ffd60a;font-size:18px}.rp-h{display:flex;gap:6px;justify-content:center;min-height:96px}' +
    '.rp-c{width:58px;height:84px;border-radius:7px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font:900 22px Georgia,serif;box-shadow:0 3px 8px rgba(0,0,0,.5);animation:rpin .35s ease-out}.rp-c.red{color:#c62828}.rp-c i{font-style:normal;font-size:24px}@keyframes rpin{from{transform:translateY(-40px) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}' +
    '.rp-res{font:900 22px "Microsoft YaHei",Arial;color:#ffd60a;min-height:30px;margin:8px 0}.rp-bets{font-size:12px;opacity:.8}.rp-again{border:0;background:#16a34a;color:#fff;border-radius:9px;padding:6px 14px;font:800 12px "Microsoft YaHei",Arial;cursor:pointer}';
  document.head.appendChild(st);
  window.LVReplay = { play };
})();
