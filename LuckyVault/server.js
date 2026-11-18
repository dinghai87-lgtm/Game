// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
'use strict';
/*
 * Lucky Vault — social casino server (Node 22.5+, no required packages)
 *   node server.js     -> http://localhost:8080 (players)   http://localhost:8080/admin (back office)
 *
 * Storage: SQLite file data/luckyvault.db by default. For PostgreSQL set DATABASE_URL and `npm install pg`.
 * See README.md for every environment variable (admin password, email/SMS, Apple/Google sign-in, alerts).
 *
 * Coins are a virtual item: they can be bought, won and lost, but never withdrawn or exchanged for money.
 * The server is authoritative: every spin and card is generated here.
 */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const DB = require('./lib/db.js');
const { Repo, dayKey, r2 } = require('./lib/repo.js');
const A = require('./lib/auth.js');
const N = require('./lib/notify.js');
const EN = require('./lib/engage.js');
const HOV = require('./lib/hov.js'); let H = null;
const LIVE_MOD = require('./lib/live.js'); let LIVE = null;
const FRIENDS = require('./lib/friends.js');
const ADMINS = require('./lib/admins.js'); let ADM = null;
const SUPPORT = require('./lib/support.js');
const CLUBS = require('./lib/clubs.js');
const IAP = require('./lib/iap.js').create(process.env);

const PORT = +process.env.PORT || 8080;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
// Admin password: ADMIN_PASS env wins; otherwise a random one is generated on first start and kept in data/admin-pass.txt
const ADMIN_PASS = process.env.ADMIN_PASS || (() => {
  const dir = path.join(__dirname, 'data'), f = path.join(dir, 'admin-pass.txt');
  try { const v = fs.readFileSync(f, 'utf8').trim(); if (v) return v; } catch (e) {}
  const v = require('crypto').randomBytes(12).toString('base64').replace(/[+/=]/g, 'x');
  try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f, v + '\n', { mode: 0o600 }); } catch (e) { return 'admin123'; }
  return v;
})();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const PUB = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const STARTED = Date.now();

// ---------- shared game engines (same code the browser runs) ----------
const E = require('./public/js/slots-engine.js');
const TE = require('./public/js/tables-engine.js');
const { THEMES, TABLES, SLOT_LIST, TABLE_LIST } = require('./public/js/catalog.js');
E.setVariants(SLOT_LIST);
const TABLE_RTP = { mbacc: { r1: 98.9, r2: 98.9 }, mdt: 96.3, msicbo: 97.2, mroul: 97.3, blackjack: { classic: 99.5, vegas: 99.6, single: 99.6, euro: 99.4, free: 99.0, spanish: 99.6, switch: 99.4 }, roulette: { eu: 97.3, fr: 98.6, us: 94.7, lucky: 97.3 }, baccarat: { std: 98.9, nc: 98.5, speed: 98.9, ez: 99.0 }, dragontiger: 96.3, sicbo: 97.2, craps: 98.6, videopoker: { job: 99.5, dw: 99.7, bp: 99.2, dbp: 99.1, jk: 98.6, af: 99.3, job3: 99.5, job10: 99.5, dw3: 99.7, dbp10: 99.1 }, tcp: 96.6, uth: 97.8, letitride: 96.5, mstud: 95.1, fourcard: 96.6, hcf: 97.4, paigow: 98.9, paigowtiles: 97.2, crash: 97, holdem: 97.8, caribbean: 94.8, war: 97.1, reddog: 97.2, wheel: 88.9, keno: 92, scratch: 92 };
const LABEL = { mbacc: 'Shared Baccarat', mdt: 'Shared Dragon Tiger', msicbo: 'Shared Sic Bo', mroul: 'Shared Roulette', blackjack: 'Blackjack', roulette: 'Roulette', baccarat: 'Baccarat', dragontiger: 'Dragon Tiger', sicbo: 'Sic Bo', craps: 'Craps', videopoker: 'Video Poker', tcp: 'Three Card Poker', holdem: "Casino Hold'em", caribbean: 'Caribbean Stud', war: 'Casino War', reddog: 'Red Dog', wheel: 'Money Wheel', keno: 'Keno', scratch: 'Scratch Card', uth: "Ultimate Texas Hold'em", letitride: 'Let It Ride', mstud: 'Mississippi Stud', fourcard: 'Four Card Poker', hcf: 'High Card Flush', paigow: 'Pai Gow Poker', paigowtiles: 'Pai Gow Tiles', crash: 'Rocket Crash' };
// Game ids are stable: classic slots 0-69, tables 70-99, feature slots 100+.
const GAMES = [];
SLOT_LIST.forEach(([id, t]) => { GAMES[id] = { id, name: t[0], e: t[1], mk: E.mathKey(id, t[1]), tag: t[9] || '', slot: true }; });
TABLE_LIST.forEach(([id, t]) => { GAMES[id] = { id, name: t[0], kind: t[1], v: t[2], tag: t[7] || '', slot: false }; });
const GLIST = GAMES.filter(Boolean);
const theoRTP = g => g.slot ? E.MATH[g.mk].rtp : (typeof TABLE_RTP[g.kind] === 'object' ? TABLE_RTP[g.kind][g.v] : TABLE_RTP[g.kind]);
const glabel = g => g.slot ? E.MATH[g.mk].label + ' · ' + E.MATH[g.mk].vol : LABEL[g.kind];
const BETS = [0.2, 0.4, 0.6, 1, 2, 4, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const DAILY = [500, 750, 1000, 1250, 1500, 2000, 3000];

const DEFAULT_SETTINGS = {
  signupBonus: 5000, bonusAmount: 1000, bonusHours: 3, maxBet: 5000, tableMin: 1, tableMax: 5000, sandbox: process.env.PAY_SANDBOX !== '0',
  verifyBonus: 1000, maxAccountsPerDevice: 3, maxDailyClaimsPerIp: 5,
  promo: null, // { pct: 50, label: 'Weekend +50%', start, end }
  event: null, // { xp: 2, bonus: 2, label: '双倍经验周末', start, end } — XP multiplier on play, multiplier on the free timed bonus
  packages: [
    { id: 'p1', price: 4.99, coins: 5000 }, { id: 'p2', price: 9.99, coins: 11000, tag: '+10%' }, { id: 'p3', price: 19.99, coins: 24000, tag: '+20%' },
    { id: 'p4', price: 49.99, coins: 65000, tag: 'BEST VALUE' }, { id: 'p5', price: 99.99, coins: 140000, tag: '+40%' }
  ]
};

let drv, repo, SET = Object.assign({}, DEFAULT_SETTINGS), GSTATE = {};
const now = () => Date.now();
// 存钱猪 piggy bank: 3% of every bet is saved (virtual coins only); break it once a day when it holds at least `min`
const PIG = { rate: 0.03, min: 200, cap: 10000, coolH: 24 };
function pubUser(u) {
  return { id: u.id, name: u.name, xp: u.xp || 0, level: E.levelOf(u.xp || 0), bal: u.bal, fs: u.fs || null, tg: u.tg ? { gid: u.tg.gid } : null, bonusAt: u.bonusAt || 0,
    email: u.email || null, emailVerified: !!u.emailVerified, phone: u.phone || null, google: !!u.googleSub, apple: !!u.appleSub, hasPassword: !!u.hash, tour: !!u.tour, pig: r2(u.pig || 0), pigAt: u.pigAt || 0, pigMin: PIG.min, pigCap: PIG.cap };
}
// weekly event rotation (used whenever no manual event is running; switch off with Admin → settings autoEvents=false)
const AUTO_EVENTS = [
  { day: [1], xp: 1.5, label: '周一好运开局 · Lucky Monday — 1.5× XP' },
  { day: [3], bonus: 1.5, label: '周三奖励日 · Bonus Wednesday — free bonus ×1.5' },
  { day: [5], from: 18, xp: 2, label: '周末双倍经验 · Weekend Double XP' }, { day: [6, 0], xp: 2, label: '周末双倍经验 · Weekend Double XP' },
];
function autoEvent() { if (SET.autoEvents === false) return null; const d = new Date(now()); const e = AUTO_EVENTS.find(x => x.day.includes(d.getDay()) && (!x.from || d.getHours() >= x.from)); if (!e) return null;
  const end = new Date(d); end.setHours(24, 0, 0, 0); return { xp: e.xp || 1, bonus: e.bonus || 1, label: e.label, end: end.getTime(), auto: true }; }
const eventActive = () => { const p = SET.event; return p && (!p.start || p.start <= now()) && (!p.end || p.end > now()) ? p : autoEvent(); };
const promoActive = () => { const p = SET.promo; return p && p.pct > 0 && (!p.start || p.start <= now()) && (!p.end || p.end > now()) ? p : null; };
const pkgCoins = p => { const pr = promoActive(); return pr ? Math.round(p.coins * (1 + pr.pct / 100)) : p.coins; };

// ---------- monitoring ----------
let alertTimes = []; const recentAlerts = [];
async function alert(text) {
  console.error('[ALERT] ' + text);
  recentAlerts.unshift({ t: now(), text: String(text).slice(0, 300) }); recentAlerts.length = Math.min(recentAlerts.length, 50);
  alertTimes = alertTimes.filter(t => t > now() - 3600e3); if (alertTimes.length >= 10) return; alertTimes.push(now());
  if (process.env.ALERT_EMAIL && N.mailConfigured()) { try { await N.sendEmail(repo, process.env.ALERT_EMAIL, '[Lucky Vault] alert', text); } catch (e) {} }
  const url = process.env.ALERT_WEBHOOK; if (!url) return;
  try { await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '[Lucky Vault] ' + text, content: '[Lucky Vault] ' + text }) }); } catch (e) {}
}
let err5 = [];
async function logError(e, ctx) {
  console.error(e); if (repo) await repo.errorAdd(e && e.message || e, e && e.stack, ctx);
  err5 = err5.filter(t => t > now() - 300e3); err5.push(now()); if (err5.length === 5) alert('5 server errors in the last 5 minutes. Latest: ' + (e && e.message));
}
process.on('uncaughtException', e => { logError(e, 'uncaught'); });
process.on('unhandledRejection', e => { logError(e, 'unhandledRejection'); });

