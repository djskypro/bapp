const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the end of the script to inject the override
const scriptEndIdx = html.lastIndexOf('</script>');

const overrideCode = `
  // ==========================================
  // FORCE OVERRIDE: Offline Queue SendMessage
  // ==========================================
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    // Check connection
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';

    // 1. Show on screen immediately
    if (typeof appendMessage === 'function') {
        appendMessage(text, 'sent', now, status, false, false, msgId, reply);
    }
    
    input.value = '';

    // 2. Save to phone storage
    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        if (typeof loadChatList === 'function') loadChatList();
    } catch(e) { console.error("Storage full"); }

    // Clear reply box
    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    // 3. Send NOW or QUEUE for later
    const payload = {
        type: 'send_message',
        to: to,
        from: myBappId,
        text: text,
        msgId: msgId,
        replyData: reply
    };

    if (isConnected) {
        socket.send(JSON.stringify(payload));
    } else {
        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
        queue.push(payload);
        localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
        console.log("📩 Message queued. Will send when online.");
    }
  };

  // FORCE OVERRIDE: The Clock Icon for Pending Messages
  const originalAppend = window.appendMessage;
  window.appendMessage = function(text, type, timeStr, status, isImage, isVoice, msgId, replyData, isWhisper, isVideo) {
    originalAppend(text, type, timeStr, status, isImage, isVoice, msgId, replyData, isWhisper, isVideo);
    // If it's a pending message, find the last bubble and change its tick to a clock
    if (status === 'pending') {
        const msgBox = document.getElementById('chat-messages');
        if (msgBox && msgBox.lastElementChild) {
            const check = msgBox.lastElementChild.querySelector('.msg-status');
            if (check) check.innerText = '🕒';
        }
    }
  };
`;

if (scriptEndIdx !== -1) {
    html = html.substring(0, scriptEndIdx) + overrideCode + html.substring(scriptEndIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Force override applied! The app will now queue messages offline.');
} else {
    console.log('❌ Could not find the script tag.');
}
