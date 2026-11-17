// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 新手任务 New-player journey card in the lobby: five first steps with coin rewards (server-tracked), then hides itself.
(function () {
  let data = null;
  const GO = { slots: () => { const g = GAMES.find(x => x && x.slot && vis(x)); if (g) openGame(g.id); }, baccarat: () => openGame(77), tables: () => openGame(70), shared: () => openGame(318) };
  let asked = null;
  function paint() {
    if (!data && (typeof API !== 'undefined' && API) && API.user && asked !== API.user.id) { asked = API.user.id; refresh(); return; }
    let el = document.getElementById('onbCard'); const lobby = document.getElementById('heros');
    if (!data || data.finished || data.hidden || !lobby || lobby.style.display === 'none') { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'onbCard'; lobby.insertAdjacentElement('afterend', el); }
    const done = data.steps.filter(s => s.done).length, next = data.steps.find(s => !s.done);
    el.innerHTML = '<div class="ob-h"><b>🎁 新手任务 New player journey</b><span>' + done + '/' + data.steps.length + ' · 全部完成再送 ' + data.bonus.toLocaleString() + ' 金币</span><button class="ob-x" title="隐藏 Hide">✕</button></div>' +
      '<div class="ob-bar"><i style="width:' + (done / data.steps.length * 100) + '%"></i></div><div class="ob-steps">' +
      data.steps.map(s => '<div class="ob-s' + (s.done ? ' done' : s === next ? ' now' : '') + '"><span>' + (s.done ? '✔' : '○') + '</span><em>' + s.title + '</em><b>+' + s.reward + '</b>' + (s === next ? '<button data-go="' + s.go + '">去完成 GO</button>' : '') + '</div>').join('') + '</div>';
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => (GO[b.dataset.go] || (() => {}))());
    el.querySelector('.ob-x').onclick = async () => { el.remove(); data.hidden = true; try { await API.call('/api/onboarding/hide', {}); } catch (e) {} };
  }
  async function refresh() { if (!(typeof API !== 'undefined' && API) || API.mode !== 'server' || !API.user) { data = null; paint(); return; } try { const r = await API.call('/api/onboarding'); if (r && r.steps) data = r; } catch (e) {} paint(); }
  const st = document.createElement('style'); st.textContent =
    '#onbCard{margin:10px auto;max-width:1100px;background:linear-gradient(135deg,rgba(124,58,237,.35),rgba(14,116,144,.3));border:1px solid rgba(255,214,10,.45);border-radius:16px;padding:10px 14px;color:#fff;font:13px "Microsoft YaHei",Arial,sans-serif}' +
    '.ob-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ob-h b{font-size:15px;color:#ffd60a}.ob-h span{opacity:.8;font-size:12px}.ob-x{margin-left:auto;border:0;background:transparent;color:#ccd;cursor:pointer;font-size:14px}' +
    '.ob-bar{height:6px;background:rgba(255,255,255,.15);border-radius:4px;margin:8px 0}.ob-bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd60a,#f97316);border-radius:4px}' +
    '.ob-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px}.ob-s{display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.3);border-radius:10px;padding:6px 8px;flex-wrap:wrap}.ob-s em{font-style:normal;flex:1;font-size:12px}.ob-s b{color:#ffd60a;font-size:12px}' +
    '.ob-s.done{opacity:.55}.ob-s.done span{color:#4ade80}.ob-s.now{outline:1px solid #ffd60a}.ob-s button{border:0;background:#16a34a;color:#fff;border-radius:8px;padding:3px 10px;font:800 11px "Microsoft YaHei",Arial;cursor:pointer}';
  document.head.appendChild(st);
  // 活动 banner: an admin-run event (double XP / bigger free bonus) shown at the top of the lobby
  async function eventBanner() { let ev = null; try { const r = await fetch((API.base || '') + '/api/ping', { cache: 'no-store' }).then(r => r.json()); ev = r.event; } catch (e) {}
    let el = document.getElementById('evBan'); if (!ev) { if (el) el.remove(); return; } const lobby = document.getElementById('heros'); if (!lobby) return;
    if (!el) { el = document.createElement('div'); el.id = 'evBan'; lobby.insertAdjacentElement('beforebegin', el); }
    const parts = []; if (ev.xp > 1) parts.push('经验 ×' + ev.xp + ' XP'); if (ev.bonus > 1) parts.push('免费奖励 ×' + ev.bonus + ' bonus');
    el.innerHTML = '🎉 <b>' + String(ev.label).replace(/[<>&]/g, '') + '</b> · ' + parts.join(' · ') + (ev.end ? ' · 截止 ends ' + new Date(ev.end).toLocaleString() : ''); }
  st.textContent += '#evBan{margin:8px auto 0;max-width:1100px;text-align:center;padding:7px 12px;border-radius:12px;background:linear-gradient(90deg,#b45309,#db2777,#7c3aed);color:#fff;font:800 13px "Microsoft YaHei",Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35)}#evBan b{color:#ffd60a}';
  setTimeout(eventBanner, 2000); setInterval(eventBanner, 120000);
  window.LVOnb = { refresh, paint };
  const hook = () => { if (typeof window.renderLobby !== 'function' || window.renderLobby._onb) return false; const o = window.renderLobby; window.renderLobby = function () { const r = o.apply(this, arguments); setTimeout(paint, 0); return r; }; window.renderLobby._onb = true; return true; };
  const t = setInterval(() => { if (hook()) { clearInterval(t); setTimeout(refresh, 1500); } }, 300);
  window.addEventListener('focus', () => setTimeout(refresh, 300));
})();