// ---------- helpers ----------
function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(obj)); }
function readBody(req) { return new Promise(ok => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) req.destroy(); }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { ok({}); } }); req.on('error', () => ok({})); }); }
const hits = new Map();
function limited(key, max, windowMs) { const k = key + ':' + Math.floor(now() / (windowMs || 60000)); const n = (hits.get(k) || 0) + 1; hits.set(k, n); if (hits.size > 50000) { const cut = Math.floor(now() / 60000) - 60; for (const kk of hits.keys()) { const w = +kk.slice(kk.lastIndexOf(':') + 1); if (w < cut || hits.size > 80000) hits.delete(kk); } } return n > max; }
const busy = new Set();
const SESSION_DAYS = 30;
async function authUser(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, ''); if (!t) return null;
  const s = await repo.session(t); if (!s) return null;
  if (now() - Number(s.seen) > SESSION_DAYS * 864e5) { await repo.sessionDel(t); return null; }
  if (now() - Number(s.seen) > 60e3) { await repo.sessionTouch(t); await repo.dailyPlayer(Number(s.uid)); await drv.run('UPDATE users SET last=? WHERE id=?', [now(), Number(s.uid)]); }
  return Number(s.uid);
}
const adminTokens = new Map();
function authAdmin(req) { const t = (req.headers.authorization || '').replace(/^Bearer /, ''); const a = adminTokens.get(t); return a && a.exp > now() ? Object.assign({ role: 'owner', user: ADMIN_USER }, a) : null; }
const fpOf = b => String(b.fp || '').replace(/[^a-z0-9-]/gi, '').slice(0, 64) || null;
async function addTx(u, type, amount, ref, t) { await repo.txInsert({ t: now(), uid: u.id, name: u.name, type, amount: r2(amount), bal: u.bal, ref: ref || '' }, t); }
const notify = (uid, title, body, url) => N.notifyUser(repo, uid, title, body, url).catch(e => logError(e, 'notify'));

async function newSession(u, ip, fp) { const tk = A.token(); await repo.sessionNew(tk, u.id); await repo.dailyPlayer(u.id); await repo.deviceSeen(fp, u.id, ip); return tk; }
async function createUser({ name, pass, email, provider, sub, ip, fp }) {
  // Name: given, or derived for social sign-in
  if (!name) { const base = 'player'; for (let i = 0; i < 20; i++) { const n = base + (10000 + Math.floor(Math.random() * 89999)); if (!(await repo.userByName(n))) { name = n; break; } } }
  const id = await repo.next('user', 1000);
  const u = { id, name, bal: 0, xp: 0, fs: null, created: now(), last: now(), bonusAt: 0, banned: false, st: { spins: 0, bet: 0, win: 0, dep: 0, depCount: 0 } };
  if (pass) { u.salt = A.newSalt(); u.hash = A.hashPass(pass, u.salt); }
  if (email) { u.email = email; u.emailVerified = provider ? true : false; }
  if (provider === 'google') u.googleSub = sub; if (provider === 'apple') u.appleSub = sub;
  // Anti-abuse: only the first few accounts on one device get the welcome bonus.
  const onDevice = await repo.deviceAccounts(fp);
  const bonus = onDevice < SET.maxAccountsPerDevice ? SET.signupBonus : 0; u.flagged = onDevice >= SET.maxAccountsPerDevice;
  u.bal = r2(bonus);
  await repo.tx(async t => { await repo.insertUser(u, t); await addTx(u, 'signup_bonus', bonus, bonus ? '' : 'withheld: device limit', t); await repo.daily('signups', 1, t); });
  if (u.flagged) await repo.audit('risk', 'Account ' + name + ' created on a device with ' + onDevice + ' other accounts (welcome bonus withheld)');
  return u;
}

// ---------- routes ----------
const R = {};      // 'METHOD /path' -> async (ctx) => [status, body]
const ADMIN = {};
const userRoute = fn => async c => { const uid = await authUser(c.req); if (!uid) return [401, { err: 'auth', msg: 'Please log in' }]; c.uid = uid; return fn(c); };

R['GET /api/ping'] = async () => [200, { ok: true, sandbox: SET.sandbox, promo: promoActive(), event: eventActive(),
  auth: { google: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.split(',')[0] : null, apple: process.env.APPLE_CLIENT_ID ? process.env.APPLE_CLIENT_ID.split(',')[0] : null, appleRedirect: process.env.APPLE_REDIRECT_URI || null, email: true, phone: true },
  vapid: (await N.vapidKeys(repo)).pub, games: GLIST.map(g => ({ id: g.id, enabled: GSTATE[g.id] ? GSTATE[g.id].enabled : true, tag: GSTATE[g.id] ? GSTATE[g.id].tag : null })) }];
R['GET /api/health'] = async () => { let ok = true; try { await repo.countUsers(); } catch (e) { ok = false; } return [ok ? 200 : 503, { ok, db: drv.kind, uptime: Math.round((now() - STARTED) / 1000), errors24h: ok ? await repo.errorCount(now() - 864e5) : null, mem: Math.round(process.memoryUsage().rss / 1048576) + 'MB' }]; };

// --- accounts ---
R['POST /api/register'] = async ({ b, ip }) => {
  if (limited('reg:' + ip, 20)) return [429, { err: 'rate', msg: 'Too many attempts, try again in a minute' }];
  const name = String(b.name || '').trim(), pass = String(b.pass || ''), email = String(b.email || '').trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) return [400, { err: 'name', msg: 'Username: 3-20 letters, numbers or _' }];
  if (pass.length < 8) return [400, { err: 'pass', msg: 'Password must be at least 8 characters' }];
  if (email && !A.emailOk(email)) return [400, { err: 'email', msg: 'That email address doesn’t look right' }];
  if (!b.adult) return [400, { err: 'age', msg: 'You must be 18 or older' }];
  if (await repo.userByName(name)) return [409, { err: 'taken', msg: 'Username already taken' }];
  if (email && await repo.userByEmail(email)) return [409, { err: 'email_taken', msg: 'That email is already used by another account' }];
  const fp = fpOf(b); const u = await createUser({ name, pass, email: email || null, ip, fp });
  if (email) await sendVerifyEmail(u);
  return [200, { token: await newSession(u, ip, fp), user: pubUser(u), bonusWithheld: !!u.flagged }];
};
R['POST /api/login'] = async ({ b, ip }) => {
  if (limited('login:' + ip, 30)) return [429, { err: 'rate', msg: 'Too many attempts, try again in a minute' }];
  const id = String(b.name || '').trim(); const acct = 'loginfail:' + id.toLowerCase().slice(0, 80);
  // per-account lock: 10 wrong passwords in 15 minutes locks that account for the rest of the window (from any IP)
  if ((hits.get(acct + ':' + Math.floor(now() / 900000)) || 0) >= 10) return [429, { err: 'rate', msg: 'Too many wrong passwords for this account. Try again in 15 minutes or reset your password.' }];
  const u = id.includes('@') ? await repo.userByEmail(id) : await repo.userByName(id);
  if (!u || !u.hash || !A.safeEq(A.hashPass(b.pass || '', u.salt), u.hash)) { limited(acct, 1e9, 900000); return [401, { err: 'login', msg: 'Wrong username/email or password' }]; }
  if (u.banned) return [403, { err: 'banned', msg: 'This account is suspended' }];
  return [200, { token: await newSession(u, ip, fpOf(b)), user: pubUser(u) }];
};
R['POST /api/logout'] = async ({ req }) => { await repo.sessionDel((req.headers.authorization || '').replace(/^Bearer /, '')); return [200, { ok: true }]; };
R['GET /api/me'] = userRoute(async ({ uid }) => { const u = await repo.userById(uid); if (!u) return [401, { err: 'auth' }]; return [200, { user: pubUser(u), unread: await repo.notesUnseen(uid) }]; });

