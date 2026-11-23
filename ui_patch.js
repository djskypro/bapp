const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS for checkmarks, typing, and images
html = html.replace('::-webkit-scrollbar { display: none; }', `
  .msg img { max-width: 100%; border-radius: 8px; margin-bottom: 5px; display: block; }
  .msg-status { font-size: 12px; margin-left: 5px; color: var(--text-muted); }
  .msg-status.read { color: #53bdeb; } /* Blue ticks */
  .typing-text { font-size: 12px; color: var(--primary); display: none; }
  .attach-btn { font-size: 24px; color: var(--text-muted); padding: 10px; cursor: pointer; }
  ::-webkit-scrollbar { display: none; }
`);

// 2. Update the Chat Header to show typing status
html = html.replace('<div class="lock">🔒 End-to-End Encrypted</div>', '<div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>');

// 3. Add attachment button to input area
html = html.replace('<div class="chat-input-area">', '<div class="chat-input-area">\n    <div class="attach-btn" onclick="document.getElementById(\'file-input\').click()">📎</div>\n    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">');

// 4. Add Profile Settings Modal (Hidden by default)
html = html.replace('</body>', `
<div id="profile-modal" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:100; justify-content:center; align-items:center; flex-direction:column;">
  <div class="glass" style="padding:30px; border-radius:20px; text-align:center; width:80%;">
    <h2 style="margin-bottom:15px;">Your Profile</h2>
    <input type="text" id="profile-name-input" placeholder="Your Name" style="width:100%; padding:10px; border-radius:10px; border:none; margin-bottom:15px; background:var(--search-bg); color:var(--text); outline:none;">
    <label style="display:block; margin-bottom:15px; background:var(--search-bg); padding:10px; border-radius:10px; cursor:pointer;">
      Choose Profile Picture
      <input type="file" id="profile-pic-input" accept="image/*" style="display:none;">
    </label>
    <button onclick="saveProfile()" style="background:var(--primary); color:black; padding:10px 20px; border:none; border-radius:10px; font-weight:bold; width:100%;">Save</button>
  </div>
</div>
</body>`);

// 5. Update JS Logic
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// A. Add Profile Variables
js = js.replace("let activeChatId = null;", `let activeChatId = null;
  let myProfile = JSON.parse(localStorage.getItem('bapp_profile')) || { name: 'User', avatar: 'https://ui-avatars.com/api/?name=U&background=random' };
  let typingTimeout = null;`);

// B. Hook up Settings icon
js = js.replace('<div class="nav-item"><span>⚙️</span>Settings</div>', '<div class="nav-item" onclick="openProfile()"><span>⚙️</span>Settings</div>');

// C. Add Profile Functions
const profileFuncs = `
  function openProfile() {
    document.getElementById('profile-modal').style.display = 'flex';
    document.getElementById('profile-name-input').value = myProfile.name;
  }
  function saveProfile() {
    const newName = document.getElementById('profile-name-input').value;
    if(newName) myProfile.name = newName;
    localStorage.setItem('bapp_profile', JSON.stringify(myProfile));
    document.getElementById('profile-modal').style.display = 'none';
    socket.send(JSON.stringify({ type: 'register', userId: myBappId, name: myProfile.name, avatar: myProfile.avatar }));
  }
  // Handle Profile Pic Upload
  document.getElementById('profile-pic-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        myProfile.avatar = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
`;
js = js.replace('function toggleTheme()', profileFuncs + '\n  function toggleTheme()');

// D. Add Typing Event Listener
const typingLogic = `
  document.getElementById('chat-input').addEventListener('input', () => {
    const to = document.getElementById('chat-name').textContent.trim();
    if(!to) return;
    
    socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: true }));
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: false }));
    }, 2000);
  });
`;
js = js.replace('function handleEnter(e)', typingLogic + '\n  function handleEnter(e)');

