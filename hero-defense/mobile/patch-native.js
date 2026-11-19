// 在 npx cap add / sync 之后运行：App 固定横屏、全屏（不显示状态栏）。
const fs = require('fs'), path = require('path');
const man = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(man)) {
  let s = fs.readFileSync(man, 'utf8');
  if (!/screenOrientation/.test(s)) s = s.replace(/<activity\b/, '<activity android:screenOrientation="sensorLandscape"');
  fs.writeFileSync(man, s);
  const st = path.join(__dirname, 'android/app/src/main/res/values/styles.xml');
  if (fs.existsSync(st)) { let x = fs.readFileSync(st, 'utf8');
    x = x.replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, '$1\n        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>');
    fs.writeFileSync(st, x); }
  console.log('Android: landscape + fullscreen');
}
const plist = path.join(__dirname, 'ios/App/App/Info.plist');
if (fs.existsSync(plist)) {
  let p = fs.readFileSync(plist, 'utf8');
  const land = '<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>';
  p = p.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*)<array>[\s\S]*?<\/array>/, '$1' + land);
  p = p.replace(/(<key>UISupportedInterfaceOrientations~ipad<\/key>\s*)<array>[\s\S]*?<\/array>/, '$1' + land);
  if (!/UIStatusBarHidden/.test(p)) p = p.replace(/<dict>/, '<dict>\n\t<key>UIStatusBarHidden</key>\n\t<true/>\n\t<key>UIViewControllerBasedStatusBarAppearance</key>\n\t<false/>\n\t<key>UIRequiresFullScreen</key>\n\t<true/>\n\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>');
  fs.writeFileSync(plist, p);
  console.log('iOS: landscape + fullscreen');
}
// 版本号：对外版本 = package.json 的 version（如 1.0.0）；内部编号 = 网页版构建号/10（只增不减，商店要求每次上传都更大）
try {
  const ver = require('./package.json').version;
  let build = 1; try { build = Math.floor(+JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'version.json'), 'utf8')).v / 10) || 1 } catch (e) {}
  const gr = path.join(__dirname, 'android/app/build.gradle');
  if (fs.existsSync(gr)) { let g = fs.readFileSync(gr, 'utf8');
    g = g.replace(/versionCode\s+\d+/, 'versionCode ' + build).replace(/versionName\s+"[^"]*"/, 'versionName "' + ver + '"');
    fs.writeFileSync(gr, g); console.log('Android: version ' + ver + ' (' + build + ')') }
  const pbx = path.join(__dirname, 'ios/App/App.xcodeproj/project.pbxproj');
  if (fs.existsSync(pbx)) { let x = fs.readFileSync(pbx, 'utf8');
    x = x.replace(/MARKETING_VERSION = [^;]+;/g, 'MARKETING_VERSION = ' + ver + ';').replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, 'CURRENT_PROJECT_VERSION = ' + build + ';');
    fs.writeFileSync(pbx, x); console.log('iOS: version ' + ver + ' (' + build + ')') }
} catch (e) { console.warn('version patch skipped: ' + e.message) }
