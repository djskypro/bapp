const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. UPDATE FILE INPUT (Accept Videos)
// ==========================================
html = html.replace(
    '<input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">',
    '<input type="file" id="file-input" accept="image/*,video/*" style="display:none" onchange="handleImageUpload(event)">'
);

// ==========================================
// 2. UPDATE handleImageUpload (Handle Video Sizes)
// ==========================================
const oldUploadStart = html.indexOf('  function handleImageUpload(event) {');
const oldUploadEnd = html.indexOf('  function openSettings()');

const newUploadLogic = `
  let pendingMediaBase64 = null;
  let pendingMediaIsVideo = false;

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    event.target.value = ''; 

    // Show modal and loading state
    document.getElementById('media-preview-modal').style.display = 'flex';
    document.getElementById('preview-loading').style.display = 'block';
    document.getElementById('preview-content').innerHTML = '';
    const sendBtn = document.getElementById('preview-send-btn');
    sendBtn.disabled = true;
    sendBtn.style.background = '#333';
    sendBtn.style.color = '#777';
    sendBtn.innerText = 'Loading...';

    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      pendingMediaIsVideo = file.type.startsWith('video/');

      // Compress images
      if (!pendingMediaIsVideo) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
          let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.7);
          showReadyPreview();
        };
        img.src = base64Data;
      } else {
        // Videos don't get compressed, just sent raw
        pendingMediaBase64 = base64Data;
        showReadyPreview();
      }
    };
    reader.readAsDataURL(file);
  }

  function showReadyPreview() {
    document.getElementById('preview-loading').style.display = 'none';
    
    if (pendingMediaIsVideo) {
      document.getElementById('preview-content').innerHTML = \`<video src="\${pendingMediaBase64}" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>\`;
    } else {
      document.getElementById('preview-content').innerHTML = \`<img src="\${pendingMediaBase64}" style="max-width:100%; max-height:70vh; border-radius:15px;">\`;
    }

    const sendBtn = document.getElementById('preview-send-btn');
    sendBtn.disabled = false;
    sendBtn.style.background = '#25D366';
    sendBtn.style.color = 'black';
    sendBtn.innerText = 'Send';
  }

  function closeMediaPreview() {
    document.getElementById('media-preview-modal').style.display = 'none';
    pendingMediaBase64 = null;
  }

  function confirmMediaSend() {
    if (!pendingMediaBase64) return;
    
    // Instantly close modal
    closeMediaPreview();

    const to = activeChatId;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const isVid = pendingMediaIsVideo;
    const mediaData = pendingMediaBase64;

    // Send to server
    socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: mediaData, isImage: !isVid, isVideo: isVid, msgId: msgId, replyData: reply }));

    // Render locally
    appendMessage(mediaData, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);
    
    // Save to local memory
    try {
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: mediaData, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId, replyData: reply });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
    } catch(err) { console.error("Storage full"); }
    
    loadChatList();
    if (typeof cancelReply === 'function') cancelReply();
  }

`;

html = html.substring(0, oldUploadStart) + newUploadLogic + html.substring(oldUploadEnd);

// ==========================================
// 3. SAFE IMAGE RENDERING (Fix Broken Icon)
// ==========================================
// Replace all image rendering blocks with a safer check
const brokenImgRegex = /const img = document\.createElement\('img'\);[\s\S]*?newMsg\.appendChild\(img\);/g;
const safeImgRender = `const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.style.maxWidth = '100%';
      img.onerror = function() { this.src = 'https://via.placeholder.com/200?text=Image+Not+Loaded'; };
      img.onclick = function(e) { e.stopPropagation(); if(typeof openFullscreenMedia === 'function') openFullscreenMedia(this.src, false); };
      newMsg.appendChild(img);`;
html = html.replace(brokenImgRegex, safeImgRender);

fs.writeFileSync('index.html', html);
console.log('✅ Video support and Safe Image rendering added!');
