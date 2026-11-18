'use strict';
// Daily missions, achievements, weekly leaderboards and tournaments. Pure logic + repo calls.
const crypto = require('crypto');
const { dayKey, r2 } = require('./repo.js');

const MISSIONS = [
  { id: 'rounds', title: 'Play 50 rounds', target: 50, reward: 300 },
  { id: 'won', money: true, title: 'Win 500 coins in total', target: 500, reward: 400 },
  { id: 'games', title: 'Play 3 different games', target: 3, reward: 250 },
  { id: 'table', title: 'Play 10 table game rounds', target: 10, reward: 300 },
  { id: 'bonus', title: 'Trigger a bonus feature', target: 1, reward: 500 },
  { id: 'bigwin', title: 'Land a win of 10x your bet', target: 1, reward: 400 },
  { id: 'wager', money: true, title: 'Bet 1,000 coins in total', target: 1000, reward: 350 },
  { id: 'bacc', title: '玩 20 局百家乐 / 龙虎 · Play 20 baccarat or dragon tiger hands', target: 20, reward: 350 },
  { id: 'shared', title: '在多人百家乐桌玩 5 局 · Play 5 hands at a shared baccarat table', target: 5, reward: 400 }
];
const ACH = [
  { id: 'first_win', icon: '🎉', title: 'First win', desc: 'Win any round', reward: 100 },
  { id: 'r100', icon: '🎰', title: 'Getting started', desc: 'Play 100 rounds', reward: 200 },
  { id: 'r1000', icon: '🎲', title: 'Regular', desc: 'Play 1,000 rounds', reward: 1000 },
  { id: 'r10000', icon: '💎', title: 'High roller', desc: 'Play 10,000 rounds', reward: 5000 },
  { id: 'big50', icon: '💰', title: 'Big winner', desc: 'Win 50x your bet in one round', reward: 1000 },
  { id: 'big100', icon: '🤑', title: 'Epic winner', desc: 'Win 100x your bet in one round', reward: 2500 },
  { id: 'g10', icon: '🧭', title: 'Explorer', desc: 'Play 10 different games', reward: 500 },
  { id: 'g50', icon: '🌍', title: 'Globetrotter', desc: 'Play 50 different games', reward: 1500 },
  { id: 'types', icon: '🗂️', title: 'Collector', desc: 'Play every slot type and a table game', reward: 1000 },
  { id: 'fs10', icon: '✨', title: 'Feature hunter', desc: 'Trigger 10 bonus features', reward: 800 },
  { id: 'hold', icon: '🪙', title: 'Coin catcher', desc: 'Trigger Hold & Win', reward: 300 },
  { id: 'grand', icon: '👑', title: 'Grand!', desc: 'Win the Grand jackpot', reward: 5000 },
  { id: 'bj', icon: '🃏', title: 'Natural', desc: 'Get a blackjack', reward: 300 },
  { id: 'royal', icon: '♠️', title: 'Royal', desc: 'Hit a royal flush in video poker', reward: 5000 },
  { id: 'lv5', icon: '⭐', title: 'Level 5', desc: 'Reach level 5', reward: 300 },
  { id: 'lv10', icon: '🌟', title: 'Level 10', desc: 'Reach level 10', reward: 800 },
  { id: 'lv25', icon: '🏆', title: 'Level 25', desc: 'Reach level 25', reward: 2500 },
  { id: 'streak7', icon: '📅', title: 'Loyal', desc: 'Collect the daily reward 7 days in a row', reward: 1500 },
  { id: 'tiger', icon: '🐯', title: '虎啸龙吟 Tiger & Dragon', desc: 'Win a 小老虎 / 大老虎 / 小龙 / 大龙 / 龙7 / 熊猫8 side bet', reward: 800 },
  { id: 'mate', icon: '👥', title: '同桌 Table mates', desc: 'Play a hand at a shared baccarat table', reward: 200 }
];
const SLOT_TYPES = ['tumble', 'cluster', 'lines', 'ways', 'classic3', 'holdwin'];

function pickMissions(uid, day) {
  const h = crypto.createHash('sha256').update(uid + ':' + day).digest(); const ids = MISSIONS.map(m => m.id); const out = [];
  for (let i = 0; out.length < 3; i++) { const id = ids[h[i % h.length] % ids.length]; if (!out.includes(id)) out.push(id); if (i > 60) break; }
  return out.map(id => ({ id, prog: 0, done: false, claimed: false }));
}
function missionsOf(u) {
  const d = dayKey(); if (!u.missions || u.missions.day !== d) u.missions = { day: d, list: pickMissions(u.id, d), games: [] };
  return u.missions;
}
function missionView(u) { const M = missionsOf(u); return M.list.map(m => { const def = MISSIONS.find(x => x.id === m.id); return Object.assign({}, def, m, { prog: Math.min(m.prog, def.target) }); }); }

