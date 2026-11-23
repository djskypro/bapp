const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Glass Island CSS
const islandCSS = `
<style>
  /* 3 ISLANDS HEADER */
  .chat-header {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    display: flex !important;
    justify-content: space-between !important;
    gap: 10px !important;
    padding: 0 !important;
  }

  .glass-island {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(25px) !important;
    -webkit-backdrop-filter: blur(25px) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 25px !important; /* Curved edges */
    box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Specific adjustments for each island */
  .back-btn {
    width: 42px !important;
    height: 42px !important;
    margin: 0 !important;
    flex-shrink: 0;
  }

  .profile-island {
    flex: 1;
    padding: 5px 15px 5px 5px;
    gap: 10px;
    cursor: pointer;
  }

  .profile-island .avatar {
    margin: 0 !important;
  }

  .header-action-icons {
    padding: 0 15px;
    gap: 15px !important;
    margin: 0 !important;
    flex-shrink: 0;
  }
</style>
</head>
`;
html = html.replace('</head>', islandCSS);

// 2. Replace the Header HTML to use the 3 islands
const oldHeader = `<div class="chat-header">
    <div class="back-btn" onclick="goBack()">←</div>
    <div style="display:flex; align-items:center; flex:1; cursor:pointer;" onclick="openContactInfo()">
      <img src="" id="chat-avatar" class="avatar">
      <div>
        <div class="name" id="chat-name"></div>
        <div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>
      </div>
    </div>
    <div class="header-action-icons">
      <span onclick="startCall('video')" style="cursor:pointer;">📹</span>
      <span onclick="startCall('audio')" style="cursor:pointer;">📞</span>
      <span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>
  </div>`;

const newHeader = `<div class="chat-header">
    <!-- ISLAND 1: BACK BUTTON -->
    <div class="back-btn glass-island" onclick="goBack()">←</div>
    
    <!-- ISLAND 2: PROFILE, NAME, TYPING -->
    <div class="profile-island glass-island" onclick="openContactInfo()">
      <img src="" id="chat-avatar" class="avatar">
      <div>
        <div class="name" id="chat-name"></div>
        <div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>
      </div>
    </div>
    
    <!-- ISLAND 3: CALLS & MENU -->
    <div class="header-action-icons glass-island">
      <span onclick="startCall('video')" style="cursor:pointer;">📹</span>
      <span onclick="startCall('audio')" style="cursor:pointer;">📞</span>
      <span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>
  </div>`;

if (html.includes(oldHeader)) {
    html = html.replace(oldHeader, newHeader);
    fs.writeFileSync('index.html', html);
    console.log('✅ 3 Floating Glass Islands created!');
} else {
    console.log('❌ Could not find the exact header HTML block.');
}