// Email verification + password reset
async function sendVerifyEmail(u) { const c = await A.issueCode(repo, 'verify:' + u.id, { email: u.email }); await N.sendEmail(repo, u.email, 'Your Lucky Vault code: ' + c, 'Your verification code is ' + c + '. It expires in 10 minutes.'); }
R['POST /api/auth/email'] = userRoute(async ({ uid, b, ip }) => { // set/change email and send a code
  if (limited('mail:' + uid, 5, 3600e3)) return [429, { err: 'rate', msg: 'Too many emails — try again later' }];
  const email = String(b.email || '').trim(); if (!A.emailOk(email)) return [400, { err: 'email', msg: 'Enter a valid email address' }];
  const other = await repo.userByEmail(email); if (other && other.id !== uid) return [409, { err: 'email_taken', msg: 'That email is already used by another account' }];
  let user; await repo.withUser(uid, async u => { u.email = email; u.emailVerified = false; user = u; }); await sendVerifyEmail(user);
  return [200, { ok: true, msg: 'We sent a 6-digit code to ' + email }];
});
R['POST /api/auth/email/verify'] = userRoute(async ({ uid, b }) => {
  const r = await A.checkCode(repo, 'verify:' + uid, b.code); if (!r.ok) return [400, { err: 'code', msg: r.msg }];
  let out; await repo.withUser(uid, async (u, t) => {
    if (r.data && r.data.email !== u.email) { out = [400, { err: 'code', msg: 'Email changed — request a new code' }]; return { skip: true }; }
    u.emailVerified = true; let bonus = 0; if (!u.verifyBonusPaid && SET.verifyBonus) { u.verifyBonusPaid = true; bonus = SET.verifyBonus; u.bal = r2(u.bal + bonus); await addTx(u, 'verify_bonus', bonus, 'email', t); }
    out = [200, { user: pubUser(u), bonus }];
  });
  return out;
});
R['POST /api/auth/forgot'] = async ({ b, ip }) => {
  if (limited('forgot:' + ip, 5, 3600e3)) return [429, { err: 'rate', msg: 'Too many requests — try again later' }];
  const u = A.emailOk(b.email) ? await repo.userByEmail(String(b.email).trim()) : null;
  if (u) { const c = await A.issueCode(repo, 'reset:' + u.id, null); await N.sendEmail(repo, u.email, 'Reset your Lucky Vault password', 'Your password reset code is ' + c + '. It expires in 10 minutes. If you didn’t ask for this, ignore this email.'); }
  return [200, { ok: true, msg: 'If that email belongs to a verified account, a reset code is on its way.' }];
};
R['POST /api/auth/reset'] = async ({ b, ip }) => {
  if (limited('reset:' + ip, 20, 3600e3)) return [429, { err: 'rate', msg: 'Too many attempts' }];
  const u = A.emailOk(b.email) ? await repo.userByEmail(String(b.email).trim()) : null; if (!u) return [400, { err: 'code', msg: 'Wrong code' }];
  if (String(b.pass || '').length < 8) return [400, { err: 'pass', msg: 'Password must be at least 8 characters' }];
  const r = await A.checkCode(repo, 'reset:' + u.id, b.code); if (!r.ok) return [400, { err: 'code', msg: r.msg }];
  await repo.withUser(u.id, async x => { x.salt = A.newSalt(); x.hash = A.hashPass(b.pass, x.salt); });
  await repo.sessionsDelUser(u.id); await repo.audit('password_reset', u.name);
  return [200, { token: await newSession(u, ip, fpOf(b)), user: pubUser(await repo.userById(u.id)) }];
};
R['POST /api/auth/password'] = userRoute(async ({ uid, b }) => {
  if (String(b.pass || '').length < 8) return [400, { err: 'pass', msg: 'New password must be at least 8 characters' }];
  let out; await repo.withUser(uid, async u => {
    if (u.hash && !A.safeEq(A.hashPass(b.old || '', u.salt), u.hash)) { out = [400, { err: 'old', msg: 'Current password is wrong' }]; return { skip: true }; }
    u.salt = A.newSalt(); u.hash = A.hashPass(b.pass, u.salt); out = [200, { ok: true }];
  });
  return out;
});
// Phone verification (SMS)
R['POST /api/auth/phone'] = userRoute(async ({ uid, b }) => {
  if (limited('sms:' + uid, 3, 3600e3)) return [429, { err: 'rate', msg: 'Too many texts — try again later' }];
  const phone = A.phoneNorm(b.phone); if (!phone) return [400, { err: 'phone', msg: 'Use international format, e.g. +61412345678' }];
  const other = await repo.userByPhone(phone); if (other && other.id !== uid) return [409, { err: 'phone_taken', msg: 'That number is linked to another account' }];
  const c = await A.issueCode(repo, 'phone:' + uid, { phone }); await N.sendSms(repo, phone, 'Lucky Vault code: ' + c);
  return [200, { ok: true, msg: 'We texted a 6-digit code to ' + phone }];
});
R['POST /api/auth/phone/verify'] = userRoute(async ({ uid, b }) => {
  const r = await A.checkCode(repo, 'phone:' + uid, b.code); if (!r.ok) return [400, { err: 'code', msg: r.msg }];
  let out; await repo.withUser(uid, async u => { u.phone = r.data.phone; out = [200, { user: pubUser(u) }]; });
  return out;
});
// Sign in with Google / Apple (ID token from the client SDK)
async function socialLogin(provider, b, ip) {
  let info; try { info = await A.verifyIdToken(provider, b.idToken); } catch (e) { return [400, { err: 'token', msg: e.message }]; }
  let u = await repo.userBySub(provider, info.sub);
  if (!u && info.email && info.emailVerified) { const byMail = await repo.userByEmail(info.email); if (byMail) { await repo.withUser(byMail.id, async x => { if (provider === 'google') x.googleSub = info.sub; else x.appleSub = info.sub; }); u = await repo.userById(byMail.id); } }
  if (!u) { if (!b.adult) return [400, { err: 'age', msg: 'Please confirm you are 18 or older' }]; u = await createUser({ email: info.emailVerified ? info.email : null, provider, sub: info.sub, ip, fp: fpOf(b) }); }
  if (u.banned) return [403, { err: 'banned', msg: 'This account is suspended' }];
  return [200, { token: await newSession(u, ip, fpOf(b)), user: pubUser(u) }];
}
R['POST /api/auth/google'] = ({ b, ip }) => socialLogin('google', b, ip);
R['POST /api/auth/apple'] = ({ b, ip }) => socialLogin('apple', b, ip);
// Account deletion (required by Apple for apps with sign-up)
R['POST /api/account/delete'] = userRoute(async ({ uid, b }) => {
  let out; await repo.withUser(uid, async u => {
    if (u.hash && !A.safeEq(A.hashPass(b.pass || '', u.salt), u.hash)) { out = [400, { err: 'pass', msg: 'Password is wrong' }]; return { skip: true }; }
    const old = u.name; u.name = 'deleted_' + u.id; u.email = null; u.emailVerified = false; u.phone = null; u.googleSub = null; u.appleSub = null; u.hash = null; u.salt = null; u.banned = true; u.deleted = now(); u.bal = 0;
    await repo.audit('account_deleted', old + ' (#' + u.id + ')'); out = [200, { ok: true }];
  });
  if (out && out[0] === 200) await repo.sessionsDelUser(uid);   // a wrong password must not log the player out
  return out;
});

// --- games ---
function roundInfo(g, r, extra) { return Object.assign({ gid: g.id, engine: g.e, table: !g.slot, cost: r.cost, win: r.win, bet: r.bet || r.cost, ev: r.ev, hold: !!(r.res && r.res.hold), grand: !!(r.res && r.res.hold && r.res.hold.grand), inFS: !!r.inFS }, extra || {}); }
async function afterRound(u, g, r, info, t) {
  u.last = now();
  const gs = { spins: info.newRound ? 1 : 0, bet: r.cost, win: info.done === false ? 0 : r.win, fs: r.ev === 'start' ? 1 : 0 };
  await repo.gameStat(g.id, gs, t); await repo.daily('bet', r.cost, t); if (gs.win) await repo.daily('win', gs.win, t);
  if (info.newRound) { await repo.daily('rounds', 1, t); await repo.dailyPlayer(u.id, t); await repo.gameDaily(g.id, u.id, 1, 0, t); }
  u.st.bet = r2(u.st.bet + r.cost); u.st.win = r2(u.st.win + gs.win); if (info.newRound) u.st.spins++;
  if (r.cost) { const ev = eventActive(); const lv = E.addXp(u, r2(r.cost * (ev ? ev.xp : 1))); u.level = E.levelOf(u.xp); if (lv) { r.lvl = lv; await addTx(u, 'level_bonus', lv.reward, 'Level ' + lv.level, t); } }
  if (r.cost > 0) u.pig = Math.min(PIG.cap, r2((u.pig || 0) + r.cost * PIG.rate));   // piggy bank: a small share of every bet
  r.xp = u.xp; r.pig = r2(u.pig || 0);
  if (info.done !== false) {
    const e = EN.onRound(u, info); if (e.ach.length) { r.ach = e.ach; for (const a of e.ach) await addTx(u, 'achievement', a.reward, a.title, t); }
    if (e.missions.length) r.missionsDone = e.missions;
    await EN.recordScores(repo, u, info, t);
    const ob = EN.onbStep(u, Object.assign({ slot: !!g.slot }, info)); if (ob.length) { r.onb = ob; for (const x of ob) await addTx(u, 'onboarding', x.reward, x.title, t); }
  }
  if (g.slot && H) await H.onSlotRound(u, g, r, t);
  r.bal = u.bal;
}
R['POST /api/spin'] = userRoute(async ({ uid, b }) => {
  const gid = +b.gid, g = GAMES[gid];
  if (!g || !g.slot || (GSTATE[gid] && !GSTATE[gid].enabled)) return [400, { err: 'game', msg: 'Game unavailable' }];
  if (limited('act:' + uid, 15, 1000)) return [429, { err: 'rate', msg: 'Slow down a little' }];
  if (busy.has(uid)) return [429, { err: 'busy', msg: 'Spin in progress' }];
  busy.add(uid);
  try {
    let out;
    await repo.withUser(uid, async (u, t) => {
      if (!u || u.banned) { out = [403, { err: 'banned', msg: 'Account suspended' }]; return { skip: true }; }
      { const rb = rgBlock(u); if (rb && !u.fs) { out = [403, rb]; return { skip: true }; } }   // free spins already won may still be played
      const bet = typeof b.bet === 'number' ? b.bet : NaN; if (!(u.fs && (u.fs.left > 0 || u.fs.choose)) && (!BETS.includes(bet) || bet > SET.maxBet)) { out = [400, { err: 'bad_bet', msg: 'Max bet is ' + SET.maxBet }]; return { skip: true }; }
      const r = E.round(u, gid, g.e, bet, !!b.buy, !!b.ante, { choice: b.choice }); if (r.err) { out = [400, r]; return { skip: true }; }
      if (r.chosen) { out = [200, r]; return; }
      await afterRound(u, g, r, roundInfo(g, r, { newRound: true }), t);
      await repo.roundInsert({ t: now(), uid, name: u.name, gid, bet: r.bet, cost: r.cost, win: r.win, fs: r.inFS, buy: r.buy, ante: r.ante, ev: r.ev, bal: u.bal }, t);
      out = [200, r];
    });
    return out;
  } finally { busy.delete(uid); }
});
// ---- 负责任娱乐 responsible play: daily time limit and self-exclusion (take a break), enforced on every bet ----
// Lowering a limit or starting a break is immediate; raising/removing a limit only takes effect 24 h later.
function rgBlock(u) { const rg = u.rg || {}; const t = now();
  if (rg.until && rg.until > t) return { err: 'rg_pause', msg: '账号暂停中，至 ' + new Date(rg.until).toLocaleString() + ' · Your break lasts until then', until: rg.until };
  const lim = rgLimit(u); if (lim && rg.day === dayKey(t) && (rg.secs || 0) >= lim * 60) return { err: 'rg_limit', msg: '今天的游戏时间已达上限（' + lim + ' 分钟）· Daily play-time limit reached' };
  return null; }
