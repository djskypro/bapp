const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. FIX VIDEO SELECTION (No more freezing)
const oldVideoSelect = `      if (file.type.startsWith('video/')) {
         pendingIsVideo = true;
         pendingMediaBase64 = e.target.result;
         
         document.getElementById('preview-loading').style.display = 'none';
         document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
         
         sendBtn.disabled = false;
         sendBtn.style.background = '#25D366';
         sendBtn.style.color = 'black';
      } else {`;

const newVideoSelect = `      if (file.type.startsWith('video/')) {
         pendingIsVideo = true;
         // USE OBJECT URL INSTEAD OF BASE64 TO PREVENT FREEZING
         pendingMediaBase64 = URL.createObjectURL(file);
         
         document.getElementById('preview-loading').style.display = 'none';
         document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
         
         sendBtn.disabled = false;
         sendBtn.style.background = '#25D366';
         sendBtn.style.color = 'black';
      } else {`;

if (html.includes(oldVideoSelect)) {
    html = html.replace(oldVideoSelect, newVideoSelect);
} else {
    console.log("❌ Could not find video select block.");
}

// 2. FIX CONFIRM SEND (Upload as file, send URL)
const oldConfirmStart = html.indexOf('  function confirmMediaSend() {');
const oldConfirmEnd = html.indexOf('  function ', oldConfirmStart + 30);

const newConfirm = `  async function confirmMediaSend() {
    if(!pendingMediaBase64) return;
    
    document.getElementById('media-preview-modal').style.display = 'none';
    if(typeof showToast === 'function') showToast("Uploading...");

    try {
        // Upload the file to the server via HTTP
        const blob = await (await fetch(pendingMediaBase64)).blob();
        const formData = new FormData();
        const isVid = pendingIsVideo;
        const filename = (isVid ? 'video_' : 'image_') + Date.now() + (isVid ? '.mp4' : '.jpg');
        formData.append('image', blob, filename);

        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if(!data.url) throw new Error("Upload failed");

        // Now send the tiny /media/ URL through the WebSocket
        const to = activeChatId;
        const msgId = Date.now().toString();
        const reply = currentReplyTo;
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const payload = {
            type: 'send_message',
            to: to,
            from: myBappId,
            text: data.url,
            isImage: !isVid,
            isVideo: isVid,
            msgId: msgId,
            replyData: reply
        };

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        } else {
            let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
            queue.push(payload);
            localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
        }

        appendMessage(data.url, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);
        
        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: data.url, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(e) { console.error(e); }

        const rp = document.getElementById('reply-preview');
        if (rp) rp.style.display = 'none';
        currentReplyTo = null;
        if (window.replyState && activeChatId) delete window.replyState[activeChatId];
        
        pendingMediaBase64 = null;
    } catch(err) {
        console.error("Upload error:", err);
        alert("Upload failed. Try again.");
    }
  }

`;

if(oldConfirmStart !== -1 && oldConfirmEnd !== -1) {
    html = html.substring(0, oldConfirmStart) + newConfirm + html.substring(oldConfirmEnd);
}

// 3. FIX RENDERING (Play video instead of showing text)
const oldRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('/media/')) {`;

const newRender = `    } else if (isImage) {
      if (text.startsWith('/media/') && text.endsWith('.mp4')) {
          const video = document.createElement('video');
          video.src = text;
          video.controls = true;
          video.style.maxWidth = '100%';
          video.style.borderRadius = '10px';
          newMsg.appendChild(video);
      } else {
          const img = document.createElement('img');
          img.style.cursor = 'pointer';
          
          if (text.startsWith('/media/')) {`;

if(html.includes(oldRender)) {
    html = html.replace(oldRender, newRender);
    
    // Add the closing brace for the new else statement
    const oldClose = `      img.onclick = function(e) { 
          e.stopPropagation(); 
          if (img.src && img.src.startsWith('data:image')) {
              openFullscreenMedia(img.src); 
          }
      };
      newMsg.appendChild(img);
    } else if (isVoice`;

    const newClose = `      img.onclick = function(e) { 
          e.stopPropagation(); 
          if (img.src && img.src.startsWith('data:image')) {
              openFullscreenMedia(img.src); 
          }
      };
      newMsg.appendChild(img);
      }
    } else if (isVoice`;

    html = html.replace(oldClose, newClose);
}

fs.writeFileSync('index.html', html);
console.log('✅ Video selection, upload, and rendering fixed safely!');
