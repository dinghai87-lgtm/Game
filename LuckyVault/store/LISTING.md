# Lucky Vault — 应用商店上架资料 / Store listing kit
版权所有 © 万泰游戏开发 (Wantai Game Development)

## 文件 Files in this folder
| 文件 | 用途 |
|---|---|
| icon-1024.png | App Store 图标（1024×1024，无透明）· Google Play 图标请用 512 版：public/icons/icon-512.png |
| feature-graphic-1024x500.png | Google Play「置顶大图 Feature graphic」|
| screens/iphone67_*.png | App Store 6.7 寸截图（1290×2796），中文 zh / 英文 en 各 5 张 |
| screens/android_*.png | Google Play 手机截图（1080×1920），中文 / 英文各 5 张 |

> 截图是用当前版本自动截的初稿。买了正式美术素材后，建议重新截图（运行 `python3 tools/store_shots.py`，或者让 Claude 重新截）。

---

## 中文（简体）

**应用名称**（30 字以内）：Lucky Vault 幸运金库 - 社交娱乐场

**副标题 / 简短描述**（80 字以内）：
免费老虎机、百家乐、21点、轮盘，和朋友同桌咪牌。纯娱乐，虚拟金币。

**完整描述**：
欢迎来到 Lucky Vault 幸运金库！上百款老虎机和 50 多张真实规则的赌桌，随时免费畅玩。

• 老虎机：Hold & Win 奖池、4,096 路、掉落倍数、群组消除、经典三轴……每周都有新玩法
• 百家乐：真实 8 副牌靴、完整路单（大路、大眼仔、小路、曱甴路），亲手咪牌，熊猫 8、龙 7、大老虎、小老虎等边注
• 多人桌：和真人玩家同桌下注，抢庄咪牌、快捷聊天，还能开私人房邀请朋友
• 21点、轮盘、骰宝、龙虎、德州扑克、牌九、视频扑克、基诺、刮刮卡
• 每日转盘、任务、成就、图鉴收集、俱乐部排行、每周活动
• 中文 / English / 双语界面

重要说明：
• 本游戏仅供 18 岁以上成年人娱乐。
• 游戏中的金币为虚拟货币，没有任何现金价值，不能提现、兑换或转让，也不能赢得真钱或实物奖品。
• 在本游戏中的表现，不代表在真实赌博中会获得同样的结果。
• 内置负责任娱乐工具：每日游戏时长上限、暂停休息（1/7/30/90 天）、时长提醒。

**关键词**（App Store，100 字符以内，逗号分隔）：
老虎机,百家乐,21点,轮盘,娱乐场,扑克,骰宝,龙虎,奖池,咪牌

---

## English

**App name** (max 30): Lucky Vault: Social Casino

**Subtitle** (App Store, max 30): Slots, Baccarat & Blackjack

**Short description** (Google Play, max 80):
Free slots, baccarat, blackjack & roulette. Squeeze cards with friends. Fun only.

**Full description**:
Welcome to Lucky Vault! Hundreds of slots and 50+ tables with real casino rules — free to play, any time.

• Slots: Hold & Win jackpots, 4,096 Ways, tumbling multipliers, cluster pays, classic 3-reel and new mechanics every week
• Baccarat: a real 8-deck shoe, full roadmaps (Big Road, Big Eye Boy, Small Road, Cockroach Pig), squeeze the cards yourself, Panda 8, Dragon 7, Big/Small Tiger side bets
• Shared tables: bet alongside other players, the biggest bettor squeezes, quick chat, private rooms for friends
• Blackjack, roulette, sic bo, dragon tiger, hold'em, pai gow, video poker, keno and scratch cards
• Daily wheel, missions, achievements, card album, club rankings and weekly events
• Chinese / English / bilingual interface

Important:
• For adults 18+ and for entertainment only.
• Coins are virtual. They have no cash value and cannot be withdrawn, exchanged or transferred; nothing can be won as real money or prizes.
• Success at social casino gaming does not imply future success at real-money gambling.
• Built-in responsible play tools: daily time limit, take-a-break (1/7/30/90 days) and reality-check reminders.

**Keywords** (App Store, max 100 chars):
slots,casino,baccarat,blackjack,roulette,poker,jackpot,sic bo,dragon tiger,vegas

---

## 上架检查清单 Submission checklist
- [ ] 在 mobile/capacitor.config.json 把 appId 改成你自己的（例如 com.wantai.luckyvault）
- [ ] 正式服务器用 HTTPS 域名部署（deploy/ 文件夹里有 Docker + Caddy 方案），App 指向这个域名
- [ ] 运行 release-check.bat，结果必须是 READY TO SHIP
- [ ] 金币购买必须走 Apple / Google 应用内购买（IAP），服务器 /api/iap/verify 校验收据
- [ ] 年龄分级：Apple 选 17+ 并勾选「模拟赌博 Simulated Gambling：频繁/强烈」；Google Play 内容分级问卷里如实填写「模拟赌博」，目标年龄 18+
- [ ] Google Play：Data safety 表格（收集：用户名、可选邮箱、游戏记录；不出售数据）；隐私政策网址填 https://你的域名/legal/privacy.html
- [ ] Apple：App Privacy 表格同上；提供审核用的测试账号
- [ ] 两家商店都要求：社交娱乐场不能提供真钱奖励或兑换——游戏和描述里都已写明
- [ ] 部分国家/地区对模拟赌博类 App 有额外限制，上架时按商店提示选择发行地区
