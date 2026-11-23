const fs = require('fs');

// ==========================================
// 1. FIX SERVER (Clean offline save & send receipt)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldOfflineSave = `            } else {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (!db[cleanTo]) db[cleanTo] = [];
                db[cleanTo].push({
                    from: from,
                    text: text,
                    isImage: isImage || false,
                    isVoice: isVoice || false, msgId: msgId, replyData: replyData,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper
                });
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("💾 Offline Saved");
            }`;

const newOfflineSave = `            } else {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (!db[cleanTo]) db[cleanTo] = [];
                
                // Clean object with no duplicates and includes isVideo
                db[cleanTo].push({
                    from: from,
                    text: text,
                    isImage: isImage || false,
                    isVoice: isVoice || false,
                    isVideo: isVideo || false,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper || false
                });
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("💾 Offline Saved to Database");
                
                // Send a receipt to the sender so they know it's safely stored
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
            }`;
            
if (serverJs.includes(oldOfflineSave)) {
    serverJs = serverJs.replace(oldOfflineSave, newOfflineSave);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server offline save fixed!');
} else {
    console.log('❌ Could not find server offline save block.');
}

// ==========================================
// 2. FIX CLIENT (Remove duplicates & add try/catch)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

const oldClientSend = `    if (text !== "" && socket.readyState !== WebSocket.OPEN) {
      alert("⚠️ You are offline or the server is down. Message not sent.");
      return;
    }

    if (text !== "" && socket.readyState !== WebSocket.OPEN) {
      alert("⚠️ You are offline. Message not sent. Please wait for reconnection.");
      return;
    }

    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const msgId = Date.now().toString();

      socket.send(JSON.stringify({
          type: 'send_message',
          to: activeChatId,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: currentReplyTo
      }));

      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);
      input.value = '';

      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + activeChatId)) || [];
      savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo });
      localStorage.setItem('bapp_msgs_' + activeChatId, JSON.stringify(savedMsgs));
      loadChatList();


        const rp = document.getElementById('reply-preview');
        if (rp) rp.style.display = 'none';
        currentReplyTo = null;
        if (window.replyState && activeChatId) delete window.replyState[activeChatId];
 // Hide preview after sending
    }`;

const newClientSend = `    if (text === "") return;
    
    if (socket.readyState !== WebSocket.OPEN) {
      alert("⚠️ You are offline. Message not sent.");
      return;
    }

    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();

    socket.send(JSON.stringify({
        type: 'send_message',
        to: activeChatId,
        from: myBappId,
        text: text,
        msgId: msgId,
        replyData: currentReplyTo
    }));

    appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);
    input.value = '';

    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + activeChatId)) || [];
        savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo });
        localStorage.setItem('bapp_msgs_' + activeChatId, JSON.stringify(savedMsgs));
        loadChatList();
    } catch(e) {
        console.error("Phone storage full! Message not saved to history.");
    }

    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];
  }`;

if (html.includes(oldClientSend)) {
    html = html.replace(oldClientSend, newClientSend);
    fs.writeFileSync('index.html', html);
    console.log('✅ Client send function cleaned up and secured!');
} else {
    console.log('❌ Could not find client send block.');
}
