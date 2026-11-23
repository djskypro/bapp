const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlock = `} else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('/media/')) {`;

const newBlock = `} else if (isImage) {
      if (text.startsWith('/media/') && text.endsWith('.mp4')) {
          const video = document.createElement('video');
          video.src = text;
          video.controls = true;
          video.style.maxWidth = '100%';
          video.style.borderRadius = '10px';
          newMsg.appendChild(video);
      } else {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('/media/')) {`;

html = html.replace(oldBlock, newBlock);

const oldClose = `      newMsg.appendChild(img);
    } else if (isVoice`;
const newClose = `      newMsg.appendChild(img);
      }
    } else if (isVoice`;

html = html.replace(oldClose, newClose);

fs.writeFileSync('index.html', html);
console.log('✅ Videos will now render as playable players!');
