const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find every place where an image is created and clean up the broken onclick events
const brokenImageRegex = /const img = document\.createElement\('img'\);[\s\S]*?newMsg\.appendChild\(img\);/g;

const cleanImageCode = `const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function() { openFullscreenMedia(this.src, false); };
      newMsg.appendChild(img);`;

html = html.replace(brokenImageRegex, cleanImageCode);

fs.writeFileSync('index.html', html);
console.log('✅ Picture tap fixed!');
