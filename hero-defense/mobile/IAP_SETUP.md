# App 内购接入步骤（英雄塔防）

现状：游戏代码已经接好 Apple / Google 内购接口（`features49.js`），**默认关闭**。关闭时 App 里不显示任何付费入口，和现在一样。

## 1. 在两个商店后台建商品（Kev）
商品类型都选 **消耗型（Consumable）**，商品 ID 必须和下表一致：

| 商品 ID | 内容 | 建议价格 |
|---|---|---|
| herodefense.yb_60 | 60 钻石 | $0.99 |
| herodefense.yb_300 | 300+30 钻石 | $4.99 |
| herodefense.yb_680 | 680+88 钻石 | $9.99 |
| herodefense.yb_1280 | 1280+220 钻石 | $19.99 |
| herodefense.yb_newbie | 新手礼包（680 钻石 + 英雄） | $2.99 |
| herodefense.newbie7 | 7 日新手特惠 | $1.99 |
| herodefense.prep | 备战礼包 | $0.99 |
| herodefense.limit | 限时礼包 | $4.99 |
| herodefense.pass | 高级通行证（当季） | $9.99 |
| herodefense.month | 月卡（30 天） | $4.99 |

- Apple：App Store Connect → 你的 App → 功能 → App 内购买项目。还要先签「付费 App 协议」并填好银行和税务信息。
- Google：Play Console → 你的 App → 营利 → 产品 → 应用内商品。需要先上传过一次带 BILLING 权限的包（第 2 步装好插件后的包就带了）。

## 2. 打开内购（告诉我，我来改）
1. 在 `mobile/package.json` 加依赖 `cordova-plugin-purchase`（v13）。
2. 在 App 包里加一行 `window.HERO_IAP={on:true}`（`mobile/prepare.js` 打包时注入）。
3. 重新打包上传测试轨道，用商店的测试账号（Apple 沙盒账号 / Google 许可测试账号）买一遍，确认到账。

## 3. 说明
- 网页版继续用 Stripe，App 版只用商店内购（商店规定虚拟商品必须走内购）。
- 交易号会记录在存档里防止重复发货。正式运营后建议加服务器端收据校验（防破解），可以用 Supabase Edge Function 做，到时我来写。
- 价格显示：接通后可以显示商店返回的本地货币价格。
