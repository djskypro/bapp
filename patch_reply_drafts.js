const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Initialize the reply memory object
if (!html.includes('window.replyState = {};')) {
    html = html.replace("let activeChatId = null;", "let activeChatId = null;\n  window.replyState = {};");
}

// 2. Fix goBack() so it only hides the preview visually, but doesn't delete the saved reply
html = html.replace(
  "if (typeof cancelReply === 'function') cancelReply(); // Hide reply preview",
  "document.getElementById('reply-preview').style.display = 'none'; // Hide visually, keep in memory"
);

// 3. Update openChat() to check if there is a saved reply for the chat you are opening
const oldOpenChatFix = `    // --- FIX: CLEAR PREVIOUS REPLY STATE ---
    const replyBox = document.getElementById('reply-preview');
    if (replyBox) replyBox.style.display = 'none';
    if (typeof currentReplyTo !== 'undefined') window.currentReplyTo = null;
    // ---------------------------------------`;
    
const newOpenChatFix = `    // --- RESTORE REPLY STATE FOR THIS CHAT ---
    const replyBox = document.getElementById('reply-preview');
    if (window.replyState && window.replyState[id]) {
        currentReplyTo = window.replyState[id];
        if (replyBox) {
            replyBox.style.display = 'block';
            document.getElementById('reply-preview-name').innerText = 'Replying to ' + currentReplyTo.name;
            document.getElementById('reply-preview-text').innerText = currentReplyTo.text.startsWith('data:image') ? '📷 Photo' : (currentReplyTo.text.startsWith('data:audio') ? '🎤 Voice Note' : currentReplyTo.text);
        }
    } else {
        currentReplyTo = null;
        if (replyBox) replyBox.style.display = 'none';
    }
    // ---------------------------------------`;
    
html = html.replace(oldOpenChatFix, newOpenChatFix);

// 4. Update executeReply() to save the reply into memory when you swipe
const oldExecuteReply = `    currentReplyTo = {
      msgId: el.dataset.msgId,
      text: text,
      name: isMe ? 'You' : document.getElementById('chat-name').textContent
    };`;
    
const newExecuteReply = `    currentReplyTo = {
      msgId: el.dataset.msgId,
      text: text,
      name: isMe ? 'You' : document.getElementById('chat-name').textContent
    };
    window.replyState[activeChatId] = currentReplyTo; // Save to memory`;
    
html = html.replace(oldExecuteReply, newExecuteReply);

// 5. Update cancelReply() so if you click the X, it deletes it from memory
const oldCancelReply = `  function cancelReply() {
    currentReplyTo = null;
    document.getElementById('reply-preview').style.display = 'none';
  }`;
    
const newCancelReply = `  function cancelReply() {
    currentReplyTo = null;
    if (window.replyState) delete window.replyState[activeChatId]; // Delete from memory
    document.getElementById('reply-preview').style.display = 'none';
  }`;
    
html = html.replace(oldCancelReply, newCancelReply);

fs.writeFileSync('index.html', html);
console.log('✅ Per-chat reply drafts activated!');
