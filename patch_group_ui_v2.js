const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. UPDATE THE GROUP INFO HTML (Add options)
// ==========================================
const oldGroupHTML = `    <!-- Buttons -->
    <button onclick="promptAddMember()" style="background:var(--search-bg); color:var(--text); padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-bottom:10px; cursor:pointer;">
      ➕ Add Member
    </button>

    <button onclick="exitCurrentGroup()" style="background:#e74c3c; color:white; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; cursor:pointer;">
      🚪 Exit Group
    </button>
  </div>
</div>`;

const newGroupHTML = `    <!-- Buttons -->
    <button onclick="openAddMemberModal()" style="background:var(--search-bg); color:var(--text); padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px; margin-bottom:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
      <span style="font-size:20px;">➕</span> Add Member
    </button>

    <!-- WhatsApp Style Options List -->
    <div style="width: 100%; border-top: 1px solid var(--glass-border); padding-top: 15px;">
        
        <div class="group-option" onclick="alert('Notification settings coming soon!')">
            <div style="font-size: 20px;">🔔</div>
            <div class="group-option-text">Notifications <span style="color:var(--text-muted); font-size:12px; margin-left:5px;">All</span></div>
        </div>

        <div class="group-option" onclick="alert('Media visibility settings coming soon!')">
            <div style="font-size: 20px;">🖼️</div>
            <div class="group-option-text">Media visibility</div>
        </div>

        <div class="group-option" onclick="alert('Messages are End-to-End Encrypted!')">
            <div style="font-size: 20px;">🔒</div>
            <div class="group-option-text">Encryption <div style="font-size:12px; color:var(--text-muted); font-weight:normal; margin-top:2px;">Messages are end-to-end encrypted.</div></div>
        </div>

        <div class="group-option" onclick="alert('Disappearing messages coming soon!')">
            <div style="font-size: 20px;">🕒</div>
            <div class="group-option-text">Disappearing messages <span style="color:var(--text-muted); font-size:12px; margin-left:5px;">Off</span></div>
        </div>

        <div class="group-option" onclick="alert('Chat Lock coming soon!')">
            <div style="font-size: 20px;">🔐</div>
            <div class="group-option-text">Chat lock <div style="font-size:12px; color:var(--text-muted); font-weight:normal; margin-top:2px;">Lock and hide this chat.</div></div>
        </div>

        <div class="group-option" onclick="alert('Advanced privacy coming soon!')">
            <div style="font-size: 20px;">🛡️</div>
            <div class="group-option-text">Advanced chat privacy <span style="color:var(--text-muted); font-size:12px; margin-left:5px;">Off</span></div>
        </div>

        <div class="group-option" onclick="alert('Added to Favorites!')">
            <div style="font-size: 20px;">❤️</div>
            <div class="group-option-text">Add to Favorites</div>
        </div>

        <div class="group-option" onclick="exportGroupChat()">
            <div style="font-size: 20px;">📤</div>
            <div class="group-option-text">Export chat</div>
        </div>

        <div class="group-option" onclick="clearGroupChat()">
            <div style="font-size: 20px; color:#e74c3c;">🚫</div>
            <div class="group-option-text" style="color:#e74c3c;">Clear chat</div>
        </div>

        <div class="group-option" onclick="exitCurrentGroup()">
            <div style="font-size: 20px; color:#e74c3c;">🚪</div>
            <div class="group-option-text" style="color:#e74c3c;">Exit group</div>
        </div>
    </div>
  </div>
</div>`;

if(html.includes(oldGroupHTML)) {
    html = html.replace(oldGroupHTML, newGroupHTML);
} else {
    console.log("❌ Could not find the group buttons block.");
}

// ==========================================
// 2. ADD THE BLURRED SEARCH MODAL HTML
// ==========================================
const searchModalHTML = `
<!-- ADD MEMBER BLURRED MODAL -->
<div id="add-member-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); z-index:999999; flex-direction:column; padding:20px;">
    
    <div style="display:flex; align-items:center; gap:15px; margin-top:20px; margin-bottom:20px;">
        <div onclick="closeAddMemberModal()" style="font-size:28px; color:var(--primary); cursor:pointer;">←</div>
        <h2 style="font-size:20px; color:var(--text); margin:0;">Add Member</h2>
    </div>

    <div class="search-box" style="margin-bottom:15px; background:rgba(255,255,255,0.1);">
        <span>🔍</span>
        <input type="text" id="add-member-search" placeholder="Search username..." oninput="searchUsersToAdd()" autocomplete="off">
    </div>

    <div id="add-member-results" style="flex:1; overflow-y:auto;">
        <!-- Results injected here -->
    </div>
</div>
`;

