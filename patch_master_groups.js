const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Group Routing)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const serverGroupLogic = `
        if (data.type === 'create_group') {
            const { groupId, groupName, members, creator } = data;
            members.forEach(member => {
                if (member !== creator) {
                    const targetWs = bappUsers.get(member);
                    if (targetWs && targetWs.readyState === 1) {
                        targetWs.send(JSON.stringify({ type: 'group_created', groupId, groupName, members }));
                    }
                }
            });
        }

        if (data.type === 'add_group_member') {
            const { groupId, newMember } = data;
            const targetWs = bappUsers.get(newMember);
            if (targetWs && targetWs.readyState === 1) {
                targetWs.send(JSON.stringify({ type: 'added_to_group', groupId }));
            }
        }
`;

if(!serverJs.includes("data.type === 'create_group'")) {
    serverJs = serverJs.replace("if (data.type === 'send_message') {", serverGroupLogic + "\n        if (data.type === 'send_message') {");
    
    // Update send_message to handle groups
    const oldServerSend = `        if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor } = data;
            const cleanTo = to.trim();
            
            console.log(\`📩 Msg from [\${from}] to [\${cleanTo}] isVoice: \${isVoice}\`);

            const targetWs = bappUsers.get(cleanTo);
            let delivered = false;`;
            
    const newServerSend = `        if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor, isGroup, groupMembers } = data;
            const cleanTo = to.trim();
            
            console.log(\`📩 Msg from [\${from}] to [\${cleanTo}] isGroup: \${isGroup}\`);

            if (isGroup && groupMembers && groupMembers.length > 0) {
                groupMembers.forEach(member => {
                    if (member === from) return;
                    const targetWs = bappUsers.get(member);
                    if (targetWs && targetWs.readyState === 1) {
                        targetWs.send(JSON.stringify({
                            type: 'new_message', from: from, text: text, isImage: isImage || false, isVoice: isVoice || false,
                            msgId: msgId, replyData: replyData, isWhisper: isWhisper || false, isVideo: isVideo || false, 
                            bubbleColor: bubbleColor, isGroup: true, groupId: cleanTo, groupMembers: groupMembers
                        }));
                    } else {
                        let db = {}; try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
                        if (!db[member]) db[member] = [];
                        db[member].push({ from: from, text: text, isImage: isImage || false, isVoice: isVoice || false, isVideo: isVideo || false, msgId: msgId, replyData: replyData, isWhisper: isWhisper || false, bubbleColor: bubbleColor, isGroup: true, groupId: cleanTo, groupMembers: groupMembers });
                        try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch(e) {}
                    }
                });
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                return;
            }

            const targetWs = bappUsers.get(cleanTo);
            let delivered = false;`;
            
    serverJs = serverJs.replace(oldServerSend, newServerSend);
    fs.writeFileSync('server.js', serverJs);
}