function rgLimit(u) { const rg = u.rg || {}; if (rg.pend && rg.pend.at <= now()) { rg.limit = rg.pend.limit; delete rg.pend; } return rg.limit || 0; }
function rgView(u) { const rg = u.rg || {}; const d = dayKey(now()); return { limit: rgLimit(u), pending: rg.pend || null, until: rg.until && rg.until > now() ? rg.until : 0, todayMin: rg.day === d ? Math.floor((rg.secs || 0) / 60) : 0 }; }
const XWIN = ['stiger', 'btiger', 'sdragon', 'bdragon', 'dragon7', 'panda8'];
R['POST /api/table'] = userRoute(async ({ uid, b }) => {
  const gid = +b.gid, g = GAMES[gid];
  if (!g || g.slot || (GSTATE[gid] && !GSTATE[gid].enabled)) return [400, { err: 'game', msg: 'Game unavailable' }];
  if (limited('act:' + uid, 15, 1000)) return [429, { err: 'rate', msg: 'Slow down a little' }];
  if (busy.has(uid)) return [429, { err: 'busy', msg: 'Action in progress' }];
  busy.add(uid);
  try {
    let out;
    await repo.withUser(uid, async (u, t) => {
      if (!u || u.banned) { out = [403, { err: 'banned', msg: 'Account suspended' }]; return { skip: true }; }
      { const rb = rgBlock(u); if (rb && b.a === 'deal') { out = [403, rb]; return { skip: true }; } }   // a round already started may be finished
      const inp = { now: Date.now(), a: String(b.a || ''), bets: b.bets, hold: Array.isArray(b.hold) ? b.hold.slice(0, 5).map(Boolean) : undefined, picks: Array.isArray(b.picks) ? b.picks.slice(0, 44).map(Number) : undefined };
      // baccarat / dragon tiger deal from a real 8-deck shoe kept per player and table; the scoreboard is the shoe's record
      const shoeKey = TE.SHOE_KINDS.includes(g.kind) ? 'shoe:' + uid + ':' + gid : null;
      if (shoeKey && inp.a === 'deal') { let sh = await repo.kvGet(shoeKey, null, t); if (!sh || sh.end) sh = TE.newShoe((sh ? sh.no : 0) + 1); inp.shoe = sh; }
      const r = TE.round(u, gid, g.kind, g.v, inp, { min: SET.tableMin, max: SET.tableMax });
      if (r.err) { out = [400, r]; return { skip: true }; }
      if (inp.shoe && r.shoe) await repo.kvSet(shoeKey, inp.shoe, t);
      if (inp.a === 'resume') { out = [200, r]; return { skip: true }; }
      u.tgStake = r2((inp.a === 'deal' ? 0 : (u.tgStake || 0)) + r.cost);
      const v = r.view || {}; const extra = { newRound: inp.a === 'deal', done: r.done, bet: u.tgStake, bj: !!(Array.isArray(v.hands) && v.hands.some(h => h.res === 'blackjack')), bacc: TE.SHOE_KINDS.includes(g.kind), xwin: XWIN.some(k => v.wins && v.wins[k] > 0), royal: /Royal/.test(v.res || '') && !/Wild/.test(v.res || '') };
      await afterRound(u, g, r, roundInfo(g, r, extra), t);
      if (r.done) { await repo.roundInsert({ t: now(), uid, name: u.name, gid, bet: u.tgStake, cost: u.tgStake, win: r.win, table: true, bal: u.bal }, t); u.tgStake = 0; }
      out = [200, r];
    });
    return out;
  } finally { busy.delete(uid); }
});
// current shoe of a baccarat / dragon tiger table (created on first look); POST starts a new shoe between hands
R['GET /api/shoe'] = userRoute(async ({ uid, q }) => { const gid = +q.get('gid'), g = GAMES[gid]; if (!g || !TE.SHOE_KINDS.includes(g.kind)) return [400, { err: 'game' }];
  const k = 'shoe:' + uid + ':' + gid; let sh = await repo.kvGet(k, null); if (!sh) { sh = TE.newShoe(1); await repo.kvSet(k, sh); } return [200, { shoe: TE.shoeInfo(sh) }]; });
R['POST /api/shoe'] = userRoute(async ({ uid, b }) => { const gid = +b.gid, g = GAMES[gid]; if (!g || !TE.SHOE_KINDS.includes(g.kind)) return [400, { err: 'game' }];
  if (limited('shoe:' + uid, 10)) return [429, { err: 'rate', msg: 'Slow down a little' }];
  const k = 'shoe:' + uid + ':' + gid; const old = await repo.kvGet(k, null); const sh = TE.newShoe((old ? old.no : 0) + 1); await repo.kvSet(k, sh); return [200, { shoe: TE.shoeInfo(sh) }]; });
R['POST /api/gamble'] = userRoute(async ({ uid, b }) => {
  const gid = +b.gid, g = GAMES[gid]; if (!g || !g.slot) return [400, { err: 'game' }];
  if (limited('act:' + uid, 15, 1000)) return [429, { err: 'rate', msg: 'Slow down a little' }];
  if (busy.has(uid)) return [429, { err: 'busy' }]; busy.add(uid);
  try {
    let out; await repo.withUser(uid, async (u, t) => {
      const r = E.gamble(u, gid, String(b.pick || '')); if (r.err) { out = [400, r]; return { skip: true }; }
      await repo.gameStat(gid, { spins: 0, bet: r.stake, win: r.win, fs: 0 }, t); await repo.daily('bet', r.stake, t); if (r.win) await repo.daily('win', r.win, t);
      u.st.bet = r2(u.st.bet + r.stake); u.st.win = r2(u.st.win + r.win); u.last = now();
      await repo.roundInsert({ t: now(), uid, name: u.name, gid, bet: r.stake, cost: r.stake, win: r.win, ev: 'gamble', bal: u.bal }, t);
      out = [200, r];
    });
    return out;
  } finally { busy.delete(uid); }
});
R['GET /api/rg'] = userRoute(async ({ uid }) => { const u = await repo.userById(uid); return [200, rgView(u)]; });
R['POST /api/rg'] = userRoute(async ({ uid, b }) => { let out; await repo.withUser(uid, async (u, t) => { u.rg = u.rg || {}; const cur = rgLimit(u);
    if (b.limit !== undefined) { const L = Math.max(0, Math.min(1440, Math.round(+b.limit || 0)));
      if (L && (!cur || L < cur)) { u.rg.limit = L; delete u.rg.pend; } else if (L !== cur) u.rg.pend = { limit: L, at: now() + 864e5 }; }
    if (b.pause) { const days = [1, 7, 30, 90].includes(+b.pause) ? +b.pause : 0; if (days) { u.rg.until = Math.max(u.rg.until || 0, now() + days * 864e5); await repo.audit('self_exclusion', u.name + ' ' + days + 'd'); } }
    out = [200, rgView(u)]; }); return out; });
R['POST /api/heartbeat'] = userRoute(async ({ uid, b }) => { // playtime per game, sent every 30s while a game is open
  const gid = +b.gid, secs = Math.max(0, Math.min(60, Math.round(+b.secs || 0))); if (!GAMES[gid] || !secs) return [200, { ok: true }];
  if (limited('hb:' + uid, 4, 60000)) return [200, { ok: true }];
  await repo.gamePlaytime(gid, secs); await repo.gameDaily(gid, uid, 0, secs);
  let rg = null; await repo.withUser(uid, async u => { const d = dayKey(now()); u.rg = u.rg || {}; if (u.rg.day !== d) { u.rg.day = d; u.rg.secs = 0; } u.rg.secs += secs; rg = rgView(u); });
  return [200, { ok: true, rg }];
});

