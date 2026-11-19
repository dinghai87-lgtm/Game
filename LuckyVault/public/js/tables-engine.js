// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// Table / card / instant games engine — shared by browser (demo mode) and server (authoritative).
// Every game: validate(cfg,bets) -> total stake | {err}; deal(cfg,bets) -> out; cost(cfg,state,a) -> extra stake | null; act(cfg,state,a,input) -> out
// out = {state, done, win (total returned incl. stakes), view}
var TE = (function () {
  const rnd = Math.random;
  const r2 = x => Math.round(x * 100) / 100;
  const ri = n => Math.floor(rnd() * n);
  // ---------- cards ----------
  const RANKS = '23456789TJQKA';
  function deck(n, jokers) { const d = []; for (let k = 0; k < (n || 1); k++) for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s }); for (let j = 0; j < (jokers || 0); j++) d.push({ r: 0, s: 4 }); for (let i = d.length - 1; i > 0; i--) { const j = ri(i + 1);[d[i], d[j]] = [d[j], d[i]]; } return d; }
  const cs = c => c ? (c.r === 0 ? 'JK' : RANKS[c.r - 2] + 'shdc'[c.s]) : '??';
  const C = a => a.map(cs);
  // ---------- poker evaluation ----------
  const HN = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'];
  function eval5(cards) { // natural 5-card hand -> [cat, ...kickers]
    const rs = cards.map(c => c.r).sort((a, b) => b - a), fl = cards.every(c => c.s === cards[0].s);
    const cnt = {}; rs.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
    const g = Object.keys(cnt).map(Number).sort((a, b) => cnt[b] - cnt[a] || b - a);
    let st = 0; const u = [...new Set(rs)]; if (u.length === 5) { if (u[0] - u[4] === 4) st = u[0]; else if (u[0] === 14 && u[1] === 5) st = 5; }
    if (st && fl) return [st === 14 ? 9 : 8, st];
    if (cnt[g[0]] === 4) return [7, g[0], g[1]];
    if (cnt[g[0]] === 3 && cnt[g[1]] === 2) return [6, g[0], g[1]];
    if (fl) return [5, ...rs];
    if (st) return [4, st];
    if (cnt[g[0]] === 3) return [3, ...g];
    if (cnt[g[0]] === 2 && cnt[g[1]] === 2) return [2, ...g];
    if (cnt[g[0]] === 2) return [1, ...g];
    return [0, ...rs];
  }
  const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
  function best5(cards) { let best = null; const n = cards.length; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) { const h = [cards[a], cards[b], cards[c], cards[d], cards[e]]; const v = eval5(h); if (!best || cmp(v, best.v) > 0) best = { v, h }; } return best; }
  function eval3(cards) { // three card poker
    const rs = cards.map(c => c.r).sort((a, b) => b - a), fl = cards.every(c => c.s === cards[0].s);
    let st = 0; if (rs[0] - rs[1] === 1 && rs[1] - rs[2] === 1) st = rs[0]; else if (rs[0] === 14 && rs[1] === 3 && rs[2] === 2) st = 3;
    if (st && fl) return [5, st]; if (rs[0] === rs[2]) return [4, rs[0]]; if (st) return [3, st]; if (fl) return [2, ...rs];
    if (rs[0] === rs[1]) return [1, rs[0], rs[2]]; if (rs[1] === rs[2]) return [1, rs[1], rs[0]]; return [0, ...rs];
  }
  const H3 = ['High Card', 'Pair', 'Flush', 'Straight', 'Three of a Kind', 'Straight Flush'];

  // ---------- video poker ----------
  const VP = {
    job: { name: 'Jacks or Better', min: 11, rows: [['Royal Flush', 250], ['Straight Flush', 50], ['Four of a Kind', 25], ['Full House', 9], ['Flush', 6], ['Straight', 4], ['Three of a Kind', 3], ['Two Pair', 2], ['Jacks or Better', 1]] },
    bp: { name: 'Bonus Poker', min: 11, rows: [['Royal Flush', 250], ['Straight Flush', 50], ['Four Aces', 80], ['Four 2s-4s', 40], ['Four 5s-Ks', 25], ['Full House', 8], ['Flush', 5], ['Straight', 4], ['Three of a Kind', 3], ['Two Pair', 2], ['Jacks or Better', 1]] },
    dbp: { name: 'Double Bonus Poker', min: 11, rows: [['Royal Flush', 250], ['Straight Flush', 50], ['Four Aces', 160], ['Four 2s-4s', 80], ['Four 5s-Ks', 50], ['Full House', 9], ['Flush', 7], ['Straight', 5], ['Three of a Kind', 3], ['Two Pair', 1], ['Jacks or Better', 1]] },
    af: { name: 'Aces & Faces', min: 11, rows: [['Royal Flush', 250], ['Straight Flush', 50], ['Four Aces', 80], ['Four J/Q/K', 40], ['Four 2s-10s', 25], ['Full House', 8], ['Flush', 5], ['Straight', 4], ['Three of a Kind', 3], ['Two Pair', 2], ['Jacks or Better', 1]] },
    dw: { name: 'Deuces Wild', wild: 'deuce', rows: [['Natural Royal Flush', 250], ['Four Deuces', 200], ['Wild Royal Flush', 25], ['Five of a Kind', 16], ['Straight Flush', 10], ['Four of a Kind', 4], ['Full House', 4], ['Flush', 3], ['Straight', 2], ['Three of a Kind', 1]] },
    jk: { name: 'Joker Poker', wild: 'joker', min: 13, rows: [['Natural Royal Flush', 250], ['Five of a Kind', 200], ['Wild Royal Flush', 100], ['Straight Flush', 50], ['Four of a Kind', 20], ['Full House', 7], ['Flush', 5], ['Straight', 3], ['Three of a Kind', 2], ['Two Pair', 1], ['Kings or Better', 1]] }
  };
  ['job', 'dw', 'dbp'].forEach(k => { VP[k + '3'] = Object.assign({}, VP[k], { name: 'Triple Play ' + VP[k].name, hands: 3 }); VP[k + '10'] = Object.assign({}, VP[k], { name: 'Ten Play ' + VP[k].name, hands: 10 }); });
  function canStraight(rs, w) { // rs distinct non-wild ranks
    if (rs.length + w < 5) return 0; const cands = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5];
    for (const top of cands) { const need = top === 5 ? [5, 4, 3, 2, 14] : [top, top - 1, top - 2, top - 3, top - 4]; if (rs.every(r => need.includes(r))) return top; } return 0;
  }
  function vpHand(cfg, cards) {
    const isW = c => cfg.wild === 'deuce' ? c.r === 2 : cfg.wild === 'joker' ? c.r === 0 : false;
    const nat = cards.filter(c => !isW(c)), w = cards.length - nat.length;
    const rs = nat.map(c => c.r), cnt = {}; rs.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
    const g = Object.keys(cnt).map(Number).sort((a, b) => cnt[b] - cnt[a] || b - a); const top = g.length ? cnt[g[0]] : 0, sec = g.length > 1 ? cnt[g[1]] : 0;
    const distinct = g.length === rs.length; const flush = nat.every(c => c.s === (nat[0] || {}).s);
    const st = distinct ? canStraight(rs, w) : 0;
    const names = cfg.rows.map(r => r[0]); const has = n => names.includes(n) ? n : null;
    if (!w) {
      const v = eval5(cards);
      if (v[0] === 9) return has('Royal Flush') || has('Natural Royal Flush');
      if (v[0] === 8) return 'Straight Flush';
      if (v[0] === 7) { const q = v[1];
        if (has('Four Aces')) { if (q === 14) return 'Four Aces'; if (has('Four 2s-4s')) return q <= 4 ? 'Four 2s-4s' : 'Four 5s-Ks'; return (q >= 11 && q <= 13) ? 'Four J/Q/K' : 'Four 2s-10s'; }
        return 'Four of a Kind'; }
      if (v[0] === 6) return 'Full House'; if (v[0] === 5) return 'Flush'; if (v[0] === 4) return 'Straight'; if (v[0] === 3) return has('Three of a Kind');
      if (v[0] === 2) return has('Two Pair');
      if (v[0] === 1 && cfg.min && v[1] >= cfg.min) return has('Jacks or Better') || has('Kings or Better');
      return null;
    }
    if (cfg.wild === 'deuce' && w === 4) return 'Four Deuces';
    if (distinct && flush && st && rs.every(r => r >= 10)) return 'Wild Royal Flush';
    if (top + w >= 5) return 'Five of a Kind';
    if (distinct && flush && st) return 'Straight Flush';
    if (top + w >= 4) return 'Four of a Kind';
    if (g.length <= 2 && top + sec + w >= 5) return 'Full House';
    if (flush) return 'Flush';
    if (st) return 'Straight';
    if (top + w >= 3) return 'Three of a Kind';
    if (cfg.min && (rs.some(r => r >= cfg.min) || w >= 2)) return has('Kings or Better') || has('Jacks or Better');
    return null;
  }
  function vpPay(cfg, name, coins) { if (!name) return 0; const row = cfg.rows.find(r => r[0] === name); if (!row) return 0; return (/Royal/.test(name) && !/Wild/.test(name) && coins === 5) ? 800 : row[1]; }

  // ---------- blackjack ----------
  const BJV = { classic: { decks: 6, h17: true, dbl: 'any', hole: true, bj: 1.5, name: '6 decks · Dealer hits soft 17' }, vegas: { decks: 4, h17: false, dbl: 'any', hole: true, bj: 1.5, sur: true, name: '4 decks · Dealer stands on all 17s · Late surrender' }, single: { decks: 1, h17: true, dbl: '10-11', hole: true, bj: 1.5, name: '1 deck · Double on 10-11 only' }, euro: { decks: 2, h17: false, dbl: '9-11', hole: false, bj: 1.5, name: '2 decks · No hole card · Double 9-11' } , free: { decks: 6, h17: true, dbl: 'any', hole: true, bj: 1.5, free: true, push22: true, name: 'Free Bet · free doubles on hard 9-11 and free splits (not tens) · dealer 22 pushes' }, spanish: { decks: 6, h17: true, dbl: 'any', hole: true, bj: 1.5, sur: true, spanish: true, name: 'Spanish 21 · no tens · your 21 always wins · 5/6/7-card 21 pays 3:2 / 2:1 / 3:1 · late surrender' }, switch: { decks: 6, h17: true, dbl: 'any', hole: true, bj: 1, push22: true, switch: true, name: 'Blackjack Switch · two hands, swap the second cards · blackjack pays 1:1 · dealer 22 pushes' } };
  const cv = c => c.r === 14 ? 11 : Math.min(10, c.r);
  function hv(cards) { let t = 0, a = 0; cards.forEach(c => { t += cv(c); if (c.r === 14) a++; }); while (t > 21 && a) { t -= 10; a--; } return { t, soft: a > 0 }; }
  const isBJ = h => h.length === 2 && hv(h).t === 21;
  function bjActions(cfg, s) {
    if (s.done) return []; if (s.sw === 'offer') return ['switch', 'noswitch']; if (s.ins === 'offer') return ['insurance', 'noins']; const h = s.hands[s.cur]; const a = ['hit', 'stand']; const t = hv(h.cards).t;
    if (cfg.sur && s.hands.length === 1 && h.cards.length === 2 && !h.doubled) a.push('surrender');
    if (h.cards.length === 2 && !h.splitAces) { if (cfg.dbl === 'any' || (cfg.dbl === '10-11' && (t === 10 || t === 11)) || (cfg.dbl === '9-11' && t >= 9 && t <= 11)) a.push('double'); if (cv(h.cards[0]) === cv(h.cards[1]) && s.hands.length < 4) a.push('split'); }
    return a;
  }
  function bjNext(cfg, s) {
    while (s.cur < s.hands.length && s.hands[s.cur].done) s.cur++;
    if (s.cur < s.hands.length) { const h = s.hands[s.cur]; if (h.cards.length === 1) { h.cards.push(s.shoe.pop()); if (h.splitAces || hv(h.cards).t === 21) h.done = true; return bjNext(cfg, s); } return null; }
    // dealer
    const live = s.hands.some(h => hv(h.cards).t <= 21);
    if (!cfg.hole || s.dealer.length < 2) s.dealer.push(s.shoe.pop());
    const dBJ = isBJ(s.dealer);
    if (live && !dBJ) { while (true) { const d = hv(s.dealer); if (d.t < 17 || (d.t === 17 && d.soft && cfg.h17)) s.dealer.push(s.shoe.pop()); else break; } }
    const dt = hv(s.dealer).t; let win = 0;
    s.hands.forEach(h => { const t = hv(h.cards).t; let r; const fr = h.free || 0;
      if (t > 21) r = 'bust'; else if (cfg.spanish && t === 21) r = 'win'; else if (dBJ) r = 'lose'; else if (cfg.push22 && dt === 22) r = 'push'; else if (dt > 21 || t > dt) r = 'win'; else if (t === dt) r = 'push'; else r = 'lose';
      let mult = 1; if (cfg.spanish && r === 'win' && t === 21 && !h.doubled) { const n = h.cards.length; mult = n >= 7 ? 3 : n === 6 ? 2 : n === 5 ? 1.5 : 1; if (mult > 1) h.bonus = mult; }
      h.res = r; win += r === 'win' ? h.bet * (1 + mult) + fr : r === 'push' ? h.bet : 0; });
    s.done = true; return win;
  }
  // ---------- baccarat ----------
  const bv = c => c.r >= 10 && c.r <= 13 ? 0 : c.r === 14 ? 1 : c.r;
  const bt = h => h.reduce((a, c) => a + bv(c), 0) % 10;
  // ---------- real 8-deck shoe (baccarat / dragon tiger) ----------
  // {no, c: card codes 2 chars each, p: next card, cut: cut-card position, burn: [codes], road: [hand records], end}
  // The cut card sits 14-19 cards from the back; when it comes out the hand finishes and the next hand starts a new shoe.
  const dec = code => code === 'JK' ? { r: 0, s: 4 } : { r: RANKS.indexOf(code[0]) + 2, s: 'shdc'.indexOf(code[1]) };
  function newShoe(no) { const d = deck(8); const c = d.map(cs).join(''); const n = d.length; const sh = { no: no || 1, c, p: 0, cut: n - (14 + ri(6)), burn: [], road: [], end: false };
    const first = dec(c.substr(0, 2)); const k = first.r >= 10 && first.r <= 13 ? 10 : first.r === 14 ? 1 : first.r;   // burn: show the first card, burn that many
    sh.burn.push(c.substr(0, 2)); sh.p = 1 + k; return sh; }
  function shoeDraw(sh) { if (sh.p >= sh.c.length / 2) { sh.p = 0; } const code = sh.c.substr(sh.p * 2, 2); sh.p++; if (sh.p >= sh.cut) sh.end = true; return dec(code); }
  function shoeInfo(sh) { if (!sh) return null; const total = sh.c.length / 2; return { no: sh.no, left: total - sh.p, total, cutAt: total - sh.cut, end: !!sh.end, burn: sh.burn, road: sh.road }; }
  // one scoreboard record per hand (same shape the client scoreboard draws)
  function roadEntry(kind, s) {
    if (kind === 'dragontiger') return { w: s.win === 'dragon' ? 'B' : s.win === 'tiger' ? 'P' : 'T', pc: [s.T], bc: [s.D], x: s.win === 'tie' && s.D[1] === s.T[1] ? ['stie'] : [] };
    const x = [], bw = s.win === 'banker', pw = s.win === 'player', nB = s.B.length, nP = s.P.length;
    if (bw && s.bt === 6) x.push(nB === 2 ? 'st' : 'bt'); if (pw && s.pt === 7) x.push(nP === 2 ? 'sd' : 'bd'); if (bw && nB === 3 && s.bt === 7) x.push('d7'); if (pw && nP === 3 && s.pt === 8) x.push('p8');
    if ((nP === 2 && s.pt >= 8) || (nB === 2 && s.bt >= 8)) x.push('nat');
    return { w: bw ? 'B' : pw ? 'P' : 'T', pp: s.P[0][0] === s.P[1][0], bp: s.B[0][0] === s.B[1][0], p: s.pt, b: s.bt, pc: s.P.slice(), bc: s.B.slice(), x };
  }
  function baccaratDeal(shoe) {
    const fresh = shoe ? null : deck(8), take = () => shoe ? shoeDraw(shoe) : fresh.pop(); const sh = { pop: take };
    const P = [sh.pop(), sh.pop()], B = [sh.pop(), sh.pop()];
    let pt = bt(P), btt = bt(B);
    if (pt < 8 && btt < 8) {
      let p3 = null; if (pt <= 5) { p3 = sh.pop(); P.push(p3); }
      btt = bt(B); const v = p3 ? bv(p3) : null; let draw;
      if (!p3) draw = btt <= 5; else draw = btt <= 2 || (btt === 3 && v !== 8) || (btt === 4 && v >= 2 && v <= 7) || (btt === 5 && v >= 4 && v <= 7) || (btt === 6 && (v === 6 || v === 7));
      if (draw) B.push(sh.pop());
    }
    pt = bt(P); btt = bt(B); return { P, B, pt, bt: btt, win: pt > btt ? 'player' : btt > pt ? 'banker' : 'tie' };
  }
  // ---------- roulette ----------
  const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  function rlNums(k) { // inside bets -> covered numbers
    let m; if ((m = k.match(/^sp(\d+)_(\d+)$/))) return [+m[1], +m[2]];
    if ((m = k.match(/^st(\d+)$/))) return [+m[1], +m[1] + 1, +m[1] + 2];
    if ((m = k.match(/^co(\d+)$/))) { const a = +m[1]; return [a, a + 1, a + 3, a + 4]; }
    if ((m = k.match(/^sl(\d+)$/))) { const a = +m[1]; return [a, a + 1, a + 2, a + 3, a + 4, a + 5]; }
    return null; }
  function rlValid(k) { const ns = rlNums(k); if (!ns) return true; if (ns.some(x => x < 1 || x > 36)) return false; let m;
    if ((m = k.match(/^sp(\d+)_(\d+)$/))) { const a = +m[1], b = +m[2]; return (b === a + 3) || (b === a + 1 && a % 3 !== 0); }
    if ((m = k.match(/^st(\d+)$/))) return (+m[1]) % 3 === 1;
    if ((m = k.match(/^co(\d+)$/))) return (+m[1]) % 3 !== 0 && +m[1] <= 32;
    if ((m = k.match(/^sl(\d+)$/))) return (+m[1]) % 3 === 1 && +m[1] <= 31; return false; }
  function rlHit(k, n) { // n: 0..36, or 37 for 00
    const z = n === 0 || n === 37;
    if (k[0] === 'n') return k === 'n' + (n === 37 ? '00' : n);
    const ns = rlNums(k); if (ns) return ns.includes(n);
    if (z) return false;
    switch (k) {
      case 'red': return REDS.includes(n); case 'black': return !REDS.includes(n); case 'odd': return n % 2 === 1; case 'even': return n % 2 === 0; case 'low': return n <= 18; case 'high': return n >= 19;
      case 'd1': return n <= 12; case 'd2': return n >= 13 && n <= 24; case 'd3': return n >= 25; case 'c1': return n % 3 === 1; case 'c2': return n % 3 === 2; case 'c3': return n % 3 === 0;
    } return false;
  }
  const rlPay = k => k[0] === 'n' ? 36 : /^sp/.test(k) ? 18 : /^st/.test(k) ? 12 : /^co/.test(k) ? 9 : /^sl/.test(k) ? 6 : (k[0] === 'd' || k[0] === 'c') ? 3 : 2;
  // ---------- sic bo ----------
  const SB_T = { 4: 60, 5: 30, 6: 17, 7: 12, 8: 8, 9: 6, 10: 6, 11: 6, 12: 6, 13: 8, 14: 12, 15: 17, 16: 30, 17: 60 };
  // ---------- keno ----------
  const KENO = { // pays (x bet) by picks -> hits
    1: { 1: 3.6 }, 2: { 2: 14.4 }, 3: { 2: 2, 3: 42 }, 4: { 2: 1, 3: 4, 4: 105 }, 5: { 3: 3, 4: 15, 5: 600 }, 6: { 3: 1, 4: 5, 5: 70, 6: 1500 },
    7: { 3: 1, 4: 2, 5: 18, 6: 350, 7: 5000 }, 8: { 4: 2, 5: 10, 6: 75, 7: 1000, 8: 10000 }, 9: { 4: 1, 5: 5, 6: 40, 7: 300, 8: 4000, 9: 10000 }, 10: { 5: 4, 6: 20, 7: 120, 8: 1000, 9: 5000, 10: 10000 }
  };
  function comb(n, k) { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; }
  function kenoScale(power) { const T = {}; for (const n in KENO) { let ev = 0; const row = KENO[n]; for (const h in row) { const p = comb(20, +h) * comb(60, n - h) / comb(80, +n); ev += p * row[h] * (power ? 1 + 3 * h / 20 : 1); } const f = 0.92 / ev; T[n] = {}; for (const h in row) { const v = row[h] * f; T[n][h] = v >= 1000 ? Math.round(v / 100) * 100 : v >= 100 ? Math.round(v / 5) * 5 : v >= 10 ? Math.round(v * 2) / 2 : Math.round(v * 10) / 10; } } return T; }
  const KENO_T = { classic: kenoScale(false), power: kenoScale(true) };
  // ---------- scratch ----------
  const SCR = { cash: { name: 'Lucky Cash', sym: null }, gold: { name: 'Gold Rush', sym: ['⛏️', '🪙', '💰', '🧨', '🔔', '🍀', '⭐', '💎'] }, diamond: { name: 'Diamond Dazzle', sym: ['💎', '💍', '👑', '🔮', '⭐', '🌙', '🔔', '🍀'] } };
  const SCR_P = [[500, .00008], [100, .0006], [50, .0018], [20, .0055], [10, .012], [5, .03], [2, .075], [1, .2]];
  // ---------- money wheel ----------
  const WHEEL = []; (function () { const plan = [['1', 24], ['2', 15], ['5', 7], ['10', 4], ['20', 2], ['J', 1], ['L', 1]]; /* the classic 54-segment Big Six wheel: `order` must hold exactly these counts (tests check it) */ const order = ['1', '2', '1', '5', '1', '2', '1', '10', '1', '2', '1', '5', '1', '2', '1', '20', '1', '2', '1', '5', '1', '2', '1', '10', '2', 'J', '1', '2', '1', '5', '1', '2', '1', '10', '1', '2', '1', '5', '1', '2', '1', '20', '1', '2', '1', '5', '1', '2', '1', '10', '5', 'L', '2', '2']; order.forEach(x => WHEEL.push(x)); })();
  const WPAY = { '1': 2, '2': 3, '5': 6, '10': 11, '20': 21, J: 41, L: 41 };

  // ================= GAME KINDS =================
  const K = {};
  const sumBets = b => Object.values(b).reduce((a, x) => a + x, 0);
  function cleanBets(bets, keys) { const o = {}; for (const k in bets || {}) { const v = r2(+bets[k]); if (!(v > 0)) continue; if (keys && !keys(k)) return null; o[k] = v; } return o; }

  K.blackjack = {
    keys: k => k === 'main' || k === 'pp' || k === 't213', cfg: v => BJV[v] || BJV.classic, total: (b, cfg) => r2(b.main * (cfg && cfg.switch ? 2 : 1) + (b.pp || 0) + (b.t213 || 0)),
    validate(cfg, b) { if (!b.main) return { err: 'bad_bet', msg: 'Place a main bet first' }; },
    deal(cfg, b) {
      const sh = cfg.spanish ? deck(cfg.decks).filter(c => c.r !== 10) : deck(cfg.decks);
      const s = { shoe: sh, dealer: [], hands: [{ cards: [], bet: b.main }], cur: 0, done: false };
      if (cfg.switch) { s.hands.push({ cards: [], bet: b.main }); const [h1, h2] = s.hands; h1.cards.push(sh.pop()); h2.cards.push(sh.pop()); s.dealer.push(sh.pop()); h1.cards.push(sh.pop()); h2.cards.push(sh.pop()); s.dealer.push(sh.pop());
        if ((s.dealer[0].r === 14 || cv(s.dealer[0]) === 10) && isBJ(s.dealer)) { s.done = true; let w = 0; s.hands.forEach(h => { h.res = isBJ(h.cards) ? 'push' : 'lose'; if (h.res === 'push') w += h.bet; h.done = true; }); return { state: s, done: true, win: w }; }
        s.sw = 'offer'; return { state: s, done: false, win: 0 }; }
      const h = s.hands[0]; h.cards.push(s.shoe.pop()); s.dealer.push(s.shoe.pop()); h.cards.push(s.shoe.pop()); if (cfg.hole) s.dealer.push(s.shoe.pop());
      if (cfg.spanish && isBJ(h.cards)) { s.done = true; h.done = true; h.res = 'blackjack'; return { state: s, done: true, win: h.bet * (1 + cfg.bj) }; }
      const up = s.dealer[0]; let win = 0;
      if (cfg.hole && up.r === 14) { s.ins = 'offer'; return { state: s, done: false, win: 0 }; }
      if (cfg.hole && (cv(up) >= 10) && isBJ(s.dealer)) { s.done = true; h.res = isBJ(h.cards) ? 'push' : 'lose'; win = isBJ(h.cards) ? h.bet : 0; }
      else if (isBJ(h.cards)) { if (!cfg.hole) { s.dealer.push(s.shoe.pop()); } const dbj = isBJ(s.dealer); s.done = true; h.res = dbj ? 'push' : 'blackjack'; win = dbj ? h.bet : h.bet * (1 + cfg.bj); h.done = true; }
      return { state: s, done: s.done, win };
    },
    cost(cfg, s, a) { if (!bjActions(cfg, s).includes(a)) return null; const h = s.hands[s.cur];
      if (a === 'double') return K.blackjack.freeDbl(cfg, h) ? 0 : h.bet + (h.free || 0);
      if (a === 'split') return K.blackjack.freeSplit(cfg, h) ? 0 : h.bet + (h.free || 0);
      return a === 'insurance' ? r2(s.hands[0].bet / 2) : 0; },
    freeDbl(cfg, h) { const v = hv(h.cards); return !!cfg.free && !v.soft && v.t >= 9 && v.t <= 11; },
    freeSplit(cfg, h) { return !!cfg.free && cv(h.cards[0]) !== 10; },
    act(cfg, s, a) {
      const h = s.hands[s.cur];
      if (a === 'insurance' || a === 'noins') {
        s.insBet = a === 'insurance' ? r2(h.bet / 2) : 0; s.ins = 'done';
        const pbj = isBJ(h.cards);
        if (isBJ(s.dealer)) { s.done = true; h.done = true; h.res = pbj ? 'push' : 'lose'; s.insRes = 'won'; return { state: s, done: true, win: s.insBet * 3 + (pbj ? h.bet : 0) }; }
        s.insRes = s.insBet ? 'lost' : null;
        if (pbj) { s.done = true; h.done = true; h.res = 'blackjack'; return { state: s, done: true, win: h.bet * (1 + cfg.bj) }; }
        return { state: s, done: false, win: 0 };
      }
      if (a === 'surrender') { s.done = true; h.done = true; h.res = 'surrender'; return { state: s, done: true, win: r2(h.bet / 2) }; }
      if (a === 'switch' || a === 'noswitch') { s.sw = 'done'; if (a === 'switch') { const [h1, h2] = s.hands; const t = h1.cards[1]; h1.cards[1] = h2.cards[1]; h2.cards[1] = t; s.switched = true; }
        s.hands.forEach(x => { if (hv(x.cards).t === 21) x.done = true; }); s.cur = 0; const w = bjNext(cfg, s); return { state: s, done: s.done, win: s.done ? w : 0 }; }
      if (a === 'hit') { h.cards.push(s.shoe.pop()); if (hv(h.cards).t >= 21) h.done = true; }
      else if (a === 'stand') h.done = true;
      else if (a === 'double') { const st = h.bet + (h.free || 0); if (K.blackjack.freeDbl(cfg, h)) h.free = (h.free || 0) + st; else h.bet += st; h.doubled = true; h.cards.push(s.shoe.pop()); h.done = true; }
      else if (a === 'split') { const c2 = h.cards.pop(); const aces = h.cards[0].r === 14; const fs = K.blackjack.freeSplit(cfg, h); const nh = fs ? { cards: [c2], bet: 0, free: h.bet + (h.free || 0), splitAces: aces } : { cards: [c2], bet: h.bet, free: h.free || 0, splitAces: aces }; h.splitAces = aces; s.hands.splice(s.cur + 1, 0, nh); h.cards.push(s.shoe.pop()); if (aces || hv(h.cards).t === 21) h.done = true; }
      const w = bjNext(cfg, s); return { state: s, done: s.done, win: s.done ? w : 0 };
    },
    view(cfg, s) {
      const hide = !s.done && cfg.hole; const d = hide ? [cs(s.dealer[0]), '??'] : C(s.dealer);
      return { ins: s.ins || null, insBet: s.insBet || 0, insRes: s.insRes || null, dealer: d, dealerTotal: hide ? hv([s.dealer[0]]).t : hv(s.dealer).t, hands: s.hands.map(h => ({ cards: C(h.cards), total: hv(h.cards).t, soft: hv(h.cards).soft, bet: h.bet, free: h.free || 0, bonus: h.bonus || 0, res: h.res || null, bj: isBJ(h.cards) && (s.hands.length === 1 || (cfg.switch && !s.switched)) })), cur: s.cur, actions: bjActions(cfg, s), done: s.done };
    }
  };

  // blackjack side bets: Perfect Pairs and 21+3 (player's first two cards + dealer up card)
  function ppRes(a, b) { if (a.r !== b.r) return null; if (a.s === b.s) return ['Perfect Pair', 25]; const red = x => x.s === 1 || x.s === 2; return red(a) === red(b) ? ['Coloured Pair', 12] : ['Mixed Pair', 6]; }
  function t213Res(cs3) { const rs = cs3.map(c => c.r).sort((a, b) => a - b), fl = cs3.every(c => c.s === cs3[0].s), trips = rs[0] === rs[2];
    const st = (rs[2] - rs[1] === 1 && rs[1] - rs[0] === 1) || (rs[0] === 2 && rs[1] === 3 && rs[2] === 14);
    if (trips && fl) return ['Suited Trips', 100]; if (st && fl) return ['Straight Flush', 40]; if (trips) return ['Three of a Kind', 30]; if (st) return ['Straight', 10]; if (fl) return ['Flush', 5]; return null; }
  { const D0 = K.blackjack.deal, A0 = K.blackjack.act, V0 = K.blackjack.view;
    K.blackjack.deal = function (cfg, b) { const out = D0.call(this, cfg, { main: b.main }); const s = out.state; const h = s.hands[0].cards; const side = { win: 0, r: {} };
      if (b.pp) { const x = ppRes(h[0], h[1]); side.r.pp = x ? x[0] + ' ' + x[1] + ':1' : 'No pair'; if (x) side.win += b.pp * (1 + x[1]); side.pp = b.pp; }
      if (b.t213) { const x = t213Res([h[0], h[1], s.dealer[0]]); side.r.t213 = x ? x[0] + ' ' + x[1] + ':1' : 'No hand'; if (x) side.win += b.t213 * (1 + x[1]); side.t213 = b.t213; }
      side.win = r2(side.win); s.side = side; if (out.done) { out.win = r2(out.win + side.win); side.paid = true; } return out; };
    K.blackjack.act = function (cfg, s, a, inp) { const out = A0.call(this, cfg, s, a, inp); if (out.done && s.side && !s.side.paid) { out.win = r2(out.win + s.side.win); s.side.paid = true; } return out; };
    K.blackjack.view = function (cfg, s) { const v = V0.call(this, cfg, s); if (s.side && (s.side.pp || s.side.t213)) v.side = { r: s.side.r, win: s.side.win }; return v; }; }
  const LUCKY_M = [50, 100, 150, 200, 300, 400, 500]; let LUCKY_K = 1.415;
  K.roulette = {
    keys: k => /^(n([0-9]|[12][0-9]|3[0-6]|00)|red|black|odd|even|low|high|d[123]|c[123]|sp\d{1,2}_\d{1,2}|st\d{1,2}|co\d{1,2}|sl\d{1,2})$/.test(k) && rlValid(k), cfg: v => ({ eu: { zeros: 1, partage: false }, fr: { zeros: 1, partage: true }, us: { zeros: 2, partage: false }, lucky: { zeros: 1, partage: false, lucky: true } })[v] || { zeros: 1 },
    validate(cfg, b) { if (cfg.zeros === 1 && b.n00) return { err: 'bad_bet' }; },
    deal(cfg, b, inp) {   // inp.force: {n} — outcome fixed by a shared table
      const n = inp && inp.force ? inp.force.n : ri(37 + (cfg.zeros === 2 ? 1 : 0)); let win = 0; const wins = {}; let lucky = null;
      if (cfg.lucky && !(inp && inp.force)) { const k = 1 + ri(5), pool = []; for (let i = 0; i < 37; i++) pool.push(i); lucky = {}; for (let i = 0; i < k; i++) { const j = ri(pool.length); const num = pool.splice(j, 1)[0]; lucky[num] = LUCKY_M[Math.min(LUCKY_M.length - 1, Math.floor(-Math.log(1 - rnd()) * LUCKY_K))]; } }
      for (const k in b) { let r = 0; if (rlHit(k, n)) r = b[k] * (lucky && /^n\d/.test(k) ? 1 + (lucky[n] || 29) : rlPay(k)); else if (cfg.partage && n === 0 && rlPay(k) === 2) r = b[k] / 2; if (r) { wins[k] = r2(r); win += r; } }
      return { state: { n, wins, lucky }, done: true, win: r2(win) };
    },
    view(cfg, s) { const n = s.n; return { n: n === 37 ? '00' : String(n), color: (n === 0 || n === 37) ? 'green' : REDS.includes(n) ? 'red' : 'black', wins: s.wins, lucky: s.lucky || null, done: true }; }
  };
  K.baccarat = {
    keys: k => ['player', 'banker', 'tie', 'ppair', 'bpair', 'dragon7', 'panda8', 'dbp', 'dbb', 'stiger', 'btiger', 'sdragon', 'bdragon'].includes(k), cfg: v => ({ std: { nc: false }, nc: { nc: true }, speed: { nc: false, speed: true }, ez: { ez: true } })[v] || {},
    validate(cfg, b) { if (b.player && b.banker) return { err: 'bad_bet', msg: 'Bet on Player or Banker — not both' }; if (!cfg.ez && (b.dragon7 || b.panda8)) return { err: 'bad_bet' }; if (cfg.ez && (b.stiger || b.btiger || b.sdragon || b.bdragon)) return { err: 'bad_bet' }; },
    deal(cfg, b, inp) {
      const g = baccaratDeal(inp && inp.shoe); const { wins, win } = this.settle(cfg, b, g);
      return { state: { P: C(g.P), B: C(g.B), pt: g.pt, bt: g.bt, win: g.win, wins }, done: true, win: r2(win) };
    },
    // pay a set of bets against a dealt hand (also used by the shared multiplayer tables)
    settle(cfg, b, g) { let win = 0; const wins = {};
      const pay = (k, x) => { if (b[k]) { wins[k] = r2(b[k] * x); win += b[k] * x; } };
      if (g.win === 'player') pay('player', 2);
      const d7 = g.win === 'banker' && g.B.length === 3 && g.bt === 7, p8 = g.win === 'player' && g.P.length === 3 && g.pt === 8;
      if (g.win === 'banker') pay('banker', cfg.ez ? (d7 ? 1 : 2) : cfg.nc ? (g.bt === 6 ? 1.5 : 2) : 1.95);
      if (d7) pay('dragon7', 41); if (p8) pay('panda8', 26);
      if (g.win === 'tie') { pay('tie', 9); pay('player', 1); pay('banker', 1); }
      if (g.P[0].r === g.P[1].r) pay('ppair', 12); if (g.B[0].r === g.B[1].r) pay('bpair', 12);
      { const natP = g.P.length === 2 && g.pt >= 8, natB = g.B.length === 2 && g.bt >= 8, DB = { 9: 31, 8: 11, 7: 7, 6: 5, 5: 3, 4: 2 };
        const db = (k, side) => { if (!b[k]) return; const mine = side === 'player' ? natP : natB, m = Math.abs(g.pt - g.bt);
          if (g.win === side) pay(k, mine ? 2 : (DB[m] || 0)); else if (g.win === 'tie' && natP && natB) pay(k, 1); };
        db('dbp', 'player'); db('dbb', 'banker');
        if (g.win === 'banker' && g.bt === 6) pay(g.B.length === 2 ? 'stiger' : 'btiger', g.B.length === 2 ? 24 : 55);
        if (g.win === 'player' && g.pt === 7) pay(g.P.length === 2 ? 'sdragon' : 'bdragon', g.P.length === 2 ? 17 : 34); }
      return { wins, win: r2(win) };
    },
    view(cfg, s) { return Object.assign({ done: true }, s); }
  };
  K.dragontiger = {
    keys: k => ['dragon', 'tiger', 'tie', 'stie'].includes(k), cfg: () => ({}),
    validate(cfg, b) { if (b.dragon && b.tiger) return { err: 'bad_bet', msg: 'Bet on Dragon or Tiger — not both' }; },
    deal(cfg, b, inp) {
      const shoe = inp && inp.shoe, F = inp && inp.force, sh = shoe ? { pop: () => shoeDraw(shoe) } : deck(8), D = F ? dec(F.D) : sh.pop(), T = F ? dec(F.T) : sh.pop(); const dv = D.r === 14 ? 1 : D.r, tv = T.r === 14 ? 1 : T.r; const w = dv > tv ? 'dragon' : tv > dv ? 'tiger' : 'tie';
      let win = 0; const wins = {}; const pay = (k, x) => { if (b[k]) { wins[k] = r2(b[k] * x); win += b[k] * x; } };
      if (w !== 'tie') pay(w, 2); else { pay('dragon', .5); pay('tiger', .5); pay('tie', 12); if (D.s === T.s) pay('stie', 51); }
      return { state: { D: cs(D), T: cs(T), win: w, wins }, done: true, win: r2(win) };
    }, view: (c, s) => Object.assign({ done: true }, s)
  };
  K.sicbo = {
    keys: k => /^(small|big|any3|t([4-9]|1[0-7])|d[1-6]|tr[1-6]|s[1-6])$/.test(k), cfg: () => ({}),
    deal(cfg, b, inp) {
      const d = inp && inp.force ? inp.force.dice.slice() : [ri(6) + 1, ri(6) + 1, ri(6) + 1]; const t = d[0] + d[1] + d[2], tri = d[0] === d[1] && d[1] === d[2];
      let win = 0; const wins = {}; const pay = (k, x) => { if (b[k] && x > 0) { wins[k] = r2(b[k] * x); win += b[k] * x; } };
      pay('small', !tri && t >= 4 && t <= 10 ? 2 : 0); pay('big', !tri && t >= 11 && t <= 17 ? 2 : 0); pay('any3', tri ? 31 : 0);
      for (let i = 4; i <= 17; i++) pay('t' + i, t === i ? SB_T[i] + 1 : 0);
      for (let i = 1; i <= 6; i++) { const c = d.filter(x => x === i).length; pay('d' + i, c >= 2 ? 11 : 0); pay('tr' + i, c === 3 ? 181 : 0); pay('s' + i, c ? c + 1 : 0); }
      return { state: { dice: d, total: t, triple: tri, wins }, done: true, win: r2(win) };
    }, view: (c, s) => Object.assign({ done: true }, s)
  };
  K.craps = {
    keys: k => ['pass', 'dontpass', 'field', 'any7', 'anycraps', 'yo'].includes(k), cfg: () => ({}),
    validate(cfg, b) { if (b.pass && b.dontpass) return { err: 'bad_bet', msg: 'Choose Pass or Don’t Pass, not both' }; },
    roll(s) {
      const d = [ri(6) + 1, ri(6) + 1], t = d[0] + d[1]; s.rolls.push(d); let win = 0; const b = s.bets, w = s.wins;
      const pay = (k, x) => { if (b[k]) { if (x > 0) { w[k] = r2((w[k] || 0) + b[k] * x); win += b[k] * x; } delete b[k]; } };
      // one-roll bets
      pay('field', [2].includes(t) ? 3 : t === 12 ? 4 : [3, 4, 9, 10, 11].includes(t) ? 2 : 0); pay('any7', t === 7 ? 5 : 0); pay('anycraps', [2, 3, 12].includes(t) ? 8 : 0); pay('yo', t === 11 ? 16 : 0);
      if (!s.point) {
        if (b.pass) { if (t === 7 || t === 11) pay('pass', 2); else if ([2, 3, 12].includes(t)) pay('pass', 0); }
        if (b.dontpass) { if (t === 2 || t === 3) pay('dontpass', 2); else if (t === 12) pay('dontpass', 1); else if (t === 7 || t === 11) pay('dontpass', 0); }
        if ((b.pass || b.dontpass) && [4, 5, 6, 8, 9, 10].includes(t)) s.point = t;
      } else {
        if (t === s.point) { pay('pass', 2); pay('dontpass', 0); } else if (t === 7) { pay('pass', 0); pay('dontpass', 2); }
        if (!b.pass && !b.dontpass) s.point = 0;
      }
      s.last = t; s.done = !b.pass && !b.dontpass; return win;
    },
    deal(cfg, b) { const s = { bets: Object.assign({}, b), wins: {}, rolls: [], point: 0, done: false, paid: 0 }; const w = this.roll(s); s.paid += w; return { state: s, done: s.done, win: s.done ? r2(s.paid) : 0 }; },
    cost(cfg, s, a) { return a === 'roll' && !s.done ? 0 : null; },
    act(cfg, s) { const w = K.craps.roll(s); s.paid += w; return { state: s, done: s.done, win: s.done ? r2(s.paid) : 0 }; },
    view(cfg, s) { return { rolls: s.rolls, last: s.last, point: s.point, bets: s.bets, wins: s.wins, paid: r2(s.paid), done: s.done, actions: s.done ? [] : ['roll'] }; }
  };
  K.videopoker = {
    keys: k => k === 'coins' || k === 'denom', cfg: v => VP[v] || VP.job,
    validate(cfg, b) { if (!(b.coins >= 1 && b.coins <= 5 && Number.isInteger(b.coins))) return { err: 'bad_bet', msg: 'Bet 1-5 coins' }; },
    total: (b, cfg) => r2(b.coins * b.denom * ((cfg && cfg.hands) || 1)),
    deal(cfg, b) { const sh = deck(1, cfg.wild === 'joker' ? 1 : 0); const hand = [sh.pop(), sh.pop(), sh.pop(), sh.pop(), sh.pop()]; return { state: { sh, hand, coins: b.coins, denom: b.denom, done: false }, done: false, win: 0 }; },
    cost(cfg, s, a) { return a === 'draw' && !s.done ? 0 : null; },
    act(cfg, s, a, inp) { const hold = (inp && inp.hold) || []; const n = cfg.hands || 1; const dealt = s.hand.slice(); let w = 0; s.multi = [];
      for (let k = 0; k < n; k++) { let sh = s.sh; if (k > 0) { sh = deck(1, cfg.wild === 'joker' ? 1 : 0).filter(c => !dealt.some(d => d.r === c.r && d.s === c.s)); }
        const hand = dealt.map((c, i) => hold[i] ? c : sh.pop()); const res = vpHand(cfg, hand); const x = vpPay(cfg, res, s.coins) * s.coins * s.denom; w += x; s.multi.push({ hand, res, w: r2(x) }); }
      s.hand = s.multi[0].hand; s.res = s.multi[0].res; s.done = true; return { state: s, done: true, win: r2(w) }; },
    view(cfg, s) { return { hand: C(s.hand), done: s.done, res: s.done ? s.res : vpHand(cfg, s.hand), multi: s.multi ? s.multi.map(m => ({ hand: C(m.hand), res: m.res, w: m.w })) : null, nh: cfg.hands || 1, actions: s.done ? [] : ['draw'] }; }
  };
  K.tcp = {
    keys: k => ['ante', 'pairplus'].includes(k), cfg: () => ({}),
    validate(c, b) { if (!b.ante && !b.pairplus) return { err: 'bad_bet' }; if (!b.ante) return { err: 'bad_bet', msg: 'Ante is required' }; },
    deal(cfg, b) { const sh = deck(1); const s = { P: [sh.pop(), sh.pop(), sh.pop()], D: [sh.pop(), sh.pop(), sh.pop()], b: Object.assign({}, b), done: false }; return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return s.done ? null : a === 'play' ? s.b.ante : a === 'fold' ? 0 : null; },
    act(cfg, s, a) {
      const pv = eval3(s.P), dv = eval3(s.D); let win = 0; const w = {}; s.pv = pv; s.dv = dv;
      const ppT = { 5: 41, 4: 31, 3: 7, 2: 4, 1: 2 }; if (s.b.pairplus) { const x = ppT[pv[0]] || 0; if (x) { w.pairplus = s.b.pairplus * x; win += w.pairplus; } }
      if (a === 'play') { s.b.play = s.b.ante; const qual = dv[0] > 0 || dv[1] >= 12; const bonus = { 5: 5, 4: 4, 3: 1 }[pv[0]] || 0; let aw = bonus * s.b.ante;
        if (!qual) { aw += s.b.ante * 2 + s.b.play; s.out = 'Dealer does not qualify'; } else { const c = cmp(pv, dv); if (c > 0) { aw += s.b.ante * 2 + s.b.play * 2; s.out = 'You win'; } else if (c === 0) { aw += s.b.ante + s.b.play; s.out = 'Push'; } else s.out = 'Dealer wins'; }
        if (aw) { w.main = aw; win += aw; } } else s.out = 'Folded';
      s.wins = w; s.done = true; return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { return { P: C(s.P), D: s.done ? C(s.D) : ['??', '??', '??'], ph: H3[eval3(s.P)[0]], dh: s.done ? H3[s.dv[0]] : null, out: s.out, wins: s.wins, done: s.done, actions: s.done ? [] : ['play', 'fold'] }; }
  };
  K.holdem = {
    keys: k => k === 'ante', cfg: () => ({}),
    deal(cfg, b) { const sh = deck(1); const s = { sh, P: [sh.pop(), sh.pop()], D: [sh.pop(), sh.pop()], B: [sh.pop(), sh.pop(), sh.pop()], ante: b.ante, done: false }; return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return s.done ? null : a === 'call' ? s.ante * 2 : a === 'fold' ? 0 : null; },
    act(cfg, s, a) {
      s.B.push(s.sh.pop(), s.sh.pop()); let win = 0;
      const pb = best5(s.P.concat(s.B)), db = best5(s.D.concat(s.B)); s.pb = pb; s.db = db;
      if (a === 'call') { const AP = { 9: 100, 8: 20, 7: 10, 6: 3, 5: 2 }; const ap = (AP[pb.v[0]] || 1);
        const qual = db.v[0] > 1 || (db.v[0] === 1 && db.v[1] >= 4);
        if (!qual) { win = s.ante * (1 + ap) + s.ante * 2; s.out = 'Dealer does not qualify'; }
        else { const c = cmp(pb.v, db.v); if (c > 0) { win = s.ante * (1 + ap) + s.ante * 4; s.out = 'You win'; } else if (c === 0) { win = s.ante * 3; s.out = 'Push'; } else s.out = 'Dealer wins'; } }
      else s.out = 'Folded';
      s.done = true; return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { return { P: C(s.P), D: s.done ? C(s.D) : ['??', '??'], B: C(s.B), ph: s.done ? HN[s.pb.v[0]] : null, dh: s.done ? HN[s.db.v[0]] : null, out: s.out, done: s.done, actions: s.done ? [] : ['call', 'fold'] }; }
  };
  K.caribbean = {
    keys: k => k === 'ante', cfg: () => ({}),
    deal(cfg, b) { const sh = deck(1); const s = { P: [], D: [], ante: b.ante, done: false }; for (let i = 0; i < 5; i++) { s.P.push(sh.pop()); s.D.push(sh.pop()); } return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return s.done ? null : a === 'raise' ? s.ante * 2 : a === 'fold' ? 0 : null; },
    act(cfg, s, a) {
      const pv = eval5(s.P), dv = eval5(s.D); s.pv = pv; s.dv = dv; let win = 0;
      if (a === 'raise') { const RP = { 9: 100, 8: 50, 7: 20, 6: 7, 5: 5, 4: 4, 3: 3, 2: 2 }; const rp = RP[pv[0]] || 1; const R = s.ante * 2;
        const qual = dv[0] >= 1 || (dv[1] === 14 && dv[2] === 13);
        if (!qual) { win = s.ante * 2 + R; s.out = 'Dealer does not qualify'; }
        else { const c = cmp(pv, dv); if (c > 0) { win = s.ante * 2 + R * (1 + rp); s.out = 'You win'; } else if (c === 0) { win = s.ante + R; s.out = 'Push'; } else s.out = 'Dealer wins'; } }
      else s.out = 'Folded';
      s.done = true; return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { return { P: C(s.P), D: s.done ? C(s.D) : [cs(s.D[0]), '??', '??', '??', '??'], ph: HN[eval5(s.P)[0]], dh: s.done ? HN[s.dv[0]] : null, out: s.out, done: s.done, actions: s.done ? [] : ['raise', 'fold'] }; }
  };
  K.war = {
    keys: k => k === 'main', cfg: () => ({}),
    deal(cfg, b) { const sh = deck(6); const s = { sh, P: [sh.pop()], D: [sh.pop()], bet: b.main, done: false }; if (s.P[0].r !== s.D[0].r) { s.done = true; s.out = s.P[0].r > s.D[0].r ? 'You win' : 'Dealer wins'; return { state: s, done: true, win: s.P[0].r > s.D[0].r ? b.main * 2 : 0 }; } s.out = 'Tie! Go to war or surrender'; return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return s.done ? null : a === 'war' ? s.bet : a === 'surrender' ? 0 : null; },
    act(cfg, s, a) { let win = 0; if (a === 'surrender') { win = s.bet / 2; s.out = 'Surrendered (half returned)'; } else { s.sh.pop(); s.sh.pop(); s.sh.pop(); s.P.push(s.sh.pop()); s.D.push(s.sh.pop()); const p = s.P[1].r, d = s.D[1].r; if (p > d) { win = s.bet * 3; s.out = 'You win the war'; } else if (p === d) { win = s.bet * 4; s.out = 'Tie in war! Bonus paid'; } else s.out = 'Dealer wins the war'; } s.done = true; return { state: s, done: true, win: r2(win) }; },
    view(c, s) { return { P: C(s.P), D: C(s.D), out: s.out, done: s.done, actions: s.done ? [] : ['war', 'surrender'] }; }
  };
  K.reddog = {
    keys: k => k === 'main', cfg: () => ({}),
    deal(cfg, b) {
      const sh = deck(8); const s = { sh, cards: [sh.pop(), sh.pop()], bet: b.main, done: false }; const [a, c] = s.cards.map(x => x.r).sort((x, y) => x - y); s.spread = c - a - 1;
      if (a === c) { s.cards.push(sh.pop()); s.done = true; const t = s.cards[2].r === a; s.out = t ? 'Three of a kind! 11:1' : 'Pair — push'; return { state: s, done: true, win: t ? b.main * 12 : b.main }; }
      if (s.spread === 0) { s.done = true; s.out = 'Consecutive — push'; return { state: s, done: true, win: b.main }; }
      return { state: s, done: false, win: 0 };
    },
    cost(c, s, a) { return s.done ? null : a === 'raise' ? s.bet : a === 'call' ? 0 : null; },
    act(cfg, s, a) {
      if (a === 'raise') s.bet *= 2; const x = s.sh.pop(); s.cards.push(x); const [lo, hi] = [s.cards[0].r, s.cards[1].r].sort((p, q) => p - q);
      const pays = s.spread === 1 ? 5 : s.spread === 2 ? 4 : s.spread === 3 ? 2 : 1; let win = 0;
      if (x.r > lo && x.r < hi) { win = s.bet * (1 + pays); s.out = 'In between! ' + pays + ':1'; } else s.out = 'Outside — dealer wins';
      s.done = true; return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { const p = s.spread === 1 ? 5 : s.spread === 2 ? 4 : s.spread === 3 ? 2 : 1; return { cards: C(s.cards), spread: s.spread, pays: p, out: s.out, done: s.done, actions: s.done ? [] : ['raise', 'call'] }; }
  };
  K.wheel = {
    keys: k => Object.keys(WPAY).includes(k), cfg: () => ({}),
    deal(cfg, b) { const i = ri(WHEEL.length), seg = WHEEL[i]; let win = 0; const wins = {}; if (b[seg]) { wins[seg] = b[seg] * WPAY[seg]; win = wins[seg]; } return { state: { i, seg, wins }, done: true, win: r2(win) }; },
    view: (c, s) => Object.assign({ done: true }, s)
  };
  function kenoCards(p) { const cards = [[]]; (p || []).forEach(n => { if (n === 0) cards.push([]); else cards[cards.length - 1].push(n); }); return cards.filter(c => c.length); }
  function kenoBad(c) { return c.length < 1 || c.length > 10 || new Set(c).size !== c.length || c.some(n => !(Number.isInteger(n) && n >= 1 && n <= 80)); }
  K.keno = {
    keys: k => k === 'main' || k === 'cards', cfg: v => ({ power: v === 'power', four: v === 'four' }),
    total: (b, cfg) => r2(b.main * (cfg && cfg.four ? (b.cards || 1) : 1)),
    validate(cfg, b, inp) { const p = inp && inp.picks; if (!Array.isArray(p)) return { err: 'bad_bet', msg: 'Pick 1 to 10 numbers' };
      if (cfg.four) { const cs = kenoCards(p); if (!cs.length || cs.length > 4 || cs.some(kenoBad) || (b.cards || 1) !== cs.length) return { err: 'bad_bet', msg: 'Pick 1 to 10 numbers on each card' }; return; }
      if (kenoBad(p)) return { err: 'bad_bet', msg: 'Pick 1 to 10 numbers' }; },
    deal(cfg, b, inp) {
      const pool = []; for (let i = 1; i <= 80; i++) pool.push(i); for (let i = 79; i > 0; i--) { const j = ri(i + 1);[pool[i], pool[j]] = [pool[j], pool[i]]; }
      const draw = pool.slice(0, 20); const KT = KENO_T[cfg.power ? 'power' : 'classic'];
      if (cfg.four) { const cards = kenoCards(inp.picks).map(picks => { const hits = picks.filter(n => draw.includes(n)); const x = KT[picks.length][hits.length] || 0; return { picks, hits, x, win: r2(b.main * x) }; });
        const win = r2(cards.reduce((t, c) => t + c.win, 0)); const picks = [...new Set([].concat(...cards.map(c => c.picks)))]; const hits = picks.filter(n => draw.includes(n));
        return { state: { draw, picks, hits, cards, x: 0, power: false, wins: win ? { main: win } : {} }, done: true, win }; }
      const picks = inp.picks, hits = picks.filter(n => draw.includes(n)); let x = (KT[picks.length][hits.length] || 0);
      const pw = cfg.power && picks.includes(draw[19]) && x > 0; if (pw) x *= 4;
      const win = r2(b.main * x); return { state: { draw, picks, hits, x, power: pw, wins: win ? { main: win } : {} }, done: true, win };
    },
    view: (c, s) => Object.assign({ done: true, table: KENO_T[c.power ? 'power' : 'classic'] }, s)
  };
  K.scratch = {
    keys: k => k === 'main', cfg: v => SCR[v] || SCR.cash,
    deal(cfg, b) {
      let x = 0, u = rnd(); for (const [m, p] of SCR_P) { if (u < p) { x = m; break; } u -= p; }
      const vals = SCR_P.map(p => p[0]); const lab = v => cfg.sym ? cfg.sym[vals.indexOf(v)] : v;
      const cells = []; if (x) for (let i = 0; i < 3; i++) cells.push(x);
      const pool = vals.filter(v => v !== x); const used = {}; while (cells.length < 9) { const v = pool[ri(pool.length)]; if ((used[v] || 0) >= 2) continue; used[v] = (used[v] || 0) + 1; cells.push(v); }
      for (let i = 8; i > 0; i--) { const j = ri(i + 1);[cells[i], cells[j]] = [cells[j], cells[i]]; }
      const win = r2(b.main * x); return { state: { cells: cells.map(v => ({ v, l: String(lab(v)) })), x, wins: win ? { main: win } : {} }, done: true, win };
    },
    view: (c, s) => Object.assign({ done: true, sym: c.sym, prizes: SCR_P.map(p => p[0]) }, s)
  };


  // ================= VEGAS TABLE GAMES (v5.7) =================
  // 4-card hand from up to 6 cards: [cat,...] cat 0 high,1 pair,2 two pair,3 straight,4 flush,5 trips,6 straight flush,7 quads
  function eval4of(cards) { let best = null; const n = cards.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) { const h = [cards[a], cards[b], cards[c], cards[d]]; const v = eval4(h); if (!best || cmp(v, best.v) > 0) best = { v, h }; }
    return best; }
  function eval4(h) { const rs = h.map(c => c.r).sort((x, y) => y - x), fl = h.every(c => c.s === h[0].s); const cnt = {}; rs.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
    const g = Object.keys(cnt).map(Number).sort((x, y) => cnt[y] - cnt[x] || y - x); const u = [...new Set(rs)];
    let st = 0; if (u.length === 4) { if (u[0] - u[3] === 3) st = u[0]; else if (u[0] === 14 && u[1] === 4 && u[3] === 2) st = 4; }
    if (cnt[g[0]] === 4) return [7, g[0]]; if (st && fl) return [6, st]; if (cnt[g[0]] === 3) return [5, ...g]; if (fl) return [4, ...rs]; if (st) return [3, st];
    if (cnt[g[0]] === 2 && cnt[g[1]] === 2) return [2, ...g]; if (cnt[g[0]] === 2) return [1, ...g]; return [0, ...rs]; }
  const H4 = ['High Card', 'Pair', 'Two Pair', 'Straight', 'Flush', 'Three of a Kind', 'Straight Flush', 'Four of a Kind'];
  K.uth = { // Ultimate Texas Hold'em
    keys: k => ['ante', 'blind', 'trips'].includes(k), cfg: () => ({}),
    validate(c, b) { if (!b.ante) return { err: 'bad_bet', msg: 'Ante is required' }; if (b.blind !== b.ante) return { err: 'bad_bet', msg: 'Blind must equal the ante' }; },
    deal(cfg, b) { const sh = deck(1); const s = { P: [sh.pop(), sh.pop()], D: [sh.pop(), sh.pop()], B: [sh.pop(), sh.pop(), sh.pop(), sh.pop(), sh.pop()], b: Object.assign({}, b), ph: 'pre', play: 0, done: false }; return { state: s, done: false, win: 0 }; },
    acts(s) { return s.done ? [] : s.ph === 'pre' ? ['bet4', 'bet3', 'check'] : s.ph === 'flop' ? ['bet2', 'check'] : ['bet1', 'fold']; },
    cost(c, s, a) { if (!K.uth.acts(s).includes(a)) return null; const m = { bet4: 4, bet3: 3, bet2: 2, bet1: 1 }[a]; return m ? s.b.ante * m : 0; },
    act(cfg, s, a) {
      const m = { bet4: 4, bet3: 3, bet2: 2, bet1: 1 }[a];
      if (a === 'check') { s.ph = s.ph === 'pre' ? 'flop' : 'river'; return { state: s, done: false, win: 0 }; }
      if (m) s.play = s.b.ante * m;
      const pb = best5(s.P.concat(s.B)), db = best5(s.D.concat(s.B)); s.pv = pb.v; s.dv = db.v; s.ph = 'done'; s.done = true;
      let win = 0; const w = {}; const add = (k, x) => { if (x > 0) { w[k] = r2((w[k] || 0) + x); win += x; } };
      const TR = { 9: 50, 8: 40, 7: 30, 6: 8, 5: 7, 4: 4, 3: 3 }; if (s.b.trips && TR[pb.v[0]]) add('trips', s.b.trips * (1 + TR[pb.v[0]]));
      if (a === 'fold') { s.out = 'Folded'; return { state: s, done: true, win: r2(win) }; }
      const qual = db.v[0] >= 1, c = cmp(pb.v, db.v), BL = { 9: 500, 8: 50, 7: 10, 6: 3, 5: 1.5, 4: 1 };
      if (c > 0) { add('play', s.play * 2); add('ante', qual ? s.b.ante * 2 : s.b.ante); add('blind', s.b.blind * (1 + (BL[pb.v[0]] || 0))); s.out = 'You win' + (qual ? '' : ' · dealer does not qualify (ante push)'); }
      else if (c === 0) { add('play', s.play); add('ante', s.b.ante); add('blind', s.b.blind); s.out = 'Push'; }
      else { if (!qual) add('ante', s.b.ante); s.out = 'Dealer wins' + (qual ? '' : ' · ante pushes'); }
      s.wins = w; return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { const nb = s.done ? 5 : s.ph === 'river' ? 5 : s.ph === 'flop' ? 3 : 0;
      return { P: C(s.P), D: s.done ? C(s.D) : ['??', '??'], B: s.B.map((x, i) => i < nb ? cs(x) : '??'), ph: s.done ? HN[s.pv[0]] : (nb ? HN[best5(s.P.concat(s.B.slice(0, nb).length >= 3 ? s.B.slice(0, nb) : [])).v[0]] : null), dh: s.done ? HN[s.dv[0]] : null, out: s.out, wins: s.wins, play: s.play, stage: s.ph, done: s.done, actions: K.uth.acts(s) }; }
  };
  K.letitride = {
    keys: k => k === 'main', cfg: () => ({}), total: b => r2(b.main * 3),
    deal(cfg, b) { const sh = deck(1); const s = { P: [sh.pop(), sh.pop(), sh.pop()], B: [sh.pop(), sh.pop()], unit: b.main, up: [1, 1, 1], st: 0, done: false }; return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return !s.done && (a === 'pull' || a === 'ride') ? 0 : null; },
    act(cfg, s, a) { if (a === 'pull') s.up[s.st] = 0; s.st++;
      if (s.st < 2) return { state: s, done: false, win: 0 };
      const v = eval5(s.P.concat(s.B)); s.v = v; s.done = true; const LR = { 9: 1000, 8: 200, 7: 50, 6: 11, 5: 8, 4: 5, 3: 3, 2: 2 };
      const x = LR[v[0]] || (v[0] === 1 && v[1] >= 10 ? 1 : 0); const riding = s.up.reduce((a, b) => a + b, 0); const back = (3 - riding) * s.unit;
      const win = (x ? riding * s.unit * (1 + x) : 0) + back; s.out = x ? HN[v[0]] + ' pays ' + x + ':1' : 'No paying hand (need tens or better)'; s.x = x; return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { return { P: C(s.P), B: s.B.map((x, i) => s.done || i < s.st ? cs(x) : '??'), up: s.up, st: s.st, hn: s.done ? HN[s.v[0]] : null, x: s.x, out: s.out, done: s.done, actions: s.done ? [] : ['pull', 'ride'] }; }
  };
  K.mstud = { // Mississippi Stud
    keys: k => k === 'ante', cfg: () => ({}),
    deal(cfg, b) { const sh = deck(1); const s = { P: [sh.pop(), sh.pop()], B: [sh.pop(), sh.pop(), sh.pop()], ante: b.ante, bets: [], st: 0, done: false }; return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return s.done ? null : a === 'b1' ? s.ante : a === 'b3' ? s.ante * 3 : a === 'fold' ? 0 : null; },
    act(cfg, s, a) {
      if (a === 'fold') { s.done = true; s.out = 'Folded'; return { state: s, done: true, win: 0 }; }
      s.bets.push(a === 'b3' ? 3 : 1); s.st++; if (s.st < 3) return { state: s, done: false, win: 0 };
      const v = eval5(s.P.concat(s.B)); s.v = v; s.done = true; const MS = { 9: 500, 8: 100, 7: 40, 6: 10, 5: 6, 4: 4, 3: 3, 2: 2 };
      const tot = s.ante * (1 + s.bets.reduce((x, y) => x + y, 0)); let x = MS[v[0]] || 0, push = false;
      if (!x && v[0] === 1) { if (v[1] >= 11) x = 1; else if (v[1] >= 6) push = true; }
      s.out = x ? HN[v[0]] + (v[0] === 1 ? ' (Jacks+)' : '') + ' pays ' + x + ':1' : push ? 'Pair 6-10 · push' : 'No paying hand'; s.x = x;
      return { state: s, done: true, win: r2(x ? tot * (1 + x) : push ? tot : 0) };
    },
    view(c, s) { return { P: C(s.P), B: s.B.map((x, i) => s.done || i < s.st ? cs(x) : '??'), st: s.st, bets: s.bets, ante: s.ante, hn: s.v ? HN[s.v[0]] : null, out: s.out, done: s.done, actions: s.done ? [] : ['b3', 'b1', 'fold'] }; }
  };
  K.fourcard = { // Four Card Poker
    keys: k => ['ante', 'acesup'].includes(k), cfg: () => ({}),
    validate(c, b) { if (!b.ante) return { err: 'bad_bet', msg: 'Ante is required' }; },
    deal(cfg, b) { const sh = deck(1); const s = { P: [], D: [], b: Object.assign({}, b), done: false }; for (let i = 0; i < 5; i++) s.P.push(sh.pop()); for (let i = 0; i < 6; i++) s.D.push(sh.pop()); s.pv = eval4of(s.P).v; return { state: s, done: false, win: 0 }; },
    acts(s) { if (s.done) return []; const big = s.pv[0] >= 1 && (s.pv[0] > 1 || s.pv[1] === 14); return big ? ['p3', 'p2', 'p1', 'fold'] : ['p1', 'fold']; },
    cost(c, s, a) { if (!K.fourcard.acts(s).includes(a)) return null; return { p1: 1, p2: 2, p3: 3 }[a] ? s.b.ante * { p1: 1, p2: 2, p3: 3 }[a] : 0; },
    act(cfg, s, a) {
      const pb = eval4of(s.P), db = eval4of(s.D); s.pv = pb.v; s.dv = db.v; s.done = true; let win = 0; const w = {}; const add = (k, x) => { if (x > 0) { w[k] = r2((w[k] || 0) + x); win += x; } };
      const AU = { 7: 50, 6: 40, 5: 9, 4: 6, 3: 5, 2: 2 }; if (s.b.acesup) { const x = AU[pb.v[0]] || (pb.v[0] === 1 && pb.v[1] === 14 ? 1 : 0); if (x) add('acesup', s.b.acesup * (1 + x)); }
      if (a === 'fold') { s.out = 'Folded'; s.wins = w; return { state: s, done: true, win: r2(win) }; }
      const play = s.b.ante * { p1: 1, p2: 2, p3: 3 }[a]; s.play = play; const AB = { 7: 25, 6: 20, 5: 2 }; if (AB[pb.v[0]]) add('ante', s.b.ante * AB[pb.v[0]]);
      const c = cmp(pb.v, db.v); if (c >= 0) { add('ante', s.b.ante * 2); add('play', play * 2); s.out = c ? 'You win' : 'Tie goes to you'; } else s.out = 'Dealer wins';
      s.wins = w; return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { return { P: C(s.P), D: s.done ? C(s.D) : [cs(s.D[0]), '??', '??', '??', '??', '??'], ph: H4[s.pv[0]], dh: s.done ? H4[s.dv[0]] : null, out: s.out, wins: s.wins, done: s.done, actions: K.fourcard.acts(s) }; }
  };
  function maxFlush(cards) { const by = [[], [], [], []]; cards.forEach(c => by[c.s].push(c.r)); let best = null; by.forEach(rs => { rs.sort((a, b) => b - a); const v = [rs.length, ...rs]; if (!best || cmp(v, best) > 0) best = v; }); return best; }

  // ---------- PAI GOW POKER (53 cards, joker = bug: ace or completes straight/flush) ----------
  const PGN = HN.concat(['Five Aces']);
  function evalJ5(cards) { const j = cards.findIndex(c => c.r === 0); if (j < 0) return eval5(cards);
    const rest = cards.filter((_, i) => i !== j); const ac = rest.filter(c => c.r === 14).length; if (ac === 4) return [10];
    let best = null; for (let r = 2; r <= 14; r++) for (let su = 0; su < 4; su++) { const v = eval5(rest.concat([{ r, s: su }])); if (r !== 14 && !(v[0] === 4 || v[0] === 5 || v[0] >= 8)) continue; if (!best || cmp(v, best) > 0) best = v; } return best; }
  function evalJ2(cards) { const r = cards.map(c => c.r === 0 ? 14 : c.r).sort((a, b) => b - a); return r[0] === r[1] ? [1, r[0]] : [0, r[0], r[1]]; }
  function bestJ(cards) { let best = null; const n = cards.length; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) { const v = evalJ5([cards[a], cards[b], cards[c], cards[d], cards[e]]); if (!best || cmp(v, best) > 0) best = v; } return best; }
  function pHigh(v) { const c = v[0]; if (c >= 7) return .99; return [.04 + .12 * Math.max(0, v[1] - 8) / 6, .28 + .3 * (v[1] - 2) / 12, .62 + .2 * (v[1] - 3) / 11, .85, .9, .93, .96][c]; }
  function pLow(v) { if (v[0] === 1) return .74 + .25 * (v[1] - 2) / 12; const x = ((v[1] - 2) * 13 + (v[2] - 2)) / 167; return .72 * Math.pow(Math.max(0, x), 1.8); }
  function pgSplits(h) { const out = []; for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const lo = [h[i], h[j]], hi = h.filter((_, k) => k !== i && k !== j); const lv = evalJ2(lo), hv5 = evalJ5(hi); out.push({ i, j, lv, hv: hv5 }); } return out; }
  function pgLegal(hv5, lv) { // high must outrank low
    if (hv5[0] >= 2) return true; if (hv5[0] === 1) return lv[0] === 0 || hv5[1] >= lv[1]; if (lv[0] === 1) return false; return cmp([hv5[1], hv5[2]], [lv[1], lv[2]]) >= 0; }
  function houseWay(h) { let best = null, bs = -9; pgSplits(h).forEach(x => { if (!pgLegal(x.hv, x.lv)) return; const sc = pHigh(x.hv) + pLow(x.lv); if (sc > bs + 1e-9) { bs = sc; best = x; } }); return [best.i, best.j]; }
  const PGF = { 10: 400, 9: 150, 8: 50, 7: 25, 6: 5, 5: 4, 4: 2, 3: 3 }; // Fortune bonus on 7 cards
  K.paigow = {
    keys: k => k === 'main' || k === 'fortune', cfg: () => ({}),
    validate(c, b) { if (!b.main) return { err: 'bad_bet', msg: 'Main bet is required' }; },
    deal(cfg, b) { const sh = deck(1, 1); const s = { P: [], D: [], b: Object.assign({}, b), done: false }; for (let i = 0; i < 7; i++) { s.P.push(sh.pop()); s.D.push(sh.pop()); }
      s.P.sort((x, y) => (y.r || 15) - (x.r || 15)); s.hw = houseWay(s.P); return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return !s.done && (a === 'set' || a === 'house') ? 0 : null; },
    act(cfg, s, a, inp) {
      let lo = a === 'house' ? s.hw : ((inp && inp.picks) || []).map(Number).filter(n => n >= 0 && n < 7);
      lo = [...new Set(lo)]; if (lo.length !== 2) lo = s.hw;
      let pl = s.P.filter((_, k) => lo.includes(k)), ph = s.P.filter((_, k) => !lo.includes(k)); let pLv = evalJ2(pl), pHv = evalJ5(ph);
      s.foul = !pgLegal(pHv, pLv); if (s.foul) { lo = s.hw; pl = s.P.filter((_, k) => lo.includes(k)); ph = s.P.filter((_, k) => !lo.includes(k)); pLv = evalJ2(pl); pHv = evalJ5(ph); }
      const dw = houseWay(s.D); const dl = s.D.filter((_, k) => dw.includes(k)), dh = s.D.filter((_, k) => !dw.includes(k)); const dLv = evalJ2(dl), dHv = evalJ5(dh);
      const wh = cmp(pHv, dHv) > 0, wl = cmp(pLv, dLv) > 0; // copies go to the dealer
      const m = s.b.main; let win = 0, out;
      if (wh && wl) { win = m + m * 0.95; out = 'You win both hands · pays 1:1 less 5%'; } else if (wh || wl) { win = m; out = 'One hand each · push'; } else out = 'Dealer wins both hands';
      if (s.b.fortune) { const f = bestJ(s.P); const x = PGF[f[0]] || 0; s.fx = x; s.fn = PGN[f[0]]; if (x) win += s.b.fortune * (1 + x); }
      s.lo = lo; s.pl = pl; s.ph = ph; s.dl = dl; s.dh = dh; s.pv = [pHv, pLv]; s.dv = [dHv, dLv]; s.wh = wh; s.wl = wl; s.out = out; s.done = true;
      return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { if (!s.done) return { P: C(s.P), D: Array(7).fill('??'), hw: s.hw, done: false, actions: ['set', 'house'] };
      return { P: C(s.P), ph: C(s.ph), pl: C(s.pl), dh: C(s.dh), dl: C(s.dl), pn: [PGN[s.pv[0][0]], s.pv[1][0] ? 'Pair' : 'High Card'], dn: [PGN[s.dv[0][0]], s.dv[1][0] ? 'Pair' : 'High Card'], wh: s.wh, wl: s.wl, out: s.out, foul: s.foul, fx: s.fx, fn: s.fn, lo: s.lo, done: true, actions: [] }; }
  };

  // ---------- PAI GOW TILES (32 Chinese dominoes) ----------
  const PGT = (function () {
    const T = []; const add = (a, b, nm, rk, n) => { for (let i = 0; i < n; i++) T.push({ a, b, nm, rk, p: (a + b) % 10 }); };
    add(6, 6, 'Teen', 16, 2); add(1, 1, 'Day', 15, 2); add(4, 4, 'Yun', 14, 2); add(1, 3, 'Gor', 13, 2); add(5, 5, 'Mooy', 12, 2); add(3, 3, 'Chong', 11, 2); add(2, 2, 'Bon', 10, 2);
    add(5, 6, 'Foo', 9, 2); add(4, 6, 'Ping', 8, 2); add(1, 6, 'Tit', 7, 2); add(1, 5, 'Look', 6, 2);
    add(4, 5, 'Gow', 5, 1); add(3, 6, 'Gow', 5, 1); add(3, 5, 'Bot', 4, 1); add(2, 6, 'Bot', 4, 1); add(3, 4, 'Chit', 3, 1); add(2, 5, 'Chit', 3, 1); add(1, 4, 'Ng', 2, 1); add(2, 3, 'Ng', 2, 1);
    add(1, 2, 'Gee Joon', 1, 1); add(2, 4, 'Gee Joon', 1, 1); return T; })();
  const PGTN = { gj: 'Gee Joon', pair: 'Pair', wong: 'Wong', gong: 'Gong', nine: 'High Nine' };
  function tval(h) { // h = [tile, tile] -> comparable key
    const [x, y] = h; const hi = Math.max(x.rk, y.rk), lo = Math.min(x.rk, y.rk);
    if (x.nm === 'Gee Joon' && y.nm === 'Gee Joon') return { k: [9], n: 'Gee Joon' };
    if (x.nm === y.nm) return { k: [8, x.rk], n: 'Pair of ' + x.nm };
    const td = [x, y].find(t => t.nm === 'Teen' || t.nm === 'Day'), ot = td && (td === x ? y : x);
    if (td && ot.a + ot.b === 9) return { k: [7, td.rk], n: td.nm + ' Wong' };
    if (td && ot.a + ot.b === 8) return { k: [6, td.rk], n: td.nm + ' Gong' };
    if (td && ot.a + ot.b === 7) return { k: [5, td.rk], n: 'High Nine' };
    const pts = t => t.nm === 'Gee Joon' ? [3, 6] : [t.a + t.b]; let best = 0; pts(x).forEach(p => pts(y).forEach(q => { best = Math.max(best, (p + q) % 10); }));
    return { k: [1, best, hi], n: best + ' point' + (best === 1 ? '' : 's') };
  }
  function tcmp(A, B) { if (A.k[0] === 1 && B.k[0] === 1 && A.k[1] === 0 && B.k[1] === 0) return -1; const c = cmp(A.k, B.k); return c; } // zero-zero → dealer
  const PGT_P = (function () { const vals = []; for (let i = 0; i < 32; i++) for (let j = i + 1; j < 32; j++) vals.push(tval([PGT[i], PGT[j]])); return h => { const v = tval(h); let w = 0; vals.forEach(o => { if (cmp(v.k, o.k) > 0) w++; }); return w / vals.length; }; })();
  function tHouse(t) { const sp = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]; let best = null, bs = -1;
    sp.forEach(([a, b]) => { let H = [t[a[0]], t[a[1]]], L = [t[b[0]], t[b[1]]]; if (cmp(tval(H).k, tval(L).k) < 0) { [H, L] = [L, H]; [a, b] = [b, a]; } const sc = PGT_P(H) + PGT_P(L); if (sc > bs) { bs = sc; best = b; } }); return best; }
  K.paigowtiles = {
    keys: k => k === 'main', cfg: () => ({}),
    deal(cfg, b) { const ix = []; for (let i = 0; i < 32; i++) ix.push(i); for (let i = 31; i > 0; i--) { const j = ri(i + 1);[ix[i], ix[j]] = [ix[j], ix[i]]; }
      const s = { P: ix.slice(0, 4), D: ix.slice(4, 8), m: b.main, done: false }; s.hw = tHouse(s.P.map(i => PGT[i])); return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return !s.done && (a === 'set' || a === 'house') ? 0 : null; },
    act(cfg, s, a, inp) { let lo = a === 'house' ? s.hw : [...new Set(((inp && inp.picks) || []).map(Number).filter(n => n >= 0 && n < 4))]; if (lo.length !== 2) lo = s.hw;
      const sp = (ids, lo) => { const L = lo.map(i => PGT[ids[i]]), H = ids.filter((_, i) => !lo.includes(i)).map(i => PGT[i]); return [H, L]; };
      let [pH, pL] = sp(s.P, lo); s.foul = cmp(tval(pH).k, tval(pL).k) < 0; if (s.foul) { lo = s.hw; [pH, pL] = sp(s.P, lo); }
      const dlo = tHouse(s.D.map(i => PGT[i])); const [dH, dL] = sp(s.D, dlo);
      const ph = tval(pH), pl = tval(pL), dh = tval(dH), dl = tval(dL); const wh = tcmp(ph, dh) > 0, wl = tcmp(pl, dl) > 0;
      let win = 0, out; if (wh && wl) { win = s.m * 1.95; out = 'You win both hands · pays 1:1 less 5%'; } else if (wh || wl) { win = s.m; out = 'One hand each · push'; } else out = 'Dealer wins both hands';
      Object.assign(s, { lo, dlo, pn: [ph.n, pl.n], dn: [dh.n, dl.n], wh, wl, out, done: true }); return { state: s, done: true, win: r2(win) }; },
    view(c, s) { const tc = i => PGT[i].a + '' + PGT[i].b; if (!s.done) return { P: s.P.map(tc), D: ['??', '??', '??', '??'], hw: s.hw, done: false, actions: ['set', 'house'] };
      const part = (ids, lo) => [ids.filter((_, i) => !lo.includes(i)).map(tc), lo.map(i => tc(ids[i]))];
      const [ph, pl] = part(s.P, s.lo), [dh, dl] = part(s.D, s.dlo);
      return { P: s.P.map(tc), ph, pl, dh, dl, pn: s.pn, dn: s.dn, wh: s.wh, wl: s.wl, out: s.out, foul: s.foul, done: true, actions: [] }; }
  };

  // ---------- ROCKET CRASH (time based; the server clock decides the multiplier) ----------
  const CR_RATE = 0.075, CR_MAX = 1000;
  const crMult = sec => Math.min(CR_MAX, Math.floor(Math.exp(CR_RATE * Math.max(0, sec)) * 100) / 100);
  const crTime = m => Math.log(m) / CR_RATE;
  K.crash = {
    keys: k => k === 'main', cfg: () => ({}),
    deal(cfg, b, inp) { const u = rnd(); let c = Math.floor(97 / (1 - u)) / 100; if (c < 1) c = 1; c = Math.min(CR_MAX, c);
      const auto = inp && inp.picks && inp.picks[0] >= 101 ? Math.min(CR_MAX * 100, Math.floor(inp.picks[0])) / 100 : 0;
      const s = { c, t0: (inp && inp.now) || Date.now(), bet: b.main, auto, done: false }; if (c <= 1) { s.done = true; s.out = 'Crashed at 1.00x'; s.at = 0; return { state: s, done: true, win: 0 }; } return { state: s, done: false, win: 0 }; },
    cost(c, s, a) { return !s.done && (a === 'cash' || a === 'end') ? 0 : null; },
    act(cfg, s, a, inp) { const now = (inp && inp.now) || Date.now(); const m = crMult((now - s.t0) / 1000); s.done = true;
      if (s.auto && s.auto < s.c && m >= s.auto) { s.at = s.auto; s.out = 'Auto cash-out at ' + s.auto.toFixed(2) + 'x'; return { state: s, done: true, win: r2(s.bet * s.auto) }; }
      if (a === 'cash' && m < s.c) { s.at = m; s.out = 'Cashed out at ' + m.toFixed(2) + 'x'; return { state: s, done: true, win: r2(s.bet * m) }; }
      if (a === 'end' && m < s.c) { s.done = false; return { state: s, done: false, win: 0 }; }
      s.at = 0; s.out = 'Crashed at ' + s.c.toFixed(2) + 'x'; return { state: s, done: true, win: 0 }; },
    view(cfg, s) { return s.done ? { done: true, crash: s.c, at: s.at, out: s.out, auto: s.auto, actions: [] } : { done: false, rate: CR_RATE, el: 0, t0: s.t0, auto: s.auto, actions: ['cash'] }; }
  };
  K.hcf = { // High Card Flush
    keys: k => k === 'ante', cfg: () => ({}),
    deal(cfg, b) { const sh = deck(1); const s = { P: [], D: [], ante: b.ante, done: false }; for (let i = 0; i < 7; i++) { s.P.push(sh.pop()); s.D.push(sh.pop()); } s.pv = maxFlush(s.P); return { state: s, done: false, win: 0 }; },
    mult(s) { return s.pv[0] >= 6 ? 3 : s.pv[0] === 5 ? 2 : 1; },
    cost(c, s, a) { return s.done ? null : a === 'raise' ? s.ante * K.hcf.mult(s) : a === 'fold' ? 0 : null; },
    act(cfg, s, a) {
      s.dv = maxFlush(s.D); s.done = true; if (a === 'fold') { s.out = 'Folded'; return { state: s, done: true, win: 0 }; }
      const R = s.ante * K.hcf.mult(s); s.raise = R; const qual = s.dv[0] > 3 || (s.dv[0] === 3 && s.dv[1] >= 9); let win;
      if (!qual) { win = s.ante * 2 + R; s.out = 'Dealer does not qualify · ante pays, raise pushes'; }
      else { const c = cmp(s.pv, s.dv); if (c > 0) { win = (s.ante + R) * 2; s.out = 'You win'; } else if (c === 0) { win = s.ante + R; s.out = 'Push'; } else { win = 0; s.out = 'Dealer wins'; } }
      return { state: s, done: true, win: r2(win) };
    },
    view(c, s) { const fn = v => v[0] + '-card flush, ' + ({ 14: 'A', 13: 'K', 12: 'Q', 11: 'J' }[v[1]] || v[1]) + ' high';
      return { P: C(s.P), D: s.done ? C(s.D) : ['??', '??', '??', '??', '??', '??', '??'], ph: fn(s.pv), dh: s.done ? fn(s.dv) : null, mult: K.hcf.mult(s), out: s.out, done: s.done, actions: s.done ? [] : ['raise', 'fold'] }; }
  };

  // ================= ROUND (balance + state) =================
  function round(st, gid, kind, variant, inp, limits) {
    const G = K[kind]; if (!G) return { err: 'bad_game' }; const cfg = G.cfg(variant); inp = inp || {};
    limits = limits || { min: 0.2, max: 500 };
    let cost = 0, out;
    if (inp.a === 'resume') return { view: (st.tg && st.tg.gid === gid) ? G.view(cfg, st.tg.state) : null, done: false, win: 0, cost: 0, bal: st.bal };
    if (st.tg && st.tg.gid !== gid) return { err: 'tg_pending', gid: st.tg.gid, msg: 'Finish your other table round first' };
    if (inp.a === 'deal') {
      if (st.tg) return { err: 'in_round', msg: 'Round in progress', view: G.view(cfg, st.tg.state) };
      const b = cleanBets(inp.bets, G.keys); if (!b || !Object.keys(b).length) return { err: 'bad_bet', msg: 'Place a bet first' };
      if (G.validate) { const v = G.validate(cfg, b, inp); if (v && v.err) return v; }
      cost = r2(G.total ? G.total(b, cfg) : sumBets(b));
      if (!(cost > 0)) return { err: 'bad_bet', msg: 'Place a bet first' };
      if (cost < limits.min - 1e-9 || cost > limits.max + 1e-9) return { err: 'limits', msg: 'Table limits: ' + limits.min + ' – ' + limits.max };
      if (st.bal < cost - 1e-9) return { err: 'funds', msg: 'Not enough coins' };
      st.bal = r2(st.bal - cost); out = G.deal(cfg, b, inp);
    } else {
      if (!st.tg) return { err: 'no_round', msg: 'No round in progress' };
      const c = G.cost ? G.cost(cfg, st.tg.state, inp.a) : null; if (c == null) return { err: 'bad_action', msg: 'Action not allowed' };
      if (st.bal < c - 1e-9) return { err: 'funds', msg: 'Not enough coins for this action' };
      cost = r2(c); st.bal = r2(st.bal - cost); out = G.act(cfg, st.tg.state, inp.a, inp);
    }
    const win = out.done ? r2(out.win || 0) : 0;
    if (out.done) { st.bal = r2(st.bal + win); st.tg = null; } else st.tg = { gid, kind, state: out.state };
    const res = { view: G.view(cfg, out.state), done: !!out.done, win, cost, bal: st.bal };
    if (inp.shoe && inp.a === 'deal' && out.done) { inp.shoe.road.push(roadEntry(kind, out.state)); res.shoe = shoeInfo(inp.shoe); }
    return res;
  }
  function resume(st, gid, kind, variant) { if (!st.tg || st.tg.gid !== gid) return null; const G = K[kind]; return G.view(G.cfg(variant), st.tg.state); }
  const SHOE_KINDS = ['baccarat', 'dragontiger'];
  return { K, round, resume, newShoe, shoeInfo, roadEntry, SHOE_KINDS, baccaratDeal, cardCodes: C, shoeDraw, cardCode: cs, VP, BJV, KENO: KENO_T, WHEEL, WPAY, SB_T, SCR_P, REDS, eval5, best5, vpHand, hv, houseWay, evalJ5, evalJ2, PGT, tval, setLuckyK: k => { LUCKY_K = k; } };
})();
if (typeof module !== 'undefined') module.exports = TE;
