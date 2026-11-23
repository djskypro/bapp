const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Forward isWhisper flag)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add isWhisper to the destructured variables
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice, msgId, replyData } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper } = data;"
);

// Forward to online user
serverJs = serverJs.replace(
    "replyData: replyData\n                }));",
    "replyData: replyData,\n                    isWhisper: isWhisper\n                }));"
);

// Save to offline DB
serverJs = serverJs.replace(
    "replyData: replyData\n                });",
    "replyData: replyData,\n                    isWhisper: isWhisper\n                });"
);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT (The Whisper UI & Logic)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add CSS for Whisper messages
const whisperCSS = `
<style>
  .whisper-msg {
    background: rgba(0,0,0,0.6) !important;
    border: 1px solid #555;
    border-radius: 12px;
    padding: 15px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .whisper-content {
    filter: blur(6px);
    transition: filter 0.3s ease;
    user-select: none;
  }
  .whisper-msg.revealed .whisper-content {
    filter: blur(0px);
    user-select: text;
  }
  .whisper-label {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    color: #fff; font-weight: bold; font-size: 14px; text-shadow: 0 0 10px #000;
    pointer-events: none; transition: opacity 0.3s;
  }
  .whisper-msg.revealed .whisper-label { opacity: 0; }
  
  /* Panic Overlay */
  #panic-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #000; z-index: 99999; display: none;
    justify-content: center; align-items: center;
    color: white; font-size: 20px; font-family: monospace;
  }
</style>
</head>
`;
html = html.replace('</head>', whisperCSS);

// B. Add the Panic Overlay HTML
html = html.replace('</body>', `
<div id="panic-overlay"><h1>SECURITY VIOLATION</h1></div>
<script>
  // Screenshot detection (Flashing screen black)
  document.addEventListener('keyup', function(e) {
    if (e.key === 'PrintScreen') {
      navigator.clipboard.writeText(''); // Clear clipboard
      const overlay = document.getElementById('panic-overlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.style.display = 'none', 2000);
    }
  });
</script>
</body>`);

// C. Add the Whisper Toggle Button (a ghost icon next to the input)
const oldInputArea = `    <div id="mic-btn" onclick="startRecording()"`;
const newInputArea = `    <div id="whisper-toggle" onclick="toggleWhisperMode()" style="font-size: 20px; padding: 5px; cursor: pointer; opacity: 0.5; transition: 0.2s;">👻</div>
    <div id="mic-btn" onclick="startRecording()"`;
if(html.includes(oldInputArea)) {
    html = html.replace(oldInputArea, newInputArea);
}

// D. Update appendMessage to render whispers
const oldAppendStart = `    if (isImage) {`;

const newAppendStart = `    // --- WHISPER MESSAGE LOGIC ---
    if (isWhisper) {
        newMsg.classList.add('whisper-msg');
        
        const label = document.createElement('div');
        label.className = 'whisper-label';
        label.innerText = '👻 Tap to reveal';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'whisper-content';
        
        // Add text to the blurred content
        const textNode = document.createTextNode(text);
        contentDiv.appendChild(textNode);
        
        newMsg.appendChild(contentDiv);
        newMsg.appendChild(label);
        
        newMsg.onclick = function() {
            if (!newMsg.classList.contains('revealed')) {
                newMsg.classList.add('revealed');
                label.innerText = 'Auto-destructing...';
                
                // Auto destruct after 5 seconds
                setTimeout(() => {
                    newMsg.style.transition = 'opacity 1s, transform 1s';
                    newMsg.style.opacity = '0';
                    newMsg.style.transform = 'scale(0.8)';
                    setTimeout(() => newMsg.remove(), 1000);
                }, 5000);
            }
        };
        
    } else if (isImage) {`;

html = html.replace(oldAppendStart, newAppendStart);

// E. Update sendMessage to handle Whisper Mode
const oldSend = `      socket.send(JSON.stringify({ type: 'send_message', to: activeChatId, from: myBappId, text: text, msgId: msgId, replyData: currentReplyTo }));
      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);`;

const newSend = `      socket.send(JSON.stringify({ type: 'send_message', to: activeChatId, from: myBappId, text: text, msgId: msgId, replyData: currentReplyTo, isWhisper: window.isWhisperMode }));
      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, window.isWhisperMode);`;
html = html.replace(oldSend, newSend);

// F. Add toggleWhisperMode function
const whisperLogic = `
  window.isWhisperMode = false;
  function toggleWhisperMode() {
    window.isWhisperMode = !window.isWhisperMode;
    const btn = document.getElementById('whisper-toggle');
    if (window.isWhisperMode) {
      btn.style.opacity = '1';
      btn.style.textShadow = '0 0 10px #fff';
      document.getElementById('chat-input').placeholder = "Whisper message...";
    } else {
      btn.style.opacity = '0.5';
      btn.style.textShadow = 'none';
      document.getElementById('chat-input').placeholder = "Message";
    }
  }
`;
html = html.replace("function openSettings()", whisperLogic + "\n  function openSettings()");

// G. Update receive message logic
html = html.replace(
    "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData });",
    "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper });"
);
html = html.replace(
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData);",
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper);"
);

// H. Update appendMessage signature to accept isWhisper
html = html.replace(
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null) {",
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {"
);

// I. Update openChat loading loop
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));"
);

fs.writeFileSync('index.html', html);
console.log('✅ Anonymous Whisper Messages activated!');
