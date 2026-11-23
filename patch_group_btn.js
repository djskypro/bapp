const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the button right after the Phone number section
const targetPhone = `      <div id="info-phone" style="font-size:16px; color:var(--primary);">Not shared</div>
    </div>`;

const newPhone = `      <div id="info-phone" style="font-size:16px; color:var(--primary);">Not shared</div>
    </div>

    <button onclick="createGroupWith()" style="background:var(--primary); color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-top:10px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:10px;">
      👥 Create Group with this user
    </button>`;

if(html.includes(targetPhone)) {
    html = html.replace(targetPhone, newPhone);
}

// 2. Add the createGroupWith function at the end of the script
const groupJS = `
  function createGroupWith() {
    const targetUser = activeChatId;
    const groupName = prompt("Enter Group Name:", "Group with " + targetUser);
    if (!groupName) return;

    const groupId = "group_" + Date.now();
    const members = [myBappId, targetUser];

    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    groups[groupId] = { name: groupName, members: members };
    localStorage.setItem('bapp_groups', JSON.stringify(groups));

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'create_group', groupId, groupName, members, creator: myBappId }));
    }

    saveChat(groupId);
    loadChatList();
    closeContactInfo();
    openChat(groupId);
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + groupJS + html.substring(lastScriptIdx);
}

fs.writeFileSync('index.html', html);
console.log('✅ Group button added to Profile!');
