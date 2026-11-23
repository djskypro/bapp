const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace all instances of maxWidth = '100%' for videos
html = html.split("video.style.maxWidth = '100%';").join("video.style.maxWidth = '250px'; video.style.width = 'auto';");

fs.writeFileSync('index.html', html);
console.log('✅ All videos are now medium-sized (250px)!');
