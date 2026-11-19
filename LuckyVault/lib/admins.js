// © 2026 万泰游戏开发 Wantai Game Development. All rights reserved.
// Back-office accounts: several admins with roles, optional two-factor login (TOTP, e.g. Google Authenticator), audit of every change.
// The owner account (ADMIN_USER / ADMIN_PASS) always exists and has every permission.
'use strict';
const crypto = require('crypto');
const ROLES = {
  owner: { name: '所有者 Owner', all: true },
  admin: { name: '管理员 Admin', all: true, deny: ['admins'] },
  ops: { name: '运营 Operations', deny: ['admins', 'settings'] },
  support: { name: '客服 Support', allow: ['GET players', 'GET player', 'GET rounds', 'GET tx', 'GET orders', 'tickets', 'GET overview', 'GET me'] },
  viewer: { name: '只读 Viewer', getOnly: true, deny: ['admins'] }
};
// what a request touches: 'GET players', 'POST settings', 'tickets', 'admins', ...
function area(method, p) { const seg = p.replace(/^\/api\/admin\//, '').split('/'); let a = seg[0];
  if (a === 'players' && seg[1]) a = 'player'; if (a === 'tickets' || a === 'admins') return a; return method + ' ' + a; }
function allowed(role, method, p) {
  const R = ROLES[role]; if (!R) return false; const a = area(method, p), base = a.replace(/^(GET|POST) /, '');
  if (base === 'me') return true;   // everyone manages their own login (2FA)
  if (R.deny && (R.deny.includes(base) || R.deny.includes(a))) return false;
  if (R.all) return true; if (R.getOnly) return method === 'GET';
  if (R.allow) return R.allow.includes(a) || R.allow.includes(base);
  return true;
}
// ---- TOTP (RFC 6238, 30 s, 6 digits, SHA-1) ----
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32enc(buf) { let bits = 0, v = 0, out = ''; for (const x of buf) { v = (v << 8) | x; bits += 8; while (bits >= 5) { out += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } } if (bits) out += B32[(v << (5 - bits)) & 31]; return out; }
function b32dec(s) { let bits = 0, v = 0; const out = []; for (const c of String(s).replace(/=+$/, '').toUpperCase()) { const i = B32.indexOf(c); if (i < 0) continue; v = (v << 5) | i; bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); }
function hotp(secret, counter) { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(counter)); const h = crypto.createHmac('sha1', b32dec(secret)).update(b).digest(); const o = h[19] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0'); }
function totpOk(secret, code, t) { const c = String(code || '').replace(/\s/g, ''); if (!/^\d{6}$/.test(c)) return false; const n = Math.floor((t || Date.now()) / 30000); for (const d of [-1, 0, 1]) if (hotp(secret, n + d) === c) return true; return false; }

function install({ ADMIN, repo, A, now, ownerUser, ownerPass, tokens }) {
  const load = async () => (await repo().kvGet('admins', [])) || [];
  const save = list => repo().kvSet('admins', list);
  const hash = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
  // login: returns { token, user, role, need2fa }
  async function login(user, pass, code) {
    user = String(user || '').trim(); let who = null;
    if (A.safeEq(user, ownerUser) && A.safeEq(pass || '', ownerPass)) { const o = (await repo().kvGet('admin_owner', {})) || {}; who = { user: ownerUser, role: 'owner', totp: o.totp || null }; }
    else { const a = (await load()).find(x => x.user.toLowerCase() === user.toLowerCase() && !x.disabled); if (a && A.safeEq(a.hash, hash(pass || '', a.salt))) who = a; }
    if (!who) return { err: 'login', msg: 'Wrong credentials' };
    if (who.totp && !totpOk(who.totp, code)) return { err: '2fa', msg: code ? '验证码错误 Wrong 2FA code' : '请输入两步验证码 Enter your 2FA code', need2fa: true };
    const t = A.token(); tokens.set(t, { exp: now() + 12 * 3600e3, user: who.user, role: who.role }); return { token: t, user: who.user, role: who.role };
  }
  ADMIN['GET /api/admin/me'] = async ({ admin }) => { let has2fa = false; if (admin.role === 'owner') has2fa = !!(((await repo().kvGet('admin_owner', {})) || {}).totp); else { const a = (await load()).find(x => x.user === admin.user); has2fa = !!(a && a.totp); }
    return [200, { user: admin.user, role: admin.role, roleName: ROLES[admin.role].name, has2fa, roles: Object.fromEntries(Object.entries(ROLES).filter(([k]) => k !== 'owner').map(([k, v]) => [k, v.name])) }]; };
  // two-factor setup for the logged-in admin: step 1 get a secret, step 2 confirm a code from the app
  ADMIN['POST /api/admin/me/2fa'] = async ({ admin, b }) => {
    if (b.off) {
      // switching 2FA off needs a current code from the app: a stolen admin token alone cannot remove the second factor
      const cur = admin.role === 'owner' ? (((await repo().kvGet('admin_owner', {})) || {}).totp) : ((await load()).find(x => x.user === admin.user) || {}).totp;
      if (cur && !totpOk(cur, b.code)) return [400, { err: 'code', msg: '请输入当前的两步验证码 · Enter your current 2FA code to turn it off', need2fa: true }];
      if (admin.role === 'owner') { await repo().kvSet('admin_owner', {}); } else { const L = await load(); const a = L.find(x => x.user === admin.user); if (a) { delete a.totp; await save(L); } } await repo().audit('admin_2fa_off', admin.user); return [200, { ok: true, has2fa: false }]; }
    if (!b.secret) { const secret = b32enc(crypto.randomBytes(20)); return [200, { secret, uri: 'otpauth://totp/LuckyVault:' + encodeURIComponent(admin.user) + '?secret=' + secret + '&issuer=LuckyVault' }]; }
    if (!totpOk(b.secret, b.code)) return [400, { err: 'code', msg: '验证码不对，请再试一次 Code does not match' }];
    if (admin.role === 'owner') await repo().kvSet('admin_owner', { totp: b.secret }); else { const L = await load(); const a = L.find(x => x.user === admin.user); if (a) { a.totp = b.secret; await save(L); } }
    await repo().audit('admin_2fa_on', admin.user); return [200, { ok: true, has2fa: true }];
  };
  ADMIN['GET /api/admin/admins'] = async () => [200, { admins: (await load()).map(a => ({ user: a.user, role: a.role, roleName: (ROLES[a.role] || {}).name, has2fa: !!a.totp, disabled: !!a.disabled, created: a.created })), owner: ownerUser, roles: Object.fromEntries(Object.entries(ROLES).filter(([k]) => k !== 'owner').map(([k, v]) => [k, v.name])) }];
  ADMIN['POST /api/admin/admins'] = async ({ admin, b }) => {
    const L = await load(); const user = String(b.user || '').trim();
    if (!/^[A-Za-z0-9_.@-]{3,40}$/.test(user) || user.toLowerCase() === String(ownerUser).toLowerCase()) return [400, { err: 'user', msg: '用户名 3-40 位字母数字 · Username: 3-40 letters/digits' }];
    let a = L.find(x => x.user.toLowerCase() === user.toLowerCase());
    if (b.remove) { if (!a) return [404, { err: 'nf' }]; L.splice(L.indexOf(a), 1); await save(L); await repo().audit('admin_removed', admin.user + ' removed ' + user); return [200, { ok: true }]; }
    if (b.role && !ROLES[b.role] || b.role === 'owner') return [400, { err: 'role', msg: 'Bad role' }];
    if (!a) { if (!b.pass || String(b.pass).length < 10) return [400, { err: 'pass', msg: '密码至少 10 位 · Password needs 10+ characters' }]; a = { user, role: b.role || 'viewer', created: now() }; L.push(a); }
    if (b.pass) { if (String(b.pass).length < 10) return [400, { err: 'pass', msg: '密码至少 10 位 · Password needs 10+ characters' }]; a.salt = crypto.randomBytes(16).toString('hex'); a.hash = hash(b.pass, a.salt); }
    if (b.role) a.role = b.role; if (b.disabled !== undefined) a.disabled = !!b.disabled; if (b.reset2fa) delete a.totp;
    await save(L); for (const [t, s] of tokens) if (s.user === user && (b.disabled || b.pass || b.role)) tokens.delete(t);   // changes log the account out
    await repo().audit('admin_saved', admin.user + ' → ' + user + ' (' + a.role + (a.disabled ? ', disabled' : '') + ')'); return [200, { ok: true }];
  };
  return { login, allowed, ROLES };
}
module.exports = { install, ROLES, allowed, totpOk, hotp, b32enc };
