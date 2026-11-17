// Native in-app purchases (App Store / Google Play) for the Capacitor app builds.
// Active only inside the phone app when cordova-plugin-purchase (window.CdvPurchase) is installed and the
// server reports receipt verification as configured; the web version keeps the normal store.
// Flow: create an order on our server → buy the matching consumable in the store → send the receipt to
// /api/iap/verify (the server checks it with Apple/Google and credits the coins) → finish the transaction.
(function () {
  const PEND = 'lv_iap_pending';
  const S2 = { ready: false, plat: null, products: {} };
  const pend = () => { try { return JSON.parse(localStorage.getItem(PEND) || '{}'); } catch (e) { return {}; } };
  const setPend = o => { try { localStorage.setItem(PEND, JSON.stringify(o)); } catch (e) {} };
  function say(t) { try { toast(t); } catch (e) {} }
  async function verify(tx) {
    const C = window.CdvPurchase; const sku = (tx.products && tx.products[0] && tx.products[0].id) || '';
    const p = pend(); let order = p[sku];
    if (!order) { const pk = (S2.pkgs || []).find(x => x.sku === sku); if (!pk) return; const o = await API.call('/api/orders', { pkg: pk.id }); if (o.err) { say(o.msg || o.err); return; } order = o.order.id; }
    const body = { order, productId: sku, platform: S2.plat };
    if (S2.plat === 'ios') body.receipt = tx.parentReceipt && tx.parentReceipt.nativeData && tx.parentReceipt.nativeData.appStoreReceipt;
    else body.token = tx.purchaseId || (tx.nativePurchase && tx.nativePurchase.purchaseToken);
    const r = await API.call('/api/iap/verify', body);
    if (r.err && r.err !== 'used') { say(r.msg || 'Purchase could not be verified yet — it will retry next time you open the app'); return; }
    const q = pend(); delete q[sku]; setPend(q);
    try { await tx.finish(); } catch (e) {}
    if (r.user) { try { setUser(r); setBal(); updUI(); sfx.big(); say('+' + (r.coins || 0).toLocaleString() + ' coins'); } catch (e) {} }
    try { closeOv('#store'); closeOv('#pay'); } catch (e) {}
  }
  async function init() {
    const C = window.CdvPurchase; if (!C || !C.store || typeof API === 'undefined' || API.mode !== 'server') return;
    const st = await API.call('/api/store'); if (!st || st.err) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent); S2.plat = ios ? 'ios' : 'android';
    if (!(st.iap && st.iap[S2.plat])) return; // server not configured: keep web store hidden behind 'coming soon'
    S2.pkgs = st.packages; const platform = ios ? C.Platform.APPLE_APPSTORE : C.Platform.GOOGLE_PLAY;
    C.store.register(st.packages.map(p => ({ id: p.sku, type: C.ProductType.CONSUMABLE, platform })));
    C.store.when().approved(tx => { verify(tx); }).productUpdated(p => { S2.products[p.id] = p; });
    C.store.error(e => { if (e && e.code !== C.ErrorCode.PAYMENT_CANCELLED) say('Store: ' + (e.message || e.code)); });
    await C.store.initialize([platform]); S2.ready = true;
  }
  window.LVIAP = {
    get native() { return S2.ready; },
    price(p) { const pr = S2.products[p.sku]; return pr && pr.pricing ? pr.pricing.price : null; },
    async buy(p) {
      const C = window.CdvPurchase; const prod = C && C.store.get(p.sku); const offer = prod && prod.getOffer();
      if (!offer) { say('This package is not available in the store yet'); return; }
      const o = await API.call('/api/orders', { pkg: p.id }); if (o.err) { say(o.msg || o.err); return; }
      const q = pend(); q[p.sku] = o.order.id; setPend(q);
      const err = await offer.order(); if (err && err.code !== C.ErrorCode.PAYMENT_CANCELLED) say(err.message || 'Purchase failed');
    },
  };
  document.addEventListener('deviceready', () => { init().catch(() => {}); }, false);
})();