// --- store, bonuses, limits ---
R['GET /api/store'] = userRoute(async ({ uid }) => { const u = await repo.userById(uid); return [200, { packages: SET.packages.map(p => Object.assign({}, p, { coins: pkgCoins(p), base: p.coins, sku: IAP.skuOf(p) })), iap: IAP.enabled, promo: promoActive(), bonus: { amount: SET.bonusAmount, nextAt: u.bonusAt || 0, now: now() }, sandbox: SET.sandbox }]; });
R['POST /api/bonus'] = userRoute(async ({ uid, ip, b }) => {
  let out; await repo.withUser(uid, async (u, t) => {
    if (now() < (u.bonusAt || 0)) { out = [400, { err: 'early', msg: 'Bonus not ready yet' }]; return { skip: true }; }
    const evb = eventActive() ? eventActive().bonus : 1; u.bal = r2(u.bal + SET.bonusAmount * evb); u.bonusAt = now() + SET.bonusHours * 3600e3; u.bonusPushed = false; await addTx(u, 'free_bonus', SET.bonusAmount * evb, '', t);
    out = [200, { user: pubUser(u), nextAt: u.bonusAt }];
  });
  return out;
});
R['POST /api/orders'] = userRoute(async ({ uid, b }) => {
  const u = await repo.userById(uid); const p = SET.packages.find(x => x.id === b.pkg); if (!p) return [400, { err: 'pkg', msg: 'Unknown package' }];
  const lim = effLimit(u); if (lim) { const spent = await repo.monthSpend(uid); if (spent + p.price > lim + 1e-9) return [400, { err: 'limit', msg: 'This purchase would exceed your monthly spending limit of $' + lim.toFixed(2) + ' ($' + spent.toFixed(2) + ' spent this month)' }]; }
  const pr = promoActive();
  const o = { id: 'LV' + (await repo.next('order', 100000)), uid, name: u.name, pkg: p.id, price: p.price, coins: pkgCoins(p), promo: pr ? pr.label || ('+' + pr.pct + '%') : null, status: 'pending', provider: SET.sandbox ? 'sandbox' : 'store', created: now(), paidAt: null };
  await repo.orderInsert(o); return [200, { order: o }];
});
async function creditOrder(id, by) {
  return repo.tx(async t => {
    const o = await repo.order(id, t, true); if (!o || o.status !== 'pending') return null;
    const u = await repo.userById(o.uid, t, true); if (!u) return null;
    o.status = 'paid'; o.paidAt = now(); o.by = by; await repo.orderSave(o, t);
    u.bal = r2(u.bal + o.coins); u.st.dep = r2(u.st.dep + o.price); u.st.depCount++; await repo.saveUser(u, t);
    await addTx(u, 'purchase', o.coins, o.id, t); await repo.daily('rev', o.price, t); await repo.daily('orders', 1, t);
    return { o, u };
  });
}
const dailyInfo = u => { const today = dayKey(), yest = dayKey(now() - 864e5); const claimed = u.lastDaily === today; const cont = u.lastDaily === yest || claimed; const day = claimed ? u.streak : (cont ? ((u.streak || 0) % 7) + 1 : 1); return { available: !claimed, day, rewards: DAILY }; };
R['GET /api/daily'] = userRoute(async ({ uid }) => [200, dailyInfo(await repo.userById(uid))]);
R['POST /api/daily'] = userRoute(async ({ uid, ip, b }) => {
  const fp = fpOf(b);
  let out; await repo.withUser(uid, async (u, t) => {
    const d = dailyInfo(u); if (!d.available) { out = [400, { err: 'claimed', msg: 'Come back tomorrow' }]; return { skip: true }; }
    // Anti-abuse: one daily reward per device, and a cap per network address, per day.
    if (fp && !(await repo.claim('daily_fp', fp, 1, t))) { out = [400, { err: 'device', msg: 'Today’s reward was already collected on this device' }]; return { skip: true }; }
    if (!(await repo.claim('daily_ip', ip, SET.maxDailyClaimsPerIp, t))) { out = [400, { err: 'ip', msg: 'Daily reward limit reached for this network' }]; return { skip: true }; }
    u.streak = d.day; u.lastDaily = dayKey(); u.dailyPushed = false; const wh = H ? H.dailyWheel(u, d.day) : null; const amt = wh ? wh.amount : DAILY[d.day - 1]; u.bal = r2(u.bal + amt); await addTx(u, 'daily_reward', amt, 'Day ' + d.day + (wh ? ' wheel' : ''), t);
    const e = EN.onRound(u, { gid: -1, cost: 0, win: 0, bet: 0 }); // checks the 7-day streak achievement
    out = [200, Object.assign(dailyInfo(u), { user: pubUser(u), amount: amt, wheel: wh, ach: e.ach })];
  });
  return out;
});
function effLimit(u) { if (u.limPending && now() >= u.limPending.at) { u.limit = u.limPending.v; u.limPending = null; } return u.limit || 0; }
R['GET /api/limits'] = userRoute(async ({ uid }) => { const u = await repo.userById(uid); return [200, { limit: effLimit(u), pending: u.limPending || null, spent: await repo.monthSpend(uid) }]; });
R['POST /api/limits'] = userRoute(async ({ uid, b }) => {
  const v = b.limit === null || b.limit === 0 ? 0 : +b.limit; if (!(v >= 0) || v > 100000) return [400, { err: 'bad', msg: 'Invalid limit' }];
  let out; await repo.withUser(uid, async u => {
    const cur = effLimit(u);
    if (cur && (v === 0 || v > cur)) { u.limPending = { v, at: now() + 864e5 }; out = { limit: cur, pending: u.limPending, msg: 'Raising or removing a limit takes effect in 24 hours' }; }
    else { u.limit = v; u.limPending = null; out = { limit: v, pending: null }; }
  });
  out.spent = await repo.monthSpend(uid); return [200, out];
});
// Native app builds verify Apple App Store / Google Play receipts here, then credit the order (see README).
R['POST /api/iap/verify'] = userRoute(async ({ uid, b }) => {
  const plat = b.platform === 'ios' ? 'ios' : b.platform === 'android' ? 'android' : null;
  if (!plat) return [400, { err: 'platform', msg: 'Unknown platform' }];
  if (!IAP.enabled[plat]) return [501, { err: 'not_configured', msg: 'Store receipt verification is not configured on this server' }];
  const o = await repo.order(String(b.order || '')); if (!o || o.uid !== uid) return [400, { err: 'order', msg: 'Unknown order' }];
  const p = SET.packages.find(x => x.id === o.pkg); if (!p) return [400, { err: 'pkg', msg: 'Unknown package' }];
  const sku = IAP.skuOf(p); if (b.productId && b.productId !== sku) return [400, { err: 'product', msg: 'Product does not match the order' }];
  if (o.status === 'paid') return [200, { already: true, user: pubUser(await repo.userById(uid)) }];
  if (o.status !== 'pending') return [400, { err: 'order', msg: 'Order not payable' }];
  let v; try { v = plat === 'ios' ? await IAP.apple(b.receipt, sku) : await IAP.google(b.token, sku); } catch (e) { return [502, { err: 'store', msg: 'Could not reach the store, please try again' }]; }
  if (!v || v.err) return [400, v || { err: 'invalid' }];
  const key = 'iaptx:' + v.txId; if (await repo.kvGet(key, null)) return [400, { err: 'used', msg: 'This purchase was already used' }];
  await repo.kvSet(key, { order: o.id, uid, at: now(), sandbox: !!v.sandbox });
  const r = await creditOrder(o.id, 'iap:' + plat + (v.sandbox ? ':sandbox' : '')); if (!r) return [400, { err: 'order', msg: 'Order not payable' }];
  return [200, { user: pubUser(r.u), coins: r.o.coins, order: r.o.id }];
});

