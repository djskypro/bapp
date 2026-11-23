const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Clear the Service Worker cache once safely
const cacheClearScript = `
<script>
  if ('serviceWorker' in navigator) {
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
  }
</script>
`;
// Only add it if it's not there (prevents infinite reloads)
if (!html.includes('registration.unregister()')) {
    html = html.replace('</body>', cacheClearScript + '</body>');
}

// 2. Add a cache-buster to the media URLs when rendering
// This forces the browser to download the actual new file, not the corrupted cached one
html = html.replace(
    "saveText = data.text;", 
    "saveText = data.text.split('?')[0] + '?v=' + Date.now(); // Cache buster"
);

fs.writeFileSync('index.html', html);
console.log("✅ Cache buster added!");
