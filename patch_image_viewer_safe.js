const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the FIRST image block (Line 2351)
const oldBlock1 = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      newMsg.appendChild(img);
    }`;

const newBlock1 = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function() { openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
    }`;

html = html.replace(oldBlock1, newBlock1);

// 2. Fix the SECOND image block (Line 3444)
const oldBlock2 = `    if (isImage) {
      const img = document.createElement('img'); img.src = text; newMsg.appendChild(img);
    }`;

const newBlock2 = `    if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer';
      img.onclick = function() { openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
    }`;

html = html.replace(oldBlock2, newBlock2);

// 3. Add the Fullscreen Viewer HTML before </body>
const viewerHTML = `
<div id="full-image-viewer" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); z-index: 9999999; justify-content: center; align-items: center;" onclick="closeFullscreenMedia()">
  <div id="close-full-img" style="position: absolute; top: 20px; right: 20px; width: 45px; height: 45px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-size: 24px; font-weight: bold; cursor: pointer; z-index: 10000000;">✕</div>
  <img id="full-image-src" src="" style="width: 100%; height: 100%; object-fit: contain;">
</div>
</body>`;
html = html.replace('</body>', viewerHTML);

// 4. Add the JS functions right before the closing </script>
const viewerJS = `
  function openFullscreenMedia(src) {
    document.getElementById('full-image-src').src = src;
    document.getElementById('full-image-viewer').style.display = 'flex';
    // Push state so hardware back works correctly
    history.pushState({ view: 'image' }, '', '#image');
  }
  
  function closeFullscreenMedia() {
    document.getElementById('full-image-viewer').style.display = 'none';
    // If we are on the #image state, go back to fix history
    if (window.location.hash === '#image') history.back();
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + viewerJS + html.substring(lastScriptIdx);
}

// 5. Update the System Back Button (popstate)
const oldPopstate = `  window.addEventListener('popstate', function(event) {
    // When the hardware back button is pressed, reset the UI
    resetToHome();
  });`;

const newPopstate = `  window.addEventListener('popstate', function(event) {
    // Check if the full screen image viewer is open
    const imgViewer = document.getElementById('full-image-viewer');
    if (imgViewer && imgViewer.style.display === 'flex') {
        closeFullscreenMedia();
        history.pushState({ view: 'chat' }, '', '#chat'); // Stay in chat
        return;
    }
    // Otherwise, reset the UI to home
    resetToHome();
  });`;

html = html.replace(oldPopstate, newPopstate);

// 6. Update the Edge Swipe Back Gesture
const oldGesture = `  function handleBackGesture() {
    // 1. Close Full Screen Status Viewer`;

const newGesture = `  function handleBackGesture() {
    // 0. Close Full Screen Image Viewer
    const imgViewer = document.getElementById('full-image-viewer');
    if (imgViewer && imgViewer.style.display === 'flex') {
        closeFullscreenMedia();
        return;
    }
    
    // 1. Close Full Screen Status Viewer`;

html = html.replace(oldGesture, newGesture);

fs.writeFileSync('index.html', html);
console.log('✅ Fullscreen image viewer, X button, edge swipe, and hardware back are now linked!');
