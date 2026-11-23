const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlock = `      if (text.startsWith('/media/')) {
          // It's a URL from the server!
          img.src = text;
          img.style.borderRadius = '10px';
          img.style.maxWidth = '100%';
      } else if (text.startsWith('img_ref_')) {`;

const newBlock = `      if (text.startsWith('/media/') && text.endsWith('.mp4')) {
          // It's a VIDEO! Render as a playable player
          const video = document.createElement('video');
          video.src = text;
          video.controls = true;
          video.style.maxWidth = '100%';
          video.style.borderRadius = '10px';
          newMsg.appendChild(video);
          return; // Stop, don't append img
      } else if (text.startsWith('/media/')) {
          // It's an IMAGE URL from the server
          img.src = text;
          img.style.borderRadius = '10px';
          img.style.maxWidth = '100%';
      } else if (text.startsWith('img_ref_')) {`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Video URL rendering fixed!');
} else {
    console.log('❌ Could not find the exact block.');
}
