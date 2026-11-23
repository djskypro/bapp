const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the exact start of confirmMediaSend
const startIdx = html.indexOf('  function confirmMediaSend() {');
const endIdx = html.indexOf('  function ', startIdx + 30);

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `  async function confirmMediaSend() {
    if(!pendingMediaBase64) return;

    document.getElementById('media-preview-modal').style.display = 'none';
    if(typeof showToast === 'function') showToast("Uploading...");

    try {
        // Upload the file to the server first
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
    html = html.substring(0, startIdx) + newFunc + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ confirmMediaSend fixed: uploads file, sends URL.');
} else {
    console.log('❌ Could not find confirmMediaSend boundaries.');
}
