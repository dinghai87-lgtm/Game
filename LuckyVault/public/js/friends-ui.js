// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 好友 Friends panel: add by name, online status, one free gift per friend per day, collect gifts, jump to a shared table together.
(function () {
  const FT = (zh, en) => { const L = (window.LVLang && LVLang.get()) || 'bi'; return L === 'zh' ? zh : L === 'en' ? en : zh + ' ' + en; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  async function open() {
    if (!(typeof API !== 'undefined' && API) || !API.user) { if (typeof openAuth === 'function') openAuth(); return; }
    let o = document.getElementById('frOv'); if (!o) { o = document.createElement('div'); o.id = 'frOv'; document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.closest('.fr-close')) o.classList.remove('show'); }; }
    o.classList.add('show'); o.innerHTML = '<div class="fr-box"><button class="fr-close">✕</button><h2>👥 ' + FT('好友', 'Friends') + '</h2><p class="fr-l">' + FT('加载中…', 'Loading…') + '</p></div>';
    const r = await API.call('/api/friends'); if (!r || r.err) { o.querySelector('.fr-l').textContent = (r && r.msg) || 'Error'; return; }
    const box = o.querySelector('.fr-box');
    box.innerHTML = '<button class="fr-close">✕</button><h2>👥 ' + FT('好友', 'Friends') + ' <button class="fr-tab" id="frClubs">🏅 ' + FT('俱乐部', 'Clubs') + '</button></h2>' +
      '<div class="fr-add"><input id="frName" placeholder="' + FT('输入玩家名字', 'Player name') + '" maxlength="24"><button id="frAddB">' + FT('加好友', 'Add') + '</button></div>' +
      '<div class="fr-inbox"><span>🎁 ' + FT('礼物', 'Gifts') + ': <b>' + r.inbox + '</b> · ' + FT('今天已领 ', 'today ') + r.collectedToday + '/' + r.cap + '</span><button id="frCol"' + (r.inbox ? '' : ' disabled') + '>' + FT('领取', 'Collect') + '</button></div>' +
      '<p class="fr-tip">' + FT('每天可以给每位好友送一次 ' + r.gift + ' 金币（不扣你的金币）。', 'Send each friend ' + r.gift + ' free coins a day — it costs you nothing.') + '</p>' +
      (r.friends.length ? '<div class="fr-list">' + r.friends.map(f => '<div class="fr-row"><i class="' + (f.online ? 'on' : '') + '"></i><b>' + esc(f.name) + '</b><small>Lv ' + f.level + (f.online ? ' · 在线 online' : '') + '</small>' +
        '<button data-g="' + f.id + '"' + (f.sent ? ' disabled' : '') + '>' + (f.sent ? FT('已送', 'Sent') : '🎁 ' + FT('送', 'Gift')) + '</button><button class="fr-rm" data-r="' + f.id + '" title="' + FT('删除', 'Remove') + '">✕</button></div>').join('') + '</div>' : '<p class="fr-empty">' + FT('还没有好友。输入名字添加，或者在多人桌认识新朋友！', 'No friends yet. Add someone by name or meet players at a shared table!') + '</p>') +
      '<h3 style="color:#ffd60a;font-size:14px;margin:12px 0 6px">🔒 ' + FT('私人房', 'Private table') + '</h3><div class="fr-add"><input id="frRoom" placeholder="' + FT('输入朋友给的房间号', 'Room code from a friend') + '" maxlength="8"><button id="frJoin">' + FT('加入', 'Join') + '</button><button id="frNew">' + FT('开新房', 'New room') + '</button></div>' + '<p class="fr-tip">' + FT('开一张私人多人百家乐桌，把房间号发给好友，只有知道房间号的人能进。也可以在任意多人桌上点「🔒 开私人房」。', 'Open a private shared baccarat table and send the room code to friends — only people with the code can join. You can also tap 🔒 on any shared table.') + '<a href="#" id="frGo">' + FT('去公共多人百家乐 →', 'Go to the public shared table →') + '</a></p>';
    box.querySelector('#frClubs').onclick = () => clubs();
    const add = async () => { const n = box.querySelector('#frName').value.trim(); if (!n) return; const x = await API.call('/api/friends/add', { name: n }); if (x && x.err) toast(x.msg || x.err); else { toast(FT('已加好友', 'Friend added')); open(); } };
    box.querySelector('#frAddB').onclick = add; box.querySelector('#frName').onkeydown = e => { if (e.key === 'Enter') add(); };
    box.querySelector('#frCol').onclick = async () => { const x = await API.call('/api/friends/collect', {}); if (x && x.err) toast(x.msg || x.err); else { S.bal = x.bal; if (typeof setBal === 'function') setBal(); toast('+' + x.amount + ' ' + FT('金币', 'coins')); try { sfx.coins(); } catch (e) {} open(); } };
    box.querySelectorAll('[data-g]').forEach(b => b.onclick = async () => { b.disabled = true; const x = await API.call('/api/friends/gift', { id: +b.dataset.g }); if (x && x.err) toast(x.msg || x.err); else { b.textContent = FT('已送', 'Sent'); toast(FT('礼物已送出', 'Gift sent')); } });
    box.querySelectorAll('[data-r]').forEach(b => b.onclick = async () => { if (!confirm(FT('删除这位好友？', 'Remove this friend?'))) return; await API.call('/api/friends/remove', { id: +b.dataset.r }); open(); });
    box.querySelector('#frJoin').onclick = () => { const c = box.querySelector('#frRoom').value; if (!c) return; o.classList.remove('show'); LVPriv.join(c); };
    box.querySelector('#frNew').onclick = async () => { const r = await API.call('/api/live/private', { gid: 318 }); if (r && r.code) { o.classList.remove('show'); LVPriv.enter(318, r.code); toast('私人房 ' + r.code + ' — 把房间号发给朋友'); } else if (r) toast(r.msg || r.err); };
    box.querySelector('#frGo').onclick = e => { e.preventDefault(); o.classList.remove('show'); openGame(318); };
  }
  // 俱乐部 Clubs
  async function clubs(q) {
    const o = document.getElementById('frOv'); const box = o.querySelector('.fr-box'); const r = await API.call('/api/clubs' + (q ? '?q=' + encodeURIComponent(q) : '')); if (!r || r.err) return;
    const act = async (body, okMsg) => { const x = await API.call('/api/clubs', body); if (x && x.err) toast(x.msg || x.err); else { if (okMsg) toast(okMsg); clubs(); } };
    box.innerHTML = '<button class="fr-close">✕</button><h2>🏅 ' + FT('俱乐部', 'Clubs') + ' <button class="fr-tab" id="frBack">👥 ' + FT('好友', 'Friends') + '</button></h2>' +
      (r.mine ? '<div class="fr-inbox"><span>我的俱乐部 <b>' + esc(r.mine.name) + '</b> · ' + r.mine.members + '/' + r.max + ' 人 · 会长 ' + esc(r.mine.owner) + '</span><button id="clLeave" style="background:#7f1d1d">' + FT('退出', 'Leave') + '</button></div>' +
        '<div class="fr-list">' + r.members.map(m => '<div class="fr-row"><i class="' + (m.online ? 'on' : '') + '"></i><b>' + esc(m.name) + '</b><small>Lv ' + m.level + (m.owner ? ' · 👑 会长' : '') + '</small>' + (r.mine.owner === (API.user && API.user.name) && !m.owner ? '<button class="fr-rm" data-k="' + m.id + '">移除</button>' : '') + '</div>').join('') + '</div>'
        : '<div class="fr-add"><input id="clName" placeholder="' + FT('新俱乐部名称', 'New club name') + '" maxlength="20"><button id="clNew">' + FT('创建', 'Create') + '</button></div><div class="fr-add" style="margin-top:6px"><input id="clQ" placeholder="' + FT('搜索俱乐部', 'Search clubs') + '" value="' + esc(q || '') + '"><button id="clFind">搜索</button></div>' +
          '<div class="fr-list">' + (r.clubs.length ? r.clubs.map(c => '<div class="fr-row"><b>' + esc(c.name) + '</b><small>' + c.members + '/' + r.max + ' · ' + FT('会长 ', 'owner ') + esc(c.owner) + '</small><button data-j="' + c.id + '"' + (c.members >= r.max ? ' disabled' : '') + '>' + FT('加入', 'Join') + '</button></div>').join('') : '<p class="fr-empty">还没有俱乐部，创建第一个吧！</p>') + '</div>') +
      '<h3 style="color:#ffd60a;font-size:14px;margin:14px 0 6px">' + FT('本周俱乐部排行', 'Weekly club ranking') + '</h3><p class="fr-tip">' + FT('成员本周赢得的金币都计入俱乐部', 'Every coin members win this week counts.') + '</p>' +
      (r.ranking.length ? '<div class="fr-list">' + r.ranking.map((c, i) => '<div class="fr-row"><b style="width:26px">' + (['🥇', '🥈', '🥉'][i] || '#' + (i + 1)) + '</b><b>' + esc(c.name) + '</b><small></small><b style="color:#ffd60a">' + Math.round(c.won).toLocaleString() + '</b></div>').join('') + '</div>' : '<p class="fr-empty">' + FT('本周还没有成绩', 'No scores yet this week') + '</p>');
    box.querySelector('#frBack').onclick = () => open();
    const q1 = box.querySelector('#clNew'); if (q1) q1.onclick = () => act({ a: 'create', name: box.querySelector('#clName').value }, FT('俱乐部已创建', 'Club created'));
    const q2 = box.querySelector('#clFind'); if (q2) q2.onclick = () => clubs(box.querySelector('#clQ').value);
    const q3 = box.querySelector('#clLeave'); if (q3) q3.onclick = () => { if (confirm('退出俱乐部？Leave the club?')) act({ a: 'leave' }, '已退出 · Left'); };
    box.querySelectorAll('[data-j]').forEach(b => b.onclick = () => act({ a: 'join', id: +b.dataset.j }, '已加入 · Joined'));
    box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => act({ a: 'kick', id: +b.dataset.k }));
  }
  const st = document.createElement('style'); st.textContent = '#frOv{position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:14px}#frOv.show{display:flex}' +
    '.fr-box{position:relative;max-width:520px;width:100%;max-height:86vh;overflow:auto;background:linear-gradient(#152035,#0b1220);border:2px solid #ffd60a;border-radius:16px;padding:18px;color:#eee;font:14px "Microsoft YaHei",Arial,sans-serif}.fr-box h2{margin:0 0 10px;color:#ffd60a}' +
    '.fr-tab{margin-left:8px;background:#1f2a40!important;border:1px solid #ffd60a!important;color:#ffd60a!important;font-size:11px!important;padding:3px 8px!important;vertical-align:middle}.fr-close{position:absolute;right:12px;top:12px;border:0;background:#ffd60a;border-radius:50%;width:28px;height:28px;font-weight:900;cursor:pointer}.fr-add{display:flex;gap:6px}.fr-add input{flex:1;padding:8px 10px;border-radius:10px;border:1px solid #445;background:#0d1524;color:#fff}' +
    '.fr-box button{border:0;background:#16a34a;color:#fff;border-radius:9px;padding:6px 12px;font:800 12px "Microsoft YaHei",Arial;cursor:pointer}.fr-box button:disabled{background:#3a4152;color:#99a;cursor:default}' +
    '.fr-inbox{display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px;background:rgba(255,214,10,.1);border-radius:10px;padding:8px 10px}.fr-inbox b{color:#ffd60a}.fr-tip{font-size:12px;opacity:.7;margin:6px 0}.fr-tip a{color:#ffd60a}' +
    '.fr-row{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,.07)}.fr-row i{width:9px;height:9px;border-radius:50%;background:#555}.fr-row i.on{background:#22c55e;box-shadow:0 0 6px #22c55e}.fr-row b{flex:0 1 auto}.fr-row small{flex:1;opacity:.6}.fr-box .fr-rm{background:transparent;color:#99a;padding:4px}.fr-empty{opacity:.7;text-align:center;margin:14px 0}';
  document.head.appendChild(st);
  window.LVFriends = { open, clubs };
  const t = setInterval(() => { const q = document.getElementById('questBtn'); if (!q) return; clearInterval(t); const b = document.createElement('button'); b.className = 'ib emo'; b.id = 'friendBtn'; b.title = '好友 Friends'; b.setAttribute('aria-label', 'Friends'); b.textContent = '👥'; b.style.display = q.style.display; b.onclick = open; q.insertAdjacentElement('afterend', b);
    new MutationObserver(() => { b.style.display = q.style.display; }).observe(q, { attributes: true, attributeFilter: ['style'] }); }, 300);
})();
