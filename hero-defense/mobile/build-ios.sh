#!/bin/bash
# 英雄守关 Hero Defense — iOS 上架包。需要一台装了 Xcode、登录了 Apple 开发者账号的 Mac。
set -e
cd "$(dirname "$0")"
npm install
node prepare.js
[ -d ios ] || npx cap add ios
npx cap sync ios
node patch-native.js
npm run assets || true
echo
echo "Xcode 会打开：选 App target → Signing & Capabilities → 选你的 Team；"
echo "然后 Product → Archive → Distribute App → App Store Connect 上传。"
npx cap open ios
