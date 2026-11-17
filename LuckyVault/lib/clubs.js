// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 俱乐部 Clubs: players form clubs (up to 50 members); every coin a member wins counts for the club's weekly ranking.
'use strict';
const MAX = 50;
function install({ R, userRoute, repo, now, limited, weekKey }) {
  const list = async () => (await repo().kvGet('clubs', {})) || {};
  const pub = c => ({ id: c.id, name: c.name, owner: c.ownerName, members: c.members.length, open: c.open !== false, created: c.created });
  async function weekly() { const rows = await repo().d.all('SELECT uid,score,name FROM scores WHERE board=? ORDER BY score DESC LIMIT 20', ['w:' + weekKey() + ':club']); return rows.map(r => ({ id: +r.uid, name: r.name, won: +r.score })); }
  R['GET /api/clubs'] = userRoute(async ({ uid, q }) => {
    const C = await list(); const me = await repo().userById(uid); const mine = me.club && C[me.club] ? C[me.club] : null; const qq = String(q.get('q') || '').toLowerCase();
    const found = Object.values(C).filter(c => !qq || c.name.toLowerCase().includes(qq)).sort((a, b) => b.members.length - a.members.length).slice(0, 30).map(pub);
    let members = null; if (mine) { members = []; for (const id of mine.members) { const u = await repo().userById(id); if (u) members.push({ id, name: u.name, level: u.level || 1, owner: id === mine.owner, online: now() - (u.last || 0) < 5 * 60e3 }); } }
    return [200, { mine: mine ? pub(mine) : null, members, clubs: found, ranking: await weekly(), max: MAX }];
  });
  R['POST /api/clubs'] = userRoute(async ({ uid, b }) => {
    if (limited('club:' + uid, 10, 600e3)) return [429, { err: 'rate', msg: 'Slow down a little' }];
    let out = [200, { ok: true }];
    await repo().tx(async t => {
      const C = await repo().kvGet('clubs', {}, t) || {}; const me = await repo().userById(uid, t, true);
      if (b.a === 'create') { const name = String(b.name || '').replace(/[<>&"']/g, '').trim().slice(0, 20);
        if (name.length < 2) { out = [400, { err: 'name', msg: '俱乐部名称 2-20 个字 · Name 2-20 characters' }]; return; }
        if (me.club && C[me.club]) { out = [400, { err: 'in', msg: '请先退出当前俱乐部 · Leave your club first' }]; return; }
        if (Object.values(C).some(c => c.name.toLowerCase() === name.toLowerCase())) { out = [400, { err: 'dup', msg: '名称已被使用 · Name taken' }]; return; }
        const id = await repo().next('club', 100, t); C[id] = { id, name, owner: uid, ownerName: me.name, members: [uid], created: now(), open: true }; me.club = id;
      } else if (b.a === 'join') { const c = C[+b.id]; if (!c) { out = [404, { err: 'nf', msg: 'Club not found' }]; return; }
        if (me.club && C[me.club]) { out = [400, { err: 'in', msg: '请先退出当前俱乐部 · Leave your club first' }]; return; }
        if (c.members.length >= MAX) { out = [400, { err: 'full', msg: '俱乐部已满 · Club is full' }]; return; }
        c.members.push(uid); me.club = c.id;
      } else if (b.a === 'leave') { const c = C[me.club]; if (c) { c.members = c.members.filter(x => x !== uid); if (!c.members.length) delete C[c.id]; else if (c.owner === uid) { c.owner = c.members[0]; const o = await repo().userById(c.owner, t); c.ownerName = o ? o.name : '?'; } } delete me.club;
      } else if (b.a === 'kick') { const c = C[me.club]; const id = +b.id; if (!c || c.owner !== uid || id === uid) { out = [403, { err: 'perm', msg: '只有会长可以移除成员 · Only the owner can remove members' }]; return; }
        c.members = c.members.filter(x => x !== id); const o = await repo().userById(id, t, true); if (o && o.club === c.id) { delete o.club; await repo().saveUser(o, t); }
      } else { out = [400, { err: 'bad' }]; return; }
      await repo().kvSet('clubs', C, t); await repo().saveUser(me, t);
    });
    return out;
  });
}
module.exports = { install };
