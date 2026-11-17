# LuckyVault 上架苹果 / Google 步骤（需要你本人完成的部分）

我今晚已经把**代码和材料**都准备好了。剩下的步骤都需要你的账号、付款、签名或法律信息，我没法替你做，所以明天一起做。

## 一、我已经准备好的
- 应用内购买（IAP）：服务器端已经能向苹果 / Google 核验收据（`lib/iap.js`，`/api/iap/verify`），App 里用 cordova-plugin-purchase 购买金币。同一笔交易不能重复入账；没有配置时，App 里不会出现其他付款方式。
- 打包脚本：
  - 安卓：`mobile/build-android-release.bat https://你的域名`，会生成上传 Google Play 用的 .aab，第一次运行时会创建签名钥匙。
  - 苹果：`mobile/build-ios.sh https://你的域名`，必须在 Mac 上运行，会打开 Xcode。
- 包名：`com.wantai.luckyvault`（在 `mobile/capacitor.config.json`，可以改）。
- 商店素材：`store/` 里有图标、Google 置顶大图、中英文截图和中英文文案（见 `LISTING.md`）。
- 服务器生产配置模板：`deploy/.env.example`，里面加了 `PAY_SANDBOX=0` 和苹果 / Google 的密钥位置。
- App Store 审核要求的功能都已具备：删除账号、隐私政策、服务条款、18+ 提示、"金币无现金价值"声明、负责任娱乐工具。

## 二、需要你做的（按顺序）
1. **正式服务器 + 域名（HTTPS）**——App 必须连一个固定的 https 网址。
   - 可以用你们的 AWS：上传 LuckyVault 文件夹，进入 `deploy/`，按 `.env.example` 填好域名和密码，然后运行 `docker compose up -d --build`。
   - 需要的话我可以帮你部署，但需要你提供服务器登录方式。
2. **开发者账号**
   - Apple Developer Program：每年 99 美元。用公司名义注册需要 D-U-N-S 邓白氏编码。
   - Google Play Console：一次性 25 美元。**建议用公司（组织）账号注册**：个人账号要先做 14 天封闭测试，组织账号可以免掉（需要 D-U-N-S）。
3. **在两个商店后台建 5 个"消耗型"商品**，ID 必须完全一样：
   `lv_coins_p1` (4.99) · `lv_coins_p2` (9.99) · `lv_coins_p3` (19.99) · `lv_coins_p4` (49.99) · `lv_coins_p5` (99.99)
4. **把收据核验用的密钥填进服务器 `.env`**：
   - 苹果：App Store Connect → App 信息 → App 专用共享密钥 → 填 `APPLE_SHARED_SECRET`
   - Google：Google Cloud 建一个服务账号并下载 JSON 密钥，在 Play Console「用户和权限」里给它"查看财务数据 + 管理订单"权限 → 填 `GOOGLE_SERVICE_ACCOUNT`
5. **打包上传**：运行上面的打包脚本，把安卓 .aab 传到 Play Console，iOS 用 Xcode Archive 上传。
6. **填写审核问卷**：
   - 年龄分级：苹果选 17+ 并勾选「模拟赌博：频繁/强烈」；Google 内容分级里如实填写模拟赌博，目标人群 18+。
   - 隐私表格：两家都要填（收集用户名、可选邮箱、游戏记录，不出售数据）。
   - 苹果审核备注：提供一个测试账号和密码。
7. **第三方登录（可选）**：如果在 iOS App 里开启 Google 登录（`GOOGLE_CLIENT_ID`），苹果规定必须同时提供「通过 Apple 登录」（`APPLE_CLIENT_ID`）。只用用户名/邮箱登录则不需要。
8. **发行地区**：部分国家 / 地区限制模拟赌博类 App（例如韩国对社交娱乐场有特别规定），上架时按商店提示选择地区。

## 三、预计时间
- 有公司 Google 组织账号：打包上传后，审核一般几天。
- 个人 Google 账号：要先跑 14 天封闭测试（至少 12 名测试者），再申请正式发布，大约 3 周。
- 苹果审核：通常 1–3 天。社交娱乐场类 App 有时会被问到"是否有真钱"，回答：没有，金币不能兑现。
