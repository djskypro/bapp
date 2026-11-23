const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const forceUpdateScript = `
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
        console.log('🗑️ Old Service Worker unregistered.');
      }
      // Clear all caches
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
        console.log('🧹 Caches cleared.');
        // Reload the page to get fresh files
        window.location.reload(true);
      });
    });
  }
</script>
`;
html = html.replace('</body>', forceUpdateScript + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Force update script added!");
