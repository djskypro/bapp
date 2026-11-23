const fs = require('fs');

// --- 1. FIX THE SERVER (Forward isImage properly) ---
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
    "const { to, from, text } = data;",
    "const { to, from, text, isImage } = data;"
);
serverJs = serverJs.replace(
    "bappUsers.get(to).send(JSON.stringify({ type: 'new_message', from: from, text: text }));",
    "bappUsers.get(to).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage }));"
);
fs.writeFileSync('server.js', serverJs);

// --- 2. FIX THE UI ---
let html = fs.readFileSync('index.html', 'utf8');

// A. Replace the Settings Nav click
html = html.replace('<div class="nav-item" onclick="openProfile()"><span>⚙️</span>Settings</div>', '<div class="nav-item" onclick="openSettings()"><span>⚙️</span>Settings</div>');

// B. Remove the old popup modal
html = html.replace(/<div id="profile-modal"[\s\S]*?<\/div>\s*<\/body>/, '</body>');

// C. Add the new Settings View right before the closing body tag
const settingsView = `
<!-- SETTINGS VIEW -->
<div id="settings-view" class="view">
  <div class="header" style="padding-top: 40px;">
    <div style="display:flex; align-items:center; gap:15px;">
      <div class="back-btn" onclick="goBack()">←</div>
      <h1>Settings</h1>
    </div>
  </div>
  
  <div style="padding: 20px; flex: 1; display:flex; flex-direction:column; align-items:center;">
    <img id="settings-avatar" src="" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); margin-bottom: 20px;">
    
    <label style="background:var(--search-bg); padding:12px 20px; border-radius:12px; cursor:pointer; margin-bottom:20px; width: 100%; text-align:center;">
      Change Profile Picture
      <input type="file" id="settings-pic-input" accept="image/*" style="display:none;">
    </label>

    <input type="text" id="settings-name-input" placeholder="Your Name" style="width:100%; padding:15px; border-radius:12px; border:none; margin-bottom:20px; background:var(--search-bg); color:var(--text); outline:none; font-size:16px;">

    <button onclick="saveProfile()" style="background:var(--primary); color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px;">Save Profile</button>
    
    <div style="margin-top:auto; color:var(--text-muted); font-size:12px;">BAPP v1.0</div>
  </div>
</div>
</body>`;
html = html.replace('</body>', settingsView);

// D. Update the JavaScript logic
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// Make sure variables exist
if (!js.includes("let activeChatId")) js = js.replace("let myBappId =", "let activeChatId = null;\n  let myBappId =");

// Add openSettings and saveProfile functions
const profileLogic = `
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
`;
if (!js.includes("function openSettings")) js = js.replace('function goBack()', profileLogic + '\n  function goBack()');

// FIX THE SOCKET LISTENER (Crash Preventer)
const oldSocket = js.substring(js.indexOf("socket.onmessage"), js.lastIndexOf("}"));
const newSocket = `
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Remove old status check to prevent crashes
      
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
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
        savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage });
        localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(savedMsgs));
        
        saveChat(data.from);
        const senderId = (data.from || '').trim();
        
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage);
          socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));
        } else {
          let unreads = getUnreads();
          unreads[data.from] = (unreads[data.from] || 0) + 1;
          localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
        }
        loadChatList();
      }
    } catch(err) {
      console.error("Socket message error:", err);
    }
  };
`;

// Find where socket.onmessage starts and where the next function starts
const startSocket = js.indexOf("socket.onmessage");
const endSocket = js.indexOf("};", startSocket) + 2;
js = js.substring(0, startSocket) + newSocket + js.substring(endSocket);

html = html.substring(0, startScript) + '<script>' + js + html.substring(endScript);
fs.writeFileSync('index.html', html);
console.log('Settings View and Socket Crash Fix applied!');
