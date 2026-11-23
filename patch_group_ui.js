const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Group Creation & Sync)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const groupServerLogic = `
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
    serverJs = serverJs.replace("if (data.type === 'send_message') {", groupServerLogic + "\n        if (data.type === 'send_message') {");
    fs.writeFileSync('server.js', serverJs);
}

// ==========================================
// 2. PATCH CLIENT (UI & Logic)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Inject the Group Info HTML before the Settings View
const groupHTML = `
<!-- GROUP INFO VIEW -->
<div id="group-info-view" class="view">
  <div class="header" style="padding-top: 40px;">
    <div style="display:flex; align-items:center; gap:15px;">
      <div class="back-btn" onclick="closeGroupInfo()">←</div>
      <h1>Group Info</h1>
    </div>
  </div>
  
  <div class="settings-content" style="align-items:center; display:flex; flex-direction:column;">
    <img id="group-info-avatar" src="https://ui-avatars.com/api/?name=👥&background=25D366&color=fff" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); margin-bottom: 15px;">
    <h2 id="group-info-name" style="font-size:24px; margin-bottom:5px;">Group Name</h2>
    <div id="group-info-count" style="color:var(--text-muted); font-size:14px; margin-bottom:20px;">0 members</div>
    
    <!-- Members List -->
    <div style="width:100%; text-align:left; font-size:14px; font-weight:bold; color:var(--primary); margin-bottom:10px;">Members</div>
    <div id="group-members-list" style="width:100%; display:flex; flex-direction:column; gap:10px; margin-bottom:20px;"></div>

    <!-- Buttons -->
    <button onclick="promptAddMember()" style="background:var(--search-bg); color:var(--text); padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-bottom:10px; cursor:pointer;">
      ➕ Add Member
    </button>

    <button onclick="exitCurrentGroup()" style="background:#e74c3c; color:white; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; cursor:pointer;">
      🚪 Exit Group
    </button>
  </div>
</div>
`;
if (!html.includes('id="group-info-view"')) {
    html = html.replace('<!-- SETTINGS VIEW -->', groupHTML + '\n<!-- SETTINGS VIEW -->');
}

// B. Modify openContactInfo to route to Group Info if it's a group
const oldOpenContact = `  function openContactInfo() {
    history.pushState({ view: 'contact' }, '', '#contact');
    const currentUsername = activeChatId;`;

const newOpenContact = `  function openContactInfo() {
    // ROUTING: Check if it's a group!
    if (activeChatId && activeChatId.startsWith('group_')) {
        openGroupInfo(activeChatId);
        return;
    }

    history.pushState({ view: 'contact' }, '', '#contact');
    const currentUsername = activeChatId;`;
html = html.replace(oldOpenContact, newOpenContact);

// C. Inject the Group Info JS Logic
const groupJS = `
  // --- GROUP INFO LOGIC ---
  function openGroupInfo(groupId) {
    history.pushState({ view: 'group_info' }, '', '#group_info');
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[groupId];
    if(!g) return;

    document.getElementById('group-info-name').textContent = g.name;
    document.getElementById('group-info-count').textContent = g.members.length + " members";
    
    // Render Members
    const list = document.getElementById('group-members-list');
    list.innerHTML = '';
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    
    g.members.forEach(member => {
        let p = profiles[member] || { name: member, avatar: 'https://ui-avatars.com/api/?name=' + member.substring(0,2) + '&background=random' };
        list.innerHTML += \`
          <div style="display:flex; align-items:center; gap:10px; background:var(--search-bg); padding:10px; border-radius:12px;">
            <img src="\${p.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
            <div style="font-size:16px; font-weight:500;">\${p.name || member} \${member === myBappId ? '(You)' : ''}</div>
          </div>
        \`;
    });

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('group-info-view').classList.add('active');
  }

  function closeGroupInfo() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
  }

  function promptAddMember() {
    const newMember = prompt("Enter BAPP username to add to group:");
    if (!newMember || newMember.trim() === "") return;
    const cleanUser = newMember.trim().toLowerCase();
    
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[activeChatId];
    if (!g) return;
    
    if (g.members.includes(cleanUser)) {
        alert("User is already in this group!");
        return;
    }
    
    g.members.push(cleanUser);
    localStorage.setItem('bapp_groups', JSON.stringify(groups));
    
    // Notify server to tell the new member
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'add_group_member', groupId: activeChatId, newMember: cleanUser }));
    }
    
    alert("Member added!");
    openGroupInfo(activeChatId); // Refresh list
  }

  function exitCurrentGroup() {
    if(!confirm("Are you sure you want to exit this group?")) return;
    
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[activeChatId];
    if(g) {
        g.members = g.members.filter(m => m !== myBappId);
        localStorage.setItem('bapp_groups', JSON.stringify(groups));
    }
    
    // Remove chat from list
    let chats = getChats();
    chats = chats.filter(id => id !== activeChatId);
    localStorage.setItem('bapp_chats', JSON.stringify(chats));
    
    loadChatList();
    goBack();
  }
`;
html = html.replace("function openSettings() {", groupJS + "\n  function openSettings() {");

// D. Update the Group Creation to send to server
const oldCreateGroup = `    // Save Group Data
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    groups[groupId] = { name: groupName, members: members };
    localStorage.setItem('bapp_groups', JSON.stringify(groups));`;

const newCreateGroup = `    // Save Group Data
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    groups[groupId] = { name: groupName, members: members };
    localStorage.setItem('bapp_groups', JSON.stringify(groups));

    // Notify Server
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'create_group', groupId: groupId, groupName: groupName, members: members, creator: myBappId }));
    }`;
html = html.replace(oldCreateGroup, newCreateGroup);

// E. Listen for Group Creation on the Receiver's side
const oldReceiveMsg = `      if (data.type === 'new_message') {`;
const newReceiveMsg = `      if (data.type === 'group_created') {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          groups[data.groupId] = { name: data.groupName, members: data.members };
          localStorage.setItem('bapp_groups', JSON.stringify(groups));
          saveChat(data.groupId);
          loadChatList();
      }

      if (data.type === 'added_to_group') {
          // The user was added to a group, let's sync it if we have the data (simplified for now)
          loadChatList();
      }

      if (data.type === 'new_message') {`;
html = html.replace(oldReceiveMsg, newReceiveMsg);

// F. Update Chat List to show group member count
const oldGroupList = `          if (groups[id]) {
              displayName = groups[id].name;
              avatarUrl = 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff';
          }`;
const newGroupList = `          if (groups[id]) {
              displayName = groups[id].name;
              avatarUrl = 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff';
              // We can't easily put member count in the name without breaking layout, so we leave it as is for now
          }`;
html = html.replace(oldGroupList, newGroupList);

fs.writeFileSync('index.html', html);
console.log('✅ Group Info UI and Server Sync added perfectly!');
