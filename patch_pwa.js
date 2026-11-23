const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Manifest link in the <head>
const headTarget = `<title>BAPP</title>`;
const newHead = `<title>BAPP</title>
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#000000">`;
html = html.replace(headTarget, newHead);

// 2. Add the Service Worker registration right before </body>
const bodyTarget = `</body>`;
const swScript = `
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('✅ ServiceWorker registered with scope: ', registration.scope);
      }, function(err) {
        console.log('❌ ServiceWorker registration failed: ', err);
      });
    });
  }
</script>
</body>`;
html = html.replace(bodyTarget, swScript);

fs.writeFileSync('index.html', html);
console.log('✅ PWA (Offline Mode) activated successfully!');
