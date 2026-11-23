const fs = require('fs');

// 1. Backup
fs.copyFileSync('index.html', 'index_backup_8.html');

let html = fs.readFileSync('index.html', 'utf8');
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// 2. Update the typing event to modify the chat list preview
const oldTyping = `if (data.type === 'typing') {
        const senderId = (data.from || '').trim();
        if (activeChatId === senderId) {
          document.getElementById('chat-subtitle').innerText = data.isTyping ? 'typing...' : '🔒 End-to-End Encrypted';
          document.getElementById('chat-subtitle').style.color = data.isTyping ? 'var(--primary)' : 'var(--text-muted)';
        }
      }`;

const newTyping = `if (data.type === 'typing') {
        const senderId = (data.from || '').trim();

        // 1. If we are INSIDE the chat
        if (activeChatId === senderId) {
          document.getElementById('chat-subtitle').innerText = data.isTyping ? 'typing...' : '🔒 End-to-End Encrypted';
          document.getElementById('chat-subtitle').style.color = data.isTyping ? 'var(--primary)' : 'var(--text-muted)';
        }

        // 2. If we are on the HOME SCREEN (Chat List)
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isTyping) {
            previewEl.innerText = 'typing...';
            previewEl.style.color = 'var(--primary)';
            previewEl.style.fontWeight = 'bold';
          } else {
            // Revert back to the last message
            const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            let lastMsgText = 'Tap to chat';
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              lastMsgText = last.isImage ? '📷 Photo' : last.text;
            }
            previewEl.innerText = lastMsgText;
            previewEl.style.color = 'var(--text-muted)';
            previewEl.style.fontWeight = 'normal';
          }
        }
      }`;
js = js.replace(oldTyping, newTyping);

// 3. Add a "Clear All Chats" button in Settings
const oldSaveBtn = `<button class="save-btn" onclick="saveProfile()">Save Profile</button>`;
const newSaveBtn = `<button class="save-btn" onclick="saveProfile()">Save Profile</button>
    <button class="save-btn" onclick="clearAllChats()" style="background: #e74c3c; margin-top: 10px;">Clear All Chats</button>`;
html = html.replace(oldSaveBtn, newSaveBtn);

// 4. Add the clearAllChats function
const clearChatsLogic = `
  function clearAllChats() {
    if(confirm("Are you sure you want to delete all chats and messages? This cannot be undone.")) {
      localStorage.removeItem('bapp_chats');
      localStorage.removeItem('bapp_unreads');
      // Clear all message keys
      for(let i = localStorage.length - 1; i >= 0; i--) {
        let key = localStorage.key(i);
        if(key.startsWith('bapp_msgs_')) {
          localStorage.removeItem(key);
        }
      }
      loadChatList();
      updateGlobalBadge();
      alert("All chats cleared!");
      goBack();
    }
  }
`;
js = js.replace("function saveProfile()", clearChatsLogic + "\n  function saveProfile()");

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('List Typing and Clear Chats added!');
