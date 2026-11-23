const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Route Group Messages)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldServerSend = `        if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor } = data;
            const cleanTo = to.trim();
            
            console.log(\`📩 Msg from [\${from}] to [\${cleanTo}] isVoice: \${isVoice}\`);

            const targetWs = bappUsers.get(cleanTo);
            let delivered = false;

            // Check if the user exists AND the socket is actually open (readyState 1)
            if (targetWs && targetWs.readyState === 1) {`;

const newServerSend = `        if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor, isGroup, groupMembers } = data;
            const cleanTo = to.trim();
            
            console.log(\`📩 Msg from [\${from}] to [\${cleanTo}] isGroup: \${isGroup}\`);

            // --- GROUP MESSAGE ROUTING ---
            if (isGroup && groupMembers && groupMembers.length > 0) {
                groupMembers.forEach(member => {
                    if (member === from) return; // Don't send to yourself
                    const targetWs = bappUsers.get(member);
                    if (targetWs && targetWs.readyState === 1) {
                        targetWs.send(JSON.stringify({
                            type: 'new_message', from: from, text: text, isImage: isImage || false, isVoice: isVoice || false,
                            msgId: msgId, replyData: replyData, isWhisper: isWhisper || false, isVideo: isVideo || false, 
                            bubbleColor: bubbleColor, isGroup: true, groupId: cleanTo, groupMembers: groupMembers
                        }));
                    } else {
                        // Save for offline member
                        let db = {};
                        try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
                        if (!db[member]) db[member] = [];
                        db[member].push({
                            from: from, text: text, isImage: isImage || false, isVoice: isVoice || false, isVideo: isVideo || false,
                            msgId: msgId, replyData: replyData, isWhisper: isWhisper || false, bubbleColor: bubbleColor,
                            isGroup: true, groupId: cleanTo, groupMembers: groupMembers
                        });
                        try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch(e) {}
                    }
                });
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                return; // Stop here so it doesn't run the single-user logic below
            }

            // --- SINGLE USER MESSAGE ROUTING ---
            const targetWs = bappUsers.get(cleanTo);
            let delivered = false;

            if (targetWs && targetWs.readyState === 1) {`;

serverJs = serverJs.replace(oldServerSend, newServerSend);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT (UI & Logic)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add "Create Group" button to Contact Info HTML
const oldContactHTML = `      <div style="width:100%; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:10px;">
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">Location</div>
        <div id="info-location" style="font-size:16px;">Unknown</div>
      </div>
    </div>
  </div>
</div>`;

const newContactHTML = `      <div style="width:100%; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:10px;">
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">Location</div>
        <div id="info-location" style="font-size:16px;">Unknown</div>
      </div>

      <button onclick="createGroupWith()" style="background:var(--primary); color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-top:10px; cursor:pointer;">
        👥 Create Group with this user
      </button>
    </div>
  </div>
</div>`;

if(html.includes(oldContactHTML)) {
    html = html.replace(oldContactHTML, newContactHTML);
} else {
    // Fallback if spacing is off
    const fallbackRegex = /(<div id="info-location"[^>]*>.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/s;
    html = html.replace(fallbackRegex, `<div id="info-location" style="font-size:16px;">Unknown</div>
      </div>
      <button onclick="createGroupWith()" style="background:var(--primary); color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-top:10px; cursor:pointer;">
        👥 Create Group with this user
      </button>
    </div>
  </div>
</div>`);
}

// B. Add createGroupWith logic
const groupLogic = `
  function createGroupWith() {
    const targetUser = activeChatId;
    const groupName = prompt("Enter Group Name:", "Group with " + targetUser);
    if (!groupName) return;

    const groupId = "group_" + Date.now();
    const members = [myBappId, targetUser];

    // Save Group Data
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    groups[groupId] = { name: groupName, members: members };
    localStorage.setItem('bapp_groups', JSON.stringify(groups));

    // Add to Chat List
    saveChat(groupId);
    loadChatList();

    // Open the new group chat
    closeContactInfo();
    openChat(groupId);
  }
`;
html = html.replace("function openContactInfo() {", groupLogic + "\n  function openContactInfo() {");

// C. Update loadChatList to show Group names and avatars
const oldListLogic = `      const p = profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };
      const displayName = p.name || id;
      const avatarUrl = p.avatar;`;

const newListLogic = `      let displayName = id;
      let avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      let isGroup = id.startsWith('group_');

      if (isGroup) {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          if (groups[id]) {
              displayName = groups[id].name;
              avatarUrl = 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff';
          }
      } else {
          const p = profiles[id] || {};
          displayName = p.name || id;
          avatarUrl = p.avatar || avatarUrl;
      }`;
html = html.replace(oldListLogic, newListLogic);

// D. Update sendMessage to handle groups
const oldSendPayload = `      const payload = {
          type: 'send_message',
          to: to,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: reply,
          bubbleColor: myProfile.bubbleColor || '#005c4b'
      };`;

const newSendPayload = `      const isGroup = activeChatId.startsWith('group_');
      let groupMembers = [];
      if (isGroup) {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          if (groups[activeChatId]) groupMembers = groups[activeChatId].members;
      }

      const payload = {
          type: 'send_message',
          to: to,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: reply,
          bubbleColor: myProfile.bubbleColor || '#005c4b',
          isGroup: isGroup,
          groupMembers: groupMembers
      };`;
html = html.replace(oldSendPayload, newSendPayload);

// E. Update openChat to show Group Name in header
const oldOpenChatHeader = `    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let p = profileObj || profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };
    
    document.getElementById('chat-name').textContent = p.name || id;`;

const newOpenChatHeader = `    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let p = profileObj || profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };
    
    // Check if it's a group
    if (id.startsWith('group_')) {
        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
        if (groups[id]) {
            p = { name: groups[id].name, avatar: 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff' };
        }
    }

    document.getElementById('chat-name').textContent = p.name || id;`;
html = html.replace(oldOpenChatHeader, newOpenChatHeader);

fs.writeFileSync('index.html', html);
console.log('✅ Group Chats feature added perfectly!');
