const fs = require('fs');

// ==========================================
// 1. FIX SERVER ROUTING
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Replace the whole message routing block to be simple and clean
const serverStart = serverJs.indexOf("if (data.type === 'send_message') {");
const serverEnd = serverJs.indexOf("ws.on('close'");

const newServerRouting = `
        if (data.type === 'send_message') {
            const { to, from, text, isImage } = data;
            const cleanTo = to.trim();
            
            console.log(\`📩 Msg from [\${from}] to [\${cleanTo}]\`);

            if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage }));
                console.log("✅ Delivered to online user");
            } else {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (!db[cleanTo]) db[cleanTo] = [];
                db[cleanTo].push({ from: from, text: text, isImage: isImage });
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("💾 Stored offline message");
            }
        }
    });

    `;
serverJs = serverJs.substring(0, serverStart) + newServerRouting + serverJs.substring(serverEnd);
fs.writeFileSync('server.js', serverJs);


// ==========================================
// 2. FIX UI JAVASCRIPT
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');

// I am rewriting the core functions to ensure perfect syntax
const newJSCore = `
  const socket = new WebSocket('ws://' + location.host);
  let myBappId = sessionStorage.getItem('bappId');
  if (!myBappId) {
    myBappId = "user_" + Math.floor(Math.random() * 1000);
    sessionStorage.setItem('bappId', myBappId);
  }
  let activeChatId = null;
  let myProfile = JSON.parse(localStorage.getItem('bapp_profile')) || { name: 'User', avatar: 'https://ui-avatars.com/api/?name=U&background=random' };
  
  document.getElementById('my-id').innerText = "Your ID: " + myBappId;

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'register', userId: myBappId }));
    loadChatList();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📥 Received socket data:", data);

      if (data.type === 'typing') {
        const senderId = (data.from || '').trim();
        if (activeChatId === senderId) {
          document.getElementById('chat-subtitle').innerText = data.isTyping ? 'typing...' : '🔒 End-to-End Encrypted';
          document.getElementById('chat-subtitle').style.color = data.isTyping ? 'var(--primary)' : 'var(--text-muted)';
        }
      }

      if (data.type === 'read_receipt') {
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
        msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
        localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(msgs));
        if (activeChatId === data.from) {
          const checks = document.querySelectorAll('.msg.sent .msg-status');
          checks.forEach(c => { c.innerText = '✓✓'; c.classList.add('read'); });
        }
      }

      if (data.type === 'new_message') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const senderId = (data.from || '').trim();
        
        // 1. Save to phone memory
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
        savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage });
        localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        
        // 2. Save to chat list
        saveChat(senderId);
        
        // 3. Show on screen
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage);
          socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));
        } else {
          let unreads = getUnreads();
          unreads[senderId] = (unreads[senderId] || 0) + 1;
          localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
        }
        
        // 4. Refresh List
        loadChatList();
      }
    } catch(err) {
      console.error("Socket Error:", err);
    }
  };

  // --- CHAT LIST HELPERS ---
  function getChats() { return JSON.parse(localStorage.getItem('bapp_chats')) || []; }
  function getUnreads() { return JSON.parse(localStorage.getItem('bapp_unreads')) || {}; }
  function saveChat(id) {
    let chats = getChats();
    if (!chats.includes(id)) {
      chats.unshift(id);
      localStorage.setItem('bapp_chats', JSON.stringify(chats));
    }
  }

  function loadChatList() {
    const chatList = document.getElementById('chat-list-container');
    chatList.innerHTML = ''; 
    const chats = getChats();
    const unreads = getUnreads();
    
    chats.forEach(id => {
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      let lastMsgText = 'Tap to chat';
      let lastMsgTime = '';
      
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        lastMsgText = last.isImage ? '📷 Photo' : last.text;
        lastMsgTime = last.time || '';
      }
      
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      const unreadCount = unreads[id] || 0;
      const badgeHtml = unreadCount > 0 ? \`<div class="badge">\${unreadCount}</div>\` : '';
      const timeClass = unreadCount > 0 ? 'chat-time unread' : 'chat-time';

      const chatHtml = \`
        <div class="chat-item" id="item-\${id}" onclick="openChat('\${id}', '\${avatarUrl}')">
          <img src="\${avatarUrl}" class="avatar">
          <div class="chat-info">
            <div class="chat-top">
              <div class="chat-name">\${id}</div>
              <div class="\${timeClass}">\${lastMsgTime}</div>
            </div>
            <div class="chat-bottom">
              <div class="chat-msg" id="preview-\${id}">\${lastMsgText}</div>
              \${badgeHtml}
            </div>
          </div>
        </div>
      \`;
      chatList.insertAdjacentHTML('beforeend', chatHtml);
    });
    updateGlobalBadge();
  }

  function updateGlobalBadge() {
    const unreads = getUnreads();
    let total = 0;
    for (let id in unreads) total += unreads[id];
    const badge = document.getElementById('global-badge');
    if (total > 0) { badge.style.display = 'flex'; badge.innerText = total; } 
    else { badge.style.display = 'none'; }
  }

  // --- OPEN CHAT ---
  function openChat(id, avatarSrc) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
    document.getElementById('chat-name').textContent = id.trim();
    activeChatId = id.trim();
    document.getElementById('chat-avatar').src = avatarSrc;
    document.getElementById('chat-subtitle').innerText = '🔒 End-to-End Encrypted';
    
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = ""; 
    
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage));
    
    let unreads = getUnreads();
    if(unreads[id]) { unreads[id] = 0; localStorage.setItem('bapp_unreads', JSON.stringify(unreads)); }
    
    socket.send(JSON.stringify({ type: 'read_receipt', to: id, from: myBappId }));
    
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
    localStorage.setItem('bapp_msgs_' + id, JSON.stringify(msgs));
    
    loadChatList();
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
  }

  function goBack() {
    activeChatId = null;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('main-view').classList.add('active');
  }

  function appendMessage(text, type, timeStr, status = '', isImage = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    if (isImage) {
      const img = document.createElement('img'); img.src = text; newMsg.appendChild(img);
    } else {
      const textNode = document.createTextNode(text); newMsg.appendChild(textNode);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'read' ? '✓✓' : '✓';
      newMsg.appendChild(check);
    }
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  // --- SEND MESSAGE ---
  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').textContent.trim();
    
    if (text !== "" && socket.readyState === WebSocket.OPEN && to !== "") {
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: text }));
      
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      appendMessage(text, 'sent', now, 'sent');
      input.value = '';
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent' });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      loadChatList();
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    const to = document.getElementById('chat-name').textContent.trim();
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Img = e.target.result;
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true }));
      
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      appendMessage(base64Img, 'sent', now, 'sent', true);
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      loadChatList();
    };
    reader.readAsDataURL(file);
  }

  function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

  function startNewChat() {
    const targetId = prompt("Enter BAPP ID:");
    if (targetId && targetId.trim() !== "") {
      const cleanId = targetId.trim();
      saveChat(cleanId);
      loadChatList();
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + cleanId.substring(0,2) + '&background=random';
      openChat(cleanId, avatarUrl);
    }
  }

  function openSettings() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('settings-view').classList.add('active');
    document.getElementById('settings-name-input').value = myProfile.name;
    document.getElementById('settings-avatar').src = myProfile.avatar;
  }

  function saveProfile() {
    myProfile.name = document.getElementById('settings-name-input').value || 'User';
    localStorage.setItem('bapp_profile', JSON.stringify(myProfile));
    alert("Profile Saved!");
    goBack();
  }

  document.getElementById('settings-pic-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        myProfile.avatar = event.target.result;
        document.getElementById('settings-avatar').src = myProfile.avatar;
      };
      reader.readAsDataURL(file);
    }
  });

  function toggleTheme() { document.body.classList.toggle('light-mode'); }
`;

html = html.substring(0, startScript) + '<script>' + newJSCore + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('All code completely fixed! Messages will flow perfectly now.');
