#!/usr/bin/env node
// Lucky Vault pre-release check. Run from the package folder:  node tools/release_check.js
// Exits with code 1 if anything blocking is found (the list is printed), 0 when the build is ready to ship.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PUB = path.join(ROOT, 'public');
const errs = [], warns = [], oks = [];
const rd = p => fs.readFileSync(p, 'utf8');
const ex = p => fs.existsSync(p);
const err = m => errs.push(m), warn = m => warns.push(m), ok = m => oks.push(m);

// 1. every <script src> in the pages exists and parses
for (const page of ['index.html', 'admin.html']) {
  const f = path.join(PUB, page); if (!ex(f)) { err('missing page ' + page); continue; }
  const html = rd(f); const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(s => !/^https?:/.test(s));
  for (const s of srcs) { const p = path.join(PUB, s.split('?')[0]); if (!ex(p)) err(page + ': script not found ' + s); else { try { new Function(rd(p)); } catch (e) { err(s + ': syntax error ' + e.message); } } }
  const dup = srcs.filter((s, i) => srcs.indexOf(s) !== i); if (dup.length) err(page + ': duplicate script tags ' + dup.join(', '));
  ok(page + ': ' + srcs.length + ' scripts present and parse');
}
// inline scripts in index.html parse
{ const html = rd(path.join(PUB, 'index.html')); let n = 0; for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { n++; try { new Function(m[1]); } catch (e) { err('index.html inline script #' + n + ': ' + e.message); } } ok('inline scripts parse (' + n + ')'); }

// 2. service-worker precache list exists
{ const sw = rd(path.join(PUB, 'sw.js')); const m = sw.match(/FILES\s*=\s*\[([^\]]*)\]/); const files = m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
  files.forEach(f => { if (f !== './' && !ex(path.join(PUB, f))) err('sw.js precaches missing file ' + f); });
  const dup = files.filter((s, i) => files.indexOf(s) !== i); if (dup.length) warn('sw.js lists a file twice: ' + dup.join(', '));
  if (!/const V\s*=\s*'lv-v\d+'/.test(sw)) warn('sw.js cache version string not found'); ok('service worker: ' + files.length + ' precached files'); }

// 3. art manifest: every referenced file exists
{ const man = JSON.parse(rd(path.join(PUB, 'assets/manifest.json'))); let n = 0;
  for (const [slug, g] of Object.entries(man.games || {})) for (const [k, v] of Object.entries(g)) if (typeof v === 'string' && /\.(webp|png|jpg|mp3)$/.test(v)) { n++; if (!ex(path.join(PUB, 'assets/games', slug, v))) err('manifest: ' + slug + '/' + v + ' missing'); }
  if (man.audio && man.audio.music && !ex(path.join(PUB, man.audio.music))) err('manifest: music file missing ' + man.audio.music);
  ok('art manifest: ' + n + ' files checked'); }

// 4. sound names used by the sound engine exist
{ const html = rd(path.join(PUB, 'index.html')); const sh = (html.match(/SH=\[([^\]]+)\]/) || [])[1] || ''; const fn = (html.match(/FN=\[([^\]]+)\]/) || [])[1] || '';
  const SH = [...sh.matchAll(/'([^']+)'/g)].map(m => m[1]), FN = [...fn.matchAll(/'([^']+)'/g)].map(m => m[1]);
  SH.forEach(n => { if (!ex(path.join(PUB, 'assets/audio', n + '.mp3'))) err('sound missing assets/audio/' + n + '.mp3'); });
  FN.forEach(n => { if (!ex(path.join(PUB, 'assets/audio/casino', n + '.mp3'))) err('sound missing assets/audio/casino/' + n + '.mp3'); });
  ['lounge/music.mp3', 'lounge/crowd.mp3'].forEach(f => { if (!ex(path.join(PUB, 'assets/audio', f))) err('sound missing assets/audio/' + f); });
  ok('sounds: ' + (SH.length + FN.length) + ' checked'); }

