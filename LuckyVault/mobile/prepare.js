// Copies the game client (../public) into www/ for the app and sets the server address.
// Usage: node prepare.js [server]   e.g.  node prepare.js http://192.168.1.20:8080
// Without a server the app runs in offline demo mode (local coins, no accounts).
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'public'), dst = path.join(__dirname, 'www');
const server = (process.argv[2] || process.env.LV_SERVER || '').trim();
fs.rmSync(dst, { recursive: true, force: true });
(function copy(a, b) { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), d = path.join(b, f); if (fs.statSync(s).isDirectory()) copy(s, d); else fs.copyFileSync(s, d); } })(src, dst);
fs.rmSync(path.join(dst, 'admin.html'), { force: true }); // the back office stays on the server, not in the app
fs.writeFileSync(path.join(dst, 'config.js'), 'window.LV_CONFIG = { server: ' + JSON.stringify(server) + ' };\n');
console.log('www ready. Server: ' + (server || '(none — offline demo mode)'));
