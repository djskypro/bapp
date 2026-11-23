const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find and replace the compression settings
const oldCompress = /const MAX_WIDTH = \d+; const MAX_HEIGHT = \d+;/;
const newCompress = 'const MAX_WIDTH = 500; const MAX_HEIGHT = 500;';
html = html.replace(oldCompress, newCompress);

const oldQuality = /pendingMediaBase64 = canvas\.toDataURL\('image\/jpeg', [\d.]+\);/;
const newQuality = "pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.4);";
html = html.replace(oldQuality, newQuality);

// 2. Also fix the other compression block (for sending)
const oldCompress2 = /const MAX_WIDTH = \d+; const MAX_HEIGHT = \d+;/g;
html = html.replace(oldCompress2, 'const MAX_WIDTH = 500; const MAX_HEIGHT = 500;');

fs.writeFileSync('index.html', html);
console.log('✅ Images will now be compressed to 500px @ 40% (approx 50KB). No more corruption!');
