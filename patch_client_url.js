const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace the entire confirmMediaSend function with an async HTTP upload
const startIdx = html.indexOf('  function confirmMediaSend() {');
const endIdx = html.indexOf('\n  ', html.indexOf('pendingMediaBase64 = null;', startIdx)) + 3;

const newSend = `  async function confirmMediaSend() {
    if(!pendingMediaBase64) return;
    
    // Show loading state
    document.getElementById('media-preview-modal').style.display = 'none';
    if(typeof showToast === 'function') showToast("Uploading image...");

    try {
        // Send as a File via fetch, not WebSocket
        const blob = await (await fetch(pendingMediaBase64)).blob();
        const formData = new FormData();
        formData.append('image', blob, 'img_' + Date.now() + '.jpg');
        
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        
        if(!data.url) throw new Error("Upload failed");
        
        const to = activeChatId;
        const isVid = pendingIsVideo;
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
            savedMsgs.push({ text: data.url, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(e) { console.error(e); }
        
        const rp = document.getElementById('reply-preview');
        if (rp) rp.style.display = 'none';
        currentReplyTo = null;
        if (window.replyState && activeChatId) delete window.replyState[activeChatId];
        
        pendingMediaBase64 = null;
    } catch(err) {
        console.error("Image Upload Error:", err);
        alert("Image upload failed. Try again.");
    }
  }
`;
html = html.substring(0, startIdx) + newSend + html.substring(endIdx);
fs.writeFileSync('index.html', html);
console.log('✅ Client now uploads images via HTTP and sends the URL!');