// ==========================================
// 2. PATCH CLIENT
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Inject HTML Modals & Views
const modalsHTML = `
<style>
  .group-option { display: flex; align-items: center; gap: 15px; padding: 15px 10px; cursor: pointer; border-bottom: 1px solid var(--glass-border); }
  .group-option:active { background: var(--search-bg); border-radius: 10px; }
  .group-option-text { font-size: 16px; color: var(--text); font-weight: 500; }
</style>

<!-- GROUP INFO VIEW -->
<div id="group-info-view" class="view">
  <div class="header" style="padding-top: 40px;">
    <div style="display:flex; align-items:center; gap:15px;"><div class="back-btn" onclick="closeGroupInfo()">←</div><h1>Group Info</h1></div>
  </div>
  <div class="settings-content" style="align-items:center; display:flex; flex-direction:column;">
    <img src="https://ui-avatars.com/api/?name=👥&background=25D366&color=fff" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); margin-bottom: 15px;">
    <h2 id="group-info-name" style="font-size:24px; margin-bottom:5px;">Group Name</h2>
    <div id="group-info-count" style="color:var(--text-muted); font-size:14px; margin-bottom:20px;">0 members</div>
    <div id="group-members-list" style="width:100%; display:flex; flex-direction:column; gap:10px; margin-bottom:20px;"></div>
    <button onclick="openAddMemberModal()" style="background:var(--search-bg); color:var(--text); padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-bottom:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;"><span style="font-size:20px;">➕</span> Add Member</button>
    <div style="width: 100%; border-top: 1px solid var(--glass-border); padding-top: 15px;">
        <div class="group-option" onclick="openGlassMenu('Notifications', ['All', 'Mentions', 'Mute'], 'notifications')"><div style="font-size: 20px;">🔔</div><div class="group-option-text">Notifications <span id="grp-notif-val" style="color:var(--text-muted); font-size:12px; margin-left:5px;"></span></div></div>
        <div class="group-option" onclick="openGlassMenu('Media visibility', ['On', 'Off'], 'mediaVisibility')"><div style="font-size: 20px;">🖼️</div><div class="group-option-text">Media visibility</div></div>
        <div class="group-option" onclick="openGlassMenu('Encryption', ['Messages and calls are end-to-end encrypted. No one outside of this chat, not even BAPP, can read or listen to them.'], 'dummy')"><div style="font-size: 20px;">🔒</div><div class="group-option-text">Encryption</div></div>
        <div class="group-option" onclick="openGlassMenu('Disappearing messages', ['Off', '24 Hours', '7 Days', '90 Days'], 'disappearing')"><div style="font-size: 20px;">🕒</div><div class="group-option-text">Disappearing messages <span id="grp-disappear-val" style="color:var(--text-muted); font-size:12px; margin-left:5px;"></span></div></div>
        <div class="group-option" onclick="openPrivacyModal()"><div style="font-size: 20px;">🛡️</div><div class="group-option-text">Advanced chat privacy</div></div>
        <div class="group-option" onclick="clearGroupChat()"><div style="font-size: 20px; color:#e74c3c;">🚫</div><div class="group-option-text" style="color:#e74c3c;">Clear chat</div></div>
        <div class="group-option" onclick="exitCurrentGroup()"><div style="font-size: 20px; color:#e74c3c;">🚪</div><div class="group-option-text" style="color:#e74c3c;">Exit group</div></div>
    </div>
  </div>
</div>

<!-- GLASS MENUS & MODALS -->
<div id="glass-options-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index:999999; flex-direction:column; justify-content:center; align-items:center;">
    <div class="glass" style="width:85%; max-width:350px; padding:25px; border-radius:20px; display:flex; flex-direction:column;">
        <h3 id="glass-options-title" style="color:white; font-size:20px; margin-bottom:15px; font-weight:bold;">Options</h3>
        <div id="glass-options-list" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;"></div>
        <button onclick="document.getElementById('glass-options-modal').style.display='none'" style="background:var(--search-bg); color:white; border:none; padding:12px; border-radius:12px; font-weight:bold;">Cancel</button>
    </div>
</div>
<div id="privacy-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index:999999; flex-direction:column; justify-content:center; align-items:center;">
    <div class="glass" style="width:90%; max-width:400px; padding:25px; border-radius:20px; display:flex; flex-direction:column;">
        <h3 style="color:var(--primary); font-size:22px; margin-bottom:5px; font-weight:bold;">🛡️ Advanced Privacy</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;"><div><div style="color:white; font-size:15px; font-weight:bold;">Blur on App Switch</div><div style="color:var(--text-muted); font-size:11px;">Hides chat in task switcher</div></div><input type="checkbox" id="privacy-blur" style="width:20px; height:20px; accent-color:var(--primary);"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;"><div><div style="color:white; font-size:15px; font-weight:bold;">Anti-Copy Mode</div><div style="color:var(--text-muted); font-size:11px;">Prevents text selection</div></div><input type="checkbox" id="privacy-anticopy" style="width:20px; height:20px; accent-color:var(--primary);"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><div><div style="color:white; font-size:15px; font-weight:bold;">Hide Previews</div><div style="color:var(--text-muted); font-size:11px;">Hides text on main chat list</div></div><input type="checkbox" id="privacy-previews" style="width:20px; height:20px; accent-color:var(--primary);"></div>
        <button onclick="saveAdvancedPrivacy()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:12px; font-weight:bold; font-size:16px; margin-bottom:10px;">Save Settings</button>
        <button onclick="document.getElementById('privacy-modal').style.display='none'" style="background:var(--search-bg); color:white; border:none; padding:12px; border-radius:12px; font-weight:bold;">Cancel</button>
    </div>
</div>
<div id="add-member-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); z-index:999999; flex-direction:column; padding:20px;">
    <div style="display:flex; align-items:center; gap:15px; margin-top:20px; margin-bottom:20px;"><div onclick="closeAddMemberModal()" style="font-size:28px; color:var(--primary); cursor:pointer;">←</div><h2 style="font-size:20px; color:var(--text); margin:0;">Add Member</h2></div>
    <div class="search-box" style="margin-bottom:15px; background:rgba(255,255,255,0.1);"><span>🔍</span><input type="text" id="add-member-search" placeholder="Search username..." oninput="searchUsersToAdd()" autocomplete="off"></div>
    <div id="add-member-results" style="flex:1; overflow-y:auto;"></div>
</div>
</body>`;

