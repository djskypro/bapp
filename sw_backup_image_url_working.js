// SELF-DESTRUCTING SERVICE WORKER
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});
// Do NOT cache anything. Always fetch from network.
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
