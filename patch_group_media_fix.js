const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We match the whole function from start to end using regex
const regex = /function confirmMediaSend\(\) \{[\s\S]*?pendingMediaBase64 = null;\s*\}/;

const newFunction = `async function confirmMediaSend() {
    if(!pendingMediaBase64) return;
    
    // Instantly close modal
    document.getElementById('media-preview-modal').style.display = 'none';
    if(typeof showToast === 'function') showToast("Uploading...");

    try {
        // 1. Upload the file to the server
        const blob = await (await fetch(pendingMediaBase64)).blob();
        const formData = new FormData();
        const isVid = pendingIsVideo;
        const filename = (isVid ? 'video_' : 'image_') + Date.now() + (isVid ? '.mp4' : '.jpg');
        formData.append('image', blob, filename);

        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if(!data.url) throw new Error("Upload failed");

        // 2. Prepare the payload with Group info
        const to = activeChatId;
        const msgId = Date.now().toString();
        const reply = currentReplyTo;
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const isGroup = activeChatId.startsWith('group_');
        let groupMembers = [];
        if (isGroup) {
            let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
            if (groups[activeChatId]) groupMembers = groups[activeChatId].members;
        }

        const payload = {
            type: 'send_message',
            to: to,
            from: myBappId,
            text: data.url,
            isImage: !isVid,
            isVideo: isVid,
            msgId: msgId,
            replyData: reply,
            isGroup: isGroup,
            groupMembers: groupMembers
        };

        // 3. Send or Queue
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        } else {
            let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
            queue.push(payload);
            localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
        }

        // 4. Render locally
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
}`;

if (html.match(regex)) {
    html = html.replace(regex, newFunction);
    fs.writeFileSync('index.html', html);
    console.log('✅ confirmMediaSend fixed: Uploads via HTTP and supports Groups!');
} else {
    console.log('❌ Could not find the confirmMediaSend block to replace.');
}
