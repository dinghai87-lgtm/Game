'use strict';
// In-app purchase receipt verification for the store builds (Apple App Store / Google Play).
// Configure with environment variables (nothing here works until they are set):
//   APPLE_SHARED_SECRET   App Store Connect → App → App Information → App-Specific Shared Secret
//   APPLE_BUNDLE_ID       e.g. com.wantai.luckyvault (must match the app)
//   GOOGLE_PACKAGE_NAME   e.g. com.wantai.luckyvault
//   GOOGLE_SERVICE_ACCOUNT  path to (or the JSON text of) a Google Cloud service-account key that has
//                           "View financial data" + "Manage orders" access in Play Console → Users and permissions
// Product IDs: each coin package uses sku = package.sku || 'lv_coins_' + package.id  (create the same IDs as
// consumable products in App Store Connect and Play Console).
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

function req(url, opt, body) {
  return new Promise((res, rej) => {
    const r = https.request(url, Object.assign({ timeout: 15000 }, opt), resp => { let s = ''; resp.on('data', d => s += d); resp.on('end', () => { let j = null; try { j = JSON.parse(s); } catch (e) {} res({ status: resp.statusCode, json: j, text: s }); }); });
    r.on('timeout', () => r.destroy(new Error('timeout'))); r.on('error', rej); if (body) r.write(body); r.end();
  });
}

function create(env, http) {
  const call = http || req;
  const cfg = {
    appleSecret: env.APPLE_SHARED_SECRET || '', appleBundle: env.APPLE_BUNDLE_ID || '',
    googlePkg: env.GOOGLE_PACKAGE_NAME || '', googleSA: null,
  };
  if (env.GOOGLE_SERVICE_ACCOUNT) { try { const t = env.GOOGLE_SERVICE_ACCOUNT.trim(); cfg.googleSA = JSON.parse(t.startsWith('{') ? t : fs.readFileSync(t, 'utf8')); } catch (e) { cfg.googleSA = null; } }
  const enabled = { ios: !!(cfg.appleSecret && cfg.appleBundle), android: !!(cfg.googlePkg && cfg.googleSA && cfg.googleSA.private_key) };

  // ---- Apple: verifyReceipt (production first, then sandbox when Apple answers 21007) ----
  async function apple(receipt, productId) {
    if (!enabled.ios) return { err: 'not_configured' };
    const body = JSON.stringify({ 'receipt-data': String(receipt || ''), password: cfg.appleSecret, 'exclude-old-transactions': true });
    let r = await call('https://buy.itunes.apple.com/verifyReceipt', { method: 'POST', headers: { 'Content-Type': 'application/json' } }, body);
    let sandbox = false;
    if (r.json && r.json.status === 21007) { sandbox = true; r = await call('https://sandbox.itunes.apple.com/verifyReceipt', { method: 'POST', headers: { 'Content-Type': 'application/json' } }, body); }
    const j = r.json; if (!j || j.status !== 0) return { err: 'invalid', msg: 'Apple rejected the receipt (status ' + (j ? j.status : r.status) + ')' };
    if (j.receipt && j.receipt.bundle_id !== cfg.appleBundle) return { err: 'invalid', msg: 'Receipt is for another app' };
    const items = [].concat((j.receipt && j.receipt.in_app) || [], j.latest_receipt_info || []).filter(x => x.product_id === productId && !x.cancellation_date);
    if (!items.length) return { err: 'invalid', msg: 'Product not found in receipt' };
    items.sort((a, b) => (+b.purchase_date_ms || 0) - (+a.purchase_date_ms || 0));
    return { ok: true, txId: 'apple:' + items[0].transaction_id, sandbox };
  }

  // ---- Google: Android Publisher API purchases.products.get + consume ----
  let tok = null;
  async function gToken() {
    if (tok && tok.exp > Date.now() + 60000) return tok.v;
    const sa = cfg.googleSA, nowS = Math.floor(Date.now() / 1000);
    const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
    const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: nowS, exp: nowS + 3600 });
    const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
    const r = await call('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + unsigned + '.' + sig);
    if (!r.json || !r.json.access_token) throw new Error('Google auth failed: ' + r.text.slice(0, 200));
    tok = { v: r.json.access_token, exp: Date.now() + (r.json.expires_in || 3600) * 1000 }; return tok.v;
  }
  async function google(token, productId) {
    if (!enabled.android) return { err: 'not_configured' };
    const t = await gToken(); const base = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' + encodeURIComponent(cfg.googlePkg) + '/purchases/products/' + encodeURIComponent(productId) + '/tokens/' + encodeURIComponent(String(token || ''));
    const r = await call(base, { method: 'GET', headers: { Authorization: 'Bearer ' + t } });
    const j = r.json; if (r.status !== 200 || !j) return { err: 'invalid', msg: 'Google rejected the purchase (' + r.status + ')' };
    if (j.purchaseState !== 0) return { err: 'invalid', msg: 'Purchase is not completed (state ' + j.purchaseState + ')' };
    if (j.consumptionState === 1) return { err: 'used', msg: 'This purchase was already used' };
    try { await call(base + ':consume', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Length': 0 } }); } catch (e) {}
    return { ok: true, txId: 'google:' + (j.orderId || token), sandbox: j.purchaseType === 0 };
  }

  return { enabled, apple, google, skuOf: p => p.sku || ('lv_coins_' + p.id) };
}
module.exports = { create };
