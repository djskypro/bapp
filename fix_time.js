const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the start and end of the loadChatList function
const startIndex = html.indexOf('function loadChatList() {');
const endIndex = html.indexOf('function updateGlobalBadge() {');

const newLoadChatList = `
  function loadChatList() {
    const chatList = document.getElementById('chat-list-container');
    chatList.innerHTML = ''; 
    const chats = getChats();
    const unreads = getUnreads();
    
    chats.forEach(id => {
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      
      let lastMsgText = 'Tap to chat';
      let lastMsgTime = '';
      
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        lastMsgText = last.text;
        lastMsgTime = last.time || ''; // Get the exact time saved
      }
      
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      
      const unreadCount = unreads[id] || 0;
      const badgeHtml = unreadCount > 0 ? \`<div class="badge">\${unreadCount}</div>\` : '';
      const timeClass = unreadCount > 0 ? 'chat-time unread' : 'chat-time';

      const chatHtml = \`
        <div class="chat-item" id="item-\${id}" onclick="openChat('\${id}', '\${avatarUrl}')">
          <img src="\${avatarUrl}" class="avatar">
          <div class="chat-info">
            <div class="chat-top">
              <div class="chat-name">\${id}</div>
              <div class="\${timeClass}">\${lastMsgTime}</div>
            </div>
            <div class="chat-bottom">
              <div class="chat-msg" id="preview-\${id}">\${lastMsgText}</div>
              \${badgeHtml}
            </div>
          </div>
        </div>
      \`;
      chatList.insertAdjacentHTML('beforeend', chatHtml);
    });
    updateGlobalBadge();
  }

  `;

html = html.substring(0, startIndex) + newLoadChatList + html.substring(endIndex);

// Also, ensure that when you send a message, it instantly updates the time in the list
const oldSend = `document.getElementById('preview-' + to).innerText = text;`;
const newSend = `document.getElementById('preview-' + to).innerText = text;
      loadChatList(); // Instantly refresh the list to show the new time`;
html = html.replace(oldSend, newSend);

fs.writeFileSync('index.html', html);
console.log('Time and "Now" bug fixed!');
