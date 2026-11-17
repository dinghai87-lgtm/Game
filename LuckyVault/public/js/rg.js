// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 负责任娱乐 Responsible play panel: daily play-time limit and take-a-break (self-exclusion), both enforced by the server.
(function () {
  const has = () => typeof API !== 'undefined' && API.mode === 'server' && API.user;
  async function open() {
    if (!has()) { toast('请先登录 · Please log in'); return; }
    const v = await API.call('/api/rg'); if (!v || v.err) { toast((v && v.msg) || 'Error'); return; }
    let o = document.getElementById('rgOv'); if (!o) { o = document.createElement('div'); o.id = 'rgOv'; document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.closest('.rg-x')) o.classList.remove('show'); }; }
    const L = [0, 30, 60, 120, 240];
    o.innerHTML = '<div class="rg-box"><button class="rg-x">✕</button><h2>🛡️ 负责任娱乐 Responsible play</h2>' +
      '<p>今天已玩 Played today: <b>' + v.todayMin + '</b> 分钟 min' + (v.limit ? ' / 上限 limit ' + v.limit : '') + '</p>' +
      '<h3>每日游戏时间上限 Daily play-time limit</h3><div class="rg-row">' + L.map(m => '<button data-l="' + m + '" class="' + (v.limit === m ? 'on' : '') + '">' + (m ? m + ' 分钟' : '不限 None') + '</button>').join('') + '</div>' +
      (v.pending ? '<p class="rg-n">新上限 ' + (v.pending.limit || '不限') + ' 将于 ' + new Date(v.pending.at).toLocaleString() + ' 生效（放宽限制需要等 24 小时）· Raising a limit takes effect after 24 h.</p>' : '<p class="rg-n">收紧立即生效；放宽需要等 24 小时。Lower limits apply now; higher ones after 24 hours.</p>') +
      '<h3>暂停游戏 Take a break</h3>' + (v.until ? '<p class="rg-on">暂停中，至 ' + new Date(v.until).toLocaleString() + ' · On a break until then. 期间不能下注，不能提前取消。</p>' : '') +
      '<div class="rg-row">' + [1, 7, 30, 90].map(d => '<button data-p="' + d + '" class="warn">' + d + ' 天 days</button>').join('') + '</div>' +
      '<p class="rg-n">暂停期间无法下注，也不能提前取消。金币仅供娱乐，没有现金价值。During a break you cannot place bets and it cannot be cancelled early.</p></div>';
    o.classList.add('show');
    o.querySelectorAll('[data-l]').forEach(b => b.onclick = async () => { const r = await API.call('/api/rg', { limit: +b.dataset.l }); if (r && !r.err) { toast('已更新 · Updated'); open(); } });
    o.querySelectorAll('[data-p]').forEach(b => b.onclick = async () => { if (!confirm('确定暂停 ' + b.dataset.p + ' 天？期间不能下注，也不能提前取消。\nTake a ' + b.dataset.p + '-day break? It cannot be cancelled.')) return; const r = await API.call('/api/rg', { pause: +b.dataset.p }); if (r && !r.err) { toast('已开始暂停 · Break started'); open(); } });
  }
  const st = document.createElement('style'); st.textContent = '#rgOv{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:14px}#rgOv.show{display:flex}' +
    '.rg-box{position:relative;max-width:520px;width:100%;max-height:88vh;overflow:auto;background:linear-gradient(#10261d,#0a1611);border:2px solid #4ade80;border-radius:16px;padding:18px;color:#eee;font:14px/1.5 "Microsoft YaHei",Arial,sans-serif}.rg-box h2{margin:0 0 8px;color:#4ade80}.rg-box h3{margin:14px 0 6px;font-size:14px;color:#ffd60a}' +
    '.rg-x{position:absolute;right:12px;top:12px;border:0;background:#4ade80;border-radius:50%;width:28px;height:28px;font-weight:900;cursor:pointer}.rg-row{display:flex;flex-wrap:wrap;gap:6px}.rg-row button{border:1px solid #3b5;background:#16301f;color:#fff;border-radius:9px;padding:6px 12px;font:800 12px "Microsoft YaHei",Arial;cursor:pointer}.rg-row button.on{background:#16a34a}.rg-row button.warn{border-color:#b45309;background:#3a2108}' +
    '.rg-n{font-size:12px;opacity:.7;margin:6px 0}.rg-on{background:rgba(234,179,8,.15);border:1px solid #eab308;border-radius:8px;padding:6px 8px}';
  document.head.appendChild(st);
  window.LVRG = { open };
  // blocked bets: explain and offer the panel
  const t = setInterval(() => { if (typeof API === 'undefined' || !API.call || API.call._rg) return; const c0 = API.call; API.call = async function (p, b) { const r = await c0.call(API, p, b); if (r && (r.err === 'rg_pause' || r.err === 'rg_limit') && typeof msg === 'function') msg('负责任娱乐 Responsible play', r.msg, [['查看设置 Settings', open], ['关闭 Close', null, true]]); return r; }; API.call._rg = true; clearInterval(t); }, 500);
})();
