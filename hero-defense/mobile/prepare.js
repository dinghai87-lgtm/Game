// 把网页版游戏（上一层 hero-defense/ 里的文件）复制进 www/，打包进 App。
// App 里游戏会自动进入「App 版」：关闭测试模式，隐藏真钱购买和看广告（应用内支付接好前）。
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), dst = path.join(__dirname, 'www');
const files = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'privacy.html', 'terms.html', 'odds.html', 'legal.css', 'version.json'];
fs.rmSync(dst, { recursive: true, force: true }); fs.mkdirSync(dst, { recursive: true });
for (const f of files) { const s = path.join(src, f); if (fs.existsSync(s)) fs.copyFileSync(s, path.join(dst, f)); else console.warn('missing ' + f); }
// App 用单文件完整版（所有图片和音乐都在里面，离线可玩）；网页版 index.html 是分包版
const full = path.join(src, 'app.html'); if (fs.existsSync(full)) fs.copyFileSync(full, path.join(dst, 'index.html'));
console.log('www ready (' + fs.readdirSync(dst).length + ' files)');
