# 英雄塔防 Hero Defense — 上架步骤（2026-11-19 更新）

## 已经准备好的（不用再动）
- App 工程 `hero-defense/mobile/`：Capacitor 8，Android 目标 SDK 36（Google Play 2026-08-31 起的硬性要求），iOS 15+。GitHub Actions 每次更新自动编译 Android 测试包，已验证通过。
- 版本号自动设置：对外版本 `1.0.0`（在 `mobile/package.json` 改），内部编号跟随网页构建号自动递增，每次上传都比上次大。
- App 版内容合规：没有真钱购买、没有广告、没有兑换码、没有「添加到桌面」；分享链接指向 eleronzentechnology.com；隐私政策/协议从 App 内打开公司域名页面。
- 云存档、无尽排行榜、反馈、数据统计都走 Supabase（已在线），App 首发不需要另外部署服务器。`hero-server/` 只给网页版 Stripe 充值用，等 Stripe 开通再部署。
- 发布前自动测试：6 种语言 × 手机/平板尺寸，零报错、无漏翻、无违规入口（`/home/claude/tools/qa_app.py`）。
- 图标、启动图、截图（中/英 × iPhone 6.9 寸 / iPad 13 寸 / Android）、Google Play 置顶图、6 种语言商店文案（`LISTING.md`）。
- 隐私政策 / 用户协议 / 概率公示：https://eleronzentechnology.com/hero-defense/privacy.html 等，联系邮箱 info@eleronzentechnology.com；游戏内「设置 → 删除我的数据」可立即删除云端数据和匿名账号。

## 需要 Kev 本人做的（要身份验证、付费、签协议）

### A. 一次性准备
1. **D-U-N-S 编码**（公司名义上架必须）：https://developer.apple.com/enroll/duns-lookup/ 查 ELERONZEN TECHNOLOGY INC，没有就免费申请（约 5 个工作日）。
2. **Apple Developer Program（公司）**：$99/年，用 D-U-N-S 注册。
3. **Google Play Console（组织账号）**：$25 一次性，选「组织」。组织账号不需要「12 人测试 14 天」。
4. **确认包名** `com.wantai.herodefense` —— 上架后永远不能改。想改成 `com.eleronzen.herodefense` 要在第一次上传前告诉我。
5. **确认 info@eleronzentechnology.com 能收信**（商店审核和玩家删数据请求都会发到这里）。

### B. Google Play（Windows 电脑）
1. 安装 **Node.js 22 或更新**（https://nodejs.org ，选 LTS）和最新版 **Android Studio**（打开一次，让它装好 SDK 36）。
2. 双击 `hero-defense/mobile/build-android-release.bat`。第一次会让你设签名密码 —— **写下来，并备份 `release.keystore`**（丢了以后就不能更新 App）。
3. Play Console → 创建应用 → 先上传 `.aab` 到「内部测试」，自己装上玩一遍 → 再推正式版。
4. 商店信息：文案复制 `LISTING.md`；图标 `graphics/googleplay_icon_512.png`；置顶图 `graphics/googleplay_feature_1024x500_*.png`；截图 `screens/*_android_*.jpg`。
5. 内容分级问卷（IARC）：卡通/幻想暴力；无赌博、无真钱购买、无用户聊天、无位置分享。
6. 数据安全：按 `LISTING.md` 最后一节填。广告：否。目标年龄：13 岁以上。

### C. Apple App Store（需要 Mac）
1. Mac 需要 **Xcode 26 或更新**（App Store Connect 已不收旧版 Xcode 编的包）和 Node.js 22+。
2. 运行 `hero-defense/mobile/build-ios.sh` → Xcode 打开后：App → Signing & Capabilities 选你的 Team → Product → Archive → Distribute App → App Store Connect。
   - 没有 Mac：可以租云 Mac（如 MacinCloud），或者我写一个 GitHub Actions 自动上传流程，但需要你在 App Store Connect 生成 API Key 并自己粘贴到 GitHub Secrets。
3. App Store Connect → 新建 App → 填 `LISTING.md` 文案；截图用 `screens/*_iphone69_*.jpg` 和 `*_ipad13_*.jpg`。
4. App 隐私：按 `LISTING.md` 最后一节填（不追踪）。年龄分级问卷：偶尔/轻微的卡通或幻想暴力，其余都选「无」→ 9+。
5. 出口合规：Info.plist 已写好「不使用非豁免加密」，提交时选「否」。

## 之后再决定（不影响首发）
- **App 内付费**：要收费需接 Apple / Google 应用内支付（不能用 Stripe）。先在两个后台建商品，我再接代码。
- **兑换码**：App 版已隐藏（Apple 规定不能用自己的码解锁内容）。网页版照常可用。
- **第三方登录**：现在是匿名账号自动登录，不需要。如果以后加 Google/Facebook 登录，Apple 要求同时提供「通过 Apple 登录」。
- 隐私政策和用户协议正式上线前建议律师看一眼。