// E. Handle Image Uploads
const imageUploadLogic = `
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    const to = document.getElementById('chat-name').textContent.trim();
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Img = e.target.result;
      // Send via socket
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true }));
      
      // Update UI locally
      appendMessage(base64Img, 'sent', new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 'sent', true);
      
      // Save to storage
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: base64Img, type: 'sent', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), isImage: true, status: 'sent' });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      loadChatList();
    };
    reader.readAsDataURL(file);
  }
`;
js = js.replace('function handleEnter(e)', imageUploadLogic + '\n  function handleEnter(e)');

// F. Update appendMessage to support images and checkmarks
const oldAppend = js.substring(js.indexOf('function appendMessage'), js.indexOf('function sendMessage'));
const newAppend = `
  function appendMessage(text, type, timeStr, status = '', isImage = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;

    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      newMsg.appendChild(img);
    } else {
      const textNode = document.createTextNode(text);
      newMsg.appendChild(textNode);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    // Add Checkmarks for sent messages
    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'read' ? '✓✓' : '✓';
      newMsg.appendChild(check);
    }

    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }
`;
js = js.replace(oldAppend, newAppend);

// G. Update sendMessage to add initial checkmark
js = js.replace("appendMessage(text, 'sent', now);", "appendMessage(text, 'sent', now, 'sent');");

// H. Update socket.onmessage to handle typing and read receipts
const oldSocketMsg = `if (data.type === 'new_message') {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
      savedMsgs.push({ text: data.text, type: 'received', time: now });
      localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(savedMsgs));
      
      saveChat(data.from);
      
      const currentChatName = document.getElementById('chat-name').textContent.trim();
      const senderId = (data.from || '').trim();
      
      if (activeChatId === senderId) {
        appendMessage(data.text, 'received', now);
      } else {`;

const newSocketMsg = `if (data.type === 'typing') {
      const senderId = (data.from || '').trim();
      if (activeChatId === senderId) {
        document.getElementById('chat-subtitle').innerText = data.isTyping ? 'typing...' : '🔒 End-to-End Encrypted';
        document.getElementById('chat-subtitle').style.color = data.isTyping ? 'var(--primary)' : 'var(--text-muted)';
      }
    }

    if (data.type === 'read_receipt') {
      // Update all sent messages to blue ticks
      let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
      msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
      localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(msgs));
      
      // If chat is open, update visually
      if (activeChatId === data.from) {
        const checks = document.querySelectorAll('.msg.sent .msg-status');
        checks.forEach(c => { c.innerText = '✓✓'; c.classList.add('read'); });
      }
    }

    if (data.type === 'new_message') {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
      savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage });
      localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(savedMsgs));
      
      saveChat(data.from);
      
      const senderId = (data.from || '').trim();
      
      if (activeChatId === senderId) {
        appendMessage(data.text, 'received', now, '', data.isImage);
        // Send read receipt immediately
        socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));
      } else {`;

js = js.replace(oldSocketMsg, newSocketMsg);

// I. Update openChat to send read receipts and load checkmarks
const oldOpenChat = js.substring(js.indexOf('function openChat'), js.indexOf('function goBack'));
const newOpenChat = `
  function openChat(id, avatarSrc) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
    document.getElementById('chat-name').textContent = id.trim();
    activeChatId = id;
    document.getElementById('chat-avatar').src = avatarSrc;
    
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = ""; 
    
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage));
    
    let unreads = getUnreads();
    if(unreads[id]) {
      unreads[id] = 0;
      localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
    }
    
    // Send Read Receipt
    socket.send(JSON.stringify({ type: 'read_receipt', to: id, from: myBappId }));
    
    // Mark local messages as read
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
    localStorage.setItem('bapp_msgs_' + id, JSON.stringify(msgs));
    
    loadChatList();
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
  }
`;
js = js.replace(oldOpenChat, newOpenChat);

html = html.substring(0, startScript) + '<script>' + js + html.substring(endScript);
fs.writeFileSync('index.html', html);
console.log('UI patched with Profiles, Typing, Read Receipts, and Images!');
