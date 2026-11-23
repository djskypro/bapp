const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove any existing simple-img-viewer HTML and JS to prevent conflicts
html = html.replace(/<div id="simple-img-viewer">[\s\S]*?<\/div>/g, '');
html = html.replace(/\/\/ --- SIMPLE FULLSCREEN IMAGE VIEWER ---[\s\S]*?\}\);/g, '');

// 2. Inject the bulletproof HTML just before </body>
const viewerHTML = `
<style>
  #simple-img-viewer {
    position: fixed; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: #000;
    z-index: 9999999;
    display: none;
    justify-content: center;
    align-items: center;
  }
  #simple-img-viewer img {
    width: 100%; height: 100%;
    object-fit: contain;
  }
  #simple-img-close {
    position: absolute; top: 20px; right: 20px;
    width: 45px; height: 45px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    color: white; font-size: 24px; font-weight: bold;
    cursor: pointer; z-index: 10000000;
  }
</style>

<div id="simple-img-viewer">
  <div id="simple-img-close">✕</div>
  <img id="simple-full-img" src="">
</div>
</body>`;
html = html.replace('</body>', viewerHTML);

// 3. Inject the new JS logic at the end of the script
const viewerJS = `
  // --- BULLETPROOF IMAGE VIEWER LOGIC ---
  
  // 1. Open viewer on image click
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG' && e.target.closest('#chat-messages')) {
      if (e.target.id === 'chat-avatar' || e.target.closest('.avatar')) return;
      
      document.getElementById('simple-full-img').src = e.target.src;
      document.getElementById('simple-img-viewer').style.display = 'flex';
      
      // Push a history state so the back button has something to close
      history.pushState({ view: 'image' }, '', '#image');
    }
  });

  // 2. Close viewer functions
  function closeSimpleViewer() {
    document.getElementById('simple-img-viewer').style.display = 'none';
  }

  // Close on X button click
  document.getElementById('simple-img-close').addEventListener('click', function(e) {
    e.stopPropagation();
    closeSimpleViewer();
    // If we are on the #image state, go back to fix history
    if (window.location.hash === '#image') history.back();
  });

  // Close when tapping anywhere else on the image
  document.getElementById('simple-img-viewer').addEventListener('click', function(e) {
    if(e.target.id !== 'simple-img-close') {
       closeSimpleViewer();
       if (window.location.hash === '#image') history.back();
    }
  });

  // 3. Handle Hardware Back Button (popstate)
  window.addEventListener('popstate', function(event) {
    const viewer = document.getElementById('simple-img-viewer');
    
    // If the viewer is open, close it
    if (viewer && viewer.style.display === 'flex') {
      closeSimpleViewer();
      // Push state back to chat so we don't exit the app entirely
      history.pushState({ view: 'chat' }, '', '#chat');
      return;
    }
    
    // If viewer is not open, use the default back logic (reset to home)
    if(typeof resetToHome === 'function') {
        resetToHome();
    }
  });

  // 4. Handle Edge Swipe Gesture
  if (typeof handleBackGesture === 'function') {
      const originalEdgeBack = handleBackGesture;
      window.handleBackGesture = function() {
          const viewer = document.getElementById('simple-img-viewer');
          if (viewer && viewer.style.display === 'flex') {
              closeSimpleViewer();
              if (window.location.hash === '#image') history.back();
              return;
          }
          originalEdgeBack();
      };
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + viewerJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Bulletproof viewer, X button, and back button logic applied!');
} else {
    console.log('❌ Could not find script tag.');
}
