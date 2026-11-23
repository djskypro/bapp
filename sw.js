const CACHE_NAME = 'bapp-v1000'; // BUMPED
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    if (e.request.url.includes('/upload') || e.request.url.includes('/media/')) return;
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
    )));
    self.clients.claim();
});
