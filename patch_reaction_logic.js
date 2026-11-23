const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const reactionLogic = `
  function addReaction(emoji) {
    if (!activeMsgElement) return;
    
    // Find the message ID from the element
    const msgId = activeMsgElement.id.replace('msg-', '');
    
    // Remove any existing reaction on this element
    const existing = activeMsgElement.querySelector('.reaction-bubble');
    if (existing) existing.remove();

    // Add the new reaction to the DOM
    const reactionEl = document.createElement('div');
    reactionEl.className = 'reaction-bubble';
    reactionEl.innerText = emoji;
    reactionEl.style.cssText = 'position:absolute; bottom:-10px; right:-10px; background:rgba(20,20,20,0.9); padding:2px 6px; border-radius:10px; font-size:14px; border:1px solid rgba(255,255,255,0.2); z-index:10;';
    activeMsgElement.appendChild(reactionEl);

    // Save to local storage
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + activeChatId)) || [];
    msgs = msgs.map(m => {
      if (m.msgId === msgId) m.reaction = emoji;
      return m;
    });
    localStorage.setItem('bapp_msgs_' + activeChatId, JSON.stringify(msgs));

    // Send to the other user
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message_reaction',
        to: activeChatId,
        from: myBappId,
        msgId: msgId,
        emoji: emoji
      }));
    }

    // Close the context menu
    closeMsgContextMenu();
  }
`;

// Insert right before executeReply
html = html.replace('function executeReply()', reactionLogic + '\n  function executeReply()');

fs.writeFileSync('index.html', html);
console.log("✅ Reaction logic added!");
