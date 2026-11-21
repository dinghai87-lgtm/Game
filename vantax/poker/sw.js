/* VANTAX POKER 离线支持：页面走网络优先（总拿最新版），断网时用缓存，练习场离线也能玩 */
const C = 'vxpoker-v4';
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
      const net = fetch(r).then(res => {
        if (res.ok) {
          const cp = res.clone();
          // assets.js 每个版本一个缓存：存新版本时把旧版本删掉，缓存不会越积越多
          caches.open(C).then(c => c.put(key, cp).then(() => isA ? c.keys().then(ks => Promise.all(ks.filter(q => q.url !== key && new URL(q.url).pathname.endsWith('/assets.js')).map(q => c.delete(q)))) : null)).catch(() => { });
        }
        return res;
      });
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
    // 俱乐部的通知（轮到你/空位/金币申请，标签都以 vx- 开头）点开回到对应的俱乐部
    const club = e.notification.data && e.notification.data.club;
    return c ? c.focus() : self.clients.openWindow(String(e.notification.tag || '').startsWith('vx-') ? '/poker/club/' + (club ? '?c=' + encodeURIComponent(club) : '') : '/poker/');
  }));
});
// 服务器推送（无内容）：轮到你行动或有空位为你保留
self.addEventListener('push', e => {
  // 新版服务器会带加密内容（哪张桌、轮到你还是有空位）；旧版没有内容就显示通用提示
  let m = null; try { m = e.data && e.data.json(); } catch (x) { m = null; }
  const title = (m && typeof m.title === 'string' && m.title.slice(0, 60)) || '万泰扑克 · 轮到你了';
  const body = (m && typeof m.body === 'string' && m.body.slice(0, 120)) || '牌桌在等你行动，点开回到俱乐部';
  const tag = (m && typeof m.tag === 'string' && m.tag.slice(0, 40)) || 'vx-turn';
  const club = m && typeof m.club === 'string' && /^[\w-]{1,40}$/.test(m.club) ? m.club : '';
  e.waitUntil(self.registration.showNotification(title, { body, tag, renotify: true, icon: '/poker/vp-192.png', badge: '/poker/vp-192.png', data: { club } }));
});
