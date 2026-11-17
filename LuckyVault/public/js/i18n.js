// Language switch: 中文 / English / 双语 (bilingual).
// The game is written in English; in 中文 mode visible text nodes are rewritten from this dictionary
// (exact match first, then " · " separated parts, then pattern rules). Game proper names stay in English.
// Text that already contains Chinese (e.g. the bilingual baccarat bet labels) is never touched.
(function () {
  const KEY = 'lv_lang';
  let mode = null; try { mode = localStorage.getItem(KEY); } catch (e) {}
  if (!mode) mode = /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
  const D = {
    // lobby / navigation
    'Popular now': '热门游戏', 'See all ›': '查看全部 ›', 'Recently played': '最近玩过', 'New games': '新游戏', 'NEW': '新', 'HOT': '热门',
    'Search games': '搜索游戏', 'Bonus feature slots': '特色玩法老虎机', 'Jackpot slots': '奖池老虎机', 'Classic slots': '经典老虎机', 'Video slots': '视频老虎机',
    'Table games': '桌面游戏', 'Card & poker tables': '纸牌与扑克桌', 'Dice games': '骰子游戏', 'Video poker': '视频扑克', 'Table poker': '桌面扑克', 'Instant win': '即开即奖',
    'Vegas tables': '拉斯维加斯赌桌', 'The Vegas Strip · new tables': '拉斯维加斯大道 · 新赌桌', 'THE VEGAS STRIP': '拉斯维加斯大道', 'Hit the Strip': '前往大道',
    'Take a seat': '入座', 'Play': '开始游戏', 'PLAY': '开始', 'Play jackpots': '玩奖池游戏', 'Play poker': '玩扑克', 'LAS VEGAS STYLE': '拉斯维加斯风格', 'TABLE GAMES': '桌面游戏',
    'Real casino rules, real house edges. 52 tables open 24/7.': '真实赌场规则与赔率，52 张赌桌 24 小时开放。',
    'HOLD & WIN JACKPOTS': '奖池 Hold & Win', 'Grand Jackpot': '超级大奖', '1,000× your bet': '投注额 1,000 倍',
    'Collect 6 coins to lock and respin. Fill the screen for the Grand.': '集齐 6 枚金币即锁定并重转，铺满全屏赢超级大奖。',
    'Jacks or Better, Deuces Wild, Double Bonus and more.': '对 J 以上、百搭 2、双倍奖金等多种玩法。',
    '‹ LOBBY': '‹ 大厅', '🏠 Lobby': '🏠 大厅', '🎲 Vegas Strip': '🎲 维加斯大道', '🎰 Slots': '🎰 老虎机', '✨ Bonus Features': '✨ 特色玩法', '🪙 Jackpots': '🪙 奖池',
    '🍒 Classic': '🍒 经典', '🃏 Blackjack': '🃏 21点', '🎡 Roulette': '🎡 轮盘', '🀄 Baccarat': '🀄 百家乐', '♠️ Poker': '♠️ 扑克', '🂡 Video Poker': '🂡 视频扑克',
    '🎟️ Instant': '🎟️ 即开', '⭐ Favorites': '⭐ 收藏', '🕘 Recent': '🕘 最近',
    // categories / engines
    'Blackjack': '21点', 'Roulette': '轮盘', 'Baccarat': '百家乐', 'Dice': '骰子', 'Video Poker': '视频扑克', 'Table Poker': '桌面扑克', 'Slots': '老虎机',
    '20 Lines': '20 线', '243 Ways': '243 路', '4,096 Ways': '4,096 路', 'Cluster Pays': '群组消除', 'Tumble · Multipliers': '掉落 · 倍数', 'Hold & Win · Jackpots': 'Hold & Win · 奖池',
    'Classic 3-Reel · 5 Lines': '经典 3 轴 · 5 线', 'Expanding Wilds': '扩展百搭', 'Lightning Wilds': '闪电百搭', 'Multiplier Wilds': '倍数百搭', 'Mystery Symbols': '神秘符号',
    'Pick Bonus': '选择奖励', 'Sticky Wilds': '粘性百搭', 'Walking Wilds': '移动百搭', 'Wheel Bonus': '幸运转盘', 'Wild Reels': '百搭整轴', 'Cash Collect': '现金收集',
    'Choose Your Bonus': '自选奖励', 'Colossal Symbols': '巨型符号', 'Bonus Wheel': '奖励转盘', 'Low': '低', 'Low-Medium': '中低', 'Medium': '中', 'Medium-High': '中高', 'High': '高', 'Very High': '很高',
    'Volatility': '波动性', 'RTP': '返还率', 'Up to 99.5%': '最高 99.5%', 'return': '返还率',
    // slot UI
    'SPIN': '旋转', 'SPIN!': '旋转！', 'Spin': '旋转', 'Auto': '自动', 'Turbo': '极速', 'Bet': '投注', 'BET': '投注', 'Bet max': '最大投注', 'Win': '赢', 'Max win': '最高赢取',
    'Paytable': '赔付表', 'Paylines': '赔付线', 'Features': '特色玩法', 'FEATURE:': '特色：', 'Free spins': '免费旋转', 'FREE SPINS': '免费旋转', 'FS': '免费', 'BONUS': '奖励',
    'WILD': '百搭', 'SCATTER': '分散', 'Respins': '重转', 'BIG WIN': '大赢', 'MEGA WIN': '巨赢', 'EPIC WIN': '史诗级大赢', 'GRAND': '超级', 'MAJOR': '大奖', 'MINOR': '中奖', 'MINI': '小奖',
    'Grand': '超级', 'Major': '大奖', 'Minor': '中奖', 'Mini': '小奖', 'Buy': '购买', 'Ante': '加注', 'GAMBLE': '博倍', 'COLLECT': '收取', 'pays': '赔付',
    'Buy free spins for 100x the bet.': '花 100 倍投注额直接购买免费旋转。', 'Buy free spins for 80x the bet.': '花 80 倍投注额直接购买免费旋转。',
    'Wins pay left to right on 20 fixed lines. Only the highest win per line is paid.': '20 条固定赔付线，从左到右计算，每条线只计最高奖。',
    'Maximum win per spin is capped at 5,000x the bet.': '每次旋转最高赢取为投注额的 5,000 倍。',
    'All games use a random number generator; results shown as RTP are long-run simulated averages.': '所有游戏均使用随机数生成器；返还率为长期模拟平均值。',
    'Every WILD expands to fill its whole reel.': '每个百搭会扩展覆盖整个转轴。', 'In free spins every WILD sticks in place until the feature ends.': '免费旋转中，百搭会固定直到功能结束。',
    'Lightning can strike on any spin and add 3 to 6 extra WILDS.': '任何一次旋转都可能触发闪电，额外增加 3 到 6 个百搭。',
    'At random, one to three of the middle reels turn completely WILD.': '中间转轴会随机有 1 到 3 轴整轴变成百搭。',
    'Cherries pay with just 2 on a line.': '樱桃一条线上只要 2 个就有奖。',
    // tables
    'Deal': '发牌', 'Clear': '清除', 'Rebet': '重复投注', 'Roll': '掷骰', 'Call': '跟注', 'Raise': '加注', 'Fold': '弃牌', 'Hit': '要牌', 'Stand': '停牌', 'Double': '加倍', 'Split': '分牌',
    'Surrender': '投降', 'Insurance': '保险', 'Dealer': '庄家', 'Your hand': '你的手牌', 'Your 7 cards': '你的 7 张牌', 'Community cards': '公共牌', 'Main Bet': '主注',
    'Tap to add chips': '点击下注筹码', 'Tap cards to hold': '点击要保留的牌', 'TABLE LIMITS': '赌桌限额', 'Finish the current round first': '请先完成当前这一局',
    'Finish your other table round first': '请先完成另一张桌子的这一局', 'Not enough coins': '金币不足', 'PLAYER WINS': '闲赢', 'BANKER WINS': '庄赢', 'TIE': '和局',
    'Raise or call?': '加注还是跟注？', 'Raise to double': '加注翻倍', 'Will the third card fall in between?': '第三张牌会落在中间吗？', 'Spread': '差距',
    'Cash out before the crash': '在坠毁前兑现', 'Auto cash-out:': '自动兑现：', 'Quick pick': '机选', 'Picked': '已选', 'Pick numbers to see the paytable': '选号后查看赔付表',
    'Pick 1-10 numbers · 20 balls are drawn': '选 1-10 个号码 · 开出 20 个球', 'Buy ticket': '买票', 'Ticket 1.00': '票价 1.00', 'Board': '牌面', 'Trips': '三条',
    'Royal Flush': '皇家同花顺', 'Straight Flush': '同花顺', 'Four of a Kind': '四条', 'Full House': '葫芦', 'Flush': '同花', 'Straight': '顺子', 'Three of a Kind': '三条', 'Two Pair': '两对',
    'Four Aces': '四条 A', 'Four 2s-4s': '四条 2-4', 'Four 5s-Ks': '四条 5-K', 'Four 2s-10s': '四条 2-10', 'Four J/Q/K': '四条 J/Q/K', 'doubles': '对子', 'Good luck!': '祝你好运！',
    'Malfunction voids all pays and plays. Free-play credits only.': '机器故障时所有赔付和游戏作废。仅限免费娱乐积分。',
    'One bet per hand · 2 hands': '每手一注 · 共 2 手', 'Win both hands 1:1 (−5%)': '两手都赢 1:1（−5%）',
    // account / social
    'Log in': '登录', 'Create account': '注册账号', 'Forgot password?': '忘记密码？', 'Username or email': '用户名或邮箱', 'Password (8+ characters)': '密码（至少 8 位）',
    'Email (optional, for account recovery)': '邮箱（可选，用于找回账号）', 'Log in or create a free account to play. New players get a welcome bonus.': '登录或免费注册即可开始游戏，新玩家可领取欢迎奖励。',
    'Welcome to Lucky Vault': '欢迎来到 Lucky Vault', 'WELCOME TO': '欢迎来到', 'I am 18 or older, understand coins have no cash value, and accept the': '我已年满 18 岁，明白金币没有现金价值，并同意',
    'Terms': '服务条款', 'Privacy Policy': '隐私政策', 'and': '和', 'Settings': '设置', 'Settings & play limits': '设置与游戏限额', 'Sound': '音效', 'Music': '音乐', 'Close': '关闭', 'Off': '关',
    'Sound off': '关闭音效', 'Sound on': '打开音效', 'Music off': '关闭音乐', 'Music on': '打开音乐', 'Spending limit': '消费限额', 'History': '记录', 'Notifications': '通知',
    'Nothing new. Prizes, gifts and event news show up here.': '暂无新消息。奖品、礼物和活动消息会显示在这里。',
    'Rewards': '奖励', 'Missions': '任务', 'Missions & rewards': '任务与奖励', 'Achievements': '成就', 'Leaderboard': '排行榜', 'Tournaments': '锦标赛', 'Claim': '领取', 'Collector': '收藏家',
    'Coin store': '金币商店', 'STORE': '商店', 'VIP CLUB': 'VIP 俱乐部', 'Player level': '玩家等级', 'Bronze': '青铜', 'Silver': '白银', 'Gold': '黄金', 'Platinum': '白金', 'Diamond': '钻石',
    'BRONZE': '青铜', 'Free bonus now:': '现在可领免费奖励：', 'coins every 4 hours': '金币，每 4 小时一次', 'DAILY WHEEL': '每日转盘', 'DAILY RUSH': '每日冲刺', 'MISSION COMPLETE': '任务完成',
    'ACHIEVEMENT +100': '成就 +100', 'ACHIEVEMENT +500': '成就 +500', 'ACHIEVEMENT +1,000': '成就 +1,000', 'First win': '首次获胜', 'Win 500 coins in total': '累计赢取 500 金币',
    'Play 3 different games': '玩 3 款不同的游戏', 'Play 3 different games — claim in Rewards': '玩 3 款不同的游戏 — 在奖励中领取', 'Tap to continue': '点击继续', 'READY!': '准备好了！',
    'START': '开始', 'Album': '图鉴', 'ALBUM': '图鉴', 'cards collected': '张卡片已收集', 'VAULT': '金库', 'Vault': '金库', 'VAULT COLLECTION': '金库收藏', 'Coin Collection': '金币收藏',
    'Your VIP tier multiplies every free bonus and the daily wheel. Tiers are based on lifetime coin-pack purchases.': '你的 VIP 等级会放大每次免费奖励和每日转盘。等级按累计购买金币包计算。',
    'Keep playing': '继续玩', 'Take a break': '休息一下', 'Reality check': '游戏时长提醒', 'Spend': '消费', 'everyone': '所有人', 'Multi': '多手',
    'games · Social casino for entertainment only. Credits are virtual, have no cash value and cannot be withdrawn or exchanged.': '款游戏 · 社交娱乐场，仅供娱乐。积分为虚拟积分，没有现金价值，不能提现或兑换。',
    'This game is coming soon': '该游戏即将上线', 'This game is under maintenance': '该游戏正在维护', 'You have unfinished free spins': '你还有未完成的免费旋转',
    "I am 18 or older": "我已年满 18 岁",
    "Leave": "离开",
    "LUCKY": "LUCKY",
    "Next": "下一步",
    "Skip": "跳过",
    "Browse all games": "浏览全部游戏",
    "Lucky Vault is a social casino for adults aged 18 and over. It is for entertainment only: coins have no cash value and nothing can be won as real money.": "Lucky Vault 是面向 18 岁以上成年人的社交娱乐场，仅供娱乐：金币没有现金价值，不能赢得真钱。",
    "Slots, jackpots, blackjack, roulette, poker and more. Use the tabs or search to find a game.": "老虎机、奖池、21点、轮盘、扑克等应有尽有。用上方分类或搜索找游戏。",
    "2x chance": "2倍",
    "Blind = Ante (auto)": "盲注 = 底注（自动）",
    "Trips 3:1 → Royal 50:1": "三条 3:1 → 皇家同花顺 50:1",
    "on any bet for its rules": "查看该注的规则",
    "& Baccarat": "和百家乐",
    "Blackjack, Roulette": "21点、轮盘",
    "Pai Gow Poker & Tiles, Ultimate Texas Hold’em, Let It Ride, Mississippi Stud, Spanish 21, EZ Baccarat, Ten Play poker and classic reels.": "牌九扑克与骨牌、终极德州扑克、任它行、密西西比梭哈、西班牙 21 点、EZ 百家乐、十手扑克和经典老虎机。",
    "6 decks · Dealer hits soft 17 · Blackjack pays 3:2 · Side bets: Perfect Pairs (mixed 6:1, coloured 12:1, perfect 25:1) · 21+3 with the dealer up card (flush 5:1, straight 10:1, trips 30:1, straight flush 40:1, suited trips 100:1)": "6 副牌 · 庄家软 17 要牌 · 黑杰克赔 3:2 · 边注：完美对子（混色 6:1、同色 12:1、完美 25:1）· 21+3 与庄家明牌组合（同花 5:1、顺子 10:1、三条 30:1、同花顺 40:1、同花三条 100:1）",
    "Bet 3× or 4× before the flop, 2× after the flop, 1× on the river (or fold) · Dealer qualifies with a pair · Blind pays on a straight or better: 1:1 → royal 500:1": "翻牌前可下 3 倍或 4 倍，翻牌后 2 倍，河牌 1 倍（或弃牌）· 庄家有一对才合格 · 盲注在顺子及以上赔付：1:1 → 皇家同花顺 500:1",
    "Tap a number for straight 35:1 · tap a line for split 17:1 · a corner for 8:1 · the bottom edge for street 11:1 / six line 5:1 · Dozens/Columns 2:1 · Even-money 1:1": "点数字押单号 35:1 · 点分隔线押两号 17:1 · 点角押四号 8:1 · 点底边押三号 11:1 / 六号 5:1 · 打/列 2:1 · 平注 1:1",
    "Classic Blackjack": "经典21点",
    "CLASSIC BLACKJACK": "经典21点",
    "European Blackjack": "欧式21点",
    "Single Deck Blackjack": "单副牌21点",
    "Free Bet Blackjack": "免费加倍21点",
    "Blackjack Switch": "换牌21点",
    "Vegas Strip Blackjack": "维加斯大道21点",
    "Spanish 21": "西班牙21点",
    "European Roulette": "欧式轮盘",
    "EUROPEAN ROULETTE": "欧式轮盘",
    "American Roulette": "美式轮盘",
    "French Roulette": "法式轮盘",
    "Lucky Strike Roulette": "幸运轮盘",
    "No Commission Baccarat": "免佣百家乐",
    "NO COMMISSION BACCARAT": "免佣百家乐",
    "Punto Banco": "经典百家乐",
    "EZ Baccarat": "EZ 百家乐",
    "Speed Baccarat": "极速百家乐",
    "Dragon Tiger": "龙虎",
    "Sic Bo": "骰宝",
    "SIC BO": "骰宝",
    "Craps": "花旗骰",
    "Red Dog": "红狗",
    "Casino War": "赌场战争",
    "Three Card Poker": "三张牌扑克",
    "Four Card Poker": "四张牌扑克",
    "Caribbean Stud": "加勒比梭哈",
    "Casino Hold'em": "赌场德州扑克",
    "Ultimate Texas Hold'em": "终极德州扑克",
    "ULTIMATE TEXAS HOLD'EM": "终极德州扑克",
    "Let It Ride": "任它行",
    "Mississippi Stud": "密西西比梭哈",
    "High Card Flush": "高牌同花",
    "Pai Gow Poker": "牌九扑克",
    "Pai Gow Tiles": "骨牌牌九",
    "Jacks or Better": "对J以上",
    "Deuces Wild": "百搭2",
    "Bonus Poker": "奖金扑克",
    "Double Bonus Poker": "双倍奖金扑克",
    "Joker Poker": "小丑扑克",
    "Aces & Faces": "A与人头牌",
    "Triple Play Poker": "三手扑克",
    "Triple Play Deuces": "三手百搭2",
    "Ten Play Poker": "十手扑克",
    "Ten Play Double Bonus": "十手双倍奖金",
    "VIDEO POKER": "视频扑克",
    "Classic Keno": "经典基诺",
    "Power Keno": "强力基诺",
    "Four Card Keno": "四卡基诺",
    "Rocket Crash": "火箭冲天",
    "Money Wheel": "金钱转轮",
    "Instant Win": "即开即奖",
    "Gold Rush Scratch": "淘金刮刮卡",
    "Lucky Cash Scratch": "幸运现金刮刮卡",
    "Diamond Dazzle Scratch": "钻石闪耀刮刮卡",
  };
  const RULES = [
    [/^Bet ([\d.,]+)$/, (m) => '投注 ' + m[1]], [/^Coin ([\d.,]+)$/, (m) => '币值 ' + m[1]], [/^RTP ([\d.]+%)$/, (m) => '返还率 ' + m[1]],
    [/^Table max ([\d.,]+)$/, (m) => '赌桌上限 ' + m[1]], [/^([\d,]+) \/ ([\d,]+) · Reward ([\d,]+) coins$/, (m) => m[1] + ' / ' + m[2] + ' · 奖励 ' + m[3] + ' 金币'],
    [/^([\d.,]+) \/ ([\d.,]+) · Reward ([\d,]+) coins$/, (m) => m[1] + ' / ' + m[2] + ' · 奖励 ' + m[3] + ' 金币'], [/^(\d+)\/(\d+) · Prize ([\d,]+)$/, (m) => m[1] + '/' + m[2] + ' · 奖励 ' + m[3]],
    [/^(\d)× ([\d.]+) \/way$/, (m) => m[1] + '× ' + m[2] + ' /路'], [/^New missions in (.*)\. Missions reset every day at midnight\.$/, (m) => m[1].replace('h', '小时').replace('m', '分') + '后刷新新任务。任务每天午夜重置。'],
    [/^×([\d.]+) bonuses$/, (m) => '奖励 ×' + m[1]], [/^from \$(\d+)$/, (m) => '$' + m[1] + ' 起'], [/^Music (on|off)$/, (m) => m[1] === 'on' ? '音乐已开' : '音乐已关'], [/^Sound (on|off)$/, (m) => m[1] === 'on' ? '音效已开' : '音效已关'],
    [/^(\d+) min$/, (m) => m[1] + ' 分钟'],
    [/^Real casino rules, real house edges\. (\d+) tables open 24\/7\.$/, (m) => '真实赌场规则与赔率，' + m[1] + ' 张赌桌 24 小时开放。'],
    [/^Reminder: (.*) → change$/, (m) => '提醒：' + m[1].replace(' min', ' 分钟').replace('off', '关') + ' → 更改'],
    [/^Session: (\d+) min · (\d+) rounds · played ([\d.,]+) · won ([\d.,]+)\. Reality check reminder: (.*)\. Sound: (on|off)\.$/, (m) => '本次：' + m[1] + ' 分钟 · ' + m[2] + ' 局 · 投注 ' + m[3] + ' · 赢得 ' + m[4] + '。时长提醒：' + m[5].replace('every ', '每 ').replace(' min', ' 分钟').replace('off', '关') + '。音效：' + (m[6] === 'on' ? '开' : '关') + '。'],
    [/^Spending limit$/, () => '消费限额'],
  ];
  const CJK = /[㐀-鿿]/;
  function tr(t) {
    if (D[t] != null) return D[t];
    for (const [re, f] of RULES) { const m = t.match(re); if (m) return f(m); }
    if (t.indexOf(' · ') > 0) { const ps = t.split(' · '); let hit = false; const out = ps.map(p => { const q = D[p] != null ? D[p] : (RULES.find(r => r[0].test(p)) ? tr(p) : null); if (q != null) { hit = true; return q; } return p; }); if (hit) return out.join(' · '); }
    return null;
  }
  const ORIG = new WeakMap();
  function apply(node) {
    const raw = node.nodeValue; if (!raw || !raw.trim() || CJK.test(raw)) return;
    const t = raw.trim(); const z = tr(t); if (z == null) return;
    const out = mode === 'bi' && t.length <= 14 && z !== t ? z + ' ' + t : z;
    ORIG.set(node, raw); node.nodeValue = raw.replace(t, out);
  }
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, CANVAS: 1 };
  function walk(root) {
    if (!root) return; if (root.nodeType === 3) return apply(root);
    if (root.nodeType !== 1 || SKIP[root.nodeName] || (root.closest && root.closest('[data-noi18n]'))) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentNode && SKIP[n.parentNode.nodeName]) ? 2 : 1 });
    const list = []; while (w.nextNode()) list.push(w.currentNode); list.forEach(apply);
    if (root.querySelectorAll) root.querySelectorAll('input[placeholder]').forEach(i => { const z = tr(i.placeholder); if (z) i.placeholder = z; });
  }
  let mo = null;
  function start() {
    if (mode === 'en') return; document.documentElement.lang = 'zh';
    walk(document.body);
    mo = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') apply(m.target); else m.addedNodes.forEach(walk); } });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  const NAMES = { zh: '中文', en: 'English', bi: '双语 Bilingual' };
  window.LVLang = {
    get: () => mode, name: () => NAMES[mode], tr: (t) => (mode === 'en' ? t : (tr(t) || t)),
    next() { const order = ['zh', 'en', 'bi']; const n = order[(order.indexOf(mode) + 1) % 3]; try { localStorage.setItem(KEY, n); } catch (e) {} location.reload(); },
    set(n) { try { localStorage.setItem(KEY, n); } catch (e) {} location.reload(); },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
