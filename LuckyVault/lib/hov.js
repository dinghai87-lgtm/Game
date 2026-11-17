'use strict';
// Retention systems in the style of big social casinos (original implementation, virtual coins only):
// VIP tiers, level-scaled timed bonus, daily wheel with streak/level/VIP multipliers, card-collection album with
// set rewards, and a shared progressive jackpot that every slot spin contributes to.
const { r2, dayKey } = require('./repo.js');

const VIP = [ // by lifetime purchases in USD
  { id: 'bronze', name: 'Bronze', min: 0, mult: 1 },
  { id: 'silver', name: 'Silver', min: 20, mult: 1.25 },
  { id: 'gold', name: 'Gold', min: 100, mult: 1.5 },
  { id: 'platinum', name: 'Platinum', min: 500, mult: 2 },
  { id: 'diamond', name: 'Diamond', min: 2000, mult: 3 },
];
function vipOf(u) { const d = (u.st && u.st.dep) || 0; let i = 0; VIP.forEach((v, k) => { if (d >= v.min) i = k; }); const nx = VIP[i + 1]; return { tier: i, id: VIP[i].id, name: VIP[i].name, mult: VIP[i].mult, dep: d, next: nx ? { name: nx.name, need: r2(nx.min - d) } : null }; }

// ---- timed bonus: every 3h, grows with level and VIP tier ----
let EVM = () => 1;   // active event's bonus multiplier (set by install)
const bonusAmount = (base, level, u) => Math.round(base * (1 + (level - 1) * 0.08) * vipOf(u).mult * EVM());

// ---- daily wheel ----
const WHEEL = [500, 2000, 750, 5000, 1000, 1500, 750, 10000, 1000, 3000, 500, 2500];
const WHEEL_W = [16, 6, 14, 2, 12, 9, 14, 0.6, 12, 4, 16, 5];
function wheelSpin(rnd) { const tot = WHEEL_W.reduce((a, b) => a + b, 0); let x = rnd() * tot; for (let i = 0; i < WHEEL.length; i++) { x -= WHEEL_W[i]; if (x < 0) return i; } return 0; }
function wheelMults(day, level, u) { return { streak: +(1 + Math.min(6, day - 1) * 0.1).toFixed(2), level: +(1 + Math.min(100, level) * 0.02).toFixed(2), vip: vipOf(u).mult }; }

// ---- card album ----
const SETS = ['gems', 'pirate', 'magic', 'candy', 'treasure', 'jewels', 'coins', 'bags'];
const SET_NAMES = { gems: 'Gem Vault', pirate: 'Pirate Cove', magic: 'Wizard Study', candy: 'Candy Shop', treasure: 'Treasure Room', jewels: 'Royal Jewels', coins: 'Coin Collection', bags: 'Adventurer Bags' };
const STARS = [1, 1, 1, 1, 2, 2, 2, 3, 4, 5];
const STAR_W = { 1: 60, 2: 25, 3: 9, 4: 4, 5: 1.2 };
const SET_REWARD = [20000, 30000, 40000, 50000, 60000, 75000, 90000, 120000];
const GRAND_REWARD = 1000000;
function rollCard(rnd) {
  const set = SETS[Math.floor(rnd() * SETS.length)]; let tot = 0; STARS.forEach(s => tot += STAR_W[s]); let x = rnd() * tot, i = 0;
  for (; i < 10; i++) { x -= STAR_W[STARS[i]]; if (x < 0) break; }
  return { set, i: Math.min(9, i) };
}
function albumOf(u) { if (!u.album) u.album = { c: {}, done: [], grand: false, packs: 0 }; return u.album; }
function addCard(u, card) {
  const a = albumOf(u), k = card.set + ':' + card.i, isNew = !a.c[k]; a.c[k] = (a.c[k] || 0) + 1; const out = { set: card.set, i: card.i, stars: STARS[card.i], isNew, reward: 0, setDone: null, grand: false };
  if (isNew && !a.done.includes(card.set) && Array.from({ length: 10 }, (_, j) => a.c[card.set + ':' + j]).every(Boolean)) {
    a.done.push(card.set); out.setDone = SET_NAMES[card.set]; out.reward += SET_REWARD[SETS.indexOf(card.set)];
    if (!a.grand && a.done.length === SETS.length) { a.grand = true; out.grand = true; out.reward += GRAND_REWARD; }
  }
  return out;
}
function albumView(u) { const a = albumOf(u); return { sets: SETS.map((s, k) => ({ id: s, name: SET_NAMES[s], reward: SET_REWARD[k], done: a.done.includes(s), cards: Array.from({ length: 10 }, (_, j) => a.c[s + ':' + j] || 0), stars: STARS })), grand: GRAND_REWARD, grandDone: !!a.grand }; }

