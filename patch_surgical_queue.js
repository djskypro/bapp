const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the exact boundaries of the sendMessage function
const startStr = "function sendMessage() {";
const endStr = "function handleEnter(e) {";

const startIdx = html.indexOf(startStr);
const endIdx = html.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newSendFunction = `function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';

    // 1. Show on screen immediately
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
  }

  `;
    
    // Replace the whole messy block
    html = html.substring(0, startIdx) + newSendFunction + html.substring(endIdx);
    console.log('✅ sendMessage function replaced perfectly!');
} else {
    console.log('❌ Could not find boundaries for sendMessage.');
}

// 2. Update all tick rendering to support 'pending'
html = html.replace(/check\.innerText = status === 'read' \? '✓✓' : '✓';/g, "check.innerText = status === 'pending' ? '🕒' : (status === 'read' ? '✓✓' : '✓');");
html = html.replace(/check\.innerText = \(status === 'read' \|\| status === 'delivered'\) \? '✓✓' : '✓';/g, "check.innerText = status === 'pending' ? '🕒' : ((status === 'read' || status === 'delivered') ? '✓✓' : '✓');");

fs.writeFileSync('index.html', html);
console.log('✅ All tick icons updated to support pending state!');
