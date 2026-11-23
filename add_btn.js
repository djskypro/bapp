const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add onclick to the + button
html = html.replace(
  '<div class="icon-btn green" style="background: var(--primary); color: black;">+</div>',
  '<div class="icon-btn green" style="background: var(--primary); color: black;" onclick="startNewChat()">+</div>'
);

// 2. Add the startNewChat function inside the script tag
const newChatLogic = `
  // --- START NEW CHAT ---
  function startNewChat() {
    const targetId = prompt("Enter BAPP ID (e.g., user_123) or WhatsApp number:");
    if (targetId && targetId.trim() !== "") {
      const cleanId = targetId.trim();
      const avatarUrl = 'https://ui-avatars.com/api/?name=' + cleanId.substring(0,2) + '&background=random';
      
      // Create a new chat item in the list
      const chatList = document.querySelector('.chat-list');
      const newChatHtml = \`
        <div class="chat-item" onclick="openChat('\${cleanId}', '\${avatarUrl}')">
          <img src="\${avatarUrl}" class="avatar">
          <div class="chat-info">
            <div class="chat-top">
              <div class="chat-name">\${cleanId}</div>
              <div class="chat-time">Just now</div>
            </div>
            <div class="chat-bottom">
              <div class="chat-msg">Tap to chat</div>
            </div>
          </div>
        </div>
      \`;
      
      // Insert at the top of the list
      chatList.insertAdjacentHTML('afterbegin', newChatHtml);
      
      // Open the chat immediately
      openChat(cleanId, avatarUrl);
    }
  }
`;

// Inject the logic right before the WebSocket connection
html = html.replace('const socket = new WebSocket', newChatLogic + '\n  const socket = new WebSocket');
fs.writeFileSync('index.html', html);
console.log('New Chat button added!');
