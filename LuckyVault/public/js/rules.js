// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// 规则中心 Rules hub: Chinese + English rules for every table game. Opened from the table's (i) button and the lobby.
(function () {
  const R = {
    blackjack: ['21点 Blackjack', ['比庄家更接近 21 点且不爆牌即赢，赔 1:1；首两张 A + 10 点牌为 Blackjack，赔 3:2。', '可以要牌 (Hit)、停牌 (Stand)、加倍 (Double)、分牌 (Split)；部分桌可投降 (Surrender) 或买保险。', '各桌规则不同：欧式无暗牌、Free Bet 免费加倍分牌（庄 22 点为和）、西班牙 21 点没有 10、Switch 两手互换第二张牌。', '边注：完美对子 6:1 / 12:1 / 25:1；21+3（你的两张牌 + 庄家明牌）5:1 至 100:1。'],
      ['Beat the dealer without going over 21: wins pay 1:1, blackjack pays 3:2.', 'Hit, stand, double, split; some tables allow surrender or insurance.', 'Side bets: Perfect Pairs and 21+3.']],
    roulette: ['轮盘 Roulette', ['选择号码或区域下注，小球停在哪个号码即开奖。', '单号 35:1 · 两号 17:1 · 三号 11:1 · 四号 8:1 · 六号 5:1 · 打/列 2:1 · 红黑/单双/大小 1:1。', '欧式 37 格（一个 0），美式 38 格（0 和 00），法式开 0 时外围注退一半。', 'Lucky Strike：每局 1–5 个幸运号码带 50–500 倍。'],
      ['Bet on numbers or areas; the ball decides.', 'Straight 35:1, split 17:1, street 11:1, corner 8:1, six line 5:1, dozens/columns 2:1, even-money 1:1.']],
    baccarat: ['百家乐 Baccarat', ['押闲 (Player)、庄 (Banker) 或和 (Tie)，点数最接近 9 的一方赢；10、J、Q、K 为 0 点，A 为 1 点，点数只取个位。', '前两张 8 或 9 点为"例牌"，直接开牌；否则按固定补牌规则补第三张。', '闲赢赔 1:1；庄赢赔 0.95:1（免佣桌赔 1:1，但庄 6 点赢只赔一半；EZ 桌庄三张 7 点赢退本金）；和赔 8:1，和局时庄闲注退回。', '每局只能押庄或闲其中一边。', '边注：庄对/闲对 11:1、龙宝、小龙 16:1、大龙 33:1、小老虎 23:1、大老虎 54:1、龙7 40:1、熊猫8 25:1。长按下注格可看每一注的说明。', '牌从真实的 8 副牌靴发出，切牌出现后换新靴；牌路记录本靴每一手。'],
      ['Bet Player, Banker or Tie; closest to 9 wins. Tens and faces count 0, aces 1.', 'Player 1:1, Banker 0.95:1 (no-commission: 1:1, Banker 6 pays half), Tie 8:1.', 'Dealt from a real 8-deck shoe; the scoreboard records the shoe.']],
    mbacc: ['多人百家乐 Shared Baccarat', ['和其他玩家同桌：所有人看同一副牌靴、同一手牌、同一条牌路。', '倒计时内放筹码并按"确认下注"，可多次加注；倒计时结束停止下注，未确认的筹码会退回。', '开牌后按百家乐规则结算，结果、余额自动更新；可以看到在线人数和其他玩家的下注。', '赔率与普通百家乐相同（庄 0.95:1），每局只能押庄或闲其中一边。'],
      ['Everyone at the table shares the same shoe, hand and scoreboard.', 'Place chips and press BET during the countdown; you can add more until it ends.']],
    dragontiger: ['龙虎 Dragon Tiger', ['龙、虎各发一张牌，牌大的一方赢，赔 1:1；A 最小，K 最大。', '和局（点数相同）时押龙或虎输一半；押和赔 11:1，同花和赔 50:1。', '每局只能押龙或虎其中一边。牌从 8 副牌靴发出。'],
      ['One card each to Dragon and Tiger; higher card wins 1:1 (ace low).', 'On a tie Dragon/Tiger bets lose half; Tie 11:1, suited tie 50:1.']],
    sicbo: ['骰宝 Sic Bo', ['摇三颗骰子。小（总点 4–10）、大（11–17）赔 1:1，出围骰则输。', '全围（任意三颗相同）30:1 · 指定围骰 180:1 · 对子 10:1 · 点数 6:1 至 60:1。', '单骰：选的点数出现 1 个赔 1:1、2 个赔 2:1、3 个赔 3:1。'],
      ['Three dice. Small/Big 1:1 (lose on triples), any triple 30:1, specific triple 180:1, doubles 10:1, totals 6:1–60:1, singles 1:1–3:1.']],
    craps: ['花旗骰 Craps', ['首掷 7 或 11 押 Pass 赢，2、3、12 输；其他点数成为"点"，之后再掷出该点赢、先出 7 输。', "Don't Pass 相反（12 为和）。Field、Any 7、Any Craps、Yo 为单掷注。"],
      ['Come-out 7/11 wins Pass, 2/3/12 loses; otherwise a point is set and must repeat before a 7.']],
    videopoker: ['视频扑克 Video Poker', ['发 5 张牌，点选要保留的牌，再换掉其余的牌；按最终牌型对照赔率表赔付。', '下 5 个币最大注时皇家同花顺赔 4000。各版本规则：百搭 2（Deuces Wild）、小丑牌（Joker Poker）等。', '多手版（3 手 / 10 手）：保留的牌会复制到每一手，各自换牌。'],
      ['Hold cards, draw the rest; paid by the final hand. Max coins pay 4000 for a royal flush.']],
    tcp: ['三张牌扑克 Three Card Poker', ['下底注后看牌，选择弃牌或跟注（跟注 = 底注）。庄家 Q 高以上才"合格"。', '庄不合格：底注赢 1:1、跟注退回；合格时比牌大小。底注奖励：顺子 1:1、三条 4:1、同花顺 5:1。', 'Pair Plus 只看你自己的牌：对子 1:1 起，同花顺 40:1。'],
      ['Ante, then fold or play. Dealer qualifies with queen high. Pair Plus pays on your own hand.']],
    holdem: ["娱乐场德州扑克 Casino Hold'em", ['你两张、庄两张、公共牌五张，各取最好的五张。看翻牌后选择弃牌或跟注（2 倍底注）。', '庄家需要一对 4 以上才合格；不合格时底注按赔率表赔、跟注退回。'],
      ['Call (2× ante) or fold after the flop; dealer qualifies with a pair of 4s.']],
    caribbean: ['加勒比扑克 Caribbean Stud', ['五张牌对庄家五张。看牌后弃牌或加注（2 倍底注）。庄家需要 A-K 以上才合格。', '加注按牌型赔 1:1 至 100:1（皇家同花顺）。'],
      ['Raise (2× ante) or fold; dealer qualifies with ace-king. Raise pays 1:1 up to 100:1.']],
    war: ['娱乐场战争 Casino War', ['你和庄家各一张牌，大者赢 1:1。', '同点时可以"开战"（再下同额）或投降（退一半）。'],
      ['Higher card wins 1:1; on a tie go to war or surrender half.']],
    reddog: ['红狗 Red Dog', ['先开两张牌，第三张落在两张之间即赢。间隔 1 赔 5:1、2 赔 4:1、3 赔 2:1、4 以上 1:1。', '前两张相同、第三张也相同赔 11:1。可以加倍下注。'],
      ['Will the third card fall between the first two? Spread pays 5:1 to 1:1.']],
    uth: ["终极德州 Ultimate Texas Hold'em", ['底注 + 盲注（等额）。翻牌前可下 3 或 4 倍，翻牌后 2 倍，河牌后 1 倍或弃牌。', '庄家一对以上合格；盲注在顺子以上按赔率表赔付。Trips 边注按你的牌型赔付。'],
      ['Ante + blind; bet 3–4× pre-flop, 2× after the flop, 1× on the river, or fold.']],
    letitride: ['任它跑 Let It Ride', ['下三份相同的注，看三张牌后可收回第一份，看第一张公共牌后可收回第二份。', '最后五张牌 10 一对以上按赔率表赔付每一份留下的注。'],
      ['Three equal bets; pull back the first two as cards are revealed. Pays on tens or better.']],
    mstud: ['密西西比扑克 Mississippi Stud', ['底注后，每开一张公共牌可以下 1–3 倍或弃牌，共三轮。', '最终五张牌 6-10 一对退本，J 以上一对 1:1 起，皇家同花顺 500:1。'],
      ['Bet 1–3× on each of three streets or fold; pays from a pair of jacks.']],
    fourcard: ['四张牌扑克 Four Card Poker', ['你 5 张取最好的 4 张，对庄家 6 张取最好的 4 张。可下 1–3 倍或弃牌。', 'Aces Up 边注：一对 A 以上按赔率表赔付。'],
      ['Best 4 of your 5 vs best 4 of the dealer\'s 6. Play up to 3×.']],
    hcf: ['高牌同花 High Card Flush', ['七张牌比最长的同花（同花张数多者赢，再比大小）。可按同花长度加注 1–3 倍。', '庄家需要 3 张 9 以上的同花才合格。'],
      ['Seven cards each; longest flush wins. Raise by flush size.']],
    paigow: ['牌九扑克 Pai Gow Poker', ['七张牌（含一张小丑）分成五张的头手和两张的尾手，头手必须大于尾手。', '两手都赢庄家才赢（赔 1:1 抽 5%），一赢一输为和，相同算庄赢。可用"庄家方式"自动摆牌。'],
      ['Split 7 cards into a 5-card high hand and a 2-card low hand; win both to win.']],
    paigowtiles: ['牌九 Pai Gow Tiles', ['四张骨牌分成头、尾两对，尾必须大于等于头；两手都赢庄家才赢，一赢一输为和。', '大小：至尊宝 > 对子（双天、双地…）> 天王/地王 > 天杠/地杠 > 九点 … 0 点。点数相同庄赢。'],
      ['Split four tiles into two pairs; win both hands to win.']],
    crash: ['火箭 Rocket Crash', ['倍数从 1.00x 开始上升，在火箭飞走之前按"兑现"即可按当前倍数赢。', '可设置自动兑现倍数。爆炸点在开局时由服务器决定（长期返还约 97%）。'],
      ['Cash out before the rocket flies away; auto cash-out available.']],
    wheel: ['幸运转盘 Money Wheel', ['押转盘停下的格子：1、2、5、10、20 按数字赔付，Joker 和 Logo 40:1。'], ['Bet where the wheel stops.']],
    keno: ['基诺 Keno', ['从 1–80 选 1–10 个号码，开出 20 个球，按命中个数对照赔率表赔付。', 'Power Keno：最后一个球命中你的号码，奖金 ×4。四卡基诺：四张卡同时用一次开奖。'],
      ['Pick 1–10 numbers; 20 balls are drawn; pays by hits.']],
    scratch: ['刮刮乐 Scratch', ['刮开九格，出现三个相同的金额或符号即赢对应奖金。'], ['Match three to win that prize.']]
  };
  R.mdt = ['多人龙虎 Shared Dragon Tiger', ['和其他玩家同桌，共用一副 8 副牌靴和同一条牌路；倒计时内下注并按"确认下注"。'].concat(R.dragontiger[1]), R.dragontiger[2]];
  R.msicbo = ['多人骰宝 Shared Sic Bo', ['和其他玩家同桌，大家押同一次掷骰；倒计时内下注并按"确认下注"。'].concat(R.sicbo[1]), R.sicbo[2]];
  R.mroul = ['多人轮盘 Shared Roulette', ['和其他玩家同桌（欧式单 0 轮盘），大家押同一次开奖；倒计时内下注并按"确认下注"。'].concat(R.roulette[1]), R.roulette[2]];
  R.mbacc[1].push('咪牌：本局押庄或闲金额最大的玩家负责咪牌，其他人围观，咪完后大家一起开牌。', '桌上可以发快捷短语 💬 和其他玩家互动。');
  const COPY = '© 2026 万泰游戏开发 Wantai Game Development · 版权所有 All rights reserved.';
  const LG = () => (window.LVLang && LVLang.get()) || 'bi', RT = (zh, en) => LG() === 'zh' ? zh : LG() === 'en' ? en : zh + ' · ' + en;
  // title "中文 English" → one side; zh shows the Chinese list, en the English summary, 双语 both (as before)
  const ttl = t => { const m = String(t).match(/^([^A-Za-z]+?)\s+([A-Za-z].*)$/); return !m ? t : LG() === 'zh' ? m[1] : LG() === 'en' ? m[2] : t; };
  function html(tk, extra) { const r = R[tk]; if (!r) return ''; const L = LG();
    return '<div class="rz"><h3>' + ttl(r[0]) + '</h3>' + (L !== 'en' ? '<ul>' + r[1].map(x => '<li>' + x + '</li>').join('') + '</ul>' : '') + (L !== 'zh' ? '<div class="rz-en' + (L === 'en' ? ' only' : '') + '">' + r[2].map(x => '<p>' + x + '</p>').join('') + '</div>' : '') + (extra ? '<p class="rz-x">' + extra + '</p>' : '') + '</div>'; }
  function show(tk, extra) { let o = document.getElementById('rulesOv'); if (!o) { o = document.createElement('div'); o.id = 'rulesOv'; document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.closest('.rz-close')) o.classList.remove('show'); }; }
    const all = !tk; o.innerHTML = '<div class="rz-box"><button class="rz-close">✕</button><h2>' + (all ? RT('规则中心', 'Game rules') : RT('玩法规则', 'How to play')) + '</h2>' +
      (all ? Object.keys(R).map(k => html(k)).join('') : html(tk, extra)) + (all ? '' : '<p class="rz-more"><a href="#" id="rzAll">' + RT('查看全部游戏规则', 'All game rules') + '</a></p>') + '<p class="rz-c">' + (LG() === 'zh' ? '© 2026 万泰游戏开发 · 版权所有' : LG() === 'en' ? '© 2026 Wantai Game Development · All rights reserved.' : COPY) + '</p></div>';
    o.classList.add('show'); const a = o.querySelector('#rzAll'); if (a) a.onclick = e => { e.preventDefault(); show(null); }; }
  const st = document.createElement('style'); st.textContent = '#rulesOv{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:14px}#rulesOv.show{display:flex}' +
    '.rz-box{position:relative;max-width:640px;width:100%;max-height:86vh;overflow:auto;background:linear-gradient(#1b1030,#0d0818);border:2px solid #ffd60a;border-radius:16px;padding:18px 20px;color:#eee;font:14px/1.6 "Microsoft YaHei","PingFang SC",Arial,sans-serif}' +
    '.rz-box h2{margin:0 0 10px;color:#ffd60a;font-size:20px}.rz h3{margin:14px 0 4px;color:#ffd60a;font-size:16px}.rz ul{margin:0;padding-left:20px}.rz li{margin:3px 0}.rz-en{opacity:.65;font-size:12px;margin-top:4px}.rz-en p{margin:2px 0}.rz-en.only{opacity:1;font-size:14px}.rz-x{opacity:.75;font-size:12px}' +
    '.rz-close{position:sticky;float:right;top:0;border:0;background:#ffd60a;color:#1a1200;border-radius:50%;width:30px;height:30px;font-weight:900;cursor:pointer}.rz-more a{color:#ffd60a}.rz-c{opacity:.5;font-size:11px;margin-top:14px}';
  document.head.appendChild(st);
  window.LVRules = { show, R };
})();
