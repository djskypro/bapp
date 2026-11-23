const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. ADD THE 3-DOT ICON TO THE CHAT HEADER
// ==========================================
// We target the exact call icons from your output
const oldIcons = `<span onclick="startCall('video')">📹</span>
      <span onclick="startCall('audio')">📞</span>
    </div>`;
const newIcons = `<span onclick="startCall('video')">📹</span>
      <span onclick="startCall('audio')">📞</span>
      <span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>`;
html = html.replace(oldIcons, newIcons);

// ==========================================
// 2. ADD THE MENU HTML BEFORE </body>
// ==========================================
const menuHTML = `
<div id="chat-options-menu" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); z-index:99999; flex-direction:column; justify-content:flex-end;">
  <div class="glass" style="width:100%; border-radius: 25px 25px 0 0; padding: 25px; padding-bottom: 40px; display:flex; flex-direction:column; gap: 15px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <h3 style="font-size:18px;">Chat Options</h3>
      <span onclick="closeChatMenu()" style="font-size:24px; cursor:pointer;">✕</span>
    </div>
    
    <!-- Options -->
    <div onclick="clearCurrentChat()" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer;">
      <span style="font-size:20px;">🗑️</span>
      <span style="font-size:16px; font-weight:500;">Clear Chat</span>
    </div>
    
    <div onclick="document.getElementById('wallpaper-input').click()" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer;">
      <span style="font-size:20px;">🖼️</span>
      <span style="font-size:16px; font-weight:500;">Change Wallpaper</span>
      <input type="file" id="wallpaper-input" accept="image/*" style="display:none;" onchange="changeWallpaper(event)">
    </div>

    <div onclick="promptChatColor()" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer;">
      <span style="font-size:20px;">🎨</span>
      <span style="font-size:16px; font-weight:500;">Change Chat Color</span>
    </div>
  </div>
</div>
</body>`;
html = html.replace('</body>', menuHTML);

// ==========================================
// 3. ADD THE JAVASCRIPT LOGIC
// ==========================================
const menuJS = `
  // --- CHAT OPTIONS MENU LOGIC ---
  function openChatMenu() {
    document.getElementById('chat-options-menu').style.display = 'flex';
  }
  
  function closeChatMenu() {
    document.getElementById('chat-options-menu').style.display = 'none';
  }

  function clearCurrentChat() {
    if(confirm("Delete all messages in this chat? This cannot be undone.")) {
      localStorage.removeItem('bapp_msgs_' + activeChatId);
      document.getElementById('chat-messages').innerHTML = '';
      loadChatList();
      closeChatMenu();
    }
  }

  function changeWallpaper(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      localStorage.setItem('bapp_wallpaper_' + activeChatId, base64);
      applyWallpaper(base64);
      closeChatMenu();
    };
    reader.readAsDataURL(file);
  }

  function applyWallpaper(base64) {
    const msgBox = document.getElementById('chat-messages');
    if (base64) {
      msgBox.style.backgroundImage = \`url(\${base64})\`;
      msgBox.style.backgroundSize = 'cover';
      msgBox.style.backgroundPosition = 'center';
    } else {
      msgBox.style.backgroundImage = 'none';
    }
  }

  function promptChatColor() {
    const color = prompt("Enter a Hex color code (e.g., #ff0000 for red, #000000 for black):", "#005c4b");
    if (color) {
      localStorage.setItem('bapp_chat_color_' + activeChatId, color);
      alert("Chat color saved! New messages will use this color.");
      closeChatMenu();
    }
  }

  // Override openChat to apply the saved wallpaper when opening a chat
  const originalOpenChatMenu = window.openChat;
  window.openChat = function(id, profileObj) {
    originalOpenChatMenu(id, profileObj);
    
    // Apply wallpaper
    const savedWallpaper = localStorage.getItem('bapp_wallpaper_' + id);
    applyWallpaper(savedWallpaper);
  };
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + menuJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ 3-Dot Chat Menu with Wallpaper & Clear Chat added!');
} else {
    console.log('❌ Could not find script tag.');
}
