const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the Search Bar Logic (Remove duplicate const declarations)
const oldSearch = /function handleSearchInput\(\) \{[\s\S]*?const dropdown = document\.getElementById\('search-dropdown'\);/;
const newSearch = `function handleSearchInput() {
    const input = document.getElementById('search-input');
    const query = input.value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const blurOverlay = document.getElementById('search-blur-overlay');
    
    // Check Global PIN
    const globalPin = localStorage.getItem('bapp_global_pin');
    if (globalPin && query === globalPin) {
      dropdown.style.display = "block";
      dropdown.innerHTML = "<div onclick=\\"openHiddenChatsFromSearch()\\" style=\\"padding:15px; text-align:center; color:var(--primary); font-weight:bold; cursor:pointer; background:rgba(37,211,102,0.1); border-radius:10px; margin:5px;\\">🔓 Open Hidden Chats</div>";
      clearBtn.style.display = "block";
      blurOverlay.style.display = "block";
      return;
    }`;
html = html.replace(oldSearch, newSearch);

// 2. Update PIN logic to check old PIN correctly
const oldSavePin = /function saveGlobalPin\(\) \{[\s\S]*?closeGlobalPinModal\(\);\s*\}/;
const newSavePin = `function saveGlobalPin() {
    const oldPin = localStorage.getItem('bapp_global_pin');
    const oldInput = document.getElementById('old-pin-input').value.trim();
    const newInput = document.getElementById('new-pin-input').value.trim();
    
    if (oldPin && oldInput !== oldPin) {
      alert("Incorrect current PIN! Please try again.");
      return;
    }
    
    if (newInput.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    
    localStorage.setItem('bapp_global_pin', newInput);
    alert("PIN successfully updated!");
    closeGlobalPinModal();
  }`;
html = html.replace(oldSavePin, newSavePin);

// 3. Add the Secret Mode View (Full screen app feeling)
const secretView = `
<!-- SECRET HIDDEN CHATS VIEW -->
<div id="hidden-chats-view" class="view" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:var(--bg); z-index:9999999; flex-direction:column;">
  
  <!-- SECRET HEADER -->
  <div class="header" style="padding-top: 40px; border-bottom: 1px solid rgba(255,255,255,0.1);">
    <div style="display:flex; justify-content:space-between; align-items:center; padding: 0 20px;">
      <div style="display:flex; align-items:center; gap:15px;">
        <div class="back-btn" onclick="closeHiddenChatsView()" style="cursor:pointer;">←</div>
        <h1 style="margin:0; color:var(--primary);">🔐 Secret Mode</h1>
      </div>
      <span style="font-size:12px; color:var(--text-muted); background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:8px;">Hidden</span>
    </div>
  </div>

  <!-- SECRET CHAT LIST -->
  <div id="hidden-chat-list-container" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:10px;">
    <!-- Hidden chats will be injected here -->
  </div>
</div>
`;
// Remove the old hidden view if it exists
html = html.replace(/<!-- HIDDEN CHATS VIEW -->[\s\S]*?<\/div>\s*<\/div>/, '');
html = html.replace('</body>', secretView + '</body>');

// 4. Update openHiddenChatsFromSearch to open this new view
const oldOpenSearch = /function openHiddenChatsFromSearch\(\) \{[\s\S]*?openChat\(chatIds\[0\]\);\s*\}\s*\}/;
const newOpenSearch = `function openHiddenChatsFromSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('clear-search').style.display = 'none';
    document.getElementById('search-blur-overlay').style.display = 'none';
    document.getElementById('hidden-chats-view').style.display = 'flex';
    loadHiddenChatsList();
  }`;
html = html.replace(oldOpenSearch, newOpenSearch);

// 5. Ensure the load function exists
if (!html.includes('function loadHiddenChatsList')) {
    const loadLogic = `
  function closeHiddenChatsView() {
    document.getElementById('hidden-chats-view').style.display = 'none';
    loadChatList(); // Refresh main list
  }

  function loadHiddenChatsList() {
    const container = document.getElementById('hidden-chat-list-container');
    container.innerHTML = '';
    
    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    const chatIds = Object.keys(hiddenChats);
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};

    if (chatIds.length === 0) {
      container.innerHTML = '<div style="text-align:center; color:#aaa; margin-top:50px;">No hidden chats found.</div>';
      return;
    }

    chatIds.forEach(id => {
      const name = profiles[id] ? (profiles[id].name || id) : id;
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      let lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].text : 'Tap to chat';
      if (lastMsg.startsWith('data:image')) lastMsg = '📷 Photo';
      
      const chatHtml = \`
        <div onclick="openChatFromHidden('\\\${id}')" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer;">
          <div style="width:50px; height:50px; border-radius:50%; background:var(--primary); color:black; display:flex; justify-content:center; align-items:center; font-size:20px; font-weight:bold;">🕵️‍♂️</div>
          <div style="flex:1; overflow:hidden;">
            <div style="font-weight:bold; color:var(--text);">\\\${name}</div>
            <div style="font-size:13px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\\\${lastMsg}</div>
          </div>
        </div>
      \`;
      container.insertAdjacentHTML('beforeend', chatHtml);
    });
  }

  function openChatFromHidden(id) {
    closeHiddenChatsView();
    openChat(id);
  }
  `;
    html = html.replace('</script>\n</body>', loadLogic + '\n</script>\n</body>');
}

fs.writeFileSync('index.html', html);
console.log("✅ Secret Mode and PIN logic fixed!");