// Called inside the player's transaction after every finished round. Returns {ach:[...], missions:[ids done]}.
function onRound(u, info) {
  const out = { ach: [], missions: [] };
  u.cnt = u.cnt || { rounds: 0, fs: 0 }; u.games = u.games || []; u.types = u.types || []; u.ach = u.ach || {};
  if (info.cost > 0 || info.inFS) u.cnt.rounds++;
  if (info.ev === 'start' || info.hold) u.cnt.fs++;
  const real = info.gid >= 0;
  if (real && !u.games.includes(info.gid)) u.games.push(info.gid);
  const ty = info.table ? 'table' : info.engine; if (ty && !u.types.includes(ty)) u.types.push(ty);
  const mult = info.bet > 0 ? info.win / info.bet : 0;
  // missions
  const M = missionsOf(u);
  if (real && !M.games.includes(info.gid)) M.games.push(info.gid);
  for (const m of M.list) {
    if (m.done) continue; const def = MISSIONS.find(x => x.id === m.id);
    if (m.id === 'rounds' && (info.cost > 0 || info.inFS)) m.prog++;
    if (m.id === 'won') m.prog = r2(m.prog + info.win);
    if (m.id === 'games') m.prog = M.games.length;
    if (m.id === 'table' && info.table) m.prog++;
    if (m.id === 'bonus' && (info.ev === 'start' || info.hold)) m.prog++;
    if (m.id === 'bigwin' && mult >= 10) m.prog++;
    if (m.id === 'wager') m.prog = r2(m.prog + info.cost);
    if (m.id === 'bacc' && info.bacc) m.prog++;
    if (m.id === 'shared' && info.shared) m.prog++;
    if (m.prog >= def.target) { m.done = true; out.missions.push({ id: m.id, title: def.title }); }
  }
  // achievements
  const unlock = id => { if (!u.ach[id]) { u.ach[id] = Date.now(); const a = ACH.find(x => x.id === id); u.bal = r2(u.bal + a.reward); out.ach.push(a); } };
  if (info.win > 0) unlock('first_win');
  if (u.cnt.rounds >= 100) unlock('r100'); if (u.cnt.rounds >= 1000) unlock('r1000'); if (u.cnt.rounds >= 10000) unlock('r10000');
  if (mult >= 50) unlock('big50'); if (mult >= 100) unlock('big100');
  if (u.games.length >= 10) unlock('g10'); if (u.games.length >= 50) unlock('g50');
  if (SLOT_TYPES.every(t => u.types.includes(t)) && u.types.includes('table')) unlock('types');
  if (u.cnt.fs >= 10) unlock('fs10'); if (info.hold) unlock('hold'); if (info.grand) unlock('grand');
  if (info.bj) unlock('bj'); if (info.royal) unlock('royal'); if (info.xwin) unlock('tiger'); if (info.shared) unlock('mate');
  const lv = u.level || 1; if (lv >= 5) unlock('lv5'); if (lv >= 10) unlock('lv10'); if (lv >= 25) unlock('lv25');
  if ((u.streak || 0) >= 7) unlock('streak7');
  return out;
}
function claimMission(u, id) {
  const M = missionsOf(u); const m = M.list.find(x => x.id === id); if (!m) return { err: 'nf', msg: 'Mission not found' };
  if (!m.done) return { err: 'not_done', msg: 'Mission not completed yet' }; if (m.claimed) return { err: 'claimed', msg: 'Already claimed' };
  m.claimed = true; const def = MISSIONS.find(x => x.id === id); u.bal = r2(u.bal + def.reward); return { reward: def.reward, title: def.title };
}
function achView(u) { const a = u.ach || {}; return ACH.map(x => Object.assign({}, x, { at: a[x.id] || null })); }

