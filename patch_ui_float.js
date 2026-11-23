const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. ADD THE UI FIX CSS
const uiFixCSS = `
<style>
  /* 1. FLOATING INPUT BAR (Detached from edges, curved, middle) */
  .chat-input-area {
    position: absolute !important;
    bottom: max(20px, env(safe-area-inset-bottom)) !important;
    left: 25px !important;
    right: 25px !important;
    width: auto !important;
    border-radius: 30px !important; /* Curved edges */
    padding: 10px 15px !important;
    background: var(--glass-bg) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4) !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    z-index: 1000 !important;
  }

  /* Ensure the input field inside is also curved */
  .chat-input-area input[type="text"] {
    border-radius: 20px !important;
    background: transparent !important;
    padding: 10px !important;
  }

  /* 2. SPREAD OUT HEADER ICONS */
  .header-action-icons {
    display: flex !important;
    gap: 25px !important; /* Spreads them out */
    font-size: 22px !important;
    color: var(--primary) !important;
    margin-right: 15px !important;
    align-items: center !important;
  }

  /* 3. PUSH MESSAGES UP SO THEY DON'T HIDE BEHIND FLOATING BAR */
  .messages {
    padding-bottom: 100px !important;
  }
</style>
</head>
`;
html = html.replace('</head>', uiFixCSS);

// 2. UPDATE THE HEADER HTML TO USE THE NEW CLASS AND FORCE THE CLICK EVENT
// (Based on the exact HTML you showed earlier)
const oldHeaderIcons = `<div style="display:flex; gap:15px; font-size:22px; color:var(--primary); margin-right:10px;">
      <span onclick="startCall('video')">📹</span>
      <span onclick="startCall('audio')">📞</span>
      <span id="three-dot-btn" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>`;

const newHeaderIcons = `<div class="header-action-icons">
      <span onclick="startCall('video')" style="cursor:pointer;">📹</span>
      <span onclick="startCall('audio')" style="cursor:pointer;">📞</span>
      <span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>`;

html = html.replace(oldHeaderIcons, newHeaderIcons);

// Fallback if the exact string doesn't match
html = html.replace(
    `<span id="three-dot-btn" style="font-weight:bold; cursor:pointer;">⋮</span>`,
    `<span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>`
);

// 3. ENSURE THE MENU FUNCTIONS ARE GLOBAL AND SAFE
const menuJS = `
  // --- GLOBAL MENU FUNCTIONS ---
  window.openChatMenu = function() {
    const menu = document.getElementById('chat-options-menu');
    if (menu) {
        menu.style.display = 'flex';
    } else {
        alert("Menu HTML not found!");
    }
  };
  
  window.closeChatMenu = function() {
    const menu = document.getElementById('chat-options-menu');
    if (menu) menu.style.display = 'none';
  };
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + menuJS + html.substring(lastScriptIdx);
}

fs.writeFileSync('index.html', html);
console.log('✅ UI Fixed (floating input, spread icons) and Menu Button forced!');
