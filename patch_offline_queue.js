const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. REWRITE sendMessage (Queue if offline)
// ==========================================
const oldSendFunc = `  function sendMessage() {
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
    }
  }`;

const newSendFunc = `  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';

    // 1. Show on screen immediately (with a clock if offline)
    appendMessage(text, 'sent', now, status, false, false, msgId, reply);
    input.value = '';

    // 2. Save to local memory
    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();
    } catch(e) { console.error("Storage full"); }

    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    // 3. Send now OR save to Offline Queue
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
  }`;

html = html.replace(oldSendFunc, newSendFunc);

// ==========================================
// 2. FLUSH QUEUE ON RECONNECT
// ==========================================
const oldOnopen = `  socket.onopen = () => {
    console.log("✅ Connected to server.");
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
  };`;

const newOnopen = `  socket.onopen = () => {
    console.log("✅ Connected to server.");
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    
    // FLUSH OFFLINE QUEUE
    let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
    if (queue.length > 0) {
        console.log(\`📤 Sending \${queue.length} queued messages...\`);
        queue.forEach(payload => {
            socket.send(JSON.stringify(payload));
        });
        localStorage.removeItem('bapp_offline_queue');
        
        // Update statuses in local memory to 'sent'
        queue.forEach(payload => {
            let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + payload.to)) || [];
            let m = msgs.find(msg => msg.msgId === payload.msgId);
            if (m) m.status = 'sent';
            localStorage.setItem('bapp_msgs_' + payload.to, JSON.stringify(msgs));
        });
        loadChatList();
    }
  };`;

html = html.replace(oldOnopen, newOnopen);

// ==========================================
// 3. UPDATE THE TICK ICON TO SHOW A CLOCK FOR PENDING
// ==========================================
const oldTick = `check.innerText = (status === 'read' || status === 'delivered') ? '✓✓' : '✓';`;
const newTick = `check.innerText = status === 'pending' ? '🕒' : ((status === 'read' || status === 'delivered') ? '✓✓' : '✓');`;
html = html.replace(oldTick, newTick);

// Also update the reconnect logic in case that's what triggers the onopen
html = html.replace(
    "socket.onopen = () => {\n        console.log(\"✅ Reconnected successfully!\");",
    "socket.onopen = () => {\n        console.log(\"✅ Reconnected successfully!\");\n        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];\n        if (queue.length > 0) {\n            queue.forEach(payload => socket.send(JSON.stringify(payload)));\n            localStorage.removeItem('bapp_offline_queue');\n        }"
);

fs.writeFileSync('index.html', html);
console.log('✅ Offline message queueing activated!');
