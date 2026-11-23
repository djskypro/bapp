const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact block we want to replace
const oldTyping = `if (data.type === 'typing') {
        const senderId = (data.from || '').trim();
        if (activeChatId === senderId) {
          document.getElementById('chat-subtitle').innerText = data.isTyping ? 'typing...' : '🔒 End-to-End Encrypted';
          document.getElementById('chat-subtitle').style.color = data.isTyping ? 'var(--primary)' : 'var(--text-muted)';
        }
      }`;

// The new block with Chat List logic
const newTyping = `if (data.type === 'typing') {
        const senderId = (data.from || '').trim();

        // 1. Update inside the active chat
        if (activeChatId === senderId) {
          document.getElementById('chat-subtitle').innerText = data.isTyping ? 'typing...' : '🔒 End-to-End Encrypted';
          document.getElementById('chat-subtitle').style.color = data.isTyping ? 'var(--primary)' : 'var(--text-muted)';
        }

        // 2. Update the Chat List on the Home Screen
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isTyping) {
            previewEl.innerText = 'typing...';
            previewEl.style.color = 'var(--primary)'; 
            previewEl.style.fontWeight = 'bold';
            previewEl.style.fontStyle = 'italic';
          } else {
            // Revert back to the last message when they stop typing
            const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            let lastMsgText = 'Tap to chat';
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              lastMsgText = last.isImage ? '📷 Photo' : last.text;
            }
            previewEl.innerText = lastMsgText;
            previewEl.style.color = 'var(--text-muted)';
            previewEl.style.fontWeight = 'normal';
            previewEl.style.fontStyle = 'normal';
          }
        }
      }`;

if (html.includes(oldTyping)) {
    html = html.replace(oldTyping, newTyping);
    fs.writeFileSync('index.html', html);
    console.log('✅ Chat List typing indicator added successfully!');
} else {
    console.log('❌ Could not find the exact typing block. Aborting to prevent crashes.');
}
