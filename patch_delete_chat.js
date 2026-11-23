const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Delete Chat button right after Clear Chat
const oldClearBtn = `    <div onclick="clearCurrentChat()" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer;">
      <span style="font-size:20px;">🗑️</span>
      <span style="font-size:16px; font-weight:500;">Clear Chat</span>
    </div>`;

const newClearBtn = oldClearBtn + `

    <div onclick="deleteCurrentChat()" style="display:flex; align-items:center; gap:15px; padding:15px; background:rgba(231, 76, 60, 0.2); border-radius:15px; cursor:pointer;">
      <span style="font-size:20px;">❌</span>
      <span style="font-size:16px; font-weight:500; color:#e74c3c;">Delete Chat</span>
    </div>`;

if (html.includes(oldClearBtn)) {
    html = html.replace(oldClearBtn, newClearBtn);
}

// 2. Inject the actual functions safely
const deleteLogic = `
  function clearCurrentChat() {
    if (confirm("Clear all messages in this chat? This cannot be undone.")) {
        localStorage.removeItem('bapp_msgs_' + activeChatId);
        document.getElementById('chat-messages').innerHTML = '';
        if(typeof closeChatMenu === 'function') closeChatMenu();
        if(typeof loadChatList === 'function') loadChatList();
        if(typeof showToast === 'function') showToast("Chat cleared!");
    }
  }

  function deleteCurrentChat() {
    if (confirm("Delete this entire chat? This will remove it from your list.")) {
        // 1. Clear messages
        localStorage.removeItem('bapp_msgs_' + activeChatId);
        
        // 2. Remove from chat list
        let chats = JSON.parse(localStorage.getItem('bapp_chats')) || [];
        chats = chats.filter(id => id !== activeChatId);
        localStorage.setItem('bapp_chats', JSON.stringify(chats));
        
        // 3. Close menu and go home
        if(typeof closeChatMenu === 'function') closeChatMenu();
        if(typeof loadChatList === 'function') loadChatList();
        if(typeof goBack === 'function') goBack();
        
        if(typeof showToast === 'function') showToast("Chat deleted!");
    }
  }
`;

// Add it right after closeChatMenu
const oldMenuFunc = `function closeChatMenu() {`;
if (html.includes(oldMenuFunc) && !html.includes("function deleteCurrentChat()")) {
    html = html.replace(oldMenuFunc, deleteLogic + "\n  " + oldMenuFunc);
}

fs.writeFileSync('index.html', html);
console.log('✅ Clear and Delete Chat buttons are now active!');
