const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. ADD THE PREVIEW MODAL HTML (Before </body>)
// ==========================================
const previewHTML = `
<div id="media-preview-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:99999; flex-direction:column; justify-content:center; align-items:center;">
  <div id="preview-loading" style="color:white; font-size:20px; margin-bottom:20px;">Loading... ⏳</div>
  <div id="preview-content" style="max-width:90%; max-height:70vh;"></div>
  <div style="display:flex; gap:20px; margin-top:30px;">
    <button onclick="closeMediaPreview()" style="padding:12px 30px; border-radius:25px; border:none; background:#555; color:white; font-size:16px; font-weight:bold;">Cancel</button>
    <button id="preview-send-btn" onclick="confirmMediaSend()" disabled style="padding:12px 30px; border-radius:25px; border:none; background:#333; color:#777; font-size:16px; font-weight:bold; transition:0.3s;">Send</button>
  </div>
</div>
</body>
`;
html = html.replace('</body>', previewHTML);

// ==========================================
// 2. REPLACE handleImageUpload WITH PREVIEW LOGIC
// ==========================================
const oldUploadStart = html.indexOf('  function handleImageUpload(event) {');
const oldUploadEnd = html.indexOf('  function openSettings()');

const newUploadLogic = `
  let pendingMediaBase64 = null;
  let pendingMediaIsVideo = false;

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    // Reset input so same file can be picked again
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
          const MAX_WIDTH = 600; const MAX_HEIGHT = 600;
          let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.6);
          showReadyPreview();
        };
        img.src = base64Data;
      } else {
        // Videos don't need compression for now
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
    
    // 1. INSTANTLY CLOSE THE MODAL FIRST!
    closeMediaPreview();

    const to = activeChatId;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const isVid = pendingMediaIsVideo;
    const mediaData = pendingMediaBase64;

    // 2. Send to server
    socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: mediaData, isImage: !isVid, isVideo: isVid, msgId: msgId, replyData: reply }));

    // 3. Render locally
    appendMessage(mediaData, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);
    
    // 4. Save to local memory
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

fs.writeFileSync('index.html', html);
console.log('✅ Preview modal added and Send button closes immediately!');
