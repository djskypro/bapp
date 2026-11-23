const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add onclick to the first image block using regex
const regex1 = /const img = document\.createElement\('img'\);\s*img\.src = text;\s*img\.style\.cursor = 'pointer';\s*newMsg\.appendChild\(img\);/g;
const replace1 = `const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);`;
html = html.replace(regex1, replace1);

// 2. Add onclick to the second image block using regex
const regex2 = /const img = document\.createElement\('img'\); img\.src = text; newMsg\.appendChild\(img\);/g;
const replace2 = `const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer'; 
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); }; 
      newMsg.appendChild(img);`;
html = html.replace(regex2, replace2);

// 3. Just in case there is another variation, let's catch any img.src = text inside an isImage block
// We will do a fallback simple replace if the regex didn't find it.
if(!html.includes('openFullscreenMedia(this.src)')) {
    html = html.replace(
        "img.src = text;\n      img.style.cursor = 'pointer';",
        "img.src = text;\n      img.style.cursor = 'pointer';\n      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };"
    );
}

fs.writeFileSync('index.html', html);
console.log('✅ Regex patch applied! Images now have the click event.');
