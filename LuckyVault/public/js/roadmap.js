// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
/* Lucky Vault - baccarat scoreboard (casino "roads").
   Bead Plate, Big Road, Big Eye Boy, Small Road, Cockroach Road, shoe statistics and "ask road" (what the
   derived roads would show if the next hand is Banker / Player). Results are kept per table for one shoe
   (72 hands) in localStorage; NEW SHOE clears it.  Entries: {w:'B'|'P'|'T', pp:bool, bp:bool}. */
(function () {
  const SHOE = 72, ROWS = 6;
  const key = id => 'lv_road_' + id;
  function load(id) { try { return JSON.parse(localStorage.getItem(key(id)) || '[]'); } catch (e) { return []; } }
  function save(id, h) { try { localStorage.setItem(key(id), JSON.stringify(h.slice(-SHOE))); } catch (e) {} }

  // Big Road as logical columns: [{w, ties, pp, bp}...]; ties before the first B/P are kept as leading ties
  function bigCols(h) {
    const cols = []; let lead = 0;
    for (const e of h) {
      if (e.w === 'T') { const c = cols[cols.length - 1]; if (c) c[c.length - 1].ties++; else lead++; continue; }
      const c = cols[cols.length - 1];
      const cell = { w: e.w, ties: 0, pp: e.pp, bp: e.bp };
      if (c && c[0].w === e.w) c.push(cell); else cols.push([cell]);
    }
    if (lead && cols[0]) cols[0][0].ties += lead;
    return cols;
  }
  // derived road (n = 1 Big Eye Boy, 2 Small Road, 3 Cockroach): list of 'R' / 'B' (red / blue)
  function derived(cols, n) {
    const out = [];
    for (let c = 0; c < cols.length; c++) for (let r = 0; r < cols[c].length; r++) {
      if (c < n || (c === n && r === 0)) continue;
      if (r === 0) out.push(cols[c - 1].length === cols[c - 1 - n].length ? 'R' : 'B');
      else { const L = cols[c - n].length; out.push(L > r ? 'R' : L === r ? 'B' : 'R'); }
    }
    return out;
  }
  // place a sequence into grid columns (same value continues down, change -> new column) with dragon tail
  function place(seq, rows, valOf) {
    const grid = new Map(); let col = -1, row = 0, prev = null, startCol = -1, maxC = 0;
    seq.forEach((e, i) => {
      const v = valOf(e);
      if (prev === null || v !== prev) { startCol++; col = startCol; row = 0; while (grid.has(col + ',' + row)) col++; }
      else { if (row + 1 < rows && !grid.has(col + ',' + (row + 1))) row++; else col++; }
      grid.set(col + ',' + row, e); prev = v; maxC = Math.max(maxC, col);
    });
    return { grid, cols: maxC + 1 };
  }
  const RED = '#e5383b', BLUE = '#2f6fe4', GREEN = '#22a447';
  // special results: [short badge, full name, colour]
  const XT = { st: ['小虎', '小老虎 Small Tiger', '#f08c00'], bt: ['大虎', '大老虎 Big Tiger', '#c2410c'], sd: ['小龙', '小龙 Small Dragon', '#7c3aed'], bd: ['大龙', '大龙 Big Dragon', '#4c1d95'],
    d7: ['龙7', '龙7 Dragon 7', '#be123c'], p8: ['熊8', '熊猫8 Panda 8', '#0f766e'], nat: ['例', '例牌 Natural', '#ca8a04'], stie: ['同和', '同花和 Suited Tie', '#15803d'] };
  const XE = { st: 'ST', bt: 'BT', sd: 'SD', bd: 'BD', d7: 'D7', p8: 'P8', nat: 'N', stie: 'ST=' };
  const isEN = () => !!(window.LVLang && LVLang.get() === 'en');
  const xtag = k => isEN() ? XE[k] : XT[k][0], xname = k => isEN() ? XT[k][1].split(' ').slice(1).join(' ') : XT[k][1].split(' ')[0];
  const SU = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const cardTxt = c => !c ? '' : '<span class="' + (c[1] === 'h' || c[1] === 'd' ? 'rd' : '') + '">' + (c[0] === 'T' ? '10' : c[0]) + (SU[c[1]] || '') + '</span>';
  // ---- one scoreboard SVG, like the casino display: all roads share one grid unit (u) so their lines align.
  //  left: 珠盘路 Bead Plate (6 rows of 2u cells) | right: 大路 Big Road (6 rows of u) on top,
  //  大眼仔 Big Eye Boy (6 rows of u/2) under it, then 小路 Small Road + 曱甴路 Cockroach Road side by side.
  function lastCols(grid, cols) { let maxC = -1; grid.forEach((_, k) => { maxC = Math.max(maxC, +k.split(',')[0]); }); return Math.max(0, maxC + 1 - cols); }
  function board(h, L, opt) {
    const BC = opt.bead, R = opt.right, U = 10; // R big-road columns; derived roads get 2R half-columns
    const bw = BC * 2 * U, W = bw + R * U, H = 12 * U; let g = '', m = '';
    const grid = (x0, y0, cols, rows, cs, cls) => { let o = ''; for (let c = 0; c <= cols; c++) o += '<line x1="' + (x0 + c * cs) + '" y1="' + y0 + '" x2="' + (x0 + c * cs) + '" y2="' + (y0 + rows * cs) + '"/>';
      for (let r = 0; r <= rows; r++) o += '<line x1="' + x0 + '" y1="' + (y0 + r * cs) + '" x2="' + (x0 + cols * cs) + '" y2="' + (y0 + r * cs) + '"/>'; return '<g class="' + (cls || 'rg') + '">' + o + '</g>'; };
    // backgrounds + grids
    g += '<rect x="0" y="0" width="' + bw + '" height="' + H + '" fill="#0e1522"/><rect x="' + bw + '" y="0" width="' + R * U + '" height="' + H + '" fill="#111a2b"/>';
    g += grid(0, 0, BC, 6, 2 * U); g += grid(bw, 0, R, 6, U); g += grid(bw, 6 * U, 2 * R, 6, U / 2, 'rg2'); g += grid(bw, 9 * U, R, 6, U / 2, 'rg2');
    g += '<line class="sep" x1="' + bw + '" y1="0" x2="' + bw + '" y2="' + H + '"/><line class="sep" x1="' + bw + '" y1="' + 6 * U + '" x2="' + W + '" y2="' + 6 * U + '"/><line class="sep" x1="' + bw + '" y1="' + 9 * U + '" x2="' + W + '" y2="' + 9 * U + '"/><line class="sep" x1="' + (bw + R * U / 2) + '" y1="' + 9 * U + '" x2="' + (bw + R * U / 2) + '" y2="' + H + '"/>';
    const tag = (x, y, t) => '<text class="lb" x="' + x + '" y="' + y + '">' + t + '</text>';
    const blink = e => e && e.ask ? ' class="blk"' : '';
    // bead plate: filled discs with 庄 / 闲 / 和 (or 龙 / 虎), pair dots in the corners
    const bStart = h.length <= BC * 6 ? 0 : (Math.ceil(h.length / 6) - BC) * 6;   // keep whole columns, newest on the right
    h.slice(bStart).forEach((e, n) => { const c = Math.floor(n / 6), r = n % 6, x = c * 2 * U + U, y = r * 2 * U + U;
      const col = e.w === 'B' ? RED : e.w === 'P' ? BLUE : GREEN;
      m += '<g' + blink(e) + '><circle cx="' + x + '" cy="' + y + '" r="' + (U * .82) + '" fill="' + col + '"/><text class="bd" x="' + x + '" y="' + (y + U * .38) + '">' + (e.w === 'B' ? L.zb : e.w === 'P' ? L.zp : L.zt) + '</text>';
      if (e.bp) m += '<circle cx="' + (x - U * .62) + '" cy="' + (y - U * .62) + '" r="' + U * .2 + '" fill="' + RED + '" stroke="#fff" stroke-width=".7"/>';
      if (e.pp) m += '<circle cx="' + (x + U * .62) + '" cy="' + (y + U * .62) + '" r="' + U * .2 + '" fill="' + BLUE + '" stroke="#fff" stroke-width=".7"/>';
      const tg = (e.x || []).find(t => XT[t] && t !== 'nat'); if (tg) m += '<rect x="' + (x - U * .95) + '" y="' + (y + U * .38) + '" width="' + U * 1.9 + '" height="' + U * .62 + '" rx="' + U * .15 + '" fill="' + XT[tg][2] + '" stroke="#fff" stroke-width=".4"/><text class="xb" x="' + x + '" y="' + (y + U * .84) + '">' + xtag(tg) + '</text>';
      else if ((e.x || []).includes('nat')) m += '<circle cx="' + (x + U * .62) + '" cy="' + (y - U * .62) + '" r="' + U * .2 + '" fill="#ffd60a" stroke="#7a5b00" stroke-width=".5"/>';
      m += '</g>'; });
    // big road: hollow rings, green slash = tie (number if several), pair dots
    const cols = bigCols(h); const flat = []; cols.forEach(c => c.forEach(e => flat.push(e)));
    const big = place(flat, 6, e => e.w); const bs = lastCols(big.grid, R);
    big.grid.forEach((e, k) => { const [c, r] = k.split(',').map(Number); if (c < bs) return; const x = bw + (c - bs) * U + U / 2, y = r * U + U / 2;
      m += '<g' + blink(e) + '><circle cx="' + x + '" cy="' + y + '" r="' + U * .36 + '" fill="none" stroke="' + (e.w === 'B' ? RED : BLUE) + '" stroke-width="' + U * .16 + '"/>';
      if (e.ties) m += '<line x1="' + (x - U * .34) + '" y1="' + (y + U * .34) + '" x2="' + (x + U * .34) + '" y2="' + (y - U * .34) + '" stroke="' + GREEN + '" stroke-width="' + U * .14 + '"/>' + (e.ties > 1 ? '<text class="tn" x="' + x + '" y="' + (y + U * .2) + '">' + e.ties + '</text>' : '');
      { const tg = (e.x || []).find(t => XT[t] && t !== 'nat'); if (tg) m += '<circle cx="' + (x + U * .32) + '" cy="' + (y - U * .32) + '" r="' + U * .17 + '" fill="' + XT[tg][2] + '" stroke="#fff" stroke-width=".3"/>'; } if (e.bp) m += '<circle cx="' + (x - U * .3) + '" cy="' + (y - U * .3) + '" r="' + U * .14 + '" fill="' + RED + '"/>'; if (e.pp) m += '<circle cx="' + (x + U * .3) + '" cy="' + (y + U * .3) + '" r="' + U * .14 + '" fill="' + BLUE + '"/>'; m += '</g>'; });
    // derived roads
    const drawD = (seq, x0, y0, colsN, style, askLast) => { const d = place(seq.map((v, i) => ({ v, i })), 6, o => o.v); const sh = lastCols(d.grid, colsN); const cs = U / 2;
      d.grid.forEach((o, k) => { const [c, r] = k.split(',').map(Number); if (c < sh) return; const x = x0 + (c - sh) * cs + cs / 2, y = y0 + r * cs + cs / 2, col = o.v === 'R' ? RED : BLUE; const bl = askLast && o.i === seq.length - 1 ? ' class="blk"' : '';
        if (style === 'ring') m += '<circle' + bl + ' cx="' + x + '" cy="' + y + '" r="' + cs * .34 + '" fill="none" stroke="' + col + '" stroke-width="' + cs * .16 + '"/>';
        else if (style === 'dot') m += '<circle' + bl + ' cx="' + x + '" cy="' + y + '" r="' + cs * .36 + '" fill="' + col + '"/>';
        else m += '<line' + bl + ' x1="' + (x - cs * .34) + '" y1="' + (y + cs * .34) + '" x2="' + (x + cs * .34) + '" y2="' + (y - cs * .34) + '" stroke="' + col + '" stroke-width="' + cs * .2 + '" stroke-linecap="round"/>'; }); };
    const base = opt.askW ? bigCols(h.filter(e => !e.ask)) : null;
    [[1, bw, 6 * U, 2 * R, 'ring'], [2, bw, 9 * U, R, 'dot'], [3, bw + R * U / 2, 9 * U, R, 'slash']].forEach(([n, x0, y0, cn, st]) => { const d = derived(cols, n); drawD(d, x0, y0, cn, st, base && derived(base, n).length < d.length); });
    // faint section labels
    const lbl = tag(bw - 3, H - 3, '珠盘路') + tag(W - 3, 6 * U - 3, '大路 Big Road') + tag(W - 3, 9 * U - 3, '大眼仔 Big Eye') + tag(bw + R * U / 2 - 3, H - 3, '小路 Small') + tag(W - 3, H - 3, '曱甴路 Cockroach');
    return '<svg class="rm-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' + g + lbl + m + '</svg>';
  }
  // "ask road": the next mark each derived road would get if the next hand were B / P
  function ask(h, w) { const c = bigCols(h.concat([{ w }])); return [1, 2, 3].map(n => { const d = derived(c, n); return d.length && derived(bigCols(h), n).length < d.length ? d[d.length - 1] : null; }); }
  function askBtn(h, w, L) { const a = ask(h, w), col = w === 'B' ? RED : BLUE;
    const mk = (v, st) => { const c = v === 'R' ? RED : BLUE; return !v ? '<i class="na"></i>' : st === 'ring' ? '<i class="ring" style="border-color:' + c + '"></i>' : st === 'dot' ? '<i class="dot" style="background:' + c + '"></i>' : '<i class="sl" style="background:' + c + '"></i>'; };
    return '<button class="ask" data-ask="' + w + '"><b style="background:' + col + '">' + (w === 'B' ? L.zb : L.zp) + (L.EN ? ' ask' : '问路') + '</b>' + mk(a[0], 'ring') + mk(a[1], 'dot') + mk(a[2], 'slash') + '</button>'; }
  // counts of every special result this shoe (shown even when zero, so the player sees what is tracked)
  function xstats(h, dt) { const keys = dt ? ['stie'] : ['st', 'bt', 'sd', 'bd', 'd7', 'p8', 'nat']; const c = {}; keys.forEach(k => c[k] = 0); h.forEach(e => (e.x || []).forEach(t => { if (t in c) c[t]++; }));
    return '<div class="rm-x">' + keys.map(k => '<span style="--xc:' + XT[k][2] + '"><i>' + xtag(k) + '</i>' + xname(k) + ' <b>' + c[k] + '</b></span>').join('') + '</div>'; }
  // every hand of the shoe, newest first
  function logHTML(h, L) { if (!h.length) return '<div class="rm-empty">本靴还没有记录 · no hands yet</div>';
    return '<table><tr><th>#</th><th>结果</th><th>' + L.zp + '</th><th>' + L.zb + '</th><th>记录</th></tr>' + h.map((e, i) => [e, i]).reverse().map(([e, i]) => {
      const res = e.w === 'B' ? '<b class="b">' + L.zb + '</b>' : e.w === 'P' ? '<b class="p">' + L.zp + '</b>' : '<b class="t">和</b>';
      const side = (cs, pt) => (cs || []).map(cardTxt).join(' ') + (pt != null ? ' <em>' + pt + '点</em>' : '');
      const tags = (e.x || []).map(t => XT[t] ? '<i style="background:' + XT[t][2] + '">' + xname(t) + '</i>' : '').join('') + (e.bp ? '<i style="background:' + RED + '">' + L.zb + '对</i>' : '') + (e.pp ? '<i style="background:' + BLUE + '">' + L.zp + '对</i>' : '');
      return '<tr><td>' + (i + 1) + '</td><td>' + res + '</td><td>' + side(e.pc, e.p) + '</td><td>' + side(e.bc, e.b) + '</td><td>' + tags + '</td></tr>'; }).join('') + '</table>'; }
  function render(el, h, labels, info) {
    if (!el) return; labels = labels || { B: 'Banker', P: 'Player' };
    const dt = labels.B === 'Dragon'; const EN = isEN(); const L = { zb: EN ? (dt ? 'D' : 'B') : dt ? '龙' : '庄', zp: EN ? (dt ? 'T' : 'P') : dt ? '虎' : '闲', zt: EN ? 'T' : '和', B: labels.B, P: labels.P, EN };
    const cnt = { B: 0, P: 0, T: 0, bp: 0, pp: 0 }; h.forEach(e => { cnt[e.w]++; if (e.bp) cnt.bp++; if (e.pp) cnt.pp++; });
    const wpx = el.clientWidth || (el.parentNode && el.parentNode.clientWidth) || 800; const small = wpx < 520;
    const opt = small ? { bead: 6, right: 20 } : wpx < 800 ? { bead: 6, right: 22 } : { bead: 8, right: 30 };
    const pct = n => h.length ? Math.round(n / h.length * 100) + '%' : '';
    const pill = (cls, t, n) => '<span class="' + cls + '">' + t + ' <b>' + n + '</b>' + (cls !== 'n' && cls.length === 1 && h.length ? '<em>' + pct(n) + '</em>' : '') + '</span>';
    el.innerHTML = '<div class="rm-top"><div class="rm-stats">' + pill('b', EN ? L.B : L.zb + ' ' + L.B, cnt.B) + pill('p', EN ? L.P : L.zp + ' ' + L.P, cnt.P) + pill('t', EN ? 'Tie' : '和 Tie', cnt.T) +
      (labels.pairs !== false ? pill('bb', EN ? 'B Pair' : L.zb + '对', cnt.bp) + pill('pp', EN ? 'P Pair' : L.zp + '对', cnt.pp) : '') + (info ? (EN ? '<span class="n">Shoe <b>' + info.no + '</b> · Hand <b>' + h.length + '</b></span>' : '<span class="n">第 <b>' + info.no + '</b> 靴 · 局 <b>' + h.length + '</b></span>') + '<span class="n sh" title="8 副牌 · 切牌在倒数 ' + info.cutAt + ' 张 · 烧牌 ' + (info.burn || []).join(' ') + '">' + (EN ? '<b>' + info.left + '</b>/' + info.total + ' left' : '剩 <b>' + info.left + '</b>/' + info.total + ' 张') + '</span>' : '<span class="n">局 <b>' + h.length + '</b></span>') + '</div>' +
      '<div class="rm-ask">' + askBtn(h, 'B', L) + askBtn(h, 'P', L) + '</div><button class="rm-log">记录 LOG</button>' + (info && info.live ? '' : '<button class="rm-new">新靴 NEW SHOE</button>') + '</div>' +
      (info && info.end ? '<div class="rm-end">切牌已出 · 本靴结束，下一局自动换新靴 · Cut card out — new shoe next hand</div>' : '') + '<div class="rm-body">' + board(h, L, opt) + '</div>' + xstats(h, dt) + '<div class="rm-list"' + (el.dataset.log === '1' ? '' : ' hidden') + '>' + logHTML(h, L) + '</div>';
    const lb = el.querySelector('.rm-log'), ls = el.querySelector('.rm-list'); lb.classList.toggle('on', !ls.hidden); lb.onclick = e => { e.stopPropagation(); ls.hidden = !ls.hidden; el.dataset.log = ls.hidden ? '0' : '1'; lb.classList.toggle('on', !ls.hidden); if (!ls.hidden) ls.scrollTop = 0; };
    // 问路: tap (or hover) to preview where the next Banker / Player hand would land on every road
    el.querySelectorAll('.ask').forEach(b => { const w = b.dataset.ask; let t = 0;
      const show = () => { clearTimeout(t); el.querySelector('.rm-body').innerHTML = board(h.concat([{ w, ask: true }]), L, Object.assign({ askW: w }, opt)); t = setTimeout(hide, 2600); };
      const hide = () => { clearTimeout(t); const bd = el.querySelector('.rm-body'); if (bd) bd.innerHTML = board(h, L, opt); };
      b.onclick = e => { e.stopPropagation(); show(); }; b.onmouseenter = show; b.onmouseleave = hide; });
  }
  const css = document.createElement('style');
  css.textContent = '.roadmap{margin:8px auto 0;width:min(860px,100%);box-sizing:border-box;overflow:hidden;background:linear-gradient(#141a26,#0b0f17);border:1px solid rgba(255,214,10,.35);border-radius:12px;padding:7px;color:#dde;box-shadow:0 6px 18px rgba(0,0,0,.45)}' +
    '.rm-svg{display:block;width:100%;height:auto;border-radius:6px;overflow:hidden}.rm-svg .rg line{stroke:rgba(255,255,255,.13);stroke-width:.45}.rm-svg .rg2 line{stroke:rgba(255,255,255,.08);stroke-width:.3}.rm-svg .sep{stroke:rgba(255,214,10,.45);stroke-width:.8}' +
    '.rm-svg text.bd{font:900 ' + 10 + 'px "PingFang SC","Microsoft YaHei",sans-serif;fill:#fff;text-anchor:middle}.rm-svg text.tn{font:900 5px Arial,sans-serif;fill:' + GREEN + ';text-anchor:middle}.rm-svg text.lb{font:700 4.2px "Microsoft YaHei",Arial,sans-serif;fill:#aab3c5;text-anchor:end;opacity:.9}' +
    '.rm-svg .blk{animation:rmblk .45s steps(2,start) infinite}@keyframes rmblk{to{visibility:hidden}}' +
    '.rm-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}.rm-stats{display:flex;gap:5px;flex-wrap:wrap;font:800 11px "Microsoft YaHei",Arial,sans-serif}.rm-stats span{padding:2px 8px;border-radius:9px;background:#333;color:#fff;white-space:nowrap}.rm-stats span b{font-size:12px}.rm-stats span em{font-style:normal;opacity:.75;font-size:9px;margin-left:3px}' +
    '.rm-stats .b{background:' + RED + '}.rm-stats .p{background:' + BLUE + '}.rm-stats .t{background:' + GREEN + '}.rm-stats .bb{background:rgba(229,56,59,.25);border:1px solid ' + RED + '}.rm-stats .pp{background:rgba(47,111,228,.25);border:1px solid ' + BLUE + '}.rm-stats .n{background:#2a2f3a}' +
    '.rm-ask{display:flex;gap:6px;margin-left:auto}.ask{display:flex;align-items:center;gap:4px;background:#232834;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:3px 7px 3px 3px;cursor:pointer;color:#fff}.ask:hover{border-color:#ffd60a}.ask b{font:900 11px "Microsoft YaHei",Arial;color:#fff;border-radius:7px;padding:2px 6px}.ask i{display:inline-block;width:9px;height:9px}.ask i.ring{border:2px solid;border-radius:50%;width:6px;height:6px}.ask i.dot{border-radius:50%}.ask i.sl{width:2.5px;height:11px;transform:rotate(40deg);border-radius:2px}.ask i.na{background:#555;border-radius:50%;width:4px;height:4px}' +
    '.rm-new{border:1px solid rgba(255,255,255,.3);background:transparent;color:#ccd;border-radius:8px;font:800 10px "Microsoft YaHei",Arial;padding:4px 8px;cursor:pointer}' +
    '.rm-svg text.xb{font:900 4.4px "PingFang SC","Microsoft YaHei",sans-serif;fill:#fff;text-anchor:middle}' +
    '.rm-x{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}@media(max-width:560px){.rm-x,.rm-stats{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.rm-x::-webkit-scrollbar,.rm-stats::-webkit-scrollbar{display:none}.rm-stats{flex:1 1 100%;min-width:0}.rm-x span,.rm-stats span{flex-shrink:0;white-space:nowrap}.rm-ask{margin-left:0}}.rm-x span{display:flex;align-items:center;gap:3px;font:800 10.5px "Microsoft YaHei",Arial,sans-serif;background:#1e2430;border:1px solid var(--xc);border-radius:9px;padding:1px 7px 1px 2px;color:#e8e8ee}.rm-x i{font-style:normal;background:var(--xc);color:#fff;border-radius:7px;padding:0 4px;font-size:9.5px}.rm-x b{color:#ffd60a}' +
    '.rm-end{margin:0 0 6px;padding:4px 8px;border-radius:8px;background:rgba(255,214,10,.15);border:1px solid #ffd60a;color:#ffd60a;font:800 11px "Microsoft YaHei",Arial,sans-serif;text-align:center}' +
    '.rm-log{border:1px solid rgba(255,214,10,.5);background:transparent;color:#ffd60a;border-radius:8px;font:800 10px "Microsoft YaHei",Arial;padding:4px 8px;cursor:pointer}.rm-log.on{background:#ffd60a;color:#1a1200}' +
    '.rm-list{margin-top:6px;max-height:190px;overflow:auto;border-radius:8px;background:#0d1119;border:1px solid rgba(255,255,255,.12)}.rm-list table{width:100%;border-collapse:collapse;font:700 11px "Microsoft YaHei",Arial,sans-serif;color:#dfe2ea}.rm-list th{position:sticky;top:0;background:#1a2130;color:#ffd60a;font-size:10px;padding:4px;text-align:left}.rm-list td{padding:3px 4px;border-top:1px solid rgba(255,255,255,.06);white-space:nowrap}' +
    '.rm-list td b{display:inline-block;min-width:18px;text-align:center;border-radius:5px;color:#fff;padding:0 3px}.rm-list td b.b{background:' + RED + '}.rm-list td b.p{background:' + BLUE + '}.rm-list td b.t{background:' + GREEN + '}.rm-list td span{margin-right:1px}.rm-list td span.rd{color:#ff6b6b}.rm-list td em{font-style:normal;color:#ffd60a;margin-left:3px}.rm-list td i{font-style:normal;font-size:9.5px;color:#fff;border-radius:5px;padding:0 4px;margin-right:3px}.rm-empty{padding:10px;font:700 11px Arial;color:#99a}' +
    '@media(max-width:520px){.rm-stats{font-size:10px}.rm-stats span{padding:1px 6px}.rm-stats span em{display:none}.rm-ask{margin-left:0}.ask b{font-size:10px}}';
  document.head.appendChild(css);
  window.LVRoad = {
    load, save, render, SHOE,
    add(id, e) { const h = load(id); if (h.length >= SHOE) h.length = 0; h.push(e); save(id, h); return h; },
    clear(id) { save(id, []); return []; },
  };
})();
