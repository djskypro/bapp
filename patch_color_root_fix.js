const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const finalOverride = `
  // ==========================================
  // FINAL FORCE OVERRIDE (Fixes all duplicates)
  // ==========================================
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';
    const currentColor = (myProfile && myProfile.bubbleColor) ? myProfile.bubbleColor : '#005c4b';

    // 1. Show on screen immediately
    window.appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, currentColor);
    input.value = '';

    // 2. Save to local memory
    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply, bubbleColor: currentColor });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();
    } catch(e) { console.error("Storage full"); }

    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    // 3. Send
    const payload = {
        type: 'send_message',
        to: to,
        from: myBappId,
        text: text,
        msgId: msgId,
        replyData: reply,
        bubbleColor: currentColor
    };

    if (isConnected) {
        socket.send(JSON.stringify(payload));
    } else {
        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
        queue.push(payload);
        localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
    }
  };

  // Final override for appendMessage to guarantee the color applies
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false, bubbleColor = null) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    // APPLY COLOR
    if (bubbleColor && type === 'sent') { 
        newMsg.style.setProperty('background', bubbleColor, 'important'); 
        newMsg.style.setProperty('background-color', bubbleColor, 'important'); 
    }
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        quote.style.cursor = 'pointer';
        quote.style.pointerEvents = 'auto';
        quote.onclick = function() { if(replyData.msgId) scrollToMessage(replyData.msgId); };
        newMsg.appendChild(quote);
    }

    if (isImage) {
      const img = document.createElement('img'); img.src = text; img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
      newMsg.appendChild(img);
    } else if (isVoice || (text && text.startsWith('data:audio'))) {
      const audio = document.createElement('audio'); audio.controls = true; audio.src = text; newMsg.appendChild(audio);
    } else {
      newMsg.appendChild(document.createTextNode(text));
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'pending' ? '🕒' : ((status === 'read' || status === 'delivered') ? '✓✓' : '✓');
      newMsg.appendChild(check);
    }
    
    if (typeof attachContextMenu === 'function' && !isDeleted) {
        attachContextMenu(newMsg, id, text, type === 'sent');
    }
    
    const spacer = document.getElementById('chat-spacer');
    if (spacer) msgBox.insertBefore(newMsg, spacer);
    else msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  };
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + finalOverride + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Final override applied! Colors will now work 100%.');
} else {
    console.log('❌ Could not find script tag.');
}