// ---- progressive jackpot (shared by all players) ----
const JP_TIERS = [ // seed, share of the contribution, hit chance per spin at the maximum bet (scaled linearly by bet)
  { id: 'mini', name: 'MINI', seed: 200, share: 0.40, p: 1 / 400 },
  { id: 'minor', name: 'MINOR', seed: 1000, share: 0.30, p: 1 / 2500 },
  { id: 'major', name: 'MAJOR', seed: 10000, share: 0.20, p: 1 / 25000 },
  { id: 'grand', name: 'GRAND', seed: 100000, share: 0.10, p: 1 / 250000 },
];
const JP_RATE = 0; // jackpots are fixed amounts now (no pool contributions)

function install(ctx) {
  if (ctx.eventBonus) EVM = ctx.eventBonus;
  const { R, userRoute, E, pubUser, addTx, now } = ctx; const repo = ctx.repo(), S = ctx.S;
  const rnd = () => require('crypto').randomInt(0, 2 ** 31) / 2 ** 31;
  let jpCache = null;
  // fixed jackpots: MINI 200 / MINOR 1,000 / MAJOR 10,000 / GRAND 100,000 - the amounts shown are exactly what a hit pays
  async function pools() { const P = {}; JP_TIERS.forEach(j => P[j.id] = j.seed); return P; }

  // replaces the flat free bonus
  R['POST /api/bonus'] = userRoute(async ({ uid }) => {
    let out; await repo.withUser(uid, async (u, t) => {
      if (now() < (u.bonusAt || 0)) { out = [400, { err: 'early', msg: 'Bonus not ready yet' }]; return { skip: true }; }
      const amt = bonusAmount(S().bonusAmount, E.levelOf(u.xp || 0), u);
      u.bal = r2(u.bal + amt); u.bonusAt = now() + S().bonusHours * 3600e3; u.bonusPushed = false; await addTx(u, 'free_bonus', amt, '', t);
      out = [200, { user: pubUser(u), nextAt: u.bonusAt, amount: amt }];
    });
    return out;
  });
  R['GET /api/hov'] = userRoute(async ({ uid }) => {
    const u = await repo.userById(uid); const lvl = E.levelOf(u.xp || 0);
    return [200, { vip: vipOf(u), tiers: VIP, bonus: { amount: bonusAmount(S().bonusAmount, lvl, u), nextAt: u.bonusAt || 0, hours: S().bonusHours, now: now() }, wheel: WHEEL, jackpots: await pools(), album: albumView(u) }];
  });
  R['GET /api/jackpots'] = async () => [200, { jackpots: await pools(), tiers: JP_TIERS.map(j => ({ id: j.id, name: j.name })) }];
  R['GET /api/album'] = userRoute(async ({ uid }) => [200, albumView(await repo.userById(uid))]);

  // hooks used by server.js
  return {
    WHEEL,
    // daily reward: wheel result x multipliers (called inside the existing /api/daily claim transaction)
    dailyWheel(u, day) { const i = wheelSpin(rnd), lvl = E.levelOf(u.xp || 0), m = wheelMults(day, lvl, u); const amount = Math.round(WHEEL[i] * m.streak * m.level * m.vip); return { seg: i, base: WHEEL[i], mults: m, amount }; },
    // after every paid slot round: card drop + jackpot contribution/hit
    async onSlotRound(u, g, r, t) {
      if (!r.cost || r.inFS) return;
      const maxBet = 100, bet = r.cost; // card-drop / jackpot odds reach their maximum at a 100 bet
      // card drop: ~4% per spin, more at higher bets; a pack of 3 on level-up
      const drops = []; if (rnd() < 0.03 + 0.05 * Math.min(1, bet / maxBet)) drops.push(rollCard(rnd));
      if (r.lvl) for (let k = 0; k < 3; k++) drops.push(rollCard(rnd));
      if (drops.length) { r.cards = []; for (const c of drops) { const o = addCard(u, c); if (o.reward) { u.bal = r2(u.bal + o.reward); await addTx(u, 'album', o.reward, o.setDone + (o.grand ? ' + album complete' : ''), t); } r.cards.push(o); } }
      // jackpot
      const P = await pools(t);
      const scale = Math.min(1, bet / maxBet);
      for (let k = JP_TIERS.length - 1; k >= 0; k--) {
        const j = JP_TIERS[k]; if (rnd() < j.p * scale) { const amt = j.seed; u.bal = r2(u.bal + amt); await addTx(u, 'jackpot', amt, j.name, t); r.jackpot = { id: j.id, name: j.name, amount: amt }; repo.audit('jackpot', j.name + ' ' + amt + ' to ' + u.name + ' (#' + u.id + ')').catch(() => {}); break; }
      }
      r.jackpots = P;
    },
    vipOf, albumView,
  };
}
module.exports = { install, VIP, WHEEL, SETS, STARS, JP_TIERS };
