const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the confirmMediaSend function
const oldSendFunc = `  function confirmMediaSend() {
    if (!pendingMediaBase64) return;
    
    const to = activeChatId;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const isVid = pendingMediaIsVideo;`;

const newSendFunc = `  function confirmMediaSend() {
    if (!pendingMediaBase64) return;
    
    // 1. Save the data before closing
    const to = activeChatId;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const isVid = pendingMediaIsVideo;
    const mediaData = pendingMediaBase64;
    
    // 2. Close the preview IMMEDIATELY so user knows it's sent
    closeMediaPreview();

    // 3. Now send in the background
    socket.send(JSON.stringify({ 
        type: 'send_message', 
        to: to, 
        from: myBappId, 
        text: mediaData, 
        isImage: !isVid,
        isVideo: isVid,
        msgId: msgId, 
        replyData: reply 
    }));

    // Render locally
    appendMessage(mediaData, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);
    
    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: mediaData, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId, replyData: reply });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
    } catch(e) {
        console.error("Storage full, could not save image locally.");
    }
    
    loadChatList();
    if (typeof cancelReply === 'function') cancelReply();
  }`;

// Replace the old function
if (html.includes(oldSendFunc)) {
    html = html.replace(oldSendFunc, newSendFunc);
    fs.writeFileSync('index.html', html);
    console.log('✅ Send button now closes the preview instantly!');
} else {
    console.log('❌ Could not find the exact confirmMediaSend block.');
}
