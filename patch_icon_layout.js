const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update Island 2 (Profile): Add the audio icon to the far right
// We change the flex layout so the text takes up available space, pushing the icon right.
const oldIsland2 = `
    <div class="profile-island glass-island" onclick="openContactInfo()">
      <img src="" id="chat-avatar" class="avatar">
      <div>
        <div class="name" id="chat-name"></div>
        <div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>
      </div>
    </div>`;

const newIsland2 = `
    <div class="profile-island glass-island" onclick="openContactInfo()" style="display:flex; align-items:center; width:100%;">
      <img src="" id="chat-avatar" class="avatar">
      <div style="flex:1; overflow:hidden;">
        <div class="name" id="chat-name"></div>
        <div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>
      </div>
      <span onclick="event.stopPropagation(); startCall('audio')" style="cursor:pointer; font-size:20px; margin-right:15px;">📞</span>
    </div>`;
html = html.replace(oldIsland2, newIsland2);

// 2. Update Island 3 (Right menu): Keep only video and 3 dots
const oldIsland3 = `
    <div class="header-action-icons glass-island">
      <span onclick="startCall('video')" style="cursor:pointer;">📹</span>
      <span onclick="startCall('audio')" style="cursor:pointer;">📞</span>
      <span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>`;

const newIsland3 = `
    <div class="header-action-icons glass-island">
      <span onclick="startCall('video')" style="cursor:pointer;">📹</span>
      <span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>`;
html = html.replace(oldIsland3, newIsland3);

fs.writeFileSync('index.html', html);
console.log("✅ Icons rearranged!");
