const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlock = `      // Save locally
      if (typeof appendMessage === 'function') {
        appendMessage(text, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(popupChatId, payload);
      }`;

const newBlock = `      // Save locally to storage
      if (typeof saveMessage === 'function') {
        saveMessage(popupChatId, payload);
      } else {
        // Fallback if saveMessage isn't available
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + popupChatId)) || [];
        msgs.push({ text: text, type: 'sent', time: payload.timeStr, status: 'sent', msgId: payload.msgId });
        localStorage.setItem('bapp_msgs_' + popupChatId, JSON.stringify(msgs));
      }
      
      // If we are currently inside that chat, draw the bubble too
      if (typeof activeChatId !== 'undefined' && activeChatId === popupChatId && typeof appendMessage === 'function') {
        appendMessage(text, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
      }
      
      // Refresh the chat list so the last message updates
      if (typeof loadChatList === 'function') loadChatList();`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log("✅ Quick Reply now saves and updates the list!");
} else {
    console.log("❌ Could not find the block to replace.");
}