// 5. fonts + licences + legal pages + compliance wording
for (const f of ['assets/fonts/Anton.woff2', 'assets/fonts/Cinzel.woff2', 'assets/fonts/OFL.txt', 'legal/privacy.html', 'legal/terms.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png']) if (!ex(path.join(PUB, f))) err('missing ' + f);
{ const c = ex(path.join(ROOT, 'COPYRIGHT.txt')) ? rd(path.join(ROOT, 'COPYRIGHT.txt')) : ''; if (!c.includes('万泰游戏开发')) err('COPYRIGHT.txt must name 万泰游戏开发 as copyright owner');
  for (const w of ['Kenney', 'Sonniss', 'Open Font License']) if (!c.includes(w)) err('COPYRIGHT.txt missing credit: ' + w); ok('credits present'); }
{ const t = ex(path.join(PUB, 'legal/terms.html')) ? rd(path.join(PUB, 'legal/terms.html')) : ''; if (!/18/.test(t)) err('terms.html must state the 18+ age limit'); if (!/cash value/i.test(t)) err('terms.html must state coins have no cash value');
  const idx = rd(path.join(PUB, 'index.html')); if (!/no cash value/i.test(idx)) err('index.html must show the "no cash value" notice'); ok('legal wording'); }

// 6. forbidden third-party IP / leftovers
{ const bad = /Aristocrat|Heart of Vegas|Buffalo Gold|Lightning Link|Dragon Link|Mixkit/i; const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const files = walk(PUB).filter(f => /\.(js|html|json|webmanifest)$/.test(f)).concat([path.join(ROOT, 'server.js')]).concat(walk(path.join(ROOT, 'lib')));
  for (const f of files) { const s = rd(f); const m = s.match(bad); if (m) err('third-party brand name "' + m[0] + '" in ' + path.relative(ROOT, f)); if (/\bdebugger\s*;/.test(s)) err('debugger statement in ' + path.relative(ROOT, f)); }
  ok('no third-party brand names (' + files.length + ' files)'); }

// 7. server safety basics
{ const s = rd(path.join(ROOT, 'server.js')); if (/ADMIN_PASS\s*=\s*['"][^'"]+['"]/.test(s)) err('server.js has a hard-coded admin password');
  if (!/no cash value|virtual/i.test(s + rd(path.join(ROOT, 'package.json')))) warn('server does not mention virtual coins');
  if (ex(path.join(ROOT, 'data'))) warn('a data/ folder is inside the package — remove it before shipping (it contains player accounts)');
  ok('server basics'); }

// 8. version consistency
{ const pkg = JSON.parse(rd(path.join(ROOT, 'package.json'))); const cl = ex(path.join(ROOT, 'CHANGELOG.md')) ? rd(path.join(ROOT, 'CHANGELOG.md')) : '';
  const vs = [...cl.matchAll(/^## v([\d.]+)/gm)].map(m => m[1]); const last = vs[vs.length - 1];
  if (!last) warn('CHANGELOG.md has no version headings'); else if (!pkg.version.startsWith(last)) err('package.json version ' + pkg.version + ' does not match CHANGELOG latest v' + last);
  else ok('version ' + pkg.version); }

// 9. size budget for the first lobby load
{ const big = []; for (const f of ['js/tables-ui.js', 'index.html', 'js/social.js']) { const p = path.join(PUB, f); if (ex(p) && fs.statSync(p).size > 600 * 1024) big.push(f); }
  if (big.length) warn('large files (gzip helps, but check): ' + big.join(', ')); ok('size budget'); }

console.log('\nLucky Vault release check\n=========================');
oks.forEach(m => console.log('  ✓ ' + m)); warns.forEach(m => console.log('  ! ' + m)); errs.forEach(m => console.log('  ✗ ' + m));
console.log('\n' + (errs.length ? errs.length + ' problem(s) — NOT ready to ship' : 'READY TO SHIP') + (warns.length ? ' (' + warns.length + ' warning(s))' : '') + '\n');
process.exit(errs.length ? 1 : 0);
