const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a variable to track the actively opened chat
html = html.replace("let myBappId = sessionStorage.getItem('bappId');", "let myBappId = sessionStorage.getItem('bappId');\n  let activeChatId = null;");

// 2. Fix the hardcoded "Now" and pull the actual message time
const oldListLogic = `const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].text : 'Tap to chat';
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      
      const unreadCount = unreads[id] || 0;
      const badgeHtml = unreadCount > 0 ? \`<div class="badge">\${unreadCount}</div>\` : '';
      const timeHtml = unreadCount > 0 ? \`<div class="chat-time unread">Now</div>\` : \`<div class="chat-time">Now</div>\`;`;

const newListLogic = `const lastMsgObj = msgs.length > 0 ? msgs[msgs.length - 1] : {text: 'Tap to chat', time: ''};
      const lastMsg = lastMsgObj.text;
      const msgTime = lastMsgObj.time || '';
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      
      const unreadCount = unreads[id] || 0;
      const badgeHtml = unreadCount > 0 ? \`<div class="badge">\${unreadCount}</div>\` : '';
      const timeHtml = unreadCount > 0 ? \`<div class="chat-time unread">\${msgTime}</div>\` : \`<div class="chat-time">\${msgTime}</div>\`;`;
html = html.replace(oldListLogic, newListLogic);

// 3. Set activeChatId when opening a chat
html = html.replace("document.getElementById('chat-name').textContent = id.trim();", "document.getElementById('chat-name').textContent = id.trim();\n    activeChatId = id;");

// 4. Clear activeChatId when going back to the home screen
html = html.replace("function goBack() {", "function goBack() {\n    activeChatId = null;");

// 5. Fix the incoming message check to use activeChatId instead of the hidden chat name
const oldIncoming = `const currentChatName = document.getElementById('chat-name').textContent.trim();
      const senderId = (data.from || '').trim();
      
      if (currentChatName === senderId) {
        appendMessage(data.text, 'received', now);
      } else {`;

const newIncoming = `const senderId = (data.from || '').trim();
      
      if (activeChatId === senderId) {
        appendMessage(data.text, 'received', now);
      } else {`;
html = html.replace(oldIncoming, newIncoming);

fs.writeFileSync('index.html', html);
console.log('Timestamps and Unread logic fixed!');