// --- engagement ---
R['GET /api/onboarding'] = userRoute(async ({ uid }) => { const u = await repo.userById(uid); return [200, EN.onbView(u)]; });
R['POST /api/onboarding/hide'] = userRoute(async ({ uid }) => { await repo.withUser(uid, async u => { u.onb = Object.assign(u.onb || {}, { hide: true }); }); return [200, { ok: true }]; });
R['GET /api/missions'] = userRoute(async ({ uid }) => { let v; await repo.withUser(uid, async u => { v = EN.missionView(u); }); return [200, { missions: v, achievements: EN.achView(await repo.userById(uid)) }]; });
R['POST /api/piggy'] = userRoute(async ({ uid }) => {
  let out; await repo.withUser(uid, async (u, t) => {
    const v = r2(u.pig || 0);
    if (now() < (u.pigAt || 0)) { out = [400, { err: 'early', msg: 'The piggy bank can be broken once a day' }]; return { skip: true }; }
    if (v < PIG.min) { out = [400, { err: 'low', msg: 'Save at least ' + PIG.min + ' coins first' }]; return { skip: true }; }
    u.bal = r2(u.bal + v); u.pig = 0; u.pigAt = now() + PIG.coolH * 3600e3; await addTx(u, 'piggy', v, '', t);
    out = [200, { amount: v, user: pubUser(u) }];
  });
  return out;
});
R['POST /api/missions/claim'] = userRoute(async ({ uid, b }) => {
  let out; await repo.withUser(uid, async (u, t) => { const r = EN.claimMission(u, String(b.id || '')); if (r.err) { out = [400, r]; return { skip: true }; } await addTx(u, 'mission', r.reward, r.title, t); out = [200, { reward: r.reward, user: pubUser(u), missions: EN.missionView(u) }]; });
  return out;
});
R['GET /api/leaderboard'] = userRoute(async ({ uid, q }) => {
  const wk = EN.weekKey(); const board = q.get('board') === 'mult' ? 'mult' : 'won';
  const end = new Date(wk + 'T00:00:00').getTime() + 7 * 864e5;
  return [200, { week: wk, ends: end, board, prizes: EN.WEEKLY_PRIZES, top: await repo.top('w:' + wk + ':' + board, 50), me: await repo.rank('w:' + wk + ':' + board, uid) }];
});
R['GET /api/tournaments'] = userRoute(async ({ uid }) => {
  const ts = (await repo.kvGet('tournaments', [])).filter(x => x.end > now() - 3 * 864e5).sort((a, b) => a.start - b.start);
  const out = []; for (const x of ts) out.push(Object.assign({}, x, { top: await repo.top('t:' + x.id, 10), me: await repo.rank('t:' + x.id, uid), live: x.start <= now() && x.end > now() }));
  return [200, { tournaments: out, now: now() }];
});
R['GET /api/notes'] = userRoute(async ({ uid }) => [200, { notes: await repo.notes(uid) }]);
R['POST /api/notes/seen'] = userRoute(async ({ uid }) => { await repo.notesSeen(uid); return [200, { ok: true }]; });
R['POST /api/push/subscribe'] = userRoute(async ({ uid, b }) => {
  const s = b.sub; if (!s || !/^https:\/\//.test(s.endpoint || '') || !s.keys || !s.keys.p256dh || !s.keys.auth) return [400, { err: 'sub', msg: 'Invalid subscription' }];
  await repo.pushAdd(uid, { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }); return [200, { ok: true }];
});
R['POST /api/push/unsubscribe'] = userRoute(async ({ b }) => { if (b.endpoint) await repo.pushDel(String(b.endpoint)); return [200, { ok: true }]; });
R['POST /api/tour/done'] = userRoute(async ({ uid }) => { await repo.withUser(uid, async u => { u.tour = true; }); return [200, { ok: true }]; });

// sandbox payment (dynamic path)
async function dynRoute(c) {
  const m = c.p.match(/^\/api\/orders\/([A-Z0-9]+)\/sandbox-pay$/);
  if (c.method === 'POST' && m) {
    const uid = await authUser(c.req); if (!uid) return [401, { err: 'auth' }];
    if (!SET.sandbox) return [403, { err: 'sandbox_off', msg: 'Sandbox payments are disabled' }];
    const o = await repo.order(m[1]); if (!o || o.uid !== uid || o.status !== 'pending') return [400, { err: 'order', msg: 'Order not payable' }];
    const r = await creditOrder(o.id, 'sandbox'); if (!r) return [400, { err: 'order', msg: 'Order not payable' }];
    return [200, { user: pubUser(r.u), order: r.o }];
  }
  return null;
}

// ---------- admin ----------
async function overview() {
  const day = now() - 864e5; const games = await repo.gamesAll(); const gm = {}; games.forEach(x => gm[x.id] = x);
  const g = GLIST.map(x => { const s = gm[x.id] || { spins: 0, bet: 0, win: 0, fs: 0, enabled: true }; return { id: x.id, name: x.name, e: x.e || x.kind, label: glabel(x), theo: theoRTP(x), enabled: s.enabled, tag: s.tag == null ? x.tag : s.tag, spins: s.spins, bet: r2(s.bet), win: r2(s.win), fs: s.fs, playsec: s.playsec || 0, rtp: s.bet ? r2(s.win / s.bet * 100) : null, ggr: r2(s.bet - s.win) }; });
  const totBet = g.reduce((a, x) => a + x.bet, 0), totWin = g.reduce((a, x) => a + x.win, 0);
  const all = await repo.revenue(0), d1 = await repo.revenue(day), r24 = await repo.roundStats(day);
  const users = await repo.countUsers();
  const act = Number((await drv.get('SELECT COUNT(*) AS n FROM users WHERE last>=?', [day])).n), nw = Number((await drv.get('SELECT COUNT(*) AS n FROM users WHERE created>=?', [day])).n);
  const wallets = Number((await drv.get('SELECT COUNT(*) AS n FROM users')).n) ? await walletsTotal() : 0;
  return { players: users, active24: act, new24: nw, revenue: all.rev, revenue24: d1.rev, orders: all.n, paidOrders: all.n, payers: all.payers, coinsSold: all.coins, coinsInWallets: wallets,
    spins: g.reduce((a, x) => a + x.spins, 0), bet: r2(totBet), win: r2(totWin), rtp: totBet ? r2(totWin / totBet * 100) : null, spins24: r24.n, bet24: r24.bet, win24: r24.win,
    games: g, settings: SET, days: await repo.days(14), db: drv.kind };
}
async function walletsTotal() { const r = await drv.get('SELECT SUM(bal) AS s FROM users'); return r2((r && +r.s) || 0); }
// ledger check: every coin movement is in tx (bonuses, purchases, rewards, admin) or rounds (stakes/wins).
// For each player: sum(tx) + sum(round win - cost) must equal the balance. Live baccarat stakes are in rounds too.
async function ledgerCheck(limit) {
  const users = await drv.all('SELECT id,name_lc,bal FROM users ORDER BY last DESC LIMIT ?', [limit || 2000]); const bad = [];
  for (const u of users) { const a = await drv.get('SELECT COALESCE(SUM(amount),0) AS s FROM tx WHERE uid=?', [u.id]); const b = await drv.get('SELECT COALESCE(SUM(win-cost),0) AS s FROM rounds WHERE uid=?', [u.id]);
    let expect = r2(+a.s + +b.s), diff = r2(+u.bal - expect);
    if (Math.abs(diff) > 0.011) { // a table round still in play has its stake taken but no round row yet; live-table bets wait for the deal
      const full = await repo.userById(+u.id); if (!full || full.deleted || /^deleted_/.test(u.name_lc)) continue;
      const pend = r2((full.tg ? full.tgStake || 0 : 0) + (LIVE ? LIVE.pendingOf(+u.id) : 0)); expect = r2(expect - pend); diff = r2(+u.bal - expect);
      if (Math.abs(diff) > 0.011) bad.push({ id: +u.id, name: u.name_lc, bal: +u.bal, ledger: expect, pending: pend, diff }); } }
  return { checked: users.length, mismatched: bad.length, list: bad.slice(0, 200) }; }
ADMIN['GET /api/admin/overview'] = async () => [200, await overview()];
ADMIN['GET /api/admin/players'] = async ({ q }) => {
  const list = await repo.listUsers({ q: (q.get('q') || '').trim() || null, limit: 500 });
  return [200, { players: list.map(u => ({ id: u.id, name: u.name, email: u.email || null, emailVerified: !!u.emailVerified, phone: u.phone || null, social: u.googleSub ? 'Google' : u.appleSub ? 'Apple' : '', bal: u.bal, level: E.levelOf(u.xp || 0), created: u.created, last: u.last, banned: !!u.banned, flagged: !!u.flagged, fs: u.fs, st: u.st })), total: await repo.countUsers() }];
};
ADMIN['GET /api/admin/orders'] = async ({ q }) => [200, { orders: await repo.orders({ status: q.get('status') || null, from: +q.get('from') || 0, to: +q.get('to') || 0 }) }];
ADMIN['GET /api/admin/ledger'] = async ({ q }) => [200, await ledgerCheck(+q.get('limit') || 2000)];
ADMIN['GET /api/admin/rounds'] = async ({ q }) => { const gid = q.get('gid'); const rows = await repo.rounds({ uid: +q.get('uid') || 0, gid: gid !== null && gid !== '' ? +gid : null, from: +q.get('from') || 0, to: +q.get('to') || 0 }); return [200, { rounds: rows.map(r => Object.assign({ game: GAMES[r.gid] && GAMES[r.gid].name }, r)) }]; };
ADMIN['GET /api/admin/tx'] = async ({ q }) => [200, { tx: await repo.txList({ uid: +q.get('uid') || 0 }) }];
ADMIN['GET /api/admin/audit'] = async () => [200, { audit: await repo.auditList() }];
ADMIN['POST /api/admin/settings'] = async ({ b }) => {
  const s = Object.assign({}, SET);
  ['signupBonus', 'bonusAmount', 'bonusHours', 'maxBet', 'tableMin', 'tableMax', 'verifyBonus', 'maxAccountsPerDevice', 'maxDailyClaimsPerIp'].forEach(k => { if (b[k] != null && isFinite(+b[k]) && +b[k] >= 0) s[k] = +b[k]; });
  if (b.sandbox != null) s.sandbox = !!b.sandbox;
  if (Array.isArray(b.packages)) {
    if (!b.packages.every(p => p && /^[a-z0-9_-]{1,16}$/i.test(p.id) && +p.price > 0 && +p.coins > 0)) return [400, { err: 'packages', msg: 'Each package needs id, price > 0 and coins > 0' }];
    s.packages = b.packages.map(p => ({ id: String(p.id), price: r2(+p.price), coins: Math.round(+p.coins), tag: p.tag ? String(p.tag).slice(0, 16) : undefined }));
  }
  if (b.event !== undefined) { const p = b.event; s.event = p && (+p.xp > 1 || +p.bonus > 1) ? { xp: Math.min(5, Math.max(1, +p.xp || 1)), bonus: Math.min(5, Math.max(1, +p.bonus || 1)), label: String(p.label || '活动 Event').slice(0, 40), start: +p.start || now(), end: +p.end || 0 } : null; }
  if (b.promo !== undefined) { const p = b.promo; s.promo = p && +p.pct > 0 ? { pct: Math.min(500, +p.pct), label: String(p.label || ('+' + p.pct + '% coins')).slice(0, 40), start: +p.start || now(), end: +p.end || 0 } : null; }
  SET = s; await repo.kvSet('settings', SET); await repo.audit('settings', JSON.stringify(b).slice(0, 1500)); return [200, { settings: SET }];
};
async function adminDyn(c) {
  const { method, p, b } = c; let m;
  if (method === 'POST' && (m = p.match(/^\/api\/admin\/players\/(\d+)\/adjust$/))) {
    const amt = r2(+b.amount); if (!isFinite(amt) || !amt) return [400, { err: 'bad', msg: 'Invalid amount' }];
    if (!String(b.reason || '').trim()) return [400, { err: 'reason', msg: 'A reason is required' }];
    let out; await repo.withUser(+m[1], async (u, t) => { if (!u) { out = [404, { err: 'nf' }]; return; } u.bal = r2(Math.max(0, u.bal + amt)); await addTx(u, 'admin_adjust', amt, String(b.reason).slice(0, 120), t); out = [200, { ok: true, bal: u.bal }]; });
    if (out[0] === 200) await repo.audit('adjust', '#' + m[1] + ' ' + amt + ' (' + b.reason + ')'); return out;
  }
  if (method === 'POST' && (m = p.match(/^\/api\/admin\/players\/(\d+)\/ban$/))) {
    let name; await repo.withUser(+m[1], async u => { if (!u) return; u.banned = !!b.banned; name = u.name; }); if (!name) return [404, { err: 'nf' }];
    if (b.banned) await repo.sessionsDelUser(+m[1]); await repo.audit(b.banned ? 'ban' : 'unban', name); return [200, { ok: true }];
  }
  if (method === 'GET' && (m = p.match(/^\/api\/admin\/players\/(\d+)$/))) {
    const u = await repo.userById(+m[1]); if (!u) return [404, { err: 'nf' }];
    const devs = await repo.devicesOf(u.id); const linked = new Set(); for (const d of devs) for (const x of await repo.usersOnDevice(d.fp)) if (x !== u.id) linked.add(x);
    return [200, { user: Object.assign(pubUser(u), { created: u.created, last: u.last, st: u.st, banned: !!u.banned, flagged: !!u.flagged, ach: Object.keys(u.ach || {}).length, streak: u.streak || 0 }), devices: devs, linked: [...linked] }];
  }
  if (method === 'POST' && (m = p.match(/^\/api\/admin\/orders\/([A-Z0-9]+)\/status$/))) {
    const st = b.status;
    if (st === 'paid') { const r = await creditOrder(m[1], 'admin'); if (!r) return [400, { err: 'state', msg: 'Only pending orders can be marked paid' }]; await repo.audit('order_paid', m[1]); return [200, { order: r.o }]; }
    let out = null;
    await repo.tx(async t => {
      const o = await repo.order(m[1], t, true); if (!o) { out = [404, { err: 'nf' }]; return; }
      if (st === 'refunded') {
        if (o.status !== 'paid') { out = [400, { err: 'state', msg: 'Only paid orders can be refunded' }]; return; }
        o.status = 'refunded'; o.refundedAt = now(); await repo.orderSave(o, t);
        const u = await repo.userById(o.uid, t, true); if (u) { const take = Math.min(u.bal, o.coins); u.bal = r2(u.bal - take); u.st.dep = r2(u.st.dep - o.price); await repo.saveUser(u, t); await addTx(u, 'refund', -take, o.id, t); }
        await repo.daily('rev', -o.price, t); await repo.daily('orders', -1, t); out = [200, { order: o }];
      } else if (st === 'cancelled') { if (o.status !== 'pending') { out = [400, { err: 'state', msg: 'Only pending orders can be cancelled' }]; return; } o.status = 'cancelled'; await repo.orderSave(o, t); out = [200, { order: o }]; }
      else out = [400, { err: 'status' }];
    });
    if (out[0] === 200) await repo.audit('order_' + st, m[1]); return out;
  }
  if (method === 'POST' && (m = p.match(/^\/api\/admin\/games\/(\d+)$/))) {
    if (!GAMES[+m[1]]) return [404, { err: 'nf' }];
    const f = {}; if (b.enabled != null) f.enabled = !!b.enabled; if (b.tag !== undefined) f.tag = ['hot', 'new', ''].includes(b.tag) ? b.tag : null;
    await repo.gameSet(+m[1], f); await loadGames(); await repo.audit('game', GAMES[m[1]].name + ' ' + JSON.stringify(b)); return [200, { ok: true }];
  }
  if (method === 'POST' && (m = p.match(/^\/api\/admin\/tournaments\/([a-z0-9]+)\/delete$/))) {
    const ts = await repo.kvGet('tournaments', []); const tr = ts.find(x => x.id === m[1]); if (!tr) return [404, { err: 'nf' }];
    if (tr.start <= now()) return [400, { err: 'started', msg: 'Only tournaments that have not started can be deleted' }];
    await repo.kvSet('tournaments', ts.filter(x => x.id !== m[1])); await repo.audit('tournament_deleted', tr.name); return [200, { ok: true }];
  }
  return null;
}
// Campaigns: gift coins and/or send a message to an audience.
async function audience(a) {
  a = a || {}; const n = now();
  if (a.type === 'level') return repo.userIdsWhere('level>=? AND banned=0', [+a.min || 1]);
  if (a.type === 'inactive') return repo.userIdsWhere('last<? AND banned=0', [n - (+a.days || 7) * 864e5]);
  if (a.type === 'active') return repo.userIdsWhere('last>=? AND banned=0', [n - (+a.days || 7) * 864e5]);
  if (a.type === 'payers') return repo.userIdsWhere('paid>0 AND banned=0', []);
  if (a.type === 'nonpayers') return repo.userIdsWhere('paid<=0 AND banned=0', []);
  if (a.type === 'user') return [+a.id].filter(Boolean);
  return repo.userIdsWhere('banned=0', []);
}
ADMIN['POST /api/admin/campaign/preview'] = async ({ b }) => [200, { count: (await audience(b.audience)).length }];
ADMIN['POST /api/admin/campaign'] = async ({ b }) => {
  const ids = await audience(b.audience); const coins = r2(+b.coins || 0); const title = String(b.title || '').slice(0, 80), msg = String(b.message || '').slice(0, 300);
  if (!ids.length) return [400, { err: 'empty', msg: 'No players match this audience' }];
  if (!title && !coins) return [400, { err: 'empty', msg: 'Add a title/message or a coin gift' }];
  if (coins < 0 || coins > 1e6) return [400, { err: 'coins', msg: 'Coins must be between 0 and 1,000,000' }];
  let pushed = 0;
  for (const id of ids) {
    if (coins) await repo.withUser(id, async (u, t) => { if (!u) return false; u.bal = r2(u.bal + coins); await addTx(u, 'campaign', coins, title || 'Gift', t); });
    if (title) { await repo.noteAdd(id, title + (coins ? ' (+' + coins.toLocaleString() + ' coins)' : ''), msg); if (b.push) for (const s of await repo.pushOf(id)) { const st = await N.sendPush(repo, s, { title, body: msg }); if (st >= 200 && st < 300) pushed++; } }
  }
  await repo.audit('campaign', title + ' → ' + ids.length + ' players, ' + coins + ' coins each, audience ' + JSON.stringify(b.audience));
  return [200, { players: ids.length, coins, pushed }];
};
ADMIN['GET /api/admin/tournaments'] = async () => { const ts = await repo.kvGet('tournaments', []); const out = []; for (const x of ts) out.push(Object.assign({}, x, { top: await repo.top('t:' + x.id, 10) })); return [200, { tournaments: out.sort((a, b) => b.start - a.start) }]; };
ADMIN['POST /api/admin/tournaments'] = async ({ b }) => {
  const name = String(b.name || '').trim().slice(0, 60), start = +b.start, end = +b.end; const prizes = (Array.isArray(b.prizes) ? b.prizes : String(b.prizes || '').split(',')).map(x => Math.round(+x)).filter(x => x > 0).slice(0, 50);
  if (!name || !(end > start) || end < now()) return [400, { err: 'bad', msg: 'Name, start and a future end time are required' }];
  if (!prizes.length) return [400, { err: 'prizes', msg: 'Add at least one prize' }];
  const metric = ['won', 'mult', 'rounds'].includes(b.metric) ? b.metric : 'won'; const filter = /^(all|slots|tables|engine:(tumble|cluster|lines|ways|classic3|holdwin))$/.test(b.filter || '') ? b.filter : 'all';
  const ts = await repo.kvGet('tournaments', []); const tr = { id: Date.now().toString(36), name, start, end, metric, filter, prizes, minBet: Math.max(0, +b.minBet || 0), paid: false };
  ts.push(tr); await repo.kvSet('tournaments', ts); await repo.audit('tournament_created', name); return [200, { tournament: tr }];
};
ADMIN['GET /api/admin/analytics'] = async () => {
  const n = now(); const days = await repo.days(30); const today = dayKey();
  const cnt = async (sql, p) => Number((await drv.get(sql, p)).n);
  const dau = await cnt('SELECT COUNT(*) AS n FROM daily_players WHERE day=?', [today]);
  const wau = await cnt('SELECT COUNT(DISTINCT uid) AS n FROM daily_players WHERE day>=?', [dayKey(n - 6 * 864e5)]);
  const mau = await cnt('SELECT COUNT(DISTINCT uid) AS n FROM daily_players WHERE day>=?', [dayKey(n - 29 * 864e5)]);
  const cohorts = [];
  for (let i = 30; i >= 0; i--) {
    const d0 = new Date(dayKey(n - i * 864e5) + 'T00:00:00').getTime(), d1 = d0 + 864e5;
    const size = await cnt('SELECT COUNT(*) AS n FROM users WHERE created>=? AND created<?', [d0, d1]); if (!size) continue;
    const ret = async k => { if (d0 + k * 864e5 > n) return null; return cnt('SELECT COUNT(*) AS n FROM daily_players dp JOIN users u ON u.id=dp.uid WHERE dp.day=? AND u.created>=? AND u.created<?', [dayKey(d0 + k * 864e5 + 3600e3), d0, d1]); };
    const r1 = await ret(1), r7 = await ret(7), r30 = await ret(30);
    cohorts.push({ day: dayKey(d0 + 3600e3), size, d1: r1 == null ? null : r2(r1 / size * 100), d7: r7 == null ? null : r2(r7 / size * 100), d30: r30 == null ? null : r2(r30 / size * 100) });
  }
  const users = await repo.countUsers(); const rev = await repo.revenue(0); const rev30 = await repo.revenue(n - 30 * 864e5);
  const activeSum = days.reduce((a, d) => a + d.active, 0);
  const pg = await drv.all('SELECT gid, COUNT(DISTINCT uid) AS players, SUM(rounds) AS rounds, SUM(secs) AS secs FROM game_daily WHERE day>=? GROUP BY gid', [dayKey(n - 29 * 864e5)]);
  const games = pg.map(r => ({ gid: Number(r.gid), name: GAMES[r.gid] ? GAMES[r.gid].name : '?', players: Number(r.players), rounds: Number(r.rounds), secs: Number(r.secs), avgMin: Number(r.players) ? r2(Number(r.secs) / Number(r.players) / 60) : 0 })).sort((a, b) => b.players - a.players);
  return [200, { dau, wau, mau, stickiness: mau ? r2(dau / mau * 100) : null, users, payers: rev.payers, conversion: users ? r2(rev.payers / users * 100) : 0, arppu: rev.payers ? r2(rev.rev / rev.payers) : 0, arpdau: activeSum ? r2(rev30.rev / activeSum) : 0, revenue30: rev30.rev, cohorts, games, days, pushSubs: await repo.pushCount() }];
};
ADMIN['GET /api/admin/risk'] = async () => {
  const devs = await repo.riskDevices(2), ips = await repo.riskIps(3);
  const flagged = (await repo.listUsers({ limit: 2000 })).filter(u => u.flagged).map(u => ({ id: u.id, name: u.name, created: u.created }));
  return [200, { devices: devs.map(d => ({ fp: d.fp, accounts: Number(d.accounts), last: Number(d.last), ip: d.ip })), ips: ips.map(d => ({ ip: d.ip, accounts: Number(d.accounts), last: Number(d.last) })), flagged }];
};
ADMIN['GET /api/admin/system'] = async () => {
  const [, h] = await R['GET /api/health']();
  return [200, { health: h, errors: await repo.errorList(100), outbox: await repo.outboxList(50), config: { db: drv.kind, mail: N.mailConfigured(), sms: N.smsConfigured(), google: !!process.env.GOOGLE_CLIENT_ID, apple: !!process.env.APPLE_CLIENT_ID, alerts: !!process.env.ALERT_WEBHOOK, publicUrl: PUBLIC_URL || null, node: process.version } }];
};
ADMIN['GET /api/admin/alerts'] = async () => [200, { alerts: recentAlerts }];
ADMIN['POST /api/admin/test-alert'] = async () => { await alert('Test alert from the admin panel'); return [200, { ok: true, configured: !!process.env.ALERT_WEBHOOK }]; };

// ---------- static ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.woff2': 'font/woff2' };
const zlib = require('zlib'); const GZ = new Map();
function serveStatic(req, res, pathname) {
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin.html';
  if (pathname === '/privacy') pathname = '/legal/privacy.html'; if (pathname === '/terms') pathname = '/legal/terms.html';
  let f; try { f = path.normalize(path.join(PUB, decodeURIComponent(pathname))); } catch (e) { res.writeHead(400); return res.end(); }
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    const ext = path.extname(f); const cache = /\/assets\//.test(f.replace(/\\/g, '/')) ? 'public, max-age=86400' : 'no-cache';
    const H = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': cache, 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'same-origin', Vary: 'Accept-Encoding' };
    // text files are sent gzip-compressed (cached in memory per file version) — the scripts shrink to about a quarter
    if (/\.(js|html|css|json|svg|txt|webmanifest)$/.test(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      fs.stat(f, (e2, st) => { const k = f + ':' + (st ? st.mtimeMs : 0); let z = GZ.get(k); if (!z) { z = zlib.gzipSync(data, { level: 7 }); GZ.set(k, z); if (GZ.size > 400) GZ.clear(); }
        H['Content-Encoding'] = 'gzip'; res.writeHead(200, H); res.end(z); }); return; }
    res.writeHead(200, H);
    res.end(data);
  });
}

