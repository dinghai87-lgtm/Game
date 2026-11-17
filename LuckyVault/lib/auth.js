'use strict';
const crypto = require('crypto');
const { b64u, unb64u } = require('./notify.js');

const hashPass = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
const newSalt = () => crypto.randomBytes(12).toString('hex');
const token = () => crypto.randomBytes(24).toString('hex');
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const code6 = () => String(crypto.randomInt(0, 1e6)).padStart(6, '0');
const codeHash = (k, c) => crypto.createHash('sha256').update(k + ':' + c).digest('hex');
const emailOk = e => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(String(e || ''));
const phoneNorm = p => { const s = String(p || '').replace(/[\s()-]/g, ''); return /^\+[1-9]\d{6,14}$/.test(s) ? s : null; };

// Issue a one-time code (10 minutes, 5 tries). Returns the code so the caller can send it.
async function issueCode(repo, k, data) { const c = code6(); await repo.codeSet(k, codeHash(k, c), Date.now() + 10 * 60e3, data); return c; }
async function checkCode(repo, k, c) {
  const r = await repo.codeGet(k); if (!r) return { ok: false, msg: 'Code expired — request a new one' };
  if (r.exp < Date.now()) { await repo.codeDel(k); return { ok: false, msg: 'Code expired — request a new one' }; }
  if (r.tries >= 5) { await repo.codeDel(k); return { ok: false, msg: 'Too many tries — request a new code' }; }
  if (!safeEq(r.hash, codeHash(k, String(c || '').trim()))) { await repo.codeTry(k); return { ok: false, msg: 'Wrong code' }; }
  await repo.codeDel(k); return { ok: true, data: r.data };
}

// ---- Sign in with Apple / Google: verify the ID token (RS256 JWT) against the provider's public keys ----
const PROVIDERS = {
  google: { jwks: 'https://www.googleapis.com/oauth2/v3/certs', iss: ['https://accounts.google.com', 'accounts.google.com'], aud: () => (process.env.GOOGLE_CLIENT_ID || '').split(',').map(s => s.trim()).filter(Boolean) },
  apple: { jwks: 'https://appleid.apple.com/auth/keys', iss: ['https://appleid.apple.com'], aud: () => (process.env.APPLE_CLIENT_ID || '').split(',').map(s => s.trim()).filter(Boolean) }
};
const jwksCache = {};
async function getKeys(url, fetchJson) {
  const c = jwksCache[url]; if (c && c.exp > Date.now()) return c.keys;
  const j = await (fetchJson ? fetchJson(url) : fetch(url).then(r => r.json()));
  jwksCache[url] = { keys: j.keys || [], exp: Date.now() + 3600e3 }; return jwksCache[url].keys;
}
async function verifyIdToken(provider, idToken, opts) {
  opts = opts || {};
  const P = PROVIDERS[provider]; if (!P) throw new Error('Unknown provider');
  const aud = opts.aud || P.aud(); if (!aud.length) throw new Error(provider + ' sign-in is not configured on this server');
  const parts = String(idToken || '').split('.'); if (parts.length !== 3) throw new Error('Malformed token');
  const head = JSON.parse(unb64u(parts[0]).toString()), body = JSON.parse(unb64u(parts[1]).toString());
  if (head.alg !== 'RS256') throw new Error('Unexpected algorithm');
  const keys = await getKeys(opts.jwks || P.jwks, opts.fetchJson); const jwk = keys.find(k => k.kid === head.kid);
  if (!jwk) throw new Error('Signing key not found');
  const ok = crypto.verify('sha256', Buffer.from(parts[0] + '.' + parts[1]), crypto.createPublicKey({ key: jwk, format: 'jwk' }), unb64u(parts[2]));
  if (!ok) throw new Error('Bad signature');
  const now = Math.floor(Date.now() / 1000);
  if (!(opts.iss || P.iss).includes(body.iss)) throw new Error('Wrong issuer');
  const auds = Array.isArray(body.aud) ? body.aud : [body.aud]; if (!auds.some(a => aud.includes(a))) throw new Error('Token is for another app');
  if (body.exp < now - 60) throw new Error('Token expired');
  if (!body.sub) throw new Error('No subject');
  return { sub: String(body.sub), email: body.email || null, emailVerified: body.email_verified === true || body.email_verified === 'true', name: body.name || null };
}
module.exports = { hashPass, newSalt, token, safeEq, issueCode, checkCode, emailOk, phoneNorm, verifyIdToken, PROVIDERS, b64u };
