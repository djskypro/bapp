const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS for the full-screen viewer
const newCSS = `
  /* Full Screen Image Viewer */
  #img-viewer {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.95); z-index: 999;
    display: none; flex-direction: column; justify-content: center; align-items: center;
  }
  #img-viewer img {
    max-width: 100%; max-height: 80vh; object-fit: contain;
  }
  .img-viewer-header {
    position: absolute; top: 0; width: 100%; padding: 20px;
    display: flex; justify-content: space-between; align-items: center;
    color: white; font-size: 24px;
  }
  .img-viewer-actions {
    position: absolute; bottom: 30px; width: 100%;
    display: flex; justify-content: center; gap: 30px;
  }
  .img-action-btn {
    background: rgba(255, 255, 255, 0.2); border: none; border-radius: 50%;
    width: 60px; height: 60px; color: white; font-size: 24px;
    display: flex; justify-content: center; align-items: center; cursor: pointer;
    backdrop-filter: blur(10px);
  }
</style>
`;
html = html.replace('</style>', newCSS);

// 2. Add the Full Screen Viewer HTML before </body>
const viewerHTML = `
<!-- IMAGE VIEWER -->
<div id="img-viewer">
  <div class="img-viewer-header">
    <span onclick="closeImageFullscreen()" style="cursor:pointer;">✕</span>
    <span style="font-size:16px;">Photo</span>
    <span></span>
  </div>
  <img id="fullscreen-img" src="">
  <div class="img-viewer-actions">
    <button class="img-action-btn" onclick="forwardImage()">↪️</button>
    <button class="img-action-btn" onclick="saveImage()">⬇️</button>
  </div>
</div>
</body>`;
html = html.replace('</body>', viewerHTML);

// 3. Make Images clickable in appendMessage
const oldAppend = `if (isImage) {
      const img = document.createElement('img'); img.src = text; newMsg.appendChild(img);
    }`;
const newAppend = `if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer';
      img.onclick = function() { openImageFullscreen(this.src); };
      newMsg.appendChild(img);
    }`;
html = html.replace(oldAppend, newAppend);

// 4. Add the JavaScript logic before the typing logic
const imgViewerLogic = `
  let currentViewImageSrc = "";
  
  function openImageFullscreen(src) {
    currentViewImageSrc = src;
    document.getElementById('fullscreen-img').src = src;
    document.getElementById('img-viewer').style.display = 'flex';
  }

  function closeImageFullscreen() {
    document.getElementById('img-viewer').style.display = 'none';
  }

  function saveImage() {
    const a = document.createElement('a');
    a.href = currentViewImageSrc;
    a.download = 'BAPP_Image_' + Date.now() + '.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert("Image download started! (If it didn't save, long-press the image and select 'Save Image').");
  }

  function forwardImage() {
    const targetUser = prompt("Enter the BAPP username to forward this photo to:");
    if(targetUser && targetUser.trim() !== "") {
      const cleanTarget = targetUser.trim().toLowerCase();
      
      // Send via WebSocket
      socket.send(JSON.stringify({ type: 'send_message', to: cleanTarget, from: myBappId, text: currentViewImageSrc, isImage: true }));
      
      // Save to local storage so it shows in our own forwarded chat
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + cleanTarget)) || [];
      savedMsgs.push({ text: currentViewImageSrc, type: 'sent', time: now, isImage: true, status: 'sent' });
      localStorage.setItem('bapp_msgs_' + cleanTarget, JSON.stringify(savedMsgs));
      
      saveChat(cleanTarget);
      loadChatList();
      alert("Photo forwarded to @" + cleanTarget);
      closeImageFullscreen();
    }
  }

  // Live typing logic
`;
html = html.replace('// Live typing logic', imgViewerLogic);

fs.writeFileSync('index.html', html);
console.log('✅ Full Screen Image Viewer, Save, and Forward added!');
