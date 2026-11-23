const fs = require('fs');

// ==========================================
// 1. SAFE SERVER PATCH
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Check if the recording route is already there. If not, add it safely before 'typing'
if (!serverJs.includes("data.type === 'recording'")) {
    const safeServerInsert = `
        if (data.type === 'recording') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify({ type: 'recording', from: data.from, isRecording: data.isRecording }));
            }
        }
`;
    serverJs = serverJs.replace("if (data.type === 'typing') {", safeServerInsert + "\n        if (data.type === 'typing') {");
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server safely patched for recording signal.');
}

// ==========================================
// 2. SAFE CLIENT PATCH
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Find the exact recording block inside the socket listener
const oldSocketBlock = `if (data.type === 'recording') {
        const senderId = (data.from || '').trim();
        if (activeChatId === senderId) {
          const sub = document.getElementById('chat-subtitle');
          if (data.isRecording) {
            sub.innerText = '🔴 recording audio...';
            sub.style.color = '#e74c3c';
            sub.style.fontWeight = 'bold';
          } else {
            sub.innerText = '🔒 End-to-End Encrypted';
            sub.style.color = 'var(--text-muted)';
            sub.style.fontWeight = 'normal';
          }
        }
      }`;

const newSocketBlock = `if (data.type === 'recording') {
        const senderId = (data.from || '').trim();
        
        // 1. Update inside the chat
        if (activeChatId === senderId) {
          const sub = document.getElementById('chat-subtitle');
          if (data.isRecording) {
            sub.innerText = '🔴 recording audio...';
            sub.style.color = '#e74c3c';
            sub.style.fontWeight = 'bold';
          } else {
            sub.innerText = '🔒 End-to-End Encrypted';
            sub.style.color = 'var(--text-muted)';
            sub.style.fontWeight = 'normal';
          }
        }

        // 2. Update the Chat List preview
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isRecording) {
            previewEl.innerText = '🔴 recording audio...';
            previewEl.style.color = '#e74c3c';
            previewEl.style.fontWeight = 'bold';
          } else {
            // Revert to last message
            const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            let lastMsgText = 'Tap to chat';
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              lastMsgText = last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text);
            }
            previewEl.innerText = lastMsgText;
            previewEl.style.color = 'var(--text-muted)';
            previewEl.style.fontWeight = 'normal';
          }
        }
      }`;

if (html.includes(oldSocketBlock)) {
    html = html.replace(oldSocketBlock, newSocketBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Client safely patched for Chat List recording preview.');
} else {
    console.log('⚠️ Could not find the exact recording block. Maybe the backup didn\'t have it?');
}
