// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 好友 Friends: add by player name (mutual), see who is online, send each friend one free coin gift a day.
// Gifts cost the sender nothing (social casino convention); the receiver collects them, capped per day, so gifts cannot move coins between accounts.
'use strict';
const GIFT = 100, MAX_FRIENDS = 100, COLLECT_CAP = 20;
function install({ R, userRoute, repo, now, r2, dayKey, addTx, limited }) {
  const pub = u => ({ id: u.id, name: u.name, level: u.level || 1, online: now() - (u.last || 0) < 5 * 60e3 });
  R['GET /api/friends'] = userRoute(async ({ uid }) => {
    const me = await repo().userById(uid); const day = dayKey(now()); const list = [];
    for (const id of (me.friends || [])) { const f = await repo().userById(id); if (f && !f.deleted) list.push(Object.assign(pub(f), { sent: !!(me.giftSent && me.giftSent[day] && me.giftSent[day].includes(id)) })); }
    list.sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name));
    const got = (me.giftGot && me.giftGot.day === day) ? me.giftGot.n : 0;
    return [200, { friends: list, inbox: (me.gifts || []).length, gift: GIFT, collectedToday: got, cap: COLLECT_CAP }];
  });
  R['POST /api/friends/add'] = userRoute(async ({ uid, b }) => {
    if (limited('fr:' + uid, 10)) return [429, { err: 'rate', msg: 'Slow down a little' }];
    const f = await repo().userByName(String(b.name || '').trim()); if (!f || f.deleted || f.banned) return [404, { err: 'nf', msg: '找不到这个玩家 · Player not found' }];
    if (f.id === uid) return [400, { err: 'self', msg: '不能加自己 · That is you' }];
    let out = [200, { ok: true, friend: pub(f) }];
    await repo().tx(async t => {
      const me = await repo().userById(uid, t, true), o = await repo().userById(f.id, t, true);
      me.friends = me.friends || []; o.friends = o.friends || [];
      if (me.friends.includes(o.id)) { out = [400, { err: 'dup', msg: '已经是好友 · Already friends' }]; return; }
      if (me.friends.length >= MAX_FRIENDS || o.friends.length >= MAX_FRIENDS) { out = [400, { err: 'full', msg: '好友已满 · Friend list full' }]; return; }
      me.friends.push(o.id); if (!o.friends.includes(me.id)) o.friends.push(me.id);
      await repo().saveUser(me, t); await repo().saveUser(o, t); await repo().noteAdd(o.id, '新好友 New friend', me.name + ' 加你为好友 · added you as a friend', t);
    });
    return out;
  });
  R['POST /api/friends/remove'] = userRoute(async ({ uid, b }) => { const id = +b.id;
    await repo().tx(async t => { const me = await repo().userById(uid, t, true); me.friends = (me.friends || []).filter(x => x !== id); await repo().saveUser(me, t);
      const o = await repo().userById(id, t, true); if (o) { o.friends = (o.friends || []).filter(x => x !== uid); await repo().saveUser(o, t); } });
    return [200, { ok: true }]; });
  R['POST /api/friends/gift'] = userRoute(async ({ uid, b }) => {
    const id = +b.id, day = dayKey(now()); let out = [200, { ok: true }];
    await repo().tx(async t => {
      const me = await repo().userById(uid, t, true); if (!(me.friends || []).includes(id)) { out = [400, { err: 'nf', msg: 'Not a friend' }]; return; }
      me.giftSent = me.giftSent && me.giftSent[day] ? { [day]: me.giftSent[day] } : { [day]: [] };
      if (me.giftSent[day].includes(id)) { out = [400, { err: 'dup', msg: '今天已经送过了 · Already sent today' }]; return; }
      const o = await repo().userById(id, t, true); if (!o) { out = [404, { err: 'nf' }]; return; }
      me.giftSent[day].push(id); o.gifts = (o.gifts || []).concat([{ from: me.id, name: me.name, t: now() }]).slice(-50);
      await repo().saveUser(me, t); await repo().saveUser(o, t);
    });
    return out;
  });
  R['POST /api/friends/collect'] = userRoute(async ({ uid }) => {
    let out; await repo().withUser(uid, async (u, t) => {
      const day = dayKey(now()); if (!u.giftGot || u.giftGot.day !== day) u.giftGot = { day, n: 0 };
      const can = Math.max(0, COLLECT_CAP - u.giftGot.n), take = (u.gifts || []).slice(0, can);
      if (!take.length) { out = [400, { err: 'none', msg: (u.gifts || []).length ? '今天领取已达上限 · Daily gift limit reached' : '没有礼物 · No gifts' }]; return { skip: true }; }
      const amt = take.length * GIFT; u.gifts = u.gifts.slice(take.length); u.giftGot.n += take.length; u.bal = r2(u.bal + amt);
      await addTx(u, 'friend_gift', amt, take.map(g => g.name).join(', ').slice(0, 120), t);
      out = [200, { got: take.length, amount: amt, bal: u.bal, left: u.gifts.length }];
    });
    return out;
  });
}
module.exports = { install };
