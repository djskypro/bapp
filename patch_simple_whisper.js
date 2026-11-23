const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Forward isWhisper perfectly)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Replace the send logic to ensure isWhisper is passed
const serverSendRegex = /bappUsers\.get\(cleanTo\)\.send\(JSON\.stringify\(\{[\s\S]*?\}\)\);/;
const newServerSend = `bappUsers.get(cleanTo).send(JSON.stringify({ 
                    type: 'new_message', 
                    from: from, 
                    text: text, 
                    isImage: isImage || false, 
                    isVoice: isVoice || false,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper || false
                }));`;
serverJs = serverJs.replace(serverSendRegex, newServerSend);

fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT (Simple Tap to Reveal)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add simple CSS
if (!html.includes('.whisper-locked')) {
    const css = `
<style>
  .whisper-locked {
    background: #222 !important;
    border: 2px dashed #555;
    color: #aaa;
    text-align: center;
    font-weight: bold;
    cursor: pointer;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .whisper-locked:active {
    background: #333 !important;
  }
</style>
</head>`;
    html = html.replace('</head>', css);
}

// B. Replace appendMessage entirely to guarantee it works
const startAppend = html.indexOf('  function appendMessage(');
const endAppend = html.indexOf('  function sendMessage()');

const newAppend = `
  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    // --- WHISPER LOGIC ---
    // If it's a whisper AND it's a received message, lock it!
    if (isWhisper && type === 'received') {
        newMsg.classList.add('whisper-locked');
        newMsg.innerHTML = '🔒 Tap here to view secret message';
        
        newMsg.onclick = function() {
            // Unlock the message
            newMsg.classList.remove('whisper-locked');
            newMsg.innerHTML = ''; // Clear the lock text
            
            // Render the real message (without the whisper flag)
            renderNormalMessage(newMsg, text, type, timeStr, status, isImage, isVoice, replyData);
        };
    } else {
        // Sender's side (or normal message)
        renderNormalMessage(newMsg, text, type, timeStr, status, isImage, isVoice, replyData);
    }

    const spacer = document.getElementById('chat-spacer');
    if (spacer) msgBox.insertBefore(newMsg, spacer);
    else msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  // Helper function to render the actual content (Text, Image, Audio)
  function renderNormalMessage(newMsg, text, type, timeStr, status, isImage, isVoice, replyData) {
    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        newMsg.appendChild(quote);
    }

    if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      newMsg.appendChild(img);
    } else if (isVoice || (text && text.startsWith('data:audio'))) {
      const audio = document.createElement('audio'); 
      audio.controls = true; 
      audio.src = text; 
      newMsg.appendChild(audio);
    } else {
      newMsg.appendChild(document.createTextNode(text));
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr;
    newMsg.appendChild(timeSpan);

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = (status === 'read' || status === 'delivered') ? '✓✓' : '✓';
      newMsg.appendChild(check);
    }
  }

`;
html = html.substring(0, startAppend) + newAppend + html.substring(endAppend);

// C. Ensure sendMessage passes isWhisper
html = html.replace(
    "socket.send(JSON.stringify({ type: 'send_message', to: activeChatId, from: myBappId, text: text, msgId: msgId, replyData: currentReplyTo }));",
    "socket.send(JSON.stringify({ type: 'send_message', to: activeChatId, from: myBappId, text: text, msgId: msgId, replyData: currentReplyTo, isWhisper: window.isWhisperMode }));"
);
html = html.replace(
    "appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);",
    "appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, window.isWhisperMode);"
);

// D. Ensure Receive passes isWhisper
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper);"
);

// E. Ensure Loading Old Messages passes isWhisper
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));"
);

fs.writeFileSync('index.html', html);
console.log('✅ Simple Lock & Tap Whisper logic applied!');
