const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// This regex looks for the entire broken block (from img.src to newMsg.appendChild)
// and replaces it with the clean, working version.
const brokenBlockRegex = /const img = document\.createElement\('img'\);\s*img\.src = text;[\s\S]*?newMsg\.appendChild\(img\);/g;

const cleanBlock = `const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
      newMsg.appendChild(img);`;

// Replace all 4 instances of the broken mess
html = html.replace(brokenBlockRegex, cleanBlock);

// Also check if there is a duplicate appendChild outside the block
html = html.replace(/newMsg\.appendChild\(img\);\s*newMsg\.appendChild\(img\);/g, "newMsg.appendChild(img);");

fs.writeFileSync('index.html', html);
console.log('✅ Image rendering code completely cleaned up!');