// ---------- startup ----------
async function loadSettings() { SET = Object.assign({}, DEFAULT_SETTINGS, await repo.kvGet('settings', {})); if (SET.maxBet === 100) SET.maxBet = DEFAULT_SETTINGS.maxBet; /* v5.6: old default raised */ }
async function loadGames() { const all = await repo.gamesAll(); GSTATE = {}; all.forEach(g => GSTATE[g.id] = g); }
async function migrateJson() {
  const f = path.join(DATA, 'db.json'); if (!fs.existsSync(f) || (await repo.countUsers()) > 0) return;
  console.log('Migrating data/db.json to the new database...');
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  await repo.tx(async t => {
    for (const k in (d.users || {})) { const u = d.users[k]; u.id = Number(u.id); u.level = E.levelOf(u.xp || 0); u.st = u.st || { spins: 0, bet: 0, win: 0, dep: 0, depCount: 0 }; await repo.insertUser(u, t); }
    for (const o of d.orders || []) await repo.orderInsert(o, t);
    for (const r of (d.rounds || []).slice(-5000)) await repo.roundInsert(r, t);
    for (const e of (d.tx || []).slice(-20000)) await repo.txInsert(e, t);
    for (const id in (d.games || {})) { const g = d.games[id]; await t.run('UPDATE games SET enabled=?,tag=?,spins=?,bet=?,win=?,fs=? WHERE id=?', [g.enabled === false ? 0 : 1, g.tag, g.spins || 0, g.bet || 0, g.win || 0, g.fs || 0, +id]); }
    for (const day in (d.daily || {})) { const x = d.daily[day]; await t.run('INSERT INTO daily(day,bet,win,rounds,rev,orders,signups) VALUES(?,?,?,?,?,?,?) ON CONFLICT(day) DO NOTHING', [day, x.bet || 0, x.win || 0, x.rounds || 0, x.rev || 0, x.orders || 0, x.signups || 0]); for (const uid of x.players || []) await t.run('INSERT INTO daily_players(day,uid) VALUES(?,?) ON CONFLICT(day,uid) DO NOTHING', [day, uid]); }
    if (d.settings) await repo.kvSet('settings', Object.assign({}, DEFAULT_SETTINGS, d.settings), t);
    const maxU = Math.max(1000, ...Object.keys(d.users || {}).map(Number)); await t.run('INSERT INTO counters(k,n) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET n=excluded.n', ['user', maxU]);
    const maxO = Math.max(100000, ...(d.orders || []).map(o => +String(o.id).replace(/\D/g, '') || 0)); await t.run('INSERT INTO counters(k,n) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET n=excluded.n', ['order', maxO]);
  });
  fs.renameSync(f, f + '.migrated'); console.log('Migration done (old file kept as data/db.json.migrated).');
}
async function backup() {
  if (drv.kind !== 'sqlite') return; // PostgreSQL: use your provider's backups / pg_dump
  try {
    const dir = path.join(DATA, 'backups'); fs.mkdirSync(dir, { recursive: true });
    const d = new Date(); const name = 'luckyvault-' + dayKey().replace(/-/g, '') + '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '.db';
    const target = path.join(dir, name).replace(/'/g, "''"); await drv.exec("VACUUM INTO '" + target + "'");
    const all = fs.readdirSync(dir).filter(f => /^luckyvault-.*\.db$/.test(f)).sort(); while (all.length > 14) fs.unlinkSync(path.join(dir, all.shift()));
  } catch (e) { logError(e, 'backup'); }
}
async function scheduler() {
  try { await EN.settle(repo, notify); } catch (e) { logError(e, 'settle'); }
  try { await loadSettings(); await loadGames(); } catch (e) {}
  // Push reminders: free bonus ready / daily reward waiting (only players who enabled notifications)
  try {
    const rows = await drv.all('SELECT DISTINCT uid FROM push_subs');
    const h = new Date().getHours();
    for (const r of rows) {
      const uid = Number(r.uid);
      await repo.withUser(uid, async u => {
        if (!u || u.banned) return false; let changed = false;
        if (u.bonusAt && u.bonusAt <= now() && !u.bonusPushed) { u.bonusPushed = true; changed = true; setImmediate(() => notify(uid, 'Free coins are ready!', 'Your ' + SET.bonusAmount.toLocaleString() + ' free coins are waiting in the store.')); }
        if (h >= 10 && h < 21 && u.lastDaily !== dayKey() && u.dailyPushed !== dayKey()) { u.dailyPushed = dayKey(); changed = true; setImmediate(() => notify(uid, 'Your daily reward is waiting', 'Keep your streak going — open Lucky Vault to collect today’s coins.')); }
        return changed ? undefined : false;
      });
    }
  } catch (e) { logError(e, 'push-reminders'); }
}
async function start() {
  drv = DB.open(); await DB.migrate(drv); repo = new Repo(drv);
  H = HOV.install({ R, userRoute, repo: () => repo, S: () => SET, E, pubUser, addTx, now, eventBonus: () => { const e = eventActive(); return e ? e.bonus : 1; } });
  ADM = ADMINS.install({ ADMIN, repo: () => repo, A, now, ownerUser: ADMIN_USER, ownerPass: ADMIN_PASS, tokens: adminTokens });
  SUPPORT.install({ R, ADMIN, userRoute, repo: () => repo, now, limited, notify: (uid, title, body) => N.notifyUser(repo, uid, title, body).catch(() => {}) });
  CLUBS.install({ R, userRoute, repo: () => repo, now, limited, weekKey: EN.weekKey });
  FRIENDS.install({ R, userRoute, repo: () => repo, now, r2, dayKey, addTx, limited });
  LIVE = LIVE_MOD.install({ rgBlock, R, userRoute, repo: () => repo, TE, now, r2, GAMES, limited, session: t => t ? repo.session(t) : null, limits: () => ({ min: SET.tableMin, max: SET.tableMax }),
    afterRound: (u, g, r, info, t) => afterRound(u, g, r, roundInfo(g, r, { newRound: true, done: true, bet: r.bet, bacc: g.kind === 'mbacc' || g.kind === 'mdt', shared: true, xwin: XWIN.some(k => r.wins && r.wins[k] > 0) }), t) });
  await repo.gamesEnsure(GLIST.map(g => g.id)); await migrateJson(); await loadSettings(); await loadGames();
  await repo.sessionsPrune(SESSION_DAYS * 864e5);
  await backup(); setInterval(backup, 6 * 3600e3).unref();
  // hourly: every balance must match the ledger; alert the operator if not
  setInterval(async () => { try { const r = await ledgerCheck(5000); if (r.mismatched) alert('对账异常 Ledger mismatch: ' + r.mismatched + ' player(s), e.g. ' + r.list.slice(0, 3).map(x => x.name + ' ' + x.diff).join(', ')); } catch (e) {} }, 3600e3).unref();
  setInterval(scheduler, 60e3).unref(); setTimeout(scheduler, 3000).unref();
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname, method = req.method, key = method + ' ' + p;
    const ip = String(req.headers['x-forwarded-for'] && process.env.TRUST_PROXY ? req.headers['x-forwarded-for'].split(',')[0] : req.socket.remoteAddress || '').trim();
    const origin = req.headers.origin || '';
    if (p.startsWith('/api/') && (/^(capacitor|ionic):\/\/localhost$/.test(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || ALLOWED_ORIGINS.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    try {
      if (!p.startsWith('/api/')) return serveStatic(req, res, p);
      if (p === '/api/live/stream' && LIVE) return LIVE.stream(req, res, u.searchParams);
      const b = method === 'POST' ? await readBody(req) : {};
      const c = { req, b, ip, q: u.searchParams, p, method };
      if (key === 'POST /api/admin/login') {
        if (limited('admin:' + ip, 10)) return send(res, 429, { err: 'rate', msg: 'Too many attempts' });
        const lr = await ADM.login(b.user, b.pass, b.code);
        if (lr.err) { if (lr.err === 'login') await repo.audit('admin_login_failed', String(b.user || '').slice(0, 40) + ' ' + ip); return send(res, 401, lr); }
        await repo.audit('admin_login', lr.user + ' (' + lr.role + ') ' + ip);
        return send(res, 200, { token: lr.token, user: lr.user, role: lr.role, defaultPass: lr.role === 'owner' && ADMIN_PASS === 'admin123' });
      }
      if (p.startsWith('/api/admin/')) {
        const adm = authAdmin(req); if (!adm) return send(res, 401, { err: 'auth' });
        if (!ADM.allowed(adm.role, method, p)) return send(res, 403, { err: 'perm', msg: '没有权限 · Your role cannot do this' });
        c.admin = adm; const h = ADMIN[key]; const out = h ? await h(c) : await adminDyn(c);
        if (method === 'POST' && out && out[0] === 200 && !/\/(me\/2fa|admins)$/.test(p) && !/preview$/.test(p)) repo.audit('admin_action', adm.user + ' ' + key.replace('/api/admin/', '')).catch(() => {});
        return out ? send(res, out[0], out[1]) : send(res, 404, { err: 'nf' });
      }
      const h = R[key]; const out = h ? await h(c) : await dynRoute(c);
      return out ? send(res, out[0], out[1]) : send(res, 404, { err: 'nf' });
    } catch (e) { await logError(e, key); if (!res.headersSent) send(res, 500, { err: 'server', msg: 'Server error' }); }
  });
  server.listen(PORT, () => {
    console.log('Lucky Vault running (' + drv.kind + ' database):');
    console.log('  Players : http://localhost:' + PORT);
    console.log('  Admin   : http://localhost:' + PORT + '/admin   (user: ' + ADMIN_USER + ')');
    const nets = os.networkInterfaces(); for (const n in nets) for (const a of nets[n] || []) if (a.family === 'IPv4' && !a.internal) console.log('  Phone   : http://' + a.address + ':' + PORT + '   (same Wi-Fi)');
    if (ADMIN_PASS === 'admin123') console.log('  WARNING : default admin password in use. Set ADMIN_PASS before going live.');
    else if (!process.env.ADMIN_PASS) console.log('  Admin password: ' + ADMIN_PASS + '   (saved in data/admin-pass.txt - delete that file to generate a new one)');
    if (!N.mailConfigured()) console.log('  Note    : email not configured — codes are printed here and shown in Admin → System.');
    if (process.env.OPEN_BROWSER) { const url = 'http://localhost:' + PORT; const cmd = process.platform === 'win32' ? 'start "" "' + url + '"' : process.platform === 'darwin' ? 'open ' + url : 'xdg-open ' + url; require('child_process').exec(cmd, () => {}); }
    alert('Server started (' + drv.kind + ')');
  }).on('error', e => {
    if (e.code === 'EADDRINUSE') console.error('Port ' + PORT + ' is already in use. Close the other program or run with another port, e.g.  set PORT=8081 && node server.js');
    else console.error(e);
    process.exit(1);
  });
  const stop = async () => { try { await drv.close(); } catch (e) {} process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
if (require.main === module) start().catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
module.exports = { start };
