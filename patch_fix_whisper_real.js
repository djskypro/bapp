const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. FIX THE CHAT BUBBLE (appendMessage)
// ==========================================
// We will inject the Whisper logic at the very top of the rendering block.
// Based on your debug output, the code starts rendering inside the function right after `newMsg.id = ...`
const oldBubbleStart = `    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (replyData) {`;

const newBubbleStart = `    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (isWhisper) {
        newMsg.classList.add('whisper-msg');
        
        const label = document.createElement('div');
        label.className = 'whisper-label';
        label.innerText = '👻 Tap to reveal';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'whisper-content';
        contentDiv.appendChild(document.createTextNode(text));
        
        newMsg.appendChild(contentDiv);
        newMsg.appendChild(label);
        
        // Tap to reveal logic
        newMsg.onclick = function() {
            if (!newMsg.classList.contains('revealed')) {
                newMsg.classList.add('revealed');
                label.innerText = 'Auto-destructing...';
                
                // Auto destruct after 5 seconds
                setTimeout(() => {
                    newMsg.style.transition = 'opacity 1s, transform 1s';
                    newMsg.style.opacity = '0';
                    newMsg.style.transform = 'scale(0.8)';
                    setTimeout(() => newMsg.remove(), 1000); // Remove from DOM
                    
                    // Remove from localStorage
                    const chatId = activeChatId;
                    if (chatId) {
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + chatId)) || [];
                        msgs = msgs.filter(m => m.msgId !== id);
                        localStorage.setItem('bapp_msgs_' + chatId, JSON.stringify(msgs));
                    }
                }, 5000);
            }
        };
        
        // Stop execution here for whispers so it doesn't render normal text
        const spacer = document.getElementById('chat-spacer');
        if (spacer) msgBox.insertBefore(newMsg, spacer);
        else msgBox.appendChild(newMsg);
        msgBox.scrollTop = msgBox.scrollHeight;
        return; 
    }

    if (replyData) {`;

if (html.includes(oldBubbleStart)) {
    html = html.replace(oldBubbleStart, newBubbleStart);
} else {
    console.log("❌ Could not find exact appendMessage start block.");
}

// ==========================================
// 2. FIX THE CHAT LIST PREVIEW
// ==========================================
// Line 1509-1515 from your debug output
const oldPreview1 = `        if (last.isImage) {
          lastMsgText = '📷 Photo';
        } else if (last.isVoice || (last.text && last.text.startsWith('data:audio'))) {
          lastMsgText = '🎤 Voice Note';
        } else {
          lastMsgText = last.text;
        }`;

const newPreview1 = `        if (last.isWhisper) {
          lastMsgText = '👻 Whisper Message';
        } else if (last.isImage) {
          lastMsgText = '📷 Photo';
        } else if (last.isVoice || (last.text && last.text.startsWith('data:audio'))) {
          lastMsgText = '🎤 Voice Note';
        } else {
          lastMsgText = last.text;
        }`;

html = html.replace(oldPreview1, newPreview1);

// Line 2047-2051 from your debug output (Socket new_message preview update)
const oldPreview2 = `              lastMsgText = last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text);`;
const newPreview2 = `              lastMsgText = last.isWhisper ? '👻 Whisper Message' : (last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text));`;
html = html.replace(oldPreview2, newPreview2);

// Line 2079 from your debug output (typing preview)
const oldPreview3 = `              lastMsgText = last.isImage ? '📷 Photo' : last.text;`;
const newPreview3 = `              lastMsgText = last.isWhisper ? '👻 Whisper Message' : (last.isImage ? '📷 Photo' : last.text);`;
html = html.replace(oldPreview3, newPreview3);

// ==========================================
// 3. ADD THE BLUR CSS (Just in case it got deleted)
// ==========================================
if (!html.includes('.whisper-msg {')) {
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
</style>
</head>`;
    html = html.replace('</head>', whisperCSS);
}

fs.writeFileSync('index.html', html);
console.log('✅ Whisper logic injected into appendMessage and Chat List previews!');
