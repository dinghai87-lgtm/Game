// Offline cache for the game client (API calls always go to the network).
const V = 'lv-v209';
const FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './js/slots-engine.js', './js/catalog.js', './js/tables-engine.js', './js/tables-ui.js', './js/social.js', './js/fx.js', './js/feat-ui.js', './js/hov-ui.js', './js/roadmap.js', './js/vegas.js', './js/rules.js', './js/onboard.js', './js/friends-ui.js', './js/rg.js', './js/support-ui.js', './js/replay.js', './js/fx2.js', './js/i18n.js', './js/iap.js', './assets/fonts/Anton.woff2', './assets/fonts/Cinzel.woff2', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/') || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
// Push notifications (free coins ready, prizes, events)
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Lucky Vault', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Lucky Vault', { body: d.body || '', icon: './icons/icon-192.png', badge: './icons/icon-192.png', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { for (const c of cs) if ('focus' in c) return c.focus(); return self.clients.openWindow(url); }));
});
