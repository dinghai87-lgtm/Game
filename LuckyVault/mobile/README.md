# Lucky Vault — phone app

## Android (APK you can install directly)
Needs: Node.js, and Android Studio (open it once so it installs the SDK).
1. Start the game server on your computer (start.bat) and note the "Phone:" address it prints, e.g. http://192.168.1.20:8080
2. In this folder run:  build-android.bat http://192.168.1.20:8080
   (leave the address out for an offline demo app with local coins)
3. Copy LuckyVault.apk to the phone, open it, allow "install unknown apps".
The phone must be on the same Wi-Fi as the computer, and Windows Firewall must allow Node.js on private networks.

## iPhone
- Quick: on the same Wi-Fi open the "Phone:" address in Safari → Share → Add to Home Screen. It opens full screen like an app.
- Native iOS app: needs a Mac with Xcode and an Apple Developer account:  npm install && node prepare.js <server> && npx cap add ios && npx cap open ios

## Store release
- Change appId in capacitor.config.json to your own (e.g. com.yourcompany.luckyvault).
- Point the app at an HTTPS server (deploy server.js, then build with https://your-domain).
- Coins must be sold with Apple / Google in-app purchase; verify receipts in POST /api/iap/verify.
- Rating 17+ / Mature, and state that coins have no cash value and cannot be redeemed.
