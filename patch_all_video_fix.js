const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add the video check to blocks 2 and 3 (lines 4766 and 4908)
const oldBlock = `    if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);`;

const newBlock = `    if (isImage) {
      if (text.startsWith('/media/') && text.endsWith('.mp4')) {
          const video = document.createElement('video');
          video.src = text;
          video.controls = true;
          video.style.maxWidth = '250px';
          video.style.width = 'auto';
          video.style.borderRadius = '10px';
          newMsg.appendChild(video);
          return;
      }
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);`;

// Replace all instances
let count = 0;
while (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    count++;
}

fs.writeFileSync('index.html', html);
console.log(`✅ Added video check to ${count} appendMessage blocks!`);
