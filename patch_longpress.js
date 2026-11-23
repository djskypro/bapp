const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add long-press events to the chat list HTML (Line 2380)
const oldChatHtml = `<div class="chat-item" id="item-\${id}" onclick="openChat('\${id}')">`;
const newChatHtml = `<div class="chat-item" id="item-\${id}" onclick="openChat('\${id}')" oncontextmenu="event.preventDefault(); openChatListMenu('\${id}');" ontouchstart="startChatHold(event, '\${id}')" ontouchend="cancelChatHold()" ontouchmove="cancelChatHold()">`;

if (html.includes(oldChatHtml)) {
    html = html.replace(oldChatHtml, newChatHtml);
}

// 2. Inject the Chat List Menu HTML right before </body>
const chatListMenuHTML = `
<!-- CHAT LIST LONG PRESS MENU -->
<div id="chat-list-menu" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); backdrop-filter: blur(10px); z-index:999999; flex-direction:column; justify-content:flex-end;">
  <div class="glass" style="width:100%; border-radius: 25px 25px 0 0; padding: 25px; padding-bottom: 40px; display:flex; flex-direction:column; gap: 15px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <h3 style="font-size:18px;" id="chat-list-menu-title">Chat Options</h3>
      <span onclick="closeChatListMenu()" style="font-size:24px; cursor:pointer;">✕</span>
    </div>

    <div onclick="deleteChatFromList()" style="display:flex; align-items:center; gap:15px; padding:15px; background:rgba(231, 76, 60, 0.2); border-radius:15px; cursor:pointer;">
      <span style="font-size:20px;">❌</span>
      <span style="font-size:16px; font-weight:500; color:#e74c3c;">Delete Chat</span>
    </div>

    <div onclick="blockUserFromList()" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer;">
      <span style="font-size:20px;">🚫</span>
      <span style="font-size:16px; font-weight:500;">Block User</span>
    </div>
  </div>
</div>
</body>`;

if (!html.includes('id="chat-list-menu"')) {
    html = html.replace('</body>', chatListMenuHTML);
}

// 3. Inject the JavaScript Logic at the end of the script
const logicJS = `
  // --- LONG PRESS LOGIC FOR CHAT LIST ---
  let chatHoldTimer;
  let currentSelectedChatId = null;

  function startChatHold(event, id) {
      currentSelectedChatId = id;
      chatHoldTimer = setTimeout(() => {
          if(navigator.vibrate) navigator.vibrate(50);
          openChatListMenu(id);
      }, 600); // 600ms hold
  }

  function cancelChatHold() {
      clearTimeout(chatHoldTimer);
  }

  function openChatListMenu(id) {
      currentSelectedChatId = id;
      let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
      let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
      let name = id.startsWith('group_') ? (groups[id] ? groups[id].name : id) : (profiles[id] ? (profiles[id].name || id) : id);
      
      document.getElementById('chat-list-menu-title').innerText = "Chat Options: " + name;
      document.getElementById('chat-list-menu').style.display = 'flex';
  }

  function closeChatListMenu() {
      document.getElementById('chat-list-menu').style.display = 'none';
      currentSelectedChatId = null;
  }

  function deleteChatFromList() {
      if (!currentSelectedChatId) return;
      if (confirm("Delete this chat? This will remove it from your list.")) {
          localStorage.removeItem('bapp_msgs_' + currentSelectedChatId);
          let chats = getChats();
          chats = chats.filter(id => id !== currentSelectedChatId);
          localStorage.setItem('bapp_chats', JSON.stringify(chats));
          closeChatListMenu();
          loadChatList();
          if(typeof showToast === 'function') showToast("Chat deleted!");
      }
  }

  function blockUserFromList() {
      if (!currentSelectedChatId) return;
      if (confirm("Block this user? You will no longer receive messages from them.")) {
          let blocked = JSON.parse(localStorage.getItem('bapp_blocked')) || [];
          if(!blocked.includes(currentSelectedChatId)) {
              blocked.push(currentSelectedChatId);
              localStorage.setItem('bapp_blocked', JSON.stringify(blocked));
          }
          closeChatListMenu();
          if(typeof showToast === 'function') showToast("User blocked!");
      }
  }

  // --- FIX THE 3-DOT MENU DELETE LOGIC ---
  function deleteCurrentChat() {
      if (!activeChatId) return;
      if (confirm("Delete this entire chat? This will remove it from your list.")) {
          localStorage.removeItem('bapp_msgs_' + activeChatId);
          let chats = getChats();
          chats = chats.filter(id => id !== activeChatId);
          localStorage.setItem('bapp_chats', JSON.stringify(chats));
          if(typeof closeChatMenu === 'function') closeChatMenu();
          if(typeof loadChatList === 'function') loadChatList();
          if(typeof goBack === 'function') goBack();
          if(typeof showToast === 'function') showToast("Chat deleted!");
      }
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if (lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + logicJS + html.substring(lastScriptIdx);
}

fs.writeFileSync('index.html', html);
console.log('✅ Long-press, Delete, and Block logic successfully added!');
