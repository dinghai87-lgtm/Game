// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 客服中心 Support: players open a ticket and read staff replies.
(function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  async function open() {
    if (typeof API === 'undefined' || API.mode !== 'server' || !API.user) { toast('请先登录 · Please log in'); return; }
    let o = document.getElementById('spOv'); if (!o) { o = document.createElement('div'); o.id = 'spOv'; document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.closest('.sp-x')) o.classList.remove('show'); }; }
    o.classList.add('show'); o.innerHTML = '<div class="sp-box"><button class="sp-x">✕</button><h2>🎧 客服中心 Support</h2><p>加载中…</p></div>';
    const r = await API.call('/api/support'); if (!r || r.err) return;
    const box = o.querySelector('.sp-box');
    box.innerHTML = '<button class="sp-x">✕</button><h2>🎧 客服中心 Support</h2>' +
      '<div class="sp-new"><select id="spCat">' + Object.entries(r.cats).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select><input id="spRef" placeholder="订单号等（可选）Order ID (optional)" maxlength="60">' +
      '<textarea id="spText" rows="4" maxlength="2000" placeholder="请描述你遇到的问题 · Describe the problem"></textarea><button id="spSend">提交 Send</button></div>' +
      '<h3>我的工单 My tickets</h3>' + (r.tickets.length ? r.tickets.map(t => '<div class="sp-t"><div class="sp-h">#' + t.id + ' · ' + esc(r.cats[t.cat] || t.cat) + ' <span class="st ' + t.status + '">' + ({ open: '处理中 Open', answered: '已回复 Answered', closed: '已关闭 Closed' }[t.status] || t.status) + '</span></div>' +
        t.msgs.map(m => '<p class="' + m.from + '"><b>' + (m.from === 'staff' ? '客服 Support' : '我 Me') + '</b> <small>' + new Date(m.t).toLocaleString() + '</small><br>' + esc(m.text).replace(/\n/g, '<br>') + '</p>').join('') +
        (t.status !== 'closed' ? '<div class="sp-add"><input data-add="' + t.id + '" placeholder="补充说明 Add a message"><button data-addb="' + t.id + '">发送</button></div>' : '') + '</div>').join('') : '<p class="sp-e">还没有工单 · No tickets yet</p>');
    box.querySelector('#spSend').onclick = async () => { const x = await API.call('/api/support', { cat: box.querySelector('#spCat').value, ref: box.querySelector('#spRef').value, text: box.querySelector('#spText').value }); if (x && x.err) toast(x.msg || x.err); else { toast('已提交，客服会尽快回复 · Sent'); open(); } };
    box.querySelectorAll('[data-addb]').forEach(b => b.onclick = async () => { const i = box.querySelector('[data-add="' + b.dataset.addb + '"]'); const x = await API.call('/api/support', { id: +b.dataset.addb, text: i.value }); if (x && x.err) toast(x.msg || x.err); else open(); });
  }
  const st = document.createElement('style'); st.textContent = '#spOv{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:14px}#spOv.show{display:flex}' +
    '.sp-box{position:relative;max-width:560px;width:100%;max-height:88vh;overflow:auto;background:linear-gradient(#111d33,#0a1220);border:2px solid #60a5fa;border-radius:16px;padding:18px;color:#eee;font:14px/1.5 "Microsoft YaHei",Arial,sans-serif}.sp-box h2{margin:0 0 10px;color:#60a5fa}.sp-box h3{font-size:14px;color:#ffd60a;margin:14px 0 6px}' +
    '.sp-x{position:absolute;right:12px;top:12px;border:0;background:#60a5fa;border-radius:50%;width:28px;height:28px;font-weight:900;cursor:pointer}.sp-new{display:grid;gap:6px}.sp-new select,.sp-new input,.sp-new textarea,.sp-add input{padding:8px;border-radius:9px;border:1px solid #345;background:#0d1626;color:#fff;font:13px "Microsoft YaHei",Arial}' +
    '.sp-box button{border:0;background:#2563eb;color:#fff;border-radius:9px;padding:7px 14px;font:800 12px "Microsoft YaHei",Arial;cursor:pointer}.sp-t{background:rgba(255,255,255,.04);border-radius:10px;padding:8px 10px;margin:8px 0}.sp-h{font-weight:800}.st{font-size:11px;border-radius:7px;padding:1px 6px;margin-left:6px;background:#555}.st.open{background:#b45309}.st.answered{background:#16a34a}' +
    '.sp-t p{margin:6px 0;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05)}.sp-t p.staff{background:rgba(34,197,94,.14)}.sp-t small{opacity:.6}.sp-add{display:flex;gap:6px}.sp-add input{flex:1}.sp-e{opacity:.6}';
  document.head.appendChild(st);
  window.LVSupport = { open };
})();
