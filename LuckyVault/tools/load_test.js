#!/usr/bin/env node
// Load test for the shared (multiplayer) tables. TEST SERVER ONLY — it creates throw-away accounts.
// Start the server with TRUST_PROXY=1 so each simulated player gets its own IP, then:
//   node tools/load_test.js http://localhost:8080 300 2      (url, players, hands)
// Every player watches the same shared baccarat room over Server-Sent Events and bets each hand.
// Reports bet latency, errors, event delivery and server memory; at the end checks the coin ledger (needs ADMIN_PASS).
'use strict';
const http = require('http');
const BASE = process.argv[2] || 'http://localhost:8080', N = +process.argv[3] || 200, HANDS = +process.argv[4] || 2;
const GID = +process.env.GID || 318, ROOM = process.env.ROOM || '';
const U = new URL(BASE); const agent = new http.Agent({ keepAlive: true, maxSockets: 4096 });
const sleep = ms => new Promise(r => setTimeout(r, ms));
function call(method, path, body, tok, ip) {
  return new Promise(res => {
    const data = body ? JSON.stringify(body) : null; const t0 = Date.now();
    const req = http.request({ host: U.hostname, port: U.port, path, method, agent, headers: Object.assign({ 'Content-Type': 'application/json', 'X-Forwarded-For': ip || '10.0.0.1' }, tok ? { Authorization: 'Bearer ' + tok } : {}, data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }, r => {
      let s = ''; r.on('data', d => s += d); r.on('end', () => { let j = {}; try { j = JSON.parse(s); } catch (e) {} res({ code: r.statusCode, j, ms: Date.now() - t0 }); });
    });
    req.on('error', e => res({ code: 0, j: { err: e.message }, ms: Date.now() - t0 })); if (data) req.write(data); req.end();
  });
}
function sse(tok, onEvent) {
  const req = http.request({ host: U.hostname, port: U.port, path: '/api/live/stream?gid=' + GID + (ROOM ? '&room=' + ROOM : '') + '&t=' + encodeURIComponent(tok), agent: false }, r => {
    let buf = ''; r.setEncoding('utf8');
    r.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n\n')) >= 0) { const blk = buf.slice(0, i); buf = buf.slice(i + 2); const ev = (blk.match(/^event: (.*)$/m) || [])[1]; const da = (blk.match(/^data: (.*)$/m) || [])[1]; if (ev && da) { try { onEvent(ev, JSON.parse(da)); } catch (e) {} } } });
  });
  req.on('error', () => {}); req.end(); return req;
}
const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
(async () => {
  console.log('Load test: ' + N + ' players, ' + HANDS + ' hands, room ' + GID + '/' + ROOM + ' on ' + BASE);
  const players = []; const regMs = [];
  for (let i = 0; i < N; i += 25) {
    await Promise.all(Array.from({ length: Math.min(25, N - i) }, async (_, k) => {
      const n = i + k, ip = '10.' + (n >> 16 & 255) + '.' + (n >> 8 & 255) + '.' + (n & 255);
      const r = await call('POST', '/api/register', { name: 'lt' + Date.now().toString(36).slice(-4) + n, pass: 'password123', adult: true }, null, ip); regMs.push(r.ms);
      if (r.j.token) players.push({ tok: r.j.token, ip, events: 0, phase: null, round: 0, bet: -1 });
    }));
  }
  console.log('registered ' + players.length + '/' + N + ' (p95 ' + pct(regMs, .95) + ' ms)');
  let stateEvents = 0; const conns = players.map(p => sse(p.tok, (ev, d) => { p.events++; if (ev === 'state') { stateEvents++; p.phase = d.phase; p.round = d.round; } }));
  await sleep(3000);
  const betMs = [], errs = {}; let bets = 0, hands = 0, lastRound = -1; const t0 = Date.now(); const memMax = { v: 0 };
  const memT = setInterval(async () => { const h = await call('GET', '/api/health'); const m = parseInt(h.j.mem || '0', 10); if (m > memMax.v) memMax.v = m; }, 2000);
  while (hands < HANDS && Date.now() - t0 < HANDS * 90e3) {
    const watcher = players[0]; if (!watcher) break;
    if (watcher.phase === 'bet' && watcher.round !== lastRound) {
      lastRound = watcher.round; hands++; console.log('hand ' + hands + ' (round ' + lastRound + '): ' + players.length + ' players betting…');
      await Promise.all(players.map(async p => { await sleep(Math.random() * 6000); const side = Math.random() < .5 ? 'player' : 'banker'; const r = await call('POST', '/api/live/bet', { gid: GID, room: ROOM || undefined, bets: { [side]: 10 } }, p.tok, p.ip); betMs.push(r.ms); if (r.code === 200) bets++; else { const k = r.code + ' ' + (r.j.err || ''); errs[k] = (errs[k] || 0) + 1; } }));
    }
    await sleep(500);
  }
  await sleep(8000); clearInterval(memT); conns.forEach(c => c.destroy());
  const ev = players.map(p => p.events);
  console.log('\nRESULTS');
  console.log('  hands played      : ' + hands);
  console.log('  bets accepted     : ' + bets + ' / ' + (players.length * hands));
  console.log('  bet latency       : p50 ' + pct(betMs, .5) + ' ms · p95 ' + pct(betMs, .95) + ' ms · max ' + pct(betMs, 1) + ' ms');
  console.log('  errors            : ' + (Object.keys(errs).length ? JSON.stringify(errs) : 'none'));
  console.log('  events per player : min ' + Math.min(...ev) + ' · median ' + pct(ev, .5) + ' (state pushes total ' + stateEvents + ')');
  console.log('  server memory max : ' + memMax.v + ' MB');
  if (process.env.ADMIN_PASS) {
    const a = await call('POST', '/api/admin/login', { user: process.env.ADMIN_USER || 'admin', pass: process.env.ADMIN_PASS });
    if (a.j.token) { const l = await call('GET', '/api/admin/ledger', null, a.j.token); console.log('  ledger check      : ' + (l.j.mismatched === 0 ? 'OK — ' + l.j.checked + ' players, 0 mismatched' : JSON.stringify(l.j).slice(0, 300))); }
  }
  const bad = bets < players.length * hands * 0.95 || pct(betMs, .95) > 1500;
  console.log('\n' + (bad ? 'NEEDS ATTENTION' : 'PASS')); process.exit(bad ? 1 : 0);
})();
