const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Log the exact URL to the browser console whenever an image is rendered
const oldImg = `img.src = text;`;
const newImg = `console.log("🖼️ Rendering image with src:", text);\n          img.src = text;`;

html = html.replace(oldImg, newImg);
fs.writeFileSync('index.html', html);
console.log('✅ URL logging added!');
