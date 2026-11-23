const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the Theme Toggle Button
html = html.replace('onclick="toggleTheme()"', 'onclick="toggleTheme()"'); // Ensure onclick exists

// 2. Rebuild the Bottom Navigation
const oldNav = /<div class="bottom-nav glass">[\s\S]*?<\/div>\s*<\/div>/;
const newNav = `<div class="bottom-nav glass">
    <div class="nav-item active" onclick="goBack()">
      <span>💬</span>Chats
      <div class="nav-badge" id="global-badge" style="display:none;">0</div>
    </div>
    <div class="nav-item"><span>⭕</span>Status</div>
    <div class="nav-item"><span>📞</span>Calls</div>
    <div class="nav-item"><span>⚙️</span>Settings</div>
  </div>`;
html = html.replace(oldNav, newNav);

// 3. Add CSS for message timestamps
html = html.replace('::-webkit-scrollbar { display: none; }', `
  .msg-time { font-size: 10px; color: rgba(255,255,255,0.5); float: right; margin: 5px 0 0 10px; }
  .msg.sent .msg-time { color: rgba(255,255,255,0.7); }
  ::-webkit-scrollbar { display: none; }
`);

// 4. Update JavaScript (Timestamp, Theme, Unread Logic)
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');

const newScript = `<script>
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
    updateGlobalBadge();
  };

  // --- THEME TOGGLE ---
  function toggleTheme() {
    document.body.classList.toggle('light-mode');
  }

  // --- CHAT LIST MEMORY ---
  function getSavedChats() { return JSON.parse(localStorage.getItem('bapp_chats')) || []; }
  function saveChat(id) {
    let chats = getSavedChats();
    if (!chats.includes(id)) {
      chats.unshift(id);
      localStorage.setItem('bapp_chats', JSON.stringify(chats));
    }
  }

  function loadChatList() {
    const chatList = document.querySelector('.chat-list');
    chatList.innerHTML = ''; 
    const chats = getSavedChats();
    
    chats.forEach(id => {
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].text : 'Tap to chat';
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      
      // Check for unread
      const unreads = JSON.parse(localStorage.getItem('bapp_unread')) || {};
      const unreadCount = unreads[id] || 0;
      const badgeHtml = unreadCount > 0 ? \`<div class="badge">\${unreadCount}</div>\` : '';

      const chatHtml = \`
        <div class="chat-item" id="item-\${id}" onclick="openChat('\${id}', '\${avatarUrl}')">
          <img src="\${avatarUrl}" class="avatar">
          <div class="chat-info">
            <div class="chat-top"><div class="chat-name">\${id}</div><div class="chat-time">Now</div></div>
            <div class="chat-bottom">
              <div class="chat-msg" id="preview-\${id}">\${lastMsg}</div>
              \${badgeHtml}
            </div>
          </div>
        </div>
      \`;
      chatList.insertAdjacentHTML('beforeend', chatHtml);
    });
  }

  // --- UNREAD BADGE LOGIC ---
  function updateGlobalBadge() {
    const unreads = JSON.parse(localStorage.getItem('bapp_unread')) || {};
    let total = 0;
    for (let id in unreads) total += unreads[id];
    
    const badge = document.getElementById('global-badge');
    if (total > 0) {
      badge.style.display = 'flex';
      badge.innerText = total;
    } else {
      badge.style.display = 'none';
    }
  }

  // --- OPEN CHAT ---
  function openChat(id, avatarSrc) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
    document.getElementById('chat-name').innerText = id;
    document.getElementById('chat-avatar').src = avatarSrc;
    
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = ""; 
    
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, false));
    
    // Clear unread for this chat
    let unreads = JSON.parse(localStorage.getItem('bapp_unread')) || {};
    unreads[id] = 0;
    localStorage.setItem('bapp_unread', JSON.stringify(unreads));
    updateGlobalBadge();
    loadChatList();
    
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
  }

  function goBack() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('main-view').classList.add('active');
  }

  // --- APPEND MESSAGE WITH TIMESTAMP ---
  function appendMessage(text, type, timeStr, save = true) {
    const msgBox = document.getElementById('chat-messages');
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    // Create time element
    const time = document.createElement('span');
    time.className = 'msg-time';
    time.innerText = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Add text and time to bubble
    newMsg.innerText = text;
    newMsg.appendChild(time);
    
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  // --- SEND MESSAGE ---
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').innerText;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: text }));
      
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      appendMessage(text, 'sent', now);
      input.value = '';
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: text, type: 'sent', time: now });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      
      saveChat(to);
      document.getElementById('preview-' + to).innerText = text;
    }
  };

  function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

  function startNewChat() {
    const targetId = prompt("Enter BAPP ID to open a private tunnel:");
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
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
      savedMsgs.push({ text: data.text, type: 'received', time: now });
      localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(savedMsgs));
      
      saveChat(data.from);
      
      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName === data.from) {
        appendMessage(data.text, 'received', now);
      } else {
        // Increment unread
        let unreads = JSON.parse(localStorage.getItem('bapp_unread')) || {};
        unreads[data.from] = (unreads[data.from] || 0) + 1;
        localStorage.setItem('bapp_unread', JSON.stringify(unreads));
        updateGlobalBadge();
      }
      loadChatList(); // Refresh list to show new msg and badge
    }
  };
</script>`;

html = html.substring(0, startScript) + newScript + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('UI updated: Real Badge, Timestamps, Nav, Theme!');
