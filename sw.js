const CACHE = 'kp2-v2';
const ASSETS = [
  '/Patienttjek/',
  '/Patienttjek/index.html',
  '/Patienttjek/style.css',
  '/Patienttjek/app1.js',
  '/Patienttjek/app2.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Netværk først for Firebase og API-kald
  if(e.request.url.includes('firebase') || e.request.url.includes('googleapis')){
    return e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
  // Cache-first for app-filer
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res && res.status === 200 && res.type === 'basic'){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/Patienttjek/'));
    })
  );
});
