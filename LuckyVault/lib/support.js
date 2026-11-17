// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 客服中心 Support tickets: players open a ticket (category + message), staff reply in the back office,
// the player gets a notification and sees the whole conversation in the app.
'use strict';
const CATS = { pay: '充值 / 订单 Purchases', account: '账号 / 登录 Account', game: '游戏问题 Game issue', bug: '错误报告 Bug', other: '其他 Other' };
function install({ R, ADMIN, userRoute, repo, now, limited, notify }) {
  let ready = null; const d = () => repo().d;
  const init = () => ready || (ready = d().exec('CREATE TABLE IF NOT EXISTS tickets (id BIGINT PRIMARY KEY, uid BIGINT NOT NULL, t BIGINT NOT NULL, status TEXT NOT NULL, upd BIGINT NOT NULL, data TEXT NOT NULL)').then(() => d().exec('CREATE INDEX IF NOT EXISTS tickets_uid ON tickets(uid)')).catch(e => { ready = null; throw e; }));
  const row = r => Object.assign({ id: +r.id, uid: +r.uid, t: +r.t, status: r.status, upd: +r.upd }, JSON.parse(r.data));
  const clean = (s, n) => String(s || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, n);
  R['POST /api/support'] = userRoute(async ({ uid, b }) => {
    await init(); if (limited('tk:' + uid, 5, 3600e3)) return [429, { err: 'rate', msg: '提交太频繁，请稍后 · Too many tickets, try later' }];
    const text = clean(b.text, 2000); if (text.length < 5) return [400, { err: 'short', msg: '请描述一下问题 · Please describe the problem' }];
    const u = await repo().userById(uid); const cat = CATS[b.cat] ? b.cat : 'other';
    if (b.id) { // the player adds a message to an open ticket
      const r = await d().get('SELECT * FROM tickets WHERE id=? AND uid=?', [+b.id, uid]); if (!r) return [404, { err: 'nf' }]; const tk = row(r);
      tk.msgs.push({ from: 'player', t: now(), text }); await d().run('UPDATE tickets SET status=?,upd=?,data=? WHERE id=?', ['open', now(), JSON.stringify({ name: tk.name, cat: tk.cat, msgs: tk.msgs, ref: tk.ref }), tk.id]); return [200, { ok: true }];
    }
    const id = await repo().next('ticket', 1000); const data = { name: u.name, cat, ref: clean(b.ref, 60), msgs: [{ from: 'player', t: now(), text }] };
    await d().run('INSERT INTO tickets(id,uid,t,status,upd,data) VALUES(?,?,?,?,?,?)', [id, uid, now(), 'open', now(), JSON.stringify(data)]);
    return [200, { ok: true, id }];
  });
  R['GET /api/support'] = userRoute(async ({ uid }) => { await init(); const rows = await d().all('SELECT * FROM tickets WHERE uid=? ORDER BY upd DESC LIMIT 30', [uid]); return [200, { tickets: rows.map(row), cats: CATS }]; });
  ADMIN['GET /api/admin/tickets'] = async ({ q }) => { await init(); const st = q.get('status'); const rows = st ? await d().all('SELECT * FROM tickets WHERE status=? ORDER BY upd DESC LIMIT 300', [st]) : await d().all('SELECT * FROM tickets ORDER BY upd DESC LIMIT 300');
    const open = await d().get("SELECT COUNT(*) AS n FROM tickets WHERE status='open'"); return [200, { tickets: rows.map(row), open: +open.n, cats: CATS }]; };
  ADMIN['POST /api/admin/tickets/reply'] = async ({ b, admin }) => { await init();
    const r = await d().get('SELECT * FROM tickets WHERE id=?', [+b.id]); if (!r) return [404, { err: 'nf' }]; const tk = row(r); const text = clean(b.text, 2000);
    if (text) tk.msgs.push({ from: 'staff', by: admin.user, t: now(), text }); const status = ['open', 'answered', 'closed'].includes(b.status) ? b.status : (text ? 'answered' : tk.status);
    await d().run('UPDATE tickets SET status=?,upd=?,data=? WHERE id=?', [status, now(), JSON.stringify({ name: tk.name, cat: tk.cat, msgs: tk.msgs, ref: tk.ref }), tk.id]);
    if (text) { await repo().noteAdd(tk.uid, '客服回复 Support reply #' + tk.id, text.slice(0, 300)); notify(tk.uid, '客服回复 Support reply', text.slice(0, 120)); }
    return [200, { ok: true }]; };
}
module.exports = { install, CATS };
