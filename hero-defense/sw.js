// 离线缓存：首次打开后，没有网络也能玩
const C='hero-defense-1794978657';const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./privacy.html','./terms.html','./odds.html','./legal.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/'))return;
  const nav=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('.html');e.respondWith(fetch(nav?new Request(e.request.url,{cache:'reload'}):e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
