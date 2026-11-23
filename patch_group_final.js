const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the receiver to route group messages to the group chat, not the sender's chat
// We replace all instances of the senderId logic inside the new_message handler
html = html.replace(
    /const senderId = \(data\.from \|\| ''\)\.trim\(\);/g,
    "const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();"
);

// 2. Add a bulletproof listener for group_created directly on the WebSocket
const groupListener = `
  // --- BULLETPROOF GROUP CREATION LISTENER ---
  socket.addEventListener('message', function(event) {
      try {
          const data = JSON.parse(event.data);
          if (data.type === 'group_created') {
              let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
              groups[data.groupId] = { name: data.groupName, members: data.members };
              localStorage.setItem('bapp_groups', JSON.stringify(groups));
              
              // Save to chat list and refresh
              saveChat(data.groupId); 
              loadChatList();
              
              if (typeof showToast === 'function') showToast("Added to group: " + data.groupName);
              else alert("Added to group: " + data.groupName);
          }
      } catch(e) { console.error("Group Listener Error:", e); }
  });
`;

// Inject it right after the socket is created
html = html.replace("let socket = new WebSocket('ws://' + location.host);", "let socket = new WebSocket('ws://' + location.host);\n" + groupListener);

fs.writeFileSync('index.html', html);
console.log('✅ Group sync and welcome message patched successfully!');
