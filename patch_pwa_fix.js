const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const badScript = `if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister();
        }
        if (caches) {
          caches.keys().then(function(names) {
            for (let name of names) caches.delete(name);
          });
        }
      });
    }`;

// Remove only the cache-killing logic
html = html.replace(badScript, '// Auto-unregister disabled to allow PWA install');

fs.writeFileSync('index.html', html);
console.log("✅ Service Worker unregister script removed!");