if (!html.includes('id="group-info-view"')) {
    html = html.replace('</body>', modalsHTML);
}

// B. Inject the Javascript Logic
const jsLogic = `
  // --- MASTER GROUP & PRIVACY LOGIC ---
  function openGroupInfo(groupId) {
    history.pushState({ view: 'group_info' }, '', '#group_info');
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[groupId];
    if(!g) return;
    document.getElementById('group-info-name').textContent = g.name;
    document.getElementById('group-info-count').textContent = g.members.length + " members";
    const list = document.getElementById('group-members-list');
    list.innerHTML = '';
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    g.members.forEach(member => {
        let p = profiles[member] || { name: member, avatar: 'https://ui-avatars.com/api/?name=' + member.substring(0,2) + '&background=random' };
        list.innerHTML += \`<div style="display:flex; align-items:center; gap:10px; background:var(--search-bg); padding:10px; border-radius:12px;"><img src="\${p.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"><div style="font-size:16px; font-weight:500;">\${p.name || member} \${member === myBappId ? '(You)' : ''}</div></div>\`;
    });
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('group-info-view').classList.add('active');
  }

  function closeGroupInfo() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
  }

  function openAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'flex';
    document.getElementById('add-member-search').value = '';
    document.getElementById('add-member-results').innerHTML = '';
    setTimeout(() => document.getElementById('add-member-search').focus(), 100);
  }
  function closeAddMemberModal() { document.getElementById('add-member-modal').style.display = 'none'; }

  function searchUsersToAdd() {
    const query = document.getElementById('add-member-search').value.trim().toLowerCase();
    const resultsBox = document.getElementById('add-member-results');
    resultsBox.innerHTML = '';
    if (query.length === 0) return;
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let currentMembers = groups[activeChatId] ? groups[activeChatId].members : [];
    let matches = Object.keys(profiles).filter(user => (user.toLowerCase().includes(query) || (profiles[user].name && profiles[user].name.toLowerCase().includes(query))));
    if (matches.length === 0) { resultsBox.innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:20px;">No users found</div>'; return; }
    matches.forEach(user => {
        let p = profiles[user];
        let isAlreadyIn = currentMembers.includes(user);
        let avatarUrl = p.avatar || 'https://ui-avatars.com/api/?name=' + user.substring(0,2) + '&background=random';
        resultsBox.innerHTML += \`<div style="display:flex; align-items:center; gap:15px; padding:15px; background:rgba(255,255,255,0.05); border-radius:15px; margin-bottom:10px; cursor:\${isAlreadyIn ? 'not-allowed' : 'pointer'}; opacity:\${isAlreadyIn ? '0.5' : '1'};" onclick="addUserToGroup('\${user}')"><img src="\${avatarUrl}" style="width:45px; height:45px; border-radius:50%; object-fit:cover;"><div><div style="font-size:16px; font-weight:bold; color:var(--text);">\${p.name || user}</div><div style="font-size:12px; color:var(--text-muted);">@\${user}</div></div><div style="margin-left:auto; font-size:20px; color:var(--primary);">\${isAlreadyIn ? '✓' : '+'}</div></div>\`;
    });
  }

  function addUserToGroup(username) {
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[activeChatId];
    if (!g || g.members.includes(username)) return;
    g.members.push(username);
    localStorage.setItem('bapp_groups', JSON.stringify(groups));
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'add_group_member', groupId: activeChatId, newMember: username }));
    if (typeof showToast === 'function') showToast(username + " added!");
    closeAddMemberModal();
    openGroupInfo(activeChatId);
  }

  function openGlassMenu(title, options, settingKey) {
      document.getElementById('glass-options-title').innerText = title;
      const list = document.getElementById('glass-options-list');
      list.innerHTML = '';
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let currentSetting = settings[activeChatId] ? settings[activeChatId][settingKey] : null;
      options.forEach(opt => {
          let isSelected = (currentSetting === opt) || (opt.includes('encrypted') && settingKey === 'dummy');
          if (settingKey === 'dummy') {
              list.innerHTML += '<div style="color:var(--text-muted); font-size:14px; line-height:1.5;">' + opt + '</div>';
          } else {
              list.innerHTML += \`<div onclick="selectGlassOption('\${settingKey}', '\${opt}')" style="background:\${isSelected ? 'var(--primary)' : 'var(--search-bg)'}; color:\${isSelected ? 'black' : 'white'}; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:space-between;"><span>\${opt}</span>\${isSelected ? '<span>✓</span>' : ''}</div>\`;
          }
      });
      document.getElementById('glass-options-modal').style.display = 'flex';
  }

  function selectGlassOption(key, value) {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId][key] = value;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      document.getElementById('glass-options-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Updated to " + value);
      if (key === 'notifications') document.getElementById('grp-notif-val').innerText = value;
      if (key === 'disappearing') document.getElementById('grp-disappear-val').innerText = value;
  }

  function openPrivacyModal() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let p = settings[activeChatId] || {};
      document.getElementById('privacy-blur').checked = p.blurOnSwitch || false;
      document.getElementById('privacy-anticopy').checked = p.antiCopy || false;
      document.getElementById('privacy-previews').checked = p.hidePreviews || false;
      document.getElementById('privacy-modal').style.display = 'flex';
  }

  function saveAdvancedPrivacy() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId].blurOnSwitch = document.getElementById('privacy-blur').checked;
      settings[activeChatId].antiCopy = document.getElementById('privacy-anticopy').checked;
      settings[activeChatId].hidePreviews = document.getElementById('privacy-previews').checked;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      document.getElementById('privacy-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Privacy Settings Saved! 🛡️");
  }

  function clearGroupChat() {
      if (confirm("Clear all messages in this chat? This cannot be undone.")) {
          localStorage.removeItem('bapp_msgs_' + activeChatId);
          document.getElementById('chat-messages').innerHTML = '';
          loadChatList();
          if(typeof showToast === 'function') showToast("Chat cleared!"); else alert("Chat cleared.");
      }
  }
  
  function exitCurrentGroup() {
      if(!confirm("Are you sure you want to exit this group?")) return;
      let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
      let g = groups[activeChatId];
      if(g) { g.members = g.members.filter(m => m !== myBappId); localStorage.setItem('bapp_groups', JSON.stringify(groups)); }
      let chats = getChats(); chats = chats.filter(id => id !== activeChatId);
      localStorage.setItem('bapp_chats', JSON.stringify(chats));
      loadChatList(); goBack();
  }

  // Blur logic
  window.addEventListener('blur', function() {
      if (!activeChatId) return;
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if (settings[activeChatId] && settings[activeChatId].blurOnSwitch) {
          const msgBox = document.getElementById('chat-messages');
          if(msgBox) msgBox.style.filter = 'blur(15px)';
      }
  });
  window.addEventListener('focus', function() {
      const msgBox = document.getElementById('chat-messages');
      if(msgBox) msgBox.style.filter = 'none';
  });
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) html = html.substring(0, lastScriptIdx) + jsLogic + html.substring(lastScriptIdx);

// C. Safely modify existing functions using exact anchors
// 1. openContactInfo: Route to group info
const oldOpenContact = `  function openContactInfo() {
    history.pushState({ view: 'contact' }, '', '#contact');`;
const newOpenContact = `  function openContactInfo() {
    if (activeChatId && activeChatId.startsWith('group_')) { openGroupInfo(activeChatId); return; }
    history.pushState({ view: 'contact' }, '', '#contact');`;
html = html.replace(oldOpenContact, newOpenContact);

// 2. Add "Create Group" button to Contact Info
const oldContactBtn = `<div style="width:100%; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:10px;">\n        <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">Location</div>`;
const newContactBtn = `<button onclick="createGroupWith()" style="background:var(--primary); color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-bottom:15px; cursor:pointer;">👥 Create Group with this user</button>
    <div style="width:100%; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:10px;">\n        <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">Location</div>`;
html = html.replace(oldContactBtn, newContactBtn);

// 3. Inject createGroupWith function
const createGroupFunc = `
  function createGroupWith() {
    const targetUser = activeChatId;
    const groupName = prompt("Enter Group Name:", "Group with " + targetUser);
    if (!groupName) return;
    const groupId = "group_" + Date.now();
    const members = [myBappId, targetUser];
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    groups[groupId] = { name: groupName, members: members };
    localStorage.setItem('bapp_groups', JSON.stringify(groups));
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'create_group', groupId, groupName, members, creator: myBappId }));
    saveChat(groupId);
    loadChatList();
    closeContactInfo();
    openChat(groupId);
  }
`;
html = html.replace("function openContactInfo() {", createGroupFunc + "\n  function openContactInfo() {");

// 4. Update loadChatList to handle groups
const oldListLogic = `      const p = profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };\n      const displayName = p.name || id;\n      const avatarUrl = p.avatar;`;
const newListLogic = `      let displayName = id;
      let avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      let isGroup = id.startsWith('group_');
      if (isGroup) {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          if (groups[id]) { displayName = groups[id].name; avatarUrl = 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff'; }
      } else {
          const p = profiles[id] || {};
          displayName = p.name || id;
          avatarUrl = p.avatar || avatarUrl;
      }`;
html = html.replace(oldListLogic, newListLogic);

// 5. Update sendMessage payload for groups
const oldSendPayload = `      const payload = {\n          type: 'send_message',\n          to: to,\n          from: myBappId,\n          text: text,\n          msgId: msgId,\n          replyData: reply,\n          bubbleColor: myProfile.bubbleColor || '#005c4b'\n      };`;
const newSendPayload = `      const isGroup = activeChatId.startsWith('group_');
      let groupMembers = [];
      if (isGroup) { let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {}; if (groups[activeChatId]) groupMembers = groups[activeChatId].members; }
      const payload = {\n          type: 'send_message',\n          to: to,\n          from: myBappId,\n          text: text,\n          msgId: msgId,\n          replyData: reply,\n          bubbleColor: myProfile.bubbleColor || '#005c4b',\n          isGroup: isGroup,\n          groupMembers: groupMembers\n      };`;
html = html.replace(oldSendPayload, newSendPayload);

// 6. Update openChat header for groups
const oldOpenChatHeader = `    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};\n    let p = profileObj || profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };\n    \n    document.getElementById('chat-name').textContent = p.name || id;`;
const newOpenChatHeader = `    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let p = profileObj || profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };
    if (id.startsWith('group_')) { let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {}; if (groups[id]) { p = { name: groups[id].name, avatar: 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff' }; } }
    document.getElementById('chat-name').textContent = p.name || id;`;
html = html.replace(oldOpenChatHeader, newOpenChatHeader);

// 7. Update Socket Receivers for groups
const oldReceiveMsg = `      if (data.type === 'new_message') {`;
const newReceiveMsg = `      if (data.type === 'group_created') {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          groups[data.groupId] = { name: data.groupName, members: data.members };
          localStorage.setItem('bapp_groups', JSON.stringify(groups));
          saveChat(data.groupId); loadChatList();
      }
      if (data.type === 'new_message') {`;
html = html.replace(oldReceiveMsg, newReceiveMsg);

fs.writeFileSync('index.html', html);
console.log('✅ Master Group System injected safely!');
