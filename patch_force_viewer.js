const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Check if viewer exists. If not, inject the HTML right before </body>
if (!html.includes('id="simple-img-viewer"')) {
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
`;
    html = html.replace('</body>', viewerHTML + '\n</body>');
}

// 2. Append the Global Click Listener to the very end of the body
// We remove any old attempts first to avoid conflicts
html = html.replace(/<script id="viewer-logic">[\s\S]*?<\/script>/g, '');

const viewerJS = `
<script id="viewer-logic">
  // Global listener to catch ANY image click inside the chat
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG' && e.target.closest('#chat-messages')) {
      if (e.target.id === 'chat-avatar' || e.target.closest('.avatar')) return;
      
      const viewer = document.getElementById('simple-img-viewer');
      const fullImg = document.getElementById('simple-full-img');
      
      if (viewer && fullImg) {
          fullImg.src = e.target.src;
          viewer.style.display = 'flex';
          history.pushState({ view: 'image' }, '', '#image');
      }
    }
  });

  function closeSimpleViewer() {
    const viewer = document.getElementById('simple-img-viewer');
    if (viewer) viewer.style.display = 'none';
  }

  // Close on X button click
  document.addEventListener('click', function(e) {
    if (e.target.id === 'simple-img-close') {
      closeSimpleViewer();
      if (window.location.hash === '#image') history.back();
    }
  });

  // Close on tapping the black background
  document.addEventListener('click', function(e) {
    if (e.target.id === 'simple-img-viewer') {
      closeSimpleViewer();
      if (window.location.hash === '#image') history.back();
    }
  });

  // Handle Hardware Back Button
  window.addEventListener('popstate', function(event) {
    const viewer = document.getElementById('simple-img-viewer');
    if (viewer && viewer.style.display === 'flex') {
      closeSimpleViewer();
      history.pushState({ view: 'chat' }, '', '#chat');
    }
  });
</script>
`;

html = html.replace('</body>', viewerJS + '\n</body>');
fs.writeFileSync('index.html', html);
console.log('✅ Viewer HTML and Global Click Listener forced into the file!');
