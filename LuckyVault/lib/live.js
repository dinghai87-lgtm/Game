// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// Shared multiplayer baccarat rooms (多人百家乐). Everyone in a room plays the same hand from the same 8-deck shoe:
//   bet phase (countdown) -> deal -> result -> next bet phase.  Pushed to browsers with Server-Sent Events.
// Bets are taken from the balance when they are placed; each bettor is paid at the deal, then the round is
// recorded exactly like a solo table round (stats, XP, missions, round history).
// State lives in this process (one server instance); the shoe and its scoreboard are saved after every hand.
'use strict';
const BET_MS = 15000, DEAL_MS = 6500, RESULT_MS = 4500, IDLE_AFTER = 60000;

function install(ctx) {
  const { R, userRoute, repo, TE, now, r2, afterRound, GAMES, limits, session, limited } = ctx;
  const rooms = new Map();
  // shared game kinds: base engine kind, whether it deals from a shoe, how one outcome is drawn, and its view for the browser
  const KINDS = {
    mbacc: { base: 'baccarat', v: 'std', shoe: true, squeeze: true, draw: room => { const g = TE.baccaratDeal(room.shoe); return { g, view: { P: TE.cardCodes(g.P), B: TE.cardCodes(g.B), pt: g.pt, bt: g.bt, win: g.win } }; },
      settle: (b, o) => TE.K.baccarat.settle(TE.K.baccarat.cfg('std'), b, o.g) },
    mdt: { base: 'dragontiger', v: '', shoe: true, draw: room => { const D = TE.cardCode(TE.shoeDraw(room.shoe)), T = TE.cardCode(TE.shoeDraw(room.shoe)); const r = TE.K.dragontiger.deal({}, {}, { force: { D, T } }); return { f: { D, T }, view: r.state }; },
      settle: (b, o) => { const r = TE.K.dragontiger.deal({}, b, { force: o.f }); return { wins: r.state.wins, win: r.win }; } },
    msicbo: { base: 'sicbo', v: '', draw: () => { const dice = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6)); const r = TE.K.sicbo.deal({}, {}, { force: { dice } }); return { f: { dice }, view: r.state }; },
      settle: (b, o) => { const r = TE.K.sicbo.deal({}, b, { force: o.f }); return { wins: r.state.wins, win: r.win }; } },
    mroul: { base: 'roulette', v: 'eu', draw: () => { const n = Math.floor(Math.random() * 37); const c = TE.K.roulette.cfg('eu'); const r = TE.K.roulette.deal(c, {}, { force: { n } }); return { f: { n }, view: TE.K.roulette.view(c, r.state) }; },
      settle: (b, o) => { const c = TE.K.roulette.cfg('eu'); const r = TE.K.roulette.deal(c, b, { force: o.f }); return { wins: r.state.wins, win: r.win }; } }
  };
  const SQ_MS = 20000;
  // public rooms are keyed by game id; private rooms (私人房) by game id + a 6-letter code and must have been created first
  const PRIV = new Map();   // key -> { owner, ownerName, created }
  const roomOf = (gid, code) => { const g = GAMES[gid]; if (!g || !KINDS[g.kind]) return null; code = code ? String(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) : ''; const key = code ? gid + ':' + code : String(gid);
    if (code && !PRIV.has(key)) return null; let r = rooms.get(key); if (!r) { r = { key, code, priv: code ? PRIV.get(key) : null, gid, g, K: KINDS[g.kind], sq: null, opened: false, phase: 'idle', ends: 0, round: 0, shoe: null, bets: new Map(), subs: new Set(), feed: [], last: null, results: new Map(), timer: null, lastSeen: now() }; rooms.set(key, r); } return r; };
  const shoeKey = k => 'shoe:room:' + k;

  // ---- push ----
  function totals(room) { const t = {}; let n = 0; room.bets.forEach(e => { n++; for (const k in e.b) t[k] = r2((t[k] || 0) + e.b[k]); }); return { t, n }; }
  function snapshot(room, uid) {
    const { t, n } = totals(room); const mine = room.bets.get(uid); const res = room.results.get(uid);
    return { gid: room.gid, code: room.code || null, host: room.priv ? room.priv.ownerName : null, phase: room.phase, ends: room.ends, now: now(), round: room.round, online: room.subs.size, players: n, totals: t, feed: room.feed.slice(-10),
      kind: room.g.kind, sq: room.sq, opened: room.opened, road: room.K.shoe ? null : (room.hist || []).slice(-60),
      shoe: room.shoe ? Object.assign(TE.shoeInfo(room.shoe), { live: true }) : null,
      hand: room.phase === 'deal' || room.phase === 'result' ? room.last : null,
      mine: mine ? mine.b : null, me: res || null };
  }
  function push(room, type, dataFor) { for (const s of room.subs) { try { s.res.write('event: ' + type + '\ndata: ' + JSON.stringify(dataFor(s)) + '\n\n'); } catch (e) {} } }
  const pushState = room => push(room, 'state', s => snapshot(room, s.uid));
  // bets arrive in bursts; coalesce their state pushes to one every 250 ms per room so big rooms don't send N² messages
  const pushStateSoon = room => { if (room._ps) return; room._ps = setTimeout(() => { room._ps = null; pushState(room); }, 250); };

  // ---- round loop (runs only while somebody is watching or has a bet down) ----
  async function loadShoe(room) { if (room.shoe || !room.K.shoe) return; let sh = await repo().kvGet(shoeKey(room.key), null); if (!sh || sh.end) sh = TE.newShoe((sh ? sh.no : 0) + 1); room.shoe = sh; }
  function schedule(room, ms, fn) { clearTimeout(room.timer); room.timer = setTimeout(() => fn().catch(e => { console.error('live', e); startBet(room).catch(() => {}); }), ms); }
  async function startBet(room) {
    if (!room.subs.size && !room.bets.size && now() - room.lastSeen > IDLE_AFTER) { room.phase = 'idle'; clearTimeout(room.timer); return; }
    await loadShoe(room); if (room.shoe && room.shoe.end) { room.shoe = TE.newShoe(room.shoe.no + 1); await repo().kvSet(shoeKey(room.key), room.shoe); }
    room.phase = 'bet'; room.round++; room.ends = now() + BET_MS; room.bets.clear(); room.results.clear(); room.last = null; room.feed = []; room.sq = null; room.opened = false;
    pushState(room); schedule(room, BET_MS, () => deal(room));
  }
  async function deal(room) {
    room.phase = 'deal'; const o = room.K.draw(room); const hand = o.view;
    if (room.K.shoe) { room.shoe.road.push(TE.roadEntry(room.K.base, hand)); await repo().kvSet(shoeKey(room.key), room.shoe); }
    else { room.hist = (room.hist || []).concat([room.K.base === 'roulette' ? hand.n : hand.total + (hand.triple ? 'T' : '') + ':' + hand.dice.join('')]).slice(-100); }
    room.last = hand;
    for (const [uid, e] of room.bets) {   // pay every bettor
      const { wins, win } = room.K.settle(e.b, o);
      try {
        await repo().withUser(uid, async (u, t) => {
          if (!u) return { skip: true };
          u.bal = r2(u.bal + win); const r = { cost: e.total, win, bet: e.total, wins };
          await afterRound(u, room.g, r, {}, t);
          await repo().roundInsert({ t: now(), uid, name: u.name, gid: room.gid, bet: e.total, cost: e.total, win, table: true, bal: u.bal }, t);
          room.results.set(uid, { wins, win, bal: u.bal, lvl: r.lvl || null, xp: u.xp, bet: e.total });
        });
      } catch (err) { console.error('live settle', uid, err); }
    }
    // 咪牌: the player with the biggest Player/Banker bet squeezes for the table; everyone else waits until the cards are opened
    let top = null; if (room.K.squeeze) room.bets.forEach((e, uid) => { const v = Math.max(e.b.player || 0, e.b.banker || 0); if (v > 0 && (!top || v > top.v)) top = { uid, v, name: e.name, side: (e.b.banker || 0) > (e.b.player || 0) ? 'B' : 'P' }; });
    room.sq = top ? { uid: top.uid, name: top.name, side: top.side, until: now() + SQ_MS } : null; room.opened = !top;
    room.ends = now() + (top ? SQ_MS : DEAL_MS);
    pushState(room); schedule(room, top ? SQ_MS : DEAL_MS, () => opened(room));
  }
  // cards are open (squeezer finished, or no squeezer): give everybody's reveal animation time, then show the result
  async function opened(room) { if (room.phase !== 'deal') return; if (room.sq && !room.opened) { room.opened = true; room.ends = now() + DEAL_MS; pushState(room); schedule(room, DEAL_MS, () => opened(room)); return; }
    room.phase = 'result'; room.ends = now() + RESULT_MS; pushState(room); schedule(room, RESULT_MS, () => startBet(room)); }
  function wake(room) { room.lastSeen = now(); if (room.phase === 'idle') startBet(room).catch(e => console.error('live', e)); }

  // ---- HTTP ----
  // EventSource cannot send headers, so the session token comes in the query string (same token as the API)
  async function stream(req, res, q) {
    const room = roomOf(+q.get('gid'), q.get('room')); if (!room) { res.writeHead(404); return res.end(); }
    const s = await session(String(q.get('t') || '')); if (!s) { res.writeHead(401); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const sub = { uid: Number(s.uid), res }; room.subs.add(sub); wake(room);
    res.write('retry: 3000\n\n'); res.write('event: state\ndata: ' + JSON.stringify(snapshot(room, sub.uid)) + '\n\n');
    push(room, 'online', () => ({ online: room.subs.size }));
    const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch (e) {} }, 20000);
    req.on('close', () => { clearInterval(ka); room.subs.delete(sub); room.lastSeen = now(); push(room, 'online', () => ({ online: room.subs.size })); });
  }
  R['POST /api/live/bet'] = userRoute(async ({ uid, b }) => {
    const room = roomOf(+b.gid, b.room); if (!room) return [400, { err: 'game', msg: 'Room unavailable' }];
    if (limited('live:' + uid, 12, 1000)) return [429, { err: 'rate', msg: 'Slow down a little' }];
    if (room.phase !== 'bet' || now() > room.ends - 400) return [400, { err: 'closed', msg: '停止下注 · Betting closed for this hand' }];
    const add = {}; for (const k in (b.bets || {})) { const v = r2(+b.bets[k]); if (!TE.K[room.K.base].keys(k) || !(v > 0) || !isFinite(v)) return [400, { err: 'bad_bet', msg: 'Bad bet' }]; add[k] = v; }
    if (!Object.keys(add).length) return [400, { err: 'bad_bet', msg: 'Place a bet first' }];
    const prev = room.bets.get(uid); const merged = Object.assign({}, prev ? prev.b : {}); for (const k in add) merged[k] = r2((merged[k] || 0) + add[k]);
    const BK = TE.K[room.K.base]; const v = BK.validate ? BK.validate(BK.cfg(room.K.v), merged) : null; if (v && v.err) return [400, v];
    const addTotal = r2(Object.values(add).reduce((a, x) => a + x, 0)), total = r2((prev ? prev.total : 0) + addTotal); const lim = limits();
    if (total > lim.max + 1e-9) return [400, { err: 'limits', msg: 'Table limits: ' + lim.min + ' – ' + lim.max }];
    if (total < lim.min - 1e-9) return [400, { err: 'limits', msg: 'Table limits: ' + lim.min + ' – ' + lim.max }];
    let out;
    await repo().withUser(uid, async (u, t) => {
      if (!u || u.banned) { out = [403, { err: 'banned', msg: 'Account suspended' }]; return { skip: true }; }
      { const rb = ctx.rgBlock && ctx.rgBlock(u); if (rb) { out = [403, rb]; return { skip: true }; } }
      if (u.bal < addTotal - 1e-9) { out = [400, { err: 'funds', msg: 'Not enough coins' }]; return { skip: true }; }
      if (room.phase !== 'bet') { out = [400, { err: 'closed', msg: '停止下注 · Betting closed for this hand' }]; return { skip: true }; }
      u.bal = r2(u.bal - addTotal); room.bets.set(uid, { name: u.name, b: merged, total });
      out = [200, { bal: u.bal, mine: merged, total }];
    });
    if (out[0] === 200) { const nm = room.bets.get(uid).name; for (const k in add) room.feed.push({ n: nm, k, a: add[k] }); room.feed = room.feed.slice(-30); room.lastSeen = now(); pushStateSoon(room); }
    return out;
  });
  R['POST /api/live/open'] = userRoute(async ({ uid, b }) => { const room = roomOf(+b.gid, b.room); if (!room || room.phase !== 'deal' || !room.sq || room.sq.uid !== uid || room.opened) return [200, { ok: false }];
    clearTimeout(room.timer); room.opened = true; room.ends = now() + 4000; pushState(room); schedule(room, 4000, () => opened(room)); return [200, { ok: true }]; });
  // quick chat: fixed phrases / emoji only (no free text)
  const SAY = ['庄庄庄！', '闲闲闲！', '好牌！', '咪！咪！', '恭喜！', '再来一局', '👍', '😂', '🔥', '💰', '🐉', '🐯'];
  R['POST /api/live/say'] = userRoute(async ({ uid, b }) => { const room = roomOf(+b.gid, b.room); const i = +b.i; if (!room || !(i >= 0 && i < SAY.length)) return [400, { err: 'bad' }];
    if (limited('say:' + uid, 1, 2500)) return [429, { err: 'rate', msg: '慢一点 · Slow down' }]; const u = await repo().userById(uid); if (!u || u.banned || u.muted) return [403, { err: 'muted' }];
    push(room, 'say', () => ({ n: u.name, i, t: SAY[i] })); return [200, { ok: true }]; });
  R['GET /api/live/rooms'] = async () => [200, { rooms: [...GAMES].filter(g => g && KINDS[g.kind]).map(g => { const r = rooms.get(String(g.id)); return { gid: g.id, name: g.name, online: r ? r.subs.size : 0, phase: r ? r.phase : 'idle' }; }) }];
  // 私人房 private tables: any player opens one for a shared game and shares the code with friends; it closes after 2 h idle
  R['POST /api/live/private'] = userRoute(async ({ uid, b }) => { const gid = +b.gid, g = GAMES[gid]; if (!g || !KINDS[g.kind]) return [400, { err: 'game' }];
    if (limited('priv:' + uid, 5, 600e3)) return [429, { err: 'rate', msg: 'Slow down a little' }];
    const u = await repo().userById(uid); let code; do { code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join(''); } while (PRIV.has(gid + ':' + code));
    PRIV.set(gid + ':' + code, { owner: uid, ownerName: u.name, created: now() }); return [200, { gid, code }]; });
  R['GET /api/live/private'] = async ({ q }) => { const code = String(q.get('code') || '').toUpperCase(); for (const [k, v] of PRIV) if (k.endsWith(':' + code)) { const gid = +k.split(':')[0]; return [200, { gid, code, host: v.ownerName, name: GAMES[gid].name }]; } return [404, { err: 'nf', msg: '房间号不存在或已关闭 · Room not found' }]; };
  setInterval(() => { for (const [k, v] of PRIV) { const r = rooms.get(k); const idle = r ? (r.subs.size === 0 && now() - r.lastSeen > 2 * 3600e3) : now() - v.created > 2 * 3600e3; if (idle && !(r && r.bets.size)) { PRIV.delete(k); if (r) { clearTimeout(r.timer); rooms.delete(k); } } } }, 300e3).unref();
  const KIND_LIST = Object.keys(KINDS);
  const pendingOf = uid => { let s = 0; rooms.forEach(r => { const e = r.bets.get(uid); if (e && r.phase === 'bet') s += e.total; }); return r2(s); };
  return { stream, rooms, pendingOf, KINDS: KIND_LIST };
}
module.exports = { install };
