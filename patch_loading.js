const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Modal HTML before </body>
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

// 2. Replace the exact handleImageUpload function from lines 1850-1894
const oldFunction = `  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    const to = activeChatId;
    const reader = new FileReader();
    reader.onload = function(e) {
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
        const base64Img = canvas.toDataURL('image/jpeg', 0.6);
        const msgId = Date.now().toString();
        const reply = currentReplyTo;
        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true, msgId: msgId, replyData: reply }));
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        appendMessage(base64Img, 'sent', now, 'sent', true, false, msgId, reply);

        const rp = document.getElementById('reply-preview');
        if (rp) rp.style.display = 'none';
        currentReplyTo = null;
        if (window.replyState && activeChatId) delete window.replyState[activeChatId];

        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();

            // Force clear the reply box
            document.getElementById('reply-preview').style.display = 'none';
            currentReplyTo = null;
            if (window.replyState) delete window.replyState[to];
            loadChatList();
        } catch(err) { alert("Phone memory is full!"); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }`;

const newFunctions = `  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    // Reset input so you can pick the same file again
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
        window.pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        // Show preview
        document.getElementById('preview-loading').style.display = 'none';
        document.getElementById('preview-content').innerHTML = '<img src="' + window.pendingMediaBase64 + '" style="max-width:100%; max-height:70vh; border-radius:15px;">';
        
        // Enable Send button
        sendBtn.disabled = false;
        sendBtn.style.background = '#25D366';
        sendBtn.style.color = 'black';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function confirmMediaSend() {
    if(!window.pendingMediaBase64) return;
    
    // 1. INSTANTLY CLOSE MODAL
    document.getElementById('media-preview-modal').style.display = 'none';
    
    // 2. RUN THE EXACT CODE YOU PROVIDED
    const to = activeChatId;
    const base64Img = window.pendingMediaBase64;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    
    socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true, msgId: msgId, replyData: reply }));
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    appendMessage(base64Img, 'sent', now, 'sent', true, false, msgId, reply);

    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();

        // Force clear the reply box
        document.getElementById('reply-preview').style.display = 'none';
        currentReplyTo = null;
        if (window.replyState) delete window.replyState[to];
        loadChatList();
    } catch(err) { alert("Phone memory is full!"); }
    
    window.pendingMediaBase64 = null;
  }`;

if (html.includes(oldFunction)) {
    html = html.replace(oldFunction, newFunctions);
    fs.writeFileSync('index.html', html);
    console.log('✅ Loading screen and Preview modal added perfectly!');
} else {
    console.log('❌ Could not find the exact handleImageUpload function. Aborting to prevent crashes.');
}
