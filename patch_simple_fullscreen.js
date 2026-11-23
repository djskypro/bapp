const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the simple fullscreen HTML and CSS before </body>
const fullscreenHTML = `
<style>
  #simple-img-viewer {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: #000;
    z-index: 9999999;
    display: none;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  #simple-img-viewer img {
    width: 100%;
    height: 100%;
    object-fit: contain; /* This fits the image perfectly without cutting it */
  }
</style>

<div id="simple-img-viewer">
  <img id="simple-full-img" src="">
</div>
</body>`;
html = html.replace('</body>', fullscreenHTML);

// 2. Add the global click listener at the end of the script
const fullscreenJS = `
  // --- SIMPLE FULLSCREEN IMAGE VIEWER ---
  document.addEventListener('click', function(e) {
    // If the clicked element is an image inside the chat messages
    if (e.target.tagName === 'IMG' && e.target.closest('#chat-messages')) {
      // Ignore avatars or emojis
      if (e.target.id === 'chat-avatar' || e.target.closest('.avatar')) return;
      
      // Open the fullscreen viewer
      document.getElementById('simple-full-img').src = e.target.src;
      document.getElementById('simple-img-viewer').style.display = 'flex';
    }
  });

  // Close the viewer when you tap anywhere on the screen
  document.getElementById('simple-img-viewer').addEventListener('click', function() {
    this.style.display = 'none';
  });
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + fullscreenJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Bulletproof Fullscreen Image Viewer added!');
} else {
    console.log('❌ Could not find script tag.');
}
