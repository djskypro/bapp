const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the entire broken sendMessage function from your last debug
const oldSend = `  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').textContent.trim();
    if (text !== "" && socket.readyState !== WebSocket.OPEN) {
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
    }
  }`;

const newSend = `  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    // Check if we are online
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';

    // 1. Instantly show the message on screen
    appendMessage(text, 'sent', now, status, false, false, msgId, reply);
    input.value = '';

    // 2. Save to local history
    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();
    } catch(e) { console.error("Storage full"); }

    // Clear reply box
    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    // 3. Send or Queue
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
        // Save to queue
        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
        queue.push(payload);
        localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
        console.log("📩 Message queued. Will send when online.");
    }
  }`;

if (html.includes(oldSend)) {
    html = html.replace(oldSend, newSend);
    fs.writeFileSync('index.html', html);
    console.log('✅ sendMessage successfully replaced with Offline Queue!');
} else {
    console.log('❌ Could not find the exact old sendMessage block.');
}

// 2. Update the tick icon logic to support the clock
html = html.replace(
    "check.innerText = status === 'read' ? '✓✓' : '✓';",
    "check.innerText = status === 'pending' ? '🕒' : (status === 'read' ? '✓✓' : '✓');"
);
html = html.replace(
    "check.innerText = (status === 'read' || status === 'delivered') ? '✓✓' : '✓';",
    "check.innerText = status === 'pending' ? '🕒' : ((status === 'read' || status === 'delivered') ? '✓✓' : '✓');"
);

fs.writeFileSync('index.html', html);
console.log('✅ Clock icon integrated for pending messages!');
