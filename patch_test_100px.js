const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldCompress = /const MAX_WIDTH = \d+; const MAX_HEIGHT = \d+;/g;
const newCompress = 'const MAX_WIDTH = 100; const MAX_HEIGHT = 100;';
html = html.replace(oldCompress, newCompress);

const oldQuality = /pendingMediaBase64 = canvas\.toDataURL\('image\/jpeg', [\d.]+\);/g;
const newQuality = "pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.2);";
html = html.replace(oldQuality, newQuality);

fs.writeFileSync('index.html', html);
console.log('✅ Compression set to 100px for testing.');
