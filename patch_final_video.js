const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the EXACT block inside the last appendMessage function
const oldBlock = `    if (isImage) {
      const img = document.createElement('img'); img.src = text; img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
      newMsg.appendChild(img);`;

const newBlock = `    if (isImage) {
      // Check if it's a video URL
      if (text && text.startsWith('/media/') && text.endsWith('.mp4')) {
          const video = document.createElement('video');
          video.src = text;
          video.controls = true;
          video.style.maxWidth = '100%';
          video.style.borderRadius = '10px';
          newMsg.appendChild(video);
      } else {
          const img = document.createElement('img'); img.src = text; img.style.cursor = 'pointer';
          img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
          newMsg.appendChild(img);
      }`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Video rendering added to the FINAL appendMessage function!');
} else {
    console.log('❌ Could not find the exact block.');
}
