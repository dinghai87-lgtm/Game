// Deep maths audit for every slot profile (and the no-decision table games).
// Usage: node tools/maths_audit.cjs [spinsPerProfile=2000000] > out.json
// Per slot profile: return-to-player with a 95% confidence band, hit rate, free-spin trigger rate, standard deviation,
// biggest win, and — where offered — the return of the feature buy and of the ante bet.
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const E = require(path.join(ROOT, 'public/js/slots-engine.js'));
const TE = require(path.join(ROOT, 'public/js/tables-engine.js'));
const { SLOT_LIST, TABLE_LIST } = require(path.join(ROOT, 'public/js/catalog.js'));
const N = +process.argv[2] || 2000000;

function sim(e, n, mode) {
  const st = { bal: 1e15, fs: null }; let cost = 0, ret = 0, s1 = 0, s2 = 0, hits = 0, feats = 0, max = 0;
  for (let i = 0; i < n; i++) {
    const r = E.round(st, 0, e, 1, mode === 'buy', mode === 'ante');
    let w = r.win; if (r.ev === 'start') feats++;
    let g = 0; while (st.fs && g++ < 5000) { let x = E.round(st, 0, e, 1); if (x.err === 'choose') x = E.round(st, 0, e, 1, false, false, { choice: i % 4 }); w += x.win || 0; }
    cost += r.cost; ret += w; const m = w / r.cost; s1 += m; s2 += m * m; if (w > 0) hits++; if (w > max) max = w;
  }
  const mean = s1 / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  return { rtp: +(ret / cost * 100).toFixed(2), ci95: +(1.96 * sd / Math.sqrt(n) * 100).toFixed(2), sd: +sd.toFixed(2), hit: +(hits / n * 100).toFixed(1), feat: feats ? Math.round(n / feats) : null, maxX: Math.round(max), n };
}
const out = { slots: {}, buy: {}, ante: {}, tables: {}, mapping: {} };
const t0 = Date.now();
for (const e of Object.keys(E.MATH)) {
  const m = E.MATH[e]; const n = /Very High/.test(m.vol) ? N * 2 : N;
  out.slots[e] = Object.assign({ target: m.rtp, vol: m.vol, label: m.label }, sim(e, n));
  if (m.buy) out.buy[e] = Object.assign({ price: m.buy }, sim(e, Math.round(N / 20), 'buy'));
  if (m.ante) out.ante[e] = Object.assign({ price: m.ante }, sim(e, Math.round(N / 2), 'ante'));
  process.stderr.write(e + ' ' + JSON.stringify(out.slots[e]) + ' ' + ((Date.now() - t0) / 1000).toFixed(0) + 's\n');
}
E.setVariants(SLOT_LIST);
SLOT_LIST.forEach(([id, t]) => { const k = E.mathKey(id, t[1]); (out.mapping[k] = out.mapping[k] || []).push(id); });
// no-decision table games: the published return can be checked by simulation alone
const NOD = { roulette: { red: 10 }, baccarat: { banker: 10 }, dragontiger: { dragon: 10 }, sicbo: { big: 10 }, wheel: { '1': 10 }, keno: { main: 10 }, scratch: { main: 10 } };
const PUB = { roulette: { eu: 97.3, fr: 98.6, us: 94.7, lucky: 97.3 }, baccarat: { std: 98.9, nc: 98.5, speed: 98.9, ez: 99.0 }, dragontiger: 96.3, sicbo: 97.2, wheel: 88.9, keno: 92, scratch: 92 };
for (const [gid, t] of TABLE_LIST) {
  const kind = t[1], v = t[2]; if (!NOD[kind]) continue;
  const st = { bal: 1e12 }; let cost = 0, win = 0, errs = 0; const n = kind === 'keno' || kind === 'scratch' ? 200000 : 400000;
  for (let i = 0; i < n; i++) {
    let r = TE.round(st, gid, kind, v, { a: 'deal', bets: NOD[kind], picks: [3, 11, 19, 27, 35, 44, 52, 60, 68, 77] }, { min: 1, max: 5000 });
    if (r.err) { errs++; break; } cost += r.cost; win += r.win; let g = 0;
    while (!r.done && g++ < 50) { r = TE.round(st, gid, kind, v, { a: (r.view.actions || [])[0] }, { min: 1, max: 5000 }); if (r.err) { errs++; break; } cost += r.cost; win += r.win; }
  }
  const pub = typeof PUB[kind] === 'object' ? PUB[kind][v] : PUB[kind];
  out.tables[t[0]] = { kind, v, published: pub, sim: +(win / cost * 100).toFixed(2), n, errs, bet: Object.keys(NOD[kind])[0] };
  process.stderr.write(t[0] + ' ' + JSON.stringify(out.tables[t[0]]) + '\n');
}
out.secs = Math.round((Date.now() - t0) / 1000);
console.log(JSON.stringify(out, null, 1));
