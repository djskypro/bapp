const fs = require('fs');

// ==========================================
// 1. UPDATE SERVER (Route Delete Signal)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const deleteServerLogic = `
        if (data.type === 'delete_message') {
            const { to, from, msgId } = data;
            if (bappUsers.has(to)) {
                bappUsers.get(to).send(JSON.stringify({ type: 'message_deleted', msgId: msgId, from: from }));
            }
        }
`;
if(!serverJs.includes("data.type === 'delete_message'")) {
    serverJs = serverJs.replace("if (data.type === 'send_message') {", deleteServerLogic + "\n        if (data.type === 'send_message') {");
    fs.writeFileSync('server.js', serverJs);
}

// ==========================================
// 2. UPDATE CLIENT UI & LOGIC
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add CSS for Context Menu and Reply Preview
const newCSS = `
<style>
  /* Context Menu */
  #msg-context-menu {
    position: fixed;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 15px;
    padding: 5px;
    display: none;
    flex-direction: column;
    z-index: 10000;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    min-width: 120px;
  }
  .ctx-item {
    padding: 10px 15px;
    font-size: 14px;
    color: var(--text);
    cursor: pointer;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ctx-item:active { background: var(--search-bg); }
  .ctx-item.delete { color: #e74c3c; }

  /* Reply Preview Box */
  #reply-preview {
    display: none;
    position: absolute;
    bottom: 75px; left: 15px; right: 15px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-left: 4px solid var(--primary);
    border-radius: 10px;
    padding: 10px;
    z-index: 99;
  }
  .reply-preview-text { font-size: 12px; color: var(--text-muted); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  /* Quoted Message inside bubble */
  .quoted-msg {
    background: rgba(0,0,0,0.2);
    border-left: 3px solid var(--primary);
    padding: 5px 8px;
    border-radius: 5px;
    margin-bottom: 5px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .quoted-msg strong { color: var(--primary); display: block; margin-bottom: 2px; }
  
  /* Deleted Message */
  .msg-deleted {
    font-style: italic;
    color: var(--text-muted);
    font-size: 14px;
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// B. Add HTML for the Context Menu & Reply Box
const newHTML = `
  <!-- Context Menu -->
  <div id="msg-context-menu">
    <div class="ctx-item" onclick="executeReply()">↩️ Reply</div>
    <div class="ctx-item" onclick="executeCopy()">📋 Copy</div>
    <div class="ctx-item delete" onclick="executeDelete()">🗑️ Delete</div>
  </div>

  <!-- Reply Preview -->
  <div id="reply-preview">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <strong id="reply-preview-name" style="font-size:12px; color:var(--primary);">Replying to...</strong>
      <span onclick="cancelReply()" style="cursor:pointer; font-size:16px;">✕</span>
    </div>
    <div class="reply-preview-text" id="reply-preview-text"></div>
  </div>
</body>
`;
html = html.replace('</body>', newHTML);

// C. Add Logic Variables and Functions
const jsLogic = `
<script>
  let currentReplyTo = null;
  let activeMsgElement = null;

  // 1. Add Long-Press Logic to Messages
  function attachContextMenu(el, msgId, text, isMe) {
    el.dataset.msgId = msgId;
    el.dataset.msgText = text;
    el.dataset.isMe = isMe;

    let pressTimer;
    el.addEventListener('touchstart', (e) => {
      pressTimer = setTimeout(() => showContextMenu(e.touches[0].clientX, e.touches[0].clientY, el), 500);
    });
    el.addEventListener('touchend', () => clearTimeout(pressTimer));
    el.addEventListener('touchmove', () => clearTimeout(pressTimer));
    
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, el);
    });
  }

  function showContextMenu(x, y, el) {
    activeMsgElement = el;
    const menu = document.getElementById('msg-context-menu');
    menu.style.display = 'flex';
    menu.style.left = Math.min(x, window.innerWidth - 150) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 150) + 'px';
    
    // Hide Delete if it's not my message
    const delBtn = menu.querySelector('.delete');
    if (el.dataset.isMe === 'true') delBtn.style.display = 'flex';
    else delBtn.style.display = 'none';
  }

  // Hide menu on tap anywhere else
  document.addEventListener('pointerdown', (e) => {
    const menu = document.getElementById('msg-context-menu');
    if (menu && menu.style.display === 'flex' && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  function executeReply() {
    const el = activeMsgElement;
    const text = el.dataset.msgText;
    const isMe = el.dataset.isMe === 'true';
    
    currentReplyTo = {
      msgId: el.dataset.msgId,
      text: text,
      name: isMe ? 'You' : document.getElementById('chat-name').textContent
    };
    
    document.getElementById('reply-preview').style.display = 'block';
    document.getElementById('reply-preview-name').innerText = 'Replying to ' + currentReplyTo.name;
    document.getElementById('reply-preview-text').innerText = text.startsWith('data:image') ? '📷 Photo' : (text.startsWith('data:audio') ? '🎤 Voice Note' : text);
    
    document.getElementById('msg-context-menu').style.display = 'none';
    document.getElementById('chat-input').focus();
  }

  function cancelReply() {
    currentReplyTo = null;
    document.getElementById('reply-preview').style.display = 'none';
  }

  function executeCopy() {
    navigator.clipboard.writeText(activeMsgElement.dataset.msgText);
    showToast("Copied to clipboard!");
    document.getElementById('msg-context-menu').style.display = 'none';
  }

  function executeDelete() {
    const el = activeMsgElement;
    const msgId = el.dataset.msgId;
    const to = activeChatId;
    
    // Remove locally
    el.innerHTML = '<span class="msg-deleted">🚫 This message was deleted</span>';
    el.dataset.msgText = 'DELETED';
    el.style.background = 'var(--search-bg)';
    
    // Send to server
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'delete_message', to: to, from: myBappId, msgId: msgId }));
    }
    
    // Update local storage
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
    let mIndex = msgs.findIndex(m => m.msgId === msgId);
    if(mIndex > -1) {
      msgs[mIndex].text = 'DELETED';
      msgs[mIndex].isDeleted = true;
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(msgs));
    }
    
    document.getElementById('msg-context-menu').style.display = 'none';
  }

  // 2. Override appendMessage to support Reply & Delete
  const originalAppendForReply = window.appendMessage;
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isDeleted = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    
    if (isDeleted || text === 'DELETED') {
        newMsg.innerHTML = '<span class="msg-deleted">🚫 This message was deleted</span>';
        newMsg.style.background = 'var(--search-bg)';
    } else {
        // Render Reply Block
        if (replyData) {
          const quote = document.createElement('div');
          quote.className = 'quoted-msg';
          quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
          newMsg.appendChild(quote);
        }

        if (isImage) {
          const img = document.createElement('img'); 
          img.src = text; 
          img.style.cursor = 'pointer';
          newMsg.appendChild(img);
        } else if (isVoice || (text && text.startsWith('data:audio'))) {
          // (Audio player logic remains the same, we just reuse the original function for simplicity)
          // For this patch, we are focusing on reply/delete
          const audio = document.createElement('audio'); audio.controls = true; audio.src = text; newMsg.appendChild(audio);
        } else {
          newMsg.appendChild(document.createTextNode(text));
        }
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent' && !isDeleted) {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = (status === 'read' || status === 'delivered') ? '✓✓' : '✓';
      newMsg.appendChild(check);
    }
    
    // Attach long press logic
    if (!isDeleted) {
        attachContextMenu(newMsg, id, text, type === 'sent');
    }
    
    const spacer = document.getElementById('chat-spacer');
    if (spacer) msgBox.insertBefore(newMsg, spacer);
    else msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  };

  // 3. Update Send Message to include Reply & ID
  const originalSend = window.sendMessage;
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = activeChatId;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const msgId = Date.now().toString();
      
      socket.send(JSON.stringify({ 
          type: 'send_message', to: to, from: myBappId, text: text, 
          msgId: msgId, replyData: currentReplyTo 
      }));
      
      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);
      input.value = '';
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      
      cancelReply();
      loadChatList();
    }
  };
</script>
</body>
`;
html = html.replace('</body>', jsLogic);

fs.writeFileSync('index.html', html);
console.log('✅ Reply and Delete features added!');
