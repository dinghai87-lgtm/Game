'use strict';
// Email, SMS and Web Push. No external packages: providers are called over HTTPS with fetch,
// Web Push payloads are encrypted with Node's crypto (RFC 8291 aes128gcm + RFC 8292 VAPID).
const crypto = require('crypto');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function mailConfigured() { return !!(process.env.MAIL_API_KEY && process.env.MAIL_FROM); }
function smsConfigured() { return !!(process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_FROM); }

async function sendEmail(repo, to, subject, text) {
  const provider = (process.env.MAIL_PROVIDER || 'resend').toLowerCase();
  let status = 'dev (not sent: MAIL_API_KEY not set)';
  if (mailConfigured()) {
    try {
      let r;
      if (provider === 'sendgrid') r = await fetch('https://api.sendgrid.com/v3/mail/send', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.MAIL_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: process.env.MAIL_FROM }, subject, content: [{ type: 'text/plain', value: text }] }) });
      else r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.MAIL_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text }) });
      status = r.ok ? 'sent' : 'failed ' + r.status;
    } catch (e) { status = 'failed ' + e.message; }
  } else console.log('[email to ' + to + '] ' + subject + ' — ' + text);
  await repo.outbox({ channel: 'email', dest: to, subject, body: text, status });
  return status;
}
async function sendSms(repo, to, text) {
  let status = 'dev (not sent: Twilio not configured)';
  if (smsConfigured()) {
    try {
      const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_SID + '/Messages.json', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(process.env.TWILIO_SID + ':' + process.env.TWILIO_TOKEN).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM, Body: text }).toString() });
      status = r.ok ? 'sent' : 'failed ' + r.status;
    } catch (e) { status = 'failed ' + e.message; }
  } else console.log('[sms to ' + to + '] ' + text);
  await repo.outbox({ channel: 'sms', dest: to, subject: '', body: text, status });
  return status;
}

// ---------------- Web Push ----------------
async function vapidKeys(repo) {
  let k = await repo.kvGet('vapid', null);
  if (!k) {
    const ec = crypto.createECDH('prime256v1'); ec.generateKeys();
    k = { pub: b64u(ec.getPublicKey()), priv: b64u(ec.getPrivateKey()) };
    await repo.kvSet('vapid', k);
  }
  return k;
}
function vapidJwt(endpoint, k) {
  const pub = unb64u(k.pub);
  const jwk = { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)), d: k.priv };
  const key = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: process.env.VAPID_SUBJECT || 'mailto:support@luckyvault.app' }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return head + '.' + body + '.' + b64u(sig);
}
function encryptPayload(sub, payload) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const ec = crypto.createECDH('prime256v1'); ec.generateKeys(); const asPub = ec.getPublicKey();
  const secret = ec.computeSecret(uaPub);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', secret, auth, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32));
  const salt = crypto.randomBytes(16);
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const enc = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, enc]);
}
// For tests: decrypt with the subscriber's private key.
function decryptPayload(body, uaPriv, uaPub, auth) {
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), enc = body.subarray(21 + idlen);
  const ec = crypto.createECDH('prime256v1'); ec.setPrivateKey(uaPriv);
  const secret = ec.computeSecret(asPub);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', secret, auth, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32));
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(enc.subarray(enc.length - 16));
  const out = Buffer.concat([d.update(enc.subarray(0, enc.length - 16)), d.final()]);
  return out.subarray(0, out.lastIndexOf(2)).toString();
}
async function sendPush(repo, sub, data) {
  const k = await vapidKeys(repo);
  const body = encryptPayload(sub, JSON.stringify(data));
  try {
    const r = await fetch(sub.endpoint, { method: 'POST', headers: { TTL: '86400', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', Authorization: 'vapid t=' + vapidJwt(sub.endpoint, k) + ', k=' + k.pub }, body });
    if (r.status === 404 || r.status === 410) await repo.pushDel(sub.endpoint);
    return r.status;
  } catch (e) { return 0; }
}
// In-app notification + push to every device of the player.
async function notifyUser(repo, uid, title, body, url) {
  await repo.noteAdd(uid, title, body);
  const subs = await repo.pushOf(uid); let sent = 0;
  for (const s of subs) { const st = await sendPush(repo, s, { title, body, url: url || '/' }); if (st >= 200 && st < 300) sent++; }
  return sent;
}
module.exports = { sendEmail, sendSms, mailConfigured, smsConfigured, vapidKeys, vapidJwt, encryptPayload, decryptPayload, sendPush, notifyUser, b64u, unb64u };
