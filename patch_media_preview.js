const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Preview Modal HTML
const previewHTML = `
<div id="media-preview-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:99999; flex-direction:column; justify-content:center; align-items:center;">
  <div id="preview-loading" style="color:white; font-size:20px; margin-bottom:20px;">Loading media... ⏳</div>
  
  <div id="preview-content" style="max-width:90%; max-height:70vh; display:flex; justify-content:center; align-items:center;"></div>
  
  <div style="display:flex; gap:20px; margin-top:30px;">
    <button onclick="closeMediaPreview()" style="padding:12px 30px; border-radius:25px; border:none; background:#555; color:white; font-size:16px; font-weight:bold;">Cancel</button>
    <button id="preview-send-btn" onclick="confirmMediaSend()" disabled style="padding:12px 30px; border-radius:25px; border:none; background:#333; color:#777; font-size:16px; font-weight:bold; transition:0.3s;">Send</button>
  </div>
</div>
</body>
`;
html = html.replace('</body>', previewHTML);

// 2. Rewrite handleImageUpload to show the preview first
const oldUploadStart = html.indexOf('  function handleImageUpload(event) {');
const oldUploadEnd = html.indexOf('  function openSettings()');

const newUploadLogic = `
  let pendingMediaBase64 = null;
  let pendingMediaType = null;
  let pendingMediaIsVideo = false;

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    // Show modal
    document.getElementById('media-preview-modal').style.display = 'flex';
    document.getElementById('preview-loading').style.display = 'block';
    document.getElementById('preview-content').innerHTML = '';
    document.getElementById('preview-send-btn').disabled = true;
    document.getElementById('preview-send-btn').style.background = '#333';
    document.getElementById('preview-send-btn').style.color = '#777';
    document.getElementById('preview-send-btn').innerText = 'Loading...';

    const reader = new FileReader();
    reader.onload = function(e) {
        pendingMediaBase64 = e.target.result;
        pendingMediaIsVideo = file.type.startsWith('video/');

        // Render preview in modal
        if (pendingMediaIsVideo) {
            document.getElementById('preview-content').innerHTML = \`<video src="\${pendingMediaBase64}" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>\`;
        } else {
            document.getElementById('preview-content').innerHTML = \`<img src="\${pendingMediaBase64}" style="max-width:100%; max-height:70vh; border-radius:15px;">\`;
        }

        // Hide loading, enable send
        document.getElementById('preview-loading').style.display = 'none';
        const btn = document.getElementById('preview-send-btn');
        btn.disabled = false;
        btn.style.background = '#25D366';
        btn.style.color = 'black';
        btn.innerText = 'Send';
    };
    reader.readAsDataURL(file);
    
    // Reset the input so you can pick the same file again
    event.target.value = ''; 
  }

  function closeMediaPreview() {
    document.getElementById('media-preview-modal').style.display = 'none';
    pendingMediaBase64 = null;
    pendingMediaType = null;
    pendingMediaIsVideo = false;
  }

  function confirmMediaSend() {
    if (!pendingMediaBase64) return;
    
    const to = activeChatId;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const isVid = pendingMediaIsVideo;

    // Send to server
    socket.send(JSON.stringify({ 
        type: 'send_message', 
        to: to, 
        from: myBappId, 
        text: pendingMediaBase64, 
        isImage: !isVid,
        isVideo: isVid,
        msgId: msgId, 
        replyData: reply 
    }));

    // Render locally
    appendMessage(pendingMediaBase64, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);
    
    // Save to local memory
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
    savedMsgs.push({ text: pendingMediaBase64, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId, replyData: reply });
    localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
    
    loadChatList();
    if (typeof cancelReply === 'function') cancelReply();
    closeMediaPreview();
  }

`;

html = html.substring(0, oldUploadStart) + newUploadLogic + html.substring(oldUploadEnd);

fs.writeFileSync('index.html', html);
console.log('✅ Media preview modal added! Send button will wait for the file to load.');
