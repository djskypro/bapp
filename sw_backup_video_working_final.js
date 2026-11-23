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

// Only cache GET requests. Let POST (uploads) go directly to the network.
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return; // Skip POST requests
    e.respondWith(fetch(e.request));
});
