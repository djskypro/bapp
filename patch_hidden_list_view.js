const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the broken openHiddenChatsFromSearch function
const oldFuncRegex = /function openHiddenChatsFromSearch\(\) \{[\s\S]*?openChat\(chatIds\[0\]\);\s*\}\s*\}/;
const newFunc = `function openHiddenChatsFromSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('clear-search').style.display = 'none';
    document.getElementById('search-blur-overlay').style.display = 'none';
    
    // Open the new Hidden Chats view
    openHiddenChatsView();
  }`;
html = html.replace(oldFuncRegex, newFunc);

// 2. Add the Hidden Chats View HTML right before </body>
const hiddenView = `
<!-- HIDDEN CHATS VIEW -->
<div id="hidden-chats-view" class="view" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:var(--bg); z-index:9999999; flex-direction:column;">
  <div class="header" style="padding-top: 40px;">
    <div style="display:flex; align-items:center; gap:15px; padding: 0 20px;">
      <div class="back-btn" onclick="closeHiddenChatsView()" style="cursor:pointer;">←</div>
      <h1 style="margin:0;">Hidden Chats</h1>
    </div>
  </div>
  <div id="hidden-chat-list-container" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:10px;">
    <!-- Hidden chats will be injected here -->
  </div>
</div>
`;
html = html.replace('</body>', hiddenView + '</body>');

// 3. Add the logic to open, close, and load the hidden chats
const hiddenLogic = `
<script>
  function openHiddenChatsView() {
    document.getElementById('hidden-chats-view').style.display = 'flex';
    loadHiddenChatsList();
  }

  function closeHiddenChatsView() {
    document.getElementById('hidden-chats-view').style.display = 'none';
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
</script>
`;
html = html.replace('</body>', hiddenLogic + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Hidden Chats View added successfully!");
