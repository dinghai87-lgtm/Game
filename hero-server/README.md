# Hero Defense 服务器（最小版）

用途：账号、存档云同步、元宝余额（以服务器为准）、订单校验入口、每日挑战排行榜。

## 运行
```
node server.js                 # 默认端口 8787
ALLOW_TEST_ORDERS=1 node server.js   # 本地测试：接受 provider="test" 的模拟订单
ADMIN_KEY=你的密码 node server.js      # 开启运营后台 /admin
```

## 接到游戏里
在 hero.html 的 `<script>` 之前加一行：
```
<script>window.HERO_SERVER='https://你的域名';</script>
```
游戏会自动：用设备 ID 登录 → 拉取云存档 → 每次存档同步到服务器，元宝数以服务器返回为准。

## 接口
| 接口 | 说明 |
|---|---|
| POST /api/login `{deviceId}` | 返回 token |
| GET/POST /api/save | 读取 / 保存存档（服务器覆盖 yb 字段） |
| POST /api/spend `{amount}` | 扣元宝（服务器校验余额） |
| POST /api/order/verify `{sku, provider, receipt}` | 校验支付并加元宝，订单号去重 |
| GET/POST /api/board | 每日挑战排行榜 |
| GET /api/me · POST /api/invite `{code}` | 我的邀请码；输入好友邀请码双方各得 100 元宝 |
| POST /api/events | 游戏埋点（开局、结束、广告、抽卡、充值尝试、新手教学） |
| GET /admin | 运营后台网页：日活、关卡通过率等（需要 ADMIN_KEY） |

## 上线前必须做
1. `verifyOrder()` 里接入真实校验：Stripe（webhook 或查询 PaymentIntent）、Apple App Store Server API、Google Play Developer API。
2. 把 JSON 文件换成正式数据库（PostgreSQL / MySQL / Redis 等），并做好备份。
3. 开 HTTPS，加限流和日志。
4. 现在的“设备 ID 登录”换机会丢号，正式上线建议加上 Apple / Google / 邮箱登录做账号绑定。
