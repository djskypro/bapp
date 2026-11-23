const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Rewrite the full-screen logic to be bulletproof
const oldJSRegex = /function openFullscreenMedia\(src, isVideo\) \{[\s\S]*?viewer\.style\.display = 'flex';/;
const newJS = `
  function openFullscreenMedia(src, isVideo) {
    currentViewMedia = src;
    const viewer = document.getElementById('fullscreen-viewer');
    const img = document.getElementById('fullscreen-img');
    const video = document.getElementById('fullscreen-video');
    
    // 1. Reset the viewer to be totally hidden first
    viewer.style.display = 'none';
    img.style.display = 'none';
    video.style.display = 'none';
    
    if (isVideo || src.startsWith('data:video')) {
      video.src = src;
      video.style.display = 'block';
      viewer.style.display = 'flex';
      video.play();
    } else {
      // 2. Load the image fully, THEN show the viewer
      img.onload = function() {
        viewer.style.display = 'flex';
        img.style.display = 'block';
      };
      img.src = src;
    }
  }
`;
html = html.replace(oldJSRegex, newJS);

// 2. Make sure EVERY image has the click event attached
// We inject the click event right after the image is created in all 4 places
html = html.replace(
    /img\.src = text;\s*img\.style\.cursor = 'pointer';/g,
    `img.src = text; 
     img.style.cursor = 'pointer'; 
     img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };`
);

html = html.replace(
    /img\.src = text;\s*newMsg\.appendChild\(img\);/g,
    `img.src = text; 
     img.style.cursor = 'pointer';
     img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
     newMsg.appendChild(img);`
);

fs.writeFileSync('index.html', html);
console.log('✅ Fullscreen image loader fixed and click events attached!');
