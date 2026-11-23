const fs = require('fs');

// ==========================================
// 1. BACKUP
// ==========================================
fs.copyFileSync('server.js', 'server_backup_2.js');
fs.copyFileSync('index.html', 'index_backup_2.html');

// ==========================================
// 2. UPDATE SERVER (Share Profiles)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Load users into memory for fast access
serverJs = serverJs.replace(
    "const bappUsers = new Map();",
    "const bappUsers = new Map();\nlet allUsers = JSON.parse(fs.readFileSync(USERS_FILE));"
);

// Update register to save to memory
serverJs = serverJs.replace(
    "users[data.username] = data.profile || { name: data.username };\n            fs.writeFileSync(USERS_FILE, JSON.stringify(users));",
    "users[data.username] = data.profile || { name: data.username };\n            allUsers = users; // Update memory\n            fs.writeFileSync(USERS_FILE, JSON.stringify(users));"
);

// Update search to return profile data
serverJs = serverJs.replace(
    "const matches = Object.keys(users).filter(u => u.includes(query) && u !== data.from);\n            ws.send(JSON.stringify({ type: 'search_result', matches: matches }));",
    "const matches = Object.keys(users).filter(u => u.includes(query) && u !== data.from).map(u => ({ username: u, profile: users[u] }));\n            ws.send(JSON.stringify({ type: 'search_result', matches: matches }));"
);

// Update send_message to include sender's profile
serverJs = serverJs.replace(
    "bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage }));",
    "const senderProfile = allUsers[from] || { name: from };\n                bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, senderProfile: senderProfile, text: text, isImage: isImage }));"
);

fs.writeFileSync('server.js', serverJs);

// ==========================================
// 3. UPDATE UI (Show Profiles & Fix Save)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// A. Fix the Save Button (Add visual feedback and save to profile list)
const oldSave = js.substring(js.indexOf('function saveProfile()'), js.indexOf("document.getElementById('settings-pic-input')"));
const newSave = `
  function saveProfile() {
    myProfile.name = document.getElementById('settings-name-input').value || myBappId;
    myProfile.bio = document.getElementById('settings-bio').value;
    myProfile.phone = document.getElementById('settings-phone').value;
    myProfile.location = document.getElementById('settings-location').value;
    myProfile.autoLocation = document.getElementById('settings-auto-location').checked;
    
    localStorage.setItem('bapp_profile', JSON.stringify(myProfile));
    
    // Save to local user profiles database
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    profiles[myBappId] = myProfile;
    localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
    
    // Notify server
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    
    // Visual feedback
    const btn = document.querySelector('.save-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Saved! ✅';
    btn.style.background = '#2ecc71';
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = 'var(--primary)';
        goBack();
    }, 1000);
  }
`;
js = js.replace(oldSave, newSave);

// B. Update selectSearchUser to save the profile
const oldSelect = js.substring(js.indexOf('function selectSearchUser'), js.indexOf('function openChat'));
const newSelect = `
  function selectSearchUser(userObj) {
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-input').value = '';
    
    // Save profile to local storage so we can see their DP and Name
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    profiles[userObj.username] = userObj.profile;
    localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
    
    saveChat(userObj.username);
    loadChatList();
    openChat(userObj.username, userObj.profile);
  }
`;
js = js.replace(oldSelect, newSelect);

// C. Update openChat to accept a profile object
const oldOpen = js.substring(js.indexOf('function openChat'), js.indexOf('function goBack'));
const newOpen = `
  function openChat(id, profileObj) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
    
    // Use profile if available, otherwise fallback to username
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let p = profileObj || profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };
    
    document.getElementById('chat-name').textContent = p.name || id;
    activeChatId = id.trim();
    document.getElementById('chat-avatar').src = p.avatar || 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
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
`;
js = js.replace(oldOpen, newOpen);

