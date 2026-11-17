// Puts the Lucky Vault icon into the Android project (all launcher densities).
const fs = require('fs'), path = require('path');
const res = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const icon = path.join(__dirname, 'www', 'icons', 'icon-512.png');
if (!fs.existsSync(res) || !fs.existsSync(icon)) process.exit(0);
for (const d of fs.readdirSync(res).filter(d => d.startsWith('mipmap-'))) {
  for (const f of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
    const t = path.join(res, d, f); if (fs.existsSync(t)) fs.copyFileSync(icon, t);
  }
}
console.log('App icon set.');