// ---- weekly leaderboards ----
function weekKey(t) { const d = new Date(t || Date.now()); const day = (d.getDay() + 6) % 7; const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day); return dayKey(mon.getTime()); }
const WEEKLY_PRIZES = [20000, 10000, 5000, 3000, 2000, 1000, 1000, 1000, 1000, 1000];
async function recordScores(repo, u, info, t) {
  const w = weekKey();
  if (info.win > 0) await repo.scoreAdd('w:' + w + ':won', u.id, u.name, info.win, t);
  if (info.win > 0 && u.club) { const C = await repo.kvGet('clubs', {}, t); const c = C && C[u.club]; if (c) await repo.scoreAdd('w:' + w + ':club', c.id, c.name, info.win, t); }
  if (info.bet >= 1 && info.win > 0) await repo.scoreMax('w:' + w + ':mult', u.id, u.name, r2(info.win / info.bet), t);
  const ts = (await repo.kvGet('tournaments', [], t)).filter(x => x.start <= Date.now() && x.end > Date.now() && !x.paid);
  for (const tr of ts) {
    if (tr.filter === 'slots' && info.table) continue; if (tr.filter === 'tables' && !info.table) continue;
    if (tr.filter && tr.filter.startsWith('engine:') && info.engine !== tr.filter.slice(7)) continue;
    if ((tr.minBet || 0) > info.bet && !info.inFS) continue;
    if (tr.metric === 'won' && info.win > 0) await repo.scoreAdd('t:' + tr.id, u.id, u.name, info.win, t);
    if (tr.metric === 'rounds' && (info.cost > 0 || info.inFS)) await repo.scoreAdd('t:' + tr.id, u.id, u.name, 1, t);
    if (tr.metric === 'mult' && info.bet >= 1 && info.win > 0) await repo.scoreMax('t:' + tr.id, u.id, u.name, r2(info.win / info.bet), t);
  }
}
// Pays out finished weeks and tournaments exactly once. Called by the scheduler.
async function settle(repo, notify) {
  const lastWeek = weekKey(Date.now() - 7 * 864e5); const flag = 'lbpaid:' + lastWeek;
  if (!(await repo.kvGet(flag, false))) {
    await repo.kvSet(flag, true); const top = await repo.top('w:' + lastWeek + ':won', WEEKLY_PRIZES.length);
    for (let i = 0; i < top.length; i++) await award(repo, notify, top[i].uid, WEEKLY_PRIZES[i], 'weekly_prize', 'Weekly leaderboard: #' + (i + 1), 'You finished #' + (i + 1) + ' on last week’s leaderboard and won ' + WEEKLY_PRIZES[i].toLocaleString() + ' coins!');
  }
  const ts = await repo.kvGet('tournaments', []); let changed = false;
  for (const tr of ts) {
    if (tr.paid || tr.end > Date.now()) continue; tr.paid = true; changed = true;
    await repo.kvSet('tournaments', ts);
    const top = await repo.top('t:' + tr.id, tr.prizes.length);
    for (let i = 0; i < top.length; i++) await award(repo, notify, top[i].uid, tr.prizes[i], 'tournament_prize', tr.name + ': #' + (i + 1), 'You finished #' + (i + 1) + ' in ' + tr.name + ' and won ' + tr.prizes[i].toLocaleString() + ' coins!');
    await repo.audit('tournament_paid', tr.name + ' → ' + top.length + ' winners');
  }
  if (changed) await repo.kvSet('tournaments', ts);
}
async function award(repo, notify, uid, coins, type, ref, msg) {
  await repo.withUser(uid, async (u, t) => { if (!u) return false; u.bal = r2(u.bal + coins); await repo.txInsert({ t: Date.now(), uid, name: u.name, type, amount: coins, bal: u.bal, ref }, t); });
  if (notify) await notify(uid, 'You won ' + coins.toLocaleString() + ' coins!', msg);
}
// ---- 新手任务 New-player journey: a fixed chain of first steps, each paid once, plus a bonus for finishing ----
const ONB = [
  { id: 'slot', title: '转一次老虎机 · Spin any slot', reward: 300, go: 'slots' },
  { id: 'bacc', title: '玩一局百家乐 · Play a baccarat hand', reward: 400, go: 'baccarat' },
  { id: 'table', title: '试一个其他桌面游戏 · Try another table game', reward: 400, go: 'tables' },
  { id: 'shared', title: '在多人桌玩一局 · Play at a shared table', reward: 500, go: 'shared' },
  { id: 'lv3', title: '升到 3 级 · Reach level 3', reward: 600, go: 'slots' }
];
const ONB_DONE = 2000;
function onbView(u) { const o = u.onb || {}; return { steps: ONB.map(s => Object.assign({}, s, { done: !!(o[s.id]) })), bonus: ONB_DONE, finished: !!o.fin, hidden: !!o.hide }; }
// returns [{title, reward}] newly completed (already credited to u.bal)
function onbStep(u, info) { if (u.onb && u.onb.fin) return []; const o = u.onb = u.onb || {}; const out = []; const hit = id => { if (o[id]) return; const s = ONB.find(x => x.id === id); o[id] = Date.now(); u.bal = r2(u.bal + s.reward); out.push({ title: s.title, reward: s.reward }); };
  if (info.slot) hit('slot'); if (info.bacc) hit('bacc'); if (info.table && !info.bacc && !info.shared) hit('table'); if (info.shared) hit('shared'); if ((u.level || 1) >= 3) hit('lv3');
  if (ONB.every(s => o[s.id]) && !o.fin) { o.fin = Date.now(); u.bal = r2(u.bal + ONB_DONE); out.push({ title: '新手任务全部完成 · Journey complete', reward: ONB_DONE, fin: true }); }
  return out; }
module.exports = { ONB, onbView, onbStep, MISSIONS, ACH, missionsOf, missionView, onRound, claimMission, achView, weekKey, recordScores, settle, WEEKLY_PRIZES };
