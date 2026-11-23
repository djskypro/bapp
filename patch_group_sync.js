const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Send creator & group info)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Update create_group to send creator
serverJs = serverJs.replace(
    "targetWs.send(JSON.stringify({ type: 'group_created', groupId, groupName, members }));",
    "targetWs.send(JSON.stringify({ type: 'group_created', groupId, groupName, members, creator: creator }));"
);

// Update add_group_member to pass group details
const oldAddMember = `        if (data.type === 'add_group_member') {
            const { groupId, newMember } = data;
            const targetWs = bappUsers.get(newMember);
            if (targetWs && targetWs.readyState === 1) {
                targetWs.send(JSON.stringify({ type: 'added_to_group', groupId }));
            }
        }`;
const newAddMember = `        if (data.type === 'add_group_member') {
            const { groupId, newMember, groupName, members, creator } = data;
            const targetWs = bappUsers.get(newMember);
            if (targetWs && targetWs.readyState === 1) {
                // Re-use group_created so they get the full group and welcome message
                targetWs.send(JSON.stringify({ type: 'group_created', groupId, groupName, members, creator: creator }));
            }
        }`;

serverJs = serverJs.replace(oldAddMember, newAddMember);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT (Welcome Message & Sync)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Update addUserToGroup to send group name/members to server
const oldAddUser = `if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'add_group_member', groupId: activeChatId, newMember: username }));`;
const newAddUser = `if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'add_group_member', groupId: activeChatId, newMember: username, groupName: g.name, members: g.members, creator: myBappId }));`;
html = html.replace(oldAddUser, newAddUser);

// B. Rewrite the group_created receiver to inject the beautiful welcome message
const oldReceiver = `      if (data.type === 'group_created') {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          groups[data.groupId] = { name: data.groupName, members: data.members };
          localStorage.setItem('bapp_groups', JSON.stringify(groups));
          saveChat(data.groupId); loadChatList();
      }`;

const newReceiver = `      if (data.type === 'group_created') {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          groups[data.groupId] = { name: data.groupName, members: data.members };
          localStorage.setItem('bapp_groups', JSON.stringify(groups));
          
          // Add the beautiful system message
          const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const welcomeText = "👋 " + (data.creator || "Someone") + " added you to the group \"" + data.groupName + "\"";
          
          let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.groupId)) || [];
          msgs.push({ 
              text: welcomeText, 
              type: 'received', 
              time: now, 
              msgId: Date.now().toString(),
              isSystem: true 
          });
          localStorage.setItem('bapp_msgs_' + data.groupId, JSON.stringify(msgs));
          
          saveChat(data.groupId); 
          loadChatList();
          
          if (typeof showToast === 'function') showToast("Added to group: " + data.groupName);
          else alert("Added to group: " + data.groupName);
      }`;

// Apply receiver update safely to all instances
if (html.includes(oldReceiver)) {
    html = html.replace(oldReceiver, newReceiver);
} else {
    // Fallback for spacing
    html = html.replace(
        "localStorage.setItem('bapp_groups', JSON.stringify(groups));\n          saveChat(data.groupId); loadChatList();",
        `localStorage.setItem('bapp_groups', JSON.stringify(groups));\n          
          const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const welcomeText = "👋 " + (data.creator || "Someone") + " added you to the group \\"" + data.groupName + "\\"";
          let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.groupId)) || [];
          msgs.push({ text: welcomeText, type: 'received', time: now, msgId: Date.now().toString(), isSystem: true });
          localStorage.setItem('bapp_msgs_' + data.groupId, JSON.stringify(msgs));
          
          saveChat(data.groupId); loadChatList();
          if (typeof showToast === 'function') showToast("Added to group: " + data.groupName);`
    );
}

fs.writeFileSync('index.html', html);
console.log('✅ Group Sync & Welcome Messages applied!');
