const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Reduce the image dimensions and quality before sending
const oldCompress = `const MAX_WIDTH = 1080; const MAX_HEIGHT = 1080;`;
const newCompress = `const MAX_WIDTH = 720; const MAX_HEIGHT = 720;`;

if(html.includes(oldCompress)) {
    html = html.replace(oldCompress, newCompress);
}

const oldQuality = `pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.7);`;
const newQuality = `pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.6);`;

if(html.includes(oldQuality)) {
    html = html.replace(oldQuality, newQuality);
}

fs.writeFileSync('index.html', html);
console.log('✅ Image compression reduced to 720px @ 60% quality.');
