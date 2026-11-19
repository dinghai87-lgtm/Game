# 英雄塔防 Hero Defense — App 打包

这一层把网页版游戏（上一层的 index.html 等）包成 iOS / Android 原生 App（Capacitor 7）。

- 包名 / Bundle ID：`com.wantai.herodefense`（上架后不能改）
- App 里自动是「App 版」：无测试模式、不显示真钱购买和看广告（接入应用内支付前）。
- 固定横屏、全屏、不显示状态栏（`patch-native.js`）。
- 图标和启动图在 `assets/`，由 `npm run assets` 生成各尺寸。

| 用途 | 在哪台电脑 | 命令 |
|---|---|---|
| 安卓测试包 APK | Windows | 双击 `build-android.bat` |
| Google Play 上架包 AAB | Windows | 双击 `build-android-release.bat` |
| App Store 上架 | Mac + Xcode | `./build-ios.sh` |

游戏更新后：先在网页版部署，再重新运行对应脚本即可（`prepare.js` 每次重新复制最新文件）。
