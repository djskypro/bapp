const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Forward msgId and replyData safely)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add msgId and replyData to destructured variables
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData } = data;"
);

// Add them to the payload sent to the online user
serverJs = serverJs.replace(
    /isVoice: isVoice \|\| false/g,
    "isVoice: isVoice || false, msgId: msgId, replyData: replyData"
);

fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add the Highlight CSS
const css = `
<style>
  .msg.highlight-flash {
    background-color: rgba(37, 211, 102, 0.8) !important;
    transition: background-color 0.5s ease;
  }
</style>
</head>`;
if(!html.includes('.msg.highlight-flash')) {
    html = html.replace('</head>', css);
}

// B. Add the scrollToMessage function right before executeReply
const scrollFunc = `
  function scrollToMessage(msgId) {
    if(!msgId) return;
    const target = document.getElementById('msg-' + msgId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('highlight-flash');
      setTimeout(() => {
        target.classList.remove('highlight-flash');
      }, 3000);
    }
  }

  function executeReply() {`;
html = html.replace("function executeReply() {", scrollFunc);

// C. Update appendMessage signature and inject ID + Quote HTML
const oldAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;`;

const newAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        if (replyData.msgId) {
            quote.style.cursor = 'pointer';
            quote.onclick = function() { scrollToMessage(replyData.msgId); };
        }
        newMsg.appendChild(quote);
    }`;

html = html.replace(oldAppendStart, newAppendStart);

// D. Update sendMessage to generate and pass msgId & replyData
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
      
      socket.send(JSON.stringify({ type: 'send_message', to: activeChatId, from: myBappId, text: text, msgId: msgId, replyData: currentReplyTo }));
      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);
      input.value = '';
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + activeChatId)) || [];
      savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo });
      localStorage.setItem('bapp_msgs_' + activeChatId, JSON.stringify(savedMsgs));
      loadChatList();
      
      if (typeof cancelReply === 'function') cancelReply();
    }
  }`;
html = html.replace(oldSend, newSend);

// E. Update handleImageUpload
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

// F. Update Socket Receiver (using regex for safety)
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData);"
);
html = html.replace(
    /savedMsgs\.push\(\{ text: data\.text, type: 'received', time: now, isImage: data\.isImage, isVoice: data\.isVoice \}\);/g,
    "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData });"
);

// G. Update openChat loading loop
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData));"
);

fs.writeFileSync('index.html', html);
console.log('✅ Fixed! Clicking a quote will now jump to the original message and flash green.');
