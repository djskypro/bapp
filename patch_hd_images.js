const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Increase the maximum dimensions from 400 to 1080
const oldDimensions = `const MAX_WIDTH = 400; const MAX_HEIGHT = 400;`;
const newDimensions = `const MAX_WIDTH = 1080; const MAX_HEIGHT = 1080;`;
html = html.replace(oldDimensions, newDimensions);

// 2. Increase the JPEG quality from 40% to 70%
const oldQuality = `pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.4);`;
const newQuality = `pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.7);`;
html = html.replace(oldQuality, newQuality);

fs.writeFileSync('index.html', html);
console.log('✅ Image quality boosted to 1080p at 70% quality!');
