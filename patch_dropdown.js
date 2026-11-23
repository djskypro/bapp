const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the entire chat-options-menu HTML block
const oldMenuRegex = /<div id="chat-options-menu"[\s\S]*?<div onclick="clearCurrentChat\(\)"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newMenuHTML = `
<div id="chat-options-menu" onclick="if(event.target===this) closeChatMenu()" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:99999; background:rgba(0,0,0,0.3); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
  <div id="chat-menu-drawer" class="glass" style="position:absolute; top:65px; right:20px; width:220px; border-radius:20px; padding:10px; display:flex; flex-direction:column; gap:5px; box-shadow:0 10px 30px rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1);">
    
    <div onclick="openSharedListening()" style="display:flex; align-items:center; gap:15px; padding:12px 15px; border-radius:12px; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
      <span style="font-size:18px;">🎵</span>
      <span style="font-size:14px; font-weight:500;">Shared Listening</span>
    </div>
    
    <div onclick="clearCurrentChat()" style="display:flex; align-items:center; gap:15px; padding:12px 15px; border-radius:12px; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
      <span style="font-size:18px;">🗑️</span>
      <span style="font-size:14px; font-weight:500;">Clear Chat</span>
    </div>
    
    <div onclick="deleteCurrentChat()" style="display:flex; align-items:center; gap:15px; padding:12px 15px; border-radius:12px; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='rgba(231, 76, 60, 0.2)'" onmouseout="this.style.background='transparent'">
      <span style="font-size:18px;">❌</span>
      <span style="font-size:14px; font-weight:500; color:#e74c3c;">Delete Chat</span>
    </div>

  </div>
</div>`;
html = html.replace(oldMenuRegex, newMenuHTML);

// 2. Update the open/close functions to be simple toggles
const oldOpenMenu = /function openChatMenu\(\) \{[\s\S]*?\}/;
const newOpenMenu = `function openChatMenu() {
    document.getElementById('chat-options-menu').style.display = 'block';
  }`;
html = html.replace(oldOpenMenu, newOpenMenu);

const oldCloseMenu = /function closeChatMenu\(\) \{[\s\S]*?\}/;
const newCloseMenu = `function closeChatMenu() {
    document.getElementById('chat-options-menu').style.display = 'none';
  }`;
html = html.replace(oldCloseMenu, newCloseMenu);

fs.writeFileSync('index.html', html);
console.log("✅ Floating blurred dropdown applied!");
