/* VANTAX POKER 离线支持：页面走网络优先（总拿最新版），断网时用缓存，练习场离线也能玩 */
const C = 'vxpoker-v3';
const PRE = ['/poker/', '/poker/assets.js', '/poker/vp-192.png', '/poker/vp-logo-512.png', '/poker/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(PRE)).catch(() => { })); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k.startsWith('vxpoker-')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin || !u.pathname.startsWith('/poker/')) return;
  const isA = u.pathname.endsWith('/assets.js'), key = u.origin + u.pathname + (isA ? u.search : '');
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)); } return res; })
      .catch(() => caches.match(key).then(m => m || caches.match(u.origin + '/poker/'))));
    return;
  }
  if (/\.(png|svg|webmanifest)$/.test(u.pathname) || isA) {
    // 图片资源：先用缓存，同时后台更新；assets.js 按版本号缓存，新版本还没缓存时（离线）退回任意旧版本
    e.respondWith(caches.match(key).then(m => {
      const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)); } return res; });
      if (m) { net.catch(() => { }); return m; }
      return net.catch(() => caches.match(r, { ignoreSearch: true }));
    }));
  }
});
// 点通知：回到已打开的扑克页面，没有就新开
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => new URL(x.url).pathname.startsWith('/poker/club')) || cs.find(x => new URL(x.url).pathname.startsWith('/poker/'));
    return c ? c.focus() : self.clients.openWindow(e.notification.tag === 'vx-turn' ? '/poker/club/' : '/poker/');
  }));
});
// 服务器推送（无内容）：轮到你行动或有空位为你保留
self.addEventListener('push', e => {
  e.waitUntil(self.registration.showNotification('万泰扑克 · 轮到你了', { body: '牌桌在等你行动，点开回到俱乐部', tag: 'vx-turn', renotify: true, icon: '/poker/vp-192.png', badge: '/poker/vp-192.png' }));
});
