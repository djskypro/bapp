const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the File Input to accept videos
html = html.replace(
    '<input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">',
    '<input type="file" id="file-input" accept="image/*,video/*" style="display:none" onchange="handleImageUpload(event)">'
);

// 2. Insert the Preview Modal HTML before </body>
const modalHTML = `
<div id="media-preview-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:99999; flex-direction:column; justify-content:center; align-items:center;">
  <div id="preview-loading" style="color:white; font-size:20px; margin-bottom:20px;">Loading... ⏳</div>
  <div id="preview-content" style="max-width:90%; max-height:70vh;"></div>
  <div style="display:flex; gap:20px; margin-top:30px;">
    <button onclick="document.getElementById('media-preview-modal').style.display='none'; window.pendingMediaBase64=null;" style="padding:12px 30px; border-radius:25px; border:none; background:#555; color:white; font-size:16px; font-weight:bold;">Cancel</button>
    <button id="preview-send-btn" onclick="confirmMediaSend()" disabled style="padding:12px 30px; border-radius:25px; border:none; background:#333; color:#777; font-size:16px; font-weight:bold; transition:0.3s;">Send</button>
  </div>
</div>
</body>`;
html = html.replace('</body>', modalHTML);

// 3. Replace the handleImageUpload function safely
const startIdx = html.indexOf('  function handleImageUpload(event) {');
const endIdx = html.indexOf('  function openSettings()');

if (startIdx !== -1 && endIdx !== -1) {
    const newFunction = `  let pendingMediaBase64 = null;
  let pendingIsVideo = false;

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    event.target.value = ''; 

    // Show modal
    document.getElementById('media-preview-modal').style.display = 'flex';
    document.getElementById('preview-loading').style.display = 'block';
    document.getElementById('preview-content').innerHTML = '';
    const sendBtn = document.getElementById('preview-send-btn');
    sendBtn.disabled = true;
    sendBtn.style.background = '#333';
    sendBtn.style.color = '#777';

    const reader = new FileReader();
    reader.onload = function(e) {
      if (file.type.startsWith('video/')) {
         pendingIsVideo = true;
         pendingMediaBase64 = e.target.result;
         
         document.getElementById('preview-loading').style.display = 'none';
         document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
         
         sendBtn.disabled = false;
         sendBtn.style.background = '#25D366';
         sendBtn.style.color = 'black';
      } else {
         pendingIsVideo = false;
         const img = new Image();
         img.onload = function() {
           const canvas = document.createElement('canvas');
           const MAX_WIDTH = 400; const MAX_HEIGHT = 400;
           let width = img.width; let height = img.height;
           if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
           else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
           canvas.width = width; canvas.height = height;
           const ctx = canvas.getContext('2d');
           ctx.drawImage(img, 0, 0, width, height);
           pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.4);
           
           document.getElementById('preview-loading').style.display = 'none';
           document.getElementById('preview-content').innerHTML = '<img src="' + pendingMediaBase64 + '" style="max-width:100%; max-height:70vh; border-radius:15px;">';
           
           sendBtn.disabled = false;
           sendBtn.style.background = '#25D366';
           sendBtn.style.color = 'black';
         };
         img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  function confirmMediaSend() {
    if(!pendingMediaBase64) return;
    
    // Instantly close modal
    document.getElementById('media-preview-modal').style.display = 'none';
    
    const to = activeChatId;
    const base64Img = pendingMediaBase64;
    const isVid = pendingIsVideo;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    
    socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: !isVid, isVideo: isVid, msgId: msgId, replyData: reply }));
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    appendMessage(base64Img, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);

    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent' });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();

        document.getElementById('reply-preview').style.display = 'none';
        currentReplyTo = null;
        if (window.replyState) delete window.replyState[to];
    } catch(err) { 
        // Auto-cleanup
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith('bapp_msgs_')) {
                let msgs = JSON.parse(localStorage.getItem(key)) || [];
                let changed = false;
                msgs.forEach(m => {
                    if (m.isImage && m.text && m.text.startsWith('data:image')) {
                        m.text = "📷 [Image removed to save space]";
                        m.isImage = false;
                        changed = true;
                    }
                });
                if (changed) localStorage.setItem(key, JSON.stringify(msgs));
            }
        }
        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(e2) { alert("Phone storage is completely full."); }
    }
    
    pendingMediaBase64 = null;
  }

`;
    html = html.substring(0, startIdx) + newFunction + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Loading screen, Preview Modal, and Video Support added perfectly!');
} else {
    console.log('❌ Could not find the exact function boundaries. Aborting to prevent crashes.');
}
