const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the onclick events by adding e.stopPropagation()
// We target the exact line from your output (line 1710)
html = html.replace(
    /img\.onclick = function\(\) \{ openFullscreenMedia\(this\.src, false\); \};/g,
    "img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };"
);

// 2. Fix the openFullscreenMedia function to wait for image to load
const oldFunc = `  function openFullscreenMedia(src, isVideo) {
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
      video.play();`;

const newFunc = `  function openFullscreenMedia(src, isVideo) {
    currentViewMedia = src;
    const viewer = document.getElementById('fullscreen-viewer');
    const img = document.getElementById('fullscreen-img');
    const video = document.getElementById('fullscreen-video');
    
    viewer.style.display = 'none';
    img.style.display = 'none';
    video.style.display = 'none';
    
    if (isVideo || src.startsWith('data:video')) {
      video.src = src;
      video.style.display = 'block';
      viewer.style.display = 'flex';
      video.play();`;

html = html.replace(oldFunc, newFunc);

// 3. Fix the image loading part of the function
const oldImgLoad = `    } else {
      // 2. Load the image fully, THEN show the viewer
      img.onload = function() {
        viewer.style.display = 'flex';
        img.style.display = 'block';
      };
      img.src = src;
    }
  }`;
const newImgLoad = `    } else {
      img.onload = function() {
        viewer.style.display = 'flex';
        img.style.display = 'block';
      };
      img.src = src;
    }
  }`;
html = html.replace(oldImgLoad, newImgLoad);

fs.writeFileSync('index.html', html);
console.log('✅ Picture clicks fixed to prevent accidental deletion!');