html = html.replace('</body>', searchModalHTML + '\n</body>');

// ==========================================
// 3. ADD THE JAVASCRIPT LOGIC
// ==========================================
const groupJSv2 = `
  // --- ADD MEMBER MODAL LOGIC ---
  function openAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'flex';
    document.getElementById('add-member-search').value = '';
    document.getElementById('add-member-results').innerHTML = '';
    setTimeout(() => document.getElementById('add-member-search').focus(), 100);
  }

  function closeAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'none';
  }

  function searchUsersToAdd() {
    const query = document.getElementById('add-member-search').value.trim().toLowerCase();
    const resultsBox = document.getElementById('add-member-results');
    resultsBox.innerHTML = '';

    if (query.length === 0) return;

    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let currentGroup = groups[activeChatId];
    let currentMembers = currentGroup ? currentGroup.members : [];

    // Filter profiles based on search
    let matches = Object.keys(profiles).filter(user => 
        (user.toLowerCase().includes(query) || (profiles[user].name && profiles[user].name.toLowerCase().includes(query)))
    );

    if (matches.length === 0) {
        resultsBox.innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:20px;">No users found</div>';
        return;
    }

    matches.forEach(user => {
        let p = profiles[user];
        let isAlreadyIn = currentMembers.includes(user);
        let avatarUrl = p.avatar || 'https://ui-avatars.com/api/?name=' + user.substring(0,2) + '&background=random';
        
        resultsBox.innerHTML += \`
            <div style="display:flex; align-items:center; gap:15px; padding:15px; background:rgba(255,255,255,0.05); border-radius:15px; margin-bottom:10px; cursor:\${isAlreadyIn ? 'not-allowed' : 'pointer'}; opacity:\${isAlreadyIn ? '0.5' : '1'};" onclick="addUserToGroup('\${user}')">
                <img src="\${avatarUrl}" style="width:45px; height:45px; border-radius:50%; object-fit:cover;">
                <div>
                    <div style="font-size:16px; font-weight:bold; color:var(--text);">\${p.name || user}</div>
                    <div style="font-size:12px; color:var(--text-muted);">@\${user}</div>
                </div>
                <div style="margin-left:auto; font-size:20px; color:var(--primary);">
                    \${isAlreadyIn ? '✓' : '+'}
                </div>
            </div>
        \`;
    });
  }

  function addUserToGroup(username) {
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[activeChatId];
    if (!g) return;

    if (g.members.includes(username)) {
        alert("User is already in this group!");
        return;
    }

    g.members.push(username);
    localStorage.setItem('bapp_groups', JSON.stringify(groups));

    // Notify Server
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'add_group_member', groupId: activeChatId, newMember: username }));
    }

    if (typeof showToast === 'function') showToast(username + " added to group!");
    else alert(username + " added to group!");

    closeAddMemberModal();
    openGroupInfo(activeChatId); // Refresh the list
  }

  function clearGroupChat() {
    if (confirm("Clear all messages in this group? This cannot be undone.")) {
        localStorage.removeItem('bapp_msgs_' + activeChatId);
        document.getElementById('chat-messages').innerHTML = '';
        loadChatList();
        alert("Chat cleared.");
    }
  }

  function exportGroupChat() {
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + activeChatId)) || [];
    let txt = "BAPP Chat Export\\n\\n";
    msgs.forEach(m => {
        txt += \`[\${m.time}] \${m.type === 'sent' ? 'You' : 'Them'}: \${m.text.startsWith('data:') ? '[Media]' : m.text}\\n\`;
    });
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BAPP_Export_' + activeChatId + '.txt';
    a.click();
  }
`;

// Inject the new JS
const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + groupJSv2 + html.substring(lastScriptIdx);
}

// Remove old promptAddMember function to prevent conflicts
const oldPromptFunc = /function promptAddMember\(\) \{[\s\S]*?alert\("Member added!"\);\s*openGroupInfo\(activeChatId\); \/\/ Refresh list\s*\}/g;
html = html.replace(oldPromptFunc, '');

// Add CSS for the group options
const groupOptionCSS = `
<style>
  .group-option {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 10px;
    cursor: pointer;
    border-bottom: 1px solid var(--glass-border);
  }
  .group-option:active {
    background: var(--search-bg);
    border-radius: 10px;
  }
  .group-option-text {
    font-size: 16px;
    color: var(--text);
    font-weight: 500;
  }
</style>
</head>`;
html = html.replace('</head>', groupOptionCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Blurred Search Modal & Full Group Options added!');
