const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We replace EVERY instance of `img.src = text;` with `img.src = text; img.onclick = ...`
// The `/g` flag makes it replace ALL occurrences.
html = html.replace(
    /img\.src = text;/g,
    `img.src = text; img.style.cursor = 'pointer'; img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };`
);

fs.writeFileSync('index.html', html);
console.log('✅ The onclick event has been attached to ALL images!');
