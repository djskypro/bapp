const fs = require('fs');
let manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

manifest.icons = [
  {
    "src": "https://ui-avatars.com/api/?name=B&background=25D366&color=000&size=192",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "https://ui-avatars.com/api/?name=B&background=25D366&color=000&size=512",
    "sizes": "512x512",
    "type": "image/png"
  }
];

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log("✅ Manifest updated with valid PNG icons!");
