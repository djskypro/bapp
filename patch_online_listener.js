const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldHandler = `      if (data.type === 'new_message') {`;
const newHandler = `      // --- ONLINE STATUS ---
      if (data.type === 'online_users') {
        window.onlineUsers = data.users || [];
        // Update the rings on the current chat list
        document.querySelectorAll('.avatar-wrapper').forEach(wrapper => {
          const id = wrapper.getAttribute('data-user-id');
          const ring = wrapper.querySelector('.online-ring');
          if (ring) {
            ring.style.display = window.onlineUsers.includes(id) ? 'block' : 'none';
          }
        });
      }

      if (data.type === 'new_message') {`;

html = html.replace(oldHandler, newHandler);

// Also update loadChatList to use the online users list for rendering
const oldAvatarHtml = `          <div class="avatar-wrapper">
            <img src="\${avatarUrl}" class="avatar">
            <div class="online-ring"></div>
          </div>`;
const newAvatarHtml = `          <div class="avatar-wrapper" data-user-id="\${id}">
            <img src="\${avatarUrl}" class="avatar">
            <div class="online-ring" style="display: \${window.onlineUsers && window.onlineUsers.includes(id) ? 'block' : 'none'};"></div>
          </div>`;

html = html.replace(oldAvatarHtml, newAvatarHtml);

fs.writeFileSync('index.html', html);
console.log("✅ Online listener and dynamic rings added!");
