const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Forward msgId and replyData)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add msgId and replyData to server variables
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData } = data;"
);

// Forward to online user
serverJs = serverJs.replace(
    "bappUsers.get(cleanTo).send(JSON.stringify({ \n                    type: 'new_message', \n                    from: from, \n                    text: text, \n                    isImage: isImage || false, \n                    isVoice: isVoice || false \n                }));",
    "bappUsers.get(cleanTo).send(JSON.stringify({ \n                    type: 'new_message', \n                    from: from, \n                    text: text, \n                    isImage: isImage || false, \n                    isVoice: isVoice || false,\n                    msgId: msgId,\n                    replyData: replyData\n                }));"
);

// Save to offline DB
serverJs = serverJs.replace(
    "db[cleanTo].push({ \n                    from: from, \n                    text: text, \n                    isImage: isImage || false, \n                    isVoice: isVoice || false \n                });",
    "db[cleanTo].push({ \n                    from: from, \n                    text: text, \n                    isImage: isImage || false, \n                    isVoice: isVoice || false,\n                    msgId: msgId,\n                    replyData: replyData\n                });"
);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT (UI and Logic)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add CSS for the quoted message just in case it got lost
if (!html.includes('.quoted-msg {')) {
    const css = `
<style>
  .quoted-msg {
    background: rgba(0,0,0,0.2);
    border-left: 3px solid var(--primary);
    padding: 5px 8px;
    border-radius: 5px;
    margin-bottom: 5px;
    font-size: 12px;
    color: var(--text-muted);
    display: flex; flex-direction: column;
  }
  .quoted-msg strong { color: var(--primary); margin-bottom: 2px; }
</style>
</head>`;
    html = html.replace('</head>', css);
}

// B. Update sendMessage (exact code from your terminal)
const oldSend = `  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').textContent.trim();
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'send_message', to: activeChatId, from: myBappId, text: text }));
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      appendMessage(text, 'sent', now, 'sent');
      input.value = '';
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + activeChatId)) || [];
      savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent' });
      localStorage.setItem('bapp_msgs_' + activeChatId, JSON.stringify(savedMsgs));
      loadChatList();
    }
  }`;

const newSend = `  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').textContent.trim();
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
      
      if (typeof cancelReply === 'function') cancelReply(); // Hide preview after sending
    }
  }`;
html = html.replace(oldSend, newSend);

// C. Update appendMessage to accept and render replyData
const oldAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;

    if (isImage) {`;

const newAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    // Render the Quoted Message if it exists
    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        newMsg.appendChild(quote);
    }

    if (isImage) {`;
html = html.replace(oldAppendStart, newAppendStart);

// D. Update the Receiver (socket.onmessage) - Using regex to catch both duplicate blocks in your file
const receiveRegex = /savedMsgs\.push\(\{ text: data\.text, type: 'received', time: now, isImage: data\.isImage, isVoice: data\.isVoice \}\);/g;
html = html.replace(receiveRegex, "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData });");

const appendCallRegex = /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice\);/g;
html = html.replace(appendCallRegex, "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData);");

// E. Update openChat to load old quoted messages correctly
const oldForEach = `savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice));`;
const newForEach = `savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData));`;
html = html.replace(oldForEach, newForEach);

// F. Update Image Upload to include reply data
const oldImgUpload = `        const base64Img = canvas.toDataURL('image/jpeg', 0.6); 
        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true }));
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        appendMessage(base64Img, 'sent', now, 'sent', true);`;
const newImgUpload = `        const base64Img = canvas.toDataURL('image/jpeg', 0.6); 
        const msgId = Date.now().toString();
        const reply = currentReplyTo;
        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true, msgId: msgId, replyData: reply }));
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        appendMessage(base64Img, 'sent', now, 'sent', true, false, msgId, reply);`;
html = html.replace(oldImgUpload, newImgUpload);

fs.writeFileSync('index.html', html);
console.log('✅ Quoted reply rendering successfully added to both Server and UI!');
