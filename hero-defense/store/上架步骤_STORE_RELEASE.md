# 英雄塔防 Hero Defense — 上架步骤（需要 Kev 亲自做的部分）

已经准备好的：App 工程（`hero-defense/mobile/`）、图标、启动图、截图（中/英 × iPhone/iPad/Android）、Google Play 置顶图、6 种语言的商店文案（`LISTING.md`）、隐私政策 / 用户协议（已填公司信息）、游戏内「删除我的数据」、Android 测试包自动编译（GitHub Actions）。

以下几步必须由你本人操作（要身份验证、付费、签协议，我不能代做）：

## A. 一次性准备
1. **D-U-N-S 邓白氏编码**（Apple 用公司名义上架必须）：https://developer.apple.com/enroll/duns-lookup/ 查 ELERONZEN TECHNOLOGY INC，没有就免费申请，约 5 个工作日。
2. **Apple Developer Program（公司）**：$99/年，https://developer.apple.com/programs/enroll/ ，用 D-U-N-S 注册，需要公司网站（eleronzentechnology.com 要能打开）。
3. **Google Play Console（组织账号）**：$25 一次性，https://play.google.com/console/signup ，选「组织」，同样要 D-U-N-S。注意：新个人账号上架前要 12 人测试 14 天，组织账号不用。
4. **确认包名**：`com.wantai.herodefense` —— 上架后永远不能改。想改成 `com.eleronzen.herodefense` 的话现在告诉我。

## B. Google Play
1. 在 Windows 上装 Node.js 和 Android Studio（打开一次）。
2. 双击 `hero-defense/mobile/build-android-release.bat`，第一次会让你设置签名密码 —— **写下来并备份 `release.keystore`**。
3. Play Console → 创建应用 → 上传 `.aab` 到「内部测试」先自己装一下，再推到正式版。
4. 商店信息：复制 `LISTING.md` 的文案；图标 `graphics/googleplay_icon_512.png`；置顶图 `graphics/googleplay_feature_1024x500_*.png`；截图 `screens/*_android_*.jpg`。
5. 内容分级问卷（IARC）：暴力 = 卡通/幻想；无赌博、无内购、无用户聊天、无位置分享。
6. 数据安全：按 `LISTING.md` 最后一节填写。广告：否。目标年龄：13 岁以上（或「全年龄但不面向儿童」）。

## C. Apple App Store
1. 需要一台 Mac（装 Xcode）。运行 `hero-defense/mobile/build-ios.sh`，Xcode 打开后选 Team → Product → Archive → 上传。
   - 没有 Mac：可以用云 Mac（如 MacinCloud，约 $30/月），或者明天我写一个 GitHub Actions 的 macOS 自动上传流程，但那需要你在 App Store Connect 生成 API Key 自己粘贴进 GitHub Secrets。
2. App Store Connect → 新建 App → 填 `LISTING.md` 文案，截图用 `screens/*_iphone69_*.jpg` 和 `*_ipad13_*.jpg`，图标自动从包里读。
3. App 隐私：按 `LISTING.md` 最后一节填（不追踪）。年龄分级：问卷答「偶尔/轻微 卡通或幻想暴力」→ 9+。
4. 出口合规：已在 Info.plist 写好「不使用非豁免加密」。

## D. 需要你决定
- **App 版要不要收费内容？** 现在 App 版隐藏了所有真钱购买和广告（不然 Apple/Google 会因为用了 Stripe 拒审）。如果要内购，需要接 Apple/Google 的应用内支付，先在后台建商品，我再接代码。
- **Google / Facebook 登录**：Google 那边差你勾选同意条款 + 粘贴 Client Secret；Facebook 要你登录 developers.facebook.com 建应用。注意：如果 App 里有 Google/Facebook 登录，Apple 要求同时提供「通过 Apple 登录」。
- 隐私政策和用户协议已按实际情况填好，正式上线前建议律师看一眼。
