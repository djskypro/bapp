const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove the old service worker registration to avoid duplicates
html = html.replace(/if \('serviceWorker' in navigator\) \{[\s\S]*?\}\);/g, '');

// Add the new auto-reloading SW logic right before </body>
const newSWLogic = `
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('ServiceWorker registered with scope: ', registration.scope);
        
        // If there is an update, reload the page automatically
        registration.onupdatefound = function() {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = function() {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New update found! Reloading to apply...');
                window.location.reload();
              }
            }
          };
        };
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
</script>
</body>`;
html = html.replace('</body>', newSWLogic);

fs.writeFileSync('index.html', html);
console.log('✅ Service Worker now auto-updates and reloads!');
