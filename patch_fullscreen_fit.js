const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old viewer (from line 3631 to 3641 in your output)
const oldViewerRegex = /<div id="fullscreen-viewer"[\s\S]*?<\/div>\s*<\/div>/;
html = html.replace(oldViewerRegex, '');

// 2. Add the new, perfect viewer right before the closing body tag
const newViewer = `
<div id="fullscreen-viewer" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:99999; flex-direction:column; justify-content:center; align-items:center;">
  
  <!-- Close Button -->
  <div style="position:absolute; top:30px; left:20px; color:white; font-size:35px; cursor:pointer; z-index:100000; text-shadow: 0 0 10px rgba(0,0,0,0.8);" onclick="document.getElementById('fullscreen-viewer').style.display='none'">✕</div>
  
  <!-- Image (Fits Screen) -->
  <img id="fullscreen-img" src="" style="width:100vw; height:100vh; object-fit:contain; display:none;">
  
  <!-- Video (Fits Screen) -->
  <video id="fullscreen-video" src="" controls style="width:100vw; height:100vh; object-fit:contain; display:none;"></video>
  
  <!-- Action Buttons (Floating Bottom) -->
  <div style="position:absolute; bottom:40px; display:flex; gap:40px;">
    <div onclick="saveFullscreenMedia()" style="background:rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius:50%; width:65px; height:65px; display:flex; justify-content:center; align-items:center; color:white; font-size:28px; cursor:pointer;">⬇️</div>
    <div onclick="forwardFullscreenMedia()" style="background:rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius:50%; width:65px; height:65px; display:flex; justify-content:center; align-items:center; color:white; font-size:28px; cursor:pointer;">↪️</div>
  </div>
</div>
</body>
`;
html = html.replace('</body>', newViewer);

// 3. Remove the old Javascript logic and add the bulletproof one
const oldJSRegex = /<script>\s*let currentViewMedia[\s\S]*?<\/script>\s*<\/body>/;
html = html.replace(oldJSRegex, `
<script>
  let currentViewMedia = "";

  function openFullscreenMedia(src, isVideo) {
    currentViewMedia = src;
    const viewer = document.getElementById('fullscreen-viewer');
    const img = document.getElementById('fullscreen-img');
    const video = document.getElementById('fullscreen-video');
    
    viewer.style.display = 'flex';
    
    if (isVideo || src.startsWith('data:video')) {
      img.style.display = 'none';
      video.style.display = 'block';
      video.src = src;
      video.play();
    } else {
      video.style.display = 'none';
      video.pause();
      img.style.display = 'block';
      img.src = src; // Load the image
    }
  }

  function saveFullscreenMedia() {
    if (!currentViewMedia) return;
    const a = document.createElement('a');
    a.href = currentViewMedia;
    a.download = 'BAPP_Media_' + Date.now() + (currentViewMedia.startsWith('data:video') ? '.mp4' : '.jpg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function forwardFullscreenMedia() {
    const target = prompt("Enter the username to forward this media to:");
    if(target && target.trim() !== "") {
        const to = target.trim();
        const isVid = currentViewMedia.startsWith('data:video');
        if(socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: currentViewMedia, isImage: !isVid, isVoice: false }));
        }
        alert("Forwarded to " + to);
        document.getElementById('fullscreen-viewer').style.display = 'none';
    }
  }
</script>
</body>`);

// 4. THE MOST IMPORTANT PART: Attach the click event to the image
// Look at your line 1706. The image code is: const img = document.createElement('img'); img.src = text; ...
html = html.replace(
    /const img = document\.createElement\('img'\);\s*img\.src = text;\s*img\.style\.cursor = 'pointer';/g,
    `const img = document.createElement('img'); 
     img.src = text; 
     img.style.cursor = 'pointer'; 
     img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };`
);

// Also attach to any line that just says `img.src = text; newMsg.appendChild(img);`
html = html.replace(
    /const img = document\.createElement\('img'\); img\.src = text; newMsg\.appendChild\(img\);/g,
    `const img = document.createElement('img'); 
     img.src = text; 
     img.style.cursor = 'pointer';
     img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
     newMsg.appendChild(img);`
);

fs.writeFileSync('index.html', html);
console.log('✅ Fullscreen viewer is now 100% full screen and click events attached!');
