const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update socket.onmessage to use the new updateChatList instead of alert()
const oldReceive = `if (data.type === 'new_message') {
      // SAVE INCOMING TO LOCAL STORAGE
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_chat_' + data.from)) || [];
      savedMsgs.push({ text: data.text, type: 'received' });
      localStorage.setItem('bapp_chat_' + data.from, JSON.stringify(savedMsgs));

      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName === data.from) {
        appendMessage(data.text, 'received');
      } else {
        alert("New BAPP message from " + data.from + ": " + data.text);
      }
    }`;

const newReceive = `if (data.type === 'new_message') {
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_chat_' + data.from)) || [];
      savedMsgs.push({ text: data.text, type: 'received' });
      localStorage.setItem('bapp_chat_' + data.from, JSON.stringify(savedMsgs));

      // Update the chat list UI
      updateChatList(data.from, data.text, true);

      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName === data.from) {
        appendMessage(data.text, 'received');
      }
    }`;
html = html.replace(oldReceive, newReceive);

// 2. Add the updateChatList function
const newFuncs = `
  function updateChatList(id, text, isUnread) {
    const chatList = document.querySelector('.chat-list');
    let exists = false;
    let existingItem = null;
    const items = chatList.querySelectorAll('.chat-item');
    
    for (let item of items) {
      if (item.querySelector('.chat-name').innerText === id) {
        exists = true;
        existingItem = item;
        break;
      }
    }

    const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';

    if (exists) {
      existingItem.querySelector('.chat-msg').innerText = text;
      if (isUnread) {
          let badge = existingItem.querySelector('.badge');
          if(!badge) {
              badge = document.createElement('div');
              badge.className = 'badge';
              badge.innerText = '1';
              existingItem.querySelector('.chat-bottom').appendChild(badge);
          } else {
              badge.innerText = parseInt(badge.innerText) + 1;
          }
      }
    } else {
      const newChatHtml = \`
        <div class="chat-item" onclick="openChat('\${id}', '\${avatarUrl}')">
          <img src="\${avatarUrl}" class="avatar">
          <div class="chat-info">
            <div class="chat-top">
              <div class="chat-name">\${id}</div>
              <div class="chat-time unread">Just now</div>
            </div>
            <div class="chat-bottom">
              <div class="chat-msg">\${text}</div>
              \${isUnread ? '<div class="badge">1</div>' : ''}
            </div>
          </div>
        </div>
      \`;
      chatList.insertAdjacentHTML('afterbegin', newChatHtml);
    }
  }
`;
html = html.replace('function appendMessage(text, type, save = true) {', newFuncs + '\n  function appendMessage(text, type, save = true) {');

// 3. Clear badges when opening a chat
const clearBadgeLogic = `
    const chatList = document.querySelector('.chat-list');
    const items = chatList.querySelectorAll('.chat-item');
    for (let item of items) {
        if (item.querySelector('.chat-name').innerText === name) {
            const badge = item.querySelector('.badge');
            if(badge) badge.remove();
            break;
        }
    }
`;
html = html.replace("setTimeout(() => document.getElementById('chat-input').focus(), 300);", clearBadgeLogic + "\n    setTimeout(() => document.getElementById('chat-input').focus(), 300);");

// 4. Update list when YOU send a message
const updateOnSend = `
      updateChatList(to, text, false);
`;
html = html.replace("appendMessage(text, 'sent');", "appendMessage(text, 'sent');\n" + updateOnSend);

fs.writeFileSync('index.html', html);
console.log('Chat list is now live and functional!');
