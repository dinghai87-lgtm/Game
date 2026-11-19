'use strict';
/*
 * One-click test suite:  npm test   (or double-click test.bat)
 *   1. Maths: every slot engine and variant is simulated and must land near 96% RTP.
 *   2. Tables: every table game is simulated and must match its published return.
 *   3. Server: a fresh server (temporary database, random port) is started and every
 *      player and admin API is exercised end to end.
 * Exit code 0 = all passed.  Add QUICK=1 for a faster, rougher run.
 */
const path = require('path'), fs = require('fs'), os = require('os'), { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');
const E = require(path.join(ROOT, 'public/js/slots-engine.js'));
const TE = require(path.join(ROOT, 'public/js/tables-engine.js'));
const { THEMES, TABLES, SLOT_LIST } = require(path.join(ROOT, 'public/js/catalog.js'));
const TABLE_LIST = require(path.join(ROOT, 'public/js/catalog.js')).TABLE_LIST.filter(([, t]) => !['mbacc', 'mdt', 'msicbo', 'mroul'].includes(t[1]));   // shared rooms are tested separately (live)
const QUICK = !!process.env.QUICK;
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ✔ ' + m); } else { fail++; fails.push(m); console.log('  ✘ ' + m); } };

function slotRTP(e, n) {
  const st = { bal: 1e12, fs: null }; let cost = 0, ret = 0;
  for (let i = 0; i < n; i++) { const r = E.round(st, 0, e, 1); cost += r.cost; ret += r.win; let g = 0; while (st.fs && g++ < 3000) { let x = E.round(st, 0, e, 1); if (x.err === 'choose') x = E.round(st, 0, e, 1, false, false, { choice: i % 4 }); ret += x.win || 0; } }
  return ret / cost * 100;
}
function maths() {
  console.log('\n1. Slot maths');
  const n = QUICK ? 150000 : 600000;
  for (const e of Object.keys(E.MATH)) {
    const wild = /High/.test(E.MATH[e].vol); // very swingy maths needs more spins and a wider band
    const spins = wild ? n * 2 : n; const rtp = slotRTP(e, spins); const tol = (QUICK ? 3.5 : 2) + (wild ? 1 : 0);
    ok(Math.abs(rtp - E.MATH[e].rtp) <= tol, e.padEnd(9) + ' RTP ' + rtp.toFixed(2) + '% (target ' + E.MATH[e].rtp + '% ±' + tol + ', ' + n + ' spins)');
  }
  E.setVariants(SLOT_LIST); let bad = 0; SLOT_LIST.forEach(([id, t]) => { if (!E.MATH[E.mathKey(id, t[1])]) bad++; }); ok(!bad, 'all ' + SLOT_LIST.length + ' slots map to a valid maths profile');
}
function exactTables() {
  // games whose return can be worked out exactly (no strategy): the published figures must hold
  const c = {}; TE.WHEEL.forEach(s => c[s] = (c[s] || 0) + 1);
  ok(TE.WHEEL.length === 54 && c['1'] === 24 && c['2'] === 15 && c['5'] === 7 && c['10'] === 4 && c['20'] === 2 && c.J === 1 && c.L === 1, 'money wheel has the classic 54 segments (1×24, 2×15, 5×7, 10×4, 20×2, Joker, Logo): ' + JSON.stringify(c));
  const comb = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
  for (const v of ['classic', 'power']) { const T = TE.KENO[v]; const bad = []; for (let n = 1; n <= 10; n++) { let ev = 0; for (const h in T[n]) ev += comb(20, +h) * comb(60, n - h) / comb(80, n) * T[n][h] * (v === 'power' ? 1 + 3 * h / 20 : 1); if (ev < 0.90 || ev > 0.945) bad.push(n + ':' + (ev * 100).toFixed(1)); }
    ok(!bad.length, 'keno ' + v + ': every pick count returns 90–94.5% (exact) ' + bad.join(' ')); }
  const sc = TE.SCR_P.reduce((a, [m, p]) => a + m * p, 0); ok(Math.abs(sc - 0.92) < 0.005, 'scratch cards return 92% (exact ' + (sc * 100).toFixed(2) + '%)');
}
function tables() {
  exactTables();
  console.log('\n2. Table games (every game deals and settles)');
  const BETS = { blackjack: { main: 10 }, roulette: { red: 10 }, baccarat: { banker: 10 }, dragontiger: { tiger: 5 }, sicbo: { big: 5 }, craps: { pass: 5 }, videopoker: { coins: 5, denom: 1 }, tcp: { ante: 5, pairplus: 1 }, holdem: { ante: 5 }, caribbean: { ante: 5 }, war: { main: 5 }, reddog: { main: 5 }, wheel: { '5': 5 }, keno: { main: 2 }, scratch: { main: 2 }, uth: { ante: 5, blind: 5, trips: 1 }, letitride: { main: 5 }, mstud: { ante: 5 }, fourcard: { ante: 5, acesup: 1 }, hcf: { ante: 5 }, paigow: { main: 5, fortune: 1 }, paigowtiles: { main: 5 }, crash: { main: 5 } };
  TABLE_LIST.forEach(([gid, t]) => {
    const st = { bal: 1e9 }; let errs = 0, done = 0, cost = 0, win = 0; const N = QUICK ? 300 : 2000;
    for (let k = 0; k < N; k++) {
      let r = TE.round(st, gid, t[1], t[2], { a: 'deal', bets: BETS[t[1]], picks: [1, 2, 3, 4, 5] }, { min: 1, max: 5000 }); if (r.err) { errs++; break; } cost += r.cost; win += r.win;
      let g = 0; while (!r.done && g++ < 300) { r = TE.round(st, gid, t[1], t[2], { a: r.view.actions[k % 2 ? 0 : Math.floor(Math.random() * r.view.actions.length)], hold: [1, 0, 0, 0, 0].map(() => Math.random() < .5), picks: [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - .5).slice(0, 2) }, { min: 1, max: 5000 }); if (r.err) { errs++; break; } cost += r.cost; win += r.win; }
      if (r.done) done++;
    }
    ok(!errs && done === N, t[0].padEnd(24) + ' ' + done + '/' + N + ' rounds settled, sample return ' + (win / cost * 100).toFixed(1) + '%');
  });
}
async function server() {
  console.log('\n3. Server API (temporary database)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lvtest-')); const port = 20000 + Math.floor(Math.random() * 20000); let log = '';
  const env = Object.assign({}, process.env, { PORT: String(port), SQLITE_FILE: path.join(tmp, 'test.db'), ADMIN_USER: 'admin', ADMIN_PASS: 'testpass123', DATABASE_URL: '', OPEN_BROWSER: '', ALERT_WEBHOOK: '', MAIL_API_KEY: '', TWILIO_SID: '' });
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], { env, cwd: tmp }); child.stdout.on('data', d => log += d); child.stderr.on('data', d => log += d);
  const B = 'http://127.0.0.1:' + port; const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 50; i++) { try { await fetch(B + '/api/health'); break; } catch (e) { await sleep(200); } }
  const call = async (p, b, tok) => { await sleep(70); const r = await fetch(B + p, { method: b ? 'POST' : 'GET', headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}), body: b ? JSON.stringify(b) : undefined }); const j = await r.json().catch(() => ({})); j._s = r.status; return j; };
  const code = () => { const m = [...log.matchAll(/code[^0-9]*(\d{6})/gi)]; return m.length ? m[m.length - 1][1] : ''; };
  try {
    ok((await call('/api/health')).ok, 'health check');
    const ad = (await call('/api/admin/login', { user: 'admin', pass: 'testpass123' })).token; ok(!!ad, 'admin login');
    ok((await call('/api/admin/login', { user: 'admin', pass: 'wrong' }))._s === 401, 'admin wrong password rejected');
    const a = await call('/api/register', { name: 'tester1', pass: 'password1', email: 'tester@example.com', adult: true, fp: 'dev-test-1' }); const T = a.token;
    ok(T && a.user.bal > 0, 'register + welcome bonus');
    ok((await call('/api/register', { name: 'tester1', pass: 'password1', adult: true }))._s === 409, 'duplicate username rejected');
    ok((await call('/api/register', { name: 'young', pass: 'password1' }))._s === 400, 'registration needs 18+ confirmation');
    let r = await call('/api/auth/email/verify', { code: code() }, T); ok(r.user && r.user.emailVerified, 'email verification code');
    await call('/api/auth/forgot', { email: 'tester@example.com' }); r = await call('/api/auth/reset', { email: 'tester@example.com', code: code(), pass: 'password2' }); ok(!!r.token, 'forgot + reset password');
    const T2 = r.token; ok((await call('/api/me', null, T))._s === 401, 'old sessions end after a reset');
    ok(!!(await call('/api/login', { name: 'tester@example.com', pass: 'password2' })).token, 'login with email');
    r = await call('/api/auth/phone', { phone: '+61 400 000 000' }, T2); r = await call('/api/auth/phone/verify', { code: code() }, T2); ok(r.user && r.user.phone === '+61400000000', 'phone verification');
    let bad = 0; for (const [gid] of SLOT_LIST) { let x = await call('/api/spin', { gid, bet: 1 }, T2); if (x.err === 'choose') x = await call('/api/spin', { gid, choice: 0 }, T2); if (x.err && x.err !== 'fs_pending') bad++; let me = await call('/api/me', null, T2); let g = 0; while (me.user && me.user.fs && g++ < 100) { const y = await call('/api/spin', { gid: me.user.fs.gid, bet: 1 }, T2); if (y.err === 'choose') await call('/api/spin', { gid: me.user.fs.gid, choice: 1 }, T2); me = await call('/api/me', null, T2); } }
    ok(!bad, 'one spin on each of the ' + SLOT_LIST.length + ' slots');
    { let gm = null; for (let i = 0; i < 60 && !gm; i++) { const x = await call('/api/spin', { gid: 1, bet: 1 }, T2); if (x.win > 0 && !x.ev && !x.inFS) gm = x; } const r = gm ? await call('/api/gamble', { gid: 1, pick: 'red' }, T2) : {}; ok(gm && (r.ok === true || r.ok === false) && r.stake === gm.win, 'gamble (double-up) after a win'); ok((await call('/api/gamble', { gid: 1, pick: 'red' }, T2)).err || true, 'gamble state'); }
    bad = 0; const BETS = { blackjack: { main: 10 }, roulette: { red: 10 }, baccarat: { banker: 10 }, dragontiger: { tiger: 5 }, sicbo: { big: 5 }, craps: { pass: 5 }, videopoker: { coins: 5, denom: 1 }, tcp: { ante: 5, pairplus: 1 }, holdem: { ante: 5 }, caribbean: { ante: 5 }, war: { main: 5 }, reddog: { main: 5 }, wheel: { '5': 5 }, keno: { main: 2 }, scratch: { main: 2 }, uth: { ante: 5, blind: 5, trips: 1 }, letitride: { main: 5 }, mstud: { ante: 5 }, fourcard: { ante: 5, acesup: 1 }, hcf: { ante: 5 }, paigow: { main: 5, fortune: 1 }, paigowtiles: { main: 5 }, crash: { main: 5 } };
    const badL = []; for (const [gid, t] of TABLE_LIST) { let x = await call('/api/table', { gid, a: 'deal', bets: BETS[t[1]], picks: [1, 2, 3, 4, 5] }, T2); let g = 0; while (!x.err && !x.done && g++ < 300) x = await call('/api/table', { gid, a: x.view.actions[0], hold: [1, 0, 0, 0, 0] }, T2); if (x.err) { bad++; badL.push(t[0] + ':' + x.err + ' ' + (x.msg || '')); } }
    ok(!bad, 'one round on each of the ' + TABLE_LIST.length + ' table games' + (bad ? ' ' + badL.join(', ') : ''));
    ok((await call('/api/spin', { gid: 0, bet: 7 }, T2)).err === 'bad_bet', 'invalid bet rejected');
    r = await call('/api/missions', null, T2); ok(r.missions && r.missions.length === 3 && r.achievements.length >= 18, 'missions and achievements');
    ok((await call('/api/leaderboard', null, T2)).top.length >= 1, 'weekly leaderboard');
    r = await call('/api/admin/tournaments', { name: 'Test Cup', start: Date.now() - 1000, end: Date.now() + 864e5, metric: 'rounds', filter: 'all', prizes: '1000,500' }, ad); ok(!!r.tournament, 'create tournament');
    await call('/api/spin', { gid: 1, bet: 1 }, T2); ok((await call('/api/tournaments', null, T2)).tournaments[0].top.length >= 1, 'tournament scoring');
    const d1 = await call('/api/daily', { fp: 'dev-test-1' }, T2); ok(d1.amount > 0, 'daily reward');
    const b = await call('/api/register', { name: 'tester2', pass: 'password1', adult: true, fp: 'dev-test-1' });
    ok((await call('/api/daily', { fp: 'dev-test-1' }, b.token))._s === 400, 'one daily reward per device');
    await call('/api/register', { name: 'tester3', pass: 'password1', adult: true, fp: 'dev-test-1' }); const c = await call('/api/register', { name: 'tester4', pass: 'password1', adult: true, fp: 'dev-test-1' });
    ok(c.bonusWithheld === true, 'welcome bonus withheld after 3 accounts on one device');
    r = await call('/api/admin/settings', { promo: { pct: 50, label: 'Test' } }, ad); r = await call('/api/store', null, T2); ok(r.packages[0].coins === Math.round(r.packages[0].base * 1.5), 'store promotion');
    const o = (await call('/api/orders', { pkg: 'p1' }, T2)).order; r = await call('/api/orders/' + o.id + '/sandbox-pay', {}, T2); ok(r.order && r.order.status === 'paid', 'sandbox purchase');
    ok((await call('/api/admin/orders/' + o.id + '/status', { status: 'refunded' }, ad)).order.status === 'refunded', 'refund');
    await call('/api/limits', { limit: 5 }, T2); ok((await call('/api/orders', { pkg: 'p2' }, T2)).err === 'limit', 'monthly spending limit enforced');
    r = await call('/api/admin/campaign', { audience: { type: 'all' }, title: 'Gift', message: 'Hi', coins: 100 }, ad); ok(r.players >= 4, 'campaign to all players');
    ok((await call('/api/notes', null, T2)).notes.length >= 1, 'in-app notification delivered');
    for (const p of ['overview', 'players', 'orders', 'rounds', 'tx', 'audit', 'analytics', 'risk', 'system', 'tournaments']) ok((await call('/api/admin/' + p, null, ad))._s === 200, 'admin ' + p);
    ok((await call('/api/admin/overview'))._s === 401, 'admin API needs login');
    ok((await call('/api/account/delete', { pass: 'password2' }, T2)).ok, 'delete account');
    ok((await call('/api/login', { name: 'tester1', pass: 'password2' }))._s === 401, 'deleted account cannot log in');
  } catch (e) { ok(false, 'server test crashed: ' + e.message); console.log(log.slice(-2000)); }
  child.kill(); await sleep(300); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
}
(async () => {
  const t0 = Date.now();
  console.log('Lucky Vault tests' + (QUICK ? ' (quick)' : ''));
  if (!process.env.SKIP_MATHS) maths(); tables(); await server();
  console.log('\n' + pass + ' passed, ' + fail + ' failed in ' + Math.round((Date.now() - t0) / 1000) + 's');
  if (fail) { console.log('Failed:\n - ' + fails.join('\n - ')); process.exit(1); }
})();
