const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Lock icon to the chat header
html = html.replace(
  '<div class="name" id="chat-name"></div>',
  '<div><div class="name" id="chat-name"></div><div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:3px;">🔒 End-to-End Encrypted</div></div>'
);

// 2. Replace the entire JavaScript block with the new WhatsApp logic
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');

const newScript = `<script>
  // --- INITIALIZATION ---
  const socket = new WebSocket('ws://' + location.host);
  let myBappId = sessionStorage.getItem('bappId');
  if (!myBappId) {
    myBappId = "user_" + Math.floor(Math.random() * 1000);
    sessionStorage.setItem('bappId', myBappId);
  }
  
  document.getElementById('my-id').innerText = "Your ID: " + myBappId;

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'register', userId: myBappId }));
    loadChatList();
  };

  // --- CHAT LIST MEMORY (LOCALSTORAGE) ---
  function getSavedChats() {
    return JSON.parse(localStorage.getItem('bapp_chats')) || [];
  }
  function saveChat(id) {
    let chats = getSavedChats();
    if (!chats.includes(id)) {
      chats.unshift(id); // Add to top
      localStorage.setItem('bapp_chats', JSON.stringify(chats));
    }
  }

  function loadChatList() {
    const chatList = document.querySelector('.chat-list');
    chatList.innerHTML = ''; // Clear dummy HTML
    const chats = getSavedChats();
    
    chats.forEach(id => {
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].text : 'Tap to chat';
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      
      const chatHtml = \`
        <div class="chat-item" id="item-\${id}" onclick="openChat('\${id}', '\${avatarUrl}')">
          <img src="\${avatarUrl}" class="avatar">
          <div class="chat-info">
            <div class="chat-top"><div class="chat-name">\${id}</div><div class="chat-time">Now</div></div>
            <div class="chat-bottom"><div class="chat-msg" id="preview-\${id}">\${lastMsg}</div></div>
          </div>
        </div>
      \`;
      chatList.insertAdjacentHTML('beforeend', chatHtml);
    });
  }

  // --- OPEN CHAT (THE PRIVATE TUNNEL) ---
  function openChat(id, avatarSrc) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
    document.getElementById('chat-name').innerText = id;
    document.getElementById('chat-avatar').src = avatarSrc;
    
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = ""; 
    
    // Load past messages from phone memory
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    savedMsgs.forEach(m => appendMessage(m.text, m.type, false));
    
    // Clear unread badge
    const item = document.getElementById('item-' + id);
    if(item) {
        const badge = item.querySelector('.badge');
        if(badge) badge.remove();
    }
    
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
  }

  function goBack() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('main-view').classList.add('active');
    loadChatList(); // Refresh list
  }

  function appendMessage(text, type, save = true) {
    const msgBox = document.getElementById('chat-messages');
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    newMsg.innerText = text;
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
    return newMsg;
  }

  // --- SEND MESSAGE ---
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').innerText;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      // 1. Send to server
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: text }));
      
      // 2. Show on screen
      appendMessage(text, 'sent');
      input.value = '';
      
      // 3. Save to phone memory
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: text, type: 'sent' });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      
      // 4. Update the list preview
      saveChat(to);
      document.getElementById('preview-' + to).innerText = text;
    }
  };

  function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

  // --- START NEW CHAT ---
  function startNewChat() {
    const targetId = prompt("Enter BAPP ID (e.g., user_123) to open a private tunnel:");
    if (targetId && targetId.trim() !== "") {
      const cleanId = targetId.trim();
      saveChat(cleanId);
      loadChatList();
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + cleanId.substring(0,2) + '&background=random';
      openChat(cleanId, avatarUrl);
    }
  }

  // --- RECEIVE MESSAGES ---
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'new_message') {
      // 1. Save to phone memory
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
      savedMsgs.push({ text: data.text, type: 'received' });
      localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(savedMsgs));
      
      // 2. Add to chat list
      saveChat(data.from);
      loadChatList();

      // 3. If we are currently looking at this chat, show it instantly
      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName === data.from) {
        appendMessage(data.text, 'received');
      } else {
        // Add unread badge to the list item
        const item = document.getElementById('item-' + data.from);
        if(item) {
            const bottomDiv = item.querySelector('.chat-bottom');
            let badge = bottomDiv.querySelector('.badge');
            if(!badge) {
                badge = document.createElement('div');
                badge.className = 'badge';
                badge.innerText = '1';
                bottomDiv.appendChild(badge);
            } else {
                badge.innerText = parseInt(badge.innerText) + 1;
            }
        }
      }
    }
  };
</script>`;

html = html.substring(0, startScript) + newScript + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('WhatsApp-style chat list and private tunnels activated!');
