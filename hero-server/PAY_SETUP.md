# 英雄塔防 · Stripe 支付接入说明

游戏前端和后端都已做好，拿到 Stripe 账号后按下面 4 步开通。没开通之前，正式版不显示充值，玩家看不到任何付费入口。

## 1. Stripe 后台要拿到的东西（Kevin 自己操作，别把密钥发到聊天里）
- **Secret key**：Developers → API keys，`sk_live_…`（测试用 `sk_test_…`）
- **Webhook signing secret**：Developers → Webhooks → Add endpoint
  - 地址：`https://<后端域名>/api/pay/webhook`
  - 事件：`checkout.session.completed`、`checkout.session.async_payment_succeeded`、`checkout.session.async_payment_failed`、`checkout.session.expired`、`charge.refunded`
  - 保存后复制 `whsec_…`
- Settings → Payment methods：打开 Card、Apple Pay、Google Pay（Checkout 页面自动显示）

## 2. 部署后端（server/server.js，Node 18+，无第三方依赖）
```
STRIPE_SECRET_KEY=sk_live_xxx \
STRIPE_WEBHOOK_SECRET=whsec_xxx \
PAY_ALLOWED_ORIGINS=https://eleronzentechnology.com,https://www.eleronzentechnology.com \
node server.js
```
需要 HTTPS 域名（例如 `api.eleronzentechnology.com`）。数据存在 `server/data/db.json`，正式运营前建议换数据库。

## 3. 打开游戏里的支付
在 `hero-defense/index.html` 的游戏脚本之前加一行：
```
<script>window.HERO_PAY_CFG={mode:'stripe',api:'https://api.eleronzentechnology.com'};</script>
```
加上后网页版商城会出现「充值 / 特权 / 道具 / VIP」页签，月卡、通行证、各种礼包都走同一个结账界面。

## 4. 上线前自测
1. 先用 `sk_test_…` 和测试 webhook，付款时用卡号 `4242 4242 4242 4242`（任意未来日期、任意 CVC）
2. 依次测：付款成功到账、取消付款（不扣款不到账）、付款后刷新页面（只到账一次）
3. 确认无误后换成 `sk_live_…` 和正式 webhook

## 接口
| 接口 | 说明 |
|---|---|
| `POST /api/pay/checkout` `{sku, uid, return_url}` | 创建 Stripe Checkout，返回 `{id, url}` |
| `POST /api/pay/webhook` | Stripe 回调（验签） |
| `GET /api/pay/status?sid=cs_…` | 查询订单：pending / paid / failed / expired / refunded |

价格在 `server.js` 的 `PAY_ITEMS`（美分），要和游戏里显示的价格（`logic.js` 的 `SHOP_CFG`）保持一致。

## 注意
- **App（iOS / Android）不能用 Stripe 卖钻石等虚拟商品**，苹果和谷歌规定必须走应用内购买；代码里 App 环境已自动关闭 Stripe。
- 预览支付界面（不扣费）：在游戏地址后加 `?test=1`。
