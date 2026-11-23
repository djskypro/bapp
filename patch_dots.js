const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the CSS for the bouncing dots
const cssToAdd = `
  /* Bouncing Typing Dots */
  .typing-dots span {
    display: inline-block;
    animation: typingBounce 1.4s infinite ease-in-out both;
    color: var(--primary);
    font-weight: bold;
    font-size: 20px;
    line-height: 10px;
    margin-left: 1px;
  }
  .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
</style>
`;
html = html.replace('</style>', cssToAdd);

// 2. Replace the text with the bouncing dots HTML
const oldTypingLogic = `if (data.type === 'typing') {
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

const newTypingLogic = `if (data.type === 'typing') {
        const senderId = (data.from || '').trim();
        const dotsHTML = 'typing <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';

        // 1. Update inside the active chat header
        if (activeChatId === senderId) {
          document.getElementById('chat-subtitle').innerHTML = data.isTyping ? dotsHTML : '🔒 End-to-End Encrypted';
        }

        // 2. Update the Chat List on the Home Screen
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isTyping) {
            previewEl.innerHTML = dotsHTML;
          } else {
            // Revert back to the last message when they stop typing
            const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            let lastMsgText = 'Tap to chat';
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              lastMsgText = last.isImage ? '📷 Photo' : last.text;
            }
            previewEl.innerText = lastMsgText;
          }
        }
      }`;

if (html.includes(oldTypingLogic)) {
    html = html.replace(oldTypingLogic, newTypingLogic);
    fs.writeFileSync('index.html', html);
    console.log('✅ Bouncing typing dots added successfully!');
} else {
    console.log('❌ Could not find the typing block. Aborting.');
}
