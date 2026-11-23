const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Full-Screen HTML Viewer before the closing </body>
const viewerHTML = `
<div id="fullscreen-viewer" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:99999; flex-direction:column; justify-content:center; align-items:center;">
  <div style="position:absolute; top:20px; left:20px; color:white; font-size:30px; cursor:pointer; z-index:100000;" onclick="document.getElementById('fullscreen-viewer').style.display='none'">✕</div>
  <img id="fullscreen-img" src="" style="max-width:100%; max-height:80vh; object-fit:contain;">
  <video id="fullscreen-video" src="" controls style="max-width:100%; max-height:80vh; display:none; object-fit:contain;"></video>
  
  <div style="position:absolute; bottom:30px; display:flex; gap:30px;">
    <div onclick="saveFullscreenMedia()" style="background:rgba(255,255,255,0.2); border-radius:50%; width:60px; height:60px; display:flex; justify-content:center; align-items:center; color:white; font-size:24px; cursor:pointer;">⬇️</div>
    <div onclick="forwardFullscreenMedia()" style="background:rgba(255,255,255,0.2); border-radius:50%; width:60px; height:60px; display:flex; justify-content:center; align-items:center; color:white; font-size:24px; cursor:pointer;">↪️</div>
  </div>
</div>
</body>
`;
html = html.replace('</body>', viewerHTML);

// 2. Add the JavaScript Logic for the Viewer
const viewerJS = `
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
      img.src = src;
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
        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: currentViewMedia, isImage: !isVid, isVideo: isVid }));
        alert("Forwarded to " + to);
        document.getElementById('fullscreen-viewer').style.display = 'none';
    }
  }
</script>
</body>
`;
html = html.replace('</body>', viewerJS);

// 3. Add onclick to ALL image rendering blocks
// We use Regex to find every instance of `img.src = text;` and attach the click event
html = html.replace(
    /img\.src = text;\s*img\.style\.cursor = 'pointer';/g,
    "img.src = text; img.style.cursor = 'pointer'; img.onclick = function() { openFullscreenMedia(this.src, false); };"
);

html = html.replace(
    /img\.src = text;\s*newMsg\.appendChild\(img\);/g,
    "img.src = text; img.style.cursor = 'pointer'; img.onclick = function() { openFullscreenMedia(this.src, false); }; newMsg.appendChild(img);"
);

// 4. Add video rendering support (since BAPP might support videos soon)
// We look for the appendMessage function and inject video support if it doesn't exist
html = html.replace(
    "} else if (isVoice || (text && text.startsWith('data:audio'))) {",
    `} else if (text && text.startsWith('data:video')) {
      const video = document.createElement('video');
      video.src = text;
      video.style.maxWidth = '100%';
      video.style.borderRadius = '10px';
      video.style.cursor = 'pointer';
      video.onclick = function() { openFullscreenMedia(this.src, true); };
      newMsg.appendChild(video);
    } else if (isVoice || (text && text.startsWith('data:audio'))) {`
);

fs.writeFileSync('index.html', html);
console.log('✅ Full Screen Media Viewer (Images & Videos) attached to all blocks!');