// D. Update loadChatList to show Display Names and Avatars
const oldList = js.substring(js.indexOf('function loadChatList()'), js.indexOf('function updateGlobalBadge()'));
const newList = `
  function loadChatList() {
    const chatList = document.getElementById('chat-list-container');
    chatList.innerHTML = ''; 
    const chats = getChats();
    const unreads = getUnreads();
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    
    chats.forEach(id => {
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      let lastMsgText = 'Tap to chat';
      let lastMsgTime = '';
      
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        lastMsgText = last.isImage ? '📷 Photo' : last.text;
        lastMsgTime = last.time || '';
      }
      
      // Get Profile Info (Name & Avatar)
      const p = profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };
      const displayName = p.name || id;
      const avatarUrl = p.avatar;
      
      const unreadCount = unreads[id] || 0;
      const badgeHtml = unreadCount > 0 ? \`<div class="badge">\${unreadCount}</div>\` : '';
      const timeClass = unreadCount > 0 ? 'chat-time unread' : 'chat-time';

      const chatHtml = \`
        <div class="chat-item" id="item-\${id}" onclick="openChat('\${id}')">
          <img src="\${avatarUrl}" class="avatar">
          <div class="chat-info">
            <div class="chat-top"><div class="chat-name">\${displayName}</div><div class="\${timeClass}">\${lastMsgTime}</div></div>
            <div class="chat-bottom"><div class="chat-msg" id="preview-\${id}">\${lastMsgText}</div>\${badgeHtml}</div>
          </div>
        </div>
      \`;
      chatList.insertAdjacentHTML('beforeend', chatHtml);
    });
    updateGlobalBadge();
  }
`;
js = js.replace(oldList, newList);

// E. Update search result rendering to show DP and Name
const oldSearchRender = js.substring(js.indexOf("if (data.type === 'search_result')"), js.indexOf("if (data.type === 'typing')"));
const newSearchRender = `
      if (data.type === 'search_result') {
        const dropdown = document.getElementById('search-dropdown');
        dropdown.innerHTML = '';
        if (data.matches.length === 0) {
          dropdown.innerHTML = '<div style="padding:15px; color:var(--text-muted); text-align:center;">No users found</div>';
        } else {
          data.matches.forEach(userObj => {
            const uName = userObj.username;
            const uProfile = userObj.profile;
            const avatarUrl = uProfile.avatar || 'https://ui-avatars.com/api/?name=' + uName.substring(0,2) + '&background=random';
            const displayName = uProfile.name || uName;
            
            // Pass the whole object to selectSearchUser
            const item = \`<div style="display:flex; align-items:center; padding:12px 15px; border-bottom:1px solid var(--glass-border); cursor:pointer;" onclick='selectSearchUser(\${JSON.stringify(userObj)})'>
                <img src="\${avatarUrl}" style="width:35px; height:35px; border-radius:50%; margin-right:12px;">
                <div style="font-weight:500;">\${displayName} <span style="color:var(--text-muted); font-size:12px;">@\${uName}</span></div>
              </div>\`;
            dropdown.insertAdjacentHTML('beforeend', item);
          });
        }
        dropdown.style.display = 'block';
      }
`;
js = js.replace(oldSearchRender, newSearchRender);

// F. Update receiving messages to update profile
const oldReceive = js.substring(js.indexOf("if (data.type === 'new_message')"), js.indexOf("} catch(err)"));
const newReceive = `
      if (data.type === 'new_message') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const senderId = (data.from || '').trim();
        
        // Update their profile info
        if (data.senderProfile) {
            let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
            profiles[senderId] = data.senderProfile;
            localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
        }
        
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
        savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage });
        localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        
        saveChat(senderId);
        
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage);
          socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));
        } else {
          let unreads = getUnreads();
          unreads[senderId] = (unreads[senderId] || 0) + 1;
          localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
        }
        loadChatList();
      }
`;
js = js.replace(oldReceive, newReceive);

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('Save button fixed and Profiles are now shared!');
